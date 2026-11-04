import openpyxl, json, sys, re
from collections import defaultdict, Counter

src = sys.argv[1]
wbv = openpyxl.load_workbook(src, data_only=True)['TODO']
wbf = openpyxl.load_workbook(src)['TODO']

def cat_for(row):
    for lim, c in [(141, 'Para picar'), (222, 'Quiches'), (298, 'Empanadas'), (358, 'Ensaladas'),
                   (435, 'Sándwiches'), (503, 'Especialidades')]:
        if row < lim:
            return c
    return 'Postres'

def v(r, c): return wbv.cell(r, c).value
def f(r, c): return wbf.cell(r, c).value

def is_header(r):
    return any(isinstance(v(r, c), str) and v(r, c).strip().upper().startswith('CANT') for c in range(1, 6))

recipes = []
r = 1
maxr = wbv.max_row
while r <= maxr:
    a = v(r, 1)
    if isinstance(a, str) and a.strip():
        # look for header within next 3 rows
        hdr = None
        for k in range(1, 4):
            if is_header(r + k):
                hdr = r + k; break
        if hdr:
            rec = {'name': a.strip(), 'row': r, 'cat': cat_for(r), 'lines': [], 'total': None,
                   'yield': 1, 'yield_unit': 'ración', 'kind': 'Plato', 'pvp': None, 'coef': None, 'note': None}
            extra = [v(r, c) for c in range(2, 6) if v(r, c) is not None]
            if extra: rec['note'] = ' '.join(str(x) for x in extra)
            rr = hdr + 1
            totu = None
            while rr <= maxr:
                labels = [str(v(rr, c)).strip().upper() for c in range(1, 5) if isinstance(v(rr, c), str)]
                lab = next((l for l in labels if l.startswith(('TOTAL', 'XKG', 'PRECIO'))), None)
                if lab:
                    if lab.startswith('TOTAL U') or lab.startswith('TOTAL PORCION'):
                        totu = v(rr, 5)
                    elif lab.startswith('TOTAL'):
                        rec['total'] = v(rr, 5)
                        if isinstance(v(rr, 2), (int, float)) and v(rr, 2):
                            rec['kg'] = v(rr, 2)
                    elif lab == 'XKG':
                        rec['kind'] = 'Elaboración'; rec['yield'] = rec['kg']; rec['yield_unit'] = 'kg'
                        rr += 1; break
                    elif lab == 'PRECIO MIN':
                        fm = str(f(rr, 5))
                        m = re.search(r'\*([\d.]+)\*([\d.]+)', fm)
                        if m: rec['coef'] = float(m.group(1)); rec['fact'] = float(m.group(2))
                    elif lab == 'PRECIO FINAL':
                        rec['pvp'] = v(rr, 5)
                        rr += 1; break
                    rr += 1
                    # stop when block ends (blank rows after totals)
                    if all(v(rr, c) is None for c in range(1, 6)) and all(v(rr + 1, c) is None for c in range(1, 6)):
                        break
                    continue
                name = v(rr, 1)
                if is_header(rr + 1):
                    break
                if isinstance(name, str) and name.strip():
                    qty = v(rr, 2); unit = v(rr, 3); price = v(rr, 4)
                    if not isinstance(unit, str):
                        unit = None
                    if isinstance(qty, (int, float)) and isinstance(price, (int, float)):
                        rec['lines'].append({'ing': name.strip(), 'qty': qty, 'unit': unit, 'price': price,
                                             'pf': f(rr, 4) if isinstance(f(rr, 4), str) else None,
                                             'comment': v(rr, 6) if isinstance(v(rr, 6), str) else None})
                    elif isinstance(qty, (int, float)):
                        rec['lines'].append({'ing': name.strip(), 'qty': qty, 'unit': unit, 'price': 0, 'noprice': True})
                    else:
                        rec['lines'].append({'ing': name.strip(), 'qty': qty, 'unit': unit, 'price': price, 'bad': True})
                rr += 1
            if totu and rec['total']:
                rec['yield'] = round(rec['total'] / totu, 2)
                rec['yield_unit'] = 'ud' if rec['cat'] != 'Postres' else 'ración'
                if rec['pvp'] is None and rec['coef'] is None and rec['kind']=='Plato':
                    rec['kind'] = 'Elaboración'
            recipes.append(rec)
            r = rr
            continue
    r += 1

json.dump(recipes, open(sys.argv[2], 'w'), ensure_ascii=False, indent=1)
for rec in recipes:
    print(rec['row'], rec['cat'], rec['name'], rec['kind'], rec['yield'], rec['yield_unit'], rec['total'], rec['pvp'], rec.get('coef'), rec.get('fact'), len(rec['lines']))
    for l in rec['lines']:
        if l.get('bad'): print('   BAD', l)
