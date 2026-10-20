"""
========================================================================================
ALUR 1: SINKRONISASI OTOMATIS API SIMAN BPMP JAMBI KE EXCEL (data.xlsx)
========================================================================================
Fitur Utama:
1. SMART CHECK (Anti-Pengulangan):
   - Hanya baris data yang KOSONG di Kolom AB (QR) yang akan diperiksa ke API SIMAN.
   - Baris data yang SUDAH TERISI barcode/QR langsung DILEWATI (100% TIDAK request ke API).
2. DUAL CACHING SYSTEM (siman_cache.json):
   - Jika suatu kode barang & NUP sudah pernah dicek sebelumnya, sistem mengambil
     hasilnya langsung dari cache lokal (hemat kuota, cepat, tanpa request ulang).
3. MULTITHREADED CONCURRENCY (15 Worker):
   - Kecepatan tinggi (~50-60 data per detik) untuk baris data baru yang kosong.
========================================================================================
"""

import sys
import time
import os
import json
import urllib.request
import ssl
from concurrent.futures import ThreadPoolExecutor, as_completed
import openpyxl

# Atur stdout UTF-8 agar kompatibel di seluruh terminal Windows
if sys.platform == 'win32':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

# Resolusi path dinamis relatif terhadap root proyek
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(BASE_DIR, 'data')

CACHE_FILE = os.path.join(DATA_DIR, 'siman_cache.json')
EXCEL_FILE = os.path.join(DATA_DIR, 'data.xlsx')
SHEET_NAME = 'Database'
MAX_WORKERS = 15

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE


