# DOKUMENTASI SISTEM INFORMASI & APLIKASI
## Sistem Otomasi Inventarisasi & Cetak Barcode BMN Cloud PWA
### Balai Penjaminan Mutu Pendidikan (BPMP) Provinsi Jambi - Kementerian Pendidikan Dasar dan Menengah

---

| Metadata Dokumen | Keterangan |
| :--- | :--- |
| **Nama Aplikasi** | Sistem Otomasi Inventarisasi & Cetak Barcode BMN Cloud PWA |
| **Instansi** | Balai Penjaminan Mutu Pendidikan (BPMP) Provinsi Jambi |
| **Kementerian** | Kementerian Pendidikan Dasar dan Menengah (Kemendikdasmen) |
| **Pengembang** | Muhammad Indra (*Full-Stack Web Developer & Data Specialist*) |
| **Tautan Aplikasi Live** | [https://qr-barcode-bpmp-jambi.vercel.app](https://qr-barcode-bpmp-jambi.vercel.app) |
| **Repository GitHub** | [https://github.com/Dino293/QR-Barcode](https://github.com/Dino293/QR-Barcode) |
| **Penempatan Dokumen** | Google Docs Tab 2 (ID Tab: `t.ssttzidrcedm`) |
| **Waktu Pembuatan** | ± 5 - 7 Hari Kerja (Siklus Penuh Rancang, Bangun, Uji, Deploy) |

---

## 1. DESKRIPSI APLIKASI

**Sistem Otomasi Inventarisasi & Cetak Barcode BMN Cloud PWA** adalah aplikasi enterprise berbasis web modern (*Progressive Web App*) terintegrasi cloud yang dirancang khusus untuk memodernisasi, mempercepat, dan mengotomatisasi seluruh siklus hidup penatausahaan label stiker fisik dan audit inventarisasi Barang Milik Negara (BMN) di lingkungan **Balai Penjaminan Mutu Pendidikan (BPMP) Provinsi Jambi**.

Aplikasi ini mengelola lebih dari **14.359 data aset fisik** yang tersebar di ratusan ruangan, gedung, dan wisma instansi. Dibangun dengan memadukan teknologi *frontend* berkinerja tinggi (React 18 + Vite), tata letak cetak fisik milimeter (*Zero Spillover*), basis data *cloud* terdistribusi (Supabase PostgreSQL), pemindai visual kamera gawai (*html5-qrcode*), arsitektur antrean pesan asinkron (*RabbitMQ*), dan otomatisasi *worker* terjadwal (*GitHub Actions Cron*).

Aplikasi ini dapat diakses secara langsung melalui peramban web maupun diinstalasi secara mandiri (*standalone app*) pada perangkat Android, iOS, Windows, dan macOS tanpa melalui toko aplikasi konvensional.

---

## 2. FUNGSI APLIKASI

Aplikasi ini memiliki 5 (lima) fungsi pokok dalam mendukung tata kelola BMN:

1. **Fungsi Tata Letak & Pencetakan Label Presisi Milimeter (*Zero Spillover Print*)**:
   Menghasilkan tata letak stiker label barcode siap cetak pada kertas standar A4 dengan akurasi milimeter murni sesuai ukuran fisik kertas label resmi instansi (preset 12 label ukuran 98mm × 44mm dan preset 14 label ukuran 98mm × 38mm), menjamin stiker tidak terpotong margin printer.
2. **Fungsi Pemindai Cepat (*Mobile & Desktop Barcode/QR Scanner*)**:
   Memungkinkan kamera *smartphone* atau laptop difungsikan sebagai alat pemindai stiker barcode/QR code BMN secara instan dengan respon audio (*beep sound*), pencarian otomatis ke basis data, dan verifikasi kondisi fisik barang langsung di ruangan.
3. **Fungsi Tata Kelola Data Master Aset Terpusat (*Cloud Database Management*)**:
   Menyimpan, memperbarui, menambah, dan menyaring 14.359 entri data BMN secara terpusat di cloud database Supabase PostgreSQL yang dapat diakses bersama secara aman oleh tim inventarisasi.
4. **Fungsi Seleksi & Filter Cepat Ruangan (*Dynamic Filtering & Print Range*)**:
   Menyediakan pencarian instan berdasarkan Nama Barang, Nomor Urut Pendaftaran (NUP), Kode Barang, serta pengelompokan otomatis berdasarkan nama/kode ruangan sehingga pencetakan stiker label dapat dilakukan per ruangan atau per rentang halaman tertentu secara efisien.
5. **Fungsi Otomatisasi Antrean & Pelaporan Latar Belakang (*Background Worker & Mailtrap SMTP*)**:
   Menjalankan tugas-tugas komputasi berat (seperti sinkronisasi massal API SIMAN Kemenkeu dan pembuatan arsip) di latar belakang menggunakan antrean RabbitMQ, diakhiri dengan laporan rekapitulasi otomatis ke surel (*email notification*).

---

## 3. MANFAAT APLIKASI BAGI INSTANSI

Penerapan aplikasi ini memberikan dampak dan manfaat strategis bagi operasional BPMP Provinsi Jambi:

1. **Efisiensi Waktu Kerja hingga 90%**:
   Pencetakan stiker label inventaris ribuan barang yang sebelumnya memerlukan pengetikan atau penataan format dokumen manual berhari-hari kini dapat diselesaikan dalam hitungan menit secara otomatis.
2. **Efisiensi Kertas dan Biaya (*Zero Waste & Cost Saving*)**:
   Fitur *Print Range Selection* dan presisi margin milimeter mencegah kesalahan cetak (*miskalibrasi*), lembar kosong (*blank pages*), dan kerusakan lembaran stiker berharga mahal.
3. **Nol Biaya Infrastruktur Server (*100% Free-Tier Architecture*)**:
   Sistem diorkestrasi menggunakan layanan komputasi awan andal (Vercel, Supabase, CloudAMQP RabbitMQ, Mailtrap, dan GitHub Actions) tanpa membebani Anggaran Pendapatan dan Belanja Negara (APBN) instansi untuk biaya sewa server bulanan.
4. **Akurasi Data Tinggi & Minim Kesalahan (*Zero Human Error*)**:
   Nomor barcode, kode satker, tahun perolehan, dan kode barang langsung dirender otomatis ke dalam format Code 128 dan QR Code SVG beresolusi tajam sesuai standar sistem SIMAN Kementerian Keuangan.
5. **Kemudahan Audit Lapangan (*Mobile Mobility & PWA*)**:
   Petugas auditor atau operator penatausahaan BMN tidak perlu membawa berkas fisik tebal saat sensus/audit barang; cukup membawa *smartphone* yang telah terpasang aplikasi untuk memindai dan mencocokkan aset secara langsung di lokasi.

---

## 4. ESTIMASI & WAKTU PEMBUATAN (DEVELOPMENT TIMELINE)

Pengembangan sistem dirancang dan diselesaikan dalam jangka waktu **± 5 hingga 7 hari kerja** (Oktober 2026) dengan tahapan terstruktur:

| Fase / Waktu | Aktivitas & Capaian Pekerjaan | Status |
| :--- | :--- | :---: |
| **Hari 1** | • Analisis kebutuhan operasional penatausahaan BMN BPMP Jambi.<br>• Pengukuran fisik presisi kertas stiker stiker resmi (lebar, tinggi, margin atas, margin samping).<br>• Perancangan struktur basis data & arsitektur aplikasi. | Selesai |
| **Hari 2** | • Inisialisasi proyek Frontend menggunakan React 18, Vite, dan Tailwind CSS.<br>• Implementasi mesin tata letak kertas cetak A4 fisik milimeter (`A4Sheet`, `LabelCard`).<br>• Pengaturan media query `@media print` untuk eliminasi *spillover*. | Selesai |
| **Hari 3** | • Integrasi PWA (*Progressive Web App*) mandiri dengan Service Worker & Workbox offline caching.<br>• Integrasi modul kamera pemindai QR/Barcode (`html5-qrcode`) dengan Web Audio API Beep. | Selesai |
| **Hari 4** | • Migrasi massal 14.359 data master Excel ke cloud database Supabase PostgreSQL.<br>• Pembuatan indeks relasional cepat (`kode_barang`, `nup`, `kode_ruangan`).<br>• Implementasi fitur filter ruangan dinamis, pencarian instan, dan editor data spreadsheet. | Selesai |
| **Hari 5** | • Pembangunan arsitektur *Event-Driven* dengan RabbitMQ (CloudAMQP) & worker Python.<br>• Integrasi gerbang email laporan otomatis via Mailtrap SMTP.<br>• Konfigurasi otomatisasi jadwal mingguan di cloud menggunakan GitHub Actions Cron. | Selesai |
| **Hari 6 - 7** | • Uji coba pencetakan fisik menggunakan printer kantor pada berbagai jenis kertas label.<br>• Standardisasi dan validasi data kode satker, NUP, dan deskripsi barang.<br>• *Build verification*, *CI/CD pipeline*, dan *final live deployment* ke Vercel Production. | Selesai |

---

## 5. FITUR-FITUR UTAMA APLIKASI

Aplikasi dilengkapi berbagai fitur modern berstandar industri:

### 1. Preset Tata Letak Cetak Presisi Tinggi (98×44mm & 98×38mm)
- Tersedia pilihan preset cetak: **12 Label/Halaman** (dimensi `98mm × 44mm`) dan **14 Label/Halaman** (dimensi `98mm × 38mm`).
- Dikalibrasi presisi dengan margin kertas stiker standar: margin atas `11.14mm`, bawah `3.64mm`, samping `4.67mm`, dan jarak antar label `2.84mm`.
- Dilengkapi fitur kustomisasi manual margin dan dimensi stiker pada menu Pengaturan Cetak.

### 2. Kemampuan PWA (Progressive Web App) Installable
- Pengguna dapat mengklik tombol **"Install PWA"** di navbar untuk memasang aplikasi ke layar utama (*homescreen*) smartphone Android/iOS atau desktop Windows/macOS.
- Berjalan dalam mode *standalone fullscreen* (tampilan aplikasi murni tanpa URL bar browser).
- Dilengkapi *offline cache* berkas statis melalui *Service Worker Workbox*.

### 3. Pemindai Kamera Barcode & QR Code (Real-Time Audio Beep)
- Memanfaatkan kamera belakang (*rear camera*) smartphone atau webcam laptop dengan *autofocus*.
- Menyediakan opsi alternatif: unggah berkas foto label stiker langsung dari galeri HP.
- Menghasilkan nada *beep* interaktif via *Web Audio API* saat barcode berhasil dibaca.
- Otomatis mencocokkan hasil pindaian dengan data BMN lokal maupun pencarian ke cloud Supabase.

### 4. Integrasi Basis Data Cloud Supabase (PostgreSQL 14.359 Data)
- Menyimpan seluruh data aset BMN BPMP Jambi secara aman dan terenkripsi.
- Mendukung fitur *Full-Text Search* berbahasa Indonesia dan kueri responsif berkecepatan milidetik.
- Dilengkapi indikator status koneksi cloud *real-time* di bilah navigasi atas (*Supabase Cloud Connected*).

### 5. Filter Cepat Ruangan & Pencarian Instan (Instant Search)
- Menu drop-down otomatis mengelompokkan ribuan aset berdasarkan ruangan penempatan (misal: Ruang Aula, Gudang, Ruang Pengembangan Model, dll.).
- Bilah pencarian instan cerdas yang langsung memfilter data berdasarkan kata kunci Nama Barang, Kode Barang, maupun NUP.

### 6. Pemilih Rentang Halaman Cetak (Print Range Scope Selector)
- Fitur selektif untuk mencetak halaman tertentu saja (misal: halaman 1 s.d. 3 atau halaman 5).
- Menghindari pemborosan kertas dan tinta saat pengguna hanya membutuhkan stiker pengganti untuk barang tertentu.
- Didukung pintasan *keyboard* cepat `Ctrl + P`.

### 7. Editor Data Interaktif Terintegrasi (Data Modal)
- Pengguna dapat melihat, menambah barang baru, menyunting data yang salah, dan menghapus data langsung dari antarmuka web tanpa harus membuka aplikasi Excel eksternal.

### 8. Pengunggah & Parser Berkas Excel (.xlsx)
- Mendukung pengunggahan berkas Excel master baru menggunakan pustaka *SheetJS* berkecepatan tinggi.
- Otomatis memvalidasi kolom-kolom wajib BMN: Kode Satker, Kode Barang, NUP, Nama Barang, Merek/Tipe, Tahun Perolehan, dan Nama Ruangan.

### 9. Antrean Pesan RabbitMQ & Background Koki Worker
- Arsitektur berbasis peristiwa (*Event-Driven*) dengan CloudAMQP RabbitMQ.
- Tugas-tugas berat seperti sinkronisasi dengan API SIMAN Kemenkeu diproses secara terpisah oleh worker Python tanpa mengganggu responsivitas antarmuka web.

### 10. Otomatisasi Cloud Terjadwal & Laporan Notifikasi Email
- Terintegrasi *GitHub Actions Workflow Cron* yang menjalankan worker otomatis setiap hari Senin pukul 08:00 WIB.
- Mengirimkan ringkasan laporan hasil sinkronisasi data melalui gerbang email *Mailtrap SMTP*.

---

## 6. FOTO & TANGKAPAN LAYAR (SCREENSHOTS) APLIKASI

Tangkapan layar antarmuka aplikasi disimpan pada direktori proyek `docs/screenshots/` dan dapat langsung disematkan pada dokumen:

### 1. Antarmuka Dashboard Utama & Lembar Cetak Stiker A4 BMN
*Tampilan lembar cetak presisi kertas A4 berisi 12 label stiker BMN dengan barcode Code 128, QR Code, logo instansi, satker, NUP, nama barang, filter ruangan, dan status koneksi cloud.*  
- **File Asset:** `docs/screenshots/01_dashboard_cetak_barcode.jpg`

---

### 2. Antarmuka Modal Pemindai Kamera Barcode & QR Code
*Tampilan antarmuka pemindai kamera aktif untuk audit fisik lapangan beserta hasil verifikasi data instan ke basis data Supabase.*  
- **File Asset:** `docs/screenshots/02_pemindai_scanner_modal.jpg`

---

## 7. TEKNOLOGI SISTEM & REFERENSI REPOSITORY GITHUB

Sistem ini bersifat *open-source* dan dapat diaudit, dikembangkan, serta dirujuk melalui informasi teknis berikut:

| Komponen | Spesifikasi / Teknologi yang Digunakan |
| :--- | :--- |
| **Frontend Framework** | React 18, Vite 5, Tailwind CSS |
| **PWA & Offline** | Vite Plugin PWA, Service Worker, Workbox |
| **Barcode & QR Engine** | JsBarcode (Code 128), qrcode.react (SVG Mode), html5-qrcode |
| **Excel Parser** | SheetJS (xlsx) |
| **Cloud Database** | Supabase (PostgreSQL 15 dengan RLS & Triggers) |
| **Message Broker** | CloudAMQP (RabbitMQ 3.12) |
| **Worker Backend** | Python 3.11, Pika, ReportLab PDF, Requests |
| **Email Gateway** | Mailtrap SMTP Server |
| **Hosting & CI/CD** | Vercel Serverless Hosting, GitHub Actions CI/CD & Cron |
| **Repository Resmi** | [https://github.com/Dino293/QR-Barcode](https://github.com/Dino293/QR-Barcode) |
| **Demo Aplikasi Online** | [https://qr-barcode-bpmp-jambi.vercel.app](https://qr-barcode-bpmp-jambi.vercel.app) |

---
*Dokumen ini disusun sebagai lampiran teknis resmi pelaporan sistem informasi dan penatausahaan aset BMN di BPMP Provinsi Jambi.*
