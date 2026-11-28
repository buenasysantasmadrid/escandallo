// Sugerencias de ingrediente para los productos de factura SIN ASIGNAR (26/11/2026, Luciana:
// "no reconoces que aguacate hass es aguacate"). Antes solo valía el texto idéntico de EQUIVALENCIAS.
// Orden: 1) la propuesta preparada a mano (PropuestaAsignaciones.gs), 2) un producto ya asignado con
// el mismo nombre "limpio" (sin marcas, pesos ni mayúsculas), 3) las palabras del nombre del ingrediente
// (todas las del ingrediente tienen que estar en el producto; se admite una letra de diferencia).
// seguro = true → entra en "Asignar todas las seguras" de la app.

const PALABRAS_VACIAS_ = ('de del la el los las y con sin para en al a por x hacendado nuestra nuestro caja cajas bolsa bolsas ' +
  'bote botes lata latas paquete paquetes pack ud uds unidad unidades kg kgs kilo kilos gr grs gramos g l lt lts litro litros ml cl ' +
  'cubo garrafa garrafas bandeja malla saco granel fresco fresca frescos frescas natural extra calidad primera categoria cat ' +
  'nacional importacion aprox approx docena').split(' ');

function sinTildes_(s) {
  return String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

function singular_(w) {
  if (w.length > 4 && /[^aeiou]es$/.test(w) && !/(ces|ses)$/.test(w)) return w.slice(0, -2);  // limones → limon
  if (w.length > 3 && /s$/.test(w)) return w.slice(0, -1);                                      // aguacates → aguacate
  return w;
}

function palabras_(s) {
  return sinTildes_(s).replace(/[^a-zñ]+/g, ' ').split(' ')
    .filter(w => w.length >= 3 && PALABRAS_VACIAS_.indexOf(w) < 0).map(singular_);
}

function claveLimpia_(s) { return palabras_(s).sort().join(' '); }

// Una letra de diferencia (emental / emmental) en palabras de 5 letras o más.
function casiIgual_(a, b) {
  if (a === b) return true;
  if (Math.min(a.length, b.length) < 5 || Math.abs(a.length - b.length) > 1) return false;
  let i = 0, j = 0, dif = 0;
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) { i++; j++; continue; }
    if (++dif > 1) return false;
    if (a.length > b.length) i++; else if (b.length > a.length) j++; else { i++; j++; }
  }
  return dif + (a.length - i) + (b.length - j) <= 1;
}

function unidadNormal_(u) {
  const s = sinTildes_(u).replace(/[^a-z]/g, '');
  if (/^(kg|kgs|kilo|kilos|k)$/.test(s)) return 'kg';
  if (/^(g|gr|grs|gramo|gramos)$/.test(s)) return 'g';
  if (/^(l|lt|lts|litro|litros)$/.test(s)) return 'l';
  if (s === 'ml') return 'ml';
  if (/^(ud|uds|u|un|und|unidad|unidades|pieza|piezas|pz)$/.test(s)) return 'ud';
  return s;
}

// Peso o volumen que trae 1 unidad según el nombre ("570g", "3x140", "2X3.78 LITROS", "2,5kg").
function contenidoEnNombre_(nombre, medida) {
  const s = sinTildes_(nombre).replace(/,/g, '.');
  const m = /(?:(\d+)\s*x\s*)?(\d+(?:\.\d+)?)\s*(kg|kgs|kilos?|g|gr|grs|gramos|l|lt|lts|litros?|ml|cl)\b/.exec(s)
    || /(\d+)\s*x\s*(\d+(?:\.\d+)?)()/.exec(s);
  if (!m) return 0;
  const veces = m[1] ? Number(m[1]) : 1;
  let cant = Number(m[2]);
  let u = unidadNormal_(m[3] || (medida === 'kg' ? 'g' : medida === 'l' ? 'ml' : ''));
  if (m[3] === 'cl') { cant = cant * 10; u = 'ml'; }
  if (medida === 'kg') { if (u === 'kg') return veces * cant; if (u === 'g') return veces * cant / 1000; }
  if (medida === 'l') { if (u === 'l') return veces * cant; if (u === 'ml') return veces * cant / 1000; }
  return 0;
}

