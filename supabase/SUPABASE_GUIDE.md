# ☸️ Panduan Integrasi Database Supabase
### Vihara Amurwa Bhumi Cibinong

Dokumen ini memandu langkah demi langkah penerapan database PostgreSQL berbasis **Supabase** untuk aplikasi web presensi umat, buku tamu digital, dan warta pengumuman Vihara Amurwa Bhumi Cibinong.

---

## 📑 Daftar Isi
1. [Struktur Entitas & Skema Tabel](#1-struktur-entitas--skema-tabel)
2. [Langkah Penerapan di Supabase Dashboard](#2-langkah-penerapan-di-supabase-dashboard)
3. [Keamanan & Akses Data (Row Level Security / RLS)](#3-keamanan--akses-data-row-level-security--rls)
4. [Storage Buckets (Media & Banner)](#4-storage-buckets-media--banner)
5. [Otomatisasi Database & Auto-Arsip](#5-otomatisasi-database--auto-arsip)
6. [Contoh Kode Integrasi Frontend (JavaScript)](#6-contoh-kode-integrasi-frontend-javascript)

---

## 1. Struktur Entitas & Skema Tabel

File DDL lengkap tersedia di: [`supabase/schema.sql`](file:///c:/AKU_NYOBA/appvihara/supabase/schema.sql)

| Tabel | Deskripsi | Kunci Utama (PK) | Relasi & Catatan |
|---|---|---|---|
| `profiles` | Data Umat & Pengurus Admin | `id (UUID)` | Terhubung ke `auth.users(id)`. Menyimpan `phone`, `role ('admin'/'umat')`, dan `avatar_url`. |
| `events` | Jadwal Acara & Kebaktian | `id (TEXT)` | Menyimpan `date`, `start_time`, `end_time`, `speaker`, dan `is_active`. |
| `attendance` | Log Presensi Kehadiran Umat | `id (UUID)` | Relasi ke `events(id)` dan `profiles(id)`. Unik per user per acara. |
| `guests` | Buku Tamu Kunjungan Luar | `id (UUID)` | Relasi ke `events(id)`. Terbuka untuk umum (anonim). |
| `announcements` | Warta & Pengumuman Vihara | `id (TEXT)` | Kategori (`Kegiatan Kebaktian`, `Bakti Sosial`, `Dhamma & SMB`, dll), judul, teks, dan banner. |

---

## 2. Langkah Penerapan di Supabase Dashboard

1. **Buat Proyek Baru**:
   - Kunjungi [https://supabase.com](https://supabase.com) dan login/daftar.
   - Klik **New Project**, beri nama: `vihara-amurwa-bhumi-cibinong`.
   - Pilih region terdekat: `Singapore (ap-southeast-1)`.
   - Tetapkan database password yang aman. WABCGACOR2026

2. **Jalankan Skrip SQL Migration**:
   - Di menu sebelah kiri Supabase Dashboard, klik icon **SQL Editor**.
   - Buka file [`supabase/schema.sql`](file:///c:/AKU_NYOBA/appvihara/supabase/schema.sql) di text editor Anda.
   - Salin seluruh isi skrip dan tempel ke dalam **SQL Editor**.
   - Klik tombol **Run** (atau tekan `Ctrl + Enter`).
   - Semua tabel, enum, indeks, fungsi trigger, dan RLS policies akan langsung terbentuk secara otomatis.

3. **Verifikasi Tabel & Status RLS**:
   - Buka menu **Table Editor** di sidebar kiri.
   - Tabel `announcements`, `attendance`, `events`, `guests`, dan `profiles` akan muncul dengan ikon `🌐` di sampingnya. Ikon bola dunia (`🌐`) menandakan tabel berada dalam schema **`public`** (sudah benar 100%).
   - Klik salah satu tabel tersebut (misalnya `events` atau `profiles`). Di bagian **kanan atas layar**, Anda akan melihat badge bertuliskan **`RLS enabled`**.
   - Untuk melihat aturan keamanan lengkapnya, buka menu **Authentication** > **Policies** di sidebar kiri. Semua aturan (Insert, Select, Update, Delete) sudah aktif dan siap digunakan.

---

## 3. Keamanan & Akses Data (Row Level Security / RLS)

Sistem telah dilengkapi proteksi tingkat baris (*Row Level Security*) ketat:

- **Pengunjung Umum (Publik / Tamu)**:
  - Dapat melihat pengumuman resmi yang aktif (`is_published = true`).
  - Dapat melihat jadwal acara kebaktian.
  - Dapat mengirim formulir buku tamu (`guests`).
- **Umat Terdaftar**:
  - Dapat melihat profil mereka sendiri dan memperbarui data kontak.
  - Dapat melakukan presensi mandiri pada acara yang sedang aktif.
  - Dapat melihat riwayat kehadiran pribadi.
- **Pengurus Vihara (Admin)**:
  - Memiliki hak akses penuh (*CRUD*) untuk membuat/mengedit/menghapus acara kebaktian.
  - Mengelola warta pengumuman beserta banner.
  - Membuka popup absensi, mencari umat, mencatat kehadiran, dan mengekspor CSV.

---

## 4. Storage Buckets (Media & Banner)

Skrip SQL secara otomatis membuat 2 storage bucket publik:
1. `announcement-banners`: Tempat penyimpanan foto banner pengumuman warta kegiatan.
2. `avatars`: Tempat penyimpanan foto profil umat / pengurus.

Akses publik diberikan untuk membaca (*read*), sementara hak unggah (*write/delete*) dibatasi khusus pengurus vihara (`role = 'admin'`).

---

## 5. Otomatisasi Database & Auto-Arsip

### Fungsi Auto-Arsip Acara Lewat Waktu
Database memiliki fungsi SQL `public.archive_expired_events()`:
```sql
SELECT public.archive_expired_events();
```
Fungsi ini otomatis menonaktifkan status `is_active = false` untuk seluruh jadwal yang tanggal atau jam selesainya telah lewat, sehingga kebaktian otomatis pindah ke arsip.

Untuk menjalankannya secara terjadwal otomatis (misal setiap 15 menit), Anda dapat mengaktifkan ekstensi `pg_cron` di Supabase:
```sql
SELECT cron.schedule(
    'auto-archive-events-every-15m',
    '*/15 * * * *',
    'SELECT public.archive_expired_events();'
);
```

---

## 6. Contoh Kode Integrasi Frontend (JavaScript)

Tambahkan SDK Supabase ke `index.html`:
```html
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
```

Inisialisasi client Supabase:
```javascript
const SUPABASE_URL = 'https://YOUR_PROJECT_ID.supabase.co';
const SUPABASE_ANON_KEY = 'YOUR_ANON_KEY';
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Contoh: Mengambil acara kebaktian yang sedang aktif
async function fetchActiveEvent() {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('is_active', true)
    .single();
  
  if (error) console.error('Gagal mengambil acara aktif:', error);
  return data;
}

// Contoh: Umat melakukan presensi
async function checkinAttendance(eventId, userId) {
  const { data, error } = await supabase
    .from('attendance')
    .insert([{
      event_id: eventId,
      user_id: userId,
      method: 'self_checkin'
    }]);

  if (error) throw error;
  return data;
}
```

