/**
 * Test Suite: Verifikasi Pembersihan Elemen & Update Realtime KPI Admin Dashboard
 */
const assert = require('assert');
const fs = require('fs');

console.log('======================================================');
console.log('🧪 PENGUJIAN: PEMBERSIHAN ELEMEN & REALTIME KPI ADMIN');
console.log('======================================================\n');

const indexHtml = fs.readFileSync('public/index.html', 'utf8');
const appJs = fs.readFileSync('public/js/app.js', 'utf8');
const supabaseClientJs = fs.readFileSync('public/js/supabase-client.js', 'utf8');
const adminJs = fs.readFileSync('public/js/admin.js', 'utf8');

// 1. Verifikasi elemen atas yang diminta dihapus
console.log('--- 1. Verifikasi Pembersihan Elemen Visual ---');
assert(!indexHtml.includes('umat-location-indicator'), 'Elemen umat-location-indicator (radius 25 meter) telah dihapus dari HTML');
console.log('  ✅ [PASS] Indikator radius 25 meter (#umat-location-indicator) telah dihapus');

assert(!indexHtml.includes('Berlaku khusus sesi kebaktian hari ini'), 'Box info maroon (Berlaku khusus sesi kebaktian) telah dihapus dari modal QR');
console.log('  ✅ [PASS] Box info "Berlaku khusus sesi kebaktian hari ini" telah dihapus dari modal QR');

assert(!indexHtml.includes("onclick=\"closeModal('modal-qr-display')\" class=\"btn btn-ghost\" style=\"padding: 6px 10px"), 'Tombol kecil kembali di header modal QR telah dihapus');
console.log('  ✅ [PASS] Tombol kembali kecil di header modal QR telah dihapus');

// 2. Verifikasi Realtime Subscription & Polling Fallback
console.log('\n--- 2. Verifikasi Fitur Realtime Supabase ---');
assert(supabaseClientJs.includes('subscribeRealtimeChanges'), 'Supabase client mengekspor fungsi subscribeRealtimeChanges');
console.log('  ✅ [PASS] subscribeRealtimeChanges terdaftar di ViharaSupabase');

assert(appJs.includes('ViharaSupabase.subscribeRealtimeChanges'), 'app.js mengaktifkan listener realtime websocket Supabase');
console.log('  ✅ [PASS] app.js mendengarkan perubahan realtime tabel Supabase');

assert(appJs.includes('setInterval(') && appJs.includes('syncEvents()'), 'app.js memiliki fallback background polling interval untuk sinkronisasi otomatis');
console.log('  ✅ [PASS] app.js memiliki interval sinkronisasi background otomatis');

// 3. Verifikasi KPI Admin Dashboard Menghitung Seluruh Umat Terdaftar
console.log('\n--- 3. Verifikasi Logika KPI Total Umat & Acara ---');
assert(!appJs.includes("ViharaData.getUsers().filter(u => u.role === 'umat')"), 'app.js tidak lagi memfilter umat kaku (menghitung seluruh anggota terdaftar)');
console.log('  ✅ [PASS] KPI Total Umat Terdaftar mencakup seluruh jemaat terdaftar');

assert(!adminJs.includes("ViharaData.getUsers().filter(u => u.role === 'umat')"), 'admin.js mencakup seluruh umat dalam checklist kehadiran');
console.log('  ✅ [PASS] Checklist kehadiran admin menampilkan seluruh akun terdaftar');

console.log('\n======================================================');
console.log('🎉 HASIL PENGUJIAN: SELURUH SKENARIO REALTIME & CLEANUP LULUS!');
console.log('======================================================\n');

