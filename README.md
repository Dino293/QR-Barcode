# Sistem Otomasi Inventarisasi & Cetak Barcode BMN Cloud PWA
### Balai Penjaminan Mutu Pendidikan (BPMP) Provinsi Jambi - Kemendikbudristek

[![CI Build Verification](https://github.com/Dino293/QR-Barcode/actions/workflows/ci.yml/badge.svg)](https://github.com/Dino293/QR-Barcode/actions/workflows/ci.yml)
[![BMN Cloud Worker](https://github.com/Dino293/QR-Barcode/actions/workflows/bmn_worker.yml/badge.svg)](https://github.com/Dino293/QR-Barcode/actions/workflows/bmn_worker.yml)
[![Vercel Deployment](https://img.shields.io/badge/Vercel-Live_Production-blue?logo=vercel)](https://qr-barcode-bpmp-jambi.vercel.app)
[![PWA Ready](https://img.shields.io/badge/PWA-Installable-purple?logo=pwa)](https://qr-barcode-bpmp-jambi.vercel.app)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?logo=supabase)](https://supabase.com/)
[![RabbitMQ](https://img.shields.io/badge/RabbitMQ-CloudAMQP-FF6600?logo=rabbitmq)](https://www.cloudamqp.com/)
[![Mailtrap](https://img.shields.io/badge/Mailtrap-SMTP_Sandbox-1B998B?logo=mailtrap)](https://mailtrap.io/)
[![Author](https://img.shields.io/badge/Developer-Muhammad_Indra-0A66C2?logo=linkedin)](https://www.linkedin.com/in/muhammad-indra-92198a36b/)

> 🌐 **Aplikasi Web Resmi (Vercel Live):** [https://qr-barcode-bpmp-jambi.vercel.app](https://qr-barcode-bpmp-jambi.vercel.app)  
> 📦 **Repository Source Code:** [https://github.com/Dino293/QR-Barcode](https://github.com/Dino293/QR-Barcode)  
> 👨‍💻 **Developer:** [Muhammad Indra (LinkedIn)](https://www.linkedin.com/in/muhammad-indra-92198a36b/)

---

## 📌 Ringkasan Eksekutif & Latar Belakang

Pengelolaan dan penatausahaan Barang Milik Negara (BMN) di lingkungan instansi pemerintah daerah seperti **Balai Penjaminan Mutu Pendidikan (BPMP) Provinsi Jambi** melibatkan lebih dari **14.300+ aset fisik** yang tersebar di ratusan ruangan dan gedung. Tantangan operasional yang dihadapi meliputi:
1. Lamanya proses pencetakan stiker label barcode fisik secara manual.
2. Ketidakcocokan margin kertas standar stiker A4 yang mengakibatkan stiker terpotong (*spillover*).
3. Sulitnya pencarian aset saat audit inventarisasi fisik di lapangan.
4. Beban proses server yang berat saat sinkronisasi data master dengan API SIMAN Kemenkeu.

Proyek ini dibangun sebagai solusi **Enterprise Full-Stack Cloud & PWA** untuk mengotomatisasi seluruh siklus hidup penatausahaan label barcode BMN secara mandiri, akurat, dan berkecepatan tinggi.

---

## 🏗️ Arsitektur Sistem (Event-Driven & Cloud Native)

```
[Pengguna / Operator Lapangan]
           │
           ▼
[Aplikasi PWA: React 18 + Vite + Tailwind CSS] (Dideploy di Vercel)
     │                     │                       │
     ├─ (Scan Kamera HP)   ├─ (Baca/Tulis Data)    └─ (Kirim Perintah Tugas Berat)
     ▼                     ▼                                       │
[html5-qrcode]     [Supabase Cloud]                                ▼
                 (PostgreSQL 14.359 Data)             [CloudAMQP / RabbitMQ]
                                                               │
                                                   [Background Koki Worker]
                                                  (Python Multithreaded Job)
                                                               │
                                            ┌──────────────────┴──────────────────┐
                                            ▼                                     ▼
                                  (Sync Data SIMAN Kemenkeu)            (Kirim Email Laporan Otomatis)
                                                                                  │
                                                                                  ▼
                                                                        [Mailtrap SMTP Gateway]
```

---

## 🌟 Fitur Utama Sistem

### 1. 🖨️ Format Presisi Kertas Cetak A4 (Standar Fisik Milimeter)
- Dikalibrasi khusus untuk kertas stiker label resmi BMN BPMP Jambi:
  - Dimensi label: `98mm × 44mm` (Preset 12 label) dan `98mm × 38mm` (Preset 14 label).
  - Margin atas `11.14mm`, bawah `3.64mm`, dan samping `4.67mm`.
- **Zero Spillover Guarantee**: Menggunakan aturan `@media print` murni dan styling presisi fisik mm, menjamin tidak ada label yang terpotong pada batas kiri kertas atau tumpah ke lembar berikutnya.

### 2. 📱 Progressive Web App (PWA) Installable di Semua Device
- Dapat diinstal langsung sebagai aplikasi di **Android, iOS, Windows, dan macOS** tanpa harus melalui toko aplikasi.
- Berjalan dalam **Mode Standalone (Layar Penuh)** tanpa bilah alamat browser, memberikan pengalaman seluler native.
- Didukung **Offline Caching (Service Worker Workbox)** untuk akses super cepat tanpa jeda (*zero lag*).

### 3. 📷 Pemindai Barcode / QR Kamera HP & Laptop
- Terintegrasi pustaka `html5-qrcode` yang otomatis mengaktifkan kamera belakang (*rear camera*) smartphone.
- Opsi pemindaian langsung melalui kamera atau upload berkas foto stiker barcode dari galeri.
- Dilengkapi **Web Audio API Synthesizer Beep** saat barcode berhasil terdeteksi.
- **Pencarian Real-Time**: Langsung mencocokkan hasil pemindaian ke dataset lokal atau menanyakan ke database Supabase Cloud.

### 4. 🐘 Database Cloud Terpusat (Supabase PostgreSQL)
- Menampung seluruh **14.359 baris data BMN master** BPMP Provinsi Jambi.
- Didukung indeks relasional (`kode_barang`, `nup`, `kode_ruangan`) dan *Full-Text Search* berbahasa Indonesia.
- *Batch Upsert* performa tinggi yang memigrasikan belasan ribu data hanya dalam waktu **36 detik**.

### 5. 🐇 Antrean Pesan RabbitMQ & Pekerja di Latar Belakang (Worker)
- Menerapkan arsitektur asinkron (*Event-Driven*) menggunakan **CloudAMQP RabbitMQ**.
- Tugas berat seperti sinkronisasi API SIMAN dan pengiriman laporan email dieksekusi secara terpisah oleh worker Python tanpa membebani browser pengguna.

### 6. 📬 Otomatisasi Laporan Email (Mailtrap SMTP)
- Worker secara otomatis menyusun ringkasan HTML eksekutif setelah sinkronisasi selesai dan mengirimkannya ke operator melalui gerbang SMTP Mailtrap.

### 7. ⏱️ Otomatisasi Terjadwal Cloud (GitHub Actions Cron)
- Sistem worker berjalan otomatis di cloud setiap hari **Senin jam 08:00 WIB** atau dapat dipicu secara manual (*workflow_dispatch*) dengan 1 klik dari dashboard GitHub.

---

## 💡 Kelebihan & Manfaat untuk Instansi

1. **Efisiensi Waktu Cetak hingga 90%**:
   Pencetakan label stiker ribuan barang yang sebelumnya memakan waktu berhari-hari kini dapat diselesaikan dalam hitungan menit berkat fitur seleksi rentang cetak (*Print Range Scope*).
2. **Nol Biaya Infrastruktur (Cost-Effective Solo Deployment)**:
   Mengoptimalkan tier gratis dari layanan kelas dunia (Vercel, Supabase, CloudAMQP, Mailtrap, dan GitHub Actions) tanpa memerlukan biaya sewa server bulanan.
3. **Akurasi Data Fisik Tinggi**:
   Menghilangkan potensi human-error penulisan nomor registrasi BMN dengan pemetaan otomatis data SIMAN dan QR Code SVG instan.
4. **Portabilitas Audit Lapangan**:
   Operator BMN cukup membawa smartphone untuk memindai label di ruangan dan langsung memverifikasi status keberadaan barang secara real-time.

---

## 📁 Struktur Direktori Proyek

```text
barcode/
├── .github/workflows/
│   ├── ci.yml                          # Workflow verifikasi build otomatis GitHub Actions
│   └── bmn_worker.yml                  # Otomatisasi worker cron mingguan & trigger manual
│
├── data/                               # Dataset & Berkas Master
│   ├── data.xlsx                       # Database utama BMN (14.360 baris data)
│   ├── siman_cache.json                # Cache hasil query API SIMAN (Anti-Pengulangan)
│   └── backup/                         # Salinan cadangan aman database utama
│       └── data_master_backup.xlsx
│
├── public/                             # Aset PWA & Publik
│   ├── images.png                      # Logo resmi Kemendikbudristek
│   ├── pwa-192x192.png                 # Ikon PWA standar seluler
│   ├── pwa-512x512.png                 # Ikon PWA resolusi tinggi
│   ├── maskable-icon-512x512.png       # Ikon adaptive Android
│   └── apple-touch-icon.png            # Ikon perangkat iOS Apple
│
├── scripts/                            # Modul Otomatisasi Backend (Python)
│   ├── config_queue.py                 # Konfigurasi terpusat RabbitMQ & Mailtrap
│   ├── kirim_tugas.py                  # Producer pengirim tugas ke antrean RabbitMQ
│   ├── koki_worker.py                  # Consumer background worker pemroses antrean
│   ├── migrate_to_supabase.py          # Skrip migrasi batch Excel ke Supabase PostgreSQL
│   ├── 01_sync_siman.py                # Mesin sinkronisasi multithreaded API SIMAN
│   ├── 02_generate_labels.py           # Generator PDF resolusi tinggi ReportLab
│   └── 04_verify_audit.py              # Skrip verifikasi audit kelengkapan data
│
├── src/                                # Source Code Frontend Web (React 18 + Vite)
│   ├── main.jsx                        # Entry point aplikasi React
│   ├── App.jsx                         # Orkestrator utama aplikasi & state modal
│   ├── index.css                       # Desain Tailwind & aturan cetak millimeter
│   ├── components/                     # Komponen UI Modular
│   │   ├── Navbar.jsx                  # Header navigasi, Cloud status, & PWA installer
│   │   ├── Toolbar.jsx                 # Filter ruangan, pencarian instan, paginasi
│   │   ├── A4Sheet.jsx                 # Kontainer layout fisik kertas cetak A4
│   │   ├── LabelCard.jsx               # Komponen stiker barcode presisi millimeter
│   │   ├── ScannerModal.jsx            # Modal pemindai kamera QR & barcode (html5-qrcode)
│   │   ├── UploadModal.jsx             # Modal unggah Excel & sinkronisasi Supabase
│   │   ├── DataModal.jsx               # Editor tabel interaktif seluruh data barang
│   │   ├── SettingsModal.jsx           # Kalibrasi margin, jarak antar label, & font
│   │   └── PrintModal.jsx              # Modal pemilihan rentang cetak lembar
│   ├── hooks/                          # Custom React Hooks
│   │   ├── useLabelData.js             # Hook data manager terhubung Supabase Cloud
│   │   ├── usePrintConfig.js           # Hook konfigurasi presisi cetak
│   │   └── usePwaInstall.js            # Hook deteksi instalasi native PWA
│   └── utils/
│       ├── supabaseClient.js           # Klien Supabase & batch fetcher PostgreSQL
│       ├── excelParser.js              # Parser berkecepatan tinggi SheetJS
│       └── qrEngine.js                 # Generator QR Code SVG murni offline
│
├── Procfile                            # Konfigurasi proses daemon worker di Cloud PaaS
├── index.html                          # Entry HTML dengan metadata PWA lengkap
├── package.json                        # Dependensi modul Node.js
├── vite.config.js                      # Konfigurasi Vite & plugin VitePWA
└── README.md                           # Dokumentasi komprehensif sistem
```

---

## 🚀 Panduan Menjalankan Secara Lokal

### 1. Kloning Repository & Pasang Dependensi
```bash
git clone https://github.com/Dino293/QR-Barcode.git
cd QR-Barcode

# Pasang dependensi Frontend (Node.js)
npm install

# Pasang dependensi Backend Worker (Python)
pip install -r requirements.txt
```

### 2. Jalankan Server Frontend (Vite)
```bash
npm run dev
```
Akses di browser Anda melalui `http://localhost:5173`.

### 3. Menjalankan Antrean & Background Worker
```bash
# Kirim nota tugas ke antrean RabbitMQ
python scripts/kirim_tugas.py --tipe SYNC_SIMAN

# Jalankan worker pemroses antrean
python scripts/koki_worker.py
```

---

## 👨‍💻 Pengembang Sistem

**Muhammad Indra**  
*Full-Stack Web Developer & Data Specialist*  
- 💼 LinkedIn: [linkedin.com/in/muhammad-indra-92198a36b](https://www.linkedin.com/in/muhammad-indra-92198a36b/)  
- 🐙 GitHub: [github.com/Dino293](https://github.com/Dino293)  
- 🏢 Program: Proyek Magang Penataan BMN & Sistem Informasi di **Balai Penjaminan Mutu Pendidikan (BPMP) Provinsi Jambi**
