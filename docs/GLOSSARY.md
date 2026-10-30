# Indeks & Glosarium Navigasi Kode (Master Lookup Directory)
### Sistem Presensi Umat & Buku Tamu Digital — Vihara Amurwa Bhumi Cibinong

Dokumen ini adalah **peta navigasi lengkap** dari seluruh basis kode aplikasi. Setiap file utama telah ditandai dengan **tag indeks standar** (`[INDEX: ...]`) di bagian atas dan pada setiap awal blok kodenya.

> [!TIP]
> **Cara Cepat Mencari di Editor (VS Code / IDE):**
> Tekan **`Ctrl + F`** (atau `Cmd + F`), lalu ketikkan tag indeks seperti `[INDEX: HTML-07]` atau `[INDEX: JS-APP-11]` untuk langsung lompat ke baris implementasi terkait dalam hitungan detik.

---

## 1. Struktur Folder & Direktori Proyek

Seluruh file telah ditata dan diurutkan ke dalam arsitektur modular yang rapi:

```
appvihara/
├── .agents/
│   └── skills/
│       ├── design-taste-frontend/        # Skill kurasi desain anti-slop (Awwwards standard)
│       └── mobile-app-ui-design/         # Skill UI/UX mobile interface patterns
├── assets/
│   ├── logo.svg                          # Vektor logo resmi Vihara Amurwa Bhumi (SVG)
│   └── logo.jpg                          # Bitmap logo resmi vihara (JPG)
├── css/
│   ├── style.css                         # Stylesheet utama aplikasi (17 Seksi terindeks)
│   └── superadmin.css                    # Stylesheet dark obsidian portal Super Admin (8 Seksi)
├── js/
│   ├── admin.js                          # Logika pengurus: manajemen acara & presensi (4 Seksi)
│   ├── animated-bg.js                    # Canvas 60 FPS: partikel dupa & Roda Dhamma (6 Seksi)
│   ├── app.js                            # Controller utama SPA, router & tampilan (14 Seksi)
│   ├── auth.js                           # Autentikasi No. HP, register & RBAC guard (5 Seksi)
│   ├── data.js                           # Data layer, local storage, auto-arsip expired event & session (7 Seksi)
│   └── superadmin.js                     # Portal master superadmin, PIN vault & CRUD user (6 Seksi)
├── supabase/
│   ├── schema.sql                        # Skema DDL resmi PostgreSQL Supabase (Prefixed IDs: USR_001, EVT_001, ANN_001, ATT_001, GST_001, RLS, Triggers)
│   ├── migrate_autoincrement.sql         # Skrip 1-klik migrasi semua tabel ke Auto-Increment di SQL Editor Supabase
│   └── SUPABASE_GUIDE.md                 # Panduan lengkap implementasi & integrasi Supabase
├── superadmin/
│   └── index.html                        # Entry point direktori web portal Super Admin
├── archive/
│   ├── BackgroundAnimation.jsx           # Arsip purwarupa React JSX lama (non-aktif)
│   ├── Cssneeds/                         # Arsip aset mentah awal
│   └── mobile-app-ui-design.zip          # Arsip paket skill mobile UI
├── index.html                            # Halaman tunggal utama aplikasi (16 Seksi terindeks)
├── superadmin.html                       # Entry point berkas langsung portal Super Admin
├── ALURBESAR.md                          # Dokumentasi arsitektur & alur bisnis vihara
├── GLOSSARY.md                           # Master indeks & glosarium proyek (file ini)
└── skills-lock.json                      # Metadata lock konfigurasi agent skills
```

---

## 2. Cheat Sheet: "Ingin Ubah Apa? Cari ke Mana?"

Tabel pintas di bawah ini dirancang untuk mempercepat perbaikan atau penyesuaian fitur tanpa harus membaca ribuan baris kode:

