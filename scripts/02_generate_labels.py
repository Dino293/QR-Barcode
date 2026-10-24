import os, sys, base64, html, json, openpyxl, re, time

# Resolusi path dinamis relatif terhadap root proyek
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(BASE_DIR, "data")
WEB_DIR = os.path.join(BASE_DIR, "web")
OUTPUT_DIR = os.path.join(BASE_DIR, "output_pdf")
QR_CACHE_DIR = os.path.join(BASE_DIR, "qr_cache")

print("Memulai proses pembuatan folder dan template print label barang...")
t_start = time.time()

# 1. Baca Logo Kemendikbud ke Base64
logo_path = os.path.join(WEB_DIR, 'images.png')
with open(logo_path, 'rb') as f:
    logo_base64 = "data:image/png;base64," + base64.b64encode(f.read()).decode('utf-8')
print("Logo berhasil dimuat ke format base64.")

# 2. Muat Relasi Kode Ruangan & Nama Bangunan
map_path = os.path.join(DATA_DIR, 'clean_room_building_map.json')
with open(map_path, 'r', encoding='utf-8') as f:
    mapping = json.load(f)
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

# 3. Ekstraksi Tahun
def extract_year(tahun_val, tgl_val, satker_val):
    t_str = str(tahun_val or '').strip()
    m = re.search(r'\b(19\d{2}|20\d{2})\b', t_str)
    if m:
        return m.group(1)

    if isinstance(tgl_val, (int, float)) and 25000 < tgl_val < 60000:
        try:
            from datetime import datetime, timedelta
            base = datetime(1899, 12, 30)
            d = base + timedelta(days=tgl_val)
            return str(d.year)
        except Exception:
            pass

    d_str = str(tgl_val or '').strip()
    m2 = re.search(r'\b(19\d{2}|20\d{2})\b', d_str)
    if m2:
        return m2.group(1)

    s_str = str(satker_val or '').strip()
    m3 = re.search(r'\.(19\d{2}|20\d{2})\b', s_str)
    if m3:
        return m3.group(1)
    return ''

# 4. Baca Seluruh Data dari data.xlsx (Sheet: Database)
excel_path = os.path.join(DATA_DIR, 'data.xlsx')
print(f"Membaca file data Excel: {excel_path} ...")
wb = openpyxl.load_workbook(excel_path, read_only=True, data_only=True)
ws = wb['Database'] if 'Database' in wb.sheetnames else wb.active

rooms_data = {}
total_records = 0

for row in ws.iter_rows(min_row=2, values_only=True):
    if not row or len(row) < 6:
        continue
    total_records += 1

    kd_r = str(row[20] or '').strip() if len(row) > 20 else ''
    nm_r = str(row[21] or '').strip() if len(row) > 21 else ''
    bg = get_building_name(kd_r, nm_r)

    # Susun nama ruangan & gedung
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

    room_folder_name = sanitize_filename(room_title, 65)

    satker = str(row[1] or '138041000693242000KD').strip()
    tgl_perolehan = str(row[9] or '').strip() if len(row) > 9 and row[9] is not None else ''
    tahun = extract_year(row[25] if len(row) > 25 else '', row[9] if len(row) > 9 else '', satker)
    kode_barang = str(row[3] or '-').strip()
    nup = str(row[4] or '1').strip()
    nama_barang = str(row[5] or 'Barang BMN').strip()
    merk_tipe = str(row[8] or '-').strip() if len(row) > 8 and row[8] else '-'
    qr = str(row[27] or '').strip() if len(row) > 27 else ''

    item = {
        'kode_satker': satker,
        'tahun': tahun,
        'tgl_perolehan': tgl_perolehan,
        'kode_barang': kode_barang,
        'nup': nup,
        'nama_barang': nama_barang,
        'merk_tipe': merk_tipe,
        'custom_barcode': qr,
        'ruangan': room_title
    }

    if room_folder_name not in rooms_data:
        rooms_data[room_folder_name] = {
            'room_title': room_title,
            'items': []
        }
    rooms_data[room_folder_name]['items'].append(item)

