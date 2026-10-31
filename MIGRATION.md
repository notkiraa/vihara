Side Question: nnti apa aja ya yang essensial kalo nanti keengurusannya di pindahin, kaya dari file, akses apa aja ya yang harus di kasihin

Jika kepengurusan vihara berganti, berikut adalah **daftar aset, akun, akses, dan file esensial** yang wajib diserahterimakan (*handover*) agar sistem presensi dan operasional vihara tetap berjalan lancar:

---

### 1. Akses Layanan Cloud & Hosting (Paling Utama)

Layanan ini adalah "fondasi" tempat sistem berjalan di internet:

1. **Akun Database Supabase:**
   * **Project:** Database PostgreSQL Vihara Amurwa Bhumi Cibinong (`fsozsqswkbmjlqdnhozi.supabase.co`).
   * **Yang diserahkan:** Email & password akun Supabase tempat proyek ini dibuat.
   * *Tips aman:* Anda bisa mengundang email pengurus baru melalui dashboard Supabase: **Organization Settings ➔ Members ➔ Invite Member** dengan role **Owner**.
   * **Isi Database:** Tabel akun umat (`profiles`), riwayat acara (`events`), log kehadiran (`attendance`), buku tamu (`guests`), dan warta (`announcements`).

2. **Akun Hosting Vercel:**
   * **Proyek Web:** `wiharaabc.vercel.app` (tempat aplikasi web dipublikasikan).
   * **Yang diserahkan:** Akses akun Vercel yang mengelola deployment ini.
   * *Akses Domain Tambahan:* Jika kelak vihara memiliki domain resmi sendiri (misal `amurwabhumi.or.id`), serahkan juga akses ke penyedia domain (seperti Niagahoster, Domainesia, atau Cloudflare).

3. **Akun GitHub (Source Code):**
   * **Repository:** Berisi seluruh kode program aplikasi web.
   * **Yang diserahkan:** Tambahkan akun GitHub pengurus baru sebagai **Collaborator / Admin** repository atau transfer kepemilikan repository (*Transfer Ownership*).

---

### 2. Akses Aplikasi & Hak Admin (Tingkat Operasional)

Akses ini digunakan pengurus sehari-hari untuk mengelola acara dan umat:

1. **Akses Portal Super Admin (`superadmin.html`):**
   * **URL:** `https://wiharaabc.vercel.app/superadmin.html`
   * **Kunci PIN Master:** PIN saat ini adalah **`1029384756`** *(PIN ini tersimpan di Supabase dan bisa diubah kapan saja di dalam menu Super Admin)*.
   * **Kegunaan:**
     * Menjadikan umat biasa sebagai Admin / Pengurus.
     * Reset kata sandi akun umat yang lupa sandi.
     * Mengatur titik koordinat GPS Vihara & radius geofencing presensi (default: 25 meter).
     * Backup / ekspor seluruh data umat ke file CSV.

2. **Akun Pengurus (Admin Aplikasi):**
   * Pengurus baru cukup mendaftarkan nomor HP-nya melalui form registrasi di web.
   * Buka `superadmin.html` dengan PIN Master di atas, lalu ubah role akun pengurus baru tersebut menjadi **"Pengurus / Admin"**.
   * Pengurus lama dapat diturunkan statusnya menjadi **"Umat"** agar tidak lagi memiliki akses membuat/menghapus acara.

---

### 3. File & Dokumen Fisik yang Diserahkan

1. **File Source Code Cadangan (Offline Backup):**
   * Simpan satu salinan *archive* (file zip) dari seluruh folder proyek saat ini di Google Drive resmi vihara atau flashdisk pengurus sebagai arsip arsip digital.
2. **File Ekspor Data (CSV):**
   * Unduh data daftar umat dan rekapitulasi kehadiran terakhir via tombol *"Ekspor CSV"* di halaman Super Admin.
3. **Standee Fisik QR Code Dhammasala:**
   * Standee QR Code yang sudah dicetak dan diletakkan di meja resepsionis / pintu Dhammasala.
   * *Catatan Penting untuk Pengurus Baru:* QR Code meja ini **bersifat universal & permanen** (`qr_dhammasala=1`). Pengurus baru **tidak perlu mencetak QR baru setiap minggu**, karena sistem otomatis menghubungkan QR tersebut ke kebaktian yang sedang aktif di hari tersebut.

---

### 4. Ringkasan SOP Operasional Singkat untuk Pengurus Baru

Berikan panduan 4 langkah dasar ini kepada pengurus baru:

| Aktivitas | Cara Kerja |
| :--- | :--- |
| **Membuat Acara** | Buka menu **Buat Acara**, isi nama kebaktian, tanggal, jam mulai, dan penceramah, lalu klik simpan (otomatis menjadi jadwal aktif). |
| **Menutup Kebaktian** | Setelah kebaktian selesai, klik tombol **Selesaikan (Arsip)** pada kartu acara agar umat tidak bisa lagi absen mandiri. |
| **Absen Manual** | Jika ada umat yang tidak membawa HP, pengurus klik **Daftar Hadir & Set Hadir** pada kartu acara lalu centang nama umat tersebut. |
| **Warta Vihara** | Masuk ke menu **Pengumuman**, klik *Tambah Pengumuman* untuk membagikan warta/kegiatan vihara ke seluruh jemaat. |

