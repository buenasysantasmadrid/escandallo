// Trae a FACTURAS las líneas de factura que lee la app del cierre de caja (proyecto CIERRE-CAJA, Precios.gs):
// - Hoja de Pedidos, pestaña APP_Precios (proveedores de la app de Pedidos).
// - Índice del cierre, pestaña "Precios proveedores" (Frutapro y otros que no están en Pedidos).
// Las dos tienen las columnas: Fecha · Proveedor · Factura · En la factura · ID producto · Producto ·
// Cantidad · Unidad · Precio (unitario sin IVA) · Precio anterior · Cambio % · Foto · Registrado.
// Solo añade las líneas nuevas: una línea igual (proveedor, factura, fecha, producto, cantidad e importe) no se repite.

const ORIGENES_PRECIOS_ = [
  { id: '11X7L9CcmklQtHbqdCyi29O0QPzpeEUPAK-GH5c8Fr0I', pestana: 'APP_Precios' },          // pedido_proveedores2026
  { id: '1ZqE4UZqXIYmnmwu-uNLgHDhRpl62WbbRNKY9i2ePyEY', pestana: 'Precios proveedores' }   // Índice CIERRE-CAJA
];

function numPrecio_(v) {
  if (typeof v === 'number') return isFinite(v) ? v : 0;
  let s = String(v || '').replace(/[^\d,.\-]/g, '');
  if (s.indexOf(',') >= 0) s = s.replace(/\./g, '').replace(',', '.');
  const n = parseFloat(s);
  return isNaN(n) ? 0 : n;
}

function fechaISO_(v) {
  if (v instanceof Date) return Utilities.formatDate(v, 'Europe/Madrid', 'yyyy-MM-dd');
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(v || ''));
  if (m) return m[0];
  const d = /^(\d{1,2})\/(\d{1,2})\/(\d{4})/.exec(String(v || ''));
  return d ? d[3] + '-' + ('0' + d[2]).slice(-2) + '-' + ('0' + d[1]).slice(-2) : '';
}

function clavePrecio_(proveedor, factura, fecha, producto, cantidad, importe) {
  return [String(proveedor).trim().toLowerCase(), String(factura).trim(), fechaISO_(fecha),
    String(producto).trim().toLowerCase(), Math.round(numPrecio_(cantidad) * 1000), Math.round(numPrecio_(importe) * 100)].join('|');
}

/** Copia a FACTURAS las líneas nuevas del cierre de caja. Devuelve un resumen. */
function traerFacturas() {
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    const sh = hoja_(HOJA.FACTURAS);
    const max = sh.getMaxRows();
    const actuales = sh.getRange(2, 1, max - 1, 7).getValues();
    const ya = {};
    let ultima = 0;  // última fila (índice en actuales) con producto
    actuales.forEach((r, i) => {
      if (r[3] === '' || r[3] === null) return;
      ultima = i + 1;
      ya[clavePrecio_(r[1], r[2], r[0], r[3], r[4], r[6])] = true;
    });

    const nuevas = [], avisos = [];
    ORIGENES_PRECIOS_.forEach(o => {
      let filas;
      try {
        const h = SpreadsheetApp.openById(o.id).getSheetByName(o.pestana);
        if (!h) { avisos.push('No existe la pestaña ' + o.pestana); return; }
        if (h.getLastRow() < 2) return;
        filas = h.getRange(2, 1, h.getLastRow() - 1, 9).getValues();
      } catch (e) {
        avisos.push(o.pestana + ': ' + (e.message || e));
        return;
      }
      filas.forEach(f => {
        const proveedor = String(f[1] || '').trim();
        const producto = String(f[5] || f[3] || '').trim();
        const cantidad = numPrecio_(f[6]), precio = numPrecio_(f[8]);
        const fecha = f[0] instanceof Date ? f[0] : (fechaISO_(f[0]) ? new Date(fechaISO_(f[0]) + 'T12:00:00') : '');
        if (!proveedor || !producto || !fecha || !(cantidad > 0) || !(precio > 0)) return;
        const importe = Math.round(cantidad * precio * 100) / 100;
        const k = clavePrecio_(proveedor, f[2], fecha, producto, cantidad, importe);
        if (ya[k]) return;
        ya[k] = true;
        nuevas.push([fecha, proveedor, f[2] === null ? '' : f[2], producto, cantidad, String(f[7] || ''), importe]);
      });
    });

    if (nuevas.length) {
      nuevas.sort((a, b) => a[0] - b[0]);
      const libres = max - 1 - ultima;
      if (nuevas.length > libres) {
        throw new Error('FACTURAS no tiene filas libres suficientes (' + libres + ' libres, ' + nuevas.length + ' nuevas). ' +
          'Añadir filas al final y usar Escandallo → Reparar fórmulas.');
      }
      sh.getRange(ultima + 2, 1, nuevas.length, 7).setValues(nuevas);
      SpreadsheetApp.flush();
    }
    const res = { nuevas: nuevas.length, avisos };
    Logger.log(JSON.stringify(res));
    return res;
  } finally {
    lock.releaseLock();
  }
}

/** Menú: traer ahora y avisar. */
function traerFacturasMenu() {
  const r = traerFacturas();
  SpreadsheetApp.getUi().alert('Precios del cierre de caja',
    'Líneas nuevas en FACTURAS: ' + r.nuevas + (r.avisos.length ? '\n\nAvisos:\n' + r.avisos.join('\n') : '') +
    '\n\nLos productos nuevos salen como "SIN ASIGNAR": asignarlos a un ingrediente en la pestaña Facturas de la app.',
    SpreadsheetApp.getUi().ButtonSet.OK);
}

/** Ejecutar UNA vez desde el editor con lfisbein: trae los precios ahora y deja un disparador diario (6-7 h). */
function activarPreciosDiarios() {
  ScriptApp.getProjectTriggers()
    .filter(t => t.getHandlerFunction() === 'traerFacturas')
    .forEach(t => ScriptApp.deleteTrigger(t));
  ScriptApp.newTrigger('traerFacturas').timeBased().everyDays(1).atHour(6).inTimezone('Europe/Madrid').create();
  const r = traerFacturas();
  Logger.log('Disparador diario creado. Líneas nuevas: ' + r.nuevas + (r.avisos.length ? ' · Avisos: ' + r.avisos.join(' / ') : ''));
}
