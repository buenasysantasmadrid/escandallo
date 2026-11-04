import json, sys
from collections import Counter, defaultdict, OrderedDict

R = json.load(open(sys.argv[1]))
OUT = sys.argv[2]

# ---------- nombres de platos / elaboraciones ----------
def nice(s):
    s = s.strip()
    return s[:1].upper() + s[1:].lower()

PLATO_RENAME = {'HAMBURGUESA': 'Hamburguesa casera (elab.)', 'BERENJENAS': 'Berenjenas (elab.)',
                'CROQUETAS DE CORDERO': 'Croquetas de cordero (elab.)', 'Taboulé': 'Taboulé (elab.)',
                'Hummus': 'Hummus (elab.)', 'Tapenade': 'Tapenade (elab.)', 'CHESECAKE': 'Cheesecake',
                'SOUFLE': 'Soufflé', 'TIRAMISU': 'Tiramisú', 'PATATITA AL GRATEN': 'Patatita al gratén',
                'QUICHE ATUN': 'Quiche atún', 'QUICHE MTA': 'Quiche MTA', 'QUICHE CHAMPI': 'Quiche champiñón',
                'CROQUETAS JAMON': 'Croquetas jamón', 'TABLITA PATAGONICA': 'Tablita patagónica',
                'PANQUEQUE': 'Panqueque', 'RAVIOL C/ 4 QUESOS': 'Raviol c/ 4 quesos', 'RAVIOL C/ TRUFA': 'Raviol c/ trufa'}
def pname(r): return PLATO_RENAME.get(r['name'], nice(r['name']))

# ---------- normalización de ingredientes ----------
ALIAS = {'mantquilla': 'mantequilla', 'muzzarella rallado': 'muzzarella rallada',
         'emental rallada': 'queso emental rallado', 'queso parmesano': 'queso parmesano rallado',
         'cebolla colorada': 'cebolla morada', 'puerros': 'puerro', 'pimientos rojos': 'pimiento rojo',
         'pollo picada': 'pollo picado', 'escamas de queso': 'lascas de queso', 'palomitas': 'palomitas de pollo',
         'tapa de empanada': 'tapa empanadas', 'berenjenas': 'berenjena', 'patatas': 'patata (gratén)',
         'croquetas jamon': 'croquetas jamón (compradas)', 'croquetas setas': 'croquetas setas (compradas)',
         'champi': 'champiñón', 'varios': 'varios (sal, aceite, especias…)', 'chesecake': 'cheesecake',
         'wrapp espinaca 25cm': 'wrap espinaca 25 cm', 'baicon': 'bacon', 'boconcino': 'bocconcino'}
LINE_OVERRIDE = {('CROQUETAS JAMON', 'croquetas'): 'croquetas jamón (compradas)',
                 ('CROQUETAS SETAS', 'croquetas'): 'croquetas setas (compradas)',
                 ('TABLITA PATAGONICA', 'croquetas'): '@Croquetas de cordero (elab.)',
                 ('TABLITA PATAGONICA', 'berenjena'): '@Berenjenas (elab.)',
                 ('TABLITA PATAGONICA', 'hummus'): '@Hummus (elab.)',
                 ('TABLITA MEDITERRÁNEA', 'hummus'): '@Hummus (elab.)',
                 ('TABLITA MEDITERRÁNEA', 'taboulé'): '@Taboulé (elab.)',
                 ('TABLITA MEDITERRÁNEA', 'tapenade'): '@Tapenade (elab.)',
                 ('HAMBURGUESA DELUXE', 'hamburguesa'): '@Hamburguesa casera (elab.)',
                 ('MILANESA', 'muzzarella'): 'muzzarella rallada'}
UNIT = {'kg': 'kg', 'l': 'l', 'litro': 'l', 'unidad': 'ud', 'unidades': 'ud', 'u': 'ud', 'frascos': 'frasco',
        'manojos': 'manojo', 'manojo': 'manojo', 'carton': 'cartón 30', 'pq': 'paquete', 'paquete': 'paquete',
        'lata': 'lata', 'bandeja': 'bandeja'}
UNIT_DEFAULT = {'miniaturas surtidas (4 unid.)': 'ud', 'pan pita': 'ud', 'pan payes': 'ud',
                'patata y albahaca': 'ud', 'varios (sal, aceite, especias…)': '€', 'rucula': 'kg',
                'aceite de oliva refinado': 'l'}

