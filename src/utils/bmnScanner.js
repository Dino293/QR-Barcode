export function buildBmnQrPayload(item) {
  if (!item) return "";
  const nama = (item.nama_barang || "Barang BMN").trim();
  const kode = (item.kode_barang || "-").trim();
  const nup = String(item.nup || "1").trim();
  const merk = (item.merk_tipe || "-").trim();
  const lokasi = (item.ruangan || "Tanpa Ruangan").trim();

  return [
    "BMN BPMP PROV. JAMBI",
    `Nama Barang: ${nama}`,
    `Kode Barang: ${kode}`,
    `NUP: ${nup}`,
    `Merek/Tipe: ${merk}`,
    `Lokasi: ${lokasi}`
  ].join("\n");
}

export function parseBmnPayload(text) {
  if (!text) return null;
  const str = String(text).trim();

  // 1. JSON
  if (str.startsWith("{") && str.endsWith("}")) {
    try {
      const obj = JSON.parse(str);
      return {
        nama_barang: obj.nama_barang || obj.nama || obj.name || "",
        kode_barang: String(obj.kode_barang || obj.kode || obj.code || ""),
        nup: String(obj.nup || "1"),
        merk_tipe: obj.merk_tipe || obj.merk || obj.merek || "-",
        ruangan: obj.ruangan || obj.lokasi || "Tanpa Ruangan"
      };
    } catch (_) {}
  }

  // 2. Multi-line labeled format
  const namaMatch = str.match(/(?:Nama(?:\s*Barang)?)\s*[:=]\s*(.+)/i);
  const kodeMatch = str.match(/(?:Kode(?:\s*Barang)?)\s*[:=]\s*([0-9\.\-\_]+)/i);
  const nupMatch = str.match(/NUP\s*[:=]\s*([0-9]+)/i);
  const merkMatch = str.match(/(?:Merek|Merk)(?:\s*\/\s*Tipe)?\s*[:=]\s*(.+)/i);
  const lokasiMatch = str.match(/(?:Lokasi|Ruangan)\s*[:=]\s*(.+)/i);

  if (namaMatch || kodeMatch) {
    return {
      nama_barang: namaMatch ? namaMatch[1].trim() : "",
      kode_barang: kodeMatch ? kodeMatch[1].trim() : "",
      nup: nupMatch ? nupMatch[1].trim() : "1",
      merk_tipe: merkMatch ? merkMatch[1].trim() : "-",
      ruangan: lokasiMatch ? lokasiMatch[1].trim() : "Tanpa Ruangan"
    };
  }

  // 3. Path SIMAN: qr_images/.../3050104002_000001_....png
  const simanPathMatch = str.match(/([0-9]{10})_([0-9]{6})/);
  if (simanPathMatch) {
    return {
      kode_barang: simanPathMatch[1],
      nup: String(parseInt(simanPathMatch[2], 10)),
      nama_barang: "",
      merk_tipe: "",
      ruangan: ""
    };
  }

  // 4. Pola gabungan Kode dan NUP (contoh: 3050104002.1 atau 3050104002-1 atau 3.05.01.04.002.1)
  const codeNupMatch = str.match(/^([0-9\.\-_]{6,25})[\.\-_\s]+([0-9]{1,6})$/);
  if (codeNupMatch) {
    return {
      kode_barang: codeNupMatch[1].trim(),
      nup: String(parseInt(codeNupMatch[2], 10)),
      nama_barang: "",
      merk_tipe: "",
      ruangan: ""
    };
  }

  // 5. Kode barang numerik biasa (contoh: 3050104002)
  const cleanDigits = str.replace(/[^0-9]/g, "");
  if (cleanDigits.length >= 8 && cleanDigits.length <= 15) {
    return {
      kode_barang: cleanDigits,
      nup: "1",
      nama_barang: "",
      merk_tipe: "",
      ruangan: ""
    };
  }

  return null;
}