// Factor (unidades de escandallo por unidad facturada) y si es seguro.
function factorSugerido_(producto, unidadFactura, unidadIng) {
  const fu = unidadNormal_(unidadFactura), iu = unidadNormal_(unidadIng);
  if (!iu) return { factor: 1, seguro: false };
  if (fu === iu) return { factor: 1, seguro: true };
  if (fu === 'kg' && iu === 'g') return { factor: 1000, seguro: true };
  if (fu === 'g' && iu === 'kg') return { factor: 0.001, seguro: true };
  if (fu === 'l' && iu === 'ml') return { factor: 1000, seguro: true };
  if (fu === 'ml' && iu === 'l') return { factor: 0.001, seguro: true };
  if (iu === 'kg' || iu === 'l') {
    const c = contenidoEnNombre_(producto, iu);
    if (c > 0) return { factor: Math.round(c * 1000) / 1000, seguro: false, nota: 'sale del nombre' };
  }
  return { factor: 1, seguro: false };
}

/** Añade a cada pendiente {sug: {ingrediente, factor, seguro, nuevaUnidad, porque}} si hay sugerencia. */
function sugerirPendientes_(pendientes, ingredientes) {
  const compra = ingredientes.filter(i => i.tipo === 'Compra' && i.nombre);
  const porNombre = {};
  compra.forEach(i => { porNombre[i.nombre] = i; });
  const palabrasIng = compra.map(i => ({ i, w: palabras_(i.nombre) })).filter(x => x.w.length);

  const propuesta = {};
  (typeof PROPUESTA_ASIG_ !== 'undefined' ? PROPUESTA_ASIG_ : []).forEach(p => {
    propuesta[sinTildes_(p[1]).trim()] = p;
    const k = claveLimpia_(p[1]);
    if (k && !propuesta['~' + k]) propuesta['~' + k] = p;
  });
  const yaAsignados = {};
  filas_(HOJA.EQUIV).forEach(({ v }) => {
    const ing = String(v[2] || '');
    if (!ing || String(v[1]) === '(ejemplo)') return;
    const k = claveLimpia_(v[0]);
    if (k) yaAsignados[k] = { ing, factor: num_(v[3]) || 1, unidadFactura: '' };
  });

  pendientes.forEach(p => {
    let s = null;
    // 1) Propuesta preparada a mano.
    const pr = propuesta[sinTildes_(p.producto).trim()] || propuesta['~' + claveLimpia_(p.producto)];
    if (pr && (pr[2] === NO_ING_ || porNombre[pr[2]] || pr[6])) {
      // Si la línea ya viene en la unidad del ingrediente (p. ej. de la pestaña PRECIOS, en kg / l / ud), el factor es 1.
      const ingP = porNombre[pr[2]], mismaUd = ingP && unidadNormal_(p.unidad) === unidadNormal_(ingP.unidad);
      s = { ingrediente: pr[2], factor: mismaUd ? 1 : pr[3], seguro: !!pr[4], porque: String(pr[5] || '').length > 4 ? pr[5] : 'propuesta preparada',
        nuevaUnidad: pr[2] !== NO_ING_ && !porNombre[pr[2]] ? pr[6] : '' };
    }
    // 2) Mismo producto (nombre limpio) ya asignado antes.
    if (!s) {
      const ya = yaAsignados[claveLimpia_(p.producto)];
      if (ya && (ya.ing === NO_ING_ || porNombre[ya.ing])) {
        const f = ya.ing === NO_ING_ ? { factor: 1, seguro: true } : factorSugerido_(p.producto, p.unidad, porNombre[ya.ing].unidad);
        s = { ingrediente: ya.ing, factor: f.seguro ? f.factor : ya.factor, seguro: true, porque: 'igual que otro ya asignado' };
      }
    }
    // 3) Palabras del ingrediente dentro del nombre del producto.
    if (!s) {
      const wp = palabras_(p.producto);
      let mejor = null;
      palabrasIng.forEach(({ i, w }) => {
        const dentro = w.filter(x => wp.some(y => casiIgual_(x, y))).length;
        if (!dentro) return;
        const todas = dentro === w.length;
        const nota = (todas ? 100 : 0) + dentro * 10 - (w.length - dentro) * 5;
        if (!todas && (dentro < 1 || dentro / w.length < 0.5)) return;
        if (!mejor || nota > mejor.nota) mejor = { i, nota, todas, empate: false };
        else if (nota === mejor.nota) mejor.empate = true;
      });
      if (mejor) {
        const f = factorSugerido_(p.producto, p.unidad, mejor.i.unidad);
        s = { ingrediente: mejor.i.nombre, factor: f.factor, seguro: mejor.todas && !mejor.empate && f.seguro,
          porque: (mejor.todas ? 'el nombre coincide' : 'se parece') + (f.nota ? '; cantidad ' + f.nota : '') +
            (f.seguro ? '' : '; revisa el número') };
      }
    }
    if (s) p.sug = s;
  });
  return pendientes;
}