wb.close()
print(f"Total {total_records} data berhasil dikelompokkan ke dalam {len(rooms_data)} ruangan.")

# 5. Template Helper HTML
def render_label_html(item):
    satker = str(item.get('kode_satker') or '138041000693242000KD').strip()
    tahun = str(item.get('tahun') or '').strip()
    if not tahun and item.get('tgl_perolehan'):
        m = re.search(r'\b(19\d{2}|20\d{2})\b', str(item.get('tgl_perolehan')))
        if m:
            tahun = m.group(1)

    if tahun:
        if satker.endswith(f".{tahun}") or f".{tahun}" in satker:
            satker_display = satker
        else:
            satker_display = f"{satker}.{tahun}"
    else:
        satker_display = satker

    kode_barang = html.escape(str(item.get('kode_barang') or '-'))
    nup = html.escape(str(item.get('nup') or '1'))
    nama_barang = html.escape(str(item.get('nama_barang') or 'Barang BMN'))
    merk_tipe = html.escape(str(item.get('merk_tipe') or '-'))

    qr = str(item.get('custom_barcode') or '').strip()
    if qr.startswith('qr_images/') or qr.startswith('/qr_images/'):
        qr_url = f"https://app.bpmpjambi.my.id/siman/{qr.lstrip('/')}"
    elif qr.startswith('http://') or qr.startswith('https://') or qr.startswith('data:'):
        qr_url = qr
    elif qr:
        qr_url = f"https://app.bpmpjambi.my.id/siman/{qr.lstrip('/')}"
    else:
        qr_url = ""

    return f"""
    <article class="item-label">
      <header class="label-header">
        <div class="header-logo-box">
          <img src="{logo_base64}" alt="Logo" class="logo-image">
        </div>
        <div class="header-text-box">
          <div class="instansi-line1">KEMENTERIAN PENDIDIKAN DASAR DAN</div>
          <div class="instansi-line2">MENENGAH</div>
          <div class="satker-code-line">{html.escape(satker_display)}</div>
        </div>
        <div class="header-logo-box opacity-0 pointer-events-none" aria-hidden="true" style="visibility: hidden;"></div>
      </header>

      <div class="label-body">
        <div class="body-info-left">
          <div>
            <div class="info-top-row">
              <span class="info-kode-barang">{kode_barang}</span>
              <span class="info-nup">NUP: {nup}</span>
            </div>
            <div class="info-nama-barang">{nama_barang}</div>
          </div>
          <div class="info-merk-tipe">{merk_tipe}</div>
        </div>
        <div class="body-qr-right">
          <div class="qr-svg-wrapper">
            <img src="{qr_url}" alt="QR SIMAN" class="w-full h-full object-contain"
              onerror="this.style.display='none'; if(this.nextElementSibling) this.nextElementSibling.style.display='flex';"
              decoding="async">
            <div class="qr-fallback-msg" style="display:none; align-items:center; justify-content:center; width:100%; height:100%; font-size:7.5px; color:#94a3b8; font-family:'JetBrains Mono',monospace; text-align:center;">
              QR Belum Terdaftar
            </div>
          </div>
        </div>
      </div>
    </article>
    """

