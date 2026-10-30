/**
 * Otomasi Render Berkas HTML ke PDF via Chrome Headless (Chrome DevTools Protocol)
 * Digunakan untuk mencetak seluruh label barcode ruangan ke folder tujuan secara paralel.
 */

import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const BASE_DIR = path.resolve(__dirname, '..');

// Parsing CLI arguments
const args = process.argv.slice(2);
let inputDir = path.join(BASE_DIR, 'temp_room_html');
let outputDir = path.join(BASE_DIR, 'Label QR Barcode BMN');
let numWorkers = 4;
let debugPort = 9228;
let filterTarget = null;

for (const arg of args) {
  if (arg.startsWith('--input-dir=')) inputDir = path.resolve(arg.split('=')[1]);
  if (arg.startsWith('--output-dir=')) outputDir = path.resolve(arg.split('=')[1]);
  if (arg.startsWith('--workers=')) numWorkers = parseInt(arg.split('=')[1], 10);
  if (arg.startsWith('--port=')) debugPort = parseInt(arg.split('=')[1], 10);
  if (arg.startsWith('--target=')) filterTarget = arg.split('=')[1].toLowerCase();
}

function getChromePath() {
  const possiblePaths = [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    path.join(os.homedir(), 'AppData\\Local\\Google\\Chrome\\Application\\chrome.exe')
  ];
  for (const p of possiblePaths) {
    if (fs.existsSync(p)) return p;
  }
  return 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
}

async function startChrome(chromePath, port) {
  console.log(`[*] Menjalankan Google Chrome Headless pada port ${port}...`);
  const chromeProcess = spawn(chromePath, [
    '--headless=new',
    `--remote-debugging-port=${port}`,
    '--disable-gpu',
    '--disable-web-security',
    '--allow-file-access-from-files',
    '--no-first-run'
  ]);

  let connected = false;
  let attempts = 0;
  let versionData = null;

  while (!connected && attempts < 10) {
    attempts++;
    await new Promise((resolve) => setTimeout(resolve, 800));
    try {
      const res = await fetch(`http://127.0.0.1:${port}/json/version`);
      if (res.ok) {
        versionData = await res.json();
        connected = true;
      }
    } catch (e) {
      // Tunggu Chrome siap
    }
  }

  if (!connected || !versionData) {
    chromeProcess.kill();
    throw new Error(`Gagal menghubungkan ke Chrome Headless pada port ${port}`);
  }

  const ws = new WebSocket(versionData.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    ws.onopen = resolve;
    ws.onerror = reject;
  });

  let msgId = 1;
  const pending = new Map();
  ws.onmessage = (event) => {
    const msg = JSON.parse(event.data);
    if (msg.id && pending.has(msg.id)) {
      pending.get(msg.id)(msg);
      pending.delete(msg.id);
    }
  };

  function sendCommand(method, params = {}) {
    return new Promise((resolve) => {
      const id = msgId++;
      pending.set(id, resolve);
      ws.send(JSON.stringify({ id, method, params }));
    });
  }

  async function createWorker() {
    const target = await sendCommand('Target.createTarget', { url: 'about:blank' });
    const targetId = target.result.targetId;
    const attach = await sendCommand('Target.attachToTarget', { targetId, flatten: true });
    const sessionId = attach.result.sessionId;

    function sendSession(method, params = {}) {
      return new Promise((resolve) => {
        const id = msgId++;
        pending.set(id, resolve);
        ws.send(JSON.stringify({ id, method, params, sessionId }));
      });
    }

    await sendSession('Page.enable');

    async function printHtmlToPdf(htmlFilePath, outPdfPath) {
      for (let attempt = 1; attempt <= 4; attempt++) {
        const fileUrl = 'file:///' + htmlFilePath.replace(/\\/g, '/');
        await sendSession('Page.navigate', { url: fileUrl });

        const evalRes = await sendSession('Runtime.evaluate', {
          expression: `
            new Promise((resolve) => {
              const start = Date.now();
              function checkComplete() {
                const isReadyMarker = Boolean(window.__IS_RENDER_READY__);
                const isDocComplete = document.readyState === 'complete';
                const totalSheetsExpected = window.__TOTAL_SHEETS__ || 1;
                const sheetsInDom = document.querySelectorAll('.a4-sheet').length;
                
                const imgs = Array.from(document.querySelectorAll('img'));
                const allImagesLoaded = imgs.every(img => img.complete);

                if (isReadyMarker && isDocComplete && sheetsInDom >= totalSheetsExpected && allImagesLoaded) {
                  return resolve({ success: true, sheets: sheetsInDom });
                }

                if (Date.now() - start > 45000) {
                  return resolve({ success: false, sheets: sheetsInDom, timeout: true });
                }
                setTimeout(checkComplete, 80);
              }
              checkComplete();
            })
          `,
          awaitPromise: true,
          returnByValue: true
        });

        const expectedSheets = evalRes?.result?.value?.sheets || 1;

        // Jeda sesaat agar rasterizer Chromium menyelesaikan reflow sebanding jumlah lembar
        const waitTime = Math.max(400, Math.min(expectedSheets * 20, 5000));
        await new Promise((r) => setTimeout(r, waitTime));

        const pdfRes = await sendSession('Page.printToPDF', {
          printBackground: true,
          paperWidth: 8.27,
          paperHeight: 11.69,
          marginTop: 0,
          marginBottom: 0,
          marginLeft: 0,
          marginRight: 0,
          preferCSSPageSize: true
        });

        const buf = Buffer.from(pdfRes.result.data, 'base64');
        const str = buf.toString('latin1');
        const counts = [];
        const regex = /\/Count\s+(\d+)/g;
        let m;
        while ((m = regex.exec(str)) !== null) {
          counts.push(parseInt(m[1], 10));
        }
        const actualPdfPages = counts.length > 0 ? Math.max(...counts) : 1;

        // Jika jumlah halaman PDF sudah sesuai dengan ekspektasi lembar atau sudah percobaan ke-4
        if (actualPdfPages >= expectedSheets || attempt === 4) {
          fs.writeFileSync(outPdfPath, buf);
          return buf.length;
        }

        console.log(`      [Retry ${attempt}] ${path.basename(outPdfPath)}: dapat ${actualPdfPages}/${expectedSheets} lembar, mencoba lagi...`);
        await new Promise((r) => setTimeout(r, 1000 * attempt));
      }
      return 0;
    }

    return { printHtmlToPdf };
  }

  return { chromeProcess, ws, createWorker };
}

