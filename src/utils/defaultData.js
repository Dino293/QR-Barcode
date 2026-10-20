/**
 * Konfigurasi Default dan Contoh Dataset Awal BMN BPMP Provinsi Jambi
 */

export const DEFAULT_HEADER_CONFIG = {
  instansiLine1: "KEMENTERIAN PENDIDIKAN DASAR DAN",
  instansiLine2: "MENENGAH",
  satkerCode: "138041000693242000KD",
  logoUrl: "images.png"
};

export const DEFAULT_PRINT_CONFIG = {
  pageWidth: 210, // mm
  pageHeight: 297, // mm
  marginTop: 11.14, // mm
  marginBottom: 3.64, // mm
  marginLeft: 4.67, // mm
  marginRight: 4.67, // mm
  labelWidth: 98, // mm
  labelHeight: 44, // mm
  colGap: 4.67, // mm
  rowGap: 3.64, // mm
  rowsPerPage: 6, // 6 baris x 2 kolom = 12 label
  colsPerPage: 2,
  qrSize: 21, // mm
  logoSize: 6, // mm
  fontSizeInstansi: 10.5, // pt
  fontSizeSatker: 9, // pt
  fontSizeBody: 9, // pt
  showBorder: false,
  zoomLevel: 100 // persen
};

export const LAYOUT_PRESETS = {
  12: {
    rowsPerPage: 6,
    labelHeight: 44,
    marginTop: 11.14,
    marginBottom: 3.64,
    rowGap: 3.64,
    name: "2 Kolom × 6 Baris (12 Label / Lembar)"
  },
  14: {
    rowsPerPage: 7,
    labelHeight: 38,
    marginTop: 10.44,
    marginBottom: 2.94,
    rowGap: 2.94,
    name: "2 Kolom × 7 Baris (14 Label / Lembar)"
  }
};

export const DUMMY_ITEMS = [
  {
    kode_satker: "138041000693242000KD",
    tahun: "2019",
    kode_barang: "3050104002",
    nama_barang: "Tempat Tidur Kayu",
    merk_tipe: "SPRING BED 2 IN 1",
    ruangan: "[D.1.01] Kamar 01 Dan Toilet - Asrama Marsawa",
    nup: "1",
    custom_barcode: "qr_images/2f03980425a9b26e27d005a38531fa1f.png"
  },
  {
    kode_satker: "138041000693242000KD",
    tahun: "2019",
    kode_barang: "3050104005",
    nama_barang: "Lemari Pakaian Kayu",
    merk_tipe: "LEMARI 2 PINTU",
    ruangan: "[D.1.02] Kamar 02 Dan Toilet - Asrama Marsawa",
    nup: "2",
    custom_barcode: "qr_images/151d78bd8bda2660cf444acfe128b376.png"
  },
  {
    kode_satker: "138041000693242000KD",
    tahun: "2020",
    kode_barang: "3050104002",
    nama_barang: "Tempat Tidur Besi Tingkat",
    merk_tipe: "BESI HOLLOW TINGKAT",
    ruangan: "[F.1.01] Kamar 01 Dan Toilet - Asrama Bulian",
    nup: "1",
    custom_barcode: "qr_images/bb8a5116a99b4533b6131586c9268061.png"
  },
  {
    kode_satker: "138041000693242000KD",
    tahun: "2020",
    kode_barang: "3050101004",
    nama_barang: "Meja Belajar Siswa",
    merk_tipe: "KAYU JATI + KURSI",
    ruangan: "[F.1.02] Kamar 02 Dan Toilet - Asrama Bulian",
    nup: "2",
    custom_barcode: "qr_images/5f72c297bef417dcbc021e6af2b01281.png"
  },
  {
    kode_satker: "138041000693242000KD",
    tahun: "2021",
    kode_barang: "3050201003",
    nama_barang: "Air Conditioner (AC)",
    merk_tipe: "PANASONIC 1 PK SPLIT",
    ruangan: "[E.1.01] Kamar 01 - Asrama Kulim",
    nup: "1",
    custom_barcode: "qr_images/3b11ce11db4fd36db8aae22a54977353.png"
  },
  {
    kode_satker: "138041000693242000KD",
    tahun: "2021",
    kode_barang: "3050201005",
    nama_barang: "Kipas Angin Dinding",
    merk_tipe: "MASPION 16 INCH",
    ruangan: "[E.1.02] Kamar 02 - Asrama Kulim",
    nup: "2",
    custom_barcode: "qr_images/0a6f897ea5ae47cfe5271d8987c646f4.png"
  },
  {
    kode_satker: "138041000693242000KD",
    tahun: "2022",
    kode_barang: "3050206001",
    nama_barang: "Televisi LED Smart TV",
    merk_tipe: "SAMSUNG 43 INCH 4K",
    ruangan: "[G.1.04] Kamar 01 Dan Toilet - Mess Jelutung 3",
    nup: "1",
    custom_barcode: "qr_images/28da8096d10aa0ba28073de418467cec.png"
  },
  {
    kode_satker: "138041000693242000KD",
    tahun: "2022",
    kode_barang: "3050204001",
    nama_barang: "Dispenser Air Galon Bawah",
    merk_tipe: "MIYAKO HOT COLD EXTRA",
    ruangan: "[H.1.04] Kamar nomor 1 dan toilet - Mess Penatar",
    nup: "1",
    custom_barcode: "qr_images/49a3ce61f565bb63bc5a32360dcbd53e.png"
  },
  {
    kode_satker: "138041000693242000KD",
    tahun: "2021",
    kode_barang: "3050201002",
    nama_barang: "Lemari Es / Kulkas 2 Pintu",
    merk_tipe: "SHARP INVERTER 2 PINTU",
    ruangan: "[2] Kamar 1 dan toilet - Mess Kepala",
    nup: "1",
    custom_barcode: "qr_images/6762615d13846968a18eaa1675b9d019.png"
  },
  {
    kode_satker: "138041000693242000KD",
    tahun: "2021",
    kode_barang: "3050102001",
    nama_barang: "Sofa Tamu Eksekutif",
    merk_tipe: "KULIT SINTETIS 3+2+1",
    ruangan: "[3] Kamar 2 dan toilet - Mess Kepala",
    nup: "1",
    custom_barcode: "qr_images/ec3c71511701f545c1da902cc5ed4103.png"
  },
  {
    kode_satker: "138041000693242000KD",
    tahun: "2018",
    kode_barang: "3050104001",
    nama_barang: "Lemari Arsip BMN Besi",
    merk_tipe: "LION 4 LACI TINGGI",
    ruangan: "[5] Kamar 2 - Mess Jelutung 2",
    nup: "2",
    custom_barcode: "qr_images/6d46d6e72ceb9bbc2f2bdfc6a54baed1.png"
  },
  {
    kode_satker: "138041000693242000KD",
    tahun: "2019",
    kode_barang: "3050207001",
    nama_barang: "Active Speaker Sound System",
    merk_tipe: "YAMAHA DXR15 1100W",
    ruangan: "[02] Aula Mayang Mangurai",
    nup: "1",
    custom_barcode: "qr_images/2fa823ce6dfe2c52a8ae86adf4ed3316.png"
  }
];
