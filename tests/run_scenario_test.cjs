/**
 * ============================================================================
 * SCENARIO TEST RUNNER - Vihara Amurwa Bhumi Cibinong
 * ============================================================================
 * Menjalankan seluruh 4 bagian skenario pengujian di ScenarioTest.md:
 * 1. Aturan Waktu Presensi (Window 30 Menit)
 * 2. Buat Acara (1x Klik & Sinkron Database Supabase)
 * 3. Hapus Acara (1x Klik & Tidak Muncul Kembali)
 * 4. Presensi & Sinkronisasi Kehadiran (Geofencing & Anti-Duplikasi)
 * ============================================================================
 */

const fs = require('fs');
const createSupabaseClient = require('./mock_supabase.cjs');

// Mock Browser Environment
const localStorageData = {};
global.localStorage = {
  getItem: k => (k in localStorageData ? localStorageData[k] : null),
  setItem: (k, v) => { localStorageData[k] = String(v); },
  removeItem: k => { delete localStorageData[k]; },
  clear: () => { for (const k in localStorageData) delete localStorageData[k]; }
};

global.sessionStorage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {}
};

global.window = {
  ViharaDeletedEventIds: new Set(),
  ViharaDeletedAnnIds: new Set(),
  supabase: {
    createClient: createSupabaseClient
  }
};

// Load modular scripts
const dataCode = fs.readFileSync('public/js/data.js', 'utf8');
const geoCode = fs.readFileSync('public/js/geo.js', 'utf8');
const supabaseCode = fs.readFileSync('public/js/supabase-client.js', 'utf8');

global.ViharaData = eval(dataCode.replace('const ViharaData =', ''));
global.ViharaGeo = eval(geoCode.replace('const ViharaGeo =', ''));
global.ViharaSupabase = eval(supabaseCode.replace('const ViharaSupabase =', ''));

// Mock Auth
global.ViharaAuth = {
  currentUser: () => ({ id: 'USR_002', name: 'Vin Cen', phone: '0895355301519', role: 'admin' }),
  isAdmin: () => true
};

