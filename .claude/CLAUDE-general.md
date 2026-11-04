# Instrucciones generales de Luciana (todas las sesiones y proyectos)

- Luciana escribe en español: responder en español, claro y sin tecnicismos.

## Fórmulas de Google Sheets y Excel: siempre en castellano

Todas sus hojas de cálculo están en **español (España)**. Esto vale para cualquier cosa: Google Sheets, Excel o Apps Script.

- **Fórmulas que le doy para escribir o pegar a mano:** en castellano, con funciones en español y `;` entre argumentos. La coma es el separador decimal.
  - Ej.: `=SI(A2="";"";SUMAR.SI.CONJUNTO(B:B;A:A;A2))`, `=BUSCARV(A2;Hoja2!A:C;3;FALSO)`, `=SI.ERROR(...;0)`, `=Y(...)`, `=O(...)`, `=HOY()`, `=FECHA(AÑO(HOY());MES(HOY());1)`, `=CONTAR.SI.CONJUNTO(...)`, `=INDICE(...;COINCIDIR(...;...;0))`, decimales `0,1`.
- **Fórmulas escritas desde código (Apps Script, API, conectores):** Google las lee en el idioma del Sheet, **también con `setFormula`/`setFormulas`** (comprobado: en inglés y con comas dan `#ERROR!`). Hay dos opciones:
  - Escribirlas en castellano con `;` y coma decimal (`=SI(A2="";"";SUMAR.SI.CONJUNTO(...))`). En código se puede tener la fórmula en inglés y traducirla antes de escribirla, como hace `formulaLocal_` en ESCANDALLO/Instalar.gs (nombres → castellano, `,` → `;`, `0.1` → `0,1`, sin tocar el texto entre comillas).
  - NO cambiar el idioma del Sheet a inglés y volver: se probó y la escritura se cortó a mitad.
  - Esto vale también para las fórmulas de formato condicional (`whenFormulaSatisfied`).
- Después de escribir fórmulas, comprobar que el resultado no tiene `#ERROR!`, `#NAME?` ni `#¿NOMBRE?`.
