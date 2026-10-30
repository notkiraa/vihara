/**
 * ============================================================================
 * SCRIPT: scripts/batch-input-users.js
 * Batch Input Data Umat / Pengguna ke Supabase Database
 * Vihara Amurwa Bhumi Cibinong
 * ============================================================================
 * Petunjuk Penggunaan (Terminal / Command Prompt / PowerShell):
 *   1. Jalankan dengan file CSV:
 *      node scripts/batch-input-users.js data/users.csv
 *
 *   2. Jalankan dengan file JSON:
 *      node scripts/batch-input-users.js data/users.json
 *
 *   3. Jalankan langsung (akan membaca data/users.csv default atau membuat template):
 *      node scripts/batch-input-users.js
 * ============================================================================
 */

const fs = require('fs');
const path = require('path');

// Konfigurasi API Supabase Vihara Amurwa Bhumi Cibinong
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://fsozsqswkbmjlqdnhozi.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_KEY || 'sb_publishable_GxKRB6rsN0IVsrGRR8BTfA_yHc-NGYO';

// Normalisasi nomor telepon ke format standar Indonesia (08...)
function normalizePhone(raw) {
  if (!raw) return '';
  let cleaned = String(raw).replace(/[^0-9]/g, '');
  if (cleaned.startsWith('62')) {
    cleaned = '0' + cleaned.slice(2);
  } else if (!cleaned.startsWith('0') && cleaned.length >= 8) {
    cleaned = '0' + cleaned;
  }
  return cleaned;
}

// Parser sederhana CSV (mendukung koma atau titik koma, dan kutip dua)
function parseCSV(content) {
  const lines = content.split(/\r?\n/).filter(line => line.trim().length > 0);
  if (lines.length < 2) return [];

  // Deteksi pemisah (delimiter): koma atau titik-koma
  const firstLine = lines[0];
  const delimiter = firstLine.includes(';') && !firstLine.includes(',') ? ';' : ',';

  function splitLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === delimiter && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  }

  const rawHeaders = splitLine(lines[0]).map(h => h.toLowerCase().replace(/[^a-z0-9_]/g, ''));
  
  // Mapping index header
  const idxName = rawHeaders.findIndex(h => h.includes('nama') || h.includes('name'));
  const idxPhone = rawHeaders.findIndex(h => h.includes('phone') || h.includes('hp') || h.includes('telp') || h.includes('wa') || h.includes('telepon'));
  const idxEmail = rawHeaders.findIndex(h => h.includes('email') || h.includes('surel'));
  const idxRole = rawHeaders.findIndex(h => h.includes('role') || h.includes('akses') || h.includes('hak'));

  const users = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = splitLine(lines[i]);
    if (cols.length === 0 || cols.every(c => c === '')) continue;

    const name = idxName !== -1 ? cols[idxName] : cols[0];
    const phone = idxPhone !== -1 ? cols[idxPhone] : cols[1];
    const email = idxEmail !== -1 ? cols[idxEmail] : (cols[2] || '');
    const role = idxRole !== -1 ? cols[idxRole] : (cols[3] || 'umat');

    if (name && phone) {
      users.push({
        name: name.trim(),
        phone: normalizePhone(phone),
        email: email.trim() && email.includes('@') ? email.trim().toLowerCase() : null,
        password_hash: '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92',
        must_change_password: true,
        role: role.toLowerCase().includes('admin') || role.toLowerCase().includes('pengurus') ? 'admin' : 'umat'
      });
    }
  }

  return users;
}

