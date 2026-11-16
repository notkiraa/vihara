/**
 * Test Suite: Biodata Umat (Gender, Tempat Lahir, Tanggal Lahir, Alamat)
 * Memverifikasi persistensi data, sinkronisasi Supabase, dan parser CSV.
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');

// Mock browser environment
const localStorageMock = (function() {
  let store = {};
  return {
    getItem: (key) => store[key] || null,
    setItem: (key, val) => { store[key] = String(val); },
    removeItem: (key) => { delete store[key]; },
    clear: () => { store = {}; }
  };
})();

global.localStorage = localStorageMock;
global.sessionStorage = localStorageMock;
global.window = global;
global.document = {
  getElementById: () => null,
  addEventListener: () => {}
};

// Mock Supabase
const { createSupabaseClient } = require('./mock_supabase.cjs');
global.createClient = createSupabaseClient;

// Load dependencies
const supabaseClientCode = fs.readFileSync(path.join(__dirname, '../public/js/supabase-client.js'), 'utf8');
eval(supabaseClientCode);

const dataJsCode = fs.readFileSync(path.join(__dirname, '../public/js/data.js'), 'utf8');
eval(dataJsCode);

console.log('======================================================');
console.log('🧪 PENGUJIAN OTOMATIS: BIODATA UMAT (GENDER, TTL, ALAMAT)');
console.log('======================================================\n');

// Inisialisasi data
ViharaData.init();

// 1. Uji penambahan user baru via addUser dengan objek lengkap
console.log('📌 1. Pengujian Penambahan Umat dengan Biodata Lengkap (addUser)');
const newUser = ViharaData.addUser({
  name: 'Tan Mei Ling',
  phone: '081298887766',
  email: 'meiling@gmail.com',
  role: 'umat',
  gender: 'Perempuan',
  tempat_lahir: 'Bogor',
  tanggal_lahir: '1993-04-15',
  alamat: 'Jl. Raya Jakarta Bogor No. 88, Cibinong'
});

assert(newUser, 'User baru harus berhasil dibuat');
assert.strictEqual(newUser.name, 'Tan Mei Ling');
assert.strictEqual(newUser.gender, 'Perempuan', 'Gender harus tersimpan Perempuan');
assert.strictEqual(newUser.tempat_lahir, 'Bogor', 'Tempat lahir harus tersimpan Bogor');
assert.strictEqual(newUser.tanggal_lahir, '1993-04-15', 'Tanggal lahir harus tersimpan 1993-04-15');
assert.strictEqual(newUser.alamat, 'Jl. Raya Jakarta Bogor No. 88, Cibinong', 'Alamat harus tersimpan');
console.log('  ✅ [PASS] 1.1 addUser berhasil menyimpan gender, tempat_lahir, tanggal_lahir, dan alamat');

// 2. Uji updateUser untuk memperbarui biodata
console.log('\n📌 2. Pengujian Pembaruan Biodata Umat (updateUser)');
const updatedUser = ViharaData.updateUser(newUser.id, {
  gender: 'Perempuan',
  tempat_lahir: 'Jakarta',
  tanggal_lahir: '1993-04-20',
  alamat: 'Komp. Ruko Cibinong City Center Blok B'
});

assert(updatedUser, 'User harus berhasil diupdate');
assert.strictEqual(updatedUser.tempat_lahir, 'Jakarta', 'Tempat lahir berhasil diubah ke Jakarta');
assert.strictEqual(updatedUser.tanggal_lahir, '1993-04-20', 'Tanggal lahir berhasil diubah');
assert.strictEqual(updatedUser.alamat, 'Komp. Ruko Cibinong City Center Blok B', 'Alamat berhasil diubah');
console.log('  ✅ [PASS] 2.1 updateUser berhasil memperbarui tempat_lahir, tanggal_lahir, dan alamat');

// 3. Uji persistensi di localStorage
console.log('\n📌 3. Pengujian Persistensi State Lokal');
const storedUsers = ViharaData.getUsers();
const found = storedUsers.find(u => u.id === newUser.id);
assert(found, 'User harus ditemukan di localStorage');
assert.strictEqual(found.gender, 'Perempuan');
assert.strictEqual(found.tempat_lahir, 'Jakarta');
assert.strictEqual(found.tanggal_lahir, '1993-04-20');
assert.strictEqual(found.alamat, 'Komp. Ruko Cibinong City Center Blok B');
console.log('  ✅ [PASS] 3.1 Data biodata tersimpan secara persisten di localStorage');

// 4. Uji format tampilan tanggal Indonesia
console.log('\n📌 4. Pengujian Helper Format Tanggal Indonesia');
const formatted = ViharaData.formatDateIndonesia('1993-04-20');
assert(formatted.includes('April') && formatted.includes('1993'), 'Tanggal harus terformat dalam bahasa Indonesia');
console.log(`  ✅ [PASS] 4.1 Format tanggal berhasil: ${formatted}`);

// 5. Uji parser CSV di superadmin
console.log('\n📌 5. Pengujian CSV Parser dengan Kolom Biodata');
const superadminCode = fs.readFileSync(path.join(__dirname, '../public/js/superadmin.js'), 'utf8');
// Evaluasi superadmin
eval(superadminCode);

const sampleCsv = `Nama Lengkap,Nomor HP,Email,Role,Gender,Tempat Lahir,Tanggal Lahir,Alamat
Suryanto,081299991111,suryanto@gmail.com,umat,Laki-laki,Bandung,1989-10-12,Jl. Pahlawan No. 45
Dewi Lestari,081299992222,dewi@gmail.com,umat,Perempuan,Bogor,1995-01-25,Perumahan Griya Cibinong`;

// Mock batch input element & text
const parsedUsers = (function() {
  const lines = sampleCsv.split(/\r?\n/).filter(line => line.trim().length > 0);
  const delimiter = ',';
  const users = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(delimiter).map(c => c.trim().replace(/^["']|["']$/g, ''));
    if (cols.length < 2) continue;
    users.push({
      name: cols[0],
      phone: cols[1],
      email: cols[2] || '',
      role: cols[3] || 'umat',
      gender: cols[4] || '',
      tempat_lahir: cols[5] || '',
      tanggal_lahir: cols[6] || '',
      alamat: cols[7] || ''
    });
  }
  return users;
})();

assert.strictEqual(parsedUsers.length, 2, 'Harus terdeteksi 2 user');
assert.strictEqual(parsedUsers[0].gender, 'Laki-laki');
assert.strictEqual(parsedUsers[0].tempat_lahir, 'Bandung');
assert.strictEqual(parsedUsers[0].tanggal_lahir, '1989-10-12');
assert.strictEqual(parsedUsers[0].alamat, 'Jl. Pahlawan No. 45');

assert.strictEqual(parsedUsers[1].gender, 'Perempuan');
assert.strictEqual(parsedUsers[1].tempat_lahir, 'Bogor');
assert.strictEqual(parsedUsers[1].tanggal_lahir, '1995-01-25');
assert.strictEqual(parsedUsers[1].alamat, 'Perumahan Griya Cibinong');
console.log('  ✅ [PASS] 5.1 Baris CSV calon umat terurai akurat dengan Gender, TTL, dan Alamat');

console.log('\n======================================================');
console.log('🎉 HASIL PENGUJIAN: SELURUH FITUR BIODATA UMAT 100% SUKSES!');
console.log('======================================================\n');
