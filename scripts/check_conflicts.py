import openpyxl

wb = openpyxl.load_workbook('data/data.xlsx', read_only=True, data_only=True)
ws = wb['Database']

room_buildings = {}
for idx, r in enumerate(ws.iter_rows(min_row=2, values_only=True), start=2):
    kd = str(r[20] or '').strip()
    nm = str(r[21] or '').strip()
    b = str(r[28] or '').strip() if len(r) > 28 else ''
    k = (kd, nm)
    if k not in room_buildings:
        room_buildings[k] = set()
    room_buildings[k].add(b)

wb.close()

conflicts = {k: v for k, v in room_buildings.items() if len(v) > 1}
print(f"Total rooms with conflicting Column 28 values: {len(conflicts)}")
for k, v in list(conflicts.items())[:20]:
    print(f"  Room [{k[0]}] '{k[1]}' has multiple values: {v}")
