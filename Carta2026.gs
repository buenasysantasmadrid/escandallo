// ============================================================================
// Cambio de carta (carta de la puerta mayo 2026 + bebidas y postres julio 2026).
// Menú del Sheet: Escandallo → Actualizar a la carta 2026.
// - Quita los platos que ya no están (copia en la pestaña FUERA DE CARTA).
// - Renombra los que siguen con otro nombre y pone los precios nuevos.
// - Añade los platos y bebidas nuevos (sin receta: aviso "Falta receta").
// - Degustaciones de empanadas: receta = las empanadas que llevan.
// Solo escribe en las columnas de entrada; las fórmulas de las columnas no se tocan.
// Si ya se hizo (existe "Bife de chorizo"), no hace nada.
// ============================================================================

// [nombre en la carta nueva, categoría, PVP, nombre antiguo en el Sheet (si ya existía)]
var CARTA_2026_ = [
  ['Empanada de carne', 'Empanadas', 3.9, 'Empanada de carne'],
  ['Empanada de pollo', 'Empanadas', 3.9, 'Empanada de pollo'],
  ['Empanada de atún', 'Empanadas', 3.9],
  ['Empanada de verdura', 'Empanadas', 3.9, 'Empanada de verdura'],
  ['Empanada de humita', 'Empanadas', 3.9],
  ['Empanada de jamón y queso', 'Empanadas', 3.9],
  ['Empanada de queso y cebolla', 'Empanadas', 3.9, 'Empanada de queso y cebolla'],
  ['Degustación Buenas y Santas', 'Empanadas', 25.4],
  ['Degustación Criolla', 'Empanadas', 14.5],
  ['Degustación Vegetariana', 'Empanadas', 10.9],
  ['Provoleta', 'Para picar', 12.9, 'Provoleta'],
  ['Tablita mediterránea', 'Para picar', 15.5, 'Tablita mediterránea'],
  ['Palomitas de pollo', 'Para picar', 12.5],
  ['Quiche champiñón', 'Quiches', 10.5, 'Quiche champiñón'],
  ['Quiche MTA', 'Quiches', 10.5, 'Quiche MTA'],
  ['Quiche pollo', 'Quiches', 10.5, 'Quiche pollo'],
  ['Quiche calabaza', 'Quiches', 10.5],
  ['Ensalada Oriente vegano', 'Ensaladas', 14.5],
  ['Ensalada caesar', 'Ensaladas', 15.5, 'Ensalada caesar'],
  ['Ensalada rulo de cabra', 'Ensaladas', 14.5, 'Ensalada rulo de cabra'],
  ['Ensalada vegetales asados', 'Ensaladas', 14.5],
  ['Hamburguesa deluxe', 'Hamburguesas y más', 15.9, 'Hamburguesa deluxe'],
  ['Hamburguesa del Corral', 'Hamburguesas y más', 15.9],
  ['Hamburguesa Veggie', 'Hamburguesas y más', 15.3],
  ['Entrepan Granjero Héctor', 'Hamburguesas y más', 15.9, 'Granjero'],
  ['Wrap vegetariano', 'Hamburguesas y más', 15.3, 'Vegetariano'],
  ['Bife de chorizo', 'Carnes argentinas', 25.9, 'Lomo'],
  ['Entraña', 'Carnes argentinas', 22.9],
  ['Milanesa napolitana de ternera', 'Milanesas', 19.9],
  ['Milanesa napolitana de pollo', 'Milanesas', 19.5],
  ['Milanesa porteña de ternera', 'Milanesas', 19.9],
  ['Milanesa porteña de pollo', 'Milanesas', 19.5],
  ['Milanesa clásica de ternera', 'Milanesas', 16.9, 'Milanesa'],
  ['Milanesa clásica de pollo', 'Milanesas', 16.5],
  ['Ravioli de calabaza', 'Pasta artesana', 16.7, 'Raviol c/ trufa'],
  ['Brownie', 'Postres', 6.9, 'Brownies'],
  ['Panqueque argentino', 'Postres', 6.9, 'Panqueque'],
  ['Crumble de manzana', 'Postres', 6.9],
  ['Cheesecake', 'Postres', 6.9, 'Cheesecake'],
  ['Tiramisú descafeinado', 'Postres', 6.9, 'Tiramisú'],
  ['Helado de dulce de leche', 'Postres', 6.9, 'Helado de dulce de leche'],
  ['Helado de vainilla', 'Postres', 6.9],
  ['Helado de frutos rojos', 'Postres', 6.9],
  ['Alfajor Havanna', 'Postres', 3.9],
  ['Tinto de verano (copa)', 'Vinos', 3.9],
  ['Honoro Vera (botella)', 'Vinos', 15.6],
  ['Lágrimas de María joven (copa)', 'Vinos', 2.9],
  ['Lágrimas de María joven (botella)', 'Vinos', 12.4],
  ['Ramón Bilbao crianza (copa)', 'Vinos', 3.9],
  ['Ramón Bilbao crianza (botella)', 'Vinos', 17.4],
  ['Baden Numen (copa)', 'Vinos', 3.7],
  ['Baden Numen (botella)', 'Vinos', 16.6],
  ['Trumpeter Malbec (copa)', 'Vinos', 4.6],
  ['Trumpeter Malbec (botella)', 'Vinos', 20.2],
  ['RivaSanz verdejo (copa)', 'Vinos', 3.5],
  ['RivaSanz verdejo (botella)', 'Vinos', 15.9],
  ['Novilunio godello (copa)', 'Vinos', 3.9],
  ['Novilunio godello (botella)', 'Vinos', 17.4],
  ['Caña doble San Miguel Magna', 'Cervezas', 3.6],
  ['San Miguel 1/3', 'Cervezas', 3.2],
  ['San Miguel 0,0 1/3', 'Cervezas', 3.2],
  ['San Miguel 0,0 Tostada 1/3', 'Cervezas', 3.6],
  ['San Miguel sin gluten', 'Cervezas', 3.6],
  ['San Miguel Selecta 1/3', 'Cervezas', 3.6],
  ['Bailandera IPA 1/3', 'Cervezas', 4.5],
  ['Quilmes 1/3', 'Cervezas', 4.5],
  ['Refresco 1/3', 'Sin alcohol', 3.5],
  ['Agua con o sin gas 1/2', 'Sin alcohol', 2.7],
  ['Limonada', 'Sin alcohol', 4.5],
  ['Li-mojito', 'Sin alcohol', 9.9],
  ['Zumo Granini', 'Sin alcohol', 3.5],
  ['Café solo / con leche / cortado', 'Cafetería', 1.9],
  ['Café doble', 'Cafetería', 3.0],
  ['Capuchino', 'Cafetería', 3.7],
  ['Café con licor', 'Cafetería', 3.7],
  ['Té / tila / manzanilla / poleo', 'Cafetería', 1.9],
  ['Té Masala Chai', 'Cafetería', 3.0],
  ['Té Ginseng Limón', 'Cafetería', 3.0],
  ['Té Pu Erh', 'Cafetería', 3.0],
  ['Rooibos naranja dulce', 'Cafetería', 3.0],
  ['Mate cocido', 'Cafetería', 3.0],
  ['Infusión frutos del bosque', 'Cafetería', 3.0],
  ['Infusión hierbabuena', 'Cafetería', 3.0]
];