/** Varias asignaciones de golpe: [{producto, ingrediente, factor, proveedor, nuevaUnidad}]. */
function asignarVarios_(lista) {
  if (!Array.isArray(lista) || !lista.length) throw new Error('No hay nada que asignar');
  const shI = hoja_(HOJA.INGREDIENTES);
  const existe = {};
  shI.getRange(2, 1, shI.getMaxRows() - 1, 1).getValues().forEach(r => { if (r[0] !== '') existe[r[0]] = true; });
  lista.forEach(a => {
    if (a.ingrediente !== NO_ING_ && !existe[a.ingrediente] && a.nuevaUnidad) {
      nuevoIngrediente_(a.ingrediente, a.nuevaUnidad, '');
      existe[a.ingrediente] = true;
    }
  });
  const sh = hoja_(HOJA.EQUIV);
  // Producto + proveedor (28/11/2026): el mismo texto puede ser otra cosa en
  // otro proveedor ("Girasol 5 l": garrafa en Mercadona, caja de 3 en Disbesa).
  const ab = sh.getRange(2, 1, sh.getMaxRows() - 1, 2).getValues();
  const col = ab.map(r => String(r[0]));
  const prv = ab.map(r => String(r[1]).trim().toLowerCase());
  const errores = [];
  let hechas = 0;
  lista.forEach(a => {
    const prod = String(a.producto || '').trim(), ing = String(a.ingrediente || '').trim();
    if (!prod || !ing) return;
    if (ing !== NO_ING_ && !existe[ing]) { errores.push(prod + ': no existe el ingrediente ' + ing); return; }
    const f = Number(String(a.factor || 1).replace(',', '.')) || 1;
    const pv = String(a.proveedor || '').trim().toLowerCase();
    // La fila de ese producto y ese proveedor; si solo está con otro proveedor, fila nueva.
    let fila = col.findIndex((c, i) => c === prod && prv[i] === pv);
    if (fila < 0 && !col.some((c, i) => c === prod && prv[i] && prv[i] !== pv)) fila = col.indexOf(prod);
    if (fila < 0) fila = col.indexOf('');
    if (fila < 0) { sh.insertRowAfter(sh.getMaxRows()); fila = col.length; col.push(''); prv.push(''); }
    // "(no es ingrediente)": la columna C solo admite ingredientes (validación),
    // así que va vacía (el producto deja de estar "SIN ASIGNAR" y no cuenta en
    // ningún precio) y la nota lo dice. Antes fallaba y paraba todo el lote (28/11/2026).
    if (ing === NO_ING_) sh.getRange(fila + 2, 1, 1, 5).setValues([[prod, a.proveedor || '', '', '', NO_ING_]]);
    else sh.getRange(fila + 2, 1, 1, 4).setValues([[prod, a.proveedor || '', ing, f]]);
    col[fila] = prod; prv[fila] = pv;
    hechas++;
  });
  SpreadsheetApp.flush();
  // Con el factor nuevo puede cambiar qué líneas tienen un precio raro (Revisar.gs).
  try { marcarRaros_(); } catch (e) { errores.push('Revisar: ' + (e.message || e)); }
  return { guardado: true, hechas, errores };
}
