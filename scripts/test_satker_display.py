import openpyxl
import re

wb = openpyxl.load_workbook('data/data.xlsx', read_only=True)
ws = wb.active
rows = list(ws.iter_rows(values_only=True))

headers = rows[0]
total_missing_satker_year = 0
year_distribution = {}

for idx, r in enumerate(rows[1:], start=2):
    raw_satker = str(r[1] or '138041000693242000KD').strip()
    tgl = str(r[9] or '').strip()
    th = str(r[25] or '').strip()

    # Suffix strip
    suffix_match = re.search(r'\.(19\d{2}|20\d{2})$', raw_satker)
    embedded_year = ""
    if suffix_match:
        embedded_year = suffix_match.group(1)
        raw_satker = raw_satker[:suffix_match.start()].strip()

    resolved_year = ""
    my = re.search(r'\b(19\d{2}|20\d{2})\b', th)
    if my:
        resolved_year = my.group(1)
    elif tgl:
        mt = re.search(r'\b(19\d{2}|20\d{2})\b', tgl)
        if mt:
            resolved_year = mt.group(1)
    elif embedded_year:
        resolved_year = embedded_year

    if resolved_year:
        satker_display = f"{raw_satker}.{resolved_year}"
        year_distribution[resolved_year] = year_distribution.get(resolved_year, 0) + 1
    else:
        satker_display = raw_satker
        total_missing_satker_year += 1

wb.close()

print(f"Total rows evaluated: {len(rows)-1}")
print(f"Total missing satker year: {total_missing_satker_year}")
print("Year distribution sorted:")
for y in sorted(year_distribution.keys()):
    print(f"  {y}: {year_distribution[y]}")
