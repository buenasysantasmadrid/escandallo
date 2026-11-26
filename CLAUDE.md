# ESCANDALLO · Buenas y Santas: notas para Claude

Restaurante Buenas y Santas (Madrid). La usuaria es Luciana y escribe en español: responder en español, claro y sin tecnicismos.

## Qué es

- **Google Sheet** "ESCANDALLO Buenas y Santas": https://docs.google.com/spreadsheets/d/1ZtMSucu0CDqUfKhQBhN5R67EVkVWeJLJV1nvEC1Kmq4/edit
  - El dueño es buenasysantasmadrid@gmail.com. lfisbein@gmail.com y buenasysantas9@gmail.com son editores.
- **Apps Script pegado al Sheet** (proyecto clasp en esta carpeta, rootDir = esta carpeta):
  - `Code.gs`: app web (doGet sirve `Index.html`) y la función `api()` que llama la página con `google.script.run`. Además, el menú del Sheet.
  - `Index.html`: la app para móvil y ordenador, con tres pestañas: Carta, Ingredientes y Facturas sin asignar.
  - `Instalar.gs`: `instalarEscandallo()` crea todas las pestañas con datos, fórmulas y formatos a partir de `DatosIniciales.gs`. Solo se usa la primera vez; si PLATOS ya tiene datos, no hace nada.
  - `DatosIniciales.gs`: los datos del Excel 2021, generados con `herramientas/generar_datos.py`. **No va a GitHub** porque tiene costes.
- **Acceso:** solo las cuentas de `USUARIOS_PERMITIDOS` en Code.gs (lfisbein, buenasysantasmadrid y buenasysantas9, todas @gmail.com). Sin PIN.
  - La app web es `executeAs: USER_ACCESSING` y `access: ANYONE`, o sea, cualquier usuario con cuenta de Google más la lista blanca.
- **GitHub:** https://github.com/buenasysantasmadrid/escandallo

## Primera vez (si falta .clasp.json o .git)

Ejecutar en PowerShell, en esta carpeta (Desktop\ESCANDALLO):

1. GitHub:
   `git init -b main`
   `git remote add origin https://github.com/buenasysantasmadrid/escandallo.git`
   `git pull origin main` (si el repo ya tiene algo)
   Después: `git add -A`, `git commit -m "Escandallo: app + instalador"` y `git push -u origin main`.
2. `clasp login`, si hace falta, con lfisbein o buenasysantasmadrid (las dos editan el Sheet).
3. Crear el Apps Script pegado al Sheet. **Guardar antes una copia de appsscript.json**, porque clasp create puede sobrescribirlo:
   `copy appsscript.json appsscript.json.bak`
   `clasp create --title "Escandallo" --parentId 1ZtMSucu0CDqUfKhQBhN5R67EVkVWeJLJV1nvEC1Kmq4 --rootDir .`
   `move /Y appsscript.json.bak appsscript.json` (o `git checkout appsscript.json`)
   `clasp push --force`
4. Abrir el Sheet, recargar, ir al menú **Escandallo → Instalar (solo la primera vez)** y aceptar los permisos.
5. Publicar la app: `powershell -NoProfile -ExecutionPolicy Bypass -File .claude\publicar.ps1 "primera versión"`.
   - Guarda el ID de la implementación en `.claude\implementacion.txt` e imprime la URL /exec, que hay que darle a Luciana.
6. Commit y push de `.clasp.json` y `.claude\implementacion.txt`.

## Otro ordenador (la carpeta no existe todavía)

El proyecto ya está creado: NO repetir "Primera vez". En PowerShell:

