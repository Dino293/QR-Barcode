import openpyxl
import re

wb = openpyxl.load_workbook('data/data.xlsx', read_only=True)
ws = wb.active
rows = list(ws.iter_rows(values_only=True))

headers = rows[0]
print("Total rows:", len(rows) - 1)

missing_year = 0
year_2000_count = 0
sample_2000 = []

for idx, r in enumerate(rows[1:], start=2):
    satker = str(r[1] or '').strip()
    tgl = str(r[9] or '').strip()
    th = str(r[25] or '').strip()
    kode_barang = str(r[2] or '').strip()
    nama_barang = str(r[4] or '').strip()
    nup = str(r[3] or '').strip()

    # extract year
    year = ""
    m1 = re.search(r'\b(19\d{2}|20\d{2})\b', th)
    if m1:
        year = m1.group(1)
    elif tgl:
        m2 = re.search(r'\b(19\d{2}|20\d{2})\b', tgl)
        if m2:
            year = m2.group(1)

    if not year:
        missing_year += 1
        print(f"Row {idx} missing year! Barang: {nama_barang}, Tgl: {tgl}, Th: {th}")
    elif year == "2000":
        year_2000_count += 1
        if len(sample_2000) < 5:
            sample_2000.append((idx, satker, kode_barang, nup, nama_barang, year))

wb.close()
print(f"Total Missing Year in Excel: {missing_year}")
print(f"Total Year 2000 in Excel: {year_2000_count}")
print("Sample 2000 items:")
for s in sample_2000:
    print(s)
