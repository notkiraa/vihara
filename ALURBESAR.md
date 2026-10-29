# Rencana Pengembangan Web App Absensi Vihara

## 1. Ringkasan Proyek
Aplikasi ini adalah sebuah **Progressive Web App (PWA)** yang berfungsi sebagai sistem absensi umat dan buku tamu digital untuk Vihara. Aplikasi ini tidak perlu diunduh dari App Store/Play Store, melainkan diakses melalui *browser* dan dapat ditambahkan ke layar utama HP (*Add to Home Screen*). Validasi kehadiran menggunakan sistem pelacakan lokasi (*Geofencing*).

## 2. Teknologi yang Digunakan (Tech Stack)
*   **Frontend (Kerangka Web):** Next.js
*   **Desain Antarmuka (UI):** Tailwind CSS
*   **Backend & Database:** Firebase (Firestore & Authentication)
*   **Hosting:** Vercel (Gratis & sudah HTTPS)
*   **Fitur Lokasi:** HTML5 Geolocation API + Library `geolib`

## 3. Alur Pengguna (User Flow)

### A. Halaman Awal (Landing Page)
1. Pengguna membuka tautan web app (misal: `absenvihara.com`).
2. Menampilkan dua opsi utama:
   * **Form Login/Daftar** (menggunakan Nomor HP atau Google) untuk Umat.
   * Tombol **"Masuk sebagai Tamu"** untuk pengunjung dari luar.

### B. Alur Umat (Dashboard Pengguna)
1. Umat melakukan *login* (cukup sekali, sesi akan tersimpan permanen).
2. Diarahkan ke halaman **Dashboard Umat**.
3. Sistem secara otomatis meminta izin lokasi dan mengecek titik koordinat HP umat.
4. Jika umat berada di dalam radius Vihara (< 100 meter):
   * Tombol **"Hadir"** berwarna hijau dan dapat ditekan.
5. Jika umat di luar area:
   * Tombol terkunci (abu-abu) dan tidak bisa ditekan.
6. Setelah berhasil menekan "Hadir", riwayat absensi umat akan diperbarui di layar mereka.

### C. Alur Tamu (Guest Mode)
1. Pengunjung menekan tombol **"Masuk sebagai Tamu"** dari Halaman Awal.
2. Diarahkan ke halaman formulir (tanpa perlu *login*).
3. Tamu mengisi **Nama**, **No. Telp**, dan **Domisili**.
4. Sistem memvalidasi lokasi tamu secara otomatis di latar belakang.
5. Tamu menekan tombol **"Hadir"** (tombol ini juga terkunci jika tamu tidak berada di area Vihara).
6. Data terkirim, layar menampilkan pesan "Selamat Datang di Vihara".

### D. Alur Admin (Dashboard Pengelola)
1. Pengurus Vihara *login* menggunakan akun dengan akses `role: admin`.
2. Diarahkan ke **Dashboard Admin**.
3. Menampilkan dua tabel *real-time*:
   * **Tabel Kehadiran Umat:** Menampilkan umat yang sudah terdaftar.
   * **Tabel Buku Tamu:** Menampilkan data tamu luar.
4. Fitur tambahan: Filter berdasarkan tanggal dan tombol *Download* laporan (Excel/CSV).

## 4. Skema Database (Firebase Firestore)

**1. Koleksi `Users`** (Menyimpan profil umat/admin)
* `user_id` (ID Otomatis)
* `nama` (String)
* `no_hp` (String)
* `role` (String: "umat" / "admin")

**2. Koleksi `Log_Umat`** (Merekam absensi dari akun terdaftar)
* `log_id` (ID Otomatis)
* `user_id` (Relasi ke koleksi Users)
* `waktu_absen` (Timestamp)
* `lat_absen` (Latitude lokasi)
* `long_absen` (Longitude lokasi)

**3. Koleksi `Log_Tamu`** (Merekam absensi tanpa akun)
* `guest_id` (ID Otomatis)
* `nama` (String)
* `no_telp` (String)
* `domisili` (String)
* `waktu_absen` (Timestamp)
* `lat_absen` (Latitude lokasi)
* `long_absen` (Longitude lokasi)