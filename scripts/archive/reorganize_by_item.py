import os, sys, base64, html, json, openpyxl, re, shutil, time

BASE_DIR = r"d:\magang\BPMP Prov.Jambi\coding\barcode"
OUTPUT_DIR = os.path.join(BASE_DIR, "barcode label barang ruangan")

print(">>> MEMULAI PENATAAN ULANG STRUKTUR FOLDER SESUAI NAMA BARANG...")
t_start = time.time()

# 1. Base64 logo
with open(os.path.join(BASE_DIR, 'images.png'), 'rb') as f:
    logo_base64 = "data:image/png;base64," + base64.b64encode(f.read()).decode('utf-8')

# 2. Building map
with open(os.path.join(BASE_DIR, 'clean_room_building_map.json'), 'r', encoding='utf-8') as f:
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

def extract_year(tahun_val, tgl_val, satker_val):
    t_str = str(tahun_val or '').strip()
    m = re.search(r'\b(19\d{2}|20\d{2})\b', t_str)
    if m:
        return m.group(1)
    d_str = str(tgl_val or '').strip()
    m2 = re.search(r'\b(19\d{2}|20\d{2})\b', d_str)
    if m2:
        return m2.group(1)
    s_str = str(satker_val or '').strip()
    m3 = re.search(r'\b(19\d{2}|20\d{2})\b', s_str)
    if m3:
        return m3.group(1)
    return ''

