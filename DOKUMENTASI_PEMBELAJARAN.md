# 📚 Dokumentasi Pembelajaran Kode & Log Pengembangan
**Aplikasi Web Presensi & Warta Digital — Vihara Amurwa Bhumi Cibinong**

Buku catatan ini dirancang khusus untuk dokumentasi perubahan sekaligus **panduan belajar pemrograman** secara praktis (*case-based learning*). Setiap pembaruan mencatat prompt asli pengguna, analisis masalah, konsep dan sintaks yang digunakan, cara kerjanya secara mendalam, serta file yang diperbarui.

---

## 📑 Daftar Isi
1. [Standar Format Dokumentasi](#standar-format-dokumentasi)
2. [Entri #01 — Perbaikan Sinkronisasi Ubah Role di Superadmin](#entri-01--perbaikan-sinkronisasi-ubah-role-di-superadmin)
3. [Entri #02 — Solusi Hapus Pengumuman Harus 2x Klik (Race Condition & Optimistic UI)](#entri-02--solusi-hapus-pengumuman-harus-2x-klik-race-condition--optimistic-ui)

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
*Dokumen ini akan terus diperbarui secara otomatis pada setiap pengembangan dan perbaikan selanjutnya.*