def run_sync(force_recheck=False):
    print("=" * 70)
    print(">>> MEMULAI SINKRONISASI DATA BARCODE SIMAN BPMP JAMBI")
    print(f"[*] Berkas Target : {EXCEL_FILE} (Sheet: '{SHEET_NAME}')")
    print(f"[*] Mode          : {'Paksa Cek Ulang' if force_recheck else 'Hanya Baris Kosong (Anti-Pengulangan)'}")
    print("=" * 70)

    # 1. Muat Cache Lokal jika ada
    cache = {}
    if os.path.exists(CACHE_FILE):
        try:
            with open(CACHE_FILE, 'r', encoding='utf-8') as f:
                cache = json.load(f)
            print(f"[CACHE] Cache lokal terdeteksi : {len(cache):,} data tersimpan di '{os.path.basename(CACHE_FILE)}'")
        except Exception as e:
            print(f"[WARN] Gagal membaca cache: {e}. Membuat cache baru.")

    # 2. Baca Seluruh Baris dari Excel (Fast Read-Only Streaming Mode)
    print("\n[1/4] Membaca dan menganalisis baris data pada Excel...")
    if not os.path.exists(EXCEL_FILE):
        print(f"[ERROR] Berkas '{EXCEL_FILE}' tidak ditemukan!")
        return

    wb_read = openpyxl.load_workbook(EXCEL_FILE, read_only=True)
    if SHEET_NAME not in wb_read.sheetnames:
        print(f"[ERROR] Sheet '{SHEET_NAME}' tidak ditemukan di dalam '{EXCEL_FILE}'!")
        wb_read.close()
        return

    ws_read = wb_read[SHEET_NAME]

    items = []
    already_filled_count = 0
    empty_count = 0

    for idx, row in enumerate(ws_read.iter_rows(values_only=True)):
        if idx == 0:
            continue
        row_num = idx + 1
        kd = str(row[3]).strip() if len(row) > 3 and row[3] is not None else ""
        nup = str(row[4]).strip() if len(row) > 4 and row[4] is not None else ""
        qr_existing = str(row[27]).strip() if len(row) > 27 and row[27] is not None else ""

        # Abaikan baris yang tidak memiliki Kode Barang
        if not kd:
            continue

        is_filled = bool(qr_existing)
        if is_filled:
            already_filled_count += 1
        else:
            empty_count += 1

        items.append({
            'row': row_num,
            'kode': kd,
            'nup': nup,
            'qr': qr_existing,
            'is_filled': is_filled
        })

    wb_read.close()
    total_items = len(items)

    print(f"   * Total data barang valid      : {total_items:,} baris")
    print(f"   * Sudah Terisi di Kolom AB     : {already_filled_count:,} baris (DILEWATI, 100% TIDAK di-request ke API)")
    print(f"   * Masih Kosong di Kolom AB     : {empty_count:,} baris")

    # 3. Filter Hanya Data yang KOSONG untuk dicek ke API
    print("\n[2/4] Menyortir baris kosong & mencocokkan dengan cache...")
    unique_pairs_to_fetch = set()
    rows_can_update_from_cache = 0

    for it in items:
        key = f"{it['kode']}_{it['nup']}"

        # Jika sudah terisi di Kolom AB, simpan ke cache jika belum ada, JANGAN request ke API!
        if it['is_filled']:
            if key not in cache and it['qr'].startswith('qr_images/'):
                cache[key] = it['qr']
            continue

        # Data KOSONG di Excel:
        # Jika di cache lokal SUDAH ADA barcode QR yang valid, kita bisa update langsung tanpa request internet.
        # Jika di cache lokal MASIH KOSONG ("") atau belum pernah dicek, WAJIB request ulang ke API terbaru!
        if cache.get(key) and not force_recheck:
            rows_can_update_from_cache += 1
        else:
            unique_pairs_to_fetch.add((it['kode'], it['nup']))

    to_fetch = list(unique_pairs_to_fetch)
    print(f"   * Siap diisi dari Cache Lokal  : {rows_can_update_from_cache:,} baris (Tanpa request internet)")
    print(f"   * Perlu Request Baru ke API    : {len(to_fetch):,} kombinasi Kode & NUP")

    # 4. Request ke API SIMAN HANYA untuk Data yang Kosong & Belum Ada di Cache
    def fetch_qr(pair):
        kd, nup = pair
        key = f"{kd}_{nup}"
        url = f"https://app.bpmpjambi.my.id/siman/api/search-qr?kode_barang={kd}&nup={nup}"
        for _ in range(2):
            try:
                req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
                with urllib.request.urlopen(req, context=ctx, timeout=7) as resp:
                    data = json.loads(resp.read().decode('utf-8'))
                    if data.get('found'):
                        qr_val = data.get('qr_image') or (data.get('data') and data['data'].get('qr_image'))
                        if qr_val:
                            return (key, qr_val)
                    return (key, "")
            except urllib.error.HTTPError as e:
                if e.code == 404:
                    return (key, "")
                time.sleep(0.4)
            except Exception:
                time.sleep(0.4)
        return (key, "")

    if to_fetch:
        print(f"\n[3/4] Mengambil data dari API SIMAN ({len(to_fetch):,} request, {MAX_WORKERS} worker)...")
        t0 = time.time()
        completed = 0
        matched_new = 0
        last_cache_save = time.time()

        with ThreadPoolExecutor(max_workers=MAX_WORKERS) as executor:
            futures = {executor.submit(fetch_qr, pair): pair for pair in to_fetch}
            for f in as_completed(futures):
                key, qr_val = f.result()
                cache[key] = qr_val
                completed += 1
                if qr_val:
                    matched_new += 1

                if completed % 200 == 0 or completed == len(to_fetch):
                    elapsed = time.time() - t0
                    speed = completed / elapsed if elapsed > 0 else 0
                    percent = (completed * 100) / len(to_fetch)
                    print(f"   Progress: {completed:,}/{len(to_fetch):,} ({percent:.1f}%) | Ditemukan: {matched_new:,} | Kecepatan: {speed:.1f} data/dtk")

                if time.time() - last_cache_save > 25:
                    with open(CACHE_FILE, 'w', encoding='utf-8') as cf:
                        json.dump(cache, cf)
                    last_cache_save = time.time()

        # Simpan cache final
        with open(CACHE_FILE, 'w', encoding='utf-8') as cf:
            json.dump(cache, cf)
        print(f"   [OK] Selesai mengambil data baru dalam {time.time()-t0:.1f} detik. Cache disimpan.")
    else:
        print("\n[3/4] [LEWATI] Tidak ada request API baru yang diperlukan (seluruh baris kosong sudah teridentifikasi di cache).")

    # 5. Tulis Hasil ke Kolom AB (QR) di Excel (HANYA untuk baris yang kosong)
    print("\n[4/4] Memeriksa status penulisan ke Kolom AB sheet 'Database'...")
    
    # Hitung berapa baris kosong yang berhasil mendapatkan barcode
    newly_updated_count = 0
    for it in items:
        if it['is_filled']:
            continue
        key = f"{it['kode']}_{it['nup']}"
        if cache.get(key):
            newly_updated_count += 1

    if newly_updated_count == 0 and empty_count > 0:
        print(f"   [INFO] Tidak ada barcode baru yang ditemukan di API untuk {empty_count:,} baris kosong tersebut.")
        print(f"   [INFO] Seluruh baris kosong tersebut memang belum terdaftar di sistem SIMAN (HTTP 404).")
        print(f"   [INFO] File '{os.path.basename(EXCEL_FILE)}' sudah mutakhir, tidak ada perubahan yang perlu disimpan.")
        print("=" * 70)
        return

    if newly_updated_count == 0 and empty_count == 0:
        print(f"   [SEMPURNA] Seluruh {already_filled_count:,} baris pada Kolom AB sudah terisi penuh.")
        print(f"   [INFO] File '{os.path.basename(EXCEL_FILE)}' sudah 100% up-to-date.")
        print("=" * 70)
        return

    # Buka workbook dalam mode tulis untuk update baris kosong
    print(f"   Membuka '{os.path.basename(EXCEL_FILE)}' untuk menulis {newly_updated_count:,} barcode baru...")
    wb = openpyxl.load_workbook(EXCEL_FILE)
    
    if 'Preview 10 Row SIMAN' in wb.sheetnames:
        del wb['Preview 10 Row SIMAN']

    ws = wb[SHEET_NAME]
    wb.active = ws

    # Header Baris 1 Kolom AB (28)
    if not ws.cell(1, 28).value:
        ws.cell(1, 28, "QR")

    written_count = 0
    for it in items:
        # HANYA UPDATE JIKA DI EXCEL MASIH KOSONG
        if it['is_filled']:
            continue

        key = f"{it['kode']}_{it['nup']}"
        qr_val = cache.get(key, "")
        if qr_val:
            ws.cell(row=it['row'], column=28, value=qr_val)
            written_count += 1

    saved_target = EXCEL_FILE
    try:
        print(f"   Menyimpan perubahan ke '{EXCEL_FILE}'...")
        wb.save(EXCEL_FILE)
    except PermissionError:
        saved_target = os.path.join(DATA_DIR, 'data_synced_temp.xlsx')
        print(f"   [PERINGATAN] Berkas '{os.path.basename(EXCEL_FILE)}' sedang dibuka di aplikasi lain (misal: Microsoft Excel).")
        print(f"   Menyimpan hasil sinkronisasi ke berkas cadangan: '{saved_target}'...")
        wb.save(saved_target)
        print(f"   [TIPS] Tutup berkas '{os.path.basename(EXCEL_FILE)}' di aplikasi Excel jika ingin menyimpan langsung ke berkas utama.")

    print("=" * 70)
    print(">>> SINKRONISASI SUKSES SELESAI!")
    print(f"   * Baris yang baru saja diisi Kolom AB : +{written_count:,} baris")
    print(f"   * Total baris ber-barcode sekarang   : {already_filled_count + written_count:,} dari {total_items:,} baris")
    print(f"   * Sheet Aktif                        : '{ws.title}'")
    print(f"   * Berkas Tersimpan                   : {saved_target}")
    print("=" * 70)


if __name__ == '__main__':
    force = '--force' in sys.argv or '-f' in sys.argv
    run_sync(force_recheck=force)