def render_label_html(item):
    satker = item.get('kode_satker') or '138041000693242000KD'
    tahun = item.get('tahun') or ''
    if tahun and tahun not in satker:
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

      --label-width: 104mm;
      --label-height: 41mm;
      --header-height: 13.9mm;
      --label-col-gap: 0.67mm;
      --label-row-gap: 6.21mm;
      --grid-cols: 2;

      --qr-size: 21mm;
      --logo-size: 9mm;

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
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.4);
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

    @page {{
      size: A4 portrait;
      margin: 0;
    }}

    @media print {{
      html, body {{
        background: #ffffff !important;
        margin: 0 !important;
        padding: 0 !important;
        width: 210mm !important;
        height: 297mm !important;
      }}
      .no-print {{
        display: none !important;
      }}
      .document-workspace {{
        padding: 0 !important;
        gap: 0 !important;
      }}
      .sheet-wrapper {{
        margin: 0 !important;
        page-break-after: always !important;
        break-after: page !important;
      }}
      .sheet-wrapper:last-child {{
        page-break-after: avoid !important;
        break-after: avoid !important;
      }}
      .a4-sheet {{
        box-shadow: none !important;
        border: none !important;
        margin: 0 !important;
        page-break-inside: avoid !important;
        break-inside: avoid !important;
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

# 3. Baca data dari data.xlsx
excel_path = os.path.join(BASE_DIR, 'data.xlsx')
print(f"Membaca {excel_path}...")
wb = openpyxl.load_workbook(excel_path, read_only=True)
ws = wb['Database']

rooms_data = {}
total_records = 0

for row in ws.iter_rows(min_row=2, values_only=True):
    if not row or len(row) < 6:
        continue
    total_records += 1

    kd_r = str(row[20] or '').strip() if len(row) > 20 else ''
    nm_r = str(row[21] or '').strip() if len(row) > 21 else ''
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

    room_folder_name = sanitize_filename(room_title, 65)

    satker = str(row[1] or '138041000693242000KD').strip()
    tahun = extract_year(row[25] if len(row) > 25 else '', row[9] if len(row) > 9 else '', satker)
    kode_barang = str(row[3] or '-').strip()
    nup = str(row[4] or '1').strip()
    nama_barang = str(row[5] or 'Barang BMN').strip()
    merk_tipe = str(row[8] or '-').strip() if len(row) > 8 and row[8] else '-'
    qr = str(row[27] or '').strip() if len(row) > 27 else ''

    item = {
        'kode_satker': satker,
        'tahun': tahun,
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
print(f"Total {total_records} data dimuat ke dalam {len(rooms_data)} ruangan.")

LABELS_PER_PAGE = 12
total_item_groups = 0
moved_subfolders = 0
created_subfolders = 0

for room_folder, r_info in rooms_data.items():
    room_title = r_info['room_title']
    items = r_info['items']
    room_path = os.path.join(OUTPUT_DIR, room_folder)
    os.makedirs(room_path, exist_ok=True)

    # Kelompokkan item berdasarkan Nama Barang
    items_by_name = {}
    for item in items:
        nm_grp = sanitize_filename(item['nama_barang'], 50)
        if nm_grp not in items_by_name:
            items_by_name[nm_grp] = []
        items_by_name[nm_grp].append(item)

    for nm_group, group_items in items_by_name.items():
        total_item_groups += 1
        group_folder = os.path.join(room_path, nm_group)
        os.makedirs(group_folder, exist_ok=True)

        # Urutkan berdasarkan NUP numerik
        def nup_key(x):
            try:
                return int(x['nup'])
            except:
                return str(x['nup'])
        group_items.sort(key=nup_key)

        # 1. Buat template_print.html untuk grup nama barang ini (semua NUP dalam 1 dokumen)
        total_sheets = (len(group_items) + LABELS_PER_PAGE - 1) // LABELS_PER_PAGE
        pages_html = []
        for sheet_idx in range(total_sheets):
            start = sheet_idx * LABELS_PER_PAGE
            sheet_items = group_items[start:start + LABELS_PER_PAGE]
            labels_html = "\n".join([render_label_html(it) for it in sheet_items])

            sheet_block = f"""
            <div class="sheet-wrapper">
              <div class="a4-sheet">
                <div class="sheet-paper-header">
                  <div class="sheet-paper-single-title">
                    <span class="sheet-room-tag">RUANGAN :</span>
                    <span class="sheet-room-name">{html.escape(room_title)}</span>
                    <span class="sheet-header-bullet">&bull;</span>
                    <span class="sheet-page-info">{html.escape(nm_group)} (Hal {sheet_idx + 1} dari {total_sheets})</span>
                    <span class="sheet-count-info">({len(sheet_items)} Label BMN)</span>
                  </div>
                </div>
                <div class="label-grid">
                  {labels_html}
                </div>
              </div>
            </div>
            """
            pages_html.append(sheet_block)

        group_html = get_page_head(f"{nm_group} - {room_title}", f"{len(group_items)} Label BMN") + "\n".join(pages_html) + get_page_foot()
        with open(os.path.join(group_folder, "template_print.html"), 'w', encoding='utf-8') as f:
            f.write(group_html)

        # 2. Pindahkan atau buat subfolder satuan barang (Nama Barang + NUP + Kode Barang)
        for item in group_items:
            nm_b = sanitize_filename(item['nama_barang'], 38)
            nup = sanitize_filename(item['nup'], 10)
            kd_b = sanitize_filename(item['kode_barang'], 15)
            item_folder_name = sanitize_filename(f"{nm_b} - NUP {nup} - {kd_b}", 65)

            old_item_path = os.path.join(room_path, item_folder_name)
            new_item_path = os.path.join(group_folder, item_folder_name)

            if os.path.exists(old_item_path) and not os.path.exists(new_item_path):
                shutil.move(old_item_path, new_item_path)
                moved_subfolders += 1
            elif not os.path.exists(new_item_path):
                os.makedirs(new_item_path, exist_ok=True)
                created_subfolders += 1
                # Buat template_print.html (12 duplikat)
                single_label = render_label_html(item)
                grid_12 = "\n".join([single_label for _ in range(12)])
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
                      {grid_12}
                    </div>
                  </div>
                </div>
                """
                item_html = get_page_head(f"{item['nama_barang']} (NUP {item['nup']})", room_title) + item_sheet + get_page_foot()
                with open(os.path.join(new_item_path, "template_print.html"), 'w', encoding='utf-8') as f:
                    f.write(item_html)

elapsed = time.time() - t_start
print(f"\n>>> PENATAAN ULANG SELESAI DALAM {elapsed:.1f} DETIK!")
print(f"Total Grup Nama Barang yang dibuat: {total_item_groups}")
print(f"Subfolder yang dipindahkan: {moved_subfolders}")
print(f"Subfolder baru yang dibuat: {created_subfolders}")