1. Instalar si faltan: Git, Node.js y clasp (`npm install -g @google/clasp`).
2. `cd $HOME\Desktop` y `git clone https://github.com/buenasysantasmadrid/escandallo.git ESCANDALLO`. Entrar en la carpeta.
3. `git config user.email "buenasysantasmadrid@gmail.com"` y `git config user.name "Buenas y Santas"`.
4. `clasp login` con lfisbein@gmail.com (es quien creó el Apps Script).
5. Instrucciones generales de Luciana (fórmulas en castellano, etc.): copiar `.claude\CLAUDE-general.md` a `%USERPROFILE%\.claude\CLAUDE.md`. Si ese archivo ya existe, añadir el contenido sin borrar lo que haya.
6. Reiniciar Claude Code en la carpeta. `.claude/inicio-sesion.ps1` trae de Google `DatosIniciales.gs`, que no está en GitHub.
7. Comprobar `clasp show-authorized-user` y que el aviso de inicio diga "Google coincide con los archivos locales".

Si se cambia algo de `%USERPROFILE%\.claude\CLAUDE.md`, copiarlo también a `.claude\CLAUDE-general.md` y hacer commit.

## Estado y pendientes (actualizar al terminar cada sesión)

Al 04/11/2026:
- Sheet instalado con las 7 pestañas. Apps Script publicado como versión 6 (URL /exec en `.claude/implementacion.txt`).
- **Fórmulas: RESUELTO y comprobado.** No queda ningún error en el Sheet. Para revisarlo otra vez, descargar el Sheet como xlsx con el conector de Google Drive y buscar celdas con `#`.
- **App en GitHub Pages (decidido: repo público).** Luciana no quiere la app en script.google.com, sino en https://buenasysantasmadrid.github.io/escandallo. Plan:
  - Página estática en `docs/index.html` (adaptada de Index.html). GitHub Pages sirve la rama main, carpeta `/docs`. Revisar que `.claspignore` no la suba a Google.
  - Inicio de sesión con Google Identity Services (botón "Entrar con Google", `accounts.google.com/gsi/client`). Da un ID token (JWT) que dura 1 hora.
  - La página llama al Apps Script con `fetch(URL_exec, {method:'POST', body: JSON.stringify({token, action, ...})})`, sin cabecera Content-Type (text/plain) para que no haya preflight de CORS.
  - Code.gs: añadir `doPost(e)`, que comprueba el token con `UrlFetchApp` en `https://oauth2.googleapis.com/tokeninfo?id_token=...` (`aud` = CLIENT_ID, `email_verified`, email en USUARIOS_PERMITIDOS) y llama a la lógica de `api()` con ese email. Devuelve JSON con ContentService.
  - appsscript.json: `executeAs: USER_DEPLOYING`, `access: ANYONE_ANONYMOUS` y añadir el scope `https://www.googleapis.com/auth/script.external_request`. `doGet` pasa a mostrar solo un enlace a la página de GitHub.
  - **Lo tiene que hacer Luciana en el navegador** (guiarla paso a paso):
    - (a) GitHub → repo → Settings → General → Change visibility → Public.
    - (b) Settings → Pages → Deploy from a branch → main, carpeta /docs.
    - (c) Google Cloud Console (buenasysantasmadrid): crear el proyecto "Escandallo", pantalla de consentimiento OAuth (External, solo email/perfil, publicar en producción) y Credentials → OAuth client ID → Web application → Authorized JavaScript origins `https://buenasysantasmadrid.github.io`. Darle a Claude el Client ID, que no es secreto.
  - Revisado antes de hacerlo público: el historial de git no tiene costes (DatosIniciales.gs, el Excel y el .zip no se suben).