// Elaboraciones que siguen (se usan en platos que siguen), con su categoría nueva.
var ELABORACIONES_2026_ = {
  'Taboulé (elab.)': 'Para picar', 'Hummus (elab.)': 'Para picar', 'Tapenade (elab.)': 'Para picar',
  'Hamburguesa casera (elab.)': 'Hamburguesas y más'
};

// Lo que sale de la carta (si aparece algo que no está ni aquí ni arriba, se deja como está).
var FUERA_2026_ = ['Croquetas jamón', 'Croquetas setas', 'Croquetas mixtas', 'Tablita patagónica',
  'Croquetas de cordero (elab.)', 'Berenjenas (elab.)', 'Carpaccio', 'Patatita al gratén', 'Quiche atún',
  'Caprese tibia', 'Ensalada criolla', 'Pampa', 'Raviol c/ 4 quesos', 'Risotto', 'Soufflé',
  'Bizcocho naranja', 'Bizcocho marmolado'];

// Degustaciones: 1 empanada de cada.
var DEGUSTACIONES_2026_ = {
  'Degustación Buenas y Santas': ['Empanada de carne', 'Empanada de pollo', 'Empanada de atún', 'Empanada de verdura',
    'Empanada de humita', 'Empanada de jamón y queso', 'Empanada de queso y cebolla'],
  'Degustación Criolla': ['Empanada de atún', 'Empanada de pollo', 'Empanada de carne', 'Empanada de jamón y queso'],
  'Degustación Vegetariana': ['Empanada de queso y cebolla', 'Empanada de verdura', 'Empanada de humita']
};