ing = OrderedDict()   # key -> dict(unit Counter, prices list, formulas)
lines = []            # (plato, ingrediente display, qty, note)
elab_names = {pname(r) for r in R if r['kind'] == 'Elaboración'}

def disp(k): return k[:1].upper() + k[1:]

for r in R:
    P = pname(r)
    for l in r['lines']:
        key = l['ing'].strip().lower()
        tgt = LINE_OVERRIDE.get((r['name'], key)) or ALIAS.get(key, key)
        qty = l['qty']; note = l.get('comment') or ''
        if tgt.startswith('@'):
            lines.append((P, tgt[1:], qty, note)); continue
        if tgt.startswith('varios'):
            # 'varios' = importe fijo en €: cantidad = € y precio 1
            qty = round(l['qty'] * l['price'], 4)
            d = ing.setdefault(tgt, {'units': Counter(), 'prices': [], 'calc': [], 'fixed': True})
            lines.append((P, disp(tgt), qty, note)); continue
        d = ing.setdefault(tgt, {'units': Counter(), 'prices': [], 'calc': [], 'fixed': False})
        u = UNIT.get((l['unit'] or '').strip().lower())
        if (l['unit'] or '').strip() and not u:
            u = l['unit'].strip().lower()
        if tgt == 'rucula' and u == 'ud': u = 'kg'
        if u: d['units'][u] += 1
        if l['price']:
            d['prices'].append(round(l['price'], 4))
        if l.get('pf') and l['pf'] not in d['calc']:
            d['calc'].append(l['pf'])
        if l.get('noprice'):
            note = (note + ' ' if note else '') + 'Sin precio en el Excel 2021'
        lines.append((P, disp(tgt), qty, note))

ING_ROWS = []
for k, d in ing.items():
    unit = d['units'].most_common(1)[0][0] if d['units'] else UNIT_DEFAULT.get(k, 'kg')
    if k in UNIT_DEFAULT: unit = UNIT_DEFAULT[k]
    pc = Counter(d['prices'])
    price = pc.most_common(1)[0][0] if pc else 0
    if d['fixed']: price = 1
    notes = []
    if d['fixed']: notes.append('Importe fijo: la cantidad de la receta ya es en €')
    others = sorted(set(p for p in pc if abs(p - price) > 0.005))
    if others and not d['fixed']:
        notes.append('Otros precios en Excel 2021: ' + ', '.join(f'{p:.2f}' for p in others))
    if d['calc']:
        notes.append('Cálculo original: ' + '; '.join(c.lstrip('=') for c in d['calc'][:3]))
    if not d['units'] and not d['fixed'] and k not in UNIT_DEFAULT:
        notes.append('Unidad supuesta, revisar')
    if price == 0 and not d['fixed']:
        notes.append('Sin precio: completar')
    ING_ROWS.append((disp(k), 'Fijo' if d['fixed'] else 'Compra', unit, price, ' | '.join(notes)))
ING_ROWS.sort(key=lambda x: x[0].lower())
ELAB_ROWS = []
for r in R:
    if r['kind'] == 'Elaboración':
        ELAB_ROWS.append((pname(r), 'Elaboración', r['yield_unit'] if r['yield_unit'] == 'kg' else 'ud', None,
                          'Precio = coste por unidad de su receta (hoja PLATOS)'))


# ======================= ESPECIFICACIÓN PARA Apps Script =======================
EUR = '#,##0.00 €'; EUR4 = '#,##0.0000 €'; PCT = '0.0%'
COEF, IVA, MES, ALERTA = 'CONFIG!$B$2', 'CONFIG!$B$3', 'CONFIG!$B$5', 'CONFIG!$B$6'
spec = {'hojas': []}

def hoja(nombre, cab, anchos, datos, formulas, formatos, entradas, ultima, valid=None, cf=None, notas=None):
    spec['hojas'].append(dict(nombre=nombre, cabecera=cab, anchos=anchos, datos=datos, formulas=formulas,
                              formatos=formatos, entradas=entradas, ultima=ultima, validaciones=valid or [],
                              condicionales=cf or [], notas=notas or {}))

# PLATOS
datos = []
for r in R:
    datos.append([pname(r), r['cat'], r['kind'], r['yield'], r['yield_unit'], None, None, None, None,
                  r['pvp'] if r['kind'] == 'Plato' else None, None, None, None,
                  round(r['total'] / r['yield'], 4) if r['total'] else None])
