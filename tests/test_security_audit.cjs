/**
 * Automated Security Audit Test Suite
 * Verifies all security hardening remediations across client-side logic
 */

const assert = require('assert');
const fs = require('fs');

console.log('\n======================================================');
console.log('🛡️  MEMULAI PENGUJIAN OTOMATIS: SECURITY AUDIT SUITE');
console.log('======================================================\n');

let passCount = 0;
let totalCount = 0;

function it(name, fn) {
  totalCount++;
  try {
    fn();
    console.log(`  ✅ [PASS] ${name}`);
    passCount++;
  } catch (err) {
    console.error(`  ❌ [FAIL] ${name}`);
    console.error(`     Error: ${err.message}`);
  }
}

// Setup Minimal Browser Mock with separate storage backends
const mockLocalStorage = {};
const mockSessionStorage = {};

global.localStorage = {
  getItem: (k) => mockLocalStorage[k] || null,
  setItem: (k, v) => { mockLocalStorage[k] = String(v); },
  removeItem: (k) => { delete mockLocalStorage[k]; },
  clear: () => { Object.keys(mockLocalStorage).forEach(k => delete mockLocalStorage[k]); }
};
global.sessionStorage = {
  getItem: (k) => mockSessionStorage[k] || null,
  setItem: (k, v) => { mockSessionStorage[k] = String(v); },
  removeItem: (k) => { delete mockSessionStorage[k]; },
  clear: () => { Object.keys(mockSessionStorage).forEach(k => delete mockSessionStorage[k]); }
};
global.window = global;

// Load Dependencies
eval(fs.readFileSync('public/js/data.js', 'utf8'));
eval(fs.readFileSync('public/js/auth.js', 'utf8'));
eval(fs.readFileSync('public/js/geo.js', 'utf8'));
eval(fs.readFileSync('public/js/admin.js', 'utf8'));

console.log('📌 1. Pengujian Privilege Escalation & Access Control (js/auth.js)');

it('1.1 Nama mengandung "vincen" tidak otomatis menjadi Admin', () => {
  ViharaData.setSession(null);
  const testUser = { id: 'usr_test_1', name: 'Vincentius Umat', phone: '08120000001', role: 'umat' };
  ViharaData.setSession(testUser);
  assert.strictEqual(ViharaAuth.isAdmin(), false, 'User dengan nama mengandung vincen harus tetap bukan admin!');
});

it('1.2 Nama mengandung "pengurus" atau "admin" tidak otomatis menjadi Admin', () => {
  ViharaData.setSession(null);
  const testUser = { id: 'usr_test_2', name: 'Calon Pengurus Baru', phone: '08120000002', role: 'umat' };
  ViharaData.setSession(testUser);
  assert.strictEqual(ViharaAuth.isAdmin(), false, 'User biasa tidak boleh otomatis admin!');
});

it('1.3 Nomor telepon hardcoded lama (08119999888) tidak otomatis bypass Admin', () => {
  ViharaData.setSession(null);
  const testUser = { id: 'usr_test_3', name: 'User 0811', phone: '08119999888', role: 'umat' };
  ViharaData.setSession(testUser);
  assert.strictEqual(ViharaAuth.isAdmin(), false, 'Nomor 08119999888 tidak boleh otomatis admin!');
});

it('1.4 Flag dev vihara_dev_admin_override di localStorage tidak dapat mengelevasi sesi', () => {
  localStorage.setItem('vihara_dev_admin_override', 'true');
  assert.strictEqual(ViharaAuth.isAdmin(), false, 'Dev override flag harus diabaikan!');
  localStorage.removeItem('vihara_dev_admin_override');
});

it('1.5 Registrasi publik memaksakan role "umat" meski disuntik role "admin"', () => {
  ViharaData.setSession(null);
  const res = ViharaAuth.register({
    name: 'Attacker Impersonator',
    phone: '089988776655',
    email: 'attack@test.com',
    role: 'admin' // Attempting privilege escalation
  });
  assert.strictEqual(res.success, true);
  assert.strictEqual(res.user.role, 'umat', 'Role registrasi publik wajib selalu umat!');
  assert.strictEqual(ViharaAuth.isAdmin(), false);
});

