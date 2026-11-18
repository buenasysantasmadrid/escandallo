// Edición desde la app: recetas, precio manual de ingredientes e ingredientes nuevos.
// INGREDIENTES L = "Precio manual €/ud": si tiene un número, manda sobre el precio de facturas o el de 2021
// (fórmulas de H e I en DatosIniciales.gs / generar_datos.py).

const COL_MANUAL_ = 12;

/** Deja puesta la columna de precio manual y las fórmulas que la usan (solo la primera vez). */
function asegurarPrecioManual_() {
  const sh = hoja_(HOJA.INGREDIENTES);
  if (sh.getMaxColumns() >= COL_MANUAL_ && String(sh.getRange(1, COL_MANUAL_).getValue()).indexOf('Precio manual') === 0) return;
  const h = DATOS_INICIALES_.hojas.filter(x => x.nombre === 'INGREDIENTES')[0];
  if (sh.getMaxColumns() < COL_MANUAL_) sh.insertColumnsAfter(sh.getMaxColumns(), COL_MANUAL_ - sh.getMaxColumns());
  const ultima = Math.max(h.ultima, h.datos.length + 1);
  sh.getRange(1, 11).copyTo(sh.getRange(1, COL_MANUAL_), SpreadsheetApp.CopyPasteType.PASTE_FORMAT, false);
  sh.getRange(1, COL_MANUAL_).setValue(h.cabecera[COL_MANUAL_ - 1]);
  sh.setColumnWidth(COL_MANUAL_, 110);
  sh.getRange(2, COL_MANUAL_, ultima - 1, 1).setNumberFormat(h.formatos['12'] || '0.0000')
    .setBackground(COLOR_ENTRADA_).setFontColor(COLOR_TEXTO_ENTRADA_);
  escribirFormulas_(sh, h, ultima, true);
  reglasColores_(sh, h, ultima);
  SpreadsheetApp.flush();
}

const numES_ = v => {
  if (v === '' || v === null || v === undefined) return NaN;
  return Number(String(v).trim().replace(/\./g, (m, i, s) => s.indexOf(',') >= 0 ? '' : '.').replace(',', '.'));
};

/** Precio manual de un ingrediente (vacío = volver al automático). */
function precioManual_(ingrediente, valor) {
  asegurarPrecioManual_();
  const f = filas_(HOJA.INGREDIENTES).find(x => x.v[0] === ingrediente);
  if (!f) throw new Error('No existe el ingrediente: ' + ingrediente);
  const r = hoja_(HOJA.INGREDIENTES).getRange(f.fila, COL_MANUAL_);
  if (valor === '' || valor === null || valor === undefined) r.clearContent();
  else {
    const n = numES_(valor);
    if (!(n > 0)) throw new Error('Precio no válido');
    r.setValue(n);
  }
  SpreadsheetApp.flush();
  return { guardado: true };
}

/** Ingrediente nuevo de compra, con precio manual opcional. */
function nuevoIngrediente_(nombre, unidad, valor) {
  nombre = String(nombre || '').trim(); unidad = String(unidad || '').trim();
  if (!nombre || !unidad) throw new Error('Falta el nombre o la unidad');
  asegurarPrecioManual_();
  const sh = hoja_(HOJA.INGREDIENTES);
  const col = sh.getRange(2, 1, sh.getMaxRows() - 1, 1).getValues();
  if (col.some(r => String(r[0]).toLowerCase() === nombre.toLowerCase())) throw new Error('Ya existe un ingrediente con ese nombre');
  const i = col.findIndex(r => r[0] === '');
  if (i < 0) throw new Error('INGREDIENTES no tiene filas libres');
  sh.getRange(i + 2, 1, 1, 3).setValues([[nombre, 'Compra', unidad]]);
  if (valor !== '' && valor !== null && valor !== undefined) {
    const n = numES_(valor);
    if (!(n > 0)) throw new Error('Precio no válido');
    sh.getRange(i + 2, COL_MANUAL_).setValue(n);
  }
  SpreadsheetApp.flush();
  return { guardado: true };
}

