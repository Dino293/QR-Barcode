import os
import shutil
import openpyxl
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.utils import get_column_letter
import copy

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(BASE_DIR, 'data')
BACKUP_DIR = os.path.join(DATA_DIR, 'backup')
EXCEL_PATH = os.path.join(DATA_DIR, 'data.xlsx')

def main():
    print("================================================================================")
    print("PROSES PEMINDAHAN KOLOM KODE RUANGAN & NAMA RUANGAN KE KOLOM B & C")
    print("================================================================================")
    
    os.makedirs(BACKUP_DIR, exist_ok=True)
    backup_file = os.path.join(BACKUP_DIR, 'data_backup_before_column_reorder.xlsx')
    print(f"1. Membuat backup dataset ke: {backup_file}")
    shutil.copy2(EXCEL_PATH, backup_file)
    print("   Backup berhasil dibuat.")

    print(f"\n2. Membuka file {EXCEL_PATH}...")
    wb = openpyxl.load_workbook(EXCEL_PATH)
    
    if 'Database' not in wb.sheetnames:
        raise ValueError("Sheet 'Database' tidak ditemukan dalam berkas Excel!")
        
    ws = wb['Database']
    
    # Baca header lama
    old_headers = [c.value for c in next(ws.iter_rows(max_row=1))]
    print(f"   Total kolom awal: {len(old_headers)}")
    print(f"   Kolom B lama: {old_headers[1]}")
    print(f"   Kolom C lama: {old_headers[2]}")
    print(f"   Kolom U lama: {old_headers[20]}")
    print(f"   Kolom V lama: {old_headers[21]}")
    
    # Mapping 0-indexed:
    # 0: No
    # 20: Kode Ruangan (U) -> B (index 1)
    # 21: Nama Ruangan (V) -> C (index 2)
    # 1..19: Shifted by +2 -> D..V (index 3..21)
    # 22..28: Unchanged -> W..AC (index 22..28)
    new_to_old_order = [
        0,   # No
        20,  # Kode Ruangan -> Col B
        21,  # Nama Ruangan -> Col C
        1,   # Kode Satker -> Col D
        2,   # Uraian Satker -> Col E
        3,   # Kode Barang -> Col F
        4,   # NUP -> Col G
        5,   # Nama Barang -> Col H
        6,   # Keterangan -> Col I
        7,   # Jenis BMN -> Col J
        8,   # Merk/Tipe -> Col K
        9,   # Tgl Perolehan -> Col L
        10,  # Kuantitas -> Col M
        11,  # Kondisi -> Col N
        12,  # Harga Barang -> Col O
        13,  # Status Penggunaan -> Col P
        14,  # Tercatat -> Col Q
        15,  # Kuantitas Inv -> Col R
        16,  # Kondisi Inv -> Col S
        17,  # Harga Barang Inv -> Col T
        18,  # Status Penggunaan Inv -> Col U
        19,  # Tercata Invt -> Col V
        22,  # Jenis Bangunan -> Col W
        23,  # Status KOdefikasi -> Col X
        24,  # Status Inventarisasi -> Col Y
        25,  # Tahun -> Col Z
        26,  # Keterangan -> Col AA
        27,  # QR -> Col AB
        28   # Nama Bangunan -> Col AC
    ]
    
    print("\n3. Menyusun dan menyalin data baris...")
    # Ambil lebar kolom lama
    old_widths = {}
    for col_idx in range(1, len(old_headers) + 1):
        col_letter = get_column_letter(col_idx)
        old_widths[col_idx] = ws.column_dimensions[col_letter].width or 15.0
        
    # Buat sheet baru
    target_sheet_idx = wb.sheetnames.index('Database')
    new_ws = wb.create_sheet(title='Database_Temp', index=target_sheet_idx)
    
    # 1. Header styling & values
    for new_col_idx, old_idx in enumerate(new_to_old_order, start=1):
        old_col_idx = old_idx + 1
        src_cell = ws.cell(row=1, column=old_col_idx)
        dst_cell = new_ws.cell(row=1, column=new_col_idx, value=src_cell.value)
        
        # Copy styles
        if src_cell.font:
            dst_cell.font = copy.copy(src_cell.font)
        if src_cell.fill:
            dst_cell.fill = copy.copy(src_cell.fill)
        if src_cell.border:
            dst_cell.border = copy.copy(src_cell.border)
        if src_cell.alignment:
            dst_cell.alignment = copy.copy(src_cell.alignment)
            
        # Copy width ke posisi kolom baru
        new_col_letter = get_column_letter(new_col_idx)
        new_ws.column_dimensions[new_col_letter].width = old_widths.get(old_col_idx, 15.0)

    # 2. Salin baris data (hanya baris yang memiliki nilai / non-empty)
    row_count = 0
    for r_idx in range(2, ws.max_row + 1):
        # Cek apakah baris tidak kosong
        row_vals = [ws.cell(row=r_idx, column=c).value for c in range(1, len(old_headers) + 1)]
        if not any(row_vals):
            continue
            
        row_count += 1
        dst_row_idx = row_count + 1
        
        for new_col_idx, old_idx in enumerate(new_to_old_order, start=1):
            old_col_idx = old_idx + 1
            src_cell = ws.cell(row=r_idx, column=old_col_idx)
            val = src_cell.value
            
            dst_cell = new_ws.cell(row=dst_row_idx, column=new_col_idx, value=val)
            if src_cell.number_format and src_cell.number_format != 'General':
                dst_cell.number_format = src_cell.number_format

    # Set freeze panes
    new_ws.freeze_panes = 'A2'
    
    print(f"   Total baris data berhasil disalin: {row_count:,} baris (+ 1 baris header)")

    # Ganti sheet lama dengan sheet baru
    del wb['Database']
    new_ws.title = 'Database'
    
    print("\n4. Menyimpan file Excel...")
    wb.save(EXCEL_PATH)
    wb.close()
    print("   Perubahan berhasil disimpan ke data/data.xlsx!")
    
    # Verifikasi langsung
    print("\n5. Memverifikasi struktur kolom baru...")
    v_wb = openpyxl.load_workbook(EXCEL_PATH, read_only=True)
    v_ws = v_wb['Database']
    v_headers = [c.value for c in next(v_ws.iter_rows(max_row=1))]
    print(f"   Jumlah kolom baru: {len(v_headers)}")
    for i, h in enumerate(v_headers, start=1):
        col_letter = get_column_letter(i)
        print(f"   Col {col_letter:2} ({i:2}): {h}")
        
    sample_row = next(v_ws.iter_rows(min_row=2, max_row=2, values_only=True))
    print(f"\n   Sampel Baris Data Pertama:")
    print(f"   No              (A): {sample_row[0]}")
    print(f"   Kode Ruangan    (B): {sample_row[1]}")
    print(f"   Nama Ruangan    (C): {sample_row[2]}")
    print(f"   Kode Satker     (D): {sample_row[3]}")
    print(f"   Uraian Satker   (E): {sample_row[4]}")
    print(f"   Kode Barang     (F): {sample_row[5]}")
    print(f"   NUP             (G): {sample_row[6]}")
    print(f"   Nama Barang     (H): {sample_row[7]}")
    print(f"   Merk/Tipe       (K): {sample_row[10]}")
    print(f"   Tahun           (Z): {sample_row[25]}")
    print(f"   QR              (AB): {sample_row[27]}")
    print(f"   Nama Bangunan   (AC): {sample_row[28]}")
    v_wb.close()
    print("\nSELESAI PEMINDAHAN KOLOM DENGAN SEMPURNA!")

if __name__ == '__main__':
    main()
