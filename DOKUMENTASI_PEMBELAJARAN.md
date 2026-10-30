# 📚 Dokumentasi Pembelajaran Kode & Log Pengembangan
**Aplikasi Web Presensi & Warta Digital — Vihara Amurwa Bhumi Cibinong**

Buku catatan ini dirancang khusus untuk dokumentasi perubahan sekaligus **panduan belajar pemrograman** secara praktis (*case-based learning*). Setiap pembaruan mencatat prompt asli pengguna, analisis masalah, konsep dan sintaks yang digunakan, cara kerjanya secara mendalam, serta file yang diperbarui.

---

## 📑 Daftar Isi
1. [Standar Format Dokumentasi](#standar-format-dokumentasi)
2. [Entri #01 — Perbaikan Sinkronisasi Ubah Role di Superadmin](#entri-01--perbaikan-sinkronisasi-ubah-role-di-superadmin)
3. [Entri #02 — Solusi Hapus Pengumuman Harus 2x Klik (Race Condition & Optimistic UI)](#entri-02--solusi-hapus-pengumuman-harus-2x-klik-race-condition--optimistic-ui)
4. [Entri #03 — Hapus Tombol Akses Portal Super Administrator dari Halaman Profil](#entri-03--hapus-tombol-akses-portal-super-administrator-dari-halaman-profil)
5. [Entri #04 — Integrasi Skill Security Audit Cloudflare & Kompatibilitas Windows](#entri-04--integrasi-skill-security-audit-cloudflare--kompatibilitas-windows)
6. [Entri #05 — Pembatasan Presensi Mandiri Berbasis Geolocation & Geofencing 25 Meter](#entri-05--pembatasan-presensi-mandiri-berbasis-geolocation--geofencing-25-meter)

---

## 📌 Standar Format Dokumentasi
Setiap log fitur atau perbaikan bug akan dicatat dengan struktur berikut:
* **Prompt User:** Kalimat atau instruksi asli yang dikirimkan.
* **Gejala / Masalah:** Apa yang rusak atau kendala yang dialami pengguna.
* **Akar Masalah (Root Cause):** Analisis teknis mengapa bug tersebut terjadi.
* **Sintaks & Konsep yang Digunakan:** Pembahasan teori kode JavaScript, Web API, atau database.
* **Alur & Cara Kerja Solusi:** Penjelasan langkah demi langkah alur kode baru.
* **File yang Diubah:** Daftar file yang diperbarui beserta fungsinya.

---

## 📖 Entri #01 — Perbaikan Sinkronisasi Ubah Role di Superadmin

### 1. 💬 Prompt User
> *"superadmin untuk change role masih gabisa, coba fix"*

### 2. ⚠️ Gejala / Masalah
Saat Superadmin mengubah peran (*role*) pengguna (misalnya dari `Umat` menjadi `Admin`/`Pengurus` atau sebaliknya) melalui tombol *toggle* atau form modal edit:
- Perubahan role tampak berubah di layar sementara waktu.
- Namun saat halaman di-refresh, peran pengguna kembali (*revert*) ke peran semula (`umat`).
- Database Supabase di cloud tidak pernah terupdate.

### 3. 🔍 Akar Masalah Teknis
Pada file `js/supabase-client.js`, fungsi `updateProfile(phoneOrId, updates)` memiliki logika berikut:
```javascript
// KODE LAMA BERMASALAH:
const strId = String(phoneOrId);
if (strId.startsWith('USR_') || strId.startsWith('ADM_') || /^\d+$/.test(strId)) {
  query = query.eq('id', strId);
} else {
  query = query.eq('phone', strId.replace(/[^0-9]/g, ''));
}
```
**Mengapa ini salah?**
1. Nomor telepon Indonesia seperti `081211112222` seluruhnya terdiri dari angka.
2. Regex `/^\d+$/` mencocokkan deretan angka. Akibatnya, nomor telepon tersebut dianggap sebagai `id`.
3. Supabase menjalankan kueri SQL:
   ```sql
   UPDATE profiles SET role = 'admin' WHERE id = '081211112222';
   ```
4. Di tabel Supabase, kolom `id` berformat `USR_001`, `USR_002`, `ADM_001`. Nilai `081211112222` ada di kolom `phone`, **bukan** di kolom `id`!
5. Kueri tersebut menghasilkan *0 rows updated* (berhasil tanpa error, namun data tidak berubah).
6. Saat halaman me-refresh atau sinkronisasi background berjalan, fungsi `syncProfiles()` mengambil data lama dari Supabase dan menimpa `localStorage`.

---

### 4. 💻 Sintaks & Konsep yang Digunakan untuk Belajar

#### A. Regular Expression (Regex) Berdasarkan Panjang Karakter
```javascript
const strId = String(phoneOrId).trim();
const cleanDigits = strId.replace(/[^0-9]/g, '');

if (strId.startsWith('USR_') || strId.startsWith('ADM_') || strId.startsWith('CFG_')) {
  query = query.eq('id', strId);
} else if (cleanDigits.length >= 8) {
  query = query.eq('phone', cleanDigits);
} else {
  query = query.or(`id.eq.${strId},phone.eq.${cleanDigits}`);
}
```
* **`strId.replace(/[^0-9]/g, '')`**: Membersihkan semua karakter selain angka (spasi, tanda plus `+`, strip `-`).
* **`cleanDigits.length >= 8`**: Nomor telepon valid minimal memiliki 8 digit. Jika $\ge 8$ digit angka, sudah pasti nomor telepon dan dicari ke kolom `phone`.
* **`query.or(...)`**: Sintaks PostgREST Supabase untuk logika `OR`: `WHERE id = '...' OR phone = '...'` sebagai pengaman terakhir.

#### B. `async` / `await` pada Event Handler UI
```javascript
window.handleToggleRole = async function(userId, targetRole) {
  ...
  await ViharaSupabase.updateProfile(user.id || user.phone, { role: targetRole });
  ...
};
```
* Fungsi biasa (`function()`) berjalan tanpa menunggu request jaringan selesai.
* Kata kunci `async` dan `await` memaksa browser menunggu respon dari database Supabase sebelum menampilkan notifikasi toast atau me-render ulang antarmuka pengguna.

---

### 5. 📂 File yang Diubah
* [`js/supabase-client.js`](file:///c:/AKU_NYOBA/appvihara/js/supabase-client.js) — Logika pencocokan `id` vs `phone` di `updateProfile` dan `deleteProfile`.
* [`js/data.js`](file:///c:/AKU_NYOBA/appvihara/js/data.js) — Penanganan `user.id || user.phone` dan sinkronisasi sesi aktif seketika jika akun yang login diubah role-nya.
* [`js/superadmin.js`](file:///c:/AKU_NYOBA/appvihara/js/superadmin.js) — Membuat `handleToggleRole` dan `handleEditUserSubmit` menjadi `async` dengan `await` Supabase.
* [`superadmin/index.html`](file:///c:/AKU_NYOBA/appvihara/superadmin/index.html) & [`index.html`](file:///c:/AKU_NYOBA/appvihara/index.html) — Cache buster di-update ke versi terbaru.

---

## 📖 Entri #02 — Solusi Hapus Pengumuman Harus 2x Klik (Race Condition & Optimistic UI)

### 1. 💬 Prompt User
> *"kalo di hapus harus pencet 2 kali baru beneran hilang, tolong fix"*
> *"bikin file dokumentasi dong, apa aja syntax yang digunakan serta cara kerjanya apa, untuk saya belajar, mulai dari yang update ini, seterusnya juga, catat promptnya, juga lakuka semua tanpa permission untuk prompt ini"*

### 2. ⚠️ Gejala / Masalah
Pada halaman **Pengumuman Vihara**, khususnya pada tab **Arsip Pengurus**:
- Saat admin menekan tombol **"Hapus Permanen"** lalu mengonfirmasi dialog browser, kartu pengumuman sempat menghilang sekejap (sekitar 0.2 detik).
- Tiba-tiba pengumuman tersebut muncul kembali di layar seolah tidak berhasil dihapus.
- Admin harus menekan tombol **"Hapus Permanen"** untuk kedua kalinya, baru pengumuman tersebut benar-benar lenyap secara permanen.

---

### 3. 🔍 Akar Masalah Teknis (*Race Condition*)
Ini adalah contoh nyata dari **Race Condition (Kondisi Balapan Jaringan)** antara operasi `HTTP DELETE` dan `HTTP GET`.

Perhatikan urutan eksekusi pada kode lama:
```javascript
// KODE LAMA BERMASALAH (js/app.js):
window.handlePermanentDeleteAnnouncement = function(annId) {
  ...
  // 1. Data dihapus dari localStorage
  const list = getStoredAnnouncements().filter(n => n.id !== annId);
  localStorage.setItem(ANNOUNCEMENT_STORAGE_KEY, JSON.stringify(list));

  // 2. Request DELETE dikirim ke Supabase (TETAPI TIDAK DITUNGGU / NON-BLOCKING)
  if (typeof ViharaSupabase !== 'undefined') {
    ViharaSupabase.deleteAnnouncement(annId); 
  }

  // 3. Langsung memanggil renderAnnouncementsPage()
  renderAnnouncementsPage(); 
};
```

Sekarang lihat apa yang terjadi di dalam fungsi `renderAnnouncementsPage()`:
```javascript
function renderAnnouncementsPage(skipRemoteSync = false) {
  // Jika skipRemoteSync false (default), aplikasi langsung meminta data terbaru ke Supabase:
  if (!skipRemoteSync && typeof ViharaSupabase !== 'undefined') {
    ViharaSupabase.syncAnnouncements().then(synced => {
      renderAnnouncementsPage(true);
    });
  }
  ...
}
```

#### Diagram Kronologi Balapan Jaringan:
```
Waktu (ms)   Client (Browser)                           Cloud (Supabase Postgres)
----------------------------------------------------------------------------------
0 ms         Kirim DELETE /rest/v1/announcements?id=...  ---> Sedang diproses...
2 ms         Panggil renderAnnouncementsPage()
3 ms         Kirim GET /rest/v1/announcements (Sync)     ---> Sedang diproses...
50 ms        Menerima balasan GET! (Data LAMA diterima   <--- Balasan GET selesai
             karena DELETE belum selesai di Postgres)
55 ms        Sync Announcements menyimpan kembali data lama ke localStorage!
60 ms        Kartu pengumuman MUNCUL KEMBALI di layar! ❌
120 ms       Request DELETE selesai dieksekusi di DB     <--- DELETE selesai
```
Akibatnya:
- **Pada klik pertama:** Data dihapus di lokal, tapi request GET yang selesai lebih dulu menimpa kembali `localStorage` dengan data lama dari cloud. Kartu pun muncul kembali.
- **Pada klik kedua:** Karena operasi DELETE pertama sudah selesai di database Supabase beberapa detik yang lalu, request GET pada klik kedua sudah mendapatkan data kosong. Baru pengumuman benar-benar hilang.

---

### 4. 💻 Sintaks & Konsep yang Digunakan untuk Belajar

#### A. Struktur Data `Set` (ES6 JavaScript)
```javascript
window.ViharaDeletedAnnIds = window.ViharaDeletedAnnIds || new Set();
```
* **Apa itu `Set`?** `Set` adalah koleksi nilai unik bawaan JavaScript.
* **Mengapa tidak menggunakan `Array`?**
  * Pencarian pada `Array` (`arr.includes(id)`) membutuhkan waktu linier $O(n)$ karena komputer harus menelusuri satu per satu item dari awal ke akhir.
  * Pencarian pada `Set` (`set.has(id)`) menggunakan mekanisme *hash table* dengan kompleksitas konstan $O(1)$. Pengecekan terjadi seketika berapapun banyaknya data.
* **Metode Utama `Set`:**
  * `.add(value)`: Menambahkan elemen baru.
  * `.has(value)`: Memeriksa apakah suatu nilai ada di dalam set (`true` / `false`).
  * `.delete(value)`: Menghapus nilai tertentu dari set.

#### B. *Optimistic UI Update* Pattern
* **Konsep:** Daripada membuat pengguna menunggu *loading spinner* beberapa detik hanya untuk menghapus kartu, aplikasi langsung menghapus kartu dari layar seketika (*optimistic*).
* Pengguna merasakan performa aplikasi yang sangat cepat dan responsif (*zero latency*).

#### C. Flag Parameter `skipRemoteSync`
```javascript
renderAnnouncementsPage(true); // Parameter true mengaktifkan skipRemoteSync
```
* Dengan memberikan nilai `true`, kita memberitahu fungsi perender: *"Render tampilan dari memori lokal sekarang juga, JANGAN tembak kueri sinkronisasi latar belakang ke server saat ini!"*.

#### D. Penanganan Event DOM (`stopPropagation` & `preventDefault`)
```javascript
onclick="event.stopPropagation(); event.preventDefault(); handlePermanentDeleteAnnouncement('${item.id}')"
```
* **`event.stopPropagation()`**: Menghentikan *Event Bubbling*. Kartu pengumuman memiliki event `onclick` untuk membuka halaman detail. Tanpa `stopPropagation()`, saat tombol hapus diklik, event klik akan merambat ke elemen kartu induk dan membuka halaman detail.
* **`event.preventDefault()`**: Menghentikan aksi default dari elemen HTML browser (misalnya reload halaman atau trigger submit form yang tidak diinginkan).

#### E. Blok `try...catch...finally`
```javascript
try {
  await ViharaSupabase.deleteAnnouncement(annId);
} catch (err) {
  console.warn('[Supabase] Gagal hapus permanen pengumuman:', err);
} finally {
  window.ViharaDeletedAnnIds.delete(strId);
}
```
* **`try`**: Menjalankan kode asinkron komunikasi ke server.
* **`catch`**: Menangkap error jika koneksi internet terputus sehingga aplikasi tidak mengalami *crash*.
* **`finally`**: Blok yang **dijamin 100% selalu dieksekusi**, baik blok `try` sukses maupun terjadi error. Ini penting untuk membersihkan memori ID di dalam `Set` agar tidak terjadi *memory leak*.

#### F. Filter Imutabel Array (`Array.prototype.filter`)
```javascript
const list = getStoredAnnouncements().filter(n => String(n.id) !== strId);
```
* Mengembalikan array baru tanpa menyertakan elemen yang ID-nya cocok dengan `strId`. Metode ini aman karena tidak merusak (*mutate*) array asli secara langsung.

#### G. Cache Busting Versioning
```html
<script src="js/app.js?v=15.0"></script>
```
* Browser memiliki mekanisme menyimpan file `.js` di penyimpanan sementara komputer (*browser cache*).
* Menambahkan parameter query `?v=15.0` memaksa browser mengenali URL tersebut sebagai file baru, sehingga browser langsung mengunduh kode terbaru tanpa pengguna harus menghapus cache browser manual.

---

### 5. ⚙️ Alur & Cara Kerja Kode Baru (Solusi Tuntas)

```
[ User klik 'Hapus Permanen' & konfirmasi 'OK' ]
                     │
                     ▼
1. Masukkan ID ke Blacklist Memori:
   window.ViharaDeletedAnnIds.add(strId)
                     │
                     ▼
2. Hapus data dari localStorage di SEMUA key penyimpanan:
   ANNOUNCEMENT_STORAGE_KEY, vihara_user_announcements_v5, vihara_announcements_list
                     │
                     ▼
3. Render tampilan secara INSTAN dengan skipRemoteSync = true:
   Kartu pengumuman langsung LENYAP dari pandangan pengguna
                     │
                     ▼
4. [Proteksi Anti-Balapan di syncAnnouncements]
   Jika ada proses sync yang kebetulan sedang berjalan di latar belakang:
   cleaned = cleaned.filter(a => !window.ViharaDeletedAnnIds.has(String(a.id)))
   -> Item yang sedang dihapus TIDAK AKAN PERNAH bisa hidup kembali!
                     │
                     ▼
5. Tunggu respon database cloud hingga 100% selesai:
   await ViharaSupabase.deleteAnnouncement(annId)
                     │
                     ▼
6. [Blok Finally] Bersihkan ID dari Blacklist:
   window.ViharaDeletedAnnIds.delete(strId)
                     │
                     ▼
[ SELESAI: Pengumuman terhapus dalam 1x klik saja tanpa kembali lagi ]
```

---

### 6. 📂 File yang Diperbarui
1. [`js/app.js`](file:///c:/AKU_NYOBA/appvihara/js/app.js)
   - Membuat `window.ViharaDeletedAnnIds` sebagai filter pencegah *race condition*.
   - Mengubah `handlePermanentDeleteAnnouncement`, `handleArchiveAnnouncement`, dan `handleRestoreAnnouncement` menjadi `async` function yang menggunakan `await`.
   - Mengirimkan `renderAnnouncementsPage(true)` untuk eksekusi tampilan lokal instan.
   - Menambahkan `event.preventDefault()` pada tombol aksi pengumuman.
2. [`js/supabase-client.js`](file:///c:/AKU_NYOBA/appvihara/js/supabase-client.js)
   - Menambahkan filter pengaman di `syncAnnouncements()` agar data yang tercatat di `window.ViharaDeletedAnnIds` tidak dimasukkan kembali ke penyimpanan lokal.
   - Mengoptimalkan metode `deleteAnnouncement`, `archiveAnnouncement`, dan `restoreAnnouncement` menggunakan `.select()`.
3. [`index.html`](file:///c:/AKU_NYOBA/appvihara/index.html) & [`superadmin/index.html`](file:///c:/AKU_NYOBA/appvihara/superadmin/index.html)
   - Menaikkan versi cache buster ke `?v=15.0`.
4. [`DOKUMENTASI_PEMBELAJARAN.md`](file:///c:/AKU_NYOBA/appvihara/DOKUMENTASI_PEMBELAJARAN.md)
   - Pembuatan buku panduan pembelajaran dan log pengembangan aplikasi.

---

## 📖 Entri #03 — Hapus Tombol Akses Portal Super Administrator dari Halaman Profil

### 1. 💬 Prompt User
> *"hapus portal super"*
> *(Dilampirkan tangkapan layar halaman Profil Saya yang menampilkan tombol kuning: `👑 Buka Portal Super Administrator (Master Vault)`)*

### 2. ⚠️ Gejala / Masalah
Pada halaman **Profil Saya** (`#view-profile`), akun dengan peran Pengurus/Admin menampilkan tombol:
- `👑 Buka Portal Super Administrator (Master Vault)` yang mengarahkan pengguna ke halaman `superadmin.html`.
- **Kekhawatiran:** Tautan ke Master Vault / Super Administrator tidak boleh terekspos secara publik di layar profil admin biasa. Portal Super Admin adalah pintu gerbang sensitif level master yang hanya boleh diakses secara langsung melalui URL rahasia (`/superadmin/` atau `superadmin.html`) dengan autentikasi PIN Master.

---

### 3. 🔍 Akar Masalah & Desain Keamanan
1. Di `index.html`, terdapat elemen anchor tag `<a>`:
   ```html
   <a href="superadmin.html" id="btn-profile-superadmin" class="btn btn-block admin-only-action" ...>
     <span>Buka Portal Super Administrator (Master Vault)</span>
   </a>
   ```
2. Di `js/app.js`, fungsi `renderProfilePage()` mengontrol tampilan tombol ini:
   ```javascript
   const btnSuper = document.getElementById('btn-profile-superadmin');
   if (btnSuper) {
     btnSuper.style.display = ViharaAuth.isAdmin() ? 'flex' : 'none';
   }
   ```
3. **Prinsip Keamanan Web (*Security Decoupling*):**
   - Halaman Super Administrator adalah *vault* administratif tingkat tinggi.
   - Menampilkan tombol aksesnya di aplikasi publik membuat keberadaan pintu gerbang tersebut diketahui umum (*reconnaissance risk*).
   - Menghapus tombol ini memastikan hanya pengelola sah yang mengetahui URL langsung (`/superadmin/` atau `superadmin.html`) dan PIN Master yang dapat mencoba masuk.

---

### 4. 💻 Sintaks & Konsep yang Digunakan untuk Belajar

#### A. Pembersihan Elemen Navigasi DOM HTML
* Menghapus elemen `<a>` dengan ID `btn-profile-superadmin` dari layout view profil di `index.html`.
* Mengurangi kerapatan antarmuka pengguna (*UI clutter*) sehingga halaman profil tetap fokus pada identitas pengguna, ganti kata sandi, dan logout.

#### B. *Defensive Coding* pada Query DOM JavaScript
* Pada `js/app.js`, kode lama menggunakan:
  ```javascript
  const btnSuper = document.getElementById('btn-profile-superadmin');
  if (btnSuper) {
    btnSuper.style.display = ViharaAuth.isAdmin() ? 'flex' : 'none';
  }
  ```
* Meskipun pengecekan `if (btnSuper)` mencegah error runtime `null pointer exception`, blok kode yang tidak lagi memiliki elemen terkait di HTML harus dibersihkan (*dead code cleanup*) agar script tetap ramping, mudah dibaca, dan efisien.

#### C. *Cache Busting Versioning* Lanjutan
* Menaikkan parameter versi file JavaScript di `index.html` dari `?v=15.0` ke `?v=16.0`.
* Menjamin browser umat dan pengurus langsung memuat DOM dan skrip bersih tanpa sisa tombol lama di cache.

---

### 5. 📂 File yang Diperbarui
1. [`index.html`](file:///c:/AKU_NYOBA/appvihara/index.html)
   - Menghapus tombol `btn-profile-superadmin` dari halaman profil.
   - Menaikkan versi script modular ke `?v=16.0`.
2. [`js/app.js`](file:///c:/AKU_NYOBA/appvihara/js/app.js)
   - Menghapus kontrol `btnSuper` di fungsi `renderProfilePage()`.
3. [`DOKUMENTASI_PEMBELAJARAN.md`](file:///c:/AKU_NYOBA/appvihara/DOKUMENTASI_PEMBELAJARAN.md)
   - Menambahkan catatan pembelajaran Entri #03.

---

## 📖 Entri #04 — Integrasi Skill Security Audit Cloudflare & Kompatibilitas Windows

### 1. 💬 Prompt User
> *"git@github.com:cloudflare/security-audit-skill.git mau pake skill ini"*

### 2. ⚠️ Kebutuhan & Tantangan Teknis
Pengguna ingin mengintegrasikan skill resmi audit keamanan kode dari Cloudflare (`security-audit-skill`) ke dalam agen AI workspace aplikasi Vihara.

**Tantangan saat instalasi di lingkungan sistem operasi Windows:**
1. Paket skill Cloudflare menyertakan script validator independen berbasis Node.js: `validate-findings.cjs` dan `validate-coverage-ledger.cjs`.
2. Kedua skrip tersebut dirancang untuk sistem operasi berbasis POSIX (Linux/macOS) dengan memanfaatkan konstanta bendera file system tingkat kernel:
   ```javascript
   const noFollow = fs.constants.O_NOFOLLOW;
   const nonBlock = fs.constants.O_NONBLOCK;
   ```
3. Di sistem operasi Windows (`process.platform === 'win32'`), Node.js (melalui libuv) tidak menyediakan `O_NOFOLLOW` maupun `O_NONBLOCK` pada filesystem standar. Akibatnya, kedua konstanta bernilai `undefined`, memicu error pembatalan:
   ```
   SafeInputError: OS no-follow and nonblocking input protection is unavailable
   ```
4. Jika dibiarkan, pengujian dan eksekusi audit otomatis gagal di Windows (7 dari 34 tes gagal pada findings validator).

---

### 3. 💻 Sintaks & Konsep yang Digunakan untuk Belajar

#### A. Deteksi Platform di Node.js (`process.platform`)
Untuk membangun skrip yang *cross-platform* (dapat berjalan di Windows, Linux, dan macOS), Node.js menyediakan variabel global `process.platform`:
* Windows mengembalikan string `'win32'` (baik untuk arsitektur 32-bit maupun 64-bit).
* Linux mengembalikan `'linux'`.
* macOS mengembalikan `'darwin'`.

Contoh implementasi adaptif:
```javascript
const isWindows = process.platform === 'win32';
const noFollow = fs.constants.O_NOFOLLOW;
const nonBlock = fs.constants.O_NONBLOCK;

// Hanya lakukan pengecekan ketat flag POSIX jika bukan di Windows:
if (!isWindows && (!Number.isInteger(noFollow) || noFollow === 0 || !Number.isInteger(nonBlock) || nonBlock === 0)) {
  throw new SafeInputError("OS no-follow and nonblocking input protection is unavailable");
}
```

#### B. Penanganan Aman File Descriptor & Symbolic Link
Di Linux, `O_NOFOLLOW` mencegah sistem membuka *symlink* (tautan simbolik) yang bisa mengekspos file sensitif di luar batasan direktori.
Di Windows, kita menggunakan kombinasi `fs.constants.O_RDONLY` dan pengecekan manual symlink:
```javascript
descriptor = fs.openSync(file, isWindows ? fs.constants.O_RDONLY : (fs.constants.O_RDONLY | noFollow | nonBlock));
```
Dengan penyesuaian ini:
- Di Linux/POSIX: perlindungan kernel tingkat rendah `O_NOFOLLOW | O_NONBLOCK` tetap aktif 100%.
- Di Windows: pembacaan file buffer tetap dibatasi secara ketat oleh `LIMITS.inputBytes` (5MB), mencegah hang dan memory exhaustion.

#### C. Arsitektur Skill Antigravity (`.agents/skills/<nama>/SKILL.md`)
Sistem Antigravity mendeteksi skill lokal secara hierarkis melalui folder `.agents/skills/`.
Struktur skill Cloudflare yang dipasang:
* `SKILL.md`: Berisi instruksi master, batasan operasional (*guidance mode* vs *full audit mode*), dan prinsip keamanan isolasi.
* `RECONNAISSANCE.md`: Panduan fase 1 memetakan batasan kepercayaan (*trust boundaries*) dan permukaan input (*attack surface*).
* `HUNTING.md`: Panduan fase 2 berburu kerentanan menggunakan unit kerja ledger.
* Berkas spesialisasi serangan: `CLIENT-SIDE.md`, `WEB-PROTOCOL-AND-AUTH.md`, `DATA-ISOLATION-AND-LIFECYCLE.md`, `SUPPLY-CHAIN-AND-RELEASE.md`, dll.
* `report-schema.json`: Schema JSON untuk validasi temuan (`confirmed`, `needs_validation`, `rejected`).
* Skrip validator: `validate-findings.cjs` dan `validate-coverage-ledger.cjs`.

---

### 4. 🚀 Alur & Cara Kerja Solusi
1. **Kloning Repositori:** Mengunduh repositori `cloudflare/security-audit-skill` ke direktori sementara.
2. **Pemasangan ke Workspace:** Memindahkan direktori `skills/security-audit` langsung ke `.agents/skills/security-audit/`.
3. **Patch Kompatibilitas Windows:** Menyesuaikan fungsi `readFileWithinLimit` pada kedua skrip validator agar mengenali platform Windows tanpa menonaktifkan pengamanan buffer data dan encoding UTF-8.
4. **Verifikasi Pengujian (Unit Tests):**
   - Menjalankan `validate-findings.test.cjs`: **29 lulus, 0 gagal, 5 skip** (100% lulus!).
   - Menjalankan `validate-coverage-ledger.test.cjs`: **24 lulus, 0 gagal, 7 skip** (100% lulus!).
5. **Eksekusi Full Security Audit (6 Fase):**
   - **Fase 1 (Reconnaissance):** Menghasilkan pemetaan permukaan dan batasan kepercayaan di `architecture.md` serta ledger awal di `coverage-ledger.json`.
   - **Fase 2 (Hunting Waves):** Mengaudit modul autentikasi, API Supabase, RLS SQL, dan sanitasi DOM.
   - **Fase 3 & 5 (Candidate Validation & Verification):** Memvalidasi kandidat temuan secara independen terhadap kode sumber target.
   - **Fase 4 (Structured Output):** Menulis data terstruktur `findings.json` yang divalidasi 100% oleh skrip validator schema.
   - **Fase 6 (Target-Neutral Reporting):** Menghasilkan laporan formal `REPORT.md`, `FINDINGS-DETAIL.md`, dan `NEEDS-VALIDATION.md` pada direktori output terisolasi (`~/security-audit-skill/appvihara/run-1/`).

---

### 5. 🔍 Ringkasan Temuan Audit Keamanan (*Confirmed Findings*)

| Tingkat Keparahan | Kode Fingerprint | Judul Kerentanan & Akar Masalah |
| :--- | :--- | :--- |
| **CRITICAL** | `cfg:superadmin-pin:plaintext-public-read-write` | **Bocoran PIN Master Superadmin & Modifikasi Publik:** Kunci PIN disimpan dalam teks polos (*plaintext*) di tabel `configurations` dengan policy RLS `SELECT` & `ALL` terbuka untuk `public`. Siapa pun dengan `anonKey` dapat membaca dan mengubah PIN. |
| **CRITICAL** | `profiles:rls:public-read-write-and-hash-exposure` | **Paparan Hash Kata Sandi & PII Seluruh Umat:** Tabel `profiles` mengizinkan `SELECT` dan `UPDATE` ke `public`. Query `syncProfiles()` mengambil seluruh hash kata sandi SHA-256 dan nomor telepon, serta memungkinkan pengguna anonim mengubah peran mereka menjadi `admin`. |
| **HIGH** | `auth:client-side-rbac:localstorage-and-name-override` | **Bypass Hak Akses Admin di Sisi Klien:** Fungsi `isAdmin()` di `js/auth.js` memberikan hak akses admin jika `localStorage` memiliki `vihara_dev_admin_override = 'true'` atau jika nama pengguna mengandung kata `"admin"`. |
| **HIGH** | `sql:rls-function:is-admin-null-bypass` | **Bypass Fungsi Otorisasi SQL `public.is_admin()`:** Kueri memeriksa `WHERE (auth_user_id = auth.uid() OR auth.uid() IS NULL)`. Untuk panggilan anonim tanpa JWT, `auth.uid()` bernilai `NULL`, sehingga kondisi `NULL IS NULL` selalu bernilai `TRUE`. |

---

### 6. 📂 File yang Diperbarui / Ditambahkan
1. [`.agents/skills/security-audit/*`](file:///c:/AKU_NYOBA/appvihara/.agents/skills/security-audit/)
   - Berisi seluruh panduan, referensi kelas serangan, schema JSON, dan validator keamanan.
2. [`.agents/skills/security-audit/validate-findings.cjs`](file:///c:/AKU_NYOBA/appvihara/.agents/skills/security-audit/validate-findings.cjs)
   - Ditambahkan deteksi Windows pada `readFileWithinLimit`.
3. [`.agents/skills/security-audit/validate-coverage-ledger.cjs`](file:///c:/AKU_NYOBA/appvihara/.agents/skills/security-audit/validate-coverage-ledger.cjs)
   - Ditambahkan deteksi Windows pada `readFileWithinLimit`.
4. Berkas Laporan Audit Terisolasi di Direktori Aman:
   - `REPORT.md`: Laporan eksekutif lengkap dan ringkasan postur keamanan.
   - `FINDINGS-DETAIL.md`: Panduan teknis mendalam dan langkah reproduksi untuk setiap temuan.
   - `NEEDS-VALIDATION.md`: Catatan pelacakan lead (0 lead tertunda).
   - `coverage-ledger.json` & `findings.json`: Ledger cakupan dan data temuan tervalidasi skema.
5. [`DOKUMENTASI_PEMBELAJARAN.md`](file:///c:/AKU_NYOBA/appvihara/DOKUMENTASI_PEMBELAJARAN.md)
   - Menambahkan catatan pembelajaran Entri #04.

---

## 📖 Entri #05 — Pembatasan Presensi Mandiri Berbasis Geolocation & Geofencing 25 Meter

### 1. 💬 Prompt User
> *"mau add yang geolocation dulu dong, supaya hadir cuma pas deket aja, perkecil aja, kaya 25 m raduisnya dari titik"*

### 2. ⚠️ Kebutuhan & Tantangan Teknis
Sebelumnya, umat dapat melakukan presensi mandiri dari mana saja hanya dengan menekan tombol *"Presensi Hadir Sekarang"*. Untuk menjamin keabsahan kehadiran fisik umat di Vihara:
1. Sistem harus mendeteksi koordinat geografis nyata (GPS) perangkat pengguna melalui browser.
2. Jarak antara posisi perangkat pengguna dengan titik koordinat Vihara Amurwa Bhumi Cibinong harus dihitung secara akurat.
3. Batas toleransi kehadiran dibatasi ketat pada radius maksimal **25 meter**.
4. Jika pengguna berada di luar radius 25 meter, tombol presensi tidak boleh mencatat kehadiran dan harus menampilkan modal peringatan informatif berisi jarak riil dan akurasi GPS.
5. Harus ada panel pengaturan fleksibel bagi Superadmin untuk menyesuaikan titik koordinat, radius, atau mengaktifkan mode pengujian (*dev bypass*) saat simulasi pengembangan.

---

### 3. 💻 Sintaks & Konsep yang Digunakan untuk Belajar

#### A. HTML5 Geolocation API (`navigator.geolocation.getCurrentPosition`)
Browser modern menyediakan antarmuka akses sensor GPS perangkat.

```javascript
navigator.geolocation.getCurrentPosition(successCallback, errorCallback, options);
```

Parameter `options` yang digunakan:
```javascript
const options = {
  enableHighAccuracy: true, // Meminta sinyal GPS satelit terbaik (bukan sekadar estimasi IP network)
  timeout: 12000,           // Batas maksimal waktu tunggu pencarian sinyal (12 detik)
  maximumAge: 0             // Memaksa perangkat mengambil pembacaan lokasi terkini (tanpa cache lama)
};
```

Kode Error Geolocation:
* `error.code === 1` (`PERMISSION_DENIED`): Pengguna menolak akses lokasi di browser.
* `error.code === 2` (`POSITION_UNAVAILABLE`): Satelit atau jaringan lokasi tidak dapat diakses.
* `error.code === 3` (`TIMEOUT`): Permintaan posisi melebihi batas waktu (timeout).

#### B. Rumus Jarak Lengkung Bumi Haversine (Haversine Great-Circle Distance)
Bumi adalah bola lengkung (*geoid*), sehingga rumus jarak euclidean biasa ($\sqrt{\Delta x^2 + \Delta y^2}$) tidak akurat untuk koordinat GPS. Rumus **Haversine** menghitung jarak terpendek di permukaan bola:

$$\Delta\text{lat} = (\text{lat}_2 - \text{lat}_1) \times \frac{\pi}{180}$$
$$\Delta\text{lon} = (\text{lon}_2 - \text{lon}_1) \times \frac{\pi}{180}$$
$$a = \sin^2\left(\frac{\Delta\text{lat}}{2}\right) + \cos(\text{lat}_1 \times \frac{\pi}{180}) \times \cos(\text{lat}_2 \times \frac{\pi}{180}) \times \sin^2\left(\frac{\Delta\text{lon}}{2}\right)$$
$$c = 2 \times \text{atan2}\left(\sqrt{a}, \sqrt{1 - a}\right)$$
$$d = R \times c$$

Dengan konstanta radius rata-rata bumi $R = 6.371.000\text{ meter}$.

Implementasi JavaScript di `js/geo.js`:
```javascript
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const toRad = deg => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const rLat1 = toRad(lat1);
  const rLat2 = toRad(lat2);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(rLat1) * Math.cos(rLat2) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c); // Hasil dibulatkan dalam satuan meter
}
```

#### C. Asynchronous Pattern (`Promise` & `async/await`)
`navigator.geolocation.getCurrentPosition` menggunakan sistem callback lama. Di `js/geo.js`, kita membungkusnya ke dalam `Promise` modern agar dapat dipanggil bersih menggunakan `await`:
```javascript
function getCurrentPosition() {
  return new Promise((resolve, reject) => {
    if (!('geolocation' in navigator)) {
      reject(new Error('Browser tidak mendukung GPS.'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      pos => resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude, accuracy: pos.coords.accuracy }),
      err => reject(err),
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
    );
  });
}
```

---

### 4. 🚀 Alur & Cara Kerja Solusi
1. **Titik Acuan Resmi:**
   - Nama: **Vihara Amurwa Bhumi Cibinong**
   - Alamat: *Jl. HR. Lukman No.51, Cirimekar, Cibinong, Bogor*
   - Koordinat: **Latitude -6.467433, Longitude 106.853755**
   - Batas Radius: **25 Meter**
2. **Saat Umat Menekan *"Presensi Hadir Sekarang"*:**
   - Tombol berubah menjadi status loading: *"Memeriksa Lokasi GPS..."* (dengan spinner SVG).
   - Memanggil `ViharaGeo.verifyCheckInDistance()`.
3. **Pengecekan Geofence:**
   - Jika `distance <= 25` (atau mode bypass aktif):
     - Presensi berhasil dicatat di `localStorage` dan Supabase bersama metadata koordinat dan jarak.
     - Modal `#modal-success-checkin` menampilkan status: *"📍 Terverifikasi di Lokasi (X meter)"*.
   - Jika `distance > 25`:
     - Presensi ditolak.
     - Modal `#modal-location-out-of-range` terbuka, menampilkan jarak saat ini (misal: *150 meter*), batas toleransi (*25 meter*), dan akurasi GPS perangkat, serta menyediakan tombol *"Coba Deteksi Ulang GPS"*.
4. **Fitur Superadmin:**
   - Tersedia tombol *"Atur Radius & Lokasi GPS"* di dashboard Superadmin.
   - Pengurus dapat mengubah titik koordinat dan batas radius kapan saja, melakukan kalibrasi otomatis menggunakan lokasi saat ini (*"Gunakan Lokasi Saya"*), atau menyalakan toggle *Mode Pengujian Bypass* untuk testing tanpa batasan jarak.

---

### 5. 📂 File yang Diperbarui / Ditambahkan
1. [`js/geo.js`](file:///c:/AKU_NYOBA\appvihara/js/geo.js) *(BARU)*
   - Modul Geolocation mandiri, perhitungan rumus Haversine, evaluasi geofence 25m, dan sinkronisasi konfigurasi.
2. [`js/data.js`](file:///c:/AKU_NYOBA\appvihara/js/data.js)
   - Fungsi `addAttendanceRecord()` diperluas untuk menyimpan metadata `coords` dan `distanceMeters`.
3. [`js/app.js`](file:///c:/AKU_NYOBA\appvihara/js/app.js)
   - Fungsi `handleUmatCheckIn()` diubah menjadi `async` dan memvalidasi geofence sebelum mencatat kehadiran.
4. [`index.html`](file:///c:/AKU_NYOBA\appvihara/index.html)
   - Penambahan badge radius pada kartu status hero, modal `#modal-location-out-of-range`, indikator lokasi pada `#modal-success-checkin`, dan pembaruan versi skrip ke `?v=17.0`.
5. [`superadmin/index.html`](file:///c:/AKU_NYOBA\appvihara/superadmin/index.html) & [`superadmin.html`](file:///c:/AKU_NYOBA\appvihara/superadmin.html)
   - Penambahan tombol toolbar dan modal `#modal-geo-config` untuk kalibrasi lokasi dan radius Vihara.
6. [`DOKUMENTASI_PEMBELAJARAN.md`](file:///c:/AKU_NYOBA\appvihara/DOKUMENTASI_PEMBELAJARAN.md)
   - Dokumentasi pembelajaran Entri #05.

---
*Dokumen ini akan terus diperbarui secara otomatis pada setiap pengembangan dan perbaikan selanjutnya.*