async function main() {
  console.log('='.repeat(70));
  console.log('>>> OTOMASI RENDER PDF KE FOLDER TARGET');
  console.log(`[*] Input HTML Directory : ${inputDir}`);
  console.log(`[*] Output PDF Directory : ${outputDir}`);
  console.log(`[*] Workers Paralel     : ${numWorkers}`);
  if (filterTarget) {
    console.log(`[*] Filter Target        : ${filterTarget}`);
  }
  console.log('='.repeat(70));

  if (!fs.existsSync(inputDir)) {
    console.error(`[ERROR] Folder input '${inputDir}' tidak ditemukan!`);
    process.exit(1);
  }

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const chromePath = getChromePath();
  if (!fs.existsSync(chromePath)) {
    console.error(`[ERROR] Google Chrome tidak ditemukan di: ${chromePath}`);
    process.exit(1);
  }

  let entries = fs.readdirSync(inputDir);
  let htmlFiles = entries.filter((f) => f.toLowerCase().endsWith('.html'));

  if (filterTarget) {
    htmlFiles = htmlFiles.filter((f) => f.toLowerCase().includes(filterTarget));
  }

  if (htmlFiles.length === 0) {
    console.log('[INFO] Tidak ada file .html pada direktori input.');
    return;
  }

  console.log(`[*] Ditemukan ${htmlFiles.length} berkas HTML siap dirender.`);

  const tasks = htmlFiles.map((f) => {
    const baseName = path.basename(f, path.extname(f));
    const htmlFile = path.join(inputDir, f);
    return {
      title: baseName,
      htmlFile: htmlFile,
      outPdf: path.join(outputDir, `${baseName}.pdf`),
      size: fs.statSync(htmlFile).size
    };
  });

  // Urutkan tugas dari berkas terbesar ke terkecil (LPT scheduling) agar utilisasi worker optimal
  tasks.sort((a, b) => b.size - a.size);

  const { chromeProcess, ws, createWorker } = await startChrome(chromePath, debugPort);
  console.log(`[*] Menyiapkan ${numWorkers} worker CDP paralel...`);
  const workers = await Promise.all(Array.from({ length: numWorkers }, () => createWorker()));

  let completed = 0;
  let taskIdx = 0;
  const t0 = Date.now();

  async function runWorker(worker, workerId) {
    while (taskIdx < tasks.length) {
      const task = tasks[taskIdx++];
      try {
        const size = await worker.printHtmlToPdf(task.htmlFile, task.outPdf);
        completed++;
        if (completed % 10 === 0 || completed === tasks.length) {
          const elapsed = ((Date.now() - t0) / 1000).toFixed(1);
          console.log(`   Progress: ${completed}/${tasks.length} PDF (${elapsed}s) | Selesai: ${task.title} (${(size / 1024).toFixed(1)} KB)`);
        }
      } catch (err) {
        console.error(`   [!] Gagal render ${task.title}:`, err.message);
      }
    }
  }

  await Promise.all(workers.map((w, idx) => runWorker(w, idx + 1)));

  try {
    ws.close();
  } catch (e) {}
  try {
    chromeProcess.kill();
  } catch (e) {}

  const totalTime = ((Date.now() - t0) / 1000).toFixed(1);
  console.log('='.repeat(70));
  console.log(`>>> SUKSES! Seluruh ${completed} berkas PDF berhasil dirender ke '${outputDir}' dalam ${totalTime} detik.`);
  console.log('='.repeat(70));
}

main().catch((err) => {
  console.error('[FATAL ERROR]:', err);
  process.exit(1);
});
