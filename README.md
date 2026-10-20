# Sistem Cetak Label Barcode BMN - BPMP Provinsi Jambi

Sistem otomasi inventarisasi dan pencetakan label barcode Barang Milik Negara (BMN) untuk Badan Penjaminan Mutu Pendidikan (BPMP) Provinsi Jambi. Sistem ini mengintegrasikan sinkronisasi API SIMAN, generator tata letak standar A4 presisi (2 kolom), audit kesiapan cetak, serta aplikasi web interaktif berbasis arsitektur **React Native Style** yang modular, reusable, dan kompatibel langsung dengan **Live Server**.

---

## 📁 Struktur Direktori & Berkas

```text
barcode/
├── data/                               # Database dan berkas referensi
│   ├── data.xlsx                       # Database utama BMN (14.360 baris ter-update)
│   ├── clean_room_building_map.json    # Pemetaan relasi kode/nama ruangan ke nama gedung
│   ├── siman_cache.json                # Cache hasil query API SIMAN (Anti-Pengulangan)
│   └── backup/                         # Salinan cadangan aman database utama
│       └── data_master_backup.xlsx
│
├── scripts/                            # Skrip alur kerja utama (terurut 01 - 04)
│   ├── 01_sync_siman.py                # Alur 1: Sinkronisasi database Excel dengan API SIMAN
│   ├── 02_generate_labels.py           # Alur 2: Pembuatan template HTML & label per ruangan
│   ├── 03_render_pdfs.js               # Alur 3: Render template HTML ke berkas PDF (Chrome CDP)
│   ├── 04_verify_audit.py              # Alur 4: Audit dan verifikasi kelengkapan PDF ruangan
│   └── archive/                        # Skrip pengelompokan eksperimen sebelumnya
│       └── reorganize_by_item.py
│
├── web/                                # Aplikasi antarmuka web interaktif (Live Server Ready)
│   ├── index.html                      # Entry point bersih (<60 baris) dengan Tailwind CSS
│   ├── images.png                      # Logo resmi Kemendikbudristek
│   └── src/                            # Arsitektur Modular ala React Native
│       ├── App.js                      # Root Component App
│       ├── index.js                    # React 18 createRoot mount
│       ├── components/                 # Komponen Reusable
│       │   ├── primitives/index.js     # React Native primitives (View, Text, Image, Pressable)
│       │   ├── Navbar.js               # Header navigasi & aksi utama
│       │   ├── Toolbar.js              # Kontrol filter, layout 12/14, P & T mm, zoom
│       │   ├── A4Sheet.js              # Kontainer lembar kerja fisik A4 & running header
│       │   ├── LabelCard.js            # Kartu label barcode tunggal
│       │   ├── SettingsModal.js        # Modal pengaturan presisi milimeter & font
│       │   ├── UploadModal.js          # Modal unggah Excel / muat database lokal
│       │   ├── HeaderModal.js          # Modal konfigurasi teks kop & satker
│       │   ├── DataModal.js            # Modal tabel dataset viewer & editor
│       │   └── SequenceModal.js        # Modal auto urut penomoran NUP batch
│       ├── hooks/                      # Custom State Hooks
│       │   ├── useLabelData.js         # Pengelolaan dataset, filter ruangan, paginasi
│       │   └── usePrintConfig.js       # Pengelolaan konfigurasi mm & sinkronisasi CSS root
│       ├── utils/                      # Helper & Parser
│       │   ├── htm.js & htm_core.js    # Compiler JSX-like template tanpa build step
│       │   ├── qrEngine.js             # Generator QR Code offline murni SVG
│       │   ├── excelParser.js          # Parser SheetJS untuk format data.xlsx
│       │   └── defaultData.js          # Konfigurasi standar & dataset contoh
│       └── styles/
│           └── print.css               # Aturan presisi cetak printer fisik A4 (@media print)
│
├── output_pdf/                         # Hasil akhir 239 berkas PDF siap cetak per ruangan
├── qr_cache/                           # Cache lokal 11.823 gambar QR Code SIMAN (PNG)
├── .venv/                              # Virtual Environment Python
├── index.html                          # Tautan cepat (shortcut redirect) ke web/index.html
├── requirements.txt                    # Dependensi paket Python
└── README.md                           # Dokumentasi alur kerja dan petunjuk penggunaan
```

---

## 🚀 Alur Kerja Sistem (Workflow)

Seluruh skrip otomasi pada folder `scripts/` telah dinomori secara berurutan sesuai alur kerja data:

### Alur 1: Sinkronisasi API SIMAN ke Excel
Mengecek baris data pada sheet `Database` di `data/data.xlsx` yang belum memiliki barcode QR, lalu mengambil gambar QR dari API SIMAN BPMP Jambi secara paralel (15 worker).
```bash
python scripts/01_sync_siman.py
```
> **Catatan:** Sistem memanfaatkan `data/siman_cache.json` sehingga data yang sudah pernah dicek tidak akan di-request ulang ke server.

---

### Alur 2: Generate Template Label Ruangan
Mengelompokkan seluruh barang berdasarkan 239 ruangan dan gedung, lalu membuat template HTML standar presisi 2 kolom.
```bash
python scripts/02_generate_labels.py
```

---

### Alur 3: Render Template ke Berkas PDF
Mengonversi seluruh template HTML ruangan menjadi berkas PDF siap cetak menggunakan Google Chrome Headless via Chrome DevTools Protocol (CDP).
```bash
node scripts/03_render_pdfs.js
```

---

### Alur 4: Audit & Verifikasi Berkas Cetak
Memeriksa integritas berkas PDF pada folder `output_pdf/` terhadap seluruh 239 ruangan di database Excel.
```bash
python scripts/04_verify_audit.py
```

---

## 🌐 Menjalankan Aplikasi Web di Live Server

Aplikasi web sekarang sudah terpecah menjadi komponen-komponen terpisah bergaya **React Native** (`View`, `Text`, `Image`, `Pressable`) dengan **Tailwind CSS**, tanpa perlu melakukan build atau kompilasi rumit (`Zero Build Step`):

1. **Jalankan dengan Live Server (VS Code)**:
   - Klik kanan pada berkas `web/index.html` (atau klik tombol **Go Live** di pojok kanan bawah VS Code).
   - Buka alamat `http://127.0.0.1:5500/web/index.html` di browser.
2. **Fitur yang Tersedia**:
   - Pratinjau lembar kerja fisik A4 dengan tata letak presisi 2 kolom.
   - Pilihan susunan preset: 6 baris (12 label) atau 7 baris (14 label) per lembar A4.
   - Penyesuaian bebas ukuran panjang (P) dan tinggi (T) label dalam milimeter.
   - Modal Pengaturan Presisi MM (margin lembar, jarak kolom/baris, ukuran QR, font tipografi).
   - Filter ruangan instan dan pencarian barang *real-time*.
   - Unggah file Excel langsung di browser atau muat langsung `data/data.xlsx`.
   - Cetak langsung dokumen dengan menekan tombol **Cetak Dokumen** atau `Ctrl + P`.
