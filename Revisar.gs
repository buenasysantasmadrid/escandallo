// ============================================================================
// PRECIOS RAROS Y DUDAS (28/11/2026, Luciana: "hay productos que me dices que
// subieron de precio y en una factura hay 1 caja y en la siguiente 2 cajas,
// chequea eso siempre").
// ============================================================================
// · FACTURAS columna L "Revisar": "REVISAR" si el € por unidad de escandallo
//   de esa línea se aleja más de un 40 % de lo normal para ese ingrediente (la
//   mediana de todas sus líneas, con 3 o más). Esas líneas NO cuentan en el
//   precio del ingrediente (INGREDIENTES E, F y G llevan FACTURAS!L<>"REVISAR").
//   Columna M: por qué. Se recalcula al traer facturas y al asignar.
// · Pestaña DUDAS: preguntas a Luciana sobre cómo viene cada producto, con
//   una columna para su respuesta (las escribe Claude con la acción "dudas").
// ============================================================================

const COL_REVISAR_ = 12; // L
const MARGEN_RARO_ = 1.4;

function marcarRaros_() {
  SpreadsheetApp.flush();
  const sh = hoja_(HOJA.FACTURAS);
  const n = sh.getMaxRows() - 1;
  if (sh.getRange(1, COL_REVISAR_).getValue() === '') {
    sh.getRange(1, COL_REVISAR_, 1, 2).setValues([['Revisar\n(no cuenta en el precio)', 'Por qué']]).setFontWeight('bold');
  }
  const v = sh.getRange(2, 1, n, 11).getValues();
  const porIng = {};
  v.forEach((r, i) => {
    const ing = String(r[7] || ''), eur = Number(r[9]);
    if (!r[3] || !ing || ing === 'SIN ASIGNAR' || !(eur > 0)) return;
    (porIng[ing] = porIng[ing] || []).push(i);
  });
  const marca = v.map(() => ['', '']);
  let raros = 0;
  Object.keys(porIng).forEach(ing => {
    const filas = porIng[ing];
    const limpias0 = filas.filter(i => String(v[i][5]).indexOf('→') < 0);
    // Con menos de 3 líneas solo se miran las "→" (formato de Pedidos), contra las normales.
    if (filas.length < 3 && !(limpias0.length >= 1 && limpias0.length < filas.length)) return;
    // Lo normal se mide sin las líneas con el precio pasado al formato de
    // Pedidos ("kg → caja 5kg"), que a menudo salen multiplicadas.
    const limpias = filas.filter(i => String(v[i][5]).indexOf('→') < 0);
    const base = limpias.length >= 2 || filas.length < 3 ? limpias : filas;
    const p = base.map(i => Number(v[i][9])).sort((a, b) => a - b);
    const med = p.length % 2 ? p[(p.length - 1) / 2] : (p[p.length / 2 - 1] + p[p.length / 2]) / 2;
    (filas.length < 3 ? filas.filter(i => limpias.indexOf(i) < 0) : filas).forEach(i => {
      const eur = Number(v[i][9]);
      if (eur > med * MARGEN_RARO_ || eur < med / MARGEN_RARO_) {
        marca[i] = ['REVISAR', 'Sale a ' + eur.toFixed(2).replace('.', ',') + ' € y lo normal es ' + med.toFixed(2).replace('.', ',') +
          ' €: ¿cantidad o unidad mal leída (cajas, bolsas, kg)?'];
        raros++;
      }
    });
  });
  sh.getRange(2, COL_REVISAR_, n, 2).setValues(marca);
  SpreadsheetApp.flush();
  return { raros };
}

