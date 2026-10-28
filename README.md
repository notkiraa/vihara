# Buku Tamu Digital — Mobile Web (Halaman User)

Prototype mobile web untuk **halaman user biasa** sistem Buku Tamu Digital kelurahan.
Dibuat sebagai pendamping desain PC (halaman pengurus), dengan tema **marun → putih**,
gradien, transisi antar halaman, dan loading animation yang **ringan** (hanya `transform`
& `opacity` yang GPU-accelerated, plus dukungan `prefers-reduced-motion`).

## Halaman

| Halaman | File | Keterangan |
|---------|------|------------|
| Splash | `index.html` | Logo pop-in + loading bar, auto lanjut ke login |
| Login | `login.html` | Form masuk, animasi stagger, tombol dengan spinner |
| Beranda | `home.html` | Kartu kaca + statistik, aksi cepat, aktivitas terakhir |
| Isi Buku Tamu | `isi.html` | Form kehadiran, lokasi otomatis, chip keperluan |
| Sukses | `sukses.html` | Checkmark animasi + ripple + confetti + struk digital |
| Riwayat | `riwayat.html` | Skeleton shimmer → timeline kehadiran |

## Struktur

```
.
├── index.html          # splash / loading
├── login.html
├── home.html
├── isi.html
├── sukses.html
├── riwayat.html
└── assets/
    ├── style.css       # design system + semua animasi
    └── app.js          # transisi antar halaman + interaksi
```

## Cara menjalankan

Tidak perlu build — HTML/CSS/JS murni. Buka `index.html` langsung di browser,
atau jalankan server statis sederhana:

```bash
# Python
python3 -m http.server 8000
# lalu buka http://localhost:8000

# atau Node
npx serve .
```

## Teknologi

- HTML + CSS (Tailwind-free, CSS variables untuk design system)
- Font: Plus Jakarta Sans
- Ikon: inline SVG
- Animasi: CSS `@keyframes` (ringan, GPU-accelerated)
