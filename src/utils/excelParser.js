import * as XLSX from 'xlsx';

/**
 * Parser Dataset Excel BMN menggunakan SheetJS (xlsx)
 * Dioptimalkan dengan mode dense untuk kecepatan tinggi dan anti-lag
 */

export function parseExcelFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      // Jalankan parsing dalam setTimeout agar UI spinner browser sempat merender dan tidak freeze
      setTimeout(() => {
        try {
          const data = new Uint8Array(e.target.result);
          // Opsi dense: true membuat parsing array 2D sangat cepat pada file 10,000+ baris
          const workbook = XLSX.read(data, {
            type: "array",
            dense: true,
            cellFormula: false,
            cellHTML: false
          });

          // Utamakan sheet 'Database' jika ada, atau sheet pertama
          const sheetName = workbook.SheetNames.includes("Database")
            ? "Database"
            : workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];

          const rawRows = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
          if (!rawRows || rawRows.length < 2) {
            return reject(new Error("Berkas Excel kosong atau tidak memiliki data baris!"));
          }

          const items = extractItemsFromRows(rawRows);
          resolve({ items, sheetName, totalRaw: rawRows.length - 1 });
        } catch (err) {
          reject(err);
        }
      }, 50);
    };
    reader.onerror = (err) => reject(err);
    reader.readAsArrayBuffer(file);
  });
}

function extractItemsFromRows(rows) {
  const header = rows[0] || [];
  const colMap = mapHeaders(header);

  const parsedItems = [];
  const total = rows.length;

  for (let r = 1; r < total; r++) {
    const row = rows[r];
    if (!row || row.length === 0) continue;

    const kode_barang = String(row[colMap.kode_barang] || "").trim();
    if (!kode_barang) continue; // Baris tanpa kode barang diabaikan

    const satker = String(row[colMap.kode_satker] || "138041000693242000KD").trim();
    const nup = String(row[colMap.nup] || "1").trim();
    const nama_barang = String(row[colMap.nama_barang] || "Barang BMN").trim();
    const merk_tipe = String(row[colMap.merk_tipe] || "-").trim();
    const tahun = extractYear(row[colMap.tahun], row[colMap.tgl_perolehan], satker);

    const kd_ruangan = String(row[colMap.kd_ruangan] || "").trim();
    const nm_ruangan = String(row[colMap.nm_ruangan] || "").trim();
    const nm_bangunan = String(row[colMap.nm_bangunan] || "").trim();

    let room_title = "Tanpa Ruangan";
    if (kd_ruangan && nm_ruangan) {
      room_title = nm_bangunan
        ? `[${kd_ruangan}] ${nm_ruangan} - ${nm_bangunan}`
        : `[${kd_ruangan}] ${nm_ruangan}`;
    } else if (nm_ruangan) {
      room_title = nm_bangunan ? `${nm_ruangan} - ${nm_bangunan}` : nm_ruangan;
    } else if (kd_ruangan) {
      room_title = `[${kd_ruangan}] Ruangan ${kd_ruangan}`;
    }

    const qr = String(row[colMap.qr] || "").trim();

    parsedItems.push({
      kode_satker: satker,
      tahun: tahun,
      kode_barang: kode_barang,
      nup: nup,
      nama_barang: nama_barang,
      merk_tipe: merk_tipe,
      ruangan: room_title,
      custom_barcode: qr
    });
  }

  return parsedItems;
}

function mapHeaders(headerRow) {
  const map = {
    kode_satker: 1, // B
    kode_barang: 3, // D
    nup: 4, // E
    nama_barang: 5, // F
    merk_tipe: 8, // I
    tahun: 25, // Z
    tgl_perolehan: 9, // J
    kd_ruangan: 20, // U
    nm_ruangan: 21, // V
    qr: 27, // AB
    nm_bangunan: 28 // AC
  };

  headerRow.forEach((colName, idx) => {
    if (!colName) return;
    const name = String(colName).toLowerCase().replace(/[^a-z0-9]/g, "");

    if (name.includes("kodesatker")) map.kode_satker = idx;
    else if (name === "kodebarang" || name.includes("kodebmn")) map.kode_barang = idx;
    else if (name === "nup" || name.includes("nourut")) map.nup = idx;
    else if (name.includes("namabarang") || name.includes("uraianbarang")) map.nama_barang = idx;
    else if (name.includes("merk") || name.includes("tipe")) map.merk_tipe = idx;
    else if (name.includes("tahun")) map.tahun = idx;
    else if (name.includes("tgl") || name.includes("perolehan")) map.tgl_perolehan = idx;
    else if (name === "koderuangan" || name === "kdruang") map.kd_ruangan = idx;
    else if (name.includes("namaruangan") || name === "ruangan") map.nm_ruangan = idx;
    else if (name === "qr" || name.includes("barcode") || name.includes("linkbarcode")) map.qr = idx;
    else if (name.includes("bangunan") || name.includes("gedung")) map.nm_bangunan = idx;
  });

  return map;
}

function extractYear(tahunVal, tglVal, satkerVal) {
  const tStr = String(tahunVal || "").trim();
  const m1 = tStr.match(/\b(19\d{2}|20\d{2})\b/);
  if (m1) return m1[1];

  const dStr = String(tglVal || "").trim();
  const m2 = dStr.match(/\b(19\d{2}|20\d{2})\b/);
  if (m2) return m2[1];

  const sStr = String(satkerVal || "").trim();
  const m3 = sStr.match(/\b(19\d{2}|20\d{2})\b/);
  if (m3) return m3[1];

  return "";
}