def get_page_head(title, subtitle=""):
    return f"""<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{html.escape(title)} - Cetak Label BMN A4</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    :root {{
      --page-width: 210mm;
      --page-height: 297mm;
      --page-margin-top: 13.71mm;
      --page-margin-bottom: 6.21mm;
      --page-margin-left: 0.67mm;
      --page-margin-right: 0.67mm;

      /* Parameter Presisi: P: 104mm x T: 41mm (2 Kolom x 6 Baris = 12 Label) */
      --label-width: 104mm;
      --label-height: 41mm;
      --header-height: 13.9mm;
      --label-col-gap: 0.67mm;
      --label-row-gap: 6.21mm;
      --grid-cols: 2;

      --qr-size: 21mm;
      --logo-size: 9mm;

      /* Tipografi Standar Spesifikasi: Helvetica Reguler */
      --instansi-font-size: 10.5pt;
      --satker-font-size: 9pt;
      --body-font-size: 9pt;
    }}

    * {{
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }}

    body {{
      background-color: #0f172a;
      color: #0f172a;
      margin: 0;
      padding: 0;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      -webkit-font-smoothing: antialiased;
    }}

    /* Top Toolbar (Layar Web Only) */
    .top-toolbar {{
      background-color: #1e293b;
      border-bottom: 1px solid #334155;
      padding: 12px 24px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      position: sticky;
      top: 0;
      z-index: 100;
      box-shadow: 0 4px 6px -1px rgba(0,0,0,0.3);
    }}
    .toolbar-left {{
      display: flex;
      align-items: center;
      gap: 12px;
      flex-wrap: wrap;
    }}
    .toolbar-title {{
      color: #f8fafc;
      font-size: 14px;
      font-weight: 700;
    }}
    .toolbar-badge {{
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 3px 8px;
      background-color: #0f172a;
      border: 1px solid #334155;
      border-radius: 6px;
      color: #38bdf8;
      font-size: 11px;
      font-weight: 600;
      font-family: 'JetBrains Mono', monospace;
    }}
    .btn-print {{
      background: linear-gradient(135deg, #2563eb, #1d4ed8);
      color: #ffffff;
      border: none;
      padding: 8px 18px;
      border-radius: 8px;
      font-weight: 700;
      font-size: 13px;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 8px;
      box-shadow: 0 4px 12px rgba(37,99,235,0.4);
      transition: all 0.2s ease;
    }}
    .btn-print:hover {{
      background: linear-gradient(135deg, #1d4ed8, #1e40af);
      transform: translateY(-1px);
    }}

    .document-workspace {{
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 32px 0 64px;
      gap: 28px;
    }}

    .sheet-wrapper {{
      display: flex;
      flex-direction: column;
      align-items: center;
      margin-bottom: 24px;
    }}

    .a4-sheet {{
      width: var(--page-width);
      height: var(--page-height);
      min-width: var(--page-width);
      min-height: var(--page-height);
      max-width: var(--page-width);
      max-height: var(--page-height);
      background-color: #ffffff;
      padding-top: var(--page-margin-top);
      padding-bottom: var(--page-margin-bottom);
      padding-left: var(--page-margin-left);
      padding-right: var(--page-margin-right);
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.4), 0 8px 10px -6px rgba(0, 0, 0, 0.3);
      position: relative;
      overflow: hidden;
    }}

    .label-grid {{
      display: grid;
      grid-template-columns: repeat(2, var(--label-width));
      grid-auto-rows: var(--label-height);
      column-gap: var(--label-col-gap);
      row-gap: var(--label-row-gap);
      width: 100%;
      height: 100%;
      align-content: start;
      justify-content: center;
    }}

    .item-label {{
      width: var(--label-width);
      height: var(--label-height);
      border: 1px solid #000000;
      background: #ffffff;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      position: relative;
      font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
    }}

    .label-header {{
      width: 100%;
      height: var(--header-height);
      min-height: var(--header-height);
      max-height: var(--header-height);
      border-bottom: 1px solid #000000;
      display: flex;
      flex-direction: row;
      align-items: center;
      padding: 0 2mm;
      gap: 1.5mm;
      overflow: hidden;
      flex-shrink: 0;
    }}

    .header-logo-box {{
      width: calc(var(--header-height) * 0.68);
      height: calc(var(--header-height) * 0.68);
      max-width: 14mm;
      max-height: 14mm;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }}

    .logo-image {{
      width: var(--logo-size);
      height: var(--logo-size);
      max-width: 100%;
      max-height: 100%;
      object-fit: contain;
      display: block;
    }}

    .header-text-box {{
      flex: 1;
      display: flex;
      flex-direction: column;
      justify-content: center;
      text-align: center;
      overflow: hidden;
      line-height: 1.15;
      min-width: 0;
    }}

    .instansi-line1,
    .instansi-line2 {{
      font-size: var(--instansi-font-size, 10.5pt);
      font-weight: 400;
      font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
      letter-spacing: 0.15px;
      color: #000000;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      text-transform: uppercase;
      text-align: center;
      line-height: 1.15;
    }}

    .satker-code-line {{
      font-size: var(--satker-font-size, 9pt);
      font-weight: 400;
      letter-spacing: 0.25px;
      color: #000000;
      font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      text-align: center;
      margin-top: 0.3mm;
      line-height: 1.15;
    }}

    .label-body {{
      flex: 1;
      min-height: 0;
      width: 100%;
      display: flex;
      flex-direction: row;
      align-items: stretch;
      padding: 1.2mm 1.5mm 1.2mm 2.2mm;
      overflow: hidden;
      gap: 1.5mm;
    }}

    .body-info-left {{
      flex: 1;
      min-width: 0;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      overflow: hidden;
      padding-right: 1.5mm;
    }}

    .info-top-row {{
      display: flex;
      align-items: baseline;
      justify-content: flex-start;
      gap: 2.5mm;
      white-space: nowrap;
      margin-bottom: 0.4mm;
      overflow: hidden;
    }}

    .info-kode-barang {{
      font-size: var(--body-font-size, 9pt);
      font-weight: 400;
      font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
      color: #000000;
      letter-spacing: 0.15px;
      flex-shrink: 0;
    }}

    .info-nup {{
      font-size: var(--body-font-size, 9pt);
      font-weight: 400;
      font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
      color: #000000;
      letter-spacing: 0.15px;
      flex-shrink: 0;
      margin-left: 4mm;
    }}

    .info-nama-barang {{
      font-size: var(--body-font-size, 9pt);
      font-weight: 400;
      font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
      color: #000000;
      line-height: 1.15;
      max-height: 2.4em;
      overflow: hidden;
      text-overflow: ellipsis;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      line-clamp: 2;
      -webkit-box-orient: vertical;
      text-transform: uppercase;
    }}

    .info-merk-tipe {{
      font-size: var(--body-font-size, 9pt);
      font-weight: 400;
      font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
      color: #1e293b;
      line-height: 1.15;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      text-transform: uppercase;
    }}

    .body-qr-right {{
      width: calc(var(--qr-size) + 1mm);
      max-width: 45%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: flex-end;
      padding-right: 0.2mm;
      flex-shrink: 0;
    }}

    .qr-svg-wrapper {{
      width: var(--qr-size);
      height: var(--qr-size);
      max-width: 100%;
      max-height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
    }}

    .qr-svg-wrapper img {{
      width: 100%;
      height: 100%;
      object-fit: contain;
      display: block;
    }}

    .sheet-paper-header {{
      position: absolute;
      top: 4.0mm;
      left: var(--page-margin-left);
      right: var(--page-margin-right);
      height: 5.5mm;
      display: flex;
      flex-direction: row;
      align-items: center;
      justify-content: center;
      text-align: center;
      z-index: 10;
      pointer-events: none;
      line-height: 1;
    }}

    .sheet-paper-single-title {{
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
    }}

    .sheet-room-tag {{
      font-size: 7.5pt;
      font-weight: 900;
      color: #1e3a8a;
      letter-spacing: 0.4px;
    }}

    .sheet-room-name {{
      font-weight: 800;
      color: #000000;
      text-transform: uppercase;
    }}

    .sheet-header-bullet {{
      color: #64748b;
      font-weight: 700;
      font-size: 8pt;
    }}

    .sheet-page-info {{
      font-size: 7.5pt;
      font-weight: 700;
      color: #334155;
    }}

    .sheet-count-info {{
      font-size: 7pt;
      font-weight: 600;
      color: #64748b;
    }}

    /* CSS CETAK PRESISI TINGGI A4 (MARGIN 0) */
    @page {{
      size: A4 portrait;
      margin: 0;
    }}

    @media print {{
      html, body {{
        background: transparent !important;
        margin: 0 !important;
        padding: 0 !important;
        width: 210mm !important;
        height: auto !important;
      }}
      .no-print {{
        display: none !important;
      }}
      .document-workspace {{
        padding: 0 !important;
        margin: 0 !important;
        gap: 0 !important;
        display: block !important;
      }}
      .sheet-wrapper {{
        margin: 0 !important;
        padding: 0 !important;
        page-break-after: always !important;
        break-after: page !important;
        page-break-inside: avoid !important;
        break-inside: avoid !important;
      }}
      .sheet-wrapper:last-child,
      .sheet-wrapper:last-of-type {{
        page-break-after: auto !important;
        break-after: auto !important;
      }}
      .a4-sheet {{
        width: 210mm !important;
        height: 296mm !important;
        max-height: 296mm !important;
        box-shadow: none !important;
        border: none !important;
        margin: 0 auto !important;
        page-break-inside: avoid !important;
        break-inside: avoid !important;
        overflow: hidden !important;
      }}
      .sheet-paper-header {{
        position: absolute !important;
        top: 4.0mm !important;
        left: var(--page-margin-left) !important;
        right: var(--page-margin-right) !important;
        visibility: visible !important;
        z-index: 10 !important;
      }}
    }}
  </style>
</head>
<body>
  <div class="top-toolbar no-print">
    <div class="toolbar-left">
      <span class="toolbar-title">{html.escape(title)}</span>
      <span class="toolbar-badge">2 Kolom × 6 Baris (12 Label)</span>
      <span class="toolbar-badge">104 × 41 mm</span>
      {f'<span class="toolbar-badge" style="color:#a7f3d0; border-color:#065f46;">{html.escape(subtitle)}</span>' if subtitle else ''}
    </div>
    <button type="button" onclick="window.print()" class="btn-print">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="6 9 6 2 18 2 18 9"></polyline>
        <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
        <rect x="6" y="14" width="12" height="8"></rect>
      </svg>
      Cetak Dokumen (A4 Presisi)
    </button>
  </div>
  <div class="document-workspace">
"""

