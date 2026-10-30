/**
 * generate_all_perfect_labels.js
 * Script penghasil HTML label BMN presisi tinggi 100% identik dengan Web Application.
 * Menggunakan standar 98mm x 44mm, grid presisi A4 (2x6 = 12 label/lembar),
 * QR Engine offline SVG (5 data BMN), dan logo Kemendikbud Base64.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import xlsx from 'xlsx';
import { generateQRCodeSVG } from '../src/utils/qrEngine.js';
import { buildBmnQrPayload } from '../src/utils/bmnScanner.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const BASE_DIR = path.resolve(__dirname, '..');

const DATA_DIR = path.join(BASE_DIR, 'data');
const PUBLIC_DIR = path.join(BASE_DIR, 'public');
const WEB_DIR = path.join(BASE_DIR, 'web');
const TEMP_HTML_DIR = path.join(BASE_DIR, 'temp_perfect_html');
const TARGET_DIR = path.join(BASE_DIR, 'Label QR Barcode BMN');

console.log('='.repeat(75));
console.log('>>> MENYUSUN HTML TEMPLATE CETAK LABEL BMN PRESISI IDENTIK DENGAN WEB APP');
console.log(`Folder HTML Sementara : ${TEMP_HTML_DIR}`);
console.log(`Folder Target PDF     : ${TARGET_DIR}`);
console.log('='.repeat(75));

// 1. Pastikan folder tersedia
if (fs.existsSync(TEMP_HTML_DIR)) {
  fs.rmSync(TEMP_HTML_DIR, { recursive: true, force: true });
}
fs.mkdirSync(TEMP_HTML_DIR, { recursive: true });
fs.mkdirSync(TARGET_DIR, { recursive: true });

// 2. Salin logo ke TEMP_HTML_DIR agar tidak perlu menduplikasi Base64 di ribuan label
let logoFound = false;
const logoCandidates = [
  path.join(PUBLIC_DIR, 'images.png'),
  path.join(WEB_DIR, 'images.png')
];
for (const cand of logoCandidates) {
  if (fs.existsSync(cand)) {
    fs.copyFileSync(cand, path.join(TEMP_HTML_DIR, 'images.png'));
    logoFound = true;
    break;
  }
}
if (!logoFound) {
  console.error('[ERROR] File logo images.png tidak ditemukan!');
  process.exit(1);
}
console.log('[1/4] Logo Kemendikbud berhasil disalin ke folder HTML sementara.');

// 3. Baca Pemetaan Gedung
const mapPath = path.join(DATA_DIR, 'clean_room_building_map.json');
let pairs = {};
let codes = {};
if (fs.existsSync(mapPath)) {
  const mapData = JSON.parse(fs.readFileSync(mapPath, 'utf8'));
  pairs = mapData.pairs || {};
  codes = mapData.codes || {};
}

function getBuildingName(kd, nm) {
  const kd_u = String(kd || '').trim().toUpperCase();
  const nm_l = String(nm || '').trim().toLowerCase();
  if (!kd_u && !nm_l) return '';
  const key = `${kd_u.toLowerCase()}|||${nm_l}`;
  if (pairs[key]) return pairs[key];
  if (kd_u.startsWith('D.1.') || kd_u.startsWith('D.2.') || kd_u.startsWith('D.')) return 'Asrama Marsawa';
  if (kd_u.startsWith('F.1.') || kd_u.startsWith('F.2.') || kd_u.startsWith('F.')) return 'Asrama Bulian';
  if (kd_u.startsWith('E.1.') || kd_u.startsWith('E.')) return 'Asrama Kulim';
  if (kd_u.startsWith('G.1.') || kd_u.startsWith('G.2.') || kd_u.startsWith('G.')) return 'Mess Jelutung 3';
  if (kd_u.startsWith('H.1.') || kd_u.startsWith('H.')) return 'Mess Penatar';
  if ((kd_u === '2' || kd_u === '3') && nm_l.includes('kamar')) return 'Mess Kepala';
  if ((kd_u === '4' || kd_u === '5') && nm_l.includes('kamar')) return 'Mess Jelutung 2';
  const kd_l = kd_u.toLowerCase();
  if (!['1', '2', '3', '4', '5', '01', '02', '03', '04', '05'].includes(kd_l) && codes[kd_l]) {
    return codes[kd_l];
  }
  return '';
}

function sanitizeFilename(name, maxLen = 65) {
  let s = String(name || '').replace(/[<>:"/\\|?*]/g, ' - ');
  s = s.replace(/\s+/g, ' ').trim().replace(/^\.+|\.+$/g, '').trim();
  if (s.length > maxLen) {
    s = s.substring(0, maxLen).trim().replace(/^\.+|\.+$/g, '').trim();
  }
  return s || 'Item';
}

function escapeHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// 4. Baca data dari data.xlsx
const excelPath = path.join(DATA_DIR, 'data.xlsx');
console.log(`[2/4] Membaca file data Excel: ${excelPath} ...`);
const wb = xlsx.readFile(excelPath);
const ws = wb.Sheets['Database'] || wb.Sheets[wb.SheetNames[0]];
const rows = xlsx.utils.sheet_to_json(ws, { header: 1 });

const roomsData = new Map();
let totalRecords = 0;

for (let i = 1; i < rows.length; i++) {
  const row = rows[i];
  if (!row || row.length < 6) continue;
  totalRecords++;

  const kd_r = String(row[20] || '').trim();
  const nm_r = String(row[21] || '').trim();
  const bg = getBuildingName(kd_r, nm_r);

  let roomTitle = '';
  if (bg) {
    roomTitle = (kd_r && nm_r) ? `[${kd_r}] ${nm_r} - ${bg}` : (kd_r ? `[${kd_r}] ${bg}` : `${nm_r} - ${bg}`);
  } else if (kd_r && nm_r) {
    roomTitle = `[${kd_r}] ${nm_r}`;
  } else if (nm_r) {
    roomTitle = nm_r;
  } else if (kd_r) {
    roomTitle = `[${kd_r}] Ruangan ${kd_r}`;
  } else {
    roomTitle = 'Tanpa Ruangan';
  }

  const cleanFilename = sanitizeFilename(roomTitle, 65);

  let rawSatker = String(row[1] || '138041000693242000KD').trim();
  let embeddedYear = '';
  const suffixMatch = rawSatker.match(/\.(19\d{2}|20\d{2})$/);
  if (suffixMatch) {
    embeddedYear = suffixMatch[1];
    rawSatker = rawSatker.slice(0, suffixMatch.index).trim();
  }

  let resolvedYear = '';
  const rawTahun = row[25];
  if (rawTahun !== undefined && rawTahun !== null && String(rawTahun).trim() !== '') {
    const my = String(rawTahun).match(/\b(19\d{2}|20\d{2})\b/);
    if (my) resolvedYear = my[1];
  }
  const rawTgl = row[9];
  if (!resolvedYear && rawTgl) {
    const mt = String(rawTgl).match(/\b(19\d{2}|20\d{2})\b/);
    if (mt) resolvedYear = mt[1];
  }
  if (!resolvedYear && embeddedYear) {
    resolvedYear = embeddedYear;
  }

  const satkerText = resolvedYear ? `${rawSatker}.${resolvedYear}` : rawSatker;

  const itemObj = {
    kode_satker: rawSatker,
    tahun: resolvedYear,
    tgl_perolehan: String(rawTgl || ''),
    kode_barang: String(row[3] || '-').trim(),
    nup: String(row[4] || '1').trim(),
    nama_barang: String(row[5] || 'Barang BMN').trim(),
    merk_tipe: String(row[8] || '-').trim() || '-',
    ruangan: roomTitle,
    satkerText: satkerText
  };

  if (!roomsData.has(cleanFilename)) {
    roomsData.set(cleanFilename, {
      roomTitle: roomTitle,
      items: []
    });
  }
  roomsData.get(cleanFilename).items.push(itemObj);
}

console.log(`      -> Total ${totalRecords.toLocaleString()} data barang dikelompokkan ke ${roomsData.size} ruangan.`);

// 5. Template HTML & CSS Generator
function renderLabelHtml(item) {
  const bmnPayload = buildBmnQrPayload(item);
  const qrSvg = generateQRCodeSVG(bmnPayload, { size: 85, margin: 1 });

  return `
    <article class="item-label">
      <header class="label-header">
        <div class="header-logo-box">
          <img src="images.png" alt="Logo Kemendikbud">
        </div>
        <div class="header-text-box">
          <div class="instansi-line1">KEMENTERIAN PENDIDIKAN DASAR DAN</div>
          <div class="instansi-line2">MENENGAH</div>
          <div class="satker-code-line">${escapeHtml(item.satkerText)}</div>
        </div>
        <div class="header-logo-box" style="visibility: hidden;" aria-hidden="true"></div>
      </header>

      <div class="label-body">
        <div class="body-info-left">
          <div>
            <div class="info-top-row">
              <span class="info-kode-barang">${escapeHtml(item.kode_barang)}</span>
              <span class="info-nup">NUP: ${escapeHtml(item.nup)}</span>
            </div>
            <div class="info-nama-barang" title="${escapeHtml(item.nama_barang)}">${escapeHtml(item.nama_barang)}</div>
          </div>
          <div class="info-merk-tipe" title="${escapeHtml(item.merk_tipe)}">${escapeHtml(item.merk_tipe)}</div>
        </div>

        <div class="body-qr-right">
          <div class="qr-box" title="QR Barcode BMN">
            ${qrSvg}
          </div>
        </div>
      </div>
    </article>
  `;
}

function renderRoomDocumentHtml(roomTitle, items) {
  const labelsPerPage = 12; // 2 kolom x 6 baris standar BMN
  const totalPages = Math.ceil(items.length / labelsPerPage) || 1;
  const totalRoomItems = items.length;

  let sheetsHtml = '';

  for (let p = 0; p < totalPages; p++) {
    const pageNumber = p + 1;
    const pageItems = items.slice(p * labelsPerPage, (p + 1) * labelsPerPage);

    const labelsHtml = pageItems.map(item => renderLabelHtml(item)).join('\n');

    sheetsHtml += `
      <div class="sheet-wrapper">
        <div class="a4-sheet" id="sheet-${pageNumber}">
          <!-- HEADER KERTAS FISIK A4 (Mengambang Absolut di Margin Atas Kertas Cetak) -->
          <div class="sheet-paper-header">
            <div class="sheet-paper-single-title">
              <span class="sheet-room-tag">RUANGAN:</span>
              <span class="sheet-room-name">${escapeHtml(roomTitle)}</span>
              <span class="sheet-header-bullet">•</span>
              <span class="sheet-page-info">HALAMAN ${pageNumber} / ${totalPages}</span>
              <span class="sheet-header-bullet">•</span>
              <span class="sheet-count-info">${pageItems.length} ITEM DI LEMBAR INI (${totalRoomItems} TOTAL)</span>
            </div>
          </div>

          <!-- GRID 2 KOLOM LABEL (98mm x 44mm) -->
          <div class="sheet-grid">
            ${labelsHtml}
          </div>
        </div>
      </div>
    `;
  }

  return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(roomTitle)} - Cetak Label BMN A4</title>
  <style>
    /* STANDAR PRESISI KERTAS CETAK A4 & LABEL BMN (FISIK MM) */
    :root {
      --page-width: 210mm;
      --page-height: 297mm;
      --page-margin-top: 11.14mm;
      --page-margin-bottom: 3.64mm;
      --page-margin-left: 4.67mm;
      --page-margin-right: 4.67mm;

      /* Ukuran Fisik Label */
      --label-width: 98mm;
      --label-height: 44mm;
      --header-height: 14.8mm;
      --label-col-gap: 4.67mm;
      --label-row-gap: 3.64mm;
      --grid-cols: 2;

      /* Ukuran Gambar & Logo */
      --qr-size: 21mm;
      --logo-size: 6mm;

      /* Standar Tipografi Spesifikasi */
      --instansi-font-size: 10.5pt;
      --satker-font-size: 9pt;
      --body-font-size: 9pt;
    }

    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }

    html, body {
      margin: 0 !important;
      padding: 0 !important;
      background: #ffffff !important;
      color: #000000 !important;
      font-family: Arial, Helvetica, sans-serif;
      -webkit-font-smoothing: antialiased;
    }

    /* Pembagi halaman lembar A4 fisik */
    .sheet-wrapper {
      margin: 0 !important;
      padding: 0 !important;
      box-shadow: none !important;
      border: none !important;
      display: block !important;
      width: 210mm !important;
      height: auto !important;
      min-height: 0 !important;
      max-height: none !important;
      page-break-after: always !important;
      break-after: page !important;
      page-break-inside: avoid !important;
      break-inside: avoid !important;
      overflow: visible !important;
    }

    .sheet-wrapper:last-child,
    .sheet-wrapper:last-of-type {
      page-break-after: auto !important;
      break-after: auto !important;
    }

    /* Lembar A4 di dalam printer: 210mm x 296mm (buffer 1mm mencegah pembulatan sub-pixel di Chromium / Edge yang memicu halaman kosong 2, 4, 6) */
    .a4-sheet {
      width: 210mm !important;
      height: 296mm !important;
      max-height: 296mm !important;
      min-height: 0 !important;
      margin: 0 auto !important;
      padding-top: var(--page-margin-top) !important;
      padding-bottom: var(--page-margin-bottom) !important;
      padding-left: var(--page-margin-left) !important;
      padding-right: var(--page-margin-right) !important;
      box-sizing: border-box !important;
      border: none !important;
      box-shadow: none !important;
      page-break-inside: avoid !important;
      break-inside: avoid !important;
      page-break-after: auto !important;
      break-after: auto !important;
      overflow: hidden !important;
      background: #ffffff !important;
      position: relative !important;
    }

    /* Header Kertas A4 Mengambang Absolut di Margin Atas Kertas Cetak */
    .sheet-paper-header {
      position: absolute !important;
      top: 3.8mm !important;
      left: var(--page-margin-left) !important;
      right: var(--page-margin-right) !important;
      height: 5.5mm !important;
      display: flex !important;
      flex-direction: row !important;
      align-items: center !important;
      justify-content: center !important;
      text-align: center !important;
      visibility: visible !important;
      z-index: 10 !important;
      pointer-events: none;
      line-height: 1;
    }

    .sheet-paper-single-title {
      font-size: 8pt;
      font-weight: 700;
      color: #000000;
      letter-spacing: 0.2px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 1.8mm;
      font-family: Arial, Helvetica, sans-serif;
    }

    .sheet-room-tag {
      font-size: 7.5pt;
      font-weight: 800;
      color: #1e3a8a;
      letter-spacing: 0.4px;
    }

    .sheet-room-name {
      font-weight: 800;
      color: #000000;
      text-transform: uppercase;
    }

    .sheet-header-bullet {
      color: #64748b;
      font-weight: 700;
      font-size: 8pt;
    }

    .sheet-page-info {
      font-size: 7.5pt;
      font-weight: 700;
      color: #334155;
    }

    .sheet-count-info {
      font-size: 7pt;
      font-weight: 600;
      color: #64748b;
    }

    /* Grid 2 Kolom x 6 Baris Label */
    .sheet-grid {
      display: grid;
      grid-template-columns: repeat(2, var(--label-width));
      grid-auto-rows: var(--label-height);
      column-gap: var(--label-col-gap);
      row-gap: var(--label-row-gap);
      width: 100%;
      height: 100%;
      box-sizing: border-box;
      align-content: start;
      justify-content: center;
    }

    /* Kartu Label Tunggal: Outline Hitam Tegas Standar BMN (98mm x 44mm) */
    .item-label {
      width: var(--label-width);
      height: var(--label-height);
      box-sizing: border-box;
      display: flex;
      flex-direction: column;
      background-color: #ffffff;
      overflow: hidden;
      position: relative;
      padding: 1.2mm 2.0mm;
      border: 1px solid #000000 !important;
      font-family: Arial, Helvetica, sans-serif;
    }

    /* Bagian Header Label */
    .label-header {
      height: var(--header-height);
      min-height: var(--header-height);
      max-height: var(--header-height);
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 1.2px solid #000000;
      padding-bottom: 0.8mm;
      margin-bottom: 0.8mm;
      flex-shrink: 0;
      box-sizing: border-box;
    }

    .header-logo-box {
      width: var(--logo-size);
      height: var(--logo-size);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .header-logo-box img {
      max-width: 100%;
      max-height: 100%;
      object-fit: contain;
    }

    .header-text-box {
      flex: 1;
      text-align: center;
      padding: 0 1mm;
      display: flex;
      flex-direction: column;
      justify-content: center;
      line-height: 1.15;
    }

    .instansi-line1,
    .instansi-line2 {
      font-family: Arial, Helvetica, sans-serif;
      font-size: var(--instansi-font-size);
      font-weight: 700;
      color: #000000;
      letter-spacing: -0.2px;
    }

    .satker-code-line {
      font-family: Arial, Helvetica, sans-serif;
      font-size: var(--satker-font-size);
      font-weight: 700;
      color: #000000;
      margin-top: 0.3mm;
    }

    /* Bagian Body Label (Data Kiri & QR Kanan) */
    .label-body {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: space-between;
      overflow: hidden;
      box-sizing: border-box;
    }

    .body-info-left {
      flex: 1;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      height: 100%;
      padding-right: 1.5mm;
      overflow: hidden;
      font-family: Arial, Helvetica, sans-serif;
    }

    .info-top-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1.5mm;
      margin-bottom: 0.8mm;
    }

    .info-kode-barang {
      font-size: var(--body-font-size);
      font-weight: 700;
      color: #000000;
      font-family: monospace, Arial;
    }

    .info-nup {
      font-size: var(--body-font-size);
      font-weight: 700;
      color: #000000;
      white-space: nowrap;
    }

    .info-nama-barang {
      font-size: var(--body-font-size);
      font-weight: 700;
      color: #000000;
      text-transform: uppercase;
      line-height: 1.15;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .info-merk-tipe {
      font-size: calc(var(--body-font-size) - 0.5pt);
      font-weight: 400;
      color: #1e293b;
      text-transform: uppercase;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      margin-top: auto;
    }

    .body-qr-right {
      width: calc(var(--qr-size) + 1mm);
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .qr-box {
      width: var(--qr-size);
      height: var(--qr-size);
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .qr-box svg {
      width: 100%;
      height: 100%;
      object-fit: contain;
    }

    @page {
      size: 210mm 297mm;
      margin: 0 !important;
    }
  </style>
</head>
<body>
  ${sheetsHtml}
  <script>
    window.__TOTAL_SHEETS__ = ${totalPages};
    window.__TOTAL_ITEMS__ = ${totalRoomItems};
    window.__IS_RENDER_READY__ = true;
  </script>
</body>
</html>`;
}

// 6. Tulis seluruh file HTML
console.log('[3/4] Menulis berkas HTML untuk setiap ruangan...');
let writtenCount = 0;
for (const [filename, roomData] of roomsData.entries()) {
  const htmlContent = renderRoomDocumentHtml(roomData.roomTitle, roomData.items);
  const outPath = path.join(TEMP_HTML_DIR, `${filename}.html`);
  fs.writeFileSync(outPath, htmlContent, 'utf8');
  writtenCount++;
}

console.log(`[4/4] Berhasil menghasilkan ${writtenCount} berkas HTML presisi tinggi di: ${TEMP_HTML_DIR}`);
console.log('='.repeat(75));