console.log('\n📌 2. Pengujian Authentication & Password Hash Exposure');

it('2.1 loginWithPhone tanpa password ditolak demi keamanan akun', () => {
  const res = ViharaAuth.loginWithPhone('08119999888');
  assert.strictEqual(res.success, false, 'Login tanpa kata sandi harus ditolak!');
});

it('2.2 Objek sesi di localStorage/sessionStorage TIDAK MEMUAT password_hash', () => {
  ViharaData.setSession(null);
  const sensitiveUser = {
    id: 'usr_sec_01',
    name: 'Sutra Umat',
    phone: '081233445566',
    role: 'umat',
    password_hash: '9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08'
  };
  ViharaData.setSession(sensitiveUser);
  const rawSession = JSON.parse(localStorage.getItem('vihara_session'));
  assert.strictEqual(rawSession.password_hash, undefined, 'password_hash tidak boleh bocor ke storage peramban!');
});

console.log('\n📌 3. Pengujian Sanitasi DOM / Stored XSS & Avatar URL');

it('3.1 Validasi Image URL menolak skema berbahaya (javascript:, data:text/html)', () => {
  // Evaluasi regex atau fungsi sanitizeImageUrl di file app.js
  const appCode = fs.readFileSync('public/js/app.js', 'utf8');
  const sanitizeMatch = appCode.match(/function sanitizeImageUrl\(url\)[\s\S]*?\n  \}/);
  assert(sanitizeMatch, 'sanitizeImageUrl harus didefinisikan!');
  eval(sanitizeMatch[0]);

  assert.strictEqual(sanitizeImageUrl('javascript:alert(1)'), null);
  assert.strictEqual(sanitizeImageUrl('data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg=='), null);
  assert.strictEqual(sanitizeImageUrl('vbscript:msgbox(1)'), null);
  assert.strictEqual(sanitizeImageUrl('https://example.com/avatar.png'), 'https://example.com/avatar.png');
  assert.strictEqual(sanitizeImageUrl('data:image/jpeg;base64,12345'), 'data:image/jpeg;base64,12345');
});

it('3.2 escapeHTML mengamankan karakter khusus HTML & entitas string', () => {
  const appCode = fs.readFileSync('public/js/app.js', 'utf8');
  const escapeMatch = appCode.match(/function escapeHTML\(str\)[\s\S]*?\n  \}/);
  assert(escapeMatch, 'escapeHTML harus didefinisikan!');
  eval(escapeMatch[0]);

  assert.strictEqual(escapeHTML(null), '');
  assert.strictEqual(escapeHTML(undefined), '');
  assert.strictEqual(escapeHTML('<script>alert("xss")</script>'), '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;');
  assert.strictEqual(escapeHTML("Robert'; DROP TABLE--"), 'Robert&#039;; DROP TABLE--');
});

console.log('\n📌 4. Pengujian CSV / Formula Injection (CWE-1236)');

it('4.1 escapeCSVField menetralkan karakter eksekusi formula (=, +, -, @, \\t, \\r)', () => {
  const adminCode = fs.readFileSync('public/js/admin.js', 'utf8');
  const csvMatch = adminCode.match(/function escapeCSVField\(val\)[\s\S]*?\n  \}/);
  assert(csvMatch, 'escapeCSVField harus didefinisikan!');
  eval(csvMatch[0]);

  assert.strictEqual(escapeCSVField("=cmd|'/c calc'!A0"), "\"'=cmd|'/c calc'!A0\"");
  assert.strictEqual(escapeCSVField("+2+5"), "\"'+2+5\"");
  assert.strictEqual(escapeCSVField("-100"), "\"'-100\"");
  assert.strictEqual(escapeCSVField("@SUM(A1:A10)"), "\"'@SUM(A1:A10)\"");
  assert.strictEqual(escapeCSVField('Normal Text "with quotes"'), '"Normal Text ""with quotes"""');
});

console.log('\n📌 5. Pengujian Validasi Koordinat Geolokasi (js/geo.js)');

it('5.1 Validasi Geolocation menolak koordinat di luar rentang valid (-90 s/d 90, -180 s/d 180)', async () => {
  let errLatitude = null;
  try {
    await ViharaGeo.saveConfig({ latitude: 999, longitude: 106.8, radiusMeters: 25 });
  } catch (e) {
    errLatitude = e;
  }
  assert(errLatitude, 'Latitude > 90 harus ditolak dengan error!');

  let errLongitude = null;
  try {
    await ViharaGeo.saveConfig({ latitude: -6.4, longitude: -250, radiusMeters: 25 });
  } catch (e) {
    errLongitude = e;
  }
  assert(errLongitude, 'Longitude < -180 harus ditolak dengan error!');

  let errRadius = null;
  try {
    await ViharaGeo.saveConfig({ latitude: -6.4, longitude: 106.8, radiusMeters: 1 });
  } catch (e) {
    errRadius = e;
  }
  assert(errRadius, 'Radius < 5 meter harus ditolak dengan error!');
});

console.log('\n📌 6. Pengujian Otorisasi Ketat Operasi Admin (RBAC Strict Defense)');

it('6.1 Umat biasa ditolak saat mencoba membuat jadwal acara (createNewEvent)', () => {
  ViharaData.setSession({ id: 'usr_sec_umat', name: 'Umat Biasa', phone: '081299990001', role: 'umat' });
  const res = ViharaAdmin.createNewEvent({ name: 'Acara Palsu', speaker: 'Penyerang' });
  assert.strictEqual(res.success, false);
  assert.strictEqual(res.message, 'Akses ditolak.');
});

it('6.2 Umat biasa ditolak saat mencoba menghapus jadwal acara (deleteEvent)', () => {
  ViharaData.setSession({ id: 'usr_sec_umat', name: 'Umat Biasa', phone: '081299990001', role: 'umat' });
  const res = ViharaAdmin.deleteEvent('EVT_001');
  assert.strictEqual(res.success, false);
  assert.strictEqual(res.message, 'Akses ditolak.');
});

it('6.3 Umat biasa ditolak saat mencoba mengarsipkan jadwal acara (archiveEvent)', () => {
  ViharaData.setSession({ id: 'usr_sec_umat', name: 'Umat Biasa', phone: '081299990001', role: 'umat' });
  const res = ViharaAdmin.archiveEvent('EVT_001');
  assert.strictEqual(res.success, false);
  assert.strictEqual(res.message, 'Akses ditolak.');
});

it('6.4 Umat biasa ditolak saat mencoba mengubah acara aktif (setActiveEvent)', () => {
  ViharaData.setSession({ id: 'usr_sec_umat', name: 'Umat Biasa', phone: '081299990001', role: 'umat' });
  const res = ViharaAdmin.setActiveEvent('EVT_001');
  assert.strictEqual(res.success, false);
  assert.strictEqual(res.message, 'Akses ditolak.');
});

it('6.5 Pengguna tanpa login (sesi null) ditolak dari seluruh operasi admin', () => {
  ViharaData.setSession(null);
  assert.strictEqual(ViharaAdmin.createNewEvent({ name: 'Acara Anonim', speaker: 'Anon' }).success, false);
  assert.strictEqual(ViharaAdmin.deleteEvent('EVT_001').success, false);
  assert.strictEqual(ViharaAdmin.archiveEvent('EVT_001').success, false);
  assert.strictEqual(ViharaAdmin.setActiveEvent('EVT_001').success, false);
});

console.log('\n======================================================');
console.log(`🎉 HASIL PENGUJIAN: ${passCount} / ${totalCount} SKENARIO BERHASIL! (${Math.round((passCount/totalCount)*100)}% PASS)`);
console.log('======================================================\n');
if (passCount === totalCount) {
  process.exit(0);
} else {
  process.exit(1);
}