/** Elaboración nueva (sub-receta que se usa como ingrediente): fila en PLATOS (tipo Elaboración) y en INGREDIENTES. */
function nuevaElaboracion_(nombre, rend, unidad, cat) {
  nombre = String(nombre || '').trim(); unidad = String(unidad || '').trim();
  const r = numES_(rend);
  if (!nombre || !unidad) throw new Error('Falta el nombre o la unidad');
  if (!(r > 0)) throw new Error('Cantidad que sale no válida');
  const shP = hoja_(HOJA.PLATOS), shI = hoja_(HOJA.INGREDIENTES);
  const colP = shP.getRange(2, 1, shP.getMaxRows() - 1, 1).getValues();
  const colI = shI.getRange(2, 1, shI.getMaxRows() - 1, 1).getValues();
  const existe = c => c.some(x => String(x[0]).toLowerCase() === nombre.toLowerCase());
  if (existe(colP) || existe(colI)) throw new Error('Ya existe un plato o ingrediente con ese nombre');
  const iP = colP.findIndex(x => x[0] === ''), iI = colI.findIndex(x => x[0] === '');
  if (iP < 0 || iI < 0) throw new Error('No quedan filas libres en PLATOS o INGREDIENTES');
  shP.getRange(iP + 2, 1, 1, 5).setValues([[nombre, String(cat || ''), 'Elaboración', r, unidad]]);
  shI.getRange(iI + 2, 1, 1, 3).setValues([[nombre, 'Elaboración', unidad]]);
  SpreadsheetApp.flush();
  return { guardado: true };
}

/** Cambios de datos que se aplican una sola vez, la primera vez que se abre la app después de publicarlos. */
function migraciones_() {
  const pr = PropertiesService.getScriptProperties();
  // 18/11/2026: coeficiente propio para bebidas (vacío = CONFIG 3,5 = hasta 28,6 % de coste).
  // Vinos 2,5 (hasta 40 %), resto de bebidas 3 (hasta 33 %). Solo donde no haya uno puesto.
  if (!pr.getProperty('coefBebidas')) {
    const sh = hoja_(HOJA.PLATOS);
    filas_(HOJA.PLATOS).forEach(({ fila, v }) => {
      const cat = v[1];
      if (v[7] !== '' && v[7] !== null) return;
      if (cat === 'Vinos') sh.getRange(fila, 8).setValue(2.5);
      else if (['Cervezas', 'Sin alcohol', 'Cafetería'].indexOf(cat) >= 0) sh.getRange(fila, 8).setValue(3);
    });
    SpreadsheetApp.flush();
    pr.setProperty('coefBebidas', '1');
  }
}

/** Sustituye la receta de un plato. lineas = [{ing, cant, nota}]. rend opcional (rendimiento). */
function guardarReceta_(plato, lineas, rend) {
  const filaP = filaPlato_(plato);
  const ingr = {};
  filas_(HOJA.INGREDIENTES).forEach(({ v }) => { ingr[v[0]] = true; });
  const nuevas = (lineas || []).map((l, k) => {
    const ing = String(l.ing || '').trim(), cant = numES_(l.cant);
    if (!ingr[ing]) throw new Error('Línea ' + (k + 1) + ': no existe el ingrediente "' + ing + '"');
    if (ing === plato) throw new Error('Un plato no puede llevarse a sí mismo');
    if (!(cant > 0)) throw new Error('Línea ' + (k + 1) + ': cantidad no válida');
    return [plato, ing, cant, String(l.nota || '')];
  });
  if (rend !== undefined && rend !== '') {
    const r = numES_(rend);
    if (!(r > 0)) throw new Error('Rendimiento no válido');
    hoja_(HOJA.PLATOS).getRange(filaP, 4).setValue(r);
  }

  const sh = hoja_(HOJA.RECETAS);
  const v = sh.getRange(2, 1, sh.getMaxRows() - 1, 2).getValues();
  const suyas = [], libres = [];
  v.forEach((r, i) => {
    if (r[0] === plato) suyas.push(i + 2);
    else if (r[0] === '' && r[1] === '') libres.push(i + 2);
  });
  const destino = suyas.concat(libres);
  if (nuevas.length > destino.length) throw new Error('RECETAS no tiene filas libres');
  const lock = LockService.getScriptLock(); lock.waitLock(20000);
  try {
    nuevas.forEach((n, k) => {
      const f = destino[k];
      sh.getRange(f, 1, 1, 3).setValues([[n[0], n[1], n[2]]]);
      sh.getRange(f, 7).setValue(n[3]);
    });
    suyas.slice(nuevas.length).forEach(f => { sh.getRange(f, 1, 1, 3).clearContent(); sh.getRange(f, 7).clearContent(); });
    SpreadsheetApp.flush();
  } finally { lock.releaseLock(); }
  return { guardado: true };
}
