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
  const BYPASS_KEY = 'vihara_dev_location_bypass';

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

  // 3. Status Mode Pengujian / Bypass Radius untuk Developer
  function isDevBypass() {
    return localStorage.getItem(BYPASS_KEY) === 'true';
  }

  function setDevBypass(enable) {
    if (enable) {
      localStorage.setItem(BYPASS_KEY, 'true');
    } else {
      localStorage.removeItem(BYPASS_KEY);
    }
  }

  // 4. Perhitungan Jarak Dua Koordinat Menggunakan Rumus Haversine (Hasil dalam Meter)
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

  // 6. Dapatkan Posisi GPS Perangkat Pengguna Saat Ini via HTML5 Geolocation API
  function getCurrentPosition(customOptions = {}) {
    return new Promise((resolve, reject) => {
      if (!('geolocation' in navigator)) {
        reject(new Error('Perangkat atau browser Anda tidak mendukung fitur lokasi (Geolocation GPS).'));
        return;
      }

      const options = {
        enableHighAccuracy: true, // Wajib aktif untuk presisi GPS tinggi
        timeout: 12000,           // Maksimal tunggu sinyal GPS 12 detik
        maximumAge: 0,            // Jangan gunakan cache lokasi lama
        ...customOptions
      };

      navigator.geolocation.getCurrentPosition(
        position => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: Math.round(position.coords.accuracy || 0),
            timestamp: position.timestamp
          });
        },
        error => {
          let errorMessage = 'Gagal mendeteksi lokasi GPS.';
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = 'Izin lokasi (GPS) ditolak oleh browser. Harap izinkan akses lokasi pada browser Anda agar dapat melakukan presensi.';
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = 'Informasi lokasi GPS tidak tersedia pada perangkat Anda. Pastikan GPS/Location aktif.';
              break;
            case error.TIMEOUT:
              errorMessage = 'Waktu deteksi GPS habis. Pastikan Anda berada di area terbuka dengan sinyal GPS baik lalu coba lagi.';
              break;
            default:
              errorMessage = `Terjadi kendala lokasi (${error.message || 'Error GPS'}).`;
              break;
          }
          const err = new Error(errorMessage);
          err.code = error.code;
          reject(err);
        },
        options
      );
    });
  }

  // 7. Evaluasi Apakah Posisi Pengguna Berada dalam Radius Geofence Vihara (25 Meter)
  async function verifyCheckInDistance() {
    const config = getConfig();
    const bypass = isDevBypass();

    const userCoords = await getCurrentPosition();
    const distance = calculateDistance(
      userCoords.latitude,
      userCoords.longitude,
      config.latitude,
      config.longitude
    );

    const isWithinRadius = distance <= config.radiusMeters;

    return {
      isWithinRadius: isWithinRadius || bypass,
      isBypass: bypass,
      distance: distance,
      formattedDistance: formatDistance(distance),
      maxRadius: config.radiusMeters,
      userCoords: userCoords,
      targetCoords: config
    };
  }

  // 8. Sinkronisasi Data Konfigurasi Lokasi dari Supabase saat Aplikasi Dibuka
  async function initSync() {
    if (typeof ViharaSupabase !== 'undefined' && typeof ViharaSupabase.getConfiguration === 'function') {
      try {
        const remoteValue = await ViharaSupabase.getConfiguration('vihara_geo_config');
        if (remoteValue) {
          const parsed = typeof remoteValue === 'string' ? JSON.parse(remoteValue) : remoteValue;
          if (parsed && parsed.latitude && parsed.longitude) {
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
    isDevBypass,
    setDevBypass,
    calculateDistance,
    formatDistance,
    getCurrentPosition,
    verifyCheckInDistance,
    initSync
  };
})();

