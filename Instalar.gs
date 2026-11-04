// ============================================================================
// Instalación del escandallo en el Google Sheet (solo la primera vez).
// Crea las pestañas LEEME, PLATOS, RECETAS, INGREDIENTES, FACTURAS,
// EQUIVALENCIAS y CONFIG con los datos del Excel 2021 (DatosIniciales.gs),
// las fórmulas, formatos, desplegables y colores.
// Se lanza desde el menú del Sheet: Escandallo → Instalar (solo la primera vez).
// Si PLATOS ya tiene datos, no hace nada (para no borrar el trabajo hecho).
// ============================================================================

var COLOR_CABECERA_ = '#2F4F3A';
var COLOR_ENTRADA_ = '#FFF6D5';
var COLOR_TEXTO_ENTRADA_ = '#0000FF';

function instalarEscandallo() {
  var ss = libro_();
  var platos = ss.getSheetByName('PLATOS');
  if (platos && platos.getLastRow() > 1 && String(platos.getRange('A2').getValue()) !== '') {
    var msg = 'El escandallo ya está instalado (PLATOS tiene datos). No se ha tocado nada.';
    try { SpreadsheetApp.getUi().alert(msg); } catch (e) {}
    return msg;
  }
  var D = DATOS_INICIALES_;
  instalarLeeme_(ss, D.leeme);
  D.hojas.forEach(function (h) { instalarHoja_(ss, h); });

  var cf = ss.getSheetByName('CONFIG');
  Object.keys(D.config_formatos).forEach(function (a1) { cf.getRange(a1).setNumberFormat(D.config_formatos[a1]); });
  cf.getRange('B2:B6').setBackground(null).setFontColor(null);
  D.config_entradas.forEach(function (a1) { cf.getRange(a1).setBackground(COLOR_ENTRADA_).setFontColor(COLOR_TEXTO_ENTRADA_); });
  cf.getRange('A2:A6').setFontWeight('bold');
  cf.getRange('C2:C6').setFontColor('#777777').setFontStyle('italic');
  cf.setFrozenColumns(0);

  // orden de pestañas y fuera la hoja vacía inicial
  ['LEEME', 'PLATOS', 'RECETAS', 'INGREDIENTES', 'FACTURAS', 'EQUIVALENCIAS', 'CONFIG'].forEach(function (n, i) {
    ss.setActiveSheet(ss.getSheetByName(n)); ss.moveActiveSheet(i + 1);
  });
  ss.getSheets().forEach(function (s) {
    if (['LEEME', 'PLATOS', 'RECETAS', 'INGREDIENTES', 'FACTURAS', 'EQUIVALENCIAS', 'CONFIG'].indexOf(s.getName()) < 0 && s.getLastRow() === 0) ss.deleteSheet(s);
  });
  ss.setActiveSheet(ss.getSheetByName('PLATOS'));
  ss.setSpreadsheetLocale('es_ES');
  ss.setSpreadsheetTimeZone('Europe/Madrid');
  SpreadsheetApp.flush();
  var ok = 'Escandallo instalado: ' + D.hojas[0].datos.length + ' platos y elaboraciones, ' + D.hojas[1].datos.length + ' líneas de receta.';
  try { SpreadsheetApp.getUi().alert(ok); } catch (e) {}
  return ok;
}

function hojaNueva_(ss, nombre) {
  var sh = ss.getSheetByName(nombre) || ss.insertSheet(nombre);
  sh.clear(); sh.clearConditionalFormatRules();
  sh.getDataRange().clearDataValidations();
  if (sh.getFilter()) sh.getFilter().remove();
  return sh;
}

function instalarLeeme_(ss, lineas) {
  var sh = hojaNueva_(ss, 'LEEME');
  sh.getRange(1, 1, lineas.length, 1).setValues(lineas.map(function (l) { return [l[0]]; }))
    .setFontFamily('Arial').setWrap(true).setVerticalAlignment('top');
  lineas.forEach(function (l, i) {
    var c = sh.getRange(i + 1, 1);
    if (l[1] === 'titulo') c.setFontSize(16).setFontWeight('bold').setFontColor(COLOR_CABECERA_);
    if (l[1] === 'negrita') c.setFontWeight('bold');
    if (l[1] === 'gris') c.setFontColor('#777777').setFontStyle('italic');
  });
  sh.setColumnWidth(1, 900);
  sh.setHiddenGridlines(true);
}