Al 18/11/2026 (este ordenador enlazado; ver "Otro ordenador"):
- **Carta 2026** (PDFs `puerta_860X285_mayo2026.pdf` y `carta_bebidas_postres_a4_julio2026.pdf`): `Carta2026.gs`, menú **Escandallo → Actualizar a la carta 2026**. Quita 17 platos/elaboraciones (copia en la pestaña FUERA DE CARTA), renombra (Lomo→Bife de chorizo, Milanesa→Milanesa clásica de ternera, Raviol c/ trufa→Ravioli de calabaza, Vegetariano→Wrap vegetariano, Granjero→Entrepan Granjero Héctor…), pone PVP nuevos y añade platos nuevos y bebidas sin receta. Degustaciones = receta con 1 empanada de cada (las empanadas están en INGREDIENTES como Elaboración). Luciana tiene que lanzarlo desde el menú (decidido con ella: guardar copia, incluir bebidas, nuevos con aviso). Comprobar después que se ejecutó.
- Aviso nuevo en PLATOS: **"Falta receta"** si el coste de receta es 0 (también en DatosIniciales.gs y generar_datos.py, para que Reparar fórmulas lo mantenga). Pendiente: recetas de los platos nuevos y bebidas; calabaza en Ravioli de calabaza; ensalada de las quiches (ahora van "con ensalada").
- **GitHub Pages: código hecho** (`docs/index.html` y `doPost` en Code.gs). El repo ya es público (paso a hecho). Falta:
  - (b) y (c) de Luciana. Con el Client ID: ponerlo en `CLIENT_ID` de Code.gs y de docs/index.html; en appsscript.json `executeAs: USER_DEPLOYING`, `access: ANYONE_ANONYMOUS` y el scope `script.external_request`; publicar.ps1. Al poner CLIENT_ID, `doGet` muestra solo el enlace a GitHub.
  - Tras ese cambio, el dueño de la implementación tiene que autorizar el nuevo permiso: abrir el editor de Apps Script, ejecutar `emailDelToken_` (o cualquier función) una vez y aceptar.
- Carta 2026: la primera vez falló ("La regla de formato condicional no puede hacer referencia a una hoja diferente") antes de tocar PLATOS/RECETAS. Arreglado con INDIRECT("CONFIG!B6") (versión 9). **Comprobado el 18/11:** se aplicó bien. PLATOS tiene 83 platos y 4 elaboraciones, existe FUERA DE CARTA y no hay errores. Aviso a revisar: Helado de dulce de leche "PVP por debajo del mínimo".
- **Llave de Google: HECHA el 18/11/2026.** Proyecto "Escandallo" de Google Cloud con lfisbein@gmail.com, app publicada (en producción).
  - Marca: página principal `https://buenasysantasmadrid.github.io/escandallo/`, privacidad `docs/privacidad.html`, dominio autorizado `buenasysantasmadrid.github.io`. Sin logotipo, porque obliga a verificar.
  - Cliente web "Página GitHub", con origen `https://buenasysantasmadrid.github.io`. El CLIENT_ID está en Code.gs y en docs/index.html.
  - GitHub Pages: main, carpeta /docs (comprobado, las páginas dan 200).
  - appsscript.json: `USER_DEPLOYING`, `ANYONE_ANONYMOUS` y `script.external_request`. Publicado como versión 11; clasp está conectado como lfisbein.
  - Pendiente: lfisbein tiene que ejecutar `autorizar()` una vez en el editor de Apps Script y aceptar los permisos. Hasta entonces doPost devuelve "No tienes permiso para llamar a UrlFetchApp.fetch". Después, probar a entrar en la página de GitHub con las 3 cuentas.
- DatosIniciales.gs: la versión buena es la de Google (tiene "Falta receta"). El 18/11 se copió aquí antes de publicar. Si el aviso de inicio dice "DatosIniciales (distinto)", mirar cuál es más nuevo antes de hacer clasp push.

## Preguntas pendientes para Luciana (las va contestando poco a poco)

Cuando conteste una, aplicarla (receta, factor de EQUIVALENCIAS o precio) y borrarla de aquí. Anotar la fecha.

