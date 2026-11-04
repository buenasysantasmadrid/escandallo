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
- Sheet instalado con las 7 pestañas. Apps Script publicado como versión 5 (URL /exec en `.claude/implementacion.txt`).
- **Fórmulas:** la versión 5 las escribe traducidas al castellano. Falta que Luciana ejecute **Escandallo → Reparar fórmulas** y comprobar que no quedan `#ERROR!`. Para comprobarlo, descargar el Sheet como xlsx con el conector de Google Drive y contar las celdas con `#`.
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

**Fórmulas:** el Sheet está en español y Google lee en español incluso lo que se escribe con `setFormula`. Desde código, pasar siempre la fórmula por `formulaLocal_(f)` (Instalar.gs) antes de `setFormula`. Traduce al castellano con `;`. Si se usa una función nueva, añadirla a `FUNCIONES_ES_`. Para dárselas a Luciana a mano, en castellano y con `;` (SI, SUMAR.SI.CONJUNTO…). Si el Sheet ya instalado tiene fórmulas rotas, usar el menú **Escandallo → Reparar fórmulas**.

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
