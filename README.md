# Escandallo · Buenas y Santas

Escandallo de la carta en un Google Sheet, con una app web para el móvil. Los precios de los ingredientes son la **media del mes** de las facturas.

- **Google Sheet**: "ESCANDALLO Buenas y Santas", en el Drive de buenasysantasmadrid@gmail.com.
- **App**: Apps Script pegado al Sheet (`Code.gs` + `Index.html`). Solo entran lfisbein@gmail.com, buenasysantasmadrid@gmail.com y buenasysantas9@gmail.com.
- **Instalación de las pestañas y los datos**: menú del Sheet **Escandallo → Instalar (solo la primera vez)**.

## Pestañas

| Pestaña | Para qué |
|---|---|
| PLATOS | Carta: coste por ración, PVP mínimo, food cost, margen y avisos |
| RECETAS | Ingredientes y cantidades de cada plato |
| INGREDIENTES | Precio medio del mes según las facturas (o el de 2021 si aún no hay facturas) |
| FACTURAS | Líneas de factura (vendrán del cierre de caja) |
| EQUIVALENCIAS | Qué ingrediente es cada producto de factura y cuántas unidades trae |
| CONFIG | Coeficiente (3,5), IVA (10 %) y mes de cálculo |

Instrucciones técnicas (clasp, publicar y primera vez): ver `CLAUDE.md`.

`DatosIniciales.gs` y los Excel no se suben a GitHub porque tienen costes.
