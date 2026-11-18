// Propuesta de asignación de los productos de factura (cierre de caja) a ingredientes del escandallo.
// Preparada el 18/11/2026 con las 481 líneas de FACTURAS (19/10–17/11/2026).
// Menú Escandallo → "Asignaciones: crear propuesta" la escribe en la pestaña PROPUESTA ASIGNACIONES para revisarla;
// "Asignaciones: cargar las marcadas" pasa las filas con la casilla marcada a EQUIVALENCIAS y crea los ingredientes nuevos.
//
// Cada fila: [proveedor, producto (texto exacto de FACTURAS), ingrediente, factor, marcada, nota, unidad si es ingrediente nuevo]
// factor = unidades del escandallo que trae 1 unidad facturada.

const NO_ING_ = '(no es ingrediente)';

const PROPUESTA_ASIG_ = [
  // ---- ATLANTA ----
  ['ATLANTA', 'Palomitas de pollo 10 kg', 'Palomitas de pollo', 10, true, 'Caja de 10 kg'],
  ['ATLANTA', 'Caesar dressing 4 bote', 'Salsa caesar', 7.56, true, 'Mismo precio que la caja 2 × 3,78 l: se toma como 7,56 l'],
  ['ATLANTA', 'SALSA CAESAR 2X3.78 LITROS', 'Salsa caesar', 7.56, true, 'Caja 2 × 3,78 l'],
  ['ATLANTA', 'Croutons Italian 6 bolsas', 'Croutons', 6, false, '¿Cuánto pesa cada bolsa? Puesto 1 kg por bolsa'],
  ['ATLANTA', 'Maiz congelado 2,5kg', 'Maíz', 2.5, true, 'Ingrediente nuevo (para la empanada de humita)', 'kg'],
  ['ATLANTA', 'Patata dipper', 'Patata dipper', 10, false, 'Ingrediente nuevo. ¿Cuántos kg trae la caja? Puesto 4 × 2,5 kg', 'kg'],
  // ---- CBG ----
  ['CBG', 'TORTELLI ZUCCA VOLPINA 3kg x 1', 'Raviol', 3, true, 'Bolsa de 3 kg (ravioli de calabaza)'],
  ['CBG', 'TORTELLONI RICOTTA SPINACI 3kg x 1', 'Raviol', 1, false, 'El precio no cuadra con una bolsa de 3 kg: ¿se factura por kg?'],
  // ---- CREM DE LUX ----
  ['CREM DE LUX', 'Helado D. Leche Tentación 2,3lt', 'Helado de dulce de leche', 2.3, true, 'Envase 2,3 l (se cuenta 1 l = 1 kg)'],
  ['CREM DE LUX', 'Vainilla de gold', 'Helado de vainilla', 2.3, false, 'Ingrediente nuevo. ¿Envase de 2,3 l como el de dulce de leche?', 'l'],
  ['CREM DE LUX', 'frutos rojos', 'Helado de frutos rojos', 2.3, false, 'Ingrediente nuevo (no es la fruta). ¿Envase de 2,3 l?', 'l'],
  // ---- DISBESA: cocina ----
  ['DISBESA', 'Aceituna negra s/hueso', 'Aceitunas negras', 1, true, '1 unidad = 1 lata grande'],
  ['DISBESA', 'Arroz grano largo 5kg', 'Arroz', 5, true, 'Saco de 5 kg'],
  ['DISBESA', 'Atun', 'Atún', 16, true, 'Caja de 16 latas (se cuenta 1 kg por lata: sale como el precio 2021)'],
  ['DISBESA', 'Girasol 5 l', 'Aceite', 15, true, 'Caja de 3 garrafas de 5 l'],
  ['DISBESA', 'Girasol altoleico 25lt', 'Aceite', 25, true, 'Garrafa de 25 l'],
  ['DISBESA', 'Pan rallado', 'Pan rallado', 5, false, '¿Cuántos kg trae la bolsa? Puesto 5 kg'],
  ['DISBESA', 'Tomate frit 3k Gallina', 'Tomate frito', 3, false, 'Ingrediente nuevo. ¿La caja trae 1 lata de 3 kg?', 'kg'],
  ['DISBESA', 'Tomate pomod Ginos', 'Tomate triturado', 1, false, 'Ingrediente nuevo. ¿Cuántos kg trae?', 'kg'],
  ['DISBESA', 'Piñones', 'Piñones', 1, false, 'Ingrediente nuevo. ¿Bolsa de 1 kg?', 'kg'],
  ['DISBESA', 'Uvas pasas', 'Uvas pasas', 1, false, 'Ingrediente nuevo. ¿Bolsa de 1 kg?', 'kg'],
  ['DISBESA', 'Frutos secos 1 kg', 'Frutos secos', 1, false, 'Ingrediente nuevo. ¿Para qué plato?', 'kg'],
  ['DISBESA', 'Salsa Tartufato', 'Salsa de trufa', 1, false, 'Ingrediente nuevo. ¿Cuánto trae el bote?', 'ud'],
  ['DISBESA', 'Levadura Promolac', 'Polvo de hornear', 1, false, '¿Es lo mismo? ¿Cuántos kg trae?'],
  ['DISBESA', 'Caldo Avecrem verdu', NO_ING_, 1, true, 'Va dentro de "Varios (sal, aceite, especias…)"'],
  ['DISBESA', 'Oregano 150grs', NO_ING_, 1, true, 'Va dentro de "Varios"'],
  ['DISBESA', 'Pimentón dulce', NO_ING_, 1, true, 'Va dentro de "Varios"'],
  ['DISBESA', 'Salsa de Soja S/GLUTEN', NO_ING_, 1, true, 'Va dentro de "Varios"'],
  ['DISBESA', 'Mostaza grande', NO_ING_, 1, true, 'Va dentro de "Varios"'],
  ['DISBESA', 'Ketchup Heinz sobre', NO_ING_, 1, true, 'Sobres para servir'],
  ['DISBESA', 'Mayonesa Heinz sobre', NO_ING_, 1, true, 'Sobres para servir'],
  ['DISBESA', 'Mostaza Heinz sobre', NO_ING_, 1, true, 'Sobres para servir'],
  ['DISBESA', 'Cocktail Surtido Sarao Cubo 2 K x1', NO_ING_, 1, true, 'Aperitivo'],
  ['DISBESA', 'Cocktail Surtido Sarao Cubo 2K x1', NO_ING_, 1, true, 'Aperitivo'],
  // ---- DISBESA: bebidas y cafetería (ingredientes nuevos, para las recetas de las bebidas) ----
  ['DISBESA', 'COCA-COLA 24 lata', 'Refresco lata', 24, true, 'Caja de 24 latas', 'ud'],
  ['DISBESA', 'COCA-COLA ZERO 24 lata', 'Refresco lata', 24, true, 'Caja de 24 latas', 'ud'],
  ['DISBESA', 'COC-COLA ZEROZERO 24U', 'Refresco lata', 24, true, 'Caja de 24 latas', 'ud'],
  ['DISBESA', 'NESTEA 24 latas', 'Refresco lata', 24, true, 'Caja de 24 latas', 'ud'],
  ['DISBESA', 'San Miguel 1/3', 'Cerveza San Miguel 1/3', 24, true, 'Caja de 24 botellines', 'ud'],
  ['DISBESA', 'San Miguel 00', 'Cerveza San Miguel 0,0 1/3', 24, true, 'Caja de 24 botellines', 'ud'],
  ['DISBESA', 'San Miguel 0,0% 1/3 Ret. x24', 'Cerveza San Miguel 0,0 1/3', 24, true, 'Caja de 24 botellines', 'ud'],
  ['DISBESA', 'San Miguel magna barril 30', 'Cerveza barril San Miguel Magna', 30, true, 'Barril de 30 l', 'l'],
  ['DISBESA', 'Cafe Nat.Delta Gold 1K x1', 'Café', 1, true, 'Paquete de 1 kg', 'kg'],
  ['DISBESA', 'Delta Gold café natural 1Kg', 'Café', 1, true, 'Paquete de 1 kg', 'kg'],
  ['DISBESA', 'Cafe Delta Descafeinado 5', 'Café descafeinado', 0.5, true, 'Paquete de 500 g', 'kg'],
  ['DISBESA', 'Delta café descafeinado 500g', 'Café descafeinado', 0.5, true, 'Paquete de 500 g', 'kg'],
  ['DISBESA', 'Te Ginger Limon de T 20 u', 'Té (bolsita)', 20, true, 'Estuche de 20', 'ud'],
  ['DISBESA', 'Te Roibos Naranja de T 20 u', 'Té (bolsita)', 20, true, 'Estuche de 20', 'ud'],
  ['DISBESA', 'Te Manzanilla Flor de T 100 u', 'Té (bolsita)', 100, true, 'Estuche de 100', 'ud'],
  ['DISBESA', 'Rua Vieja Crema de Orujo', 'Licor (botella)', 1, true, 'Para el café con licor', 'botella'],
  ['DISBESA', 'Delta sacarina en polvo 250 unidades', NO_ING_, 1, true, 'Para servir con el café'],
  ['DISBESA', 'Disbesa azúcar moreno en sobres de 5g 500 unidades', NO_ING_, 1, true, 'Para servir con el café'],
  // ---- DISBESA: limpieza ----
  ['DISBESA', 'Fregona Algod.Crudo 250g', NO_ING_, 1, true, 'Limpieza'],
  ['DISBESA', 'Fregona Algodon Crudo 250g', NO_ING_, 1, true, 'Limpieza'],
  ['DISBESA', 'Guantes nitrilo (L)', NO_ING_, 1, true, 'Limpieza'],
  ['DISBESA', 'Toallas Z', NO_ING_, 1, true, 'Limpieza'],
  ['DISBESA', 'Uni Desinf Bacteri Conc Codina 5L', NO_ING_, 1, true, 'Limpieza'],
  ['DISBESA', 'Uni Lavavajil Manual Lim Glossy 5L', NO_ING_, 1, true, 'Limpieza'],
  ['DISBESA', 'Uni.Cepillo Escoba 2color', NO_ING_, 1, true, 'Limpieza'],
  ['DISBESA', 'Uni.Lav.Ma.Li.Ultr.Glos.5', NO_ING_, 1, true, 'Limpieza'],
  // ---- ENVAPRO (envases y limpieza) ----
  ['ENVAPRO', 'Bobina film (30 cm)', NO_ING_, 1, true, 'Envases'],
  ['ENVAPRO', 'Bol. Basura 85X105', NO_ING_, 1, true, 'Limpieza'],
  ['ENVAPRO', 'CAJA PIZZA KRAFT INTERIOR KRAFT 330x330x40 MM', NO_ING_, 1, true, 'Envases'],
  ['ENVAPRO', 'CEPILLO BARRER LUCCA/AMAPOLA FREGONA INDUSTRIAL 250gr', NO_ING_, 1, true, 'Limpieza'],
  ['ENVAPRO', 'Cepillo (escoba)', NO_ING_, 1, true, 'Limpieza'],
  ['ENVAPRO', 'Cont. Porex GR (171P1654)', NO_ING_, 1, true, 'Envases'],
  ['ENVAPRO', 'Desengrasante planc MARRON 10 l', NO_ING_, 1, true, 'Limpieza'],
  ['ENVAPRO', 'Detergente manual x 5l', NO_ING_, 1, true, 'Limpieza'],
  ['ENVAPRO', 'FREGONA INDUSTRIAL 250gr', NO_ING_, 1, true, 'Limpieza'],
  ['ENVAPRO', 'Fibra verde c/esponja', NO_ING_, 1, true, 'Limpieza'],
  ['ENVAPRO', 'GUANTE NITRILO SIN POLVO AZUL MEDIANA TALLA M 3,8 gr', NO_ING_, 1, true, 'Limpieza'],
  ['ENVAPRO', 'LEJIA DILUIDA APTA 1L C12', NO_ING_, 1, true, 'Limpieza'],
  ['ENVAPRO', 'Papel higienico', NO_ING_, 1, true, 'Limpieza'],
  ['ENVAPRO', 'Servilleta 1/6 30x40 253SER52109077', NO_ING_, 1, true, 'Envases'],
  // ---- Frutapro ----
  ['Frutapro', 'Aguacate hass', 'Aguacate', 1, true, 'kg'],
  ['Frutapro', 'Ajo pelado', 'Ajo', 1, true, 'kg'],
  ['Frutapro', 'Albahaca', 'Albahaca', 1, true, 'manojo'],
  ['Frutapro', 'Albahaca manojo', 'Albahaca', 1, true, 'manojo'],
  ['Frutapro', 'NOJO', 'Albahaca', 1, false, '¿Es "albahaca manojo" mal leído? Mismo precio (2,40)'],
  ['Frutapro', 'Berenjena', 'Berenjena', 1, true, 'kg'],
  ['Frutapro', 'Berenjena extra', 'Berenjena', 1, true, 'kg'],
  ['Frutapro', 'Calabacin', 'Calabacín', 1, true, 'kg'],
  ['Frutapro', 'Calabacin extra', 'Calabacín', 1, true, 'kg'],
  ['Frutapro', 'Calabacín', 'Calabacín', 1, true, 'kg'],
  ['Frutapro', 'Calabacín extra', 'Calabacín', 1, true, 'kg'],
  ['Frutapro', 'Calabaza cacahuete', 'Calabaza', 1, true, 'Ingrediente nuevo (ravioli y quiche de calabaza)', 'kg'],
  ['Frutapro', 'TRA', 'Calabaza', 1, false, '¿Qué producto es? El precio (1,31 €/kg) parece de calabaza'],
  ['Frutapro', 'Cebolla morada', 'Cebolla morada', 1, true, 'kg'],
  ['Frutapro', 'Cebolla dulce', 'Cebolla', 1, false, 'Ingrediente nuevo, o ¿se usa como "Cebolla morada"/"Cebolleta"?', 'kg'],
  ['Frutapro', 'Champiñon', 'Champiñón', 1, true, 'Por kg (la quiche lleva 1 kg)'],
  ['Frutapro', 'Champiñón', 'Champiñón', 1, true, 'Por kg (la quiche lleva 1 kg)'],
  ['Frutapro', 'Tomate cherry', 'Tomate cherry', 1, true, 'Por kg (la quiche lleva 1 kg)'],
  ['Frutapro', 'Acelga', 'Acelga', 1, true, 'Por kg'],
  ['Frutapro', 'Ensalada mezclum', 'Hojas verdes', 0.5, true, 'Bolsa de 500 g (sale a 5,20 €/kg; en 2021 eran 1,30)'],
  ['Frutapro', 'Ensalada mezclum 500 g', 'Hojas verdes', 0.5, true, 'Bolsa de 500 g'],
  ['Frutapro', 'Ensalada mezclum 500g', 'Hojas verdes', 0.5, true, 'Bolsa de 500 g'],
  ['Frutapro', 'Lechuga lollo rosso', 'Lechuga', 1, true, '1,59 €, como el precio de 2021 (1,50/kg)'],
  ['Frutapro', 'Rúcula', 'Rucula', 0.05, true, 'Bandeja de 50 g'],
  ['Frutapro', 'Rúcula bandeja', 'Rucula', 0.05, true, 'Bandeja de 50 g'],
  ['Frutapro', 'Rucula', 'Rucula', 0.05, true, 'Bandeja de 50 g'],
  ['Frutapro', 'Rucula bandeja', 'Rucula', 0.05, true, 'Bandeja de 50 g'],
  ['Frutapro', 'Púcula bandeja', 'Rucula', 0.05, true, 'Bandeja de 50 g'],
  ['Frutapro', 'Patata pelada', 'Patata', 1, true, 'kg'],
  ['Frutapro', 'Patata pelada brava', 'Patata', 1, true, 'kg'],
  ['Frutapro', 'Pimiento rojo', 'Pimiento rojo', 1, true, 'kg'],
  ['Frutapro', 'Pimiento rojo economico', 'Pimiento rojo', 1, true, 'kg'],
  ['Frutapro', 'Pimiento rojo económico', 'Pimiento rojo', 1, true, 'kg'],
  ['Frutapro', 'Pimiento verde', 'Pimiento verde', 1, true, 'kg'],
  ['Frutapro', 'Pimiento verde economico', 'Pimiento verde', 1, true, 'kg'],
  ['Frutapro', 'Pimiento verde económico', 'Pimiento verde', 1, true, 'kg'],
  ['Frutapro', 'Puerro', 'Puerro', 1, true, 'kg'],
  ['Frutapro', 'Tomate ensalada', 'Tomate', 1, true, 'kg'],
  ['Frutapro', 'Tomate ensalada economico', 'Tomate', 1, true, 'kg'],
  ['Frutapro', 'Tomate ensalada económico', 'Tomate', 1, true, 'kg'],
  ['Frutapro', 'Tomate ensalada extra', 'Tomate', 1, true, 'kg'],
  ['Frutapro', 'Limon', 'Limón', 1, true, 'Ingrediente nuevo (limonada)', 'kg'],
  ['Frutapro', 'Limón', 'Limón', 1, true, 'Ingrediente nuevo (limonada)', 'kg'],
  ['Frutapro', 'Manzana golden', 'Manzana', 1, true, 'Ingrediente nuevo (crumble de manzana)', 'kg'],
  ['Frutapro', 'Manzana golden cal.18', 'Manzana', 1, true, 'Ingrediente nuevo (crumble de manzana)', 'kg'],
  ['Frutapro', 'Naranja zumo', 'Naranja', 1, true, 'Ingrediente nuevo', 'kg'],
  ['Frutapro', 'Zanahoria', 'Zanahoria', 1, true, 'Ingrediente nuevo', 'kg'],
  ['Frutapro', 'Zanahoria extra', 'Zanahoria', 1, true, 'Ingrediente nuevo', 'kg'],
  ['Frutapro', 'Espinaca', 'Espinaca', 1, true, 'Ingrediente nuevo, por bolsa', 'bolsa'],
  ['Frutapro', 'Espinaca bolsa', 'Espinaca', 1, true, 'Ingrediente nuevo, por bolsa', 'bolsa'],
  ['Frutapro', 'Perejil', 'Perejil', 1, true, 'Ingrediente nuevo, por manojo', 'manojo'],
  ['Frutapro', 'Cilantro', 'Cilantro', 1, true, 'Ingrediente nuevo, por manojo', 'manojo'],
  ['Frutapro', 'Cilantro manojo', 'Cilantro', 1, true, 'Ingrediente nuevo, por manojo', 'manojo'],
  ['Frutapro', 'Cebollino', 'Cebollino', 1, true, 'Ingrediente nuevo, por manojo', 'manojo'],
  ['Frutapro', 'Cebollino manojo', 'Cebollino', 1, true, 'Ingrediente nuevo, por manojo', 'manojo'],
  ['Frutapro', 'Hierbabuena', 'Hierbabuena', 1, true, 'Ingrediente nuevo (li-mojito, infusión)', 'manojo'],
  ['Frutapro', 'Hierbabuena manojo', 'Hierbabuena', 1, true, 'Ingrediente nuevo (li-mojito, infusión)', 'manojo'],
  // ---- HUGHES ----
  ['HUGHES', 'Tapas emp p/horno GDE', 'Tapa empanadas', 360, true, 'Caja de 30 docenas = 360 tapas'],
  ['HUGHES', 'Mendia horno grande 30 doc.(L619 VTO 19/06/28)', 'Tapa empanadas', 360, true, 'Caja de 30 docenas = 360 tapas'],
  ['HUGHES', 'Yerba krauss', 'Yerba mate', 0.5, false, 'Ingrediente nuevo (mate cocido). ¿Paquete de 500 g?', 'kg'],
  // ---- IBEROLACTAL ----
  ['IBEROLACTAL', 'Chedar rojo', 'Queso cheddar rojo', 1, true, 'kg'],
  ['IBEROLACTAL', 'AMETA CHEDDAR LONCHAS 1 KG', 'Queso cheddar rojo', 1, true, 'kg (en lonchas)'],
  ['IBEROLACTAL', 'AMETA QUESO CREMA 3 KGS', 'Queso crema', 1, true, 'Facturado por kg'],
  ['IBEROLACTAL', 'Quescrem', 'Queso crema', 1, true, 'Facturado por kg'],
  ['IBEROLACTAL', 'BRAZZALE FORMAGGIO GRATTUGIATO 1 KG', 'Queso parmesano rallado', 1, true, 'kg'],
  ['IBEROLACTAL', 'Supermix', 'Queso parmesano rallado', 1, false, '¿Qué queso es? Mismo precio que el rallado Brazzale'],
  ['IBEROLACTAL', 'Brie', 'Brie', 1, true, 'kg'],
  ['IBEROLACTAL', 'Cabra rulo', 'Rulo de cabra', 1, true, 'kg'],
  ['IBEROLACTAL', 'Emmental rallado', 'Queso emental rallado', 1, true, 'kg'],
  ['IBEROLACTAL', 'Escamas par Gran Moravia', 'Lascas de queso', 1, true, 'kg'],
  ['IBEROLACTAL', 'Mezcla 70/30 rallado', 'Muzzarella rallada', 1, true, 'kg (mezcla mozzarella/cheddar)'],
  ['IBEROLACTAL', 'Provolone dulce 5 kgs sin corteza', 'Provolone', 1, true, 'Facturado por kg'],
  ['IBEROLACTAL', 'Queso azul', 'Queso azul', 1, true, 'kg'],
  ['IBEROLACTAL', 'Mascarpone 1/2k', 'Queso mascarpone', 0.5, true, 'Tarrina de 500 g'],
  ['IBEROLACTAL', 'Feta', 'Queso feta', 1, true, 'Ingrediente nuevo', 'kg'],
  ['IBEROLACTAL', 'Nata para montar', 'Nata para montar', 1, true, 'Ingrediente nuevo, para postres (tiramisú). Se cuenta 1 unidad = 1 l: si trae otra cantidad, cambia el factor', 'l'],
  ['IBEROLACTAL', 'PASTORET YOGUR NATURAL CUBO 3,6 KGS', 'Yogur natural', 3.6, true, 'Ingrediente nuevo. Cubo de 3,6 kg', 'kg'],
  ['IBEROLACTAL', 'Yogurt 5 kg', 'Yogur natural', 1, false, 'Precio raro (5,05 por unidad): ¿por kg o por cubo de 5 kg?'],
  // ---- LOS FUENTEÑOS (vinos, por botella) ----
  ['LOS FUENTEÑOS', 'Baden Numen Ribera', 'Vino Baden Numen', 1, true, 'Ingrediente nuevo, por botella', 'botella'],
  ['LOS FUENTEÑOS', 'Baden Numen Roble', 'Vino Baden Numen', 1, true, 'Ingrediente nuevo, por botella', 'botella'],
  ['LOS FUENTEÑOS', 'Godello', 'Vino godello', 1, true, 'Ingrediente nuevo, por botella', 'botella'],
  ['LOS FUENTEÑOS', 'Lagrimas de Maria Rioja', 'Vino Lágrimas de María', 1, true, 'Ingrediente nuevo, por botella', 'botella'],
  ['LOS FUENTEÑOS', 'Ramon Bilbao crianza', 'Vino Ramón Bilbao crianza', 1, true, 'Ingrediente nuevo, por botella', 'botella'],
  ['LOS FUENTEÑOS', 'Rivasanz Rueda', 'Vino RivaSanz verdejo', 1, true, 'Ingrediente nuevo, por botella', 'botella'],
  // ---- MERCADONA ----
  ['MERCADONA', '1 PIMIENTO ROJO', 'Pimiento rojo', 1, true, 'kg'],
  ['MERCADONA', 'maíz dulce hacen 3x140', 'Maíz', 0.42, false, 'Pack 3 latas de 140 g. ¿Mismo ingrediente que el maíz congelado?'],
  ['MERCADONA', 'ZANAHORIAS', 'Zanahoria', 1, false, '¿Bolsa de 1 kg?'],
  ['MERCADONA', 'Filetes secret', 'Secreto de cerdo', 1, false, 'Menú del mediodía (más adelante). ¿Cuánto pesa cada filete?', 'kg'],
  ['MERCADONA', 'SECRETO DE CERDO', 'Secreto de cerdo', 1, true, 'Ingrediente nuevo, menú del mediodía', 'kg'],
  ['MERCADONA', 'Lenteja cocida Hacendado 570g', 'Lenteja cocida', 0.57, true, 'Ingrediente nuevo, para la Hamburguesa Veggie. Frasco de 570 g', 'kg'],
  // ---- VARIOS (compras sueltas) ----
  ['VARIOS', 'BIZCOCHOS GALLETECA', 'Bizcochos', 1, true, '1 paquete (tiramisú)'],
  ['VARIOS', 'CEBOLLA DULCE', 'Cebolla', 1, false, 'Igual que la cebolla dulce de Frutapro', 'kg'],
  ['VARIOS', 'CHOCOLATE NEGRO 85%', 'Chocolate cobertura', 0.1, false, '¿Tableta de 100 g?'],
  ['VARIOS', 'HUEVOS M SUELO', 'Huevos', 0.4, false, '¿Docena? La receta cuenta cartones de 30'],
  ['VARIOS', 'MAXI YORK', 'Jamon york', 1, false, '¿Cuánto pesa el paquete?'],
  ['VARIOS', 'QUESO EMMENTAL FRANC', 'Queso emental rallado', 1, false, '¿Cuánto pesa el paquete?'],
  ['VARIOS', 'RÚCULA', 'Rucula', 0.05, false, 'Compra suelta: ¿cuánto pesa la bolsa? Puesto 50 g'],
  ['VARIOS', 'TIRAS BACON NUESTRA', 'Bacon', 1, false, '¿Cuánto pesa el paquete?'],
  ['VARIOS', 'COSTILLAS DE CERDO', 'Costillas de cerdo', 1, true, 'Ingrediente nuevo, menú del mediodía', 'kg']
];