| Kebutuhan Perubahan | File yang Dituju | Tag Indeks | Komponen / Fungsi Kunci |
| :--- | :--- | :--- | :--- |
| **Ubah Kartu / Feed Pengumuman** | [`index.html`](file:///c:/AKU_NYOBA/appvihara/index.html)<br>[`css/style.css`](file:///c:/AKU_NYOBA/appvihara/css/style.css)<br>[`js/app.js`](file:///c:/AKU_NYOBA/appvihara/js/app.js) | `[INDEX: HTML-07]`<br>`[INDEX: CSS-16]`<br>`[INDEX: JS-APP-11]` | `#view-announcements`<br>`#page-announcements-feed`<br>`renderAnnouncementsPage()` |
| **Ubah Modal Detail Pengumuman** | [`index.html`](file:///c:/AKU_NYOBA/appvihara/index.html)<br>[`css/style.css`](file:///c:/AKU_NYOBA/appvihara/css/style.css)<br>[`js/app.js`](file:///c:/AKU_NYOBA/appvihara/js/app.js) | `[INDEX: HTML-15]`<br>`[INDEX: CSS-16]`<br>`[INDEX: JS-APP-11]` | `#modal-announcement-detail`<br>`.modal-box-announcement-detail`<br>`openAnnouncementDetail()` |
| **Ubah Banner Sakral Roda Dhamma** | [`js/app.js`](file:///c:/AKU_NYOBA/appvihara/js/app.js) | `[INDEX: JS-APP-11]` | `BANNER_KATHINA_SVG` (1000x450 vector) |
| **Ubah Warna Tema, Font & Palet** | [`css/style.css`](file:///c:/AKU_NYOBA/appvihara/css/style.css) | `[INDEX: CSS-01]` | `:root { --maroon-900, --pal-cream... }` |
| **Ubah Navigasi Kapsul & Glider** | [`index.html`](file:///c:/AKU_NYOBA/appvihara/index.html)<br>[`css/style.css`](file:///c:/AKU_NYOBA/appvihara/css/style.css)<br>[`js/app.js`](file:///c:/AKU_NYOBA/appvihara/js/app.js) | `[INDEX: HTML-03]`<br>`[INDEX: CSS-07]`<br>`[INDEX: JS-APP-12]` | `.top-header`, `#desktop-nav-menu`<br>`initDesktopNavGlider()` |
| **Ubah Form Login / Daftar Akun** | [`index.html`](file:///c:/AKU_NYOBA/appvihara/index.html)<br>[`js/app.js`](file:///c:/AKU_NYOBA/appvihara/js/app.js)<br>[`js/auth.js`](file:///c:/AKU_NYOBA/appvihara/js/auth.js) | `[INDEX: HTML-04]`<br>`[INDEX: JS-APP-07]`<br>`[INDEX: JS-AUTH-02]` | `#form-login-phone`, `#form-register-umat`<br>`loginWithPhone()`, `register()` |
| **Ubah Mutiara Dhammapada** | [`index.html`](file:///c:/AKU_NYOBA/appvihara/index.html)<br>[`js/app.js`](file:///c:/AKU_NYOBA/appvihara/js/app.js) | `[INDEX: HTML-04]`<br>`[INDEX: JS-APP-08]` | `#dhammapada-quote-text`<br>`DHAMMAPADA_QUOTES = [...]` |
| **Ubah Status Presensi Hari Ini** | [`index.html`](file:///c:/AKU_NYOBA/appvihara/index.html)<br>[`js/app.js`](file:///c:/AKU_NYOBA/appvihara/js/app.js) | `[INDEX: HTML-05]`<br>`[INDEX: JS-APP-02]` | `#umat-kebaktian-title`, `#btn-umat-checkin`<br>`renderUmatDashboard()` |
| **Ubah Riwayat Kehadiran Umat** | [`index.html`](file:///c:/AKU_NYOBA/appvihara/index.html)<br>[`js/app.js`](file:///c:/AKU_NYOBA/appvihara/js/app.js) | `[INDEX: HTML-06]`<br>`[INDEX: JS-APP-03]` | `#view-history`, `#umat-history-cards-container`<br>`renderHistoryPage()` |
| **Ubah Alur Buku Tamu Digital** | [`index.html`](file:///c:/AKU_NYOBA/appvihara/index.html)<br>[`js/app.js`](file:///c:/AKU_NYOBA/appvihara/js/app.js)<br>[`js/data.js`](file:///c:/AKU_NYOBA/appvihara/js/data.js) | `[INDEX: HTML-08]`<br>`[INDEX: JS-APP-09]`<br>`[INDEX: JS-DATA-06]` | `#view-guest`, `handleGuestFormSubmit()`<br>`addGuestRecord()` |
| **Ubah Form Jadwal Acara Admin** | [`index.html`](file:///c:/AKU_NYOBA/appvihara/index.html)<br>[`js/app.js`](file:///c:/AKU_NYOBA/appvihara/js/app.js)<br>[`js/admin.js`](file:///c:/AKU_NYOBA/appvihara/js/admin.js) | `[INDEX: HTML-09]`<br>`[INDEX: JS-APP-06]`<br>`[INDEX: JS-ADMIN-04]` | `#form-create-event`, `createNewEvent()` |
| **Ubah Akun Admin / Reset DB** | [`js/data.js`](file:///c:/AKU_NYOBA/appvihara/js/data.js) | `[INDEX: JS-DATA-02]` | `INITIAL_USERS` (`08119999888`), `resetAllData()` |
| **Ubah Animasi Parallax Latar** | [`js/animated-bg.js`](file:///c:/AKU_NYOBA/appvihara/js/animated-bg.js) | `[INDEX: JS-BG-02]`<br>`[INDEX: JS-BG-05]` | `mouse.normX`, `renderSacredDharmachakra()` |
| **Ubah PIN Master Super Admin** | [`js/superadmin.js`](file:///c:/AKU_NYOBA/appvihara/js/superadmin.js) | `[INDEX: JS-SUPER-01]` | `const SUPERADMIN_SECRET_PIN = '9999'` |

---

## 3. Glosarium Detail per File

### 3.1 [`index.html`](file:///c:/AKU_NYOBA/appvihara/index.html) — Halaman Tunggal Utama
*Total Seksi: 16 | Garis Baris: ~1400*

| Tag Indeks | Baris | Nama Seksi / Blok | Elemen Kunci / ID DOM | Fungsi & Penjelasan |
| :--- | :---: | :--- | :--- | :--- |
| `[INDEX: HTML-01]` | L43 | Preloader Sakral Roda Dhamma | `#dhamma-preloader`, `.dhamma-wheel-svg` | Animasi loading 8 jari-jari emas sebelum DOM siap |
| `[INDEX: HTML-02]` | L100 | Canvas Animasi Latar Belakang | `#animated-bg-canvas` | Elemen `<canvas>` layar penuh partikel dupa 60 FPS |
| `[INDEX: HTML-03]` | L107 | Top Header & Floating Capsule Navbar | `.top-header`, `#desktop-nav-menu`, `#header-user-profile` | Kapsul melayang atas untuk navigasi & profil desktop |
| `[INDEX: HTML-04]` | L190 | View 1: Masuk, Daftar & Mutiara Dhamma | `#view-login`, `#form-login-phone`, `#dhammapada-quote-text` | Split 2 kolom: form auth HP & petikan Dhammapada |
| `[INDEX: HTML-05]` | L391 | View 2: Beranda Umat & Mutiara Dhamma Lebar | `#view-umat`, `#umat-mobile-role`, `#umat-kebaktian-title`, `.dhamma-quote-card-wide` | Top bar mobile avatar & role pill, hero glass status hadir, & kartu kutipan Dhamma lebar penuh |
| `[INDEX: HTML-06]` | L543 | View 3: Riwayat Kehadiran Umat | `#view-history`, `#history-filter-select`, `.history-cards-list` | Rekam jejak presensi kebaktian umat per bulan |
| `[INDEX: HTML-07]` | L612 | View 4: Pengumuman & Warta Vihara | `#view-announcements`, `#page-announcements-feed`, `#panel-create-announcement` | Editorial grid 2 kolom warta vihara & form admin |
| `[INDEX: HTML-07B]` | L750 | View 4B: Detail Warta (Full Page) | `#view-announcement-detail`, `#page-detail-title`, `#page-detail-content` | Halaman baca warta utuh (anti-popup) dengan foto banner & opsi hapus admin |
| `[INDEX: HTML-08]` | L830 | View 5: Buku Tamu Digital | `#view-guest`, `#guest-name`, `#guest-phone`, `#guest-purpose` | Formulir pencatatan kedatangan umat luar / tamu umum |
| `[INDEX: HTML-09]` | L828 | View 6: Buat Acara & Manajemen Jadwal (Admin) | `#view-admin`, `#admin-active-events-container`, `#admin-archived-events-container` | Panel pengurus: form jadwal baru, pemisahan acara aktif & arsip histori |
| `[INDEX: HTML-10]` | L1002 | View 7: Profil Pengguna (Full Page) | `#view-profile`, `#page-profile-name`, `#page-profile-phone` | Halaman penuh informasi kontak & tombol keluar |
| `[INDEX: HTML-11]` | L1104 | Floating Bottom Navigation Bar | `.bottom-nav`, `#bottom-nav-home-btn`, `#bottom-nav-announcement-btn` | Bar navigasi bawah melayang untuk layar mobile |
| `[INDEX: HTML-12]` | L1156 | Modal: Daftar Hadir Per Acara | `#modal-event-attendance`, `#modal-event-title`, `#modal-tab-btn-umat` | Dialog popup daftar hadir umat & tamu per acara |
| `[INDEX: HTML-13]` | L1252 | Modal: Check-in Mandiri Berhasil | `#modal-success-checkin`, `#modal-checkin-event` | Dialog feedback saat umat berhasil mencatatkan presensi |
| `[INDEX: HTML-14]` | L1292 | Modal: Buku Tamu Berhasil | `#modal-guest-success`, `#modal-guest-name` | Pesan terima kasih atas kunjungan tamu di vihara |
| `[INDEX: HTML-15]` | L1318 | Modal: Detail Lengkap Pengumuman | `#modal-announcement-detail`, `#modal-announcement-title`, `#modal-announcement-message` | Dialog baca lengkap warta, foto banner, & bagikan info |
| `[INDEX: HTML-16]` | L1520 | Toast & Skrip Runtime Modular | `#toast-container`, `<script src="js/...">` | Wadah toast notification & pemuatan skrip modular (v9.7) |

---

### 3.2 [`css/style.css`](file:///c:/AKU_NYOBA/appvihara/css/style.css) — Stylesheet Desain Sistem Utama
*Total Seksi: 17 | Garis Baris: ~3300*

| Tag Indeks | Baris | Lingkup & Cakupan Desain | Selektor Utama |
| :--- | :---: | :--- | :--- |
| `[INDEX: CSS-01]` | L26 | Design Tokens & Palet Warna | `:root`, `--maroon-900`, `--pal-cream`, `--pal-peach`, `--shadow-card` |
| `[INDEX: CSS-02]` | L109 | Reset, Box Sizing & Tipografi | `*`, `html, body`, `font-family: 'Plus Jakarta Sans'` |
| `[INDEX: CSS-03]` | L145 | View Routing & Slide Transition | `.view-section`, `.page-in`, `.slide-left`, `.slide-right` |
| `[INDEX: CSS-04]` | L157 | Canvas Animasi & Ambient Aura | `#animated-bg-canvas`, `.glow-aura`, `.torch-effect` |
| `[INDEX: CSS-05]` | L262 | Preloader Sakral Roda Dhamma | `.dhamma-preloader`, `.dhamma-wheel-svg`, `@keyframes wheelSpin` |
| `[INDEX: CSS-06]` | L405 | Layout Container & App Shell | `#app-root`, `.main-content`, `max-width: 1100px` |
| `[INDEX: CSS-07]` | L444 | Floating Capsule Navbar & Top Bar Mobile | `.top-header`, `.desktop-nav`, `.mobile-top-bar`, `.mobile-role-pill` |
| `[INDEX: CSS-08]` | L1071 | View 1: Auth Split Layout & Quote | `.auth-split-wrapper`, `.auth-card-side`, `.quote-card`, `.quote-card-watermark` |
| `[INDEX: CSS-09]` | L1360 | Komponen: Cards, Buttons, Inputs | `.card`, `.btn-primary`, `.btn-ghost`, `.input`, `.filter-switch` |
| `[INDEX: CSS-10]` | L1766 | View 2: Dashboard Umat & Hero Glass | `.card-glass`, `.glass-stats-grid`, `.quick-action-card`, `.quick-action-grid` |
| `[INDEX: CSS-11]` | L1891 | View 3: Riwayat Kehadiran (No-Lines) | `.history-cards-list`, `.history-card-item`, `.history-month-badge` |
| `[INDEX: CSS-12]` | L2009 | View 5 & 6: Buku Tamu & Panel Admin | `.kpi-grid-2`, `.events-split-section`, `.event-manage-card.active-event`, `.event-manage-card.archived-event` |
| `[INDEX: CSS-13]` | L2192 | Modal Dialogs, Tabs & Backdrop | `.modal-backdrop`, `.modal-box`, `.modal-tabs`, `.modal-tab-btn` |
| `[INDEX: CSS-14]` | L2509 | Floating Bottom Nav (Mobile) | `.bottom-nav`, `.bottom-nav-item`, `backdrop-filter: blur(24px)` |
| `[INDEX: CSS-15]` | L2657 | Toast Notification Melayang | `#toast-container`, `.toast.success`, `.toast.error` |
| `[INDEX: CSS-16]` | L2711 | View 4: Pengumuman Vihara | `.announcements-page-wrapper`, `.announcement-card.unread` (Aura Merah), `.btn-create-announcement` |
| `[INDEX: CSS-17]` | L3286 | Responsivitas & Reduced Motion | `@media (max-width: 820px)`, `@media (prefers-reduced-motion: reduce)` |

---

### 3.3 [`js/app.js`](file:///c:/AKU_NYOBA/appvihara/js/app.js) — Controller Utama Aplikasi
*Total Seksi: 13 | Garis Baris: ~2150*

| Tag Indeks | Baris | Logika & Fitur | Fungsi Kunci |
| :--- | :---: | :--- | :--- |
| `[INDEX: JS-APP-01]` | L51 | View Routing & State Controller | `navigateTo()`, `currentViewId`, `syncDesktopNavGliders()` |
| `[INDEX: JS-APP-02]` | L206 | View 2: Dashboard Umat | `renderUmatDashboard()`, `handleUserCheckin()` |
| `[INDEX: JS-APP-03]` | L431 | View 3: Riwayat Kehadiran | `renderHistoryPage()`, `handleHistoryFilterChange()` |
| `[INDEX: JS-APP-04]` | L640 | View 6: Panel Acara Pengurus | `renderAdminDashboard()`, `handleDeleteEvent()` |
| `[INDEX: JS-APP-05]` | L768 | Popup Modal Presensi Acara | `openEventAttendanceModal()`, `handleAdminAssignUmat()` |
| `[INDEX: JS-APP-06]` | L958 | Formulir Pembuatan Acara Baru | `handleCreateEventSubmit()`, `selectSpeakerType()` |
| `[INDEX: JS-APP-07]` | L1064 | View 1: Auth Tab Switcher | `switchAuthTab('login' \| 'register')` |
| `[INDEX: JS-APP-08]` | L1087 | Mutiara Dhamma & Dhammapada | `DHAMMAPADA_QUOTES`, `cycleDhammapadaQuote()`, `initDhammapadaQuotes()` |
| `[INDEX: JS-APP-09]` | L1204 | View 5: Buku Tamu Digital | `handleGuestFormSubmit()` |
| `[INDEX: JS-APP-10]` | L1238 | View 7: Profil Umat (Full Page) | `renderUserProfile()`, `handleLogout()` |
| `[INDEX: JS-APP-11]` | L1348 | View 4: Pengumuman & Kabar Vihara | `BANNER_KATHINA_SVG`, `openAnnouncementDetail()`, `renderAnnouncementsPage()`, `toggleCreateAnnouncementPanel()` |
| `[INDEX: JS-APP-12]` | L2024 | Desktop Navbar Glider Motion | `initDesktopNavGlider()`, `syncPillTo()` |
| `[INDEX: JS-APP-13]` | L2104 | Preloader Roda Dhamma Loading | `hideDhammaPreloader()`, `initPreloader()` |

---

### 3.4 [`js/auth.js`](file:///c:/AKU_NYOBA/appvihara/js/auth.js) — Autentikasi & RBAC
*Total Seksi: 5 | Garis Baris: ~180*

| Tag Indeks | Baris | Logika Otoritas | Metode Terdaftar |
| :--- | :---: | :--- | :--- |
| `[INDEX: JS-AUTH-01]` | L19 | Current User & Status Sesi | `ViharaAuth.currentUser()`, `isLoggedIn()`, `isAdmin()`, `isUmat()` |
| `[INDEX: JS-AUTH-02]` | L41 | Login Berbasis Nomor HP | `ViharaAuth.loginWithPhone(phone)` |
| `[INDEX: JS-AUTH-03]` | L60 | Registrasi Akun Baru | `ViharaAuth.register({ name, phone, email, role })` |
| `[INDEX: JS-AUTH-04]` | L106 | Logout & Terminasi Sesi | `ViharaAuth.logout()` |
| `[INDEX: JS-AUTH-05]` | L114 | Route Access Guard (RBAC) | `ViharaAuth.checkRouteAccess(targetView)` |

---

### 3.5 [`js/data.js`](file:///c:/AKU_NYOBA/appvihara/js/data.js) — Data Layer & Persistence
*Total Seksi: 7 | Garis Baris: ~430*

| Tag Indeks | Baris | Lingkup Data | Metode Terdaftar |
| :--- | :---: | :--- | :--- |
| `[INDEX: JS-DATA-01]` | L26 | Storage Keys & Versi Skema | `STORAGE_KEYS`, `DATA_VERSION`, `formatDateIndonesia()` |
| `[INDEX: JS-DATA-02]` | L74 | Seed Data & Reset Inisialisasi | `ViharaData.init()`, `INITIAL_USERS` (`08119999888`) |
| `[INDEX: JS-DATA-03]` | L119 | Manajemen Acara & Auto-Arsip | `getEvents()`, `getActiveEvent()`, `isEventExpired()`, `checkAndArchiveExpiredEvents()`, `createEvent()`, `deleteEvent()` |
| `[INDEX: JS-DATA-04]` | L210 | Database Umat & Role | `getUsers()`, `findUserByPhone()`, `registerUser()`, `updateUser()` |
| `[INDEX: JS-DATA-05]` | L309 | Rekam Jejak Presensi Umat | `getAttendanceList()`, `isUserCheckedInEvent()`, `addAttendanceRecord()` |
| `[INDEX: JS-DATA-06]` | L358 | Buku Tamu Digital Real-Time | `getGuestList()`, `addGuestRecord()`, `findEventForCurrentTime()` |
| `[INDEX: JS-DATA-07]` | L393 | Sesi Aktif & Pembersihan Log | `getSession()`, `setSession()`, `resetAllData()`, `clearAttendanceLogs()` |

---

### 3.6 [`js/admin.js`](file:///c:/AKU_NYOBA/appvihara/js/admin.js) — Operasi Administrasi
*Total Seksi: 4 | Garis Baris: ~260*

| Tag Indeks | Baris | Fitur Admin | Metode Terdaftar |
| :--- | :---: | :--- | :--- |
| `[INDEX: JS-ADMIN-01]` | L23 | Agregasi Statistik Acara | `ViharaAdmin.getEventsWithStats()` |
| `[INDEX: JS-ADMIN-02]` | L46 | Query & Pencarian Daftar Hadir | `ViharaAdmin.getEventDetailsAndAttendees(eventId, query)` |
| `[INDEX: JS-ADMIN-03]` | L93 | Toggle Presensi Manual Admin | `ViharaAdmin.assignUmatPresentToEvent()`, `registerAndAssignUmatToEvent()` |
| `[INDEX: JS-ADMIN-04]` | L145 | Manajemen Jadwal & Ekspor CSV | `ViharaAdmin.createNewEvent()`, `setActiveEvent()`, `exportEventToCSV()` |

---

### 3.7 [`js/animated-bg.js`](file:///c:/AKU_NYOBA/appvihara/js/animated-bg.js) — Kanvas Animasi Parallax
*Total Seksi: 6 | Garis Baris: ~460*

| Tag Indeks | Baris | Logika Kanvas | Komponen Terkait |
| :--- | :---: | :--- | :--- |
| `[INDEX: JS-BG-01]` | L35 | Canvas Setup & Retina DPR | `#animated-bg-canvas`, `ctx.scale(dpr, dpr)` |
| `[INDEX: JS-BG-02]` | L61 | Mouse Physics & Damping | `mouse = { x, y, normX, normY }`, peredaman Lerp `0.05` |
| `[INDEX: JS-BG-03]` | L79 | Partikel Embun Suci Dupa | `class StardustParticle`, palet emas & rose coral |
| `[INDEX: JS-BG-04]` | L165 | Aurora Pendaran Radial | `drawAmbientAurora()`, pendaran senter kursor |
| `[INDEX: JS-BG-05]` | L217 | Vektor Sakral Roda Dhamma | `renderSacredDharmachakra()` (pelek ganda, 8 permata, 8 ara) |
| `[INDEX: JS-BG-06]` | L375 | Siklus Render 60 FPS & Event | `animate()`, `requestAnimationFrame()`, `pointermove`, `visibilitychange` |

---

### 3.8 [`superadmin.html`](file:///c:/AKU_NYOBA/appvihara/superadmin.html) & [`js/superadmin.js`](file:///c:/AKU_NYOBA/appvihara/js/superadmin.js) — Master Portal
*Total Seksi HTML: 6 | Total Seksi JS: 6 | Total Seksi CSS: 8*

| Tag Indeks | File Terkait | Baris | Deskripsi Otoritas |
| :--- | :--- | :---: | :--- |
| `[INDEX: SUPER-HTML-01]` | `superadmin.html` | L33 | Header kapsul obsidian & logout super admin |
| `[INDEX: SUPER-HTML-02]` | `superadmin.html` | L80 | Layar brankas PIN Master Rahasia (`9999`) |
| `[INDEX: SUPER-HTML-03]` | `superadmin.html` | L130 | Dashboard 4 kartu KPI agregat (Umat, Admin, Presensi, Acara) |
| `[INDEX: SUPER-HTML-04]` | `superadmin.html` | L211 | Tabel data master pengguna (desktop) & kartu mobile |
| `[INDEX: SUPER-HTML-05]` | `superadmin.html` | L289 | Danger Zone: pembersihan massal riwayat presensi & buku tamu |
| `[INDEX: SUPER-HTML-06]` | `superadmin.html` | L331 | Modal dialog tambah, edit kontak/email, & hapus user |
| `[INDEX: JS-SUPER-01]` | `js/superadmin.js` | L39 | Verifikasi PIN `SUPERADMIN_SECRET_PIN = '9999'` |
| `[INDEX: JS-SUPER-02]` | `js/superadmin.js` | L78 | Perhitungan metrik `renderDashboard()` |
| `[INDEX: JS-SUPER-03]` | `js/superadmin.js` | L104 | Filtering & pencarian real-time `renderUsersList()` |
| `[INDEX: JS-SUPER-04]` | `js/superadmin.js` | L339 | Form modal `handleCreateUserSubmit()`, `handleEditUserSubmit()` |
| `[INDEX: JS-SUPER-05]` | `js/superadmin.js` | L422 | Proteksi minimal 1 admin & `handleConfirmDeleteUser()` |
| `[INDEX: JS-SUPER-06]` | `js/superadmin.js` | L479 | Ekspor master database `handleExportMasterUsersCSV()` |
| `[INDEX: SUPER-CSS-01]` | `css/superadmin.css` | L24 | Obsidian dark tokens & CSS variables |
| `[INDEX: SUPER-CSS-02]` | `css/superadmin.css` | L129 | Gaya header kapsul dark glass melayang |
| `[INDEX: SUPER-CSS-04]` | `css/superadmin.css` | L315 | Grid kartu KPI 4 metrik dengan border pendar emas |
| `[INDEX: SUPER-CSS-06]` | `css/superadmin.css` | L600 | Desain tabel master pengguna dengan tautan WhatsApp otomatis |
| `[INDEX: SUPER-CSS-07]` | `css/superadmin.css` | L763 | Desain kartu brankas vault PIN terpusat |
| `[INDEX: SUPER-CSS-08]` | `css/superadmin.css` | L816 | Pop-up modal kaca terpusat & notifikasi toast superadmin |

---

## 4. Konvensi Pemeliharaan Kode

1. **Membuat Seksi Baru**: Selalu sertakan tag indeks berurutan di awal blok kode (contoh: `// [INDEX: JS-APP-14]`).
2. **Komentar Fungsi**: Setiap blok indeks dilengkapi deskripsi singkat mengenai `Fungsi` dan `ID/Class Terkait` agar mudah dibaca oleh developer maupun AI assistant.
3. **Pencarian Cepat**: Cukup gunakan kata kunci `[INDEX:` pada fitur pencarian global untuk melihat daftar seluruh seksi di seluruh proyek.