// Pengiriman batch ke Supabase PostgreSQL REST API
async function uploadToSupabase(users) {
  if (users.length === 0) {
    console.log('⚠️  Tidak ada data pengguna yang valid untuk dikirim.');
    return;
  }

  console.log(`\n🚀 Mengirim ${users.length} pengguna ke Supabase (${SUPABASE_URL})...`);

  // Kirim dalam pecahan batch (maksimal 50 user per request)
  const CHUNK_SIZE = 50;
  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < users.length; i += CHUNK_SIZE) {
    const chunk = users.slice(i, i + CHUNK_SIZE);
    const chunkIndex = Math.floor(i / CHUNK_SIZE) + 1;
    const totalChunks = Math.ceil(users.length / CHUNK_SIZE);

    process.stdout.write(`   Mengunggah Batch ${chunkIndex}/${totalChunks} (${chunk.length} data)... `);

    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/profiles?on_conflict=phone`, {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'resolution=merge-duplicates,return=representation'
        },
        body: JSON.stringify(chunk)
      });

      if (!response.ok) {
        const errorText = await response.text();
        if (errorText.includes('PGRST204') || errorText.includes('must_change_password') || errorText.includes('password_hash')) {
          // Retry tanpa kolom password jika SQL migration belum dijalankan di Supabase
          const fallbackChunk = chunk.map(u => ({
            name: u.name,
            phone: u.phone,
            email: u.email,
            role: u.role
          }));
          const fallbackRes = await fetch(`${SUPABASE_URL}/rest/v1/profiles?on_conflict=phone`, {
            method: 'POST',
            headers: {
              'apikey': SUPABASE_KEY,
              'Authorization': `Bearer ${SUPABASE_KEY}`,
              'Content-Type': 'application/json',
              'Prefer': 'resolution=merge-duplicates,return=representation'
            },
            body: JSON.stringify(fallbackChunk)
          });
          if (fallbackRes.ok) {
            const inserted = await fallbackRes.json();
            console.log(`✅ BERHASIL via fallback (${inserted.length} data tersimpan).`);
            console.log(`   💡 Catatan: Kolom password_hash belum dibuat di Supabase. Jalankan script supabase/migration_add_user_password.sql di SQL Editor.`);
            successCount += inserted.length;
            continue;
          }
        }
        console.log(`❌ GAGAL: ${errorText}`);
        failCount += chunk.length;
      } else {
        const inserted = await response.json();
        console.log(`✅ BERHASIL (${inserted.length} data tersimpan/diperbarui).`);
        successCount += inserted.length;
      }
    } catch (err) {
      console.log(`❌ ERROR JARINGAN: ${err.message}`);
      failCount += chunk.length;
    }
  }

  console.log('\n============================================================');
  console.log('📊 REKAPITULASI BATCH IMPORT DATA UMAT:');
  console.log(`   - Total Data Diproses : ${users.length}`);
  console.log(`   - Berhasil Tersimpan  : ${successCount}`);
  console.log(`   - Gagal Disimpan      : ${failCount}`);
  console.log('============================================================');
  console.log('✨ Data langsung aktif dan dapat digunakan untuk presensi/login.\n');
}

// Program Utama
async function main() {
  console.log('============================================================');
  console.log('BATCH INPUT DATA UMAT - VIHARA AMURWA BHUMI CIBINONG');
  console.log('============================================================');

  let targetFile = process.argv[2];

  if (!targetFile) {
    // Cari default data/users.csv atau data/users.json
    const defaultCsv = path.join(__dirname, '..', 'data', 'users.csv');
    const defaultJson = path.join(__dirname, '..', 'data', 'users.json');

    if (fs.existsSync(defaultCsv)) {
      targetFile = defaultCsv;
    } else if (fs.existsSync(defaultJson)) {
      targetFile = defaultJson;
    } else {
      // Buat file contoh template data/users_template.csv jika belum ada
      const dataDir = path.join(__dirname, '..', 'data');
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }

      const templatePath = path.join(dataDir, 'users_template.csv');
      const sampleCSV = `name,phone,email,role
Budi Santoso,081211112222,budi@gmail.com,umat
Suryani Wijaya,081233334444,suryani@gmail.com,umat
Hendrik Pratama,081255556666,hendrik@gmail.com,umat
Vincen Tan,081277778888,vincen@amurwabhumi.or.id,admin
Meilani Chen,081299990000,meilani@gmail.com,umat
`;
      fs.writeFileSync(templatePath, sampleCSV, 'utf8');

      console.log('ℹ️  File input belum ditentukan.');
      console.log(`📄 Template contoh berhasil dibuat di: ${templatePath}`);
      console.log('\nCara Menggunakan:');
      console.log('1. Buka file "data/users_template.csv" dan masukkan daftar nama & nomor HP.');
      console.log('2. Jalankan perintah:');
      console.log('   node scripts/batch-input-users.js data/users_template.csv\n');
      return;
    }
  }

  const resolvedPath = path.resolve(process.cwd(), targetFile);
  if (!fs.existsSync(resolvedPath)) {
    console.error(`❌ File tidak ditemukan: ${resolvedPath}`);
    process.exit(1);
  }

  console.log(`📁 Membaca file: ${resolvedPath}`);
  const content = fs.readFileSync(resolvedPath, 'utf8');

  let users = [];
  if (resolvedPath.endsWith('.json')) {
    try {
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed)) {
        users = parsed.map(u => ({
          name: (u.name || '').trim(),
          phone: normalizePhone(u.phone),
          email: u.email && u.email.includes('@') ? u.email.trim().toLowerCase() : null,
          password_hash: u.password_hash || '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92',
          must_change_password: u.must_change_password !== false,
          role: u.role === 'admin' ? 'admin' : 'umat'
        })).filter(u => u.name && u.phone);
      }
    } catch (e) {
      console.error('❌ Format JSON tidak valid:', e.message);
      process.exit(1);
    }
  } else {
    users = parseCSV(content);
  }

  console.log(`📋 Berhasil mem-parsing ${users.length} baris data calon umat.`);
  if (users.length > 0) {
    console.log('🔍 Contoh 3 data pertama:');
    users.slice(0, 3).forEach((u, i) => {
      console.log(`   [${i + 1}] ${u.name} | HP: ${u.phone} | Email: ${u.email || '-'} | Role: ${u.role}`);
    });
  }

  await uploadToSupabase(users);
}

main().catch(err => {
  console.error('Fatal Error:', err);
});