def get_page_foot():
    return """
  </div>
</body>
</html>
"""

# 6. Pembuatan Folder & File HTML
os.makedirs(OUTPUT_DIR, exist_ok=True)
print(f"Direktori root output: {OUTPUT_DIR}")

LABELS_PER_PAGE = 12
room_summary = []
created_files_count = 0
created_folders_count = 0

print("Mulai memproses seluruh ruangan dan barang...")
total_rooms = len(rooms_data)
current_room_idx = 0

for room_folder, r_info in rooms_data.items():
    current_room_idx += 1
    room_title = r_info['room_title']
    items = r_info['items']
    room_path = os.path.join(OUTPUT_DIR, room_folder)
    os.makedirs(room_path, exist_ok=True)
    created_folders_count += 1

    # A. Buat file cetak gabungan seluruh barang di ruangan tersebut (cetak_semua_ruangan.html)
    total_sheets = (len(items) + LABELS_PER_PAGE - 1) // LABELS_PER_PAGE
    room_pages_html = []

    for sheet_idx in range(total_sheets):
        start = sheet_idx * LABELS_PER_PAGE
        sheet_items = items[start:start + LABELS_PER_PAGE]
        labels_html = "\n".join([render_label_html(it) for it in sheet_items])

        sheet_block = f"""
        <div class="sheet-wrapper">
          <div class="a4-sheet">
            <div class="sheet-paper-header">
              <div class="sheet-paper-single-title">
                <span class="sheet-room-tag">RUANGAN :</span>
                <span class="sheet-room-name">{html.escape(room_title)}</span>
                <span class="sheet-header-bullet">&bull;</span>
                <span class="sheet-page-info">Halaman {sheet_idx + 1} dari {total_sheets}</span>
                <span class="sheet-count-info">({len(sheet_items)} Label BMN)</span>
              </div>
            </div>
            <div class="label-grid">
              {labels_html}
            </div>
          </div>
        </div>
        """
        room_pages_html.append(sheet_block)

    room_html = get_page_head(room_title, f"{len(items)} Label") + "\n".join(room_pages_html) + get_page_foot()
    with open(os.path.join(room_path, "cetak_semua_ruangan.html"), 'w', encoding='utf-8') as f:
        f.write(room_html)
    with open(os.path.join(room_path, "template_print.html"), 'w', encoding='utf-8') as f:
        f.write(room_html)
    created_files_count += 2

    # B. Buat subfolder dan template_print.html untuk masing-masing barang (12 label duplikat per lembar A4)
    item_links = []
    for item in items:
        nm_b = sanitize_filename(item['nama_barang'], 38)
        nup = sanitize_filename(item['nup'], 10)
        kd_b = sanitize_filename(item['kode_barang'], 15)
        item_folder = f"{nm_b} - NUP {nup} - {kd_b}"
        item_folder = sanitize_filename(item_folder, 65)

        item_path = os.path.join(room_path, item_folder)
        os.makedirs(item_path, exist_ok=True)
        created_folders_count += 1

        # 12 label duplikat penuh
        single_label = render_label_html(item)
        grid_12_labels = "\n".join([single_label for _ in range(12)])

        item_sheet = f"""
        <div class="sheet-wrapper">
          <div class="a4-sheet">
            <div class="sheet-paper-header">
              <div class="sheet-paper-single-title">
                <span class="sheet-room-tag">RUANGAN :</span>
                <span class="sheet-room-name">{html.escape(room_title)}</span>
                <span class="sheet-header-bullet">&bull;</span>
                <span class="sheet-page-info">Halaman 1 dari 1</span>
                <span class="sheet-count-info">(12 Label BMN - Duplikat Siap Tempel)</span>
              </div>
            </div>
            <div class="label-grid">
              {grid_12_labels}
            </div>
          </div>
        </div>
        """
        item_html = get_page_head(f"{item['nama_barang']} (NUP {item['nup']})", room_title) + item_sheet + get_page_foot()
        with open(os.path.join(item_path, "template_print.html"), 'w', encoding='utf-8') as f:
            f.write(item_html)
        created_files_count += 1
        item_links.append((item['nama_barang'], item['nup'], item['kode_barang'], item_folder))

    room_summary.append({
        'folder': room_folder,
        'title': room_title,
        'count': len(items),
        'items': item_links
    })

    if current_room_idx % 20 == 0 or current_room_idx == total_rooms:
        elapsed = time.time() - t_start
        print(f"[{current_room_idx}/{total_rooms} Ruangan] Berhasil diproses ({created_files_count} file dibuat) - Waktu: {elapsed:.1f}s")

