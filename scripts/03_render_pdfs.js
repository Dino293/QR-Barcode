/**
 * ========================================================================================
 * ALUR 3: OTOMASI RENDER TEMPLATE HTML KE BERKAS PDF (CHROME CDP)
 * ========================================================================================
 * Skrip ini memanfaatkan Google Chrome Headless via Chrome DevTools Protocol (CDP)
 * untuk mengubah seluruh template 'template_print.html' di setiap subfolder ruangan
 * menjadi berkas PDF siap cetak dengan akurasi tata letak dan gambar 100%.
 *
 * Cara Menjalankan:
 *   node scripts/03_render_pdfs.js
 *   node scripts/03_render_pdfs.js --workers=4 --port=9225
 * ========================================================================================
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

// Path direktori utama
const BASE_DIR = path.resolve(__dirname, '..');
const OUTPUT_DIR = path.join(BASE_DIR, 'output_pdf');

// Deteksi lokasi instalasi Google Chrome
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

// Konfigurasi CLI
const args = process.argv.slice(2);
let debugPort = 9225;
let numWorkers = 4;

for (const arg of args) {
  if (arg.startsWith('--port=')) debugPort = parseInt(arg.split('=')[1], 10);
  if (arg.startsWith('--workers=')) numWorkers = parseInt(arg.split('=')[1], 10);
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

  await new Promise((resolve) => setTimeout(resolve, 1500));

  const res = await fetch(`http://127.0.0.1:${port}/json/version`);
  const data = await res.json();
  const ws = new WebSocket(data.webSocketDebuggerUrl);

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
      const fileUrl = 'file:///' + htmlFilePath.replace(/\\/g, '/');
      await sendSession('Page.navigate', { url: fileUrl });
      await sendSession('Runtime.evaluate', {
        expression: `
          new Promise(resolve => {
            const imgs = Array.from(document.querySelectorAll('img'));
            let remaining = imgs.length;
            if (remaining === 0) return resolve();
            imgs.forEach(img => {
              if (img.complete) {
                remaining--;
                if (remaining === 0) resolve();
              } else {
                img.addEventListener('load', () => { remaining--; if (remaining === 0) resolve(); });
                img.addEventListener('error', () => { remaining--; if (remaining === 0) resolve(); });
              }
            });
            setTimeout(resolve, 2500);
          })
        `,
        awaitPromise: true
      });

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
      fs.writeFileSync(outPdfPath, buf);
      return buf.length;
    }

    return { printHtmlToPdf };
  }

  return { chromeProcess, ws, createWorker };
}

async function main() {
  console.log('='.repeat(70));
  console.log('>>> MEMULAI RENDERING PDF VIA GOOGLE CHROME DEVTOOLS PROTOCOL');
  console.log(`[*] Direktori Target: ${OUTPUT_DIR}`);
  console.log('='.repeat(70));

  if (!fs.existsSync(OUTPUT_DIR)) {
    console.error(`[ERROR] Folder '${OUTPUT_DIR}' tidak ditemukan! Jalankan Alur 2 terlebih dahulu.`);
    return;
  }

  const chromePath = getChromePath();
  if (!fs.existsSync(chromePath)) {
    console.error(`[ERROR] Google Chrome tidak ditemukan di: ${chromePath}`);
    return;
  }

  // Pindai seluruh folder ruangan
  const entries = fs.readdirSync(OUTPUT_DIR, { withFileTypes: true });
  const roomFolders = entries.filter((d) => d.isDirectory()).map((d) => d.name);

  // Kumpulkan task render yang memiliki file HTML
  const tasks = [];
  for (const room of roomFolders) {
    const roomPath = path.join(OUTPUT_DIR, room);
    const htmlFile = path.join(roomPath, 'template_print.html');
    const outPdf = path.join(OUTPUT_DIR, `${room}.pdf`);

    if (fs.existsSync(htmlFile)) {
      tasks.push({ room, htmlFile, outPdf });
    }
  }

  if (tasks.length === 0) {
    console.log('[INFO] Tidak ada file template_print.html subfolder yang perlu dirender.');
    console.log(`[INFO] Seluruh berkas PDF ruangan di '${OUTPUT_DIR}' sudah tersedia lengkap.`);
    return;
  }

  console.log(`[*] Ditemukan ${tasks.length} template HTML yang siap dirender menjadi PDF.`);

  const { chromeProcess, ws, createWorker } = await startChrome(chromePath, debugPort);
  console.log(`[*] Membuat ${numWorkers} worker render paralel...`);
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
          console.log(`   Progress: ${completed}/${tasks.length} PDF (${elapsed}s) | Selesai: ${task.room} (${(size / 1024).toFixed(1)} KB)`);
        }
      } catch (err) {
        console.error(`   [!] Gagal render ${task.room}:`, err.message);
      }
    }
  }

  await Promise.all(workers.map((w, idx) => runWorker(w, idx + 1)));

  ws.close();
  chromeProcess.kill();

  console.log('='.repeat(70));
  console.log(`>>> SUKSES! Seluruh ${completed} berkas PDF berhasil dirender dalam ${((Date.now() - t0) / 1000).toFixed(1)} detik.`);
  console.log('='.repeat(70));
}

main().catch((err) => {
  console.error('[FATAL ERROR]:', err);
  process.exit(1);
});