G = 'A{r}=""'
hoja('PLATOS',
     ['Plato / elaboración', 'Categoría', 'Tipo', 'Rendimiento\n(raciones, ud o kg que salen)', 'Unidad\nrendimiento',
      'Coste receta €', 'Coste por ración €', 'Coeficiente\n(vacío = CONFIG)', 'PVP mínimo €\n(IVA incl.)',
      'PVP carta €\n(IVA incl.)', 'Food cost %', 'Margen bruto €\npor ración (sin IVA)', 'Aviso', 'Coste ración\nExcel 2021 €'],
     [230, 110, 95, 120, 85, 95, 100, 100, 100, 100, 85, 115, 190, 105], datos,
     {6: '=IF(A{r}="","",SUMIFS(RECETAS!$F:$F,RECETAS!$A:$A,A{r}))',
      7: '=IF(A{r}="","",IFERROR(F{r}/D{r},0))',
      9: f'=IF(OR(A{{r}}="",C{{r}}="Elaboración"),"",G{{r}}*IF(H{{r}}="",{COEF},H{{r}})*(1+{IVA}))',
      11: f'=IF(OR(A{{r}}="",C{{r}}="Elaboración",J{{r}}=""),"",G{{r}}/(J{{r}}/(1+{IVA})))',
      12: f'=IF(OR(A{{r}}="",C{{r}}="Elaboración",J{{r}}=""),"",J{{r}}/(1+{IVA})-G{{r}})',
      13: f'=IF(OR(A{{r}}="",C{{r}}="Elaboración"),"",IF(J{{r}}="","Falta PVP de carta",IF(J{{r}}<I{{r}},"PVP por debajo del mínimo",IF(K{{r}}>{ALERTA},"Food cost alto","OK"))))'},
     {4: '0.##', 6: EUR, 7: EUR4, 8: '0.00', 9: EUR, 10: EUR, 11: PCT, 12: EUR, 14: EUR},
     [1, 2, 3, 4, 5, 8, 10], 300,
     [{'col': 3, 'lista': ['Plato', 'Elaboración']},
      {'col': 2, 'lista': ['Para picar', 'Quiches', 'Empanadas', 'Ensaladas', 'Sándwiches', 'Especialidades', 'Postres', 'Bebidas', 'Otros']}],
     [{'col': 13, 'formula': '=$M2="PVP por debajo del mínimo"', 'fondo': '#F8D7DA'},
      {'col': 13, 'formula': '=$M2="Food cost alto"', 'fondo': '#FFE8B3'},
      {'col': 13, 'formula': '=$M2="OK"', 'fondo': '#D4EDDA'},
      {'col': 11, 'formula': f'=AND(ISNUMBER($K2),$K2>{ALERTA})', 'fondo': '#F8D7DA'}])

# RECETAS
hoja('RECETAS', ['Plato / elaboración', 'Ingrediente', 'Cantidad', 'Unidad', '€ por unidad\n(precio usado)', 'Coste €', 'Nota'],
     [230, 240, 80, 75, 105, 85, 280],
     [[P, I, q, None, None, None, n or None] for (P, I, q, n) in lines],
     {4: '=IF(B{r}="","",IFERROR(INDEX(INGREDIENTES!$C:$C,MATCH(B{r},INGREDIENTES!$A:$A,0)),"¿?"))',
      5: '=IF(B{r}="","",IFERROR(INDEX(INGREDIENTES!$H:$H,MATCH(B{r},INGREDIENTES!$A:$A,0)),0))',
      6: '=IF(B{r}="","",C{r}*E{r})'},
     {3: '0.###', 5: EUR4, 6: EUR}, [1, 2, 3, 7], 2000,
     [{'col': 1, 'rango': 'PLATOS!$A$2:$A'}, {'col': 2, 'rango': 'INGREDIENTES!$A$2:$A'}],
     [{'col': 4, 'formula': '=$D2="¿?"', 'fondo': '#F8D7DA'}])

