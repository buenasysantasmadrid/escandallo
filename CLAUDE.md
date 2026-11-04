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

## Día a día

- Al abrir sesión, `.claude/inicio-sesion.ps1` hace git pull y compara Google con los archivos locales.
- Para publicar cambios: `powershell -NoProfile -ExecutionPolicy Bypass -File .claude\publicar.ps1 "descripción"`. Hace clasp push y despliega una nueva versión en la misma URL.
- `clasp push` borra en Google lo que no esté aquí. El script lo comprueba antes.

## Hojas del Sheet (fila 1 = cabecera)

- PLATOS: A plato, B categoría, C tipo (Plato/Elaboración), D rendimiento, E unidad, F coste receta, G coste/ración, H coeficiente, I PVP mín, J PVP carta, K food cost, L margen, M aviso, N coste 2021
- RECETAS: A plato, B ingrediente, C cantidad, D unidad, E €/ud, F coste, G nota
- INGREDIENTES: A nombre, B tipo (Compra/Elaboración/Fijo), C unidad, D precio ref 2021, E media del mes, F líneas del mes, G media histórica, H PRECIO USADO, I origen, J variación
- FACTURAS: A fecha, B proveedor, C nº, D producto, E cantidad, F unidad, G importe sin IVA, H ingrediente (fórmula vía EQUIVALENCIAS), I cantidad escandallo, J €/ud, K mes (aaaamm)
- EQUIVALENCIAS: A producto factura (texto exacto), B proveedor, C ingrediente, D factor
- CONFIG: B2 coeficiente (3,5), B3 IVA (10 %), B4 fecha del mes de cálculo, B5 clave aaaamm, B6 alerta de food cost

**Fórmulas:** el Sheet está en español y Google lee en español incluso lo que se escribe con `setFormula`. Desde código, escribir siempre dentro de `enIngles_(ss, fn)` (Instalar.gs), que pasa el Sheet a inglés, escribe en inglés con comas y lo devuelve a español. Para dárselas a Luciana a mano, en castellano y con `;` (SI, SUMAR.SI.CONJUNTO…). Si el Sheet ya instalado tiene fórmulas rotas, usar el menú **Escandallo → Reparar fórmulas**.

Las fórmulas están pre-rellenadas hasta abajo (PLATOS 300, RECETAS 2000, INGREDIENTES 600, FACTURAS 3000 filas). Para leer filas con datos, filtrar por la columna A (la D en FACTURAS); no usar getLastRow.

Precio del ingrediente = media ponderada del mes (Σ importe / Σ cantidad). Si no hay compras en el mes, se usa la media histórica de facturas y, si tampoco hay, el precio de referencia 2021.

## Siguiente paso: facturas del cierre de caja

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