// Una vez: las fórmulas de INGREDIENTES E, F y G sin las líneas "REVISAR"
// (las mismas de DatosIniciales.gs, que ya las tiene, para que Reparar fórmulas no las quite).
function instalarRevisar_() {
  // Primero la columna L (si no existe, Google descoloca las referencias).
  const shF = hoja_(HOJA.FACTURAS);
  if (shF.getMaxColumns() < COL_REVISAR_ + 1) shF.insertColumnsAfter(shF.getMaxColumns(), COL_REVISAR_ + 1 - shF.getMaxColumns());
  shF.getRange(1, COL_REVISAR_, 1, 2).setValues([['Revisar\n(no cuenta en el precio)', 'Por qué']]).setFontWeight('bold');
  SpreadsheetApp.flush();
  const h = DATOS_INICIALES_.hojas.filter(x => x.nombre === HOJA.INGREDIENTES)[0];
  const sh = hoja_(HOJA.INGREDIENTES);
  const ss = sh.getParent();
  const ultima = sh.getMaxRows();
  ['5', '6', '7'].forEach(c => {
    const base = formulaLocal_(h.formulas[c], ss);
    if (base.indexOf('REVISAR') < 0) throw new Error('DatosIniciales sin REVISAR en la columna ' + c);
    const col = [];
    for (let r = 2; r <= ultima; r++) col.push([base.replace(/\{r\}/g, r)]);
    sh.getRange(2, Number(c), col.length, 1).setFormulas(col);
  });
  return marcarRaros_();
}

// filas: [{ producto, proveedor, ejemplos, pregunta, supuesto }]. Las que ya están (mismo producto y proveedor) no se repiten.
function escribirDudas_(filas) {
  const ss = libro_();
  let h = ss.getSheetByName('DUDAS');
  const cab = ['Producto (como viene en la factura)', 'Proveedor', 'Cómo viene en las facturas', 'Pregunta', 'Lo que he puesto yo', 'TU RESPUESTA', 'Hecho'];
  if (!h) {
    h = ss.insertSheet('DUDAS', 0);
    h.getRange(1, 1, 1, cab.length).setValues([cab]).setFontWeight('bold').setBackground('#fff2cc').setWrap(true);
    h.setFrozenRows(1);
    [230, 110, 320, 320, 220, 260, 70].forEach((w, i) => h.setColumnWidth(i + 1, w));
  }
  const ya = {};
  if (h.getLastRow() > 1) h.getRange(2, 1, h.getLastRow() - 1, 2).getValues().forEach(r => { ya[r[0] + '|' + r[1]] = true; });
  const nuevas = (filas || []).filter(f => f.producto && !ya[f.producto + '|' + (f.proveedor || '')])
    .map(f => [f.producto, f.proveedor || '', f.ejemplos || '', f.pregunta || '', f.supuesto || '', '', '']);
  if (nuevas.length) {
    const r = h.getRange(h.getLastRow() + 1, 1, nuevas.length, cab.length);
    r.setValues(nuevas).setWrap(true).setVerticalAlignment('top');
    h.getRange(r.getRow(), 6, nuevas.length, 1).setBackground('#e8f5e9');
  }
  return { dudas: nuevas.length };
}

// Una vez (28/11/2026): FACTURAS H e I buscan primero producto + proveedor en
// EQUIVALENCIAS y, si no está, solo el producto (fórmulas de DatosIniciales.gs).
function instalarPorProveedor_() {
  const h = DATOS_INICIALES_.hojas.filter(x => x.nombre === HOJA.FACTURAS)[0];
  const sh = hoja_(HOJA.FACTURAS);
  const ss = sh.getParent();
  const ultima = sh.getMaxRows();
  ['8', '9'].forEach(c => {
    const base = formulaLocal_(h.formulas[c], ss);
    if (base.indexOf('FILTER') < 0) throw new Error('DatosIniciales sin proveedor en la columna ' + c);
    const col = [];
    for (let r = 2; r <= ultima; r++) col.push([base.replace(/\{r\}/g, r)]);
    sh.getRange(2, Number(c), col.length, 1).setFormulas(col);
  });
  return marcarRaros_();
}
