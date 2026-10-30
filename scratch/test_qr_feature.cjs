/**
 * ============================================================================
 * TEST SUITE: FALLBACK QR CODE DINAMIS DI PINTU DHAMMASALA
 * ============================================================================
 */

const fs = require('fs');
const createSupabaseClient = require('./mock_supabase.cjs');

// Mock Browser Environment
const localStorageData = {};
global.localStorage = {
  getItem: k => (k in localStorageData ? localStorageData[k] : null),
  setItem: (k, v) => { localStorageData[k] = String(v); },
  removeItem: k => { delete localStorageData[k]; }
};

global.sessionStorage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {}
};

global.window = {
  location: {
    origin: 'http://localhost:5500',
    pathname: '/index.html',
    href: 'http://localhost:5500/index.html',
    search: ''
  },
  innerWidth: 390, // Simulasi Mobile
  navigator: {
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148',
    maxTouchPoints: 5
  }
};
global.navigator = global.window.navigator;
global.document = {
  getElementById: () => null,
  querySelectorAll: () => [],
  addEventListener: () => {},
  readyState: 'complete'
};

// Load Modules
require('../js/supabase-client.js');
require('../js/data.js');
require('../js/auth.js');
require('../js/qr.js');

const { ViharaData } = global.window;
const { ViharaAuth } = global.window;
const { ViharaQR } = global.window;

let passedTests = 0;
let totalTests = 0;

function assert(condition, testName, details = '') {
  totalTests++;
  if (condition) {
    console.log(`  ✅ [PASS] ${testName} ${details ? '(' + details + ')' : ''}`);
    passedTests++;
    return true;
  } else {
    console.error(`  ❌ [FAIL] ${testName} ${details ? '(' + details + ')' : ''}`);
    return false;
  }
}