**Bebidas** (para hacer sus recetas cuando estén cargadas las asignaciones: Refresco lata, Cerveza San Miguel 1/3, Cerveza San Miguel 0,0 1/3, Cerveza barril San Miguel Magna (l), Café (kg), Café descafeinado (kg), Té (bolsita), Licor (botella) y los vinos por botella):
1. ¿Cuántos ml lleva la caña doble? (supuesto: 0,4 l)
2. ¿Cuántas copas salen de una botella de vino? (supuesto: 5 copas de 150 ml)
3. ¿Cuántos gramos de café lleva un café solo? ¿Y un doble? ¿Cuánta leche llevan el café con leche y el capuchino?
4. ¿Qué llevan, y cuánto, el tinto de verano, la limonada y el li-mojito?
5. ¿A quién se compran el agua, el Granini, la Quilmes, la Bailandera IPA y la San Miguel sin gluten, Selecta y Tostada? No aparecen en ninguna factura. Si no, ponerles el precio a mano.
6. ¿Para el café con licor se usa la crema de orujo Rúa Vieja? ¿Cuántos ml?

**Productos de factura sin confirmar** (en PROPUESTA ASIGNACIONES, sin marcar):
7. Croutons Atlanta: ¿cuánto pesa cada bolsa (6 por caja)?
8. Patata dipper Atlanta: ¿cuántos kg trae la caja? ¿En qué plato va?
9. Tortelloni ricotta-espinaca CBG: ¿se factura por kg o por bolsa de 3 kg?
10. Helado de vainilla y de frutos rojos (Crem de Lux): ¿envase de 2,3 l, como el de dulce de leche?
11. Pan rallado Disbesa: ¿cuántos kg trae la bolsa?
12. Tomate frito Gallina (caja) y tomate pomodoro Ginos: ¿cuántos kg traen? ¿Para qué plato son?
13. Piñones, uvas pasas y frutos secos (Disbesa): ¿cuánto traen? ¿Para qué plato son?
14. Salsa Tartufato: ¿cuánto trae el bote? ¿Se usa todavía?
15. Levadura Promolac: ¿es lo mismo que el "polvo de hornear"?
16. "TRA" y "NOJO" (Frutapro): ¿son calabaza y albahaca mal leídas?
17. Cebolla dulce (Frutapro y Varios): ¿es un ingrediente aparte o se usa como cebolla morada o cebolleta?
18. Supermix (Iberolactal): ¿qué queso es?
19. Yogur 5 kg (Iberolactal): ¿se factura por kg o por cubo?
20. Yerba Krauss (Hughes): ¿paquete de 500 g?
21. Maíz dulce Mercadona: ¿es el mismo ingrediente que el maíz congelado (para la humita)? ¿Y zanahorias de Mercadona, bolsa de 1 kg?
22. Filetes de secreto (Mercadona): ¿cuánto pesa cada filete?
23. Compras sueltas (Varios): chocolate negro 85 % (¿100 g?), huevos (¿docena?), Maxi York, queso emmental, rúcula y tiras de bacon: ¿cuánto pesa cada paquete?
24. Nata para montar Iberolactal: ¿cuántos litros trae cada unidad? (supuesto: 1 l)

**Recetas que faltan o parecen viejas:**
25. Empanadas de atún, humita y jamón y queso: sin receta (las degustaciones salen más baratas de lo que son).
26. Hamburguesa Veggie (¿hamburguesa de lentejas como elaboración?) y Hamburguesa del Corral (¿misma hamburguesa casera?).
27. Milanesas: napolitana y porteña (ternera y pollo) y clásica de pollo, sin receta. A la clásica de ternera le falta el rebozado (pan rallado, huevo).
28. Quiche de calabaza, Crumble de manzana, Ensalada Oriente vegano y Ensalada de vegetales asados: sin receta.
29. Palomitas de pollo (plato), Entraña, helados de vainilla y frutos rojos y Alfajor Havanna: sin receta.
30. Bife de chorizo: lleva solomillo y salsa 4 quesos (era el Lomo). ¿Qué corte y qué guarnición lleva ahora?
31. Ravioli de calabaza: lleva setas y nata (era el raviol con trufa). ¿Qué salsa lleva ahora?
32. Quiches "con ensalada": ¿qué ensalada y cuánto?
33. Cebolla caramelizada, salsa 4 quesos, masa de panqueque y semillas caramelizadas: ¿se compran o se hacen? Si se hacen, pasarlas a elaboración.