function actualizarCarta2026() {
  var lock = LockService.getDocumentLock(); lock.waitLock(30000);
  try {
    var ss = libro_();
    var shP = hoja_(HOJA.PLATOS), shR = hoja_(HOJA.RECETAS), shI = hoja_(HOJA.INGREDIENTES);
    var P = DATOS_INICIALES_.hojas.filter(function (h) { return h.nombre === 'PLATOS'; })[0];
    var R = DATOS_INICIALES_.hojas.filter(function (h) { return h.nombre === 'RECETAS'; })[0];
    var maxP = P.ultima, maxR = R.ultima;

    var vP = shP.getRange(2, 1, maxP - 1, 14).getValues();
    var dP = shP.getRange(2, 1, maxP - 1, 14).getDisplayValues();
    var vR = shR.getRange(2, 1, maxR - 1, 7).getValues();
    var dR = shR.getRange(2, 1, maxR - 1, 7).getDisplayValues();
    var platos = [], recetas = [];
    vP.forEach(function (f, i) { if (f[0] !== '') platos.push({ v: f, d: dP[i] }); });
    vR.forEach(function (f, i) { if (f[0] !== '') recetas.push({ v: f, d: dR[i] }); });

    if (platos.some(function (p) { return p.v[0] === 'Bife de chorizo'; })) {
      return aviso2026_('La carta 2026 ya estaba puesta. No se ha tocado nada.');
    }

    var porNombre = {};
    platos.forEach(function (p) { porNombre[p.v[0]] = p; });
    var renombre = {}; // antiguo -> nuevo
    CARTA_2026_.forEach(function (c) { if (c[3]) renombre[c[3]] = c[0]; });
    var faltan = CARTA_2026_.filter(function (c) { return c[3] && !porNombre[c[3]]; }).map(function (c) { return c[3]; });
    if (faltan.length) throw new Error('No encuentro en PLATOS: ' + faltan.join(', ') + '. No se ha tocado nada.');

    // --- copia de lo que sale
    var fuera = {};
    FUERA_2026_.forEach(function (n) { if (porNombre[n]) fuera[n] = true; });
    var shF = ss.getSheetByName('FUERA DE CARTA') || ss.insertSheet('FUERA DE CARTA');
    shF.clear();
    var cabP = shP.getRange(1, 1, 1, 14).getValues()[0], cabR = shR.getRange(1, 1, 1, 7).getValues()[0];
    var filasF = [['Platos quitados de la carta el ' + Utilities.formatDate(new Date(), 'Europe/Madrid', 'dd/MM/yyyy') +
      ' (valores de ese momento; para recuperar uno, copiar sus filas a PLATOS y RECETAS)'].concat(blancos_(13))];
    filasF.push(cabP);
    platos.forEach(function (p) { if (fuera[p.v[0]]) filasF.push(p.d); });
    filasF.push(blancos_(14));
    filasF.push(cabR.concat(blancos_(7)));
    recetas.forEach(function (r) { if (fuera[r.v[0]]) filasF.push(r.d.concat(blancos_(7))); });
    shF.getRange(1, 1, filasF.length, 14).setValues(filasF);
    shF.getRange(1, 1).setFontWeight('bold');
    shF.setFrozenRows(0);

    // --- PLATOS nuevos (solo columnas de entrada: A-E, H, J, N)
    var nuevosP = [];
    CARTA_2026_.forEach(function (c) {
      var viejo = c[3] ? porNombre[c[3]].v : null;
      nuevosP.push(viejo
        ? [c[0], c[1], 'Plato', viejo[3], viejo[4], viejo[7], c[2], viejo[13]]
        : [c[0], c[1], 'Plato', 1, 'ración', '', c[2], '']);
    });
    Object.keys(ELABORACIONES_2026_).forEach(function (n) {
      var v = porNombre[n] && porNombre[n].v; if (!v) return;
      nuevosP.push([n, ELABORACIONES_2026_[n], 'Elaboración', v[3], v[4], v[7], '', v[13]]);
    });
    // lo que no esté en ninguna lista se queda como estaba (por si alguien lo añadió a mano)
    var conocidos = {};
    CARTA_2026_.forEach(function (c) { if (c[3]) conocidos[c[3]] = true; });
    Object.keys(ELABORACIONES_2026_).forEach(function (n) { conocidos[n] = true; });
    var otros = [];
    platos.forEach(function (p) {
      var n = p.v[0];
      if (conocidos[n] || fuera[n]) return;
      otros.push(n);
      nuevosP.push([n, p.v[1], p.v[2], p.v[3], p.v[4], p.v[7], p.v[9], p.v[13]]);
    });
    if (nuevosP.length > maxP - 1) throw new Error('No caben los platos en PLATOS.');

    // --- RECETAS: las de los platos que siguen (con el nombre nuevo) + degustaciones
    var nuevasR = [];
    recetas.forEach(function (r) {
      var n = r.v[0];
      if (fuera[n]) return;
      nuevasR.push([renombre[n] || n, r.v[1], r.v[2], r.v[6]]);
    });
    Object.keys(DEGUSTACIONES_2026_).forEach(function (deg) {
      DEGUSTACIONES_2026_[deg].forEach(function (emp) { nuevasR.push([deg, emp, 1, '']); });
    });
    if (nuevasR.length > maxR - 1) throw new Error('No caben las recetas en RECETAS.');

    // --- INGREDIENTES: cada empanada como elaboración (para las degustaciones)
    var vI = shI.getRange(2, 1, shI.getMaxRows() - 1, 1).getValues().map(function (f) { return f[0]; });
    var empanadas = CARTA_2026_.filter(function (c) { return c[1] === 'Empanadas' && c[0].indexOf('Empanada') === 0; })
      .map(function (c) { return c[0]; });
    var libre = vI.indexOf('');
    var anadidos = 0;
    empanadas.forEach(function (e) {
      if (vI.indexOf(e) >= 0) return;
      if (libre < 0) throw new Error('INGREDIENTES está lleno.');
      shI.getRange(libre + 2, 1, 1, 3).setValues([[e, 'Elaboración', 'ud']]);
      shI.getRange(libre + 2, 11).setValue('Precio = coste por unidad de su receta en PLATOS');
      vI[libre] = e; anadidos++;
      libre = vI.indexOf('');
    });

    // --- desplegable de categorías y aviso "Falta receta"
    var valCat = P.validaciones.filter(function (v) { return v.col === 2; })[0];
    shP.getRange(2, 2, maxP - 1, 1).setDataValidation(
      SpreadsheetApp.newDataValidation().setAllowInvalid(false).requireValueInList(valCat.lista, true).build());
    var fAviso = formulaLocal_(P.formulas['13'], ss), colAviso = [];
    for (var r = 2; r <= maxP; r++) colAviso.push([fAviso.replace(/\{r\}/g, r)]);
    shP.getRange(2, 13, colAviso.length, 1).setFormulas(colAviso);
    reglasColores_(shP, P, maxP);

    // --- escribir
    var rellena = function (filas, n, ancho) { while (filas.length < n) filas.push(blancos_(ancho)); return filas; };
    var tp = rellena(nuevosP, maxP - 1, 8);
    var col = function (filas, idx) { return filas.map(function (f) { return idx.map(function (i) { return f[i]; }); }); };
    shP.getRange(2, 1, maxP - 1, 5).setValues(col(tp, [0, 1, 2, 3, 4]));
    shP.getRange(2, 8, maxP - 1, 1).setValues(col(tp, [5]));
    shP.getRange(2, 10, maxP - 1, 1).setValues(col(tp, [6]));
    shP.getRange(2, 14, maxP - 1, 1).setValues(col(tp, [7]));
    var tr = rellena(nuevasR, maxR - 1, 4);
    shR.getRange(2, 1, maxR - 1, 3).setValues(col(tr, [0, 1, 2]));
    shR.getRange(2, 7, maxR - 1, 1).setValues(col(tr, [3]));
    SpreadsheetApp.flush();

    var msg = 'Carta 2026 puesta.\n\n' +
      '• Quitados: ' + Object.keys(fuera).length + ' (copia en la pestaña FUERA DE CARTA).\n' +
      '• En carta: ' + CARTA_2026_.length + ' platos y bebidas, con los precios nuevos.\n' +
      '• Empanadas añadidas como elaboración en INGREDIENTES: ' + anadidos + '.\n' +
      (otros.length ? '• Se han dejado como estaban (no están en la carta nueva ni en la lista de quitar): ' + otros.join(', ') + '.\n' : '') +
      '\nLos que no tienen receta salen con el aviso "Falta receta".';
    return aviso2026_(msg);
  } finally {
    lock.releaseLock();
  }
}

function blancos_(n) { var a = []; for (var i = 0; i < n; i++) a.push(''); return a; }

function aviso2026_(msg) {
  try { SpreadsheetApp.getUi().alert(msg); } catch (e) {}
  return msg;
}
