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
    const yaEnOrigen = { ids: {}, numeros: {} };
    ORIGENES_PRECIOS_.forEach(o => {
      let filas;
      try {
        const h = SpreadsheetApp.openById(o.id).getSheetByName(o.pestana);
        if (!h) { avisos.push('No existe la pestaña ' + o.pestana); return; }
        if (h.getLastRow() < 2) return;
        filas = h.getRange(2, 1, h.getLastRow() - 1, 12).getValues();
      } catch (e) {
        avisos.push(o.pestana + ': ' + (e.message || e));
        return;
      }
      filas.forEach(f => {
        // Para no traer dos veces lo mismo desde PRECIOS (abajo).
        const idFoto = idDrive_(f[11]);
        if (idFoto) yaEnOrigen.ids[idFoto] = true;
        if (claveNumero_(f[2]).length >= 3) yaEnOrigen.numeros[claveNumero_(f[2])] = true;
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

    // Pestaña PRECIOS del Índice (desde el 26/11/2026): todos los proveedores.
    // Solo lo que NO llega ya por APP_Precios / "Precios proveedores" (esos
    // productos ya están asignados con su factor) y sin las líneas dudosas.
    // Va en kg / l / ud (o en piezas si no se sabe el contenido): el factor
    // de EQUIVALENCIAS suele ser 1.
    try {
      const h = SpreadsheetApp.openById(ORIGENES_PRECIOS_[1].id).getSheetByName(PESTANA_PRECIOS_);
      if (h && h.getLastRow() > 1) {
        h.getRange(2, 1, h.getLastRow() - 1, 21).getValues().forEach(f => {
          const l = lineaDePrecios_(f, yaEnOrigen);
          if (!l) return;
          const k = clavePrecio_(l[1], l[2], l[0], l[3], l[4], l[6]);
          if (ya[k]) return;
          ya[k] = true;
          nuevas.push(l);
        });
      }
    } catch (e) {
      avisos.push(PESTANA_PRECIOS_ + ': ' + (e.message || e));
    }

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

const PESTANA_PRECIOS_ = 'PRECIOS';

function idDrive_(url) {
  const m = /\/d\/([\w-]{20,})/.exec(String(url || '')) || /[?&]id=([\w-]{20,})/.exec(String(url || ''));
  return m ? m[1] : '';
}
function claveNumero_(n) { return String(n === null ? '' : n).toUpperCase().replace(/[^0-9A-Z]/g, ''); }

// Una fila de PRECIOS (Fecha · Proveedor · Documento · Nº · En la factura · Producto · ID pedidos ·
// Cantidad · Se cobra por · Piezas por bulto · Cada pieza trae · Medida · Precio · Importe línea ·
// Precio pieza · Precio por kg/l/ud · Precio anterior · Cambio % · Revisar · PDF · Id archivo)
// → fila de FACTURAS [fecha, proveedor, nº, producto, cantidad, unidad, importe], o null.
function lineaDePrecios_(f, yaEnOrigen) {
  if (String(f[18] || '').trim()) return null;                  // dudosa
  if (yaEnOrigen.ids[String(f[20] || '')] || yaEnOrigen.ids[idDrive_(f[19])]) return null;
  if (claveNumero_(f[3]).length >= 3 && yaEnOrigen.numeros[claveNumero_(f[3])]) return null;
  const proveedor = String(f[1] || '').trim(), producto = String(f[5] || f[4] || '').trim();
  const fecha = f[0] instanceof Date ? f[0] : (fechaISO_(f[0]) ? new Date(fechaISO_(f[0]) + 'T12:00:00') : '');
  const cant = numPrecio_(f[7]), precio = numPrecio_(f[12]);
  const piezas = numPrecio_(f[9]), cont = numPrecio_(f[10]), medida = String(f[11] || '').trim();
  if (!proveedor || !producto || !fecha || !(cant > 0) || !(precio > 0)) return null;
  const importe = Math.round(cant * precio * 100) / 100;
  let cantidad = cant, unidad = String(f[8] || '');
  if (numPrecio_(f[15]) > 0 && piezas > 0 && cont > 0 && medida) { cantidad = cant * piezas * cont; unidad = medida; }
  else if (numPrecio_(f[14]) > 0 && piezas > 0) { cantidad = cant * piezas; unidad = 'ud'; }
  return [fecha, proveedor, f[3] === null ? '' : f[3], producto, Math.round(cantidad * 1000) / 1000, unidad, importe];
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
