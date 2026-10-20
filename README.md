# Sistem Cetak Label Barcode BMN - BPMP Provinsi Jambi

[![CI Build Verification](https://github.com/Dino293/QR-Barcode/actions/workflows/ci.yml/badge.svg)](https://github.com/Dino293/QR-Barcode/actions/workflows/ci.yml)
[![Vercel Deployment](https://img.shields.io/badge/Vercel-Live_App-blue?logo=vercel)](https://qr-barcode-bpmp-jambi.vercel.app)
[![React](https://img.shields.io/badge/React-18.3.1-61dafb?logo=react)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-6.2.0-646cff?logo=vite)](https://vitejs.dev/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.4.17-38b2ac?logo=tailwind-css)](https://tailwindcss.com/)

> 🌐 **Website Resmi Online (Vercel):** [https://qr-barcode-bpmp-jambi.vercel.app](https://qr-barcode-bpmp-jambi.vercel.app)  
> 📦 **Repository GitHub:** [https://github.com/Dino293/QR-Barcode](https://github.com/Dino293/QR-Barcode)

Sistem otomasi inventarisasi dan pencetakan label barcode Barang Milik Negara (BMN) untuk **Balai Penjaminan Mutu Pendidikan (BPMP) Provinsi Jambi**. Sistem ini mengintegrasikan sinkronisasi API SIMAN, generator tata letak standar fisik kertas A4 berpresisi tinggi (2 kolom label, 98mm × 44mm), audit kelengkapan cetak, serta aplikasi web interaktif berbasis arsitektur **React Native Style** yang modular dan reusable.

---

## 🌟 Fitur Utama Sistem

1. **Format Standar Presisi Kertas A4 (Fisik MM)**:
   - Dikalibrasi khusus untuk kertas stiker label A4 resmi BMN BPMP Jambi:
     - Lebar label: `98mm` | Tinggi label: `44mm`
     - Margin atas: `11.14mm` | Margin bawah: `3.64mm` | Margin samping: `4.67mm`
   - Anti-terpotong pada sisi kiri dan anti-tumpah (*zero spillover*) pada lembar kedua.
2. **Generator QR Code SVG Offline Murni**:
   - Menghasilkan QR Code SVG secara otomatis dan instan tanpa bergantung pada internet (*zero lag* dan anti-freeze).
3. **Fitur Kelola Data Lengkap**:
   - **Membaca & Menyimpan**: Membaca ribuan data BMN dari Excel (`data/data.xlsx`).
   - **Input Data Baru**: Form input mandiri untuk menambahkan barang baru langsung ke antarmuka dengan QR otomatis.
   - **Editor Data & Hapus**: Mengedit atribut barang atau menghapus entri langsung dari tabel interaktif.
   - **Auto-Urut NUP**: Pengurutan nomor urut pendaftaran (NUP) batch secara berurutan.
4. **Pencetakan Terarah (Print Range Modal)**:
   - Pengguna dapat memilih untuk mencetak seluruh lembar atau memilih rentang halaman tertentu (misal: lembar 1 s.d. 3).
5. **Otomatisasi CI/CD & Deploy Cloud**:
   - Terintegrasi penuh dengan **GitHub Actions** untuk verifikasi build otomatis setiap push.
   - *Continuous Deployment* langsung ke **Vercel** dengan sertifikat SSL (HTTPS).

---

## 📁 Struktur Direktori & Berkas

```text
barcode/
├── .github/workflows/                  # Otomatisasi CI/CD
│   └── ci.yml                          # Workflow verifikasi build otomatis GitHub Actions
│
├── data/                               # Database dan berkas referensi
│   ├── data.xlsx                       # Database utama BMN (14.360 baris data)
│   ├── clean_room_building_map.json    # Pemetaan relasi kode/nama ruangan ke nama gedung
│   ├── siman_cache.json                # Cache hasil query API SIMAN (Anti-Pengulangan)
│   └── backup/                         # Salinan cadangan aman database utama
│       └── data_master_backup.xlsx
│
├── public/                             # Aset publik statis (Logo Kemendikbudristek)
│   └── images.png
│
├── src/                                # Source Code Aplikasi Web Utama (Vite + React)
│   ├── main.jsx                        # Entry point React 18 createRoot
│   ├── App.jsx                         # Root Component aplikasi
│   ├── index.css                       # Aturan CSS presisi millimeter & @media print
│   ├── components/                     # Komponen UI Modular
│   │   ├── primitives/index.jsx        # Primitif React Native (View, Text, Image, Pressable)
│   │   ├── Navbar.jsx                  # Header navigasi & aksi utama
│   │   ├── Toolbar.jsx                 # Filter ruangan, pencarian, preset layout
│   │   ├── A4Sheet.jsx                 # Kontainer fisik lembar cetak A4
│   │   ├── LabelCard.jsx               # Kartu label barcode tunggal beroutline tegas
│   │   ├── DataModal.jsx               # Tabel dataset viewer, editor, & input data baru
│   │   ├── PrintModal.jsx              # Modal seleksi rentang cetak lembar
│   │   ├── SettingsModal.jsx           # Pengaturan presisi mm, font, & margin
│   │   ├── UploadModal.jsx             # Pengunggah file Excel lokal
│   │   └── HeaderModal.jsx             # Pengaturan teks kop instansi & satker
│   ├── hooks/                          # Custom Hooks
│   │   ├── useLabelData.js             # State pengelolaan data barang & paginasi
│   │   └── usePrintConfig.js           # Pengelolaan konfigurasi mm & sinkronisasi CSS
│   └── utils/                          # Helper & Generator
│       ├── qrEngine.js                 # Generator QR Code SVG murni
│       ├── excelParser.js              # Parser data SheetJS
│       └── defaultData.js              # Konfigurasi standar
│
├── web/                                # Versi Alternatif Standalone (Live Server Ready)
│   ├── index.html                      # Entry point bersih tanpa build step
│   └── src/                            # Arsitektur modular HTM + ES Modules
│
├── scripts/                            # Skrip otomatisasi Python & Node.js
│   ├── 01_sync_siman.py                # Alur 1: Sinkronisasi database Excel dengan API SIMAN
│   ├── 02_generate_labels.py           # Alur 2: Pembuatan template HTML & label per ruangan
│   ├── 03_render_pdfs.js               # Alur 3: Render template HTML ke berkas PDF (CDP)
│   └── 04_verify_audit.py              # Alur 4: Audit dan verifikasi kelengkapan PDF ruangan
│
├── package.json                        # Konfigurasi dependensi Node.js & Vite
├── tailwind.config.js                  # Konfigurasi Tailwind CSS v3
├── vercel.json                         # Konfigurasi deployment & SPA routing Vercel
├── .gitignore                          # Aturan pencegahan file berat/cache ke Git
└── README.md                           # Dokumentasi komprehensif sistem
```

---

## 🚀 Menjalankan Aplikasi Secara Lokal

### 1. Menggunakan Vite Dev Server (Direkomendasikan)
```bash
# Instalasi dependensi
npm install

# Jalankan server pengembangan lokal
npm run dev
```
Buka browser di alamat: `http://localhost:5173`

### 2. Menguji Build Produksi
```bash
npm run build
npm run preview
```

### 3. Menggunakan Live Server (Versi Standalone `web/`)
Buka berkas `web/index.html` menggunakan ekstensi **Live Server** di VS Code (`http://127.0.0.1:5500/web/index.html`).

---

## 🧪 Pengujian Kualitas & Keamanan (QA)

1. **GitHub Actions (CI/CD)**:
   - Terpasang pada [`.github/workflows/ci.yml`](.github/workflows/ci.yml) yang memverifikasi setiap *commit* dan *pull request* pada branch `main`.
2. **Audit Google Lighthouse**:
   - Diuji langsung via DevTools Chrome (F12 -> Lighthouse) pada URL produksi untuk memastikan performa tinggi, aksesibilitas prima, dan standar SEO web modern.
3. **Pengujian Keterbacaan QR Barcode**:
   - Seluruh kode QR yang dihasilkan dapat dipindai (*scanned*) secara presisi oleh kamera smartphone, Google Lens, maupun scanner barcode genggam.

---

## 👨‍💻 Kontributor & Lisensi

Dikembangkan untuk kebutuhan inventarisasi Barang Milik Negara (BMN) di **Badan Penjaminan Mutu Pendidikan (BPMP) Provinsi Jambi**.
* Pengembang: **Indra (Dino293)**
* Lisensi: MIT License
