/**
 * ============================================================================
 * FILE: js/geo.js - Modul Geolocation & Geofencing Presensi Vihara Amurwa Bhumi
 * ============================================================================
 * Vihara Amurwa Bhumi Cibinong
 * Berfungsi untuk membatasi presensi mandiri umat hanya di area Vihara
 * menggunakan HTML5 Geolocation API dan Haversine Great-Circle Distance Formula.
 * ============================================================================
 */

const ViharaGeo = (() => {
  // Koordinat Titik Pusat Geofence (Murni Menggunakan Latitude, Longitude, & Radius)
  // Titik acuan: Latitude -6.467433, Longitude 106.853755
  const DEFAULT_CONFIG = {
    latitude: -6.467433,
    longitude: 106.853755,
    radiusMeters: 25 // Batas toleransi radius presensi: 25 meter
  };

  const STORAGE_KEY = 'vihara_geo_config';

  // Bersihkan sisa flag bypass uji coba jika sebelumnya pernah tersimpan
  try {
    localStorage.removeItem('vihara_dev_location_bypass');
  } catch (_) {}

  // 1. Ambil Konfigurasi Murni Koordinat (Latitude, Longitude, Radius)
  function getConfig() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && typeof parsed.latitude === 'number' && typeof parsed.longitude === 'number') {
          return {
            latitude: Number(parsed.latitude),
            longitude: Number(parsed.longitude),
            radiusMeters: Number(parsed.radiusMeters || DEFAULT_CONFIG.radiusMeters)
          };
        }
      }
    } catch (e) {
      console.warn('[ViharaGeo] Gagal membaca konfigurasi geo lokal:', e);
    }
    return { ...DEFAULT_CONFIG };
  }

  // 2. Simpan Pembaruan Koordinat & Radius (Murni Numerik)
  async function saveConfig({ latitude, longitude, radiusMeters }) {
    const updated = {
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
      radiusMeters: Math.max(5, parseInt(radiusMeters, 10) || DEFAULT_CONFIG.radiusMeters),
      updatedAt: new Date().toISOString()
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

    // Sinkronkan ke tabel configurations di Supabase jika tersedia
    if (typeof ViharaSupabase !== 'undefined' && typeof ViharaSupabase.updateConfiguration === 'function') {
      try {
        await ViharaSupabase.updateConfiguration(
          'vihara_geo_config',
          JSON.stringify(updated),
          'Koordinat Latitude, Longitude, dan Radius Presensi Vihara'
        );
      } catch (err) {
        console.warn('[ViharaGeo] Gagal sinkronisasi geo config ke Supabase:', err);
      }
    }

    return updated;
  }

  // 3. Perhitungan Jarak Dua Koordinat Menggunakan Rumus Haversine (Hasil dalam Meter)
  // Rumus matematika: d = 2R * asin(sqrt(sin^2(dlat/2) + cos(lat1)*cos(lat2)*sin^2(dlon/2)))
  function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371000; // Radius rata-rata bumi dalam satuan meter
    const toRad = deg => (deg * Math.PI) / 180;

    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const rLat1 = toRad(lat1);
    const rLat2 = toRad(lat2);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(rLat1) * Math.cos(rLat2) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c);
  }

  // 5. Format Tampilan Jarak yang Ramah Pengguna
  function formatDistance(meters) {
    if (isNaN(meters) || meters === null || meters === undefined) return '-';
    if (meters < 1000) {
      return `${meters} meter`;
    }
    return `${(meters / 1000).toFixed(2)} km`;
  }

  // Helper internal: Bungkus navigator.geolocation.getCurrentPosition ke Promise
  function _queryBrowserPosition(opts) {
    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        pos => {
          resolve({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            accuracy: Math.round(pos.coords.accuracy || 0),
            timestamp: pos.timestamp
          });
        },
        err => reject(err),
        opts
      );
    });
  }

  // 5. Dapatkan Posisi GPS Perangkat Pengguna dengan Mekanisme 2-Stage Fallback
  // Tahap 1: Coba GPS presisi tinggi (enableHighAccuracy: true, timeout 7 detik).
  // Tahap 2: Jika sinyal satelit lemah/timeout/di PC desktop, otomatis fallback ke Wi-Fi / Jaringan Seluler (enableHighAccuracy: false).
  async function getCurrentPosition(customOptions = {}) {
    if (!('geolocation' in navigator)) {
      throw new Error('Perangkat atau browser Anda tidak mendukung fitur lokasi (Geolocation GPS).');
    }

    // Opsi Tahap 1: Presisi Tinggi (GPS Satelit Hardware)
    const highAccuracyOpts = {
      enableHighAccuracy: true,
      timeout: 7000,
      maximumAge: 0,
      ...customOptions
    };

    try {
      return await _queryBrowserPosition(highAccuracyOpts);
    } catch (firstErr) {
      const code = Number(firstErr && firstErr.code);

      // JIKA IZIN DITOLAK (Code 1 = PERMISSION_DENIED):
      // Jangan retry, karena browser secara mutlak memblokir akses lokasi.
      if (code === 1) {
        const permErr = new Error('Izin lokasi (GPS) ditolak atau diblokir oleh browser. Harap aktifkan izin lokasi di setelan browser Anda.');
        permErr.code = 1;
        throw permErr;
      }

      // Jika error karena TIMEOUT (3) atau POSITION_UNAVAILABLE (2), coba Tahap 2 (Fallback Jaringan / Wi-Fi)
      console.info('[ViharaGeo] GPS satelit belum terkunci, mencoba fallback jaringan Wi-Fi/Seluler...');
      const fallbackOpts = {
        enableHighAccuracy: false,
        timeout: 10000,
        maximumAge: 30000,
        ...customOptions
      };

      try {
        return await _queryBrowserPosition(fallbackOpts);
      } catch (secondErr) {
        const finalCode = Number(secondErr && secondErr.code);
        let errorMessage = 'Gagal mendeteksi lokasi GPS.';

        switch (finalCode) {
          case 1:
            errorMessage = 'Izin lokasi (GPS) ditolak atau diblokir oleh browser. Harap izinkan akses lokasi pada browser Anda.';
            break;
          case 2:
            errorMessage = 'Informasi lokasi tidak tersedia pada perangkat Anda. Pastikan fitur Lokasi / GPS perangkat dalam status aktif.';
            break;
          case 3:
            errorMessage = 'Waktu pencarian sinyal lokasi habis (Timeout). Pastikan koneksi internet stabil atau berada di area dengan sinyal baik.';
            break;
          default:
            errorMessage = `Kendala lokasi: ${secondErr.message || 'Error GPS'}.`;
            break;
        }

        const err = new Error(errorMessage);
        err.code = finalCode;
        throw err;
      }
    }
  }

  // 6. Evaluasi Apakah Posisi Pengguna Berada dalam Radius Geofence Vihara (25 Meter)
  async function verifyCheckInDistance() {
    const config = getConfig();

    // Dapatkan koordinat fisik perangkat pengguna saat ini
    const userCoords = await getCurrentPosition();

    // Hitung jarak garis lurus bumi (Great-Circle Distance) menggunakan rumus Haversine
    const distance = calculateDistance(
      userCoords.latitude,
      userCoords.longitude,
      config.latitude,
      config.longitude
    );

    const isWithinRadius = distance <= config.radiusMeters;

    return {
      isWithinRadius: isWithinRadius,
      distance: distance,
      formattedDistance: formatDistance(distance),
      maxRadius: config.radiusMeters,
      userCoords: userCoords,
      targetCoords: config
    };
  }

  // 7. Sinkronisasi Data Konfigurasi Lokasi dari Supabase saat Aplikasi Dibuka
  async function initSync() {
    if (typeof ViharaSupabase !== 'undefined' && typeof ViharaSupabase.getConfiguration === 'function') {
      try {
        const remoteValue = await ViharaSupabase.getConfiguration('vihara_geo_config');
        if (remoteValue) {
          const parsed = typeof remoteValue === 'string' ? JSON.parse(remoteValue) : remoteValue;
          if (parsed && typeof parsed.latitude === 'number' && typeof parsed.longitude === 'number') {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
          }
        }
      } catch (e) {
        // Abaikan jika offline
      }
    }
  }

  return {
    DEFAULT_CONFIG,
    getConfig,
    saveConfig,
    calculateDistance,
    formatDistance,
    getCurrentPosition,
    verifyCheckInDistance,
    initSync
  };
})();