# INGREDIENTES
rows = ING_ROWS + ELAB_ROWS
hoja('INGREDIENTES', ['Ingrediente', 'Tipo', 'Unidad\nescandallo', 'Precio ref.\n2021 €/ud', 'Precio medio\nMES €/ud',
                      'Líneas factura\nen el mes', 'Precio medio\nhistórico €/ud', 'PRECIO USADO\n€/ud', 'Origen del precio',
                      'Variación\nvs 2021', 'Notas'],
     [240, 95, 80, 90, 95, 90, 100, 100, 150, 80, 480],
     [[n, t, u, p, None, None, None, None, None, None, note or None] for (n, t, u, p, note) in rows],
     {5: f'=IF(OR(A{{r}}="",B{{r}}<>"Compra"),"",IFERROR(SUMIFS(FACTURAS!$G:$G,FACTURAS!$H:$H,A{{r}},FACTURAS!$K:$K,{MES})/SUMIFS(FACTURAS!$I:$I,FACTURAS!$H:$H,A{{r}},FACTURAS!$K:$K,{MES}),""))',
      6: f'=IF(A{{r}}="","",COUNTIFS(FACTURAS!$H:$H,A{{r}},FACTURAS!$K:$K,{MES}))',
      7: '=IF(OR(A{r}="",B{r}<>"Compra"),"",IFERROR(SUMIFS(FACTURAS!$G:$G,FACTURAS!$H:$H,A{r})/SUMIFS(FACTURAS!$I:$I,FACTURAS!$H:$H,A{r}),""))',
      8: '=IF(A{r}="","",IF(B{r}="Elaboración",IFERROR(INDEX(PLATOS!$G:$G,MATCH(A{r},PLATOS!$A:$A,0)),0),IF(B{r}="Fijo",D{r},IF(E{r}<>"",E{r},IF(G{r}<>"",G{r},D{r})))))',
      9: '=IF(A{r}="","",IF(B{r}="Elaboración","Receta propia",IF(B{r}="Fijo","Importe fijo",IF(E{r}<>"","Facturas del mes",IF(G{r}<>"","Facturas (histórico)","Ref. 2021")))))',
      10: '=IF(OR(A{r}="",B{r}<>"Compra",N(D{r})=0),"",H{r}/D{r}-1)'},
     {4: EUR4, 5: EUR4, 6: '0', 7: EUR4, 8: EUR4, 10: PCT}, [1, 2, 3, 4, 11], 600,
     [{'col': 2, 'lista': ['Compra', 'Elaboración', 'Fijo']}],
     [{'col': 9, 'formula': '=$I2="Facturas del mes"', 'fondo': '#D4EDDA'},
      {'col': 9, 'formula': '=$I2="Ref. 2021"', 'fondo': '#FFE8B3'},
      {'col': 10, 'formula': '=AND(ISNUMBER($J2),$J2>0.1)', 'texto': '#C00000'}])

# FACTURAS
hoja('FACTURAS', ['Fecha', 'Proveedor', 'Nº factura', 'Producto\n(como viene en la factura)', 'Cantidad\nfacturada',
                  'Unidad\nfactura', 'Importe línea €\n(sin IVA)', 'Ingrediente\n(según EQUIVALENCIAS)',
                  'Cantidad en\nunidad escandallo', '€ por unidad\nescandallo', 'Mes'],
     [90, 150, 95, 250, 80, 75, 105, 220, 105, 105, 70], [],
     {8: '=IF(D{r}="","",IFERROR(INDEX(EQUIVALENCIAS!$C:$C,MATCH(D{r},EQUIVALENCIAS!$A:$A,0)),"SIN ASIGNAR"))',
      9: '=IF(D{r}="","",E{r}*IFERROR(INDEX(EQUIVALENCIAS!$D:$D,MATCH(D{r},EQUIVALENCIAS!$A:$A,0)),1))',
      10: '=IF(OR(D{r}="",N(I{r})=0),"",G{r}/I{r})',
      11: '=IF(A{r}="","",YEAR(A{r})*100+MONTH(A{r}))'},
     {1: 'dd/mm/yyyy', 7: EUR, 9: '0.###', 10: EUR4, 11: '0'}, [1, 2, 3, 4, 5, 6, 7], 3000, [],
     [{'col': 8, 'formula': '=$H2="SIN ASIGNAR"', 'fondo': '#F8D7DA'}],
     {'D1': 'Se cruza con la columna A de EQUIVALENCIAS por texto exacto.'})

# EQUIVALENCIAS
hoja('EQUIVALENCIAS', ['Producto en factura\n(texto exacto)', 'Proveedor', 'Ingrediente del escandallo',
                       'Unidades de escandallo\npor unidad facturada', 'Nota'], [280, 150, 240, 140, 420],
     [['EJEMPLO - Tapas empanada caja 30x12', '(ejemplo)', 'Tapa empanadas', 360,
       'EJEMPLO: si la factura trae 1 caja de 30 paquetes de 12 tapas, 1 unidad facturada = 360 ud. Si la factura ya viene en kg/l/ud, poner 1. Borrar esta fila.']],
     {}, {4: '0.###'}, [1, 2, 3, 4, 5], 800, [{'col': 3, 'rango': 'INGREDIENTES!$A$2:$A'}], [])

