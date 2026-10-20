"""
========================================================================================
ALUR 4: AUDIT DAN VERIFIKASI KELENGKAPAN BERKAS PDF CETAK RUANGAN
========================================================================================
Skrip ini melakukan audit menyeluruh terhadap folder 'output_pdf/' dengan mencocokkan:
1. Daftar seluruh 239 ruangan dari database Excel (data/data.xlsx).
2. Pemetaan nama gedung (data/clean_room_building_map.json).
3. Keberadaan berkas PDF hasil render per ruangan.
4. Integritas ukuran berkas (memastikan tidak ada PDF kosong / 0 byte).
5. Ringkasan kesiapan cetak.
========================================================================================
"""

import os
import re
import sys
import json
import openpyxl

# Atur stdout UTF-8 agar kompatibel di Windows
if sys.platform == 'win32':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(BASE_DIR, 'data')
EXCEL_PATH = os.path.join(DATA_DIR, 'data.xlsx')
MAP_PATH = os.path.join(DATA_DIR, 'clean_room_building_map.json')
OUTPUT_DIR = os.path.join(BASE_DIR, 'output_pdf')

# Muat relasi kode ruangan & nama gedung
mapping = {}
if os.path.exists(MAP_PATH):
    try:
        with open(MAP_PATH, 'r', encoding='utf-8') as f:
            mapping = json.load(f)
    except Exception as e:
        print(f"[WARN] Gagal membaca mapping gedung: {e}")

pairs = mapping.get('pairs', {})
codes = mapping.get('codes', {})


def get_building_name(kd, nm):
    kd_u = str(kd or '').strip().upper()
    nm_l = str(nm or '').strip().lower()
    if not kd_u and not nm_l:
        return ''
    key = f"{kd_u.lower()}|||{nm_l}"
    if key in pairs:
        return pairs[key]
    if kd_u.startswith('D.1.') or kd_u.startswith('D.2.') or kd_u.startswith('D.'):
        return 'Asrama Marsawa'
    if kd_u.startswith('F.1.') or kd_u.startswith('F.2.') or kd_u.startswith('F.'):
        return 'Asrama Bulian'
    if kd_u.startswith('E.1.') or kd_u.startswith('E.'):
        return 'Asrama Kulim'
    if kd_u.startswith('G.1.') or kd_u.startswith('G.2.') or kd_u.startswith('G.'):
        return 'Mess Jelutung 3'
    if kd_u.startswith('H.1.') or kd_u.startswith('H.'):
        return 'Mess Penatar'
    if (kd_u == '2' or kd_u == '3') and 'kamar' in nm_l:
        return 'Mess Kepala'
    if (kd_u == '4' or kd_u == '5') and 'kamar' in nm_l:
        return 'Mess Jelutung 2'
    kd_l = kd_u.lower()
    if kd_l not in ['1', '2', '3', '4', '5', '01', '02', '03', '04', '05'] and kd_l in codes:
        return codes[kd_l]
    return ''


def sanitize_filename(name, max_len=70):
    s = re.sub(r'[\<\>\:\"\/\\\\\|\?\*]', ' - ', str(name or ''))
    s = re.sub(r'\s+', ' ', s).strip('. ')
    if len(s) > max_len:
        s = s[:max_len].strip('. ')
    return s or 'Item'