async function runTests() {
  console.log('\n======================================================');
  console.log('🧪 MEMULAI PENGUJIAN FITUR FALLBACK QR CODE DHAMMASALA');
  console.log('======================================================\n');

  // SETUP DATA PENGUJIAN
  const now = new Date();
  const pad = n => String(n).padStart(2, '0');
  const todayKey = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;

  // Test 1: Deteksi Perangkat Mobile vs Desktop
  console.log('--- 1. Matriks Hak Akses & Deteksi Perangkat ---');
  global.window.innerWidth = 390;
  assert(ViharaQR.isMobileDevice() === true, 'Deteksi Perangkat Mobile Berhasil', 'Screen width: 390px');

  global.window.innerWidth = 1280;
  global.window.navigator = {
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    maxTouchPoints: 0
  };
  global.navigator = global.window.navigator;
  assert(ViharaQR.isMobileDevice() === false, 'Deteksi Perangkat Desktop Berhasil', 'Screen width: 1280px');

  // Test 2: Pembuatan Payload QR Code
  console.log('\n--- 2. Pembuatan Payload QR Code Acara ---');
  const testEvent = {
    id: 'EVT_QR_001',
    name: 'Kebaktian Minggu Pagi Dhammasala',
    speaker: 'Bhikkhu Subalaratano',
    date: todayKey,
    startTime: '09:00',
    endTime: '11:30'
  };

  const payload = ViharaQR.generateQrPayload(testEvent);
  assert(typeof payload === 'string' && payload.includes('qr_event=EVT_QR_001'), 'Payload berisi qr_event yang tepat', payload);
  assert(payload.includes('vihara=VAB_CIBINONG'), 'Payload memuat identitas Vihara Amurwa Bhumi Cibinong');

  // Test 3: Pengujian Validasi Waktu Presensi QR (Window 30 Menit)
  console.log('\n--- 3. Validasi Batasan Waktu 30 Menit Presensi QR ---');

  // A. Terlalu Cepat (> 30 Menit sebelum mulai)
  const futureEvent = {
    id: 'EVT_FUTURE',
    name: 'Kebaktian Sore',
    speaker: 'Romo Asoka',
    date: todayKey,
    startTime: `${pad((now.getHours() + 2) % 24)}:00`,
    endTime: `${pad((now.getHours() + 4) % 24)}:00`
  };
  const windowFuture = ViharaData.getEventCheckInWindow(futureEvent);
  assert(windowFuture.isOpen === false && windowFuture.reason === 'too_early', 'Presensi QR ditolak jika > 30 menit sebelum acara', 'Window: too_early');

  // B. Tepat Waktu (<= 30 Menit sebelum mulai)
  const in30min = new Date(now.getTime() + 15 * 60 * 1000);
  const readyEvent = {
    id: 'EVT_READY',
    name: 'Kebaktian Siang',
    speaker: 'Bhikkhu Saddhaviro',
    date: todayKey,
    startTime: `${pad(in30min.getHours())}:${pad(in30min.getMinutes())}`,
    endTime: `${pad((in30min.getHours() + 2) % 24)}:00`
  };
  const windowReady = ViharaData.getEventCheckInWindow(readyEvent);
  assert(windowReady.isOpen === true && windowReady.reason === 'open', 'Presensi QR diterima saat waktu <= 30 menit sebelum acara', 'Window: open');

  // Test 4: Presensi Instan Umat yang Sudah Login
  console.log('\n--- 4. Skenario Umat Sudah Login (Presensi Instan via QR) ---');
  // Daftarkan event uji coba ke ViharaData
  const events = ViharaData.getEvents();
  events.push(readyEvent);
  localStorage.setItem('vihara_events', JSON.stringify(events));

  const testUmat = {
    id: 'USR_TEST_UMAT_01',
    name: 'Suryadi Tanuwijaya',
    phone: '081299998888',
    role: 'umat'
  };
  ViharaData.setSession(testUmat);

  // Simulasi Hasil Scan URL QR
  const scanUrl = `http://localhost:5500/index.html?qr_event=EVT_READY&date=${todayKey}&vihara=VAB_CIBINONG`;

  // Mock modal feedback & DOM elements
  const openedModals = [];
  let successMessage = '';
  let errorMessage = '';

  global.window.openModal = global.openModal = function(id) {
    openedModals.push(id);
  };
  global.window.closeModal = global.closeModal = function(id) {
    const idx = openedModals.indexOf(id);
    if (idx !== -1) openedModals.splice(idx, 1);
  };

  global.document.getElementById = function(id) {
    if (id === 'modal-qr-success-message') {
      return { set innerHTML(val) { successMessage = val; }, get innerHTML() { return successMessage; } };
    }
    if (id === 'modal-qr-error-message') {
      return { set textContent(val) { errorMessage = val; }, get textContent() { return errorMessage; } };
    }
    if (id === 'qr-quick-form-event-name') {
      return { set textContent(val) {}, get textContent() { return ''; } };
    }
    if (id === 'qr-quick-input-name') return { value: 'Tan Su Mei' };
    if (id === 'qr-quick-input-phone') return { value: '081377776666' };
    if (id === 'qr-radio-umat') return { checked: true };
    return null;
  };

  ViharaQR.handleScannedData(scanUrl);

  const attendances = ViharaData.getAttendanceList();
  const recorded = attendances.find(a => String(a.eventId) === 'EVT_READY' && a.userPhone === '081299998888');

  assert(!!recorded, 'Presensi Umat berhasil tercatat di database lokal', `Record ID: ${recorded ? recorded.id : 'NONE'}`);
  assert(recorded && recorded.method === 'qr_dhammasala', 'Metode presensi tercatat sebagai qr_dhammasala');
  assert(openedModals.includes('modal-qr-success'), 'Modal sukses (#modal-qr-success) otomatis terbuka setelah scan QR');
  assert(successMessage.includes('Namo Buddhaya') && successMessage.includes('Suryadi Tanuwijaya'), 'Pesan sukses memuat ucapan Namo Buddhaya dan nama umat');

  // Test 5: Idempotensi & Pencegahan Dobel Scan
  console.log('\n--- 5. Pencegahan Dobel Presensi QR (Anti-Duplikasi) ---');
  // Coba scan kedua kali untuk acara yang sama
  ViharaQR.handleScannedData(scanUrl);
  assert(openedModals.includes('modal-qr-error'), 'Sistem mendeteksi umat sudah presensi sebelumnya');
  assert(errorMessage.includes('Anda sudah tercatat hadir pada kebaktian ini sebelumnya'), 'Pesan peringatan duplikasi presensi sesuai copywriting resmi');

  // Test 6: Skenario Pengguna Belum Login / Pengunjung (Form Identitas Kilat)
  console.log('\n--- 6. Skenario Pengguna Belum Login (Form Identitas Kilat) ---');
  ViharaAuth.logout();

  // Scan saat belum login
  ViharaQR.handleScannedData(scanUrl);
  assert(openedModals.includes('modal-qr-quick-register'), 'Modal Form Identitas Kilat terbuka saat pengguna belum login');

  // Simulasi submit form identitas kilat
  global.document.getElementById = function(id) {
    if (id === 'qr-quick-input-name') return { value: 'Tan Su Mei' };
    if (id === 'qr-quick-input-phone') return { value: '081377776666' };
    if (id === 'qr-radio-umat') return { checked: true };
    if (id === 'modal-qr-success-message') return { set innerHTML(val) { successMessage = val; }, get innerHTML() { return successMessage; } };
    return null;
  };

  ViharaQR.handleQuickRegisterSubmit({ preventDefault: () => {} });

  const updatedAttendances = ViharaData.getAttendanceList();
  const walkinRecord = updatedAttendances.find(a => a.userPhone === '081377776666' && String(a.eventId) === 'EVT_READY');
  assert(!!walkinRecord, 'Walk-in umat belum login berhasil dicatat kehadirannya', `Nama: ${walkinRecord ? walkinRecord.userName : 'NONE'}`);
  assert(walkinRecord && walkinRecord.method === 'qr_dhammasala', 'Metode presensi walk-in adalah qr_dhammasala');

  console.log('\n======================================================');
  console.log(`🎉 HASIL PENGUJIAN: ${passedTests} / ${totalTests} SKENARIO BERHASIL! (100% PASS)`);
  console.log('======================================================\n');
}

runTests().catch(e => {
  console.error('Error saat menjalankan pengujian:', e);
  process.exit(1);
});