# CONFIG
hoja('CONFIG', ['Parámetro', 'Valor', 'Nota'], [260, 110, 480],
     [['Coeficiente por defecto', 3.5, 'Multiplicador sobre el coste (Excel 2021: 3,5). Se puede cambiar por plato en PLATOS.'],
      ['IVA restauración', 0.10, 'IVA incluido en el PVP de carta'],
      ['Mes de cálculo (cualquier día del mes)', '=DATE(YEAR(TODAY()),MONTH(TODAY()),1)', 'Por defecto el mes en curso. Escribe una fecha (ej. 01/10/2026) para fijar otro mes. Menú Escandallo → Volver al mes en curso.'],
      ['Clave del mes (no tocar)', '=YEAR(B4)*100+MONTH(B4)', 'Se usa para filtrar las facturas del mes'],
      ['Food cost máximo (alerta)', 0.35, 'Por encima de este % el plato se marca en rojo']],
     {}, {}, [], 6, [], [])
spec['config_formatos'] = {'B2': '0.00', 'B3': PCT, 'B4': 'mm/yyyy', 'B5': '0', 'B6': PCT}
spec['config_entradas'] = ['B2', 'B3', 'B4', 'B6']

spec['leeme'] = [
 ['ESCANDALLO · BUENAS Y SANTAS', 'titulo'],
 ['Importado del Excel ESCANDALLO_CARTA_2021 (hoja TODO).', 'gris'],
 ['', ''],
 ['CÓMO FUNCIONA', 'negrita'],
 ['1. FACTURAS: cada línea de factura (fecha, proveedor, producto, cantidad, importe sin IVA). Aquí llegarán las facturas del cierre de caja.', ''],
 ['2. EQUIVALENCIAS: a qué ingrediente corresponde cada producto tal como viene en la factura, y cuántas unidades de escandallo trae (ej. caja de 30 paquetes de 12 tapas = 360 ud).', ''],
 ['3. INGREDIENTES: precio MEDIO DEL MES = total gastado en el mes / cantidad comprada en el mes. Si ese mes no hubo compras usa la media de todas las facturas y, si no hay ninguna, el precio de referencia 2021. La columna "Origen" dice de dónde sale.', ''],
 ['4. RECETAS: una línea por ingrediente de cada plato (plato, ingrediente, cantidad). Unidad, precio y coste se rellenan solos.', ''],
 ['5. PLATOS: la carta. Coste por ración, PVP mínimo, food cost % y margen, con aviso si el PVP queda por debajo del mínimo.', ''],
 ['6. CONFIG: coeficiente por defecto, IVA y mes de cálculo.', ''],
 ['', ''],
 ['QUÉ CELDAS SE EDITAN', 'negrita'],
 ['Solo las de fondo amarillo claro. El resto son fórmulas.', ''],
 ['Plato nuevo: añádelo en PLATOS (nombre, categoría, tipo, rendimiento, PVP) y escribe sus líneas en RECETAS.', ''],
 ['Ingrediente nuevo: añádelo en INGREDIENTES (nombre, tipo Compra, unidad) y vincúlalo en EQUIVALENCIAS con el nombre que trae la factura.', ''],
 ['Elaboraciones (hummus, taboulé, hamburguesa casera…): recetas que se usan como ingrediente; su precio sale de su propia receta.', ''],
 ['', ''],
 ['CRITERIOS TOMADOS DEL EXCEL 2021', 'negrita'],
 ['• PVP mínimo = coste por ración × coeficiente (3,5) × (1 + IVA). En el Excel el último factor era 1,07 o 1,08; aquí se usa el IVA de CONFIG (10 %).', ''],
 ['• "Varios" (sal, aceite, especias…) es un importe fijo en € por receta.', ''],
 ['• Nombres unificados (mantquilla → mantequilla, puerros → puerro…). En INGREDIENTES, Notas guarda el cálculo original y otros precios vistos.', ''],
 ['• Columna "Coste ración Excel 2021" en PLATOS: lo que daba el Excel, para comparar.', ''],
]
open(OUT, 'w').write('// Datos iniciales del escandallo (generado por herramientas/generar_datos.py desde ESCANDALLO_CARTA_2021.xlsx).\n'
                     '// Solo lo usa instalarEscandallo() en Instalar.gs. No va al repositorio (tiene costes).\n'
                     'var DATOS_INICIALES_ = ' + json.dumps(spec, ensure_ascii=False) + ';\n')
print('ok', len(R), len(lines), len(rows))