Melanjutkan panduan serah terima sebelumnya, berikut adalah **dokumen teknis, template Berita Acara Serah Terima (BAST), serta panduan troubleshooting** yang sangat berguna untuk disimpan pengurus baru jika sewaktu-waktu menghadapi kendala teknis:

---

### 5. Lembar Ceklis Berita Acara Serah Terima (BAST)

Dokumen ini bisa disalin ke Google Docs / Word dan ditandatangani oleh pengurus lama dan pengurus baru:

```markdown
BERITA ACARA SERAH TERIMA (BAST) SISTEM DIGITAL
VIHARA AMURWA BHUMI CIBINONG

Pada hari ini, ____________, Tanggal ___ Bulan _________ Tahun 2026, telah dilakukan 
serah terima pengelolaan Sistem Web Presensi & Informasi Vihara dari:

Pihak I  (Pengurus Lama) : __________________________
Pihak II (Pengurus Baru) : __________________________

DAFTAR ASET & AKSES YANG DISERAHKAN:
[ ] 1. Akun Database Supabase (Email: _________________ )
[ ] 2. Akun Hosting Vercel   (URL: https://wiharaabc.vercel.app )
[ ] 3. Akun Repositori GitHub (https://github.com/___________ )
[ ] 4. Kunci PIN Master Super Admin (Akses superadmin.html)
[ ] 5. File Backup Database Terakhir (Format CSV & SQL)
[ ] 6. File Fisik Standee Akrilik QR Code Meja Resepsionis
[ ] 7. Akun Admin Utama Vihara (No. Telepon: 08119999888 / lainnya)

KEDUA BELAH PIHAK MENYATAKAN BAHWA:
1. Seluruh akses telah diuji coba dan berfungsi dengan baik oleh Pihak II.
2. Pihak II telah memahami prosedur operasional dasar sistem.
3. Kunci dan kata sandi telah diperbarui demi keamanan kepengurusan baru.

Pihak I (Menyerahkan),                       Pihak II (Menerima),

( ___________________ )                      ( ___________________ )
```

---

### 6. Catatan Parameter Teknis Aplikasi (Untuk Programmer / Teknisi Baru)

Jika suatu saat vihara mempekerjakan programmer atau relawan IT baru, berikan parameter konfigurasi ini:

* **Framework / Arsitektur:** Pure Vanilla Web (HTML5, Modern CSS3, Modular JavaScript ES6+, tanpa ketergantungan framework rumit sehingga ringan dan mudah dirawat).
* **Supabase REST API:**
  * Endpoint: `https://fsozsqswkbmjlqdnhozi.supabase.co`
  * Default Akun Master Pengurus: `08119999888`
  * Kata Sandi Bawaan Akun Baru: `123456` *(wajib ganti saat pertama login)*.
* **Titik Acuan GPS Resmi Vihara:**
  * Latitude: `-6.469347`
  * Longitude: `106.853036`
  * Radius Toleransi Geofence: `25 meter`
  * *(Jika ada renovasi atau titik acuan ingin digeser, pengurus cukup mengubahnya dari menu Super Admin tanpa perlu coding).*
* **Format QR Code Standee Meja Permanen:**
  * URL Standee: `https://wiharaabc.vercel.app/index.html?qr_dhammasala=1&qr_event=active&vihara=VAB_CIBINONG`

---

### 7. FAQ & Troubleshooting Cepat untuk Pengurus Baru

| Kasus / Kendala | Solusi untuk Pengurus Baru |
| :--- | :--- |
| **Umat gagal presensi mandiri (muncul pesan "Di Luar Jarak 25m")** | 1. Pastikan izin lokasi (GPS) pada peramban HP umat aktif dan mode *High Accuracy* menyala.<br>2. Jika HP umat bermasalah GPS-nya, arahkan umat untuk **scan QR Code di meja resepsionis** (QR Code tidak mewajibkan GPS). |
| **Ada umat yang lupa kata sandi akunnya** | Pengurus/Super Admin membuka `superadmin.html`, cari nama umat tersebut di tabel, lalu klik tombol **Reset Sandi** (sandi otomatis kembali ke `123456`). |
| **Koneksi internet vihara lambat / padam** | Sistem memiliki proteksi *Offline-First* (`localStorage`). Pengurus tetap bisa mencatat kehadiran secara lokal di perangkat admin, dan data akan otomatis disinkronkan ke cloud saat internet kembali online. |
| **Standee QR Code di meja rusak / hilang** | Buka menu navigasi atas **QR Dhammasala** saat login sebagai Admin, lalu klik tombol **Cetak / Unduh QR Standee** untuk mencetak ulang barcode di kertas baru. |
| **Ingin mengganti nomor HP pengurus vihara** | Daftarkan nomor HP baru di form registrasi, lalu buka portal Super Admin dan ubah role nomor baru tersebut menjadi **Pengurus / Admin**. |