const PESTANA_PROPUESTA_ = 'PROPUESTA ASIGNACIONES';

/** Escribe la propuesta en su pestaña, con el precio que saldría para cada ingrediente. */
function crearPropuestaAsignaciones() {
  const ss = libro_();
  // precio medio de cada producto en FACTURAS (€ por unidad facturada)
  const med = {};
  filas_(HOJA.FACTURAS, 3).forEach(({ v }) => {
    const k = String(v[3]);
    med[k] = med[k] || { imp: 0, cant: 0, unidad: v[5] };
    med[k].imp += Number(v[6]) || 0; med[k].cant += Number(v[4]) || 0;
  });
  const ing = {};
  filas_(HOJA.INGREDIENTES).forEach(({ v }) => { ing[v[0]] = { unidad: v[2], ref: v[3] }; });
  const yaAsignado = {};
  filas_(HOJA.EQUIV).forEach(({ v }) => { yaAsignado[v[0]] = v[2]; });

  const filas = PROPUESTA_ASIG_.filter(p => med[p[1]]).map(p => {
    const [prov, prod, ingr, factor, marcada, nota, unidadNueva] = p;
    const m = med[prod];
    const porUd = m.cant ? m.imp / m.cant : '';
    const existe = ing[ingr];
    const unidad = ingr === NO_ING_ ? '' : (existe ? existe.unidad : (unidadNueva || ''));
    const resultante = ingr === NO_ING_ || !factor || porUd === '' ? '' : porUd / factor;
    const estado = yaAsignado[prod] ? 'Ya asignado a ' + yaAsignado[prod]
      : (ingr !== NO_ING_ && !existe ? 'NUEVO ingrediente' : '');
    return [marcada && !yaAsignado[prod], prod, prov, m.unidad || '', porUd, ingr, unidad, factor, resultante,
      existe && Number(existe.ref) ? Number(existe.ref) : '', estado, nota || ''];
  });
  const sinPropuesta = Object.keys(med).filter(k => !PROPUESTA_ASIG_.some(p => p[1] === k));

  let sh = ss.getSheetByName(PESTANA_PROPUESTA_);
  if (sh) sh.clear(); else sh = ss.insertSheet(PESTANA_PROPUESTA_);
  const cab = ['Cargar', 'Producto (factura)', 'Proveedor', 'Unidad factura', '€ por unidad factura', 'Ingrediente',
    'Unidad ingrediente', 'Factor (ud ingrediente por ud factura)', '€ por unidad ingrediente', 'Precio 2021', 'Estado', 'Nota / pregunta'];
  sh.getRange(1, 1, 1, cab.length).setValues([cab]).setFontWeight('bold').setWrap(true).setBackground('#f3e9d2');
  sh.setFrozenRows(1);
  if (filas.length) {
    sh.getRange(2, 1, filas.length, cab.length).setValues(filas);
    sh.getRange(2, 1, filas.length, 1).insertCheckboxes();
    sh.getRange(2, 5, filas.length, 1).setNumberFormat('#,##0.00 €');
    sh.getRange(2, 9, filas.length, 2).setNumberFormat('#,##0.00 €');
  }
  if (sinPropuesta.length) {
    sh.getRange(filas.length + 3, 2).setValue('Productos sin propuesta (nuevos en facturas): ' + sinPropuesta.join(' · '));
  }
  [60, 260, 110, 90, 90, 200, 80, 110, 100, 80, 130, 380].forEach((w, i) => sh.setColumnWidth(i + 1, w));
  ss.setActiveSheet(sh);
  return { filas: filas.length, marcadas: filas.filter(f => f[0]).length, sinPropuesta: sinPropuesta.length };
}