# 7. Buat Master Index (index.html) di root folder 'barcode label barang ruangan'
print("Membuat Master Index Navigasi (index.html)...")
index_cards_html = []
for r in sorted(room_summary, key=lambda x: x['title']):
    room_enc = html.escape(r['folder'])
    title_enc = html.escape(r['title'])
    count = r['count']
    sheets = (count + 11) // 12

    index_cards_html.append(f"""
    <div class="room-card" data-title="{title_enc.lower()}">
      <div class="room-header">
        <div>
          <div class="room-title">{title_enc}</div>
          <div class="room-meta">{count} Label BMN • {sheets} Lembar A4 (Format: 104 × 41 mm)</div>
        </div>
        <a href="{room_enc}/cetak_semua_ruangan.html" target="_blank" class="btn-room-print">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="6 9 6 2 18 2 18 9"></polyline>
            <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
            <rect x="6" y="14" width="12" height="8"></rect>
          </svg>
          Cetak Semua ({count})
        </a>
      </div>
    </div>
    """)

master_index_html = f"""<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Master Index Label Barcode Ruangan BPMP Jambi</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    body {{
      background-color: #0f172a;
      color: #f8fafc;
      font-family: 'Inter', sans-serif;
      margin: 0;
      padding: 0;
    }}
    .header-bar {{
      background: linear-gradient(135deg, #1e293b, #0f172a);
      border-bottom: 1px solid #334155;
      padding: 24px 32px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 16px;
      position: sticky;
      top: 0;
      z-index: 100;
    }}
    .header-title {{
      font-size: 20px;
      font-weight: 800;
      color: #ffffff;
      display: flex;
      align-items: center;
      gap: 12px;
    }}
    .search-input {{
      background-color: #1e293b;
      border: 1px solid #475569;
      color: #ffffff;
      padding: 10px 16px;
      border-radius: 8px;
      font-size: 14px;
      width: 320px;
      outline: none;
      transition: all 0.2s;
    }}
    .search-input:focus {{
      border-color: #3b82f6;
      box-shadow: 0 0 0 3px rgba(59,130,246,0.3);
    }}
    .container {{
      max-width: 1200px;
      margin: 32px auto;
      padding: 0 24px;
    }}
    .stats-bar {{
      display: flex;
      gap: 16px;
      margin-bottom: 24px;
      flex-wrap: wrap;
    }}
    .stat-badge {{
      background-color: #1e293b;
      border: 1px solid #334155;
      padding: 10px 18px;
      border-radius: 8px;
      font-size: 13px;
      color: #94a3b8;
    }}
    .stat-badge strong {{
      color: #38bdf8;
      font-family: 'JetBrains Mono', monospace;
    }}
    .room-grid {{
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(540px, 1fr));
      gap: 16px;
    }}
    .room-card {{
      background-color: #1e293b;
      border: 1px solid #334155;
      border-radius: 12px;
      padding: 16px 20px;
      transition: all 0.2s ease;
    }}
    .room-card:hover {{
      border-color: #3b82f6;
      transform: translateY(-2px);
      box-shadow: 0 8px 16px rgba(0,0,0,0.3);
    }}
    .room-header {{
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
    }}
    .room-title {{
      font-size: 15px;
      font-weight: 700;
      color: #f1f5f9;
      margin-bottom: 4px;
    }}
    .room-meta {{
      font-size: 12px;
      color: #94a3b8;
    }}
    .btn-room-print {{
      background: linear-gradient(135deg, #2563eb, #1d4ed8);
      color: #ffffff;
      text-decoration: none;
      padding: 8px 16px;
      border-radius: 8px;
      font-weight: 700;
      font-size: 12px;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      white-space: nowrap;
      transition: all 0.2s;
    }}
    .btn-room-print:hover {{
      background: linear-gradient(135deg, #1d4ed8, #1e40af);
    }}
  </style>
</head>
<body>
  <div class="header-bar">
    <div class="header-title">
      <img src="{logo_base64}" alt="Logo" style="height: 32px; width: 32px; object-fit: contain;">
      <span>Daftar Template Cetak Label Barcode Ruangan</span>
    </div>
    <input type="text" id="search-box" class="search-input" placeholder="Cari nama ruangan atau gedung..." oninput="filterRooms()">
  </div>
  <div class="container">
    <div class="stats-bar">
      <div class="stat-badge">Total Ruangan: <strong>{len(rooms_data)} Ruangan</strong></div>
      <div class="stat-badge">Total Label Barang: <strong>{total_records:,} Label</strong></div>
      <div class="stat-badge">Standar Format: <strong>2 Kolom × 6 Baris (104 × 41 mm)</strong></div>
      <div class="stat-badge">Tipografi: <strong>Inst 10.5pt | Satker 9pt | Barang 9pt</strong></div>
    </div>
    <div class="room-grid" id="room-grid">
      {''.join(index_cards_html)}
    </div>
  </div>
  <script>
    function filterRooms() {{
      const query = document.getElementById('search-box').value.toLowerCase().trim();
      const cards = document.querySelectorAll('.room-card');
      cards.forEach(card => {{
        const title = card.getAttribute('data-title') || '';
        if (!query || title.includes(query)) {{
          card.style.display = 'block';
        }} else {{
          card.style.display = 'none';
        }}
      }});
    }}
  </script>
</body>
</html>
"""

with open(os.path.join(OUTPUT_DIR, "index.html"), 'w', encoding='utf-8') as f:
    f.write(master_index_html)
created_files_count += 1

total_elapsed = time.time() - t_start
print("\n" + "="*60)
print(f"SELESAI DENGAN SUKSES!")
print(f"Total Folder Dibuat : {created_folders_count:,}")
print(f"Total File Dibuat   : {created_files_count:,}")
print(f"Total Waktu Proses  : {total_elapsed:.1f} detik")
print(f"Folder Output Utama : {OUTPUT_DIR}")
print("="*60)
