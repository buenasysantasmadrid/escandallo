/**
 * ESCANDALLO · BUENAS Y SANTAS
 * App web servida desde el propio Google Sheet (HtmlService) + funciones de datos.
 *
 * Acceso: solo las cuentas de Google de USUARIOS_PERMITIDOS.
 * Implementación como aplicación web:
 *   - Ejecutar como: Usuario que accede a la aplicación web
 *   - Quién tiene acceso: Cualquier usuario con cuenta de Google
 * y el Google Sheet compartido (como editor) solo con esas mismas cuentas.
 */

const USUARIOS_PERMITIDOS = [
  'lfisbein@gmail.com',
  'buenasysantasmadrid@gmail.com',
  'buenasysantas9@gmail.com'
];

// Google Sheet del escandallo (Drive de buenasysantasmadrid@gmail.com)
const ESCANDALLO_ID = '1ZtMSucu0CDqUfKhQBhN5R67EVkVWeJLJV1nvEC1Kmq4';

const HOJA = {
  PLATOS: 'PLATOS',
  RECETAS: 'RECETAS',
  INGREDIENTES: 'INGREDIENTES',
  FACTURAS: 'FACTURAS',
  EQUIV: 'EQUIVALENCIAS',
  CONFIG: 'CONFIG'
};

/** Abre la app. */
function doGet() {
  const email = usuario_();
  if (!permitido_(email)) {
    return HtmlService.createHtmlOutput(
      '<div style="font-family:Arial,sans-serif;max-width:420px;margin:20vh auto;text-align:center;padding:16px">' +
      '<h2>Sin acceso</h2><p>La cuenta <b>' + (email || 'desconocida') + '</b> no tiene permiso para ver el escandallo.</p>' +
      '<p>Entra con una cuenta autorizada de Buenas y Santas.</p></div>'
    ).setTitle('Escandallo · sin acceso');
  }
  return HtmlService.createHtmlOutputFromFile('Index')
    .setTitle('Escandallo · Buenas y Santas')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1, viewport-fit=cover');
}

/** Punto de entrada único para la página (google.script.run.api). Devuelve JSON en texto. */
function api(p) {
  p = p || {};
  try {
    const email = usuario_();
    if (!permitido_(email)) throw new Error('Sin acceso para ' + (email || 'esta cuenta'));
    let res;
    switch (p.action) {
      case 'datos':   res = datos_(); res.usuario = email; break;
      case 'pvp':     res = guardarPvp_(p.plato, p.valor); break;
      case 'coef':    res = guardarCoef_(p.plato, p.valor); break;
      case 'asignar': res = asignar_(p.producto, p.ingrediente, p.factor, p.proveedor); break;
      case 'mes':     res = cambiarMes_(p.fecha); break;
      default: throw new Error('Acción desconocida: ' + p.action);
    }
    return JSON.stringify(Object.assign({ ok: true }, res));
  } catch (err) {
    return JSON.stringify({ ok: false, error: String(err.message || err) });
  }
}

function usuario_() {
  try { return String(Session.getActiveUser().getEmail() || '').toLowerCase(); } catch (e) { return ''; }
}

function permitido_(email) {
  return !!email && USUARIOS_PERMITIDOS.map(x => x.toLowerCase()).indexOf(email) >= 0;
}

function libro_() {
  return SpreadsheetApp.openById(ESCANDALLO_ID);
}

function hoja_(n) {
  const sh = libro_().getSheetByName(n);
  if (!sh) throw new Error('No existe la hoja ' + n);
  return sh;
}

/** Filas con valor en la primera columna (las hojas llevan fórmulas pre-rellenadas hasta abajo). */
function filas_(nombre, colClave) {
  const v = hoja_(nombre).getDataRange().getValues();
  const out = [];
  for (let i = 1; i < v.length; i++) {
    if (v[i][colClave || 0] !== '' && v[i][colClave || 0] !== null) out.push({ fila: i + 1, v: v[i] });
  }
  return out;
}

const num_ = x => (x === '' || x === null || isNaN(x)) ? null : Number(x);