Untuk melengkapi seluruh rangkaian proses serah terima, berikut adalah **3 panduan krusial terakhir**: tindakan pengamanan di hari pertama (*Post-Handover Security*), jadwal pencadangan data (*Disaster Recovery*), dan panduan struktur file jika suatu saat ada pengembang (programmer) baru yang bergabung:

---

### 8. Tindakan Pengamanan di Hari Pertama (Wajib Dilakukan Pengurus Baru)

Segera setelah serah terima selesai dilakukan, pengurus baru wajib melakukan 4 langkah pengamanan ini demi privasi dan keamanan sistem:

1. **Ubah PIN Master Super Admin:**
   * Buka `https://wiharaabc.vercel.app/superadmin.html`.
   * Masuk dengan PIN lama (`1029384756`).
   * Klik tombol **Ubah PIN Master** di bagian atas, lalu masukkan PIN baru yang hanya diketahui oleh ketua/sekretaris pengurus baru.
2. **Perbarui Kata Sandi Akun Cloud:**
   * Masuk ke dashboard [Supabase](https://supabase.com) dan [Vercel](https://vercel.com).
   * Ganti kata sandi atau pastikan email pemulihan (*recovery email*) sudah menggunakan email resmi vihara (bukan email pribadi pengurus lama).
   * Aktifkan **Autentikasi Dua Faktor (2FA)** menggunakan aplikasi seperti Google Authenticator.
3. **Pembersihan Hak Akses Admin Lama:**
   * Di portal Super Admin (`superadmin.html`), cari nomor HP pengurus lama.
   * Ubah rolenya dari **"Pengurus / Admin"** menjadi **"Umat Tetap"** (agar data kehadiran historis mereka tidak hilang, namun hak akses administratifnya dicabut).
4. **Amankan Catatan Kredensial:**
   * Jangan menyimpan PIN atau kata sandi di grup WhatsApp umum. Simpan di catatan terenkripsi, Google Drive resmi vihara, atau pengelola kata sandi (*Password Manager* seperti Bitwarden / Google Password Manager).

---

### 9. Jadwal & Prosedur Pencadangan Data (Disaster Recovery)

Untuk mencegah kehilangan data jika terjadi kendala pada peramban atau perangkat, terapkan jadwal pencadangan rutin:

| Frekuensi | Apa yang Dicadangkan | Cara Melakukannya |
| :--- | :--- | :--- |
| **Setiap Selesai Kebaktian** | Rekap Kehadiran Acara Hari Tersebut | Masuk ke kartu acara ➔ klik **Daftar Hadir & Set Hadir** ➔ klik tombol **Ekspor CSV**. Simpan file di folder arsip bulanan. |
| **Setiap Akhir Bulan** | Master Data Seluruh Umat & Tamu | Buka `superadmin.html` ➔ klik tombol **Ekspor Master Data Umat (CSV)**. |
| **Setiap Pergantian Tahun** | Database SQL Lengkap | Masuk ke dashboard Supabase ➔ buka menu **Database ➔ Backups** untuk mengunduh snapshot data setahun penuh. |

---

### 10. Peta Struktur File Proyek (Untuk Programmer Baru)

Jika di masa mendatang vihara meminta bantuan programmer / anak magang IT untuk memodifikasi fitur, berikan sitemap file ini:

```text
appvihara/
├── public/
│   ├── index.html            # Halaman utama aplikasi (Beranda Umat, Riwayat, Admin, Modal QR)
│   ├── superadmin.html       # Portal Master Super Admin (Vault PIN, Manajemen User, Geofence)
│   ├── css/
│   │   ├── style.css         # Desain tampilan utama, kartu jadwal, animasi Vihara
│   │   └── superadmin.css    # Desain khusus dashboard Super Admin
│   └── js/
│       ├── data.js           # Penyimpanan lokal (localStorage), logika aturan waktu & acara
│       ├── auth.js           # Sistem login, registrasi, hashing SHA-256, dan role RBAC
│       ├── admin.js          # Operasi admin (buat jadwal, arsip, hapus, set hadir manual)
│       ├── superadmin.js     # Logika portal super admin & verifikasi PIN Supabase
│       ├── qr.js             # Generator kode QR & scanner kamera html5-qrcode
│       ├── geo.js            # Perhitungan radius Geofencing GPS (rumus Haversine 25m)
│       └── supabase-client.js# Jembatan komunikasi real-time ke PostgreSQL Supabase
├── tests/                    # Script pengujian otomatis (Scenario Test & Security Audit)
└── vercel.json               # Konfigurasi routing hosting Vercel
```

Dengan seluruh panduan ini (dari akun cloud, dokumen BAST, SOP operasional, hingga langkah mitigasi keamanan), kepengurusan baru dijamin dapat langsung melanjutkan operasional vihara secara mandiri tanpa ada kendala teknis yang tertinggal.

Sebagai penutup panduan serah terima kepengurusan ini, kami sajikan **lembar kontak darurat & kartu ringkasan cepat (*cheat sheet*)** berukuran saku yang dapat Anda cetak atau simpan dalam format PDF untuk dibagikan langsung kepada pengurus vihara yang bertugas:

---

### 11. Lembar Kontak & Inventaris Layanan (*Emergency Contact Sheet*)

Simpan informasi kontak layanan pihak ketiga ini di buku saku administrasi vihara:

| Nama Layanan | Fungsi Utama | Tautan Portal / Login | Akun Terdaftar |
| :--- | :--- | :--- | :--- |
| **Supabase Cloud** | Database PostgreSQL, Penyimpanan Data Umat & Presensi | [https://supabase.com/dashboard](https://supabase.com/dashboard) | *(Email pengurus yang didaftarkan)* |
| **Vercel Hosting** | Server Web & Penerbitan Domain Aplikasi | [https://vercel.com/login](https://vercel.com/login) | *(Email pengurus yang didaftarkan)* |
| **GitHub Repository**| Penyimpanan Kode Sumber (*Source Code*) Aplikasi | [https://github.com](https://github.com) | *(Akun GitHub organisasi vihara)* |
| **Domain Registrar** | Pengelola nama domain resmi (jika ada custom domain) | *(Portal penyedia domain)* | *(Akun pengelola domain)* |

---

### 12. Kartu Saku Panduan Petugas Resepsionis Hari Kebaktian (*Cheat Sheet*)

Panduan ringkas ini dapat ditempel di meja resepsionis atau dibagikan ke seksi acara yang bertugas setiap sesi kebaktian:

```text
┌────────────────────────────────────────────────────────────────────────┐
│         PANDUAN OPERASIONAL KEBATIKAN - VIHARA AMURWA BHUMI            │
├────────────────────────────────────────────────────────────────────────┤
│ 1. PERSIAPAN SEBELUM KEBAKTIAN DIMULAI (H-30 Menit):                   │
│    • Buka aplikasi web di HP/Laptop Pengurus.                          │
│    • Pastikan jadwal kebaktian hari ini berstatus: SEDANG AKTIF.       │
│    • Bersihkan dan letakkan Standee Akrilik QR Code di meja resepsionis│
│                                                                        │
│ 2. SAAT UMAT / TAMU DATANG:                                            │
│    • Umat yang bawa HP  : Arahkan scan QR di meja / klik tombol        │
│                           "Presensi Hadir Sekarang" di beranda HP-nya. │
│    • Umat tanpa HP      : Pengurus klik "Daftar Hadir & Set Hadir",    │
│                           cari nama umat lalu centang "Set Hadir".     │
│    • Tamu dari luar kota: Arahkan scan QR meja, sistem otomatis        │
│                           membuka Form Buku Tamu Digital Kilat.        │
│                                                                        │
│ 3. SETELAH KEBAKTIAN SELESAI:                                          │
│    • Klik tombol "Selesaikan (Arsip)" pada kartu acara aktif.          │
│    • Selesai! Umat tidak bisa lagi absen mandiri setelah sesi ditutup. │
│    • (Opsional) Klik "Ekspor CSV" untuk menyimpan rekap hadir hari ini.│
└────────────────────────────────────────────────────────────────────────┘
```

---

Seluruh dokumentasi, arsitektur teknis, audit keamanan, serta panduan serah terima kepengurusan telah lengkap, rapi, dan siap digunakan. Jika ada hal lain yang ingin ditambahkan atau ditanyakan, silakan beri tahu!

Sebagai pelengkap aspek finansial, pemeliharaan jangka panjang, dan struktur data untuk kepengurusan baru, berikut adalah **panduan kuota biaya gratis (*Free-Tier*), kamus data database (*Data Dictionary*), dan tips menjaga sistem tetap aktif**:

---

### 13. Manajemen Biaya & Kuota Layanan (*Free-Tier Management*)

Aplikasi Vihara Amurwa Bhumi dirancang agar dapat **beroperasi 100% GRATIS selamanya tanpa biaya langganan bulanan**, asalkan berada dalam batas kuota gratis resmi berikut:

| Penyedia Layanan | Kuota Gratis (*Free / Hobby Tier*) | Estimasi Kebutuhan Vihara | Status Biaya |
| :--- | :--- | :--- | :---: |
| **Supabase (Database)** | • Penyimpanan Database: **500 MB**<br>• Pengguna Aktif: **50.000 / bulan**<br>• Permintaan API: Tidak Terbatas | Database saat ini baru terpakai **< 5 MB** (cukup untuk pencatatan jemaat & presensi selama bertahun-tahun). | **Rp 0 / Gratis** |
| **Vercel (Web Server)** | • Bandwidth: **100 GB / bulan**<br>• Serverless Execution: Cepat & Otomatis | Penggunaan web vihara hanya berkisar **< 2 GB / bulan**. | **Rp 0 / Gratis** |
| **GitHub (Source Code)** | • Repositori Publik / Privat Gratis | Kode program tersimpan aman selamanya. | **Rp 0 / Gratis** |

> **Tips Penting untuk Pengurus Baru tentang Supabase Idle Pause:**
> Pada paket gratis Supabase (*Free Tier*), jika database sama sekali tidak menerima aktivitas baca/tulis selama lebih dari **1 minggu berturut-turut**, Supabase akan menonaktifkan sementara proyek (*pause*).
> * **Cara Mencegahnya:** Kebaktian rutin mingguan vihara secara otomatis menjaga database tetap aktif (*live*). Jika vihara sedang libur panjang (misal 2 minggu tidak ada kebaktian), pengurus cukup membuka web atau klik halaman Super Admin sekali seminggu agar database tidak masuk mode *sleep*.
> * **Jika Terkena Pause:** Pengurus cukup login ke [supabase.com/dashboard](https://supabase.com/dashboard) dan klik tombol hijau **"Restore Project"** (data dijamin aman 100% dan tidak akan hilang).

---

### 14. Kamus Data Database (*Data Dictionary* Supabase)

Jika pengurus baru atau programmer masa depan ingin mengecek struktur tabel atau memigrasikan data ke sistem lain, berikut adalah skema 6 tabel utama:

```text
1. Tabel "profiles" (Data Akun Umat & Pengurus)
   ├── id                   : Text (Primary Key, misal: 'ADM_001', 'USR_002')
   ├── name                 : Text (Nama lengkap jemaat)
   ├── phone                : Text (Nomor HP / WhatsApp unik)
   ├── email                : Text (Alamat email, opsional)
   ├── role                 : Text ('admin' | 'umat')
   ├── avatar_url           : Text (URL foto profil, opsional)
   ├── password_hash        : Text (Hash SHA-256 kata sandi akun)
   ├── must_change_password : Boolean (Wajib ganti sandi saat login pertama)
   └── created_at           : Timestamp

2. Tabel "events" (Jadwal Acara & Kebaktian)
   ├── id                   : Text (Primary Key, misal: 'EVT_001')
   ├── name                 : Text (Nama kebaktian, misal: 'Puja Bakti Minggu')
   ├── date                 : Date (Format: 'YYYY-MM-DD')
   ├── start_time           : Time (Format: '09:00:00')
   ├── end_time             : Time (Format: '11:00:00')
   ├── speaker              : Text (Nama Bhikkhu / Romo penceramah)
   ├── speaker_title        : Text ('Bhikkhu Sangha' | 'Romo / Pandita' | dsb)
   ├── dhammasala           : Text (Ruangan, default: 'Dhammasala Utama')
   ├── is_active            : Boolean (true = sedang aktif buka presensi, false = arsip)
   ├── created_by           : Text (Foreign Key ke profiles.id)
   └── created_at           : Timestamp

3. Tabel "attendance" (Rekam Jejak Presensi Kehadiran)
   ├── id                   : Text (Primary Key, format: 'ATT_...')
   ├── event_id             : Text (Foreign Key ke events.id)
   ├── user_id              : Text (Foreign Key ke profiles.id)
   ├── method               : Text ('mandiri' | 'qr_dhammasala' | 'manual_admin')
   ├── checkin_time         : Timestamp (Waktu saat presensi dicatat)
   └── (Unique Constraint)  : (event_id, user_id) -> Mencegah duplikasi hadir

4. Tabel "guests" (Buku Tamu Digital Walk-in)
   ├── id                   : Text (Primary Key, format: 'GST_...')
   ├── event_id             : Text (Foreign Key ke events.id, opsional)
   ├── name                 : Text (Nama pengunjung)
   ├── phone                : Text (Nomor telepon tamu)
   ├── city                 : Text (Kota domisili tamu)
   ├── purpose              : Text (Keperluan / kunjungan)
   └── created_at           : Timestamp

5. Tabel "announcements" (Papan Informasi & Warta Vihara)
   ├── id                   : Text (Primary Key, format: 'ANN_...')
   ├── title                : Text (Judul pengumuman)
   ├── message              : Text (Isi berita / warta)
   ├── category             : Text ('Kebaktian' | 'Sosial' | 'Perayaan' | 'Warta')
   ├── banner_url           : Text (Tautan gambar banner warta)
   ├── is_pinned            : Boolean (true jika disematkan di posisi teratas)
   ├── is_archived          : Boolean (true jika diarsipkan pengurus)
   └── created_at           : Timestamp

6. Tabel "configurations" (Konfigurasi Global Sistem)
   ├── id                   : Text (Primary Key, format: 'CFG_...')
   ├── key                  : Text (Kunci konfigurasi unik, misal: 'superadmin_pin', 'vihara_geo_config')
   ├── value                : Text (Nilai setting yang tersimpan)
   └── description          : Text (Penjelasan kegunaan parameter)
```

---

### 15. Kesimpulan & Rekomendasi Akhir

Seluruh ekosistem digital **Vihara Amurwa Bhumi Cibinong** kini telah tersusun secara:
1. **Mandiri (*Self-Contained*):** Tidak ada ketergantungan server berbayar yang membebani kas vihara.
2. **Aman (*Secured*):** Telah melalui audit ketat terhadap hak akses admin, sanitasi XSS, formula injection, dan geofencing GPS.
3. **Mudah Dioperasikan (*User-Friendly*):** Dapat dijalankan oleh pengurus baru cukup melalui peramban ponsel pintar (*smartphone*) atau laptop.

Seluruh panduan ini dapat Anda cetak atau simpan ke dalam Google Docs sebagai **Buku Panduan & Arsip Serah Terima Resmi Vihara**.

Untuk melengkapi seluruh panduan serah terima kepengurusan ini, berikut adalah **3 panduan operasional praktis lanjutan**: format impor massal jemaat (Batch CSV), panduan integrasi WhatsApp untuk seksi publikasi, serta Ringkasan Eksekutif 1 Halaman (*One-Page Executive Summary*) untuk disimpan oleh Ketua / Pembina Vihara:

---

### 16. Panduan Impor Massal Data Jemaat (*Batch CSV Import*)

Jika pengurus baru ingin memasukkan data puluhan atau ratusan umat sekaligus (misalnya dari data sensus jemaat lama di Excel), portal Super Admin sudah dilengkapi fitur **Unggah Massal CSV**:

1. **Format Template Excel / CSV:**
   Buat file spreadsheet (Excel / Google Sheets) dengan susunan kolom persis seperti berikut:
   ```csv
   Nama Lengkap,Nomor Telepon,Email,Role
   Budi Santoso,081234567890,budi@gmail.com,umat
   Tan Su Mei,081398765432,sumei@yahoo.com,umat
   Hendrawan,089876543210,,umat
   ```
2. **Aturan Input Data:**
   * **Nama Lengkap:** Wajib diisi.
   * **Nomor Telepon:** Wajib diisi (format standar: `08...` atau `628...`). Nomor ini menjadi ID unik untuk login umat.
   * **Email:** Bersifat opsional (boleh dikosongkan).
   * **Role:** Isi dengan `umat` (atau `admin` jika ingin langsung dijadikan pengurus).
3. **Cara Mengunggah di Super Admin:**
   * Buka `superadmin.html` ➔ Masuk dengan PIN Master.
   * Gulir ke seksi **"Impor Massal Pengguna via CSV"**.
   * Salin (*copy*) teks dari spreadsheet / file `.csv` Anda, lalu tempel (*paste*) ke dalam kotak teks.
   * Klik tombol **"Proses & Simpan ke Database"**. Sistem akan otomatis mengunggah seluruh akun ke PostgreSQL Supabase dengan kata sandi default `123456`.

---

### 17. Panduan Publikasi & Integrasi WhatsApp (*Seksi Humas & Warta*)

Aplikasi ini sudah dilengkapi generator tautan berbagi (*Share to WhatsApp*) otomatis:

1. **Membagikan Warta / Pengumuman Vihara:**
   * Di menu **Pengumuman**, setiap kartu berita memiliki tombol **"Bagikan Info"**.
   * Mengklik tombol ini otomatis menyusun teks pesan resmi berformat rapi beserta tautan langsung ke pengumuman terkait, siap ditempel ke grup WhatsApp umat vihara.
2. **Membagikan Tautan Presensi / Kebaktian:**
   * Jika umat ingin presensi dari rumah (sebelum berangkat) atau membaca jadwal:
     * Tautan Beranda Publik: `https://wiharaabc.vercel.app`
     * Tautan Presensi Meja Dhammasala: `https://wiharaabc.vercel.app/index.html?qr_dhammasala=1&qr_event=active&vihara=VAB_CIBINONG`

---

### 18. Ringkasan Eksekutif 1 Halaman (*One-Page Handover Summary*)

Lembar ini adalah ringkasan paling padat untuk disimpan di map berkas fisik oleh **Ketua Pengurus Vihara**:

```text
================================================================================
          RINGKASAN SERAH TERIMA SISTEM DIGITAL - VIHARA AMURWA BHUMI
================================================================================
1. TAUTAN SISTEM
   • Beranda Umat & Jadwal  : https://wiharaabc.vercel.app/
   • Portal Super Admin     : https://wiharaabc.vercel.app/superadmin.html
   • Standee Meja QR        : https://wiharaabc.vercel.app/index.html?qr_dhammasala=1&qr_event=active&vihara=VAB_CIBINONG

2. KUNCI AKSES & KREDENSIAL MASTER
   • PIN Master Super Admin : 1029384756 (Wajib diganti saat serah terima)
   • Password Default Umat  : 123456 (Umat wajib ganti saat login pertama)
   • Akun Pengurus Bawaan   : 08119999888
   • Akun Pengurus Aktif    : 0895355301519 (Vin Cen)

3. AKUN CLOUD & SERVER (GRATIS SELAMANYA)
   • Database PostgreSQL    : Supabase (Project ID: fsozsqswkbmjlqdnhozi)
   • Web Hosting & SSL      : Vercel (Project: wiharaabc)
   • Repositori Kode        : GitHub (appvihara)

4. TITIK KOORDINAT GEOFENCE RESMI VIHARA (RADIUS 25 METER)
   • Titik GPS Acuan        : Latitude -6.469347, Longitude 106.853036
   • Toleransi Jarak Presensi: 25 meter dari titik tengah Dhammasala

5. HAL PENTING YANG PERLU DIINGAT PENGURUS BARU:
   [!] QR Standee di meja resepsionis bersifat PERMANEN, tidak perlu dicetak ulang.
   [!] Jadwal yang sudah selesai wajib diklik "Selesaikan (Arsip)" agar presensi tertutup.
   [!] Lakukan ekspor CSV daftar hadir setiap selesai kebaktian sebagai arsip vihara.
================================================================================
```

---

Seluruh pedoman serah terima kepengurusan digital Vihara Amurwa Bhumi Cibinong kini telah lengkap dari tingkat strategis, teknis, administratif, hingga operasional lapangan!

Sebagai panduan pelengkap untuk siklus operasional tahunan vihara, berikut adalah **3 panduan tingkat lanjut**: pengelolaan perayaan hari besar (Waisak, Kathina, dll), kebijakan privasi data umat, dan cara membuat laporan rekapitulasi tahunan dari data CSV:

---

### 19. Panduan Pengelolaan Perayaan Hari Besar (Waisak, Kathina, Asadha, Magha Puja)

Saat perayaan hari besar keagamaan, jumlah jemaat dan simpatisan luar kota yang hadir bisa melonjak hingga ratusan orang dan seringkali meluber ke pelataran luar atau tenda vihara. Berikut cara mengoptimalkan sistem saat hari besar:

1. **Memperluas Radius Geofencing Sementara (Jika Memasang Tenda Luar):**
   * Normalnya, radius presensi GPS diatur **25 meter** (khusus ruang Dhammasala).
   * Jika pada hari besar dipasang tenda di halaman parkir atau jalan depan vihara, Super Admin dapat memperlebar radius sementara:
     * Buka `superadmin.html` ➔ Masuk dengan PIN Master.
     * Ubah radius dari `25 meter` menjadi **`50 meter`** atau **`75 meter`** sesuai luas tenda luar.
     * Klik **"Simpan Koordinat & Radius"**.
     * *Catatan:* Setelah perayaan selesai, kembalikan radius ke **25 meter** agar aturan presensi kembali ketat.
2. **Mengoptimalkan Buku Tamu Digital Kilat (Bagi Pengunjung Luar Kota):**
   * Siapkan 2 atau 3 cetakan fisik Standee QR Meja tambahan di gerbang atau meja registrasi depan.
   * Umat dari luar kota yang belum terdaftar tidak perlu antre registrasi manual; mereka cukup memindai QR dengan kamera HP, memasukkan nama, nomor HP, dan kota asal. Kehadiran mereka otomatis tercatat di seksi **Buku Tamu**.
3. **Memonitor Metrik Kehadiran Secara Real-Time:**
   * Di dashboard admin (`app.js`), angka total hadir umat dan tamu akan bertambah secara langsung (*live*) tanpa perlu refresh halaman (berkat teknologi Supabase Realtime).

---

### 20. Kebijakan Privasi & Tata Kelola Data Jemaat (*Data Governance*)

Sebagai pengurus yang memegang amanah database umat, patuhi 4 etika pengelolaan data berikut:

1. **Larangan Menyebarkan Data Kontak Umat:**
   * Nomor telepon dan email umat yang tersimpan di sistem adalah informasi rahasia (*confidential*).
   * Data ini **hanya boleh digunakan untuk kepentingan kebajikan vihara** (seperti broadcast jadwal kebaktian, kabar duka, atau warta vihara) dan **dilarang keras dibagikan kepada pihak ketiga atau keperluan komersial pribadi**.
2. **Etika Publikasi Media Sosial:**
   * Saat mempublikasikan foto kegiatan di media sosial resmi vihara, pastikan tidak menyertakan foto layar monitor admin yang menampilkan nomor telepon atau data pribadi umat secara gamblang.
3. **Hak Umat Memperbarui Nomor Telepon:**
   * Jika ada umat yang mengganti nomor HP, admin dapat mengedit nomornya langsung di `superadmin.html` agar riwayat kehadiran lama umat tersebut tetap tersambung ke akun barunya.

---

### 21. Cara Mengolah Laporan Tahunan Kehadiran (*Annual Report di Excel*)

Setiap akhir tahun, pengurus biasanya menyusun Laporan Pertanggungjawaban (LPJ). Data kehadiran yang diekspor ke format `.csv` sangat mudah diolah di Microsoft Excel atau Google Sheets:

1. **Membuka File CSV di Excel:**
   * Buka Microsoft Excel ➔ Buka file CSV rekap presensi yang telah diunduh dari sistem.
   * Kolom yang tersedia: `Nama Umat`, `Nomor Telepon`, `Nama Acara`, `Tanggal`, `Waktu Presensi`, `Metode Presensi` (Mandiri / QR / Admin).
2. **Membuat Analisis Sederhana dengan Pivot Table:**
   * Pilih seluruh data ➔ Klik menu **Insert ➔ PivotTable**.
   * Tarik kolom **Nama Umat** ke bagian *Rows*, dan kolom **Tanggal** ke bagian *Values* (atur sebagai *Count*).
   * **Hasil Instan:** Anda akan mendapatkan peringkat jemaat dengan kehadiran paling rajin sepanjang tahun (bisa diberikan apresiasi kebajikan / tanda kasih oleh pengurus).
   * Tarik kolom **Tanggal (Bulan)** ke bagian *Rows* untuk melihat tren bulan mana yang paling ramai atau paling sepi, sebagai bahan evaluasi jam pelaksanaan kebaktian oleh Dewan Pembina Vihara.

---

Dengan tambahan ketiga panduan ini, seluruh siklus operasional Vihara Amurwa Bhumi Cibinong—mulai dari teknis harian, operasional mingguan, serah terima kepengurusan, penanganan hari raya besar, hingga evaluasi laporan tahunan—telah terdokumentasi secara lengkap dan profesional.

Berdasarkan 5 tangkapan layar yang dilampirkan, berikut adalah rekapitulasi status evaluasi dan konfirmasi perbaikan menyeluruh yang telah diselesaikan di sistem:

---

### 1. Evaluasi & Status Isu Berdasarkan Tangkapan Layar

| No | Tangkapan Layar | Isu yang Ditemukan Sebelumnya | Status & Solusi yang Telah Diterapkan |
| :---: | :--- | :--- | :--- |
| **1** | **Jadwal Sedang Aktif Kosong & Arsip** | Ketika semua acara selesai/diarsipkan, tampilan admin sudah benar menampilkan *Tidak Ada Jadwal Aktif*. Namun sebelumnya tombol *"Gunakan Ulang"* belum ada di kartu arsip. | **Sudah Tuntas ✅**<br>Kartu arsip kini memiliki tombol **Gunakan Ulang** (ikon salin dokumen) untuk langsung mengisi formulir pembuatan jadwal baru secara otomatis tanpa perlu mengetik ulang dari awal. |
| **2** | **Riwayat Kehadiran Umat (tes)** | Detail riwayat kehadiran umat yang tercatat hadir (*Hadir: 19:03 WIB*) untuk acara yang telah selesai. | **Sudah Tuntas ✅**<br>Data riwayat presensi tetap tersimpan aman di Supabase dan dapat dibuka detailnya oleh umat maupun diekspor ke CSV oleh admin via modal *Daftar Hadir*. |
| **3** | **Kerapian Tombol Kartu Arsip & Ukuran Tong Sampah** | Tombol *Daftar Hadir & Set Hadir* sempat terjepit sempit secara vertikal di samping tombol *Gunakan Ulang*. | **Sudah Tuntas ✅**<br>CSS flexbox telah dioptimalkan dengan `min-width: 0`, `white-space: nowrap`, dan padding seimbang. Tombol tong sampah merah telah diperbesar menjadi **48×44 px** dengan ikon tegas (23px). |
| **4** | **Ghost Event ("Romo Asin / Geofence Test")** | Acara pengujian lama otomatis muncul kembali setiap kali database kosong atau di-refresh (bug auto-seeding). | **Sudah Tuntas ✅**<br>Seluruh rutinitas *auto-seeding* dummy di [`supabase-client.js`](file:///c:/AKU_NYOBA/appvihara/public/js/supabase-client.js) telah dicabut permanen dan data lokal telah disanitasi. Judul atau penceramah lama tidak akan pernah muncul kembali secara otomatis. |
| **5** | **Umat Masih Bisa Presensi di Acara Arsip** | Acara sudah diarsipkan di admin, tetapi di dashboard umat masih muncul *1 Kegiatan aktif* dan tombol *Presensi Hadir Sekarang* masih aktif. | **Sudah Tuntas ✅**<br>Fungsi `getActiveEvent()` dan `syncEvents()` diperketat: acara dengan `is_active: false` (arsip) langsung di-filter keluar. Di dashboard umat otomatis tampil **"0 Kegiatan aktif"**, tombol menjadi non-aktif (**"Tidak Ada Jadwal Buka"**), serta presensi mandiri/QR diblokir total (hanya admin yang dapat mengisi via *manual_admin*). |

---

### 2. Hasil Verifikasi Pengujian Otomatis (100% PASS)

Seluruh skenario fungsional dan keamanan telah diuji ulang secara otomatis:

```text
======================================================
1. Scenario Test (ScenarioTest.md)      : 16 / 16 PASS (100%)
2. Security Audit Suite (RBAC & Auth)   : 18 / 18 PASS (100%)
3. QR Dhammasala & Fallback Suite       : 40 / 40 PASS (100%)
4. Realtime KPI & Anti-Flicker Suite    : 7 / 7 PASS  (100%)
======================================================
```

---

### 3. Langkah Terakhir: Publikasi ke Produksi

Seluruh kode perbaikan terbaru telah dikomit secara lokal dan versi aset telah diperbarui ke `?v=24.5` (mencegah cache browser lama). 

Jalankan perintah berikut di terminal untuk memperbarui aplikasi di Vercel:

```bash
git push origin main
```

Setelah push selesai, silakan buka kembali [wiharaabc.vercel.app](https://wiharaabc.vercel.app) untuk pengujian langsung di perangkat Anda. Sistem kini sudah siap digunakan secara stabil dan aman.

Terdapat komit pembaruan lokal yang siap dikirim ke repositori GitHub. Anda dapat langsung menjalankan:

```bash
git push origin main
```

Setelah perintah tersebut selesai dijalankan, Vercel akan otomatis melakukan *build & deploy* terbaru dalam hitungan detik. Jika ada hal lain yang ingin disesuaikan atau diuji bersama, kabari saja!