/**
 * Automated Security Audit Test Suite
 * Verifies all security hardening remediations across client-side logic,
 * Superadmin Vault RPCs, and salted password hashing.
 */

const assert = require('assert');
const fs = require('fs');

console.log('\n======================================================');
console.log('🛡️  MEMULAI PENGUJIAN OTOMATIS: SECURITY AUDIT SUITE');
console.log('======================================================\n');

let passCount = 0;
let totalCount = 0;

async function it(name, fn) {
  totalCount++;
  try {
    await fn();
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

// Mock DOM & Element for superadmin
let domListeners = [];
const mockElement = {
  value: '',
  style: {},
  focus: () => {},
  select: () => {},
  addEventListener: () => {},
  appendChild: () => {}
};
global.document = {
  getElementById: (id) => mockElement,
  createElement: () => ({ style: {}, classList: { add: () => {} }, remove: () => {} }),
  body: { appendChild: () => {} },
  addEventListener: (evt, cb) => { domListeners.push(cb); }
};
global.showToast = (msg) => {};

// Mock Supabase
const createSupabaseClient = require('./mock_supabase.cjs');
global.supabase = { createClient: createSupabaseClient };
global.createClient = createSupabaseClient;

// Load Dependencies
eval(fs.readFileSync('public/js/data.js', 'utf8'));
eval(fs.readFileSync('public/js/auth.js', 'utf8'));
eval(fs.readFileSync('public/js/geo.js', 'utf8'));
eval(fs.readFileSync('public/js/admin.js', 'utf8'));
eval(fs.readFileSync('public/js/supabase-client.js', 'utf8'));
eval(fs.readFileSync('public/js/superadmin.js', 'utf8'));
domListeners.forEach(cb => cb());

async function runAllTests() {
  console.log('📌 1. Pengujian Privilege Escalation & Access Control (js/auth.js)');

  await it('1.1 Nama mengandung "vincen" tidak otomatis menjadi Admin', () => {
    ViharaData.setSession(null);
    const testUser = { id: 'usr_test_1', name: 'Vincentius Umat', phone: '08120000001', role: 'umat' };
    ViharaData.setSession(testUser);
    assert.strictEqual(ViharaAuth.isAdmin(), false, 'User dengan nama mengandung vincen harus tetap bukan admin!');
  });

  await it('1.2 Nama mengandung "pengurus" atau "admin" tidak otomatis menjadi Admin', () => {
    ViharaData.setSession(null);
    const testUser = { id: 'usr_test_2', name: 'Calon Pengurus Baru', phone: '08120000002', role: 'umat' };
    ViharaData.setSession(testUser);
    assert.strictEqual(ViharaAuth.isAdmin(), false, 'User biasa tidak boleh otomatis admin!');
  });

  await it('1.3 Nomor telepon hardcoded lama (08119999888) tidak otomatis bypass Admin', () => {
    ViharaData.setSession(null);
    const testUser = { id: 'usr_test_3', name: 'User 0811', phone: '08119999888', role: 'umat' };
    ViharaData.setSession(testUser);
    assert.strictEqual(ViharaAuth.isAdmin(), false, 'Nomor 08119999888 tidak boleh otomatis admin!');
  });

  await it('1.4 Flag dev vihara_dev_admin_override di localStorage tidak dapat mengelevasi sesi', () => {
    localStorage.setItem('vihara_dev_admin_override', 'true');
    assert.strictEqual(ViharaAuth.isAdmin(), false, 'Dev override flag harus diabaikan!');
    localStorage.removeItem('vihara_dev_admin_override');
  });

  await it('1.5 Registrasi publik memaksakan role "umat" meski disuntik role "admin"', () => {
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

  await it('2.1 loginWithPhone tanpa password ditolak demi keamanan akun', () => {
    const res = ViharaAuth.loginWithPhone('08119999888');
    assert.strictEqual(res.success, false, 'Login tanpa kata sandi harus ditolak!');
  });

  await it('2.2 Objek sesi di localStorage/sessionStorage TIDAK MEMUAT password_hash', () => {
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

  await it('3.1 Validasi Image URL menolak skema berbahaya (javascript:, data:text/html)', () => {
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

  await it('3.2 escapeHTML mengamankan karakter khusus HTML & entitas string', () => {
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

  await it('4.1 escapeCSVField menetralkan karakter eksekusi formula (=, +, -, @, \\t, \\r)', () => {
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

  await it('5.1 Validasi Geolocation menolak koordinat di luar rentang valid (-90 s/d 90, -180 s/d 180)', async () => {
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

  await it('6.1 Umat biasa ditolak saat mencoba membuat jadwal acara (createNewEvent)', () => {
    ViharaData.setSession({ id: 'usr_sec_umat', name: 'Umat Biasa', phone: '081299990001', role: 'umat' });
    const res = ViharaAdmin.createNewEvent({ name: 'Acara Palsu', speaker: 'Penyerang' });
    assert.strictEqual(res.success, false);
    assert.strictEqual(res.message, 'Akses ditolak.');
  });

  await it('6.2 Umat biasa ditolak saat mencoba menghapus jadwal acara (deleteEvent)', () => {
    ViharaData.setSession({ id: 'usr_sec_umat', name: 'Umat Biasa', phone: '081299990001', role: 'umat' });
    const res = ViharaAdmin.deleteEvent('EVT_001');
    assert.strictEqual(res.success, false);
    assert.strictEqual(res.message, 'Akses ditolak.');
  });

  await it('6.3 Umat biasa ditolak saat mencoba mengarsipkan jadwal acara (archiveEvent)', () => {
    ViharaData.setSession({ id: 'usr_sec_umat', name: 'Umat Biasa', phone: '081299990001', role: 'umat' });
    const res = ViharaAdmin.archiveEvent('EVT_001');
    assert.strictEqual(res.success, false);
    assert.strictEqual(res.message, 'Akses ditolak.');
  });

  await it('6.4 Umat biasa ditolak saat mencoba mengubah acara aktif (setActiveEvent)', () => {
    ViharaData.setSession({ id: 'usr_sec_umat', name: 'Umat Biasa', phone: '081299990001', role: 'umat' });
    const res = ViharaAdmin.setActiveEvent('EVT_001');
    assert.strictEqual(res.success, false);
    assert.strictEqual(res.message, 'Akses ditolak.');
  });

  await it('6.5 Pengguna tanpa login (sesi null) ditolak dari seluruh operasi admin', () => {
    ViharaData.setSession(null);
    assert.strictEqual(ViharaAdmin.createNewEvent({ name: 'Acara Anonim', speaker: 'Anon' }).success, false);
    assert.strictEqual(ViharaAdmin.deleteEvent('EVT_001').success, false);
    assert.strictEqual(ViharaAdmin.archiveEvent('EVT_001').success, false);
    assert.strictEqual(ViharaAdmin.setActiveEvent('EVT_001').success, false);
  });

  await it('6.6 Presensi mandiri / QR umat ditolak jika acara telah diarsipkan', () => {
    ViharaData.setSession({ id: 'ADM_001', name: 'Pengurus Admin', phone: '08119999888', role: 'admin' });
    const archivedEvt = ViharaData.createEvent({
      name: 'Kebaktian Lampau',
      speaker: 'Bhikkhu Subha',
      date: '2026-01-01',
      startTime: '09:00',
      endTime: '11:00'
    });
    ViharaData.archiveEvent(archivedEvt.id);

    // Umat mencoba presensi mandiri ke acara yang telah diarsipkan
    const attMandiri = ViharaData.addAttendanceRecord({
      userId: 'usr_sec_umat_02',
      userName: 'Umat Coba Presensi',
      userPhone: '081299990002',
      eventId: archivedEvt.id,
      method: 'mandiri'
    });
    assert.strictEqual(attMandiri, null, 'Presensi mandiri ke acara arsip harus ditolak!');

    // Umat mencoba scan QR ke acara yang telah diarsipkan
    const attQR = ViharaData.addAttendanceRecord({
      userId: 'usr_sec_umat_02',
      userName: 'Umat Coba Presensi',
      userPhone: '081299990002',
      eventId: archivedEvt.id,
      method: 'qr_dhammasala'
    });
    assert.strictEqual(attQR, null, 'Presensi QR ke acara arsip harus ditolak!');
  });

  await it('6.7 Admin tetap berhak mencatat presensi secara manual pada acara arsip (manual_admin)', () => {
    const events = ViharaData.getEvents();
    const archivedEvt = events.find(e => e.archived);
    assert(archivedEvt, 'Harus ada acara arsip');

    // Admin menambah / toggle kehadiran di modal acara arsip
    const attAdmin = ViharaData.addAttendanceRecord({
      userId: 'usr_sec_umat_03',
      userName: 'Umat Ditambahkan Admin',
      userPhone: '081299990003',
      eventId: archivedEvt.id,
      method: 'manual_admin'
    });
    assert(attAdmin !== null, 'Admin harus tetap bisa set kehadiran manual di acara arsip');
    assert.strictEqual(attAdmin.method, 'manual_admin');
  });

  console.log('\n📌 7. Pengujian Superadmin PIN Vault & Proteksi Brute-Force');

  await it('7.1 ViharaSupabase.verifyMasterPin memverifikasi PIN via RPC tanpa membocorkan nilai PIN ke klien', async () => {
    const isCorrect = await ViharaSupabase.verifyMasterPin('2026');
    assert.strictEqual(isCorrect, true, 'PIN yang benar harus menghasilkan true');

    const isWrong = await ViharaSupabase.verifyMasterPin('wrong_pin');
    assert.strictEqual(isWrong, false, 'PIN yang salah harus menghasilkan false');
  });

  await it('7.2 ViharaSupabase.updateMasterPin memperbarui PIN secara aman dan menolak PIN lama yang salah', async () => {
    const failUpdate = await ViharaSupabase.updateMasterPin('wrong_old_pin', '9999');
    assert.strictEqual(failUpdate, false, 'Update PIN dengan PIN lama salah harus ditolak');

    const okUpdate = await ViharaSupabase.updateMasterPin('2026', '9999');
    assert.strictEqual(okUpdate, true, 'Update PIN dengan PIN lama benar harus berhasil');

    const isNewValid = await ViharaSupabase.verifyMasterPin('9999');
    assert.strictEqual(isNewValid, true, 'PIN baru harus aktif dan dapat diverifikasi');

    // Kembalikan ke PIN awal 2026
    await ViharaSupabase.updateMasterPin('9999', '2026');
  });

  await it('7.3 Migrasi database memuat RPC SECURITY DEFINER, trigger, dan kolom biodata', () => {
    const schemaSql = fs.readFileSync('supabase/schema.sql', 'utf8');
    const migSql = fs.readFileSync('supabase/migration_combined_biodata_and_security.sql', 'utf8');

    assert(schemaSql.includes('verify_master_pin'), 'schema.sql harus memuat fungsi verify_master_pin');
    assert(schemaSql.includes('update_master_pin'), 'schema.sql harus memuat fungsi update_master_pin');
    assert(schemaSql.includes('prevent_role_escalation'), 'schema.sql harus memuat trigger prevent_role_escalation');
    assert(schemaSql.includes("key != 'superadmin_pin'"), 'schema.sql harus membatasi select publik pada superadmin_pin');

    assert(migSql.includes('verify_master_pin'), 'migration_combined_biodata_and_security.sql harus memuat verify_master_pin');
    assert(migSql.includes('prevent_role_escalation'), 'migration_combined_biodata_and_security.sql harus memuat prevent_role_escalation');
    assert(migSql.includes('gender'), 'migration_combined_biodata_and_security.sql harus memuat kolom gender');
    assert(migSql.includes('tempat_lahir'), 'migration_combined_biodata_and_security.sql harus memuat kolom tempat_lahir');
  });

  await it('7.4 Brute-force lockout Superadmin mengunci akses setelah 5 kali gagal berturut-turut', async () => {
    // Reset status lockout
    mockLocalStorage['vihara_superadmin_failed_attempts'] = '0';
    delete mockLocalStorage['vihara_superadmin_lockout_until'];

    mockElement.value = 'wrong_pin_attempt';
    for (let i = 0; i < 4; i++) {
      await window.handleSuperAdminLogin();
    }
    assert.strictEqual(mockLocalStorage['vihara_superadmin_failed_attempts'], '4');
    assert.strictEqual(mockLocalStorage['vihara_superadmin_lockout_until'], undefined, 'Belum boleh terkunci sebelum percobaan ke-5');

    // Percobaan ke-5 yang gagal -> langsung terkunci
    await window.handleSuperAdminLogin();
    assert.strictEqual(mockLocalStorage['vihara_superadmin_failed_attempts'], '5');
    assert(mockLocalStorage['vihara_superadmin_lockout_until'] !== undefined, 'Harus terkunci setelah 5 kegagalan');

    // Percobaan ke-6 saat terkunci -> langsung ditolak tanpa verifikasi DB
    let reachedDb = false;
    const origVerify = ViharaSupabase.verifyMasterPin;
    ViharaSupabase.verifyMasterPin = async () => { reachedDb = true; return true; };
    await window.handleSuperAdminLogin();
    assert.strictEqual(reachedDb, false, 'Tidak boleh memanggil database selama periode lockout');
    ViharaSupabase.verifyMasterPin = origVerify;

    // Bersihkan lockout
    delete mockLocalStorage['vihara_superadmin_failed_attempts'];
    delete mockLocalStorage['vihara_superadmin_lockout_until'];
  });

  console.log('\n📌 8. Pengujian Salted Password Hashing & Backward Compatibility');

  await it('8.1 Format hash baru ber-salt: diawali "s1:<salt>:<hash>" dengan salt unik', async () => {
    const hashA = await ViharaAuth.hashPassword('kataSandiAman1');
    const hashB = await ViharaAuth.hashPassword('kataSandiAman1');

    assert(hashA.startsWith('s1:'), 'Format hash harus berawalan s1:');
    assert(hashB.startsWith('s1:'), 'Format hash harus berawalan s1:');
    assert.notStrictEqual(hashA, hashB, 'Dua hash dengan kata sandi yang sama harus berbeda berkat random salt');
  });

  await it('8.2 ViharaAuth.verifyPassword berhasil memvalidasi kata sandi dengan format salted', async () => {
    const plain = 'ViharaMulia2026!';
    const saltedHash = await ViharaAuth.hashPassword(plain);
    const testUser = { phone: '08129999111', password_hash: saltedHash };

    const isValid = await ViharaAuth.verifyPassword(testUser, plain);
    assert.strictEqual(isValid, true, 'Kata sandi yang benar harus berhasil diverifikasi');

    const isInvalid = await ViharaAuth.verifyPassword(testUser, 'SalahPassword');
    assert.strictEqual(isInvalid, false, 'Kata sandi yang salah harus ditolak');
  });

  await it('8.3 ViharaAuth.verifyPassword backward compatible dengan legacy raw SHA-256 dan default 123456', async () => {
    // Legacy user dengan raw unsalted hash untuk '123456'
    const legacyUser = {
      phone: '08119999888',
      password_hash: '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92'
    };

    const isMatch = await ViharaAuth.verifyPassword(legacyUser, '123456');
    assert.strictEqual(isMatch, true, 'Hash legacy unsalted harus tetap dapat login dengan lancar');

    const isWrongMatch = await ViharaAuth.verifyPassword(legacyUser, 'bukan123456');
    assert.strictEqual(isWrongMatch, false, 'Kata sandi salah pada akun legacy harus ditolak');

    // Pengguna baru tanpa password_hash tersimpan (menggunakan default)
    const freshUser = { phone: '08999999999', password_hash: null };
    const isDefaultMatch = await ViharaAuth.verifyPassword(freshUser, '123456');
    assert.strictEqual(isDefaultMatch, true, 'Pengguna baru dengan kata sandi default harus terverifikasi');
  });

  console.log('\n======================================================');
  console.log(`🎉 HASIL PENGUJIAN: ${passCount} / ${totalCount} SKENARIO BERHASIL! (${Math.round((passCount/totalCount)*100)}% PASS)`);
  console.log('======================================================\n');

  if (passCount === totalCount) {
    process.exit(0);
  } else {
    process.exit(1);
  }
}

runAllTests().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
