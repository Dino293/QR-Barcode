/**
 * Parser Dataset Excel BMN menggunakan SheetJS (xlsx) - Standalone Live Server
 * Dioptimalkan dengan mode dense untuk kecepatan tinggi dan anti-lag
 */

export function parseExcelFile(file) {
  return new Promise((resolve, reject) => {
    if (!window.XLSX) {
      return reject(new Error("Pustaka SheetJS (XLSX) belum siap dimuat di browser."));
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      setTimeout(() => {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = window.XLSX.read(data, {
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

          const rawRows = window.XLSX.utils.sheet_to_json(worksheet, { header: 1 });
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
    const merk_tipe = String(row[colMap.merk_tipe] || "-").trim() || "-";
    const tahun = extractYear(row[colMap.tahun], row[colMap.tgl_perolehan], satker);

    const kd_ruangan = String(row[colMap.kd_ruangan] || "").trim();
    const nm_ruangan = String(row[colMap.nm_ruangan] || "").trim();
    const col_bangunan = String(row[colMap.nm_bangunan] || "").trim();
    const nm_bangunan = resolveBuildingName(kd_ruangan, nm_ruangan, col_bangunan);

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
    const tgl_perolehan_str = String(row[colMap.tgl_perolehan] || "").trim();

    parsedItems.push({
      kode_satker: satker,
      tahun: tahun,
      tgl_perolehan: tgl_perolehan_str,
      kode_barang: kode_barang,
      nup: nup,
      nama_barang: nama_barang,
      merk_tipe: merk_tipe,
      kode_ruangan: kd_ruangan,
      nama_ruangan: nm_ruangan,
      nama_bangunan: nm_bangunan,
      ruangan: room_title,
      custom_barcode: qr
    });
  }

  return parsedItems;
}

function resolveBuildingName(kd, nm, colBangunan) {
  const kd_u = String(kd || "").trim().toUpperCase();
  const nm_l = String(nm || "").trim().toLowerCase();

  if (kd_u.startsWith("D.1.") || kd_u.startsWith("D.2.") || kd_u.startsWith("D.")) return "Asrama Marsawa";
  if (kd_u.startsWith("F.1.") || kd_u.startsWith("F.2.") || kd_u.startsWith("F.")) return "Asrama Bulian";
  if (kd_u.startsWith("E.1.") || kd_u.startsWith("E.")) return "Asrama Kulim";
  if (kd_u.startsWith("G.1.") || kd_u.startsWith("G.2.") || kd_u.startsWith("G.")) return "Mess Jelutung 3";
  if (kd_u.startsWith("H.1.") || kd_u.startsWith("H.")) return "Mess Penatar";
  if ((kd_u === "2" || kd_u === "3") && nm_l.includes("kamar")) return "Mess Kepala";
  if ((kd_u === "4" || kd_u === "5") && nm_l.includes("kamar")) return "Mess Jelutung 2";

  const b = String(colBangunan || "").trim();
  if (b && !["Asrama Marsawa", "Asrama Bulian", "Asrama Kulim", "Mess Jelutung 3", "Mess Penatar", "Mess Kepala", "Mess Jelutung 2"].includes(b)) {
    return b;
  }
  return "";
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
  // 1. Ekstraksi langsung dari kolom tahun
  const tStr = String(tahunVal || "").trim();
  const m1 = tStr.match(/\b(19\d{2}|20\d{2})\b/);
  if (m1) return m1[1];

  // 2. Dukung format angka serial tanggal Excel (misal 30000 - 55000)
  if (typeof tglVal === 'number' && tglVal > 25000 && tglVal < 60000) {
    try {
      const d = new Date(Math.round((tglVal - 25569) * 86400 * 1000));
      const yr = d.getUTCFullYear();
      if (yr >= 1970 && yr <= 2099) return String(yr);
    } catch {}
  }

  // 3. Ekstraksi dari string tanggal perolehan (format YYYY/MM/DD, DD/MM/YYYY, dsb)
  const dStr = String(tglVal || "").trim();
  const m2 = dStr.match(/\b(19\d{2}|20\d{2})\b/);
  if (m2) return m2[1];

  // 4. Ekstraksi dari kode satker jika sudah dibubuhi .tahun (.20XX)
  const sStr = String(satkerVal || "").trim();
  const m3 = sStr.match(/\.(19\d{2}|20\d{2})\b/);
  if (m3) return m3[1];

  return "";
}