/** Pasa a EQUIVALENCIAS las filas marcadas y crea los ingredientes que falten. */
function cargarAsignacionesMarcadas() {
  const ss = libro_();
  const sh = ss.getSheetByName(PESTANA_PROPUESTA_);
  if (!sh) throw new Error('Primero: Escandallo → Asignaciones: crear propuesta');
  const v = sh.getRange(2, 1, Math.max(sh.getLastRow() - 1, 1), 12).getValues();

  const shI = hoja_(HOJA.INGREDIENTES);
  const ingA = shI.getRange(2, 1, shI.getMaxRows() - 1, 1).getValues();
  const ingExiste = {};
  ingA.forEach(r => { if (r[0] !== '') ingExiste[r[0]] = true; });
  let libreI = ingA.findIndex(r => r[0] === '');

  const shE = hoja_(HOJA.EQUIV);
  const eqA = shE.getRange(2, 1, shE.getMaxRows() - 1, 1).getValues().map(r => r[0]);

  pasarAKg_(['Champiñón', 'Tomate cherry', 'Acelga', 'Rucula']);
  let cargadas = 0, nuevos = 0;
  const errores = [];
  v.forEach((r, i) => {
    if (r[0] !== true) return;
    const prod = r[1], prov = r[2], ingr = String(r[5] || '').trim(), unidad = String(r[6] || '').trim();
    const factor = Number(String(r[7]).replace(',', '.'));
    if (!prod || !ingr || !(factor > 0)) { errores.push('Fila ' + (i + 2) + ': falta ingrediente o factor'); return; }
    if (ingr !== NO_ING_ && !ingExiste[ingr]) {
      if (!unidad) { errores.push('Fila ' + (i + 2) + ': el ingrediente nuevo "' + ingr + '" necesita unidad'); return; }
      if (libreI < 0) { errores.push('INGREDIENTES no tiene filas libres'); return; }
      shI.getRange(libreI + 2, 1, 1, 3).setValues([[ingr, 'Compra', unidad]]);
      ingA[libreI][0] = ingr; ingExiste[ingr] = true; nuevos++;
      libreI = ingA.findIndex(x => x[0] === '');
    }
    let fila = eqA.indexOf(prod);
    if (fila < 0) fila = eqA.indexOf('');
    if (fila < 0) { errores.push('EQUIVALENCIAS no tiene filas libres'); return; }
    shE.getRange(fila + 2, 1, 1, 4).setValues([[prod, prov, ingr, factor]]);
    eqA[fila] = prod;
    sh.getRange(i + 2, 1).setValue(false);
    sh.getRange(i + 2, 11).setValue('Cargado ' + Utilities.formatDate(new Date(), 'Europe/Madrid', 'dd/MM'));
    cargadas++;
  });
  SpreadsheetApp.flush();
  // Tiramisú: misma cantidad de nata, pero la de postres de Iberolactal (Luciana, 18/11/2026).
  if (ingExiste['Nata para montar']) {
    const shR = hoja_(HOJA.RECETAS);
    filas_(HOJA.RECETAS).forEach(({ fila, v: rv }) => {
      if (rv[0] === 'Tiramisú descafeinado' && rv[1] === 'Nata') shR.getRange(fila, 2).setValue('Nata para montar');
    });
    SpreadsheetApp.flush();
  }
  return { cargadas, nuevos, errores };
}

