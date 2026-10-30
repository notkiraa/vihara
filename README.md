# Vihara Amurwa Bhumi - Sistem Presensi & Manajemen Umat

Aplikasi presensi digital umat berbasis geolokasi (radius 25 meter) dan QR Code Dhammasala dengan integrasi PostgreSQL Supabase.

---

## 📁 Struktur Direktori Proyek

Proyek ini telah dikelompokkan ke dalam folder yang rapi dan modular:

```text
appvihara/
├── public/                 # 🌐 FOLDER KHUSUS: File Esensial Web (Aplikasi & Portal)
│   ├── index.html          # Halaman aplikasi presensi utama & panel pengurus
│   ├── superadmin.html     # Portal Master Super Administrator
│   ├── superadmin/         # Routing subfolder portal superadmin
│   ├── css/                # Stylesheet antarmuka (style.css, superadmin.css)
│   ├── js/                 # Logika modular aplikasi (auth, geo, qr, data, admin, superadmin)
│   │   └── libs/           # Pustaka scanner & QR generator (html5-qrcode, qrcodejs)
│   └── assets/             # Aset gambar & vektor logo vihara
│
├── docs/                   # 📚 Dokumentasi Proyek
│   ├── ALURBESAR.md        # Alur arsitektur dan sistem alur kerja utama
│   ├── DOKUMENTASI_PEMBELAJARAN.md  # Jurnal teknis & rekam jejak penyelesaian masalah (Entri #01 - #14)
│   ├── GLOSSARY.md         # Glosarium istilah sistem & domain
│   └── ScenarioTest.md     # Skenario pengujian manual & checklist verifikasi
│
├── tests/                  # 🧪 Pengujian Otomatis (Test Suites)
│   ├── run_scenario_test.cjs   # Validasi 16 skenario operasional (Acara, Sync, Geolokasi)
│   ├── test_security_audit.cjs # Validasi 11 skenario audit keamanan & privilege boundary
│   ├── test_qr_feature.cjs     # Validasi 21 skenario fitur QR Dhammasala & buku tamu
│   ├── scan_onclick.cjs        # Scanner static linting event handler
│   ├── scan_xss.cjs            # Scanner static linting sanitasi DOM/XSS
│   └── mock_supabase.cjs       # Mock in-memory client Supabase untuk headless testing
│
├── supabase/               # 🗄️ Database PostgreSQL & Migrasi Supabase
│   ├── schema.sql          # Skema DDL tabel Supabase (events, users, attendance, dll)
│   ├── migrations...       # Skrip migrasi kolom dan konfigurasi
│   └── SUPABASE_GUIDE.md   # Panduan konfigurasi dan setup lingkungan cloud
│
├── scripts/                # ⚙️ Skrip Otomasi Pemeliharaan
│   └── batch-input-users.js # CLI tool untuk impor massal data umat dari CSV/JSON
│
├── data/                   # 📄 Data Template
│   ├── users_template.csv  # Template format file CSV impor
│   └── users_template.json # Template format file JSON impor
│
├── archive/                # 📦 Arsip File Desain & Aset Lama
├── package.json            # Konfigurasi npm scripts dan dependensi dev
├── vercel.json             # Konfigurasi deployment hosting Vercel
└── index.html              # Fallback redirector lokal untuk Live Server
```

---

## 🚀 Perintah Pengujian (Automated Testing)

Jalankan seluruh suite pengujian otomatis:
```bash
npm test
```

Atau jalankan per modul pengujian:
```bash
npm run test:scenarios   # Uji seluruh skenario di ScenarioTest.md
npm run test:security    # Uji audit keamanan & proteksi privilege
npm run test:qr          # Uji logika fallback QR Dhammasala & buku tamu
npm run scan:xss         # Pemindaian potensi kerentanan DOM XSS
```