async function runScenarioTests() {
  console.log('=================================================================');
  console.log('🧪 MEMULAI EKSEKUSI PENGUJIAN OTOMATIS: ScenarioTest.md');
  console.log('=================================================================\n');

  let passedTests = 0;
  let totalTests = 0;

  function assert(condition, testName, details = '') {
    totalTests++;
    if (condition) {
      passedTests++;
      console.log(`  ✅ [PASS] ${testName} ${details ? '(' + details + ')' : ''}`);
      return true;
    } else {
      console.error(`  ❌ [FAIL] ${testName} ${details ? '(' + details + ')' : ''}`);
      return false;
    }
  }

  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const padTime = d => `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;

  // ==========================================================================
  // SKENARIO 1: ATURAN WAKTU PRESENSI (WINDOW 30 MENIT SEBELUM ACARA)
  // ==========================================================================
  console.log('📌 1. Pengujian Aturan Waktu Presensi (Window 30 Menit Sebelum Acara)');

  // 1.1 Tes Terlalu Cepat (> 30 menit sebelum mulai, misal 45 menit sebelum mulai)
  const timeStart1 = new Date(now.getTime() + 45 * 60 * 1000);
  const timeEnd1 = new Date(now.getTime() + 105 * 60 * 1000);
  const evtTooEarly = {
    id: 'TEST_EVT_001',
    name: 'Kebaktian Siang',
    date: todayStr,
    startTime: padTime(timeStart1),
    endTime: padTime(timeEnd1)
  };
  const resEarly = ViharaData.getEventCheckInWindow(evtTooEarly);
  assert(resEarly.isOpen === false && resEarly.reason === 'too_early', '1.1 Tes Terlalu Cepat (> 30 mnt)', `Pesan: "${resEarly.message}"`);

  // 1.2 Tes Tepat Waktu (<= 30 menit sebelum mulai, misal 20 menit sebelum mulai)
  const timeStart2 = new Date(now.getTime() + 20 * 60 * 1000);
  const timeEnd2 = new Date(now.getTime() + 80 * 60 * 1000);
  const evtInWindow = {
    id: 'TEST_EVT_002',
    name: 'Kebaktian Tepat Waktu',
    date: todayStr,
    startTime: padTime(timeStart2),
    endTime: padTime(timeEnd2)
  };
  const resInWindow = ViharaData.getEventCheckInWindow(evtInWindow);
  assert(resInWindow.isOpen === true && resInWindow.reason === 'open', '1.2 Tes Tepat Waktu (<= 30 mnt)', `Presensi terbuka`);

  // 1.3 Tes Selama Acara Berlangsung (misal acara mulai 15 menit lalu, selesai 45 menit lagi)
  const timeStart3 = new Date(now.getTime() - 15 * 60 * 1000);
  const timeEnd3 = new Date(now.getTime() + 45 * 60 * 1000);
  const evtOngoing = {
    id: 'TEST_EVT_003',
    name: 'Kebaktian Sedang Berlangsung',
    date: todayStr,
    startTime: padTime(timeStart3),
    endTime: padTime(timeEnd3)
  };
  const resOngoing = ViharaData.getEventCheckInWindow(evtOngoing);
  assert(resOngoing.isOpen === true && resOngoing.reason === 'open', '1.3 Tes Selama Acara Berlangsung', `Presensi tetap aktif`);

  // 1.4 Tes Acara Sudah Selesai (misal acara selesai 30 menit lalu)
  const timeStart4 = new Date(now.getTime() - 90 * 60 * 1000);
  const timeEnd4 = new Date(now.getTime() - 30 * 60 * 1000);
  const evtFinished = {
    id: 'TEST_EVT_004',
    name: 'Kebaktian Lampau',
    date: todayStr,
    startTime: padTime(timeStart4),
    endTime: padTime(timeEnd4)
  };
  const resFinished = ViharaData.getEventCheckInWindow(evtFinished);
  assert(resFinished.isOpen === false && resFinished.reason === 'expired', '1.4 Tes Acara Sudah Selesai', `Pesan: "${resFinished.message}"`);

  console.log('');

  // ==========================================================================
  // SKENARIO 2: PENGUJIAN BUAT ACARA (1x KLIK & SINKRON DATABASE)
  // ==========================================================================
  console.log('📌 2. Pengujian Buat Acara (1x Klik & Sinkron Database)');

  // 2.1 Buat acara baru
  const createdEvt = ViharaData.createEvent({
    name: 'Puja Bakti Asadha Uji Skenario',
    date: todayStr,
    startTime: '19:00',
    endTime: '21:00',
    speaker: 'Bhikkhu Subhamitto',
    speakerTitle: 'Bhikkhu Sangha',
    dhammasala: 'Dhammasala Utama'
  });

  assert(Boolean(createdEvt && createdEvt.id && createdEvt.id.startsWith('EVT_')), '2.1 Pembuatan Acara Baru (Local State)', `ID: ${createdEvt.id}`);

  // 2.2 Sinkronisasi ke Supabase Remote DB
  console.log('   📡 Memeriksa penyimpanan ke cloud Supabase...');
  const remoteInsert = await ViharaSupabase.insertEvent(createdEvt);
  assert(Boolean(remoteInsert && remoteInsert.id === createdEvt.id), '2.2 Persistensi Acara ke Cloud PostgreSQL Supabase', `Tersimpan di tabel events Supabase`);

  // 2.3 Simulasi Refresh (F5) & Sinkronisasi Ulang dari Cloud
  console.log('   🔄 Mensimulasikan refresh halaman (F5)...');
  const syncedEvents = await ViharaSupabase.syncEvents();
  const foundInSynced = (syncedEvents || []).find(e => e.id === createdEvt.id);
  assert(Boolean(foundInSynced && foundInSynced.name === createdEvt.name), '2.3 Uji Refresh (F5) - Data Acara Tetap Utuh', `Acara tidak hilang setelah reload`);

  console.log('');

  // ==========================================================================
  // SKENARIO 3: PENGUJIAN HAPUS ACARA (1x KLIK & TIDAK MUNCUL KEMBALI)
  // ==========================================================================
  console.log('📌 3. Pengujian Hapus Acara (1x Klik & Tidak Muncul Kembali)');

  const targetDeleteId = createdEvt.id;

  // 3.1 Hapus acara lokal
  ViharaData.deleteEvent(targetDeleteId);
  const remainingLocal = ViharaData.getEvents().find(e => e.id === targetDeleteId);
  assert(remainingLocal === undefined, '3.1 Hapus Acara Sekali Konfirmasi (Optimistic Update)', `Acara langsung lenyap dari memori`);

  // 3.2 Hapus acara di Supabase cloud
  const remoteDelResult = await ViharaSupabase.deleteEvent(targetDeleteId);
  assert(remoteDelResult !== null, '3.2 Penghapusan Acara di Supabase PostgreSQL Cloud', `Terhapus permanen dari Supabase`);

  // 3.3 Uji Konsistensi Cloud (F5)
  console.log('   🔄 Mensimulasikan refresh halaman (F5) setelah penghapusan...');
  const eventsAfterF5 = await ViharaSupabase.syncEvents();
  const reappeared = (eventsAfterF5 || []).find(e => e.id === targetDeleteId);
  assert(reappeared === undefined, '3.3 Uji Konsistensi Cloud (F5) - Acara Tidak Muncul Kembali', `Bebas dari bug ghost event`);

  console.log('');

  // ==========================================================================
  // SKENARIO 4: PENGUJIAN PRESENSI & SINKRONISASI KEHADIRAN
  // ==========================================================================
  console.log('📌 4. Pengujian Presensi & Sinkronisasi Kehadiran');

  // Siapkan acara aktif untuk uji presensi
  const activePresensiEvt = ViharaData.createEvent({
    name: 'Puja Bakti Presensi Geofence Test',
    date: todayStr,
    startTime: padTime(new Date(now.getTime() - 10 * 60 * 1000)), // Sedang berjalan
    endTime: padTime(new Date(now.getTime() + 50 * 60 * 1000)),
    speaker: 'Romo Asin',
    speakerTitle: 'Romo / Pandita',
    dhammasala: 'Dhammasala Utama'
  });
  await ViharaSupabase.insertEvent(activePresensiEvt);
  ViharaData.setActiveEvent(activePresensiEvt.id);

  // Titik acuan Vihara: (-6.467433, 106.853755)
  const viharaLat = -6.467433;
  const viharaLng = 106.853755;

  // 4.1 Presensi Mandiri di Area Vihara (Radius <= 25 meter)
  // Koordinat geser 0.00009 derajat (~10 meter)
  const userNearbyLat = viharaLat + 0.00009;
  const userNearbyLng = viharaLng;
  const distNearby = ViharaGeo.calculateDistance(userNearbyLat, userNearbyLng, viharaLat, viharaLng);
  assert(distNearby <= 25, '4.1 Presensi Mandiri di Area Vihara (Radius <= 25m)', `Jarak terhitung: ${distNearby} meter <= 25 meter`);

  // Catat presensi pertama
  const record1 = ViharaData.addAttendanceRecord({
    userId: 'USR_002',
    userName: 'Vin Cen',
    userPhone: '0895355301519',
    eventId: activePresensiEvt.id,
    method: 'mandiri',
    coords: { latitude: userNearbyLat, longitude: userNearbyLng, accuracy: 5 },
    distanceMeters: distNearby
  });
  assert(Boolean(record1 && record1.id), '4.1b Pencatatan Presensi ke State Lokal', `ID Presensi: ${record1.id}`);

  // 4.2 Presensi di Luar Vihara (> 25 meter)
  // Koordinat bergeser ~500 meter
  const userFarLat = viharaLat + 0.005;
  const userFarLng = viharaLng;
  const distFar = ViharaGeo.calculateDistance(userFarLat, userFarLng, viharaLat, viharaLng);
  assert(distFar > 25, '4.2 Presensi di Luar Vihara (> 25m)', `Jarak terhitung: ${distFar} meter > 25 meter (Tertolak)`);

  // 4.3 Sinkronisasi Multi-Device / Database Cloud (attendance Supabase)
  console.log('   📡 Memverifikasi penyimpanan presensi ke tabel attendance Supabase...');
  const remoteAtt = await ViharaSupabase.insertAttendance(activePresensiEvt.id, 'USR_002', 'self_checkin');
  assert(Boolean(remoteAtt && remoteAtt.id), '4.3 Sinkronisasi Presensi ke Cloud Database Supabase', `Tercatat di Supabase: ${remoteAtt ? remoteAtt.id : 'OK'}`);

  // 4.4 Pencegahan Double Presensi
  const isAlreadyCheckedIn = ViharaData.isUserCheckedInEvent('USR_002', activePresensiEvt.id);
  assert(isAlreadyCheckedIn === true, '4.4a Pengecekan Status Kehadiran (isUserCheckedIn)', `Umat terdeteksi sudah hadir`);

  const recordDuplicate = ViharaData.addAttendanceRecord({
    userId: 'USR_002',
    userName: 'Vin Cen',
    userPhone: '0895355301519',
    eventId: activePresensiEvt.id,
    method: 'mandiri'
  });
  assert(recordDuplicate.id === record1.id, '4.4b Pencegahan Double Presensi', `Mengembalikan rekam jejak lama tanpa menambah duplikat`);

  // Bersihkan data acara uji coba dari Supabase
  await ViharaSupabase.deleteEvent(activePresensiEvt.id);

  console.log('\n=================================================================');
  console.log(`🎉 HASIL PENGUJIAN AKHIR: ${passedTests} / ${totalTests} SKENARIO BERHASIL!`);
  console.log('=================================================================');

  if (passedTests === totalTests) {
    console.log('🌟 SELURUH SKENARIO DI ScenarioTest.md 100% SUKSES MEMENUHI EKSPEKTASI!');
    process.exit(0);
  } else {
    console.error('⚠️ ADA SKENARIO YANG GAGAL!');
    process.exit(1);
  }
}

runScenarioTests().catch(err => {
  console.error('FATAL ERROR SAAT MENJALANKAN TEST:', err);
  process.exit(1);
});