**Hecho sin preguntar (avisar si no le parece):** coeficiente 2,5 para los vinos y 3 para el resto de bebidas (`migraciones_` en Recetas.gs). Los platos siguen con 3,5 (CONFIG).

## Día a día

- Al abrir sesión, `.claude/inicio-sesion.ps1` hace git pull y compara Google con los archivos locales.
- Para publicar cambios: `powershell -NoProfile -ExecutionPolicy Bypass -File .claude\publicar.ps1 "descripción"`. Hace clasp push y despliega una nueva versión en la misma URL.
- `clasp push` borra en Google lo que no esté aquí. El script lo comprueba antes.
- **Después de cada cambio, hacer commit y git push sin preguntar.** Luciana no quiere tener que escribir `! git push`. Está permitido en `.claude/settings.json`. La app de GitHub Pages (docs/) solo se actualiza con el push.

## Hojas del Sheet (fila 1 = cabecera)

- PLATOS: A plato, B categoría, C tipo (Plato/Elaboración), D rendimiento, E unidad, F coste receta, G coste/ración, H coeficiente, I PVP mín, J PVP carta, K food cost, L margen, M aviso, N coste 2021
- RECETAS: A plato, B ingrediente, C cantidad, D unidad, E €/ud, F coste, G nota
- INGREDIENTES: A nombre, B tipo (Compra/Elaboración/Fijo), C unidad, D precio ref 2021, E media del mes, F líneas del mes, G media histórica, H PRECIO USADO, I origen, J variación
- FACTURAS: A fecha, B proveedor, C nº, D producto, E cantidad, F unidad, G importe sin IVA, H ingrediente (fórmula vía EQUIVALENCIAS), I cantidad escandallo, J €/ud, K mes (aaaamm)
- EQUIVALENCIAS: A producto factura (texto exacto), B proveedor, C ingrediente, D factor
- CONFIG: B2 coeficiente (3,5), B3 IVA (10 %), B4 fecha del mes de cálculo, B5 clave aaaamm, B6 alerta de food cost

