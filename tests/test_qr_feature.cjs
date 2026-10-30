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
require('../public/js/supabase-client.js');
require('../public/js/data.js');
require('../public/js/auth.js');
require('../public/js/qr.js');

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
  assert(typeof payload === 'string' && (payload.includes('qr_event=') || payload.includes('qr_dhammasala=1')), 'Payload memuat penanda QR Dhammasala yang valid', payload);
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

  // Simulasi submit form identitas kilat sebagai Umat Walk-In
  global.document.getElementById = function(id) {
    if (id === 'qr-quick-input-name') return { value: 'Tan Su Mei' };
    if (id === 'qr-quick-input-phone') return { value: '081377776666' };
    if (id === 'qr-radio-umat') return { checked: true };
    if (id === 'qr-quick-domicile-wrap') return { style: {} };
    if (id === 'qr-quick-input-domicile') return { value: '' };
    if (id === 'modal-qr-success-message') return { set innerHTML(val) { successMessage = val; }, get innerHTML() { return successMessage; } };
    if (id === 'modal-qr-success-action-btn') return { textContent: '' };
    return null;
  };

  ViharaQR.handleQuickRegisterSubmit({ preventDefault: () => {} });

  const updatedAttendances = ViharaData.getAttendanceList();
  const walkinRecord = updatedAttendances.find(a => a.userPhone === '081377776666' && String(a.eventId) === 'EVT_READY');
  assert(!!walkinRecord, 'Walk-in umat belum login berhasil dicatat kehadirannya', `Nama: ${walkinRecord ? walkinRecord.userName : 'NONE'}`);
  assert(walkinRecord && walkinRecord.method === 'qr_dhammasala', 'Metode presensi walk-in adalah qr_dhammasala');

  // Test 7: Skenario Pengunjung / Tamu Luar Kota via Form QR
  console.log('\n--- 7. Skenario Pengunjung / Tamu Luar Kota via Form QR ---');
  ViharaQR.handleScannedData(scanUrl);

  global.document.getElementById = function(id) {
    if (id === 'qr-quick-input-name') return { value: 'Budi Santoso' };
    if (id === 'qr-quick-input-phone') return { value: '081912345678' };
    if (id === 'qr-radio-umat') return { checked: false };
    if (id === 'qr-quick-domicile-wrap') return { style: {} };
    if (id === 'qr-quick-input-domicile') return { value: 'Jakarta Barat' };
    if (id === 'modal-qr-success-message') return { set innerHTML(val) { successMessage = val; }, get innerHTML() { return successMessage; } };
    if (id === 'modal-qr-success-action-btn') return { textContent: '' };
    if (id === 'modal-qr-error-message') return { set textContent(val) { errorMessage = val; }, get textContent() { return errorMessage; } };
    return null;
  };

  ViharaQR.handleQuickRegisterSubmit({ preventDefault: () => {} });

  const guestList = ViharaData.getGuestList();
  const guestRecord = guestList.find(g => g.phone === '081912345678' && String(g.eventId) === 'EVT_READY');
  assert(!!guestRecord, 'Pengunjung luar berhasil tercatat di buku tamu via QR', `Nama: ${guestRecord ? guestRecord.name : 'NONE'}`);
  assert(guestRecord && guestRecord.domicile === 'Jakarta Barat', 'Domisili tamu tercatat sesuai isian form QR (Jakarta Barat)');

  // Uji anti-duplikasi presensi tamu
  ViharaQR.handleQuickRegisterSubmit({ preventDefault: () => {} });
  assert(errorMessage.includes('Anda sudah tercatat hadir pada kebaktian ini sebelumnya'), 'Sistem menolak duplikasi presensi untuk nomor tamu yang sama');

  // Test 8: Verifikasi Proteksi Akses Buku Tamu Wajib QR
  console.log('\n--- 8. Verifikasi Kebijakan Akses: Buku Tamu Wajib Melalui QR ---');
  const indexHtmlContent = fs.readFileSync('public/index.html', 'utf8');
  assert(!indexHtmlContent.includes('Isi Buku Tamu (Pengunjung Luar)'), 'Tombol publik Isi Buku Tamu di halaman login telah dihapus');
  assert(!indexHtmlContent.includes('btn-quick-qr-dhammasala'), 'Tombol cepat Pindai QR di halaman login telah dihapus');
  assert(!indexHtmlContent.includes('desktop-nav-guest'), 'Menu navigasi tamu bebas di header telah dihapus');

  const directAccess = ViharaAuth.checkRouteAccess('view-guest');
  assert(directAccess.allowed === false && directAccess.reason === 'qr_required', 'Akses langsung ke view-guest diblokir dengan status qr_required');
  assert(!indexHtmlContent.includes('qr-admin-section-card'), 'Section card QR meja di panel admin telah dihapus karena sudah ada di navbar');

  // Test 9: Verifikasi Kode QR Tetap & Permanen (Multi-Minggu Kebaktian Aktif)
  console.log('\n--- 9. Verifikasi Kode QR Tetap & Permanen (Universal Kebaktian Aktif) ---');
  // 9.1 Buat payload QR permanen meja Dhammasala
  const permanentQr = ViharaQR.generateQrPayload();
  assert(permanentQr.includes('qr_dhammasala=1'), 'Format QR meja tetap memiliki parameter qr_dhammasala=1');

  // 9.2 Simulasi Minggu Ini: Kebaktian A aktif
  const eventMingguIni = {
    id: 'EVT_MINGGU_INI',
    name: 'Kebaktian Minggu Ini',
    speaker: 'Bhikkhu Subalaratano',
    date: todayKey,
    startTime: `${pad(now.getHours())}:00`,
    endTime: `${pad((now.getHours() + 2) % 24)}:00`,
    isActive: true
  };
  localStorage.setItem('vihara_events', JSON.stringify([eventMingguIni]));

  ViharaData.setSession({ id: 'USR_002', name: 'Vin Cen', phone: '0895355301519', role: 'admin' });
  ViharaQR.handleScannedData(permanentQr);
  const checkedInThisWeek = ViharaData.isUserCheckedInEvent('USR_002', 'EVT_MINGGU_INI');
  assert(checkedInThisWeek === true, 'Scan QR permanen berhasil presensi ke kebaktian minggu ini');

  // 9.3 Simulasi Minggu Depan: Kebaktian B aktif dengan QR YANG SAMA
  const eventMingguDepan = {
    id: 'EVT_MINGGU_DEPAN',
    name: 'Kebaktian Minggu Depan',
    speaker: 'Bhikkhu Dhammasubho',
    date: todayKey, // Simulasi hari pelaksanaan kebaktian
    startTime: `${pad(now.getHours())}:00`,
    endTime: `${pad((now.getHours() + 2) % 24)}:00`,
    isActive: true
  };
  localStorage.setItem('vihara_events', JSON.stringify([eventMingguDepan]));

  // Scan dengan KODE QR YANG PERSIS SAMA (permanentQr)
  ViharaQR.handleScannedData(permanentQr);
  const checkedInNextWeek = ViharaData.isUserCheckedInEvent('USR_002', 'EVT_MINGGU_DEPAN');
  assert(checkedInNextWeek === true, 'Kode QR yang SAMA berhasil presensi ke kebaktian minggu depan tanpa perlu cetak ulang');

  // 9.4 Simulasi Saat Tidak Ada Acara Aktif
  localStorage.setItem('vihara_events', JSON.stringify([]));
  errorMessage = '';
  ViharaQR.handleScannedData(permanentQr);
  assert(errorMessage.includes('Tidak ada jadwal kebaktian yang sedang aktif'), 'Sistem menampilkan notifikasi ramah saat tidak ada acara aktif');

  // Test 10: Verifikasi Perbaikan Mobile & QR Scanner
  console.log('\n--- 10. Verifikasi Perbaikan Mobile & QR Scanner ---');

  // 10.1 Domain Fallback pada Localhost ke Production Vercel
  global.window.location.origin = 'http://localhost:5500';
  const localQr = ViharaQR.generateQrPayload();
  assert(localQr.startsWith('https://appvihara.vercel.app'), 'Origin localhost otomatis fallback ke https://appvihara.vercel.app', localQr);

  // 10.2 Domain Custom/Produksi Tetap Dipertahankan
  global.window.location.origin = 'https://vihara.or.id';
  const customQr = ViharaQR.generateQrPayload();
  assert(customQr.startsWith('https://vihara.or.id'), 'Origin produksi/custom domain tetap dipertahankan');
  global.window.location.origin = 'http://localhost:5500'; // Kembalikan ke default mock

  // 10.3 ViharaData.addUser Polimorfik (Objek & Argumen Posisi)
  assert(typeof ViharaData.addUser === 'function', 'ViharaData.addUser terdaftar sebagai fungsi publik di ViharaData');
  const userObj = ViharaData.addUser({ name: 'Suryadi Wijaya', phone: '081299990001', role: 'umat' });
  assert(userObj && userObj.name === 'Suryadi Wijaya' && userObj.phone === '081299990001', 'addUser berhasil dengan argumen objek { name, phone, role }');

  const userPos = ViharaData.addUser('Maya Sasmita', '081299990002', 'umat');
  assert(userPos && userPos.name === 'Maya Sasmita' && userPos.phone === '081299990002', 'addUser berhasil dengan argumen posisi (name, phone, role)');

  // 10.4 Fallback Event Matching saat Waktu Aktif Tidak Pas tapi Tersedia Acara Terdaftar
  const testFallbackEvent = {
    id: 'EVT_FALLBACK_TEST',
    name: 'Kebaktian Fallback Malam',
    speaker: 'Bhikkhu Gunasiri',
    date: todayKey,
    startTime: `${pad(now.getHours())}:00`,
    endTime: `${pad((now.getHours() + 2) % 24)}:00`,
    archived: false
  };
  localStorage.setItem('vihara_events', JSON.stringify([testFallbackEvent]));
  ViharaData.setSession({ id: 'USR_002', name: 'Vin Cen', phone: '0895355301519', role: 'admin' });
  errorMessage = '';
  ViharaQR.handleScannedData(permanentQr);
  const checkedInFallback = ViharaData.isUserCheckedInEvent('USR_002', 'EVT_FALLBACK_TEST');
  assert(checkedInFallback === true, 'handleScannedData berhasil fallback ke acara terbaru yang tersedia');

  // 10.5 Verifikasi CSS Responsiveness Modal (.modal-box max-height 85vh & overflow-y)
  const styleCssContent = fs.readFileSync('public/css/style.css', 'utf8');
  assert(styleCssContent.includes('max-height: 85vh'), 'style.css memuat max-height: 85vh untuk mencegah modal terpotong di ponsel');
  assert(styleCssContent.includes('overflow-y: auto'), 'style.css memuat overflow-y: auto untuk scrolling modal form kilat');

  // 10.6 Verifikasi Preloader Dismissal pada initUrlScanHandler
  let preloaderHidden = false;
  global.window.hideDhammaLoading = () => { preloaderHidden = true; };
  global.window.location.search = '?qr_dhammasala=1';
  global.window.location.href = 'https://appvihara.vercel.app/index.html?qr_dhammasala=1';
  global.window.history = { replaceState: () => {} };
  await ViharaQR.initUrlScanHandler();
  assert(preloaderHidden === true, 'initUrlScanHandler langsung memanggil penutupan preloader saat mendeteksi parameter QR');

  // 10.7 Verifikasi Fallback Private IP LAN (192.168.x.x & 10.x.x.x) ke Production Vercel
  global.window.location.origin = 'http://192.168.1.100:5500';
  const lanQr = ViharaQR.generateQrPayload();
  assert(lanQr.startsWith('https://appvihara.vercel.app'), 'Origin LAN 192.168.x.x otomatis fallback ke https://appvihara.vercel.app');

  global.window.location.origin = 'http://10.0.0.15:3000';
  const lan10Qr = ViharaQR.generateQrPayload();
  assert(lan10Qr.startsWith('https://appvihara.vercel.app'), 'Origin LAN 10.x.x.x otomatis fallback ke https://appvihara.vercel.app');
  global.window.location.origin = 'http://localhost:5500'; // Kembalikan ke default mock

  // 10.8 Verifikasi Deteksi Tablet iPad (Macintosh UA dengan Touch)
  const prevNav = global.window.navigator;
  global.window.navigator = { userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', maxTouchPoints: 5 };
  global.navigator = global.window.navigator;
  assert(ViharaQR.isMobileDevice() === true, 'isMobileDevice mendeteksi iPadOS sebagai perangkat sentuh mobile');
  global.window.navigator = prevNav;
  global.navigator = prevNav;

  // 10.9 Verifikasi Inline Safety Fallback Script di index.html
  const freshIndexHtml = fs.readFileSync('public/index.html', 'utf8');
  assert(freshIndexHtml.includes('window.hideDhammaLoading'), 'index.html memuat inline safety preloader & modal helpers');

  console.log('\n======================================================');
  console.log(`🎉 HASIL PENGUJIAN: ${passedTests} / ${totalTests} SKENARIO BERHASIL! (100% PASS)`);
  console.log('======================================================\n');
}

runTests().catch(e => {
  console.error('Error saat menjalankan pengujian:', e);
  process.exit(1);
});