function instalarHoja_(ss, h) {
  var sh = hojaNueva_(ss, h.nombre);
  var nc = h.cabecera.length, ultima = Math.max(h.ultima, h.datos.length + 1);
  if (sh.getMaxRows() < ultima) sh.insertRowsAfter(sh.getMaxRows(), ultima - sh.getMaxRows());
  if (sh.getMaxColumns() < nc) sh.insertColumnsAfter(sh.getMaxColumns(), nc - sh.getMaxColumns());

  // cabecera
  sh.getRange(1, 1, 1, nc).setValues([h.cabecera]).setBackground(COLOR_CABECERA_).setFontColor('#FFFFFF')
    .setFontWeight('bold').setWrap(true).setVerticalAlignment('middle');
  sh.setRowHeight(1, 42);
  h.anchos.forEach(function (w, i) { sh.setColumnWidth(i + 1, w); });

  // datos (sin fórmulas) y después las fórmulas con setFormulas
  var filas = [];
  for (var r = 2; r <= ultima; r++) {
    var dato = h.datos[r - 2] || [];
    var fila = [];
    for (var c = 1; c <= nc; c++) {
      var v = dato[c - 1];
      if (h.formulas[String(c)] || esFormula_(v)) fila.push('');
      else fila.push(v === null || v === undefined ? '' : v);
    }
    filas.push(fila);
  }
  if (filas.length) sh.getRange(2, 1, filas.length, nc).setValues(filas);
  escribirFormulas_(sh, h, ultima, false);

  var cuerpo = function (c) { return sh.getRange(2, c, ultima - 1, 1); };
  sh.getRange(1, 1, ultima, nc).setFontFamily('Arial');
  Object.keys(h.formatos).forEach(function (c) { cuerpo(Number(c)).setNumberFormat(h.formatos[c]); });
  h.entradas.forEach(function (c) { cuerpo(c).setBackground(COLOR_ENTRADA_).setFontColor(COLOR_TEXTO_ENTRADA_); });

  h.validaciones.forEach(function (v) {
    var b = SpreadsheetApp.newDataValidation().setAllowInvalid(false);
    b = v.lista ? b.requireValueInList(v.lista, true) : b.requireValueInRange(ss.getRange(v.rango.replace(/\$/g, '')), true);
    cuerpo(v.col).setDataValidation(b.build());
  });

  var reglas = h.condicionales.map(function (k) {
    var b = SpreadsheetApp.newConditionalFormatRule().whenFormulaSatisfied(k.formula).setRanges([cuerpo(k.col)]);
    if (k.fondo) b = b.setBackground(k.fondo);
    if (k.texto) b = b.setFontColor(k.texto).setBold(true);
    return b.build();
  });
  if (reglas.length) sh.setConditionalFormatRules(reglas);

  Object.keys(h.notas).forEach(function (a1) { sh.getRange(a1).setNote(h.notas[a1]); });
  sh.setFrozenRows(1);
  sh.setFrozenColumns(1);
  if (h.nombre !== 'CONFIG') sh.getRange(1, 1, ultima, nc).createFilter();
  // columnas sobrantes fuera
  if (sh.getMaxColumns() > nc) sh.deleteColumns(nc + 1, sh.getMaxColumns() - nc);
}

// ----------------------------------------------------------------------------
// FÓRMULAS: siempre con setFormula/setFormulas y en inglés con comas (IF, SUMIFS…).
// Así funcionan sea cual sea el idioma del Sheet (aquí es español: SI, SUMAR.SI.CONJUNTO, ";").
// NO escribir fórmulas con setValues: Google las lee en el idioma del Sheet y dan #ERROR!.
// ----------------------------------------------------------------------------
function esFormula_(v) { return typeof v === 'string' && v.charAt(0) === '='; }

/** Escribe las fórmulas de una hoja. Si soloRotas, las celdas de datos con fórmula
 *  (p. ej. CONFIG B4) solo se reescriben si ahora mismo tienen fórmula, no si alguien puso un valor. */
function escribirFormulas_(sh, h, ultima, soloRotas) {
  Object.keys(h.formulas).forEach(function (c) {
    var col = [];
    for (var r = 2; r <= ultima; r++) col.push([h.formulas[c].replace(/\{r\}/g, r)]);
    sh.getRange(2, Number(c), col.length, 1).setFormulas(col);
  });
  h.datos.forEach(function (fila, i) {
    fila.forEach(function (v, j) {
      if (!esFormula_(v) || h.formulas[String(j + 1)]) return;
      var celda = sh.getRange(i + 2, j + 1);
      if (soloRotas && celda.getFormula() === '' && celda.getValue() !== '') return;
      celda.setFormula(v);
    });
  });
}

/** Menú: Escandallo → Reparar fórmulas. Reescribe solo las fórmulas; no toca los datos. */
function repararFormulas() {
  var ss = libro_();
  var hechas = [];
  DATOS_INICIALES_.hojas.forEach(function (h) {
    var sh = ss.getSheetByName(h.nombre);
    if (!sh) return;
    escribirFormulas_(sh, h, Math.max(h.ultima, h.datos.length + 1), true);
    hechas.push(h.nombre);
  });
  SpreadsheetApp.flush();
  var ok = 'Fórmulas reparadas en: ' + hechas.join(', ') + '.';
  try { SpreadsheetApp.getUi().alert(ok); } catch (e) {}
  return ok;
}