function datos_() {
  const cf = hoja_(HOJA.CONFIG).getRange('B2:B6').getValues().map(r => r[0]);
  const config = {
    coef: num_(cf[0]), iva: num_(cf[1]),
    mes: cf[2] instanceof Date ? Utilities.formatDate(cf[2], Session.getScriptTimeZone(), 'yyyy-MM') : String(cf[2]),
    alerta: num_(cf[4])
  };

  const platos = filas_(HOJA.PLATOS).map(({ fila, v }) => ({
    fila, nombre: v[0], cat: v[1], tipo: v[2], rend: num_(v[3]), unidad: v[4],
    coste: num_(v[5]), costeRacion: num_(v[6]), coef: num_(v[7]), pvpMin: num_(v[8]),
    pvp: num_(v[9]), fc: num_(v[10]), margen: num_(v[11]), aviso: v[12], coste2021: num_(v[13])
  }));

  const recetas = filas_(HOJA.RECETAS).map(({ v }) => ({
    plato: v[0], ing: v[1], cant: num_(v[2]), unidad: v[3], precio: num_(v[4]), coste: num_(v[5]), nota: v[6]
  }));

  const ingredientes = filas_(HOJA.INGREDIENTES).map(({ v }) => ({
    nombre: v[0], tipo: v[1], unidad: v[2], ref: num_(v[3]), mes: num_(v[4]), lineas: num_(v[5]),
    hist: num_(v[6]), usado: num_(v[7]), origen: v[8], variacion: num_(v[9])
  }));

  // productos de factura sin ingrediente asignado
  const pend = {};
  filas_(HOJA.FACTURAS, 3).forEach(({ v }) => {
    if (v[7] !== 'SIN ASIGNAR') return;
    const k = String(v[3]);
    pend[k] = pend[k] || { producto: k, proveedor: v[1], lineas: 0, importe: 0, unidad: v[5] };
    pend[k].lineas++; pend[k].importe += Number(v[6]) || 0;
  });

  return { config, platos, recetas, ingredientes, pendientes: Object.values(pend), actualizado: new Date().toISOString() };
}

function filaPlato_(nombre) {
  const f = filas_(HOJA.PLATOS).find(x => x.v[0] === nombre);
  if (!f) throw new Error('No encuentro el plato: ' + nombre);
  return f.fila;
}

function guardarPvp_(plato, valor) {
  const n = Number(String(valor).replace(',', '.'));
  if (!(n > 0)) throw new Error('PVP no válido');
  hoja_(HOJA.PLATOS).getRange(filaPlato_(plato), 10).setValue(n);
  SpreadsheetApp.flush();
  return { guardado: true };
}

function guardarCoef_(plato, valor) {
  const r = hoja_(HOJA.PLATOS).getRange(filaPlato_(plato), 8);
  if (valor === '' || valor === undefined) r.clearContent();
  else {
    const n = Number(String(valor).replace(',', '.'));
    if (!(n > 0)) throw new Error('Coeficiente no válido');
    r.setValue(n);
  }
  SpreadsheetApp.flush();
  return { guardado: true };
}

function asignar_(producto, ingrediente, factor, proveedor) {
  if (!producto || !ingrediente) throw new Error('Falta producto o ingrediente');
  const existe = filas_(HOJA.INGREDIENTES).some(x => x.v[0] === ingrediente);
  if (!existe) throw new Error('No existe el ingrediente: ' + ingrediente);
  const f = Number(String(factor || 1).replace(',', '.')) || 1;
  const sh = hoja_(HOJA.EQUIV);
  const col = sh.getRange(2, 1, sh.getMaxRows() - 1, 1).getValues();
  let fila = col.findIndex(r => r[0] === producto);           // si ya existe, se actualiza
  if (fila < 0) fila = col.findIndex(r => r[0] === '');        // si no, primera fila libre
  if (fila < 0) { sh.insertRowAfter(sh.getMaxRows()); fila = col.length; }
  sh.getRange(fila + 2, 1, 1, 4).setValues([[producto, proveedor || '', ingrediente, f]]);
  SpreadsheetApp.flush();
  return { guardado: true };
}

function cambiarMes_(fecha) {
  const m = /^(\d{4})-(\d{2})/.exec(fecha || '');
  if (!m) throw new Error('Fecha no válida (aaaa-mm)');
  hoja_(HOJA.CONFIG).getRange('B4').setValue(new Date(Number(m[1]), Number(m[2]) - 1, 1));
  SpreadsheetApp.flush();
  return { guardado: true };
}

/** Volver a "mes en curso" automáticamente. */
function mesActual() {
  hoja_(HOJA.CONFIG).getRange('B4').setFormula(formulaLocal_('=DATE(YEAR(TODAY()),MONTH(TODAY()),1)'));
}

/** Menú en el propio Google Sheet. */
function onOpen() {
  SpreadsheetApp.getUi().createMenu('Escandallo')
    .addItem('Volver al mes en curso', 'mesActual')
    .addSeparator()
    .addItem('Instalar (solo la primera vez)', 'instalarEscandallo')
    .addItem('Reparar fórmulas', 'repararFormulas')
    .addToUi();
}