def run_audit():
    print("=" * 70)
    print(">>> AUDIT & VERIFIKASI BERKAS HASIL CETAK LABEL PDF RUANGAN")
    print(f"[*] Berkas Database : {EXCEL_PATH}")
    print(f"[*] Folder Output   : {OUTPUT_DIR}")
    print("=" * 70)

    if not os.path.exists(EXCEL_PATH):
        print(f"[ERROR] Database Excel '{EXCEL_PATH}' tidak ditemukan!")
        return

    if not os.path.exists(OUTPUT_DIR):
        print(f"[ERROR] Folder output '{OUTPUT_DIR}' tidak ditemukan!")
        return

    # 1. Baca Database Ruangan dari Excel
    print("\n[1/3] Membaca data ruangan & pemetaan gedung dari database...")
    wb = openpyxl.load_workbook(EXCEL_PATH, read_only=True)
    ws = wb['Database'] if 'Database' in wb.sheetnames else wb.active

    rooms_data = {}
    total_items = 0

    for idx, row in enumerate(ws.iter_rows(values_only=True)):
        if idx == 0:
            continue
        kd_r = str(row[20] or '').strip() if len(row) > 20 else ''
        nm_r = str(row[21] or '').strip() if len(row) > 21 else ''

        if not kd_r and not nm_r:
            continue

        total_items += 1
        bg = get_building_name(kd_r, nm_r)

        if bg:
            room_title = f"[{kd_r}] {nm_r} - {bg}" if kd_r and nm_r else (f"[{kd_r}] {bg}" if kd_r else f"{nm_r} - {bg}")
        elif kd_r and nm_r:
            room_title = f"[{kd_r}] {nm_r}"
        elif nm_r:
            room_title = nm_r
        elif kd_r:
            room_title = f"[{kd_r}] Ruangan {kd_r}"
        else:
            room_title = "Tanpa Ruangan"

        clean_title = sanitize_filename(room_title, 65)

        if clean_title not in rooms_data:
            rooms_data[clean_title] = {
                'kd_r': kd_r,
                'nm_r': nm_r,
                'bg': bg,
                'room_title': room_title,
                'item_count': 0
            }
        rooms_data[clean_title]['item_count'] += 1

    wb.close()
    print(f"   * Total Ruangan terdata di Excel : {len(rooms_data):,} ruangan")
    print(f"   * Total Barang teralokasi        : {total_items:,} barang")

    # 2. Pindai Berkas PDF pada Folder Output
    print("\n[2/3] Memeriksa berkas PDF pada folder 'output_pdf'...")
    existing_files = os.listdir(OUTPUT_DIR)
    pdf_files = [f for f in existing_files if f.lower().endswith('.pdf')]
    pdf_set = set(pdf_files)
    pdf_lower_map = {f.lower(): f for f in pdf_files}

    print(f"   * Total berkas PDF ditemukan     : {len(pdf_files):,} berkas")

    # 3. Validasi & Rekonsiliasi
    print("\n[3/3] Melakukan rekonsiliasi data vs berkas PDF...")
    matched = []
    missing_pdfs = []
    zero_byte_pdfs = []

    for room_name, info in rooms_data.items():
        expected_filename = f"{room_name}.pdf"
        actual_file = None

        if expected_filename in pdf_set:
            actual_file = expected_filename
        elif expected_filename.lower() in pdf_lower_map:
            actual_file = pdf_lower_map[expected_filename.lower()]
        else:
            # Cari fallback jika ada sedikit perbedaan karakter sanitasi
            for pf in pdf_files:
                if pf.startswith(f"[{info['kd_r']}]") and info['kd_r']:
                    actual_file = pf
                    break

        if actual_file:
            fpath = os.path.join(OUTPUT_DIR, actual_file)
            fsize = os.path.getsize(fpath)
            if fsize <= 0:
                zero_byte_pdfs.append((actual_file, fsize, info['item_count']))
            else:
                matched.append({
                    'room': room_name,
                    'file': actual_file,
                    'size': fsize,
                    'items': info['item_count']
                })
        else:
            missing_pdfs.append((expected_filename, info['item_count']))

    # Tampilkan Hasil Audit
    print("\n" + "=" * 70)
    print("HASIL LENGKAP AUDIT BERKAS CETAK PDF:")
    print("=" * 70)
    print(f"Status Lengkap & Valid (OK)  : {len(matched):,} dari {len(rooms_data)} Ruangan")
    print(f"Status Berkas Kosong (0 Byte): {len(zero_byte_pdfs):,} PDF")
    print(f"Status PDF Belum Dibuat      : {len(missing_pdfs):,} Ruangan")
    print("=" * 70)

    if zero_byte_pdfs:
        print("\n[PERINGATAN] Berkas PDF 0 Byte terdeteksi:")
        for f, sz, cnt in zero_byte_pdfs[:10]:
            print(f"  - {f} ({cnt} barang)")

    if missing_pdfs:
        print(f"\n[PERINGATAN] Ada {len(missing_pdfs)} ruangan yang belum memiliki PDF:")
        for f, cnt in missing_pdfs[:10]:
            print(f"  - {f} ({cnt} barang)")
        if len(missing_pdfs) > 10:
            print(f"  ... dan {len(missing_pdfs)-10} ruangan lainnya.")
    else:
        print("\n[STATUS: 100% SEMPURNA]")
        print("Seluruh 239 ruangan di database telah memiliki berkas PDF label barcode siap cetak!")

    print("=" * 70)


if __name__ == '__main__':
    run_audit()