**Fórmulas:** el Sheet está en español y Google lee en español incluso lo que se escribe con `setFormula`. Desde código, pasar siempre la fórmula por `formulaLocal_(f)` (Instalar.gs) antes de `setFormula`. Deja los nombres en inglés y cambia `,` por `;` (comprobado en este Sheet: las comas dan #ERROR! y los nombres en castellano dan #NAME?). Para dárselas a Luciana a mano, en castellano y con `;` (SI, SUMAR.SI.CONJUNTO…). Si el Sheet ya instalado tiene fórmulas rotas, usar el menú **Escandallo → Reparar fórmulas**.

Las fórmulas están pre-rellenadas hasta abajo (PLATOS 300, RECETAS 2000, INGREDIENTES 600, FACTURAS 3000 filas). Para leer filas con datos, filtrar por la columna A (la D en FACTURAS); no usar getLastRow.

Precio del ingrediente = media ponderada del mes (Σ importe / Σ cantidad). Si no hay compras en el mes, se usa la media histórica de facturas y, si tampoco hay, el precio de referencia 2021.

## Facturas del cierre de caja (hecho el 18/11/2026: `TraerPrecios.gs`)

- `traerFacturas()` copia a FACTURAS (A:G) las líneas nuevas de APP_Precios y de "Precios proveedores". Hay ~500 líneas, del 19/10 al 17/11.
  - Producto = "Producto" o, si está vacío, "En la factura". Importe = cantidad × precio.
  - Para no repetir líneas usa la clave proveedor + factura + fecha + producto + cantidad + importe. No usa solo proveedor + factura + producto porque hay líneas legítimas con eso repetido.
- **Desde el 26/11/2026 también trae la pestaña PRECIOS del Índice** (CIERRE-CAJA/PreciosLectura.gs, todos los proveedores menos FC VYR, Servicios y Glovo): solo los documentos que NO están ya en APP_Precios / "Precios proveedores" (por id del PDF o nº), sin las líneas con "Revisar". Cantidad en kg / l / ud (cantidad × piezas × contenido) o en piezas si no se sabe el contenido; producto = el nombre corto de PRECIOS. Así el factor de EQUIVALENCIAS de esos productos suele ser 1 (o 1000 si la receta va en g).
- Menú **Escandallo → Traer precios del cierre de caja**. `activarPreciosDiarios()` (ejecutar una vez en el editor con lfisbein) crea el disparador diario a las 6 h y acepta el permiso nuevo `script.scriptapp`.
- Después hay que asignar los productos a ingredientes (pestaña Facturas de la app → EQUIVALENCIAS, factor = unidades del escandallo por unidad facturada). Hasta entonces no cambian los precios de los ingredientes.
- **Asignaciones (18/11/2026):** `PropuestaAsignaciones.gs` tiene la propuesta para los 173 productos (ingrediente, factor y nota) con las respuestas de Luciana.
  - Respuestas: rúcula en bandeja de 50 g; champiñón, cherry y acelga por kg (manojo = kg; `pasarAKg_`); atún, caja de 16 latas; girasol, 3 garrafas; secreto y costillas para el menú del mediodía; lentejas para la Veggie.
  - Nata para montar (Iberolactal): 1 ud = 1 l. El tiramisú usa la misma cantidad, pero con este ingrediente.
  - Menú **Asignaciones: crear propuesta** → pestaña PROPUESTA ASIGNACIONES. **Asignaciones: cargar las marcadas** → EQUIVALENCIAS + ingredientes nuevos.
- **App (18/11/2026, `Recetas.gs` + docs/index.html):**
  - Editar recetas y rendimiento (acción `receta`).
  - Precio manual: INGREDIENTES L manda sobre todo y su origen sale como "Manual". `asegurarPrecioManual_` pone la columna y las fórmulas la primera vez que se cargan los datos.
  - Ingredientes nuevos (acción `nuevoIng`).
  - Precios viejos (Ref. 2021 o sin precio) en rojo, contando también lo que hay dentro de las elaboraciones. Hay filtro "Precios viejos".
  - En el detalle del plato: ✕ por línea para quitar y una fila "Añadir producto… +" (también en platos sin receta). Cada cambio guarda la receta entera.
  - Candado 🔒 = precio manual (INGREDIENTES L). Al bloquear se fija el precio que se usa ahora; al desbloquear se borra L y vuelve a las facturas. En la app se llama "Bloqueado", no "Manual".
- Lo que sigue es la idea original, como referencia:

El proyecto **CIERRE-CAJA** (Desktop\CIERRE-CAJA, `Precios.gs`) ya extrae con Claude las líneas de cada factura escaneada. Las guarda con estas columnas:
Fecha · Proveedor · Factura · En la factura · ID producto · Producto · Cantidad · Unidad · Precio (unitario sin IVA) · Precio anterior · Cambio % · Foto · Registrado

Están en dos sitios:
- La hoja de la app de **Pedidos**, pestaña **APP_Precios**: los proveedores que están en Pedidos. Su URL está en `PEDIDOS_URL_` de Precios.gs; buscar el ID del Sheet.
- El **Índice** del cierre (`INDICE_SHEET_ID_`), pestaña **"Precios proveedores"**: Frutapro y otros que no están en Pedidos.

Idea: en Code.gs, una función `traerFacturas()` con disparador diario que copie las líneas nuevas de esas dos pestañas a FACTURAS:
- Fecha, Proveedor y Factura tal cual.
- Producto = "Producto" (el nombre del catálogo, más estable que el texto de la factura).
- Cantidad y Unidad tal cual.
- Importe = Cantidad × Precio.
- Sin duplicar: usar como clave proveedor + factura + producto.

Después, asignar los productos a ingredientes desde la pestaña Facturas de la app (se rellena EQUIVALENCIAS).