function crearPropuestaAsignacionesMenu() {
  const r = crearPropuestaAsignaciones();
  SpreadsheetApp.getUi().alert('Propuesta de asignaciones',
    r.filas + ' productos en la pestaña ' + PESTANA_PROPUESTA_ + '. ' + r.marcadas + ' van marcados (seguros); ' +
    'los demás tienen una pregunta en la última columna.\n\nRevisa, corrige ingrediente o factor si hace falta, marca o desmarca, ' +
    'y después: Escandallo → Asignaciones: cargar las marcadas.' +
    (r.sinPropuesta ? '\n\nHay ' + r.sinPropuesta + ' productos nuevos sin propuesta (abajo del todo).' : ''),
    SpreadsheetApp.getUi().ButtonSet.OK);
}

function cargarAsignacionesMarcadasMenu() {
  const r = cargarAsignacionesMarcadas();
  SpreadsheetApp.getUi().alert('Asignaciones cargadas',
    'Productos asignados: ' + r.cargadas + '\nIngredientes nuevos creados: ' + r.nuevos +
    (r.errores.length ? '\n\nNo se cargaron:\n' + r.errores.join('\n') : ''),
    SpreadsheetApp.getUi().ButtonSet.OK);
}

/** Champiñón, tomate cherry y acelga se compran por kg (Luciana, 18/11/2026): la unidad pasa a kg en INGREDIENTES y RECETAS.
 *  La cantidad de receta se mantiene (la quiche lleva 1 kg de champiñón o de cherry). */
function pasarAKg_(nombres) {
  const shI = hoja_(HOJA.INGREDIENTES);
  filas_(HOJA.INGREDIENTES).forEach(({ fila, v }) => {
    if (nombres.indexOf(v[0]) >= 0 && v[2] !== 'kg') shI.getRange(fila, 3).setValue('kg');
  });
  const shR = hoja_(HOJA.RECETAS);
  filas_(HOJA.RECETAS).forEach(({ fila, v }) => {
    if (nombres.indexOf(v[1]) >= 0 && v[3] !== 'kg') shR.getRange(fila, 4).setValue('kg');
  });
}
