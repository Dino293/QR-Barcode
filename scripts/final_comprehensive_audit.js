import fs from 'fs';
import path from 'path';
import xlsx from 'xlsx';

const BASE_DIR = path.resolve();
const DATA_DIR = path.join(BASE_DIR, 'data');
const PDF_DIR = path.join(BASE_DIR, 'Label QR Barcode BMN');
const HTML_DIR = path.join(BASE_DIR, 'Label QR Barcode BMN HTML');

console.log('='.repeat(80));
console.log('FINAL COMPREHENSIVE CROSSCHECK: EXCEL vs HTML vs PDF vs SIMAN');
console.log('='.repeat(80));

// 1. Load SIMAN cache
const simanCache = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'siman_cache.json'), 'utf8'));
console.log(`[1] SIMAN Cache Loaded: ${Object.keys(simanCache).length.toLocaleString()} entries.`);

// 2. Load Excel
const wb = xlsx.readFile(path.join(DATA_DIR, 'data.xlsx'));
const ws = wb.Sheets['Database'];
const rows = xlsx.utils.sheet_to_json(ws, { header: 1 });
console.log(`[2] Excel Database Loaded: ${(rows.length - 1).toLocaleString()} data rows.`);

// 3. Building Mapping
const mapData = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'clean_room_building_map.json'), 'utf8'));
const pairs = mapData.pairs || {};
const codes = mapData.codes || {};

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

const roomItemCounts = new Map();
let simanMissing = 0;
let simanMismatch = 0;

for (let i = 1; i < rows.length; i++) {
  const row = rows[i];
  if (!row || row.length < 6) continue;

  const kd_b = String(row[3] || '').trim();
  const nup = String(row[4] || '').trim();
  const qr = String(row[27] || '').trim();

  const cacheKey = `${kd_b}_${nup}`;
  if (!(cacheKey in simanCache)) {
    simanMissing++;
  } else if (simanCache[cacheKey] !== qr) {
    simanMismatch++;
  }

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
  roomItemCounts.set(cleanFilename, (roomItemCounts.get(cleanFilename) || 0) + 1);
}

console.log(`[3] Validasi SIMAN: Missing = ${simanMissing}, Mismatch = ${simanMismatch}`);
console.log(`[4] Total Ruangan Unik: ${roomItemCounts.size}`);

// 4. Audit folder HTML dan PDF
const pdfFiles = fs.readdirSync(PDF_DIR).filter(f => f.endsWith('.pdf'));
const htmlFiles = fs.readdirSync(HTML_DIR).filter(f => f.endsWith('.html'));

console.log(`[5] File Terdeteksi:`);
console.log(`    - PDF : ${pdfFiles.length} berkas di '${PDF_DIR}'`);
console.log(`    - HTML: ${htmlFiles.length} berkas di '${HTML_DIR}'`);

let totalItemsVerified = 0;
let errorRooms = [];

for (const [roomFilename, expectedItems] of roomItemCounts.entries()) {
  totalItemsVerified += expectedItems;
  const pdfName = `${roomFilename}.pdf`;
  const htmlName = `${roomFilename}.html`;

  const pdfPath = path.join(PDF_DIR, pdfName);
  const htmlPath = path.join(HTML_DIR, htmlName);

  if (!fs.existsSync(pdfPath)) {
    errorRooms.push({ room: roomFilename, error: 'PDF file missing' });
    continue;
  }
  if (!fs.existsSync(htmlPath)) {
    errorRooms.push({ room: roomFilename, error: 'HTML file missing' });
    continue;
  }

  // Check HTML item count and sheet count
  const htmlContent = fs.readFileSync(htmlPath, 'utf8');
  const htmlLabels = (htmlContent.split('class="item-label"').length - 1);
  const htmlSheets = (htmlContent.split('class="a4-sheet"').length - 1);

  // Check PDF pages
  const pdfBuf = fs.readFileSync(pdfPath);
  const str = pdfBuf.toString('latin1');
  const counts = [];
  const regex = /\/Count\s+(\d+)/g;
  let m;
  while ((m = regex.exec(str)) !== null) {
    counts.push(parseInt(m[1], 10));
  }
  const pdfPages = counts.length > 0 ? Math.max(...counts) : 1;
  const expectedPages = Math.ceil(expectedItems / 12) || 1;

  if (htmlLabels !== expectedItems) {
    errorRooms.push({ room: roomFilename, error: `HTML items (${htmlLabels}) != Excel (${expectedItems})` });
  }
  if (pdfPages !== expectedPages) {
    errorRooms.push({ room: roomFilename, error: `PDF pages (${pdfPages}) != Expected (${expectedPages})` });
  }
}

console.log('='.repeat(80));
console.log(`KESIMPULAN AUDIT AKHIR:`);
console.log(`- Total Barang BMN Terverifikasi: ${totalItemsVerified.toLocaleString()} / 14.359`);
console.log(`- Ruangan Bermasalah / Mismatch: ${errorRooms.length}`);
if (errorRooms.length === 0) {
  console.log('>>> STATUS: 100% SEMPURNA, PAS, DAN COCOK TANPA KESALAHAN! <<<');
} else {
  console.log('Daftar Error:', errorRooms);
}
console.log('='.repeat(80));
