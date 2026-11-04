# Instrucciones generales de Luciana (todas las sesiones y proyectos)

- Luciana escribe en español: responder en español, claro y sin tecnicismos.

## Fórmulas de Google Sheets y Excel: siempre en castellano

Todas sus hojas de cálculo están en **español (España)**. Esto vale para cualquier cosa: Google Sheets, Excel o Apps Script.

- **Fórmulas que le doy para escribir o pegar a mano:** en castellano, con funciones en español y `;` entre argumentos. La coma es el separador decimal.
  - Ej.: `=SI(A2="";"";SUMAR.SI.CONJUNTO(B:B;A:A;A2))`, `=BUSCARV(A2;Hoja2!A:C;3;FALSO)`, `=SI.ERROR(...;0)`, `=Y(...)`, `=O(...)`, `=HOY()`, `=FECHA(AÑO(HOY());MES(HOY());1)`, `=CONTAR.SI.CONJUNTO(...)`, `=INDICE(...;COINCIDIR(...;...;0))`, decimales `0,1`.
- **Fórmulas escritas desde código (Apps Script `setFormula`/`setFormulas`):** en un Sheet en español van con **los nombres de las funciones en INGLÉS y los separadores en español**: `;` entre argumentos y coma decimal. Ejemplo: `=IF(A2="";"";SUMIFS(B:B;A:A;A2))`, `$J2>0,1`. Google luego las muestra en castellano.
  - Comprobado en el Sheet del ESCANDALLO: inglés con comas da `#ERROR!` y castellano con `;` (SI, SUMAR.SI.CONJUNTO) da `#NAME?`.
  - En código, tener la fórmula en inglés con comas y pasarla por una función que cambie `,` por `;` y `0.1` por `0,1` fuera de las comillas (`formulaLocal_` en ESCANDALLO/Instalar.gs).
  - No escribir fórmulas con `setValues`. No cambiar el idioma del Sheet a inglés y volver (se probó y la escritura se cortó a mitad).
  - Esto vale también para las fórmulas de formato condicional (`whenFormulaSatisfied`).
- Después de escribir fórmulas, comprobar que el resultado no tiene `#ERROR!`, `#NAME?` ni `#¿NOMBRE?`.
