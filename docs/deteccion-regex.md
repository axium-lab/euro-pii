# Detección por regex en TypeScript

Los patrones de las entidades del bloque 1 (sin machine learning), listos para implementar la detección en un proyecto TypeScript desde cero.

Los patrones están extraídos del código de Presidio (commit `2bb88d2`, 29 jul 2026) y **probados uno a uno en Node v25.2.1**. Alcance: Europa + Estados Unidos + genéricas. Ver [entidades.md](entidades.md) para el inventario.

---

## Los flags: qué significa `/gi` y por qué los necesitas

Un regex en TypeScript son dos cosas: el **patrón** y los **flags**. Los flags cambian el comportamiento del mismo patrón, así que copiar el patrón sin los flags correctos da resultados distintos.

```ts
const re = new RegExp(patron, 'gi');
//                             ^^ estos son los flags
```

Estos cuatro son los que te afectan. Todas las salidas de abajo son reales, ejecutadas sobre este texto:

```ts
const txt = 'nif 12345678z\nnif 87654321X'; // dos líneas, una en minúsculas
```

### `g` — global: recorre todas las coincidencias

Sin `g`, el motor se para en la primera. Y `matchAll` directamente lanza una excepción:

```ts
[...txt.matchAll(/[0-9]{8}[A-Z]/i)]
// TypeError: String.prototype.matchAll called with a non-global RegExp argument

[...txt.matchAll(/[0-9]{8}[A-Z]/gi)].map(m => m[0])
// [ '12345678z', '87654321X' ]
```

**Por qué lo necesitas:** un documento tiene varios NIF, no uno. Sin `g` detectas el primero y te quedas tan tranquilo.

### `i` — ignore case: mayúsculas y minúsculas indistintas

```ts
txt.match(/[0-9]{8}[A-Z]/g); // [ '87654321X' ]                ← pierdes uno
txt.match(/[0-9]{8}[A-Z]/gi); // [ '12345678z', '87654321X' ]   ← correcto
```

**Por qué lo necesitas, y esto es lo importante:** los patrones de esta referencia están escritos **asumiendo que el match es case-insensitive**. Por eso usan `[A-Z]` en sitios donde tienen que capturar también minúsculas. `ES_NIF` es el ejemplo perfecto: su patrón acaba en `[A-Z]`, pero un NIF escrito `12345678z` es igual de válido.

Si copias los patrones sin `i`, **la mitad de tus detecciones desaparecen** y no vas a entender por qué.

### `s` — dotAll: el punto también cruza saltos de línea

```ts
/nif.12345678z/i.test("nif\n12345678z")    // false
/nif.12345678z/is.test("nif\n12345678z")   // true
```

Por defecto, `.` significa "cualquier carácter **menos** el salto de línea". Con `s` incluye el salto.

**Por qué lo necesitas:** en texto real un identificador puede partirse entre dos líneas, sobre todo si viene de un PDF o un formulario.

### `m` — multiline: `^` y `$` valen por línea

```ts
txt.match(/^nif.*/g); // [ 'nif 12345678z' ]                    ← solo la primera línea
txt.match(/^nif.*/gm); // [ 'nif 12345678z', 'nif 87654321X' ]   ← todas
```

Sin `m`, `^` es "el principio del texto entero". Con `m` es "el principio de cada línea".

### En resumen: usa `"gsmi"`

```ts
const re = new RegExp(patron, 'gsmi');
```

Es la combinación con la que se escribieron y probaron los patrones de este documento. Ninguno de los cuatro flags es opcional si quieres el comportamiento correcto.

### La trampa de `g`: un regex con `g` guarda estado

Esta te va a morder, así que mejor saberla ahora. Un `RegExp` con el flag `g` recuerda dónde se quedó en la propiedad `lastIndex`:

```ts
const re = /[0-9]{8}[A-Z]/gi;

re.test('12345678z'); // true    lastIndex = 9
re.test('12345678z'); // false   lastIndex = 0   ← MISMO input, otro resultado
```

La segunda llamada empieza a buscar desde la posición 9, no encuentra nada, y resetea. Sin `g` no pasa:

```ts
const re2 = /[0-9]{8}[A-Z]/i;
re2.test('12345678z'); // true
re2.test('12345678z'); // true
```

**Regla práctica:** no reutilices una instancia de `RegExp` con `g` entre llamadas. O creas la instancia dentro de la función, o usas `matchAll` (que no toca el `lastIndex` del original), o pones `re.lastIndex = 0` antes de cada uso. Compartir un `RegExp` con `g` en un módulo es una de las fuentes de bugs intermitentes más habituales.

```ts
// mal: estado compartido entre llamadas
const NIF = /[0-9]{8}[A-Z]/gi;
export const tieneNif = (s: string) => NIF.test(s); // resultados alternos

// bien: matchAll no muta el original
const NIF = /[0-9]{8}[A-Z]/gi;
export const tieneNif = (s: string) => [...s.matchAll(NIF)].length > 0;
```

### El flag `u` — opcional, pero úsalo en desarrollo

`u` activa el modo unicode, que además es más estricto validando el propio patrón. De los 96 patrones de esta referencia, **91 compilan con `u` y 5 fallan**:

| Patrón              | Error con `u`              | Qué significa                                              |
| ------------------- | -------------------------- | ---------------------------------------------------------- |
| `URL` × 4           | `Invalid escape`           | contienen `\'`, un escape que en modo unicode no es válido |
| `US_DRIVER_LICENSE` | `Lone quantifier brackets` | el patrón está mal escrito (ver más abajo)                 |

Los cuatro de `URL` no los vas a usar de todas formas. Y el de `US_DRIVER_LICENSE` **es un bug real que el flag `u` te descubre**: sin `u` compila en silencio y detecta mal.

Recomendación: desarrolla con `"gsmiu"` para que los patrones mal formados fallen en voz alta, y quita la `u` solo si algún patrón que necesitas no la soporta.

---

## Cómo escribir los patrones en TypeScript

Un regex tiene barras invertidas por todas partes. En una cadena normal hay que duplicarlas, y se vuelve ilegible:

```ts
// ilegible y fácil de romper
const NIF = new RegExp('\\b[0-9]?[0-9]{7}[-]?[A-Z]\\b', 'gsmi');
```

`String.raw` toma la cadena tal cual, sin interpretar los escapes:

```ts
// legible: se copia y pega igual que está en las tablas
const NIF = new RegExp(String.raw`\b[0-9]?[0-9]{7}[-]?[A-Z]\b`, 'gsmi');
```

**Una excepción:** el patrón de `EMAIL_ADDRESS` contiene un backtick, así que con `String.raw` hay que escaparlo (`` \` ``) o volver a la cadena normal con barras dobles.

También puedes usar la sintaxis literal `/patron/gsmi`, pero entonces hay que escapar cada `/` que aparezca dentro del patrón. Con `new RegExp` y `String.raw` no.

---

## `\d`, `\w` y `\b` son ASCII en TypeScript

Los atajos no significan lo que su nombre sugiere. En TypeScript:

```
\d  =  [0-9]              solo dígitos ASCII
\w  =  [A-Za-z0-9_]       solo letras ASCII, dígitos y guion bajo
\b  =  borde de \w        y por tanto también ASCII
```

Comprobado:

```ts
/\d/.test("5")    // true
/\d/.test("٥")    // false    ← dígito árabe-índico
/\w/.test("a")    // true
/\w/.test("Ä")    // false    ← letra acentuada
/\w/.test("ñ")    // false
```

Que `\d` sea solo `[0-9]` normalmente te viene bien: un código postal alemán con dígitos árabes no es un código postal alemán. **Aun así, escribe `[0-9]` en lugar de `\d`.** No cambia el comportamiento, pero hace explícito lo que quieres y no depende de que quien lea el código sepa esto.

### Con `\w` y `\b` sí tienes un problema real

Esto rompe en español:

```ts
'España'.match(/\b\w+\b/g);
// [ 'Espa', 'a' ]     ← la ñ parte la palabra en dos
```

Y afecta a un patrón concreto de esta referencia. `DE_KFZ` (matrículas alemanas) usa `(?<![\w-])` para asegurarse de que la matrícula no viene pegada a otra palabra. Como `Ä` no es `\w`, el lookbehind no bloquea:

```ts
const kfz = /(?<![\w-])[A-ZÄÖÜ]{1,3}\s[A-Z]{1,2}\s\d{1,4}[EH]?(?!\w)/g;

'ÄÜÖÄ AB 1234'.match(kfz);
// [ 'ÜÖÄ AB 1234' ]    ← falso positivo: se ha comido la primera Ä
```

La solución es no usar el atajo y escribir la clase completa, incluyendo los caracteres acentuados que te importen:

```ts
const kfz = new RegExp(
  String.raw`(?<![A-Za-z0-9_ÄÖÜäöü-])[A-ZÄÖÜ]{1,3}\s[A-Z]{1,2}\s[0-9]{1,4}[EH]?(?![A-Za-z0-9_ÄÖÜäöü])`,
  'gsm',
);

'ÄÜÖÄ AB 1234'.match(kfz); // null              ← ya no cuela
'MÜ AB 1234'.match(kfz); // [ 'MÜ AB 1234' ]  ← la matrícula real sigue detectándose
```

Fíjate en que este patrón va sin `i`: si quieres exigir mayúsculas de verdad en una matrícula, la `i` te lo estropea. Es el único de la referencia donde conviene salirse de `"gsmi"`.

---

## Los 10 patrones que hay que retocar antes de usarlos

Diez patrones de la fuente llevan `(?i)` embebido dentro del patrón. **En TypeScript eso no es un flag, es un grupo inválido** y el regex no compila.

| Entidad             | Patrones afectados                                   |
| ------------------- | ---------------------------------------------------- |
| `URL`               | 4                                                    |
| `IT_IDENTITY_CARD`  | 3                                                    |
| `IT_FISCAL_CODE`    | 1                                                    |
| `IT_PASSPORT`       | 1                                                    |
| `IT_DRIVER_LICENSE` | 1 (y aquí está en medio del patrón, no al principio) |

La solución es quitarlo. Como ya vas a usar el flag `i`, no pierdes nada:

```ts
const source = patronOriginal.split('(?i)').join('');
const re = new RegExp(source, 'gsmi');
```

**En las tablas de este documento los patrones ya vienen sin `(?i)`**, listos para copiar. El resto de los 96 compila tal cual.

---

## El contrato de score

Un patrón no basta. Cada uno lleva un **score base** (la confianza de que la coincidencia sea de verdad esa entidad) y la validación puede **reescribir** ese score. Esta es la máquina completa:

```ts
const MIN_SCORE = 0;
const MAX_SCORE = 1.0;

/** true = confirmado · false = descartado · null = no se puede decidir */
type Validation = true | false | null;

interface Detection {
  entity: string;
  start: number;
  end: number;
  score: number;
}

function detect(
  text: string,
  pattern: { regex: RegExp; score: number },
  entity: string,
  validate: (match: string) => Validation,
): Detection[] {
  const out: Detection[] = [];

  for (const m of text.matchAll(pattern.regex)) {
    let score = pattern.score;

    const v = validate(m[0]);
    if (v === true)
      score = MAX_SCORE; // confirmado: sube al máximo
    else if (v === false) score = MIN_SCORE; // descartado

    if (score > MIN_SCORE) {
      out.push({ entity, start: m.index, end: m.index + m[0].length, score });
    }
  }
  return out;
}
```

### La escala de score, y qué significa cada etiqueta

El score es **cuánta confianza tiene la detección**: un número de 0 a 1. No dice «esto es válido», dice «me creo esto un 30%». Existe porque un patrón solo ve la forma, y la misma forma puede ser varias cosas distintas.

En las tablas de este documento cada score lleva una etiqueta al lado para no tener que interpretar el número:

| Score | Etiqueta | Qué quiere decir |
| ----- | -------- | ---------------- |
| 0.8 | **formato inequívoco** | El formato solo puede ser esta entidad. Solo lo tiene `DATE_TIME` en ISO 8601 |
| 0.6 · 0.5 | **forma específica** | La forma es propia de esta entidad. Un NIF español es 8 dígitos y una letra: poca cosa más se escribe así |
| 0.4 · 0.35 · 0.3 | **forma compartida** | Encaja, pero también encaja con otras cosas. Una matrícula alemana se parece a un código de referencia |
| 0.2 · 0.15 | **forma común** | La forma es demasiado corriente para fiarse por sí sola |
| 0.1 · 0.05 · 0.01 | **ruido sin contexto** | La forma es tan genérica que la mayoría de las coincidencias serán falsas. `US_BANK_NUMBER` es `[0-9]{8,17}`: cualquier número largo |

**Qué significa «ruido sin contexto»**, que es la etiqueta que más aparece: que el patrón encuentra sobre todo cosas que no son la entidad. `\b[0-9]{9}\b` casa un SSN, pero también un número de pedido, un importe en céntimos o un identificador interno. La detección solo vale algo si **cerca aparece una palabra clave** que confirme de qué se está hablando — «SSN», «social security», «nº de cuenta». Sin esa palabra, tíralo.

Dicho de otra forma: las entidades con esta etiqueta **no se activan solas**. O implementas la capa de palabras de contexto, o mejor no las actives.

Tres cosas más que hay que entender del código de arriba:

**1. `null` no es `false`.** Por eso el tipo es `true | false | null` y no `boolean`. Hay validaciones que no pueden confirmar ni desmentir — por ejemplo `DE_BSNR`, cuyo algoritmo de dígito de control no es público — y devuelven `null` para decir "deja el score del regex y que decida el contexto". Si modelas esto como `boolean`, `null` se convierte en `false` y pierdes esas detecciones.

**2. Un checksum válido salta a 1.0**, ignorando el score base. Por eso `ES_NIF` con score base 0.5 acaba en 1.0 cuando la letra de control cuadra: ya no es una sospecha por forma, es una confirmación.

**3. El score base sobrevive si nadie lo toca.** Un patrón con score 0.01 sigue siendo un resultado válido (`0.01 > 0`) y aparece en la salida. **Filtrar es tu decisión**: pon un umbral. Sin umbral, las entidades de score bajo te van a inundar de ruido.

### Los tres niveles de validación

En las tablas, la columna _Validación_ usa estos valores:

| Valor        | Puede devolver           | Efecto                               |
| ------------ | ------------------------ | ------------------------------------ |
| **checksum** | `true`, `false` o `null` | Confirma el hallazgo: score → 1.0    |
| **filtro**   | solo `false` o `null`    | Solo descarta basura; nunca confirma |
| **—**        | no hay validación        | El score base es el resultado final  |

La diferencia entre _checksum_ y _filtro_ es la que más se malinterpreta. `DE_BSNR` y `UK_DRIVING_LICENCE` tienen función de validación, pero **nunca devuelven `true`**: su algoritmo de dígito de control no es público, así que solo pueden rechazar formas imposibles.

### Normaliza antes de validar

Los checksums trabajan sobre la cadena sin separadores. `12345678-Z` y `12345678Z` son el mismo NIF, pero el cálculo solo funciona con el segundo:

```ts
const sanitize = (value: string) => value.replace(/[\s-]/g, '');
```

Todas las funciones de validación de abajo asumen la cadena ya normalizada.

---

## Genéricas / multipaís

| Entidad         | Regex                                                                                                                                                            | Score     | Validación                                                 |
| --------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- | ---------------------------------------------------------- |
| `CREDIT_CARD`   | `\b(?!1\d{12}(?!\d))((4\d{3})\|(5[0-5]\d{2})\|(6\d{3})\|(1\d{3})\|(3\d{3}))[- ]?(\d{3,4})[- ]?(\d{3,4})[- ]?(\d{3,5})\b`                                         | 0.3 · forma compartida | **checksum** Luhn                                          |
| `CRYPTO`        | `(bc1\|[13])[a-zA-HJ-NP-Z0-9]{25,59}`                                                                                                                            | 0.5 · forma específica | **checksum** base58check                                   |
| `EMAIL_ADDRESS` | ver el bloque debajo de la tabla | 0.5 · forma específica | **checksum** el dominio resuelve a un FQDN real |
| `IBAN_CODE`     | `(?<![A-Z0-9])([A-Z]{2}[0-9]{2}(?:[ -]?[A-Z0-9]{4}){2,6})((?:[ -]?[A-Z0-9]{4})?)((?:[ -]?[A-Z0-9]{1,3})?)(?![A-Z0-9])`                                           | 0.5 · forma específica | **checksum** módulo 97                                     |
| `IP_ADDRESS`    | 5 patrones (ver abajo)                                                                                                                                           | 0.6 / 0.1 | **filtro** parseo de la IP                                 |
| `MAC_ADDRESS`   | `\b[0-9A-Fa-f]{2}([:-])(?:[0-9A-Fa-f]{2}\1){4}[0-9A-Fa-f]{2}\b`                                                                                                  | 0.6 · forma específica | **filtro** 12 hex; rechaza `FF:…:FF` y `00:…:00`           |
| `MAC_ADDRESS`   | `\b[0-9A-Fa-f]{4}\.[0-9A-Fa-f]{4}\.[0-9A-Fa-f]{4}\b` (formato Cisco)                                                                                             | 0.6 · forma específica | misma que arriba                                                       |
| `UUID`          | `\b[0-9A-Fa-f]{8}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{12}\b`                                                                                | 0.5 · forma específica | **filtro** version + variant RFC 4122; rechaza el nil UUID |
| `URL`           | `(?:https?://)` + lista de TLD                                                                                                                                   | 0.6 · forma específica | —                                                          |
| `DATE_TIME`     | 13 patrones (ver abajo)                                                                                                                                          | 0.8 → 0.1 | —                                                          |
| `PHONE_NUMBER`  | _no usa regex_                                                                                                                                                   | —         | librería de teléfonos                                      |

En `MAC_ADDRESS` fíjate en el `\1`: es una **referencia al grupo capturado**. `([:-])` captura el separador y `\1` exige que los siguientes sean el mismo. Así `AA:BB:CC:DD:EE:FF` vale y `AA:BB-CC:DD-EE:FF` no.

El patrón de `EMAIL_ADDRESS` va aparte porque contiene asteriscos y backticks que un formateador de markdown puede destrozar dentro de una tabla:

```
\b((([!#$%&'*+\-/=?^_`{|}~\w])|([!#$%&'*+\-/=?^_`{|}~\w][!#$%&'*+\-/=?^_`{|}~\.\w]{0,}[!#$%&'*+\-/=?^_`{|}~\w]))[@]\w+(?:-+\w+)*(?:\.\w+(?:-+\w+)*)+)\b
```

### Luhn — lo necesitas cinco veces

Lo usan `CREDIT_CARD`, `MEDICAL_LICENSE`, `US_NPI`, `SE_PERSONNUMMER` y `SE_ORGANISATIONSNUMMER`. Escríbelo una vez:

```ts
export function luhnValid(digits: string): boolean {
  let sum = 0;
  const d = [...digits].reverse();

  for (let i = 0; i < d.length; i++) {
    const n = Number(d[i]);
    if (Number.isNaN(n)) return false;
    if (i % 2 === 1) {
      const doubled = n * 2;
      sum += doubled > 9 ? doubled - 9 : doubled; // 12 -> 3, 18 -> 9
    } else {
      sum += n;
    }
  }
  return sum % 10 === 0;
}

luhnValid('4539148803436467'); // true
luhnValid('4539148803436468'); // false
```

### `IBAN_CODE` — cuidado, aquí TypeScript te traiciona

Es la entidad con mejor relación coste/beneficio: un patrón y un cálculo te cubren 76 países. Pero tiene una trampa que no tiene ninguna otra.

El algoritmo es: mover los 4 primeros caracteres al final, convertir letras en números (`A`=10 … `Z`=35), y el número resultante **dividido por 97 debe dar resto 1**. El problema es el tamaño de ese número:

```
número a dividir : 21000418450200051332142891   (26 dígitos)
Number.MAX_SAFE_INTEGER : 9007199254740991      (16 dígitos)
```

Lo obvio no funciona:

```ts
Number('21000418450200051332142891') % 97;
// 13        ← MAL, debería ser 1

Number('21000418450200051332142891');
// 2.100041845020005e+25   ← ya no es el mismo número
```

TypeScript convierte a coma flotante y **pierde los dígitos del final** — justo los que determinan el resto. No lanza ningún error: devuelve un número equivocado en silencio.

Dos formas correctas:

```ts
// (a) BigInt — más legible
Number(BigInt('21000418450200051332142891') % 97n); // 1

// (b) resto por bloques — sin BigInt, nunca desborda
function mod97(numericStr: string): number {
  let remainder = 0;
  for (const ch of numericStr) remainder = (remainder * 10 + Number(ch)) % 97;
  return remainder; // 1
}
```

La versión (b) funciona porque `remainder` nunca pasa de 96, así que `remainder * 10 + 9` como máximo llega a 969. Jamás se acerca al límite.

Implementación completa:

```ts
const IBAN_LENGTHS: Record<string, number> = {
  ES: 24,
  DE: 22,
  FI: 18,
  PL: 28,
  SE: 24,
  IT: 27,
  GB: 22,
  // …76 países en total
};

export function ibanValid(raw: string): boolean {
  const iban = raw.replace(/[\s-]/g, '').toUpperCase();
  if (!/^[A-Z]{2}[0-9]{2}[A-Z0-9]+$/.test(iban)) return false;

  // la longitud es fija por país: filtra antes de calcular
  const expected = IBAN_LENGTHS[iban.slice(0, 2)];
  if (expected !== undefined && iban.length !== expected) return false;

  const rearranged = iban.slice(4) + iban.slice(0, 4);
  const numeric = [...rearranged]
    .map((c) => (c >= 'A' && c <= 'Z' ? String(c.charCodeAt(0) - 55) : c))
    .join('');

  return mod97(numeric) === 1;
}

ibanValid('ES9121000418450200051332'); // true
ibanValid('ES9121000418450200051333'); // false
```

### `IP_ADDRESS` — mejor no replicar los 5 patrones

```
IPv4               0.6   \b(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(?:…){3}…(?:/(?:[0-2]?\d|3[0-2]))?\b
IPv4_mapped        0.6   (?<![\w:])::(?:ffff(?::0{1,4})?:)?(?:(?:25[0-5]|…)\.){3}…
IPv4_embedded      0.6   (?<![\w:])(?:(?:[0-9A-Fa-f]{1,4}:){1,5}:…
IPv6               0.6   (?<![\w:])(?:(?:[0-9A-Fa-f]{1,4}:){7}[0-9A-Fa-f]{1,4}|…
IPv6_unspecified   0.1   (?<![\w:])::(?:/(?:12[0-8]|1[01]\d|[1-9]?\d))?(?![\w:])
```

Los lookbehind `(?<!…)` funcionan en TypeScript desde ES2018, así que compilan sin problema. Pero es más mantenible detectar candidatos con un patrón laxo y validarlos con un parser de IP de verdad: es lo que hace el paso de filtro.

### `URL` — no copies este patrón

El patrón real es una alternancia literal de **más de 600 TLD escritos a mano**, unos 8 KB en una sola línea. Tres razones para no usarlo: es incompleto por construcción (los TLD cambian), ya contiene duplicados (`com`, `onl`, `pro`, `red`, `tel`, `uno` aparecen dos veces) y **no compila con el flag `u`**.

Alternativa: un patrón laxo para el host más validación contra la Public Suffix List.

### `DATE_TIME` — 13 patrones sin validación

Sin validación, el score base es el resultado final.

| Formato                   | Patrón                                                                                                                 | Score |
| ------------------------- | ---------------------------------------------------------------------------------------------------------------------- | ----- |
| ISO 8601 con zona         | `\b(?:(\d{4}-(?:0[1-9]\|1[0-2])-(?:0[1-9]\|[12]\d\|3[01])T[0-2]\d:[0-5]\d:[0-5]\d\.\d+([+-][0-2]\d:[0-5]\d\|Z))\|…)\b` | 0.8 · formato inequívoco |
| `mm/dd/yyyy` o `mm/dd/yy` | `\b(([1-9]\|0[1-9]\|1[0-2])/([1-9]\|0[1-9]\|[1-2][0-9]\|3[0-1])/(\d{4}\|\d{2}))\b`                                     | 0.6 · forma específica |
| `dd/mm/yyyy` o `dd/mm/yy` | `\b(([1-9]\|0[1-9]\|[1-2][0-9]\|3[0-1])/([1-9]\|0[1-9]\|1[0-2])/(\d{4}\|\d{2}))\b`                                     | 0.6 · forma específica |
| `yyyy/mm/dd`              | `\b(\d{4}/([1-9]\|0[1-9]\|1[0-2])/([1-9]\|0[1-9]\|[1-2][0-9]\|3[0-1]))\b`                                              | 0.6 · forma específica |
| `mm-dd-yyyy`              | `\b(([1-9]\|0[1-9]\|1[0-2])-([1-9]\|0[1-9]\|[1-2][0-9]\|3[0-1])-\d{4})\b`                                              | 0.6 · forma específica |
| `dd-mm-yyyy`              | `\b(([1-9]\|0[1-9]\|[1-2][0-9]\|3[0-1])-([1-9]\|0[1-9]\|1[0-2])-\d{4})\b`                                              | 0.6 · forma específica |
| `yyyy-mm-dd`              | `\b(\d{4}-([1-9]\|0[1-9]\|1[0-2])-([1-9]\|0[1-9]\|[1-2][0-9]\|3[0-1]))\b`                                              | 0.6 · forma específica |
| `dd.mm.yyyy` o `dd.mm.yy` | `\b(([1-9]\|0[1-9]\|[1-2][0-9]\|3[0-1])\.([1-9]\|0[1-9]\|1[0-2])\.(\d{4}\|\d{2}))\b`                                   | 0.6 · forma específica |
| `dd-MMM-yyyy`             | `\b(([1-9]\|0[1-9]\|[1-2][0-9]\|3[0-1])-(JAN\|FEB\|…\|DEC)-(\d{4}\|\d{2}))\b`                                          | 0.6 · forma específica |
| `MMM-yyyy`                | `\b((JAN\|FEB\|…\|DEC)-(\d{4}\|\d{2}))\b`                                                                              | 0.6 · forma específica |
| `dd-MMM`                  | `\b(([1-9]\|0[1-9]\|[1-2][0-9]\|3[0-1])-(JAN\|FEB\|…\|DEC))\b`                                                         | 0.6 · forma específica |
| `mm/yyyy`                 | `\b(([1-9]\|0[1-9]\|1[0-2])/\d{4})\b`                                                                                  | 0.2 · forma común |
| `mm/yy`                   | `\b(([1-9]\|0[1-9]\|1[0-2])/\d{2})\b`                                                                                  | 0.1 · ruido sin contexto |

Dos cosas que hay que decidir tú:

- **`mm/dd` y `dd/mm` son el mismo patrón con los grupos intercambiados y el mismo score 0.6.** No hay forma de desambiguarlos: `03/04/2026` es el 3 de abril o el 4 de marzo según el país. Se emiten los dos. Si tu proyecto es español, quédate solo con `dd/mm`.
- **Los meses en texto solo están en inglés.** `15-ENE-2026` no se detecta. Si lo necesitas, añade los meses españoles a la alternancia.

---

## España

| Entidad       | Regex                               | Score    | Validación                                |
| ------------- | ----------------------------------- | -------- | ----------------------------------------- |
| `ES_NIF`      | `\b[0-9]?[0-9]{7}[-]?[A-Z]\b`       | 0.5 · forma específica | **checksum** letra de control             |
| `ES_NIE`      | `\b[X-Z]?[0-9]?[0-9]{7}[-]?[A-Z]\b` | 0.5 · forma específica | **checksum** letra de control con prefijo |
| `ES_PASSPORT` | `\b[A-Z]{3}[0-9]{6}\b`              | **0.05** · ruido sin contexto | —                                         |

```ts
const CONTROL = 'TRWAGMYFPDXBNJZSQVHLCKE';

export function nifValid(raw: string): boolean {
  const text = sanitize(raw).toUpperCase();
  const numero = Number(text.replace(/\D/g, ''));   // se queda solo con los dígitos
  return text.at(-1) === CONTROL[numero % 23];
}

export function nieValid(raw: string): boolean {
  const text = sanitize(raw).toUpperCase();

  if (!'XYZ'.includes(text[0])) return false;
  if (!/^[0-9]+$/.test(text.slice(1, -1))) return false;
  if (text.length < 8 || text.length > 9) return false;

  // X -> 0, Y -> 1, Z -> 2, y luego el mismo cálculo que el NIF
  const numero = Number(String('XYZ'.indexOf(text[0])) + text.slice(1, -1));
  return text.at(-1) === CONTROL[numero % 23];
}
```

Verificado:

```ts
nifValid('12345678Z'); // true
nifValid('12345678A'); // false   ← la letra no cuadra
nifValid('87654321X'); // true
```

**Los dos patrones se solapan.** `ES_NIE` lleva el prefijo **opcional** (`[X-Z]?`), así que también casa un NIF normal:

```ts
'12345678Z'.match(NIE_REGEX); // [ '12345678Z' ]   ← casa, pero no es un NIE
```

Lo salva `nieValid`, que exige que el primer carácter sea `X`, `Y` o `Z` y devuelve `false`. **Si te saltas la validación, el mismo número aparece etiquetado como dos entidades distintas.** Es el mejor argumento para no tratar la validación como opcional.

**`ES_PASSPORT` tiene score base 0.05 y ninguna validación.** Con el flag `i`, `\b[A-Z]{3}[0-9]{6}\b` casa también `abc123456`: cualquier referencia de pedido o código de producto con tres letras y seis dígitos. Sin palabras de contexto que lo suban, es ruido con etiqueta. Considera no activarlo.

---

## Alemania

| Entidad               | Regex                                                                                         | Score     | Validación                                     |
| --------------------- | --------------------------------------------------------------------------------------------- | --------- | ---------------------------------------------- |
| `DE_BSNR`             | `\b\d{9}\b`                                                                                   | 0.2 · forma común | **filtro** longitud y no todo ceros            |
| `DE_LANR`             | `\b\d{9}\b`                                                                                   | 0.3 · forma compartida | **checksum** pesos `[4,9,4,9,4,9]`             |
| `DE_HEALTH_INSURANCE` | `\b[A-Z]\d{9}\b`                                                                              | 0.3 · forma compartida | **checksum** GKV                               |
| `DE_ID_CARD`          | `\b[CFGHJKLMNPRTVWXYZ][CFGHJKLMNPRTVWXYZ0-9]{7}[0-9]\b`                                       | 0.4 · forma compartida | **checksum** pesos `7,3,1` mod 10              |
| `DE_ID_CARD`          | `\bT\d{8}\b` (formato antiguo)                                                                | 0.5 · forma específica | misma que arriba                                           |
| `DE_PASSPORT`         | `\b[CFGHJKLMNPRTVWXYZ][CFGHJKLMNPRTVWXYZ0-9]{7}[0-9]\b`                                       | 0.4 · forma compartida | **checksum** pesos `7,3,1` mod 10              |
| `DE_SOCIAL_SECURITY`  | `\b\d{2}(0[1-9]\|[12]\d\|3[01]\|5[1-9]\|[67]\d\|8[01])(0[1-9]\|1[0-2])\d{2}[A-Z]\d{2}[0-9]\b` | 0.5 · forma específica | **checksum** pesos `[2,1,2,5,7,1,2,1,2,1,2,1]` |
| `DE_SOCIAL_SECURITY`  | `\b\d{8}[A-Z]\d{3}\b` (relajado)                                                              | 0.3 · forma compartida | misma que arriba                                           |
| `DE_TAX_ID`           | `\b[1-9]\d{10}\b`                                                                             | 0.5 · forma específica | **checksum** ISO 7064 Mod 11,10                |
| `DE_VAT_ID`           | `\bDE\d{9}\b`                                                                                 | 0.5 · forma específica | **checksum** ISO 7064 Mod 11,10                |
| `DE_VAT_ID`           | `\bDE[\s.\-]?\d{3}[\s.\-]?\d{3}[\s.\-]?\d{3}\b`                                               | 0.4 · forma compartida | misma que arriba                                           |
| `DE_FUEHRERSCHEIN`    | `\b[A-Z]{2}\d{8}[A-Z0-9]\b`                                                                   | 0.35 · forma compartida | —                                              |
| `DE_HANDELSREGISTER`  | `\bHR[AB]\s*\d{1,6}\b`                                                                        | 0.5 · forma específica | —                                              |
| `DE_TAX_NUMBER`       | `\b(0[1-9]\|1[0-6])\d{11}\b`                                                                  | 0.5 · forma específica | —                                              |
| `DE_TAX_NUMBER`       | `(?<!\w)\d{3}/\d{3}/\d{5}(?!\w)`                                                              | 0.4 · forma compartida | —                                              |
| `DE_TAX_NUMBER`       | `(?<!\w)\d{2,3}/\d{3,4}/\d{4,5}(?!\w)`                                                        | 0.2 · forma común | —                                              |
| `DE_PLZ`              | `\b(?!01000\b\|99999\b)(0[1-9]\d{3}\|[1-9]\d{4})\b`                                           | **0.05** · ruido sin contexto | —                                              |
| `DE_KFZ`              | 5 variantes de separador                                                                      | 0.3 / 0.2 | —                                              |

### Dos colisiones que el regex no puede resolver

**`DE_BSNR` y `DE_LANR` usan exactamente el mismo patrón: `\b\d{9}\b`.** Nueve dígitos sueltos. Son cosas distintas — la BSNR identifica un centro médico, la LANR un médico — y no hay forma de distinguirlas por forma. La única diferencia:

```ts
// DE_LANR: checksum de verdad, puede confirmar
export function lanrValid(text: string): boolean {
  const WEIGHTS = [4, 9, 4, 9, 4, 9];
  const total = WEIGHTS.reduce((acc, w, i) => acc + Number(text[i]) * w, 0);
  return total % 10 === Number(text[6]); // el 7º dígito es el de control
}

// DE_BSNR: solo puede rechazar. Nunca devuelve true.
export function bsnrCheck(raw: string): Validation {
  const text = raw.trim();
  if (text.length !== 9 || !/^[0-9]+$/.test(text)) return false;
  if (text === '000000000') return false;
  return null; // plausible: deja el score base y que decida el contexto
}
```

**`DE_ID_CARD` y `DE_PASSPORT` también comparten patrón**, carácter por carácter, con el mismo checksum y el mismo score 0.4. Indistinguibles. `DE_ID_CARD` añade `\bT\d{8}\b`, que sí es exclusivo suyo.

```ts
// pesos 7,3,1 sobre los 8 primeros caracteres. Vale para DE_ID_CARD y DE_PASSPORT
export function icao731Valid(text: string): boolean {
  const WEIGHTS = [7, 3, 1];
  const charValue = (c: string) =>
    c >= '0' && c <= '9' ? Number(c) : c.charCodeAt(0) - 55; // A=10 … Z=35

  let total = 0;
  for (let i = 0; i < 8; i++) total += charValue(text[i]) * WEIGHTS[i % 3];
  return total % 10 === Number(text.at(-1));
}
```

**Consecuencia práctica:** si activas los cuatro, un número de nueve dígitos genera **dos detecciones solapadas** y uno con formato ICAO otras dos. Necesitas una política de resolución: quedarte con el score más alto, o con la que tenga palabras de contexto cerca.

### `DE_TAX_ID` — ISO 7064 Mod 11,10

```ts
export function deTaxIdValid(text: string): boolean {
  if (text.length !== 11 || !/^[0-9]+$/.test(text)) return false;
  if (text[0] === '0') return false;

  const digits = [...text].map(Number);

  // regla poco conocida: ningún dígito puede repetirse más de 3 veces
  const counts = new Map<number, number>();
  for (const d of digits.slice(0, 10)) counts.set(d, (counts.get(d) ?? 0) + 1);
  if (Math.max(...counts.values()) > 3) return false;

  let product = 10;
  for (let i = 0; i < 10; i++) {
    let total = (digits[i] + product) % 10;
    if (total === 0) total = 10;
    product = (total * 2) % 11;
  }
  let check = 11 - product;
  if (check === 10) check = 0;

  return check === digits[10];
}
```

### `DE_VAT_ID` — decide tú si el checksum descarta

El original acepta un parámetro `strict_checksum` que **por defecto está desactivado**: cuando el checksum falla devuelve `null` en lugar de `false`. Traducido, **un NIF-IVA alemán con dígito de control incorrecto sigue apareciendo como detección** con su score de 0.5.

Si quieres precisión, usa el modo estricto:

```ts
export const deVatIdCheck = (text: string, strict = true): Validation => {
  const ok = deTaxIdValid(text.slice(2)); // quita el prefijo "DE"
  return ok ? true : strict ? false : null;
};
```

### `DE_KFZ` — matrículas

```
(?<![\w-])[A-ZÄÖÜ]{1,3}\s[A-Z]{1,2}\s\d{1,4}[EH]?(?!\w)      0.3  espacios
(?<![\w-])[A-ZÄÖÜ]{1,3}-[A-Z]{1,2}-\d{1,4}[EH]?(?!\w)        0.3  guiones
(?<![\w-])[A-ZÄÖÜ]{1,3}-[A-Z]{1,2}\s\d{1,4}[EH]?(?!\w)       0.3  mixto
(?<![\w-])[A-Z]{1,3}\s[A-Z]{1,2}\s\d{1,4}[EH]?(?!\w)         0.2  sin umlaut
(?<![\w-])[A-Z]{1,3}-[A-Z]{1,2}\s\d{1,4}[EH]?(?!\w)          0.2  sin umlaut
```

El sufijo `[EH]?` marca vehículo eléctrico (`E`) o histórico (`H`). **Este es el patrón que hay que arreglar por el tema de `\w`** — ver la sección de arriba.

### `DE_PLZ` — score 0.05

Cinco dígitos, con `01000` y `99999` excluidos por lookahead negativo. Pero cinco dígitos son cinco dígitos: importes, años, referencias. El 0.05 es la forma de decirte que sin contexto no vale nada.

---

## Reino Unido

| Entidad                   | Regex                                                                                                                                                                                           | Score | Validación                                   |
| ------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----- | -------------------------------------------- |
| `UK_NHS`                  | `\b([0-9]{3})[- ]?([0-9]{3})[- ]?([0-9]{4})\b`                                                                                                                                                  | 0.5 · forma específica | **checksum** módulo 11                       |
| `UK_NINO`                 | `\b(?!bg\|gb\|nk\|kn\|nt\|tn\|zz\|BG\|GB\|NK\|KN\|NT\|TN\|ZZ) ?([a-ceghj-pr-tw-zA-CEGHJ-PR-TW-Z]{1}[a-ceghj-npr-tw-zA-CEGHJ-NPR-TW-Z]{1}) ?([0-9]{2}) ?([0-9]{2}) ?([0-9]{2}) ?([a-dA-D]{1})\b` | 0.5 · forma específica | —                                            |
| `UK_DRIVING_LICENCE`      | `\b[A-Z9]{5}[0-9](?:0[1-9]\|1[0-2]\|5[1-9]\|6[0-2])(?:0[1-9]\|[12][0-9]\|3[01])[0-9][A-Z9]{2}[A-Z0-9][A-Z]{2}\b`                                                                                | 0.5 · forma específica | **filtro** rechaza apellido `99999`          |
| `UK_VEHICLE_REGISTRATION` | `\b[A-HJ-PR-Y][A-HJ-PR-Y](?:0[1-9]\|[1-7][0-9])[- ]?[A-HJ-PR-Z]{3}\b` (actual)                                                                                                                  | 0.3 · forma compartida | **checksum** rango del identificador de edad |
| `UK_VEHICLE_REGISTRATION` | `\b[A-HJ-NPR-TV-Y]\d{1,3}[- ]?[A-HJ-PR-Y][A-HJ-PR-Z]{2}\b` (prefijo)                                                                                                                            | 0.2 · forma común | **filtro** devuelve `null`                   |
| `UK_VEHICLE_REGISTRATION` | `\b[A-HJ-PR-Z]{3}[- ]?\d{1,3}[- ]?[A-HJ-NPR-TV-Y]\b` (sufijo)                                                                                                                                   | 0.15 · forma común | **filtro** devuelve `null`                   |
| `UK_PASSPORT`             | `\b[A-Z]{2}\d{7}\b`                                                                                                                                                                             | 0.1 · ruido sin contexto | —                                            |
| `UK_POSTCODE`             | 5 alternativas (ver abajo)                                                                                                                                                                      | 0.1 · ruido sin contexto | —                                            |

**`UK_NINO` es el patrón mejor construido de toda la referencia, y merece la pena estudiarlo** porque enseña la técnica que deberías usar en tus propios patrones: meter la especificación **dentro** del regex en lugar de validarla después.

- `(?!bg|gb|nk|kn|nt|tn|zz|…)` — lookahead negativo que descarta los prefijos prohibidos.
- `[a-ceghj-pr-tw-z]` — primera letra: excluye `d`, `f`, `i`, `q`, `u`, `v`.
- `[a-ceghj-npr-tw-z]` — segunda letra: excluye además la `o`.
- `[a-dA-D]` — el sufijo solo puede ser `A`–`D`.
- ` ?` entre cada grupo — espacios opcionales.

Por eso no necesita función de validación: no hay nada que validar que no esté ya en el patrón. Enumera ambas cajas explícitamente, así que funciona igual con `i` o sin ella.

**`UK_NHS` — módulo 11:**

```ts
export function nhsValid(raw: string): boolean {
  const text = sanitize(raw);
  if (text.length !== 10 || !/^[0-9]+$/.test(text)) return false;

  // multiplicadores 10, 9, 8 … 1
  let total = 0;
  for (let i = 0; i < 10; i++) total += Number(text[i]) * (10 - i);
  return total % 11 === 0;
}
```

**`UK_DRIVING_LICENCE` no valida el dígito de control** porque el algoritmo del DVLA no es público. Solo puede rechazar:

```ts
export function drivingLicenceCheck(raw: string): Validation {
  const surname = raw.toUpperCase().slice(0, 5);
  if (surname === '99999') return false;
  if (!/^[A-Z]+9*$/.test(surname)) return false; // los 9 de relleno van al final
  return null; // nunca true
}
```

Lo que sí codifica el patrón es la fecha de nacimiento embebida: `(?:0[1-9]|1[0-2]|5[1-9]|6[0-2])` es el mes, y `51`–`62` marcan a las mujeres (mes + 50).

**`UK_VEHICLE_REGISTRATION` solo valida el formato actual**: el identificador de edad debe estar en `02`–`29` (matriculaciones de marzo) o `51`–`79` (septiembre). Para los formatos prefijo y sufijo devuelve `null` y se quedan con 0.2 y 0.15.

### `UK_POSTCODE`

```
\b(
  GIR\s?0AA
 |[A-PR-UWYZ][0-9][ABCDEFGHJKPSTUW]?\s?[0-9][ABD-HJLNP-UW-Z]{2}
 |[A-PR-UWYZ][0-9]{2}\s?[0-9][ABD-HJLNP-UW-Z]{2}
 |[A-PR-UWYZ][A-HK-Y][0-9][ABEHMNPRVWXY]?\s?[0-9][ABD-HJLNP-UW-Z]{2}
 |[A-PR-UWYZ][A-HK-Y][0-9]{2}\s?[0-9][ABD-HJLNP-UW-Z]{2}
)\b
```

Los charsets restringidos excluyen las letras que Royal Mail nunca usa en cada posición. Misma técnica que `UK_NINO`. Aun así el score es 0.1, porque un código postal británico se parece mucho a una referencia alfanumérica cualquiera.

---

## Italia

| Entidad             | Regex                                                                | Score    | Validación                          |
| ------------------- | -------------------------------------------------------------------- | -------- | ----------------------------------- |
| `IT_FISCAL_CODE`    | ver abajo                                                            | 0.3 · forma compartida | **checksum** mapas par/impar mod 26 |
| `IT_VAT_CODE`       | `\b([0-9][ _]?){11}\b`                                               | **0.1** · ruido sin contexto | **checksum** dígito de control      |
| `IT_DRIVER_LICENSE` | `\b(([A-Z]{2}\d{7}[A-Z])\|(U1[BCDEFGHLJKMNPRSTUWYXZ0-9]{7}[A-Z]))\b` | 0.2 · forma común | —                                   |
| `IT_IDENTITY_CARD`  | `\b[A-Z]{2}\s?\d{7}\b` (papel)                                       | **0.01** · ruido sin contexto | —                                   |
| `IT_IDENTITY_CARD`  | `\b\d{7}[A-Z]{2}\b` (CIE 2.0)                                        | **0.01** · ruido sin contexto | —                                   |
| `IT_IDENTITY_CARD`  | `\b[A-Z]{2}\d{5}[A-Z]{2}\b` (CIE 3.0)                                | **0.01** · ruido sin contexto | —                                   |
| `IT_PASSPORT`       | `\b[A-Z]{2}\d{7}\b`                                                  | **0.01** · ruido sin contexto | —                                   |

Estos seis son los patrones italianos que llevaban `(?i)`. **En la tabla ya vienen sin él.**

El _codice fiscale_ es el patrón más elaborado de la referencia. Codifica el charset de consonantes y vocales del apellido y el nombre, y el mes-día con la sustitución de dígitos por letras (`L`=0, `M`=1, `N`=2, `P`=3…) que usa el sistema italiano:

```
((?:[A-Z][AEIOU][AEIOUX]|[AEIOU]X{2}|[B-DF-HJ-NP-TV-Z]{2}[A-Z]){2}
(?:[\dLMNP-V]{2}(?:[A-EHLMPR-T](?:[04LQ][1-9MNP-V]|[15MR][\dLMNP-V]
|[26NS][0-8LMNP-U])|[DHPS][37PT][0L]|[ACELMRT][37PT][01LM]
|[AC-EHLMPR-T][26NS][9V])|(?:[02468LNQSU][048LQU]
|[13579MPRTV][26NS])B[26NS][9V])(?:[A-MZ][1-9MNP-V][\dLMNP-V]{2}
|[A-M][0L](?:[1-9MNP-V][\dLMNP-V]|[0L][1-9MNP-V]))[A-Z])
```

Su checksum usa **dos tablas de conversión**, una para las posiciones impares y otra para las pares. La de posiciones pares no hace falta escribirla: es la posición del carácter en el alfabeto.

```ts
/** posición alfanumérica: '0'..'9' → 0..9 · 'A'..'Z' → 0..25 */
const idx = (c: string) => (c <= "9" ? c.charCodeAt(0) - 48 : c.charCodeAt(0) - 65);

/** posiciones pares: el valor ES la posición, sin tabla */
const even = idx;

/**
 * Posiciones impares: la especificación italiana define una tabla arbitraria,
 * sin fórmula. Se comprime a 26 letras, una por posición: la letra en la
 * posición N codifica el valor (A=0, B=1, … Z=25).
 *
 *   posición 0 → 'B' → 1      posición 1 → 'A' → 0
 *   posición 2 → 'F' → 5      posición 3 → 'H' → 7
 */
const ODD_TABLE = "BAFHJNPRTVCESULDGIMOQKWZYX";
const odd = (c: string) => ODD_TABLE.charCodeAt(idx(c)) - 65;

const LETRAS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

export function fiscalCodeValid(raw: string): boolean {
  const text = raw.toUpperCase();
  if (!/^[A-Z0-9]{16}$/.test(text)) return false;   // valida el charset y la longitud de golpe

  let sum = 0;
  for (let i = 0; i < 15; i++) {
    sum += i % 2 === 0 ? odd(text[i]) : even(text[i]);
  }
  return LETRAS[sum % 26] === text[15];
}
```

Comprobado contra los casos de prueba de Presidio: `AAAAAA00B11C333Y` da `true` y `AAAAAA00B11C333N` da `false`, que es exactamente lo que esperan sus tests.

Nota sobre `ODD_TABLE`: comprime 36 entradas a 26 caracteres, pero pierde legibilidad frente a una tabla explícita. Si prefieres claridad sobre brevedad, escribe el objeto entero — el resultado es idéntico, verificado carácter a carácter en los 36 posibles. Lo que **no** merece la pena es escribir la tabla de posiciones pares: ahí sí es pura fórmula.

**Tres entidades colisionan aquí, y una de ellas es británica.** El carné en papel (`[A-Z]{2}\s?\d{7}`), el pasaporte italiano (`[A-Z]{2}\d{7}`) y `UK_PASSPORT` (`\b[A-Z]{2}\d{7}\b`) casan con la misma cadena. Ninguno tiene validación. Si activas Italia y Reino Unido a la vez, `AB1234567` te devuelve **tres detecciones**.

`IT_VAT_CODE` merece un aviso: `([0-9][ _]?){11}` son once dígitos con espacios o guiones bajos opcionales **entre cada uno**. Extremadamente laxo — de ahí el score 0.1. Lo salva el checksum, que sube a 1.0 lo que cuadra.

---

## Suecia, Finlandia, Polonia

| Entidad                     | Regex                                                                         | Score | Validación                                 |
| --------------------------- | ----------------------------------------------------------------------------- | ----- | ------------------------------------------ |
| `SE_PERSONNUMMER`           | `\b(\d{6,8})([-+]?)\d{4}\b`                                                   | 0.5 · forma específica | **checksum** fecha + Luhn                  |
| `SE_PERSONNUMMER`           | `(\d{6,8})([-+]?)\d{4}` (sin `\b`)                                            | 0.1 · ruido sin contexto | misma que arriba                                       |
| `SE_ORGANISATIONSNUMMER`    | `\b\d{6}[-]?\d{4}\b`                                                          | 0.6 · forma específica | **checksum** 3er dígito ≥ 2 + Luhn         |
| `SE_ORGANISATIONSNUMMER`    | `\d{6}[-]?\d{4}` (sin `\b`)                                                   | 0.2 · forma común | misma que arriba                                       |
| `FI_PERSONAL_IDENTITY_CODE` | `\b(\d{6})([-+ABCDEFYXWVU])(\d{3})([0123456789ABCDEFHJKLMNPRSTUVWXY])\b`      | 0.5 · forma específica | **checksum** fecha + mod 31                |
| `FI_PERSONAL_IDENTITY_CODE` | igual sin `\b`                                                                | 0.1 · ruido sin contexto | misma que arriba                                       |
| `PL_PESEL`                  | `[0-9]{2}([02468][1-9]\|[13579][012])(0[1-9]\|1[0-9]\|2[0-9]\|3[01])[0-9]{5}` | 0.4 · forma compartida | **checksum** pesos `[1,3,7,9,1,3,7,9,1,3]` |

**Los tres usan una técnica que merece la pena copiar: dos patrones idénticos salvo por los `\b`.** El delimitado lleva score alto, el libre score bajo. Así capturas el identificador incrustado en una cadena más larga (por ejemplo `ref:8112189876`) sin darle la misma confianza que a uno bien delimitado. Es una forma barata de tener dos niveles de certeza con el mismo patrón.

**PESEL** — el checksum más corto:

```ts
export function peselValid(text: string): boolean {
  if (text.length !== 11 || !/^[0-9]+$/.test(text)) return false;

  const WEIGHTS = [1, 3, 7, 9, 1, 3, 7, 9, 1, 3];
  const d = [...text].map(Number);
  const sum = WEIGHTS.reduce((acc, w, i) => acc + d[i] * w, 0);

  return (10 - (sum % 10)) % 10 === d[10];
}
```

Su patrón ya codifica el siglo dentro del mes: `([02468][1-9]|[13579][012])` cubre `01`–`12` (1900), `21`–`32` (2000), `41`–`52` (2100)…

**Código de identidad finlandés — y aquí hay una trampa de TypeScript.** El séptimo carácter codifica el siglo, y hay que resolverlo antes de validar la fecha:

```ts
/** El separador codifica el siglo. Tres grupos, no hace falta un objeto. */
const siglo = (sep: string): number | undefined =>
  sep === '+' ? 1800 : '-YXWVU'.includes(sep) ? 1900 : 'ABCDEF'.includes(sep) ? 2000 : undefined;

const FI_CONTROL = '0123456789ABCDEFHJKLMNPRSTUVWXY';

export function hetuValid(text: string): boolean {
  if (text.length !== 11) return false;

  const base = siglo(text[6]);
  if (base === undefined) return false;   // separador no válido

  const day = Number(text.slice(0, 2));
  const month = Number(text.slice(2, 4));
  const year = base + Number(text.slice(4, 6));

  // TRAMPA: new Date() no falla con fechas imposibles, las NORMALIZA.
  // Date.UTC(1800, 1, 29) devuelve el 1 de marzo sin protestar.
  // Hay que comprobar los tres componentes después de construirla.
  const d = new Date(Date.UTC(year, month - 1, day));
  if (
    d.getUTCFullYear() !== year ||
    d.getUTCMonth() !== month - 1 ||
    d.getUTCDate() !== day
  )
    return false;

  const n = Number(text.slice(0, 6) + text.slice(7, 10));
  return FI_CONTROL[n % 31] === text.at(-1)!.toUpperCase();
}
```

Las dos trampas juntas, por si te las saltas:

1. **Sin resolver el siglo**, un año de dos dígitos se interpreta como los 2000 y `290200+` (29 feb 1800) pasa, aunque 1800 no fue bisiesto.
2. **`new Date()` nunca lanza un error** por una fecha imposible: la normaliza. Es la razón por la que el código compara los tres componentes en lugar de confiar en el constructor.

---

## Estados Unidos

| Entidad              | Regex                                                                    | Score     | Validación                            |
| -------------------- | ------------------------------------------------------------------------ | --------- | ------------------------------------- |
| `US_SSN`             | `\b([0-9]{3})[- .]([0-9]{2})[- .]([0-9]{4})\b`                           | 0.5 · forma específica | **filtro** separadores coherentes     |
| `US_SSN`             | `\b([0-9]{5})-([0-9]{4})\b`                                              | **0.05** · ruido sin contexto | misma que arriba                                  |
| `US_SSN`             | `\b([0-9]{3})-([0-9]{6})\b`                                              | **0.05** · ruido sin contexto | misma que arriba                                  |
| `US_SSN`             | `\b(([0-9]{3})-([0-9]{2})-([0-9]{4}))\b`                                 | **0.05** · ruido sin contexto | misma que arriba                                  |
| `US_SSN`             | `\b[0-9]{9}\b`                                                           | **0.05** · ruido sin contexto | misma que arriba                                  |
| `US_ITIN`            | `\b9\d{2}[- ](5\d\|6[0-5]\|7\d\|8[0-8]\|9([0-2]\|[4-9]))[- ]\d{4}\b`     | 0.5 · forma específica | —                                     |
| `US_ITIN`            | `\b9\d{2}(5\d\|6[0-5]\|7\d\|8[0-8]\|9([0-2]\|[4-9]))\d{4}\b`             | 0.3 · forma compartida | —                                     |
| `US_NPI`             | `\b[12]\d{3}[ -]\d{3}[ -]\d{3}\b`                                        | 0.4 · forma compartida | **checksum** Luhn con prefijo `80840` |
| `US_NPI`             | `\b[12]\d{9}\b`                                                          | 0.1 · ruido sin contexto | misma que arriba                                  |
| `US_MBI`             | 11 posiciones, con y sin guiones                                         | 0.5 / 0.3 | —                                     |
| `ABA_ROUTING_NUMBER` | `\b[0123678]\d{3}-\d{4}-\d\b`                                            | 0.3 · forma compartida | **checksum** pesos `3,7,1` mod 10     |
| `ABA_ROUTING_NUMBER` | `\b[0123678]\d{8}\b`                                                     | **0.05** · ruido sin contexto | misma que arriba                                  |
| `MEDICAL_LICENSE`    | `[ABCDEFGHJKLMPRSTUX]{1}[a-zA-Z]{1}\d{7}\|[ABCDEFGHJKLMPRSTUX]{1}9\d{7}` | 0.4 · forma compartida | **checksum** Luhn                     |
| `US_PASSPORT`        | `(\b[A-Z][0-9]{8}\b)`                                                    | 0.1 · ruido sin contexto | —                                     |
| `US_PASSPORT`        | `(\b[0-9]{9}\b)`                                                         | **0.05** · ruido sin contexto | —                                     |
| `US_BANK_NUMBER`     | `\b[0-9]{8,17}\b`                                                        | **0.05** · ruido sin contexto | —                                     |
| `US_DRIVER_LICENSE`  | 23 alternativas (ver abajo)                                              | 0.3 · forma compartida | —                                     |
| `US_DRIVER_LICENSE`  | `\b([0-9]{6,14}\|[0-9]{16})\b`                                           | **0.01** · ruido sin contexto | —                                     |

```ts
// US_NPI: Luhn con un prefijo fijo. El detalle que se escapa.
export const npiValid = (raw: string) => luhnValid('80840' + sanitize(raw));

// ABA: pesos 3,7,1 repetidos
export function abaValid(raw: string): boolean {
  const text = sanitize(raw);
  if (text.length !== 9 || !/^[0-9]+$/.test(text)) return false;

  const WEIGHTS = [3, 7, 1, 3, 7, 1, 3, 7, 1];
  const sum = WEIGHTS.reduce((acc, w, i) => acc + Number(text[i]) * w, 0);
  return sum % 10 === 0;
}

// US_SSN: el SSN no tiene dígito de control. Solo se puede exigir
// que los separadores sean coherentes.
export function ssnCheck(text: string): Validation {
  const kinds = new Set(
    [...text].filter((c) => c === '.' || c === '-' || c === ' '),
  );
  if (kinds.size > 1) return false; // rechaza 123-45.6789
  return null;
}
```

### Nueve dígitos: la peor colisión de la referencia

Estos cuatro patrones casan con la misma cadena:

| Entidad             | Regex                          | Score |
| ------------------- | ------------------------------ | ----- |
| `US_SSN`            | `\b[0-9]{9}\b`                 | 0.05 · ruido sin contexto |
| `US_PASSPORT`       | `(\b[0-9]{9}\b)`               | 0.05 · ruido sin contexto |
| `US_BANK_NUMBER`    | `\b[0-9]{8,17}\b`              | 0.05 · ruido sin contexto |
| `US_DRIVER_LICENSE` | `\b([0-9]{6,14}\|[0-9]{16})\b` | 0.01 · ruido sin contexto |

Un `123456789` en el texto produce **cuatro detecciones solapadas**, y ninguna tiene validación que las separe. Los scores de 0.05 y 0.01 son la forma de decirte que sin contexto esto es indecidible. La decisión de diseño no es el patrón: es el umbral y la política de solapamiento.

### `US_DRIVER_LICENSE` tiene un bug — arréglalo al copiarlo

El patrón alfanumérico tiene 23 alternativas. La décima es esta:

```
|X[0-9]{8}|A-Z]{2}[0-9]{2,5}|[A-Z]{2}[0-9]{3,7}|
            ^^^^^^^ falta el corchete de apertura
```

`A-Z]{2}[0-9]{2,5}` **no es una clase de caracteres**: le falta el `[`. El motor lo lee como los literales `A`, `-`, `Z`, dos `]` y luego 2-5 dígitos. Comprobado:

```ts
new RegExp('A-Z]{2}[0-9]{2,5}').exec('A-Z]]12');
// match: 'A-Z]]12'    ← casa una cadena absurda que nunca aparece en texto real

patronCompleto.exec('AB12');
// null                 ← NO casa lo que pretendía
```

La rama pretendida era `[A-Z]{2}[0-9]{2,5}`: dos letras y 2-5 dígitos. Efecto real: **`AB12` no se detecta.** `AB123` sí, pero por otra rama (`[A-Z]{2}[0-9]{3,7}`). El bug se traga exactamente el caso de dos letras seguidas de dos dígitos.

**Escribe `[A-Z]{2}[0-9]{2,5}`.** Y como decía arriba, el flag `u` te habría avisado con `Lone quantifier brackets`.

### `US_MBI`

Se compone por posición, siguiendo la especificación de CMS:

```
Pos:  1    2      3        4    5      6        7    8      9      10   11
      NUM  ALPHA  ALNUM    NUM  ALPHA  ALNUM    NUM  ALPHA  ALPHA  NUM  NUM
```

Dos variantes: los 11 caracteres seguidos (score 0.3) o en formato `XXXX-XXX-XXXX` (score 0.5). Sin checksum.

---

## Resumen

### Orden de implementación recomendado

**Empieza aquí — alta precisión, poco código.** Patrón acotado y checksum que confirma:

`IBAN_CODE` · `ES_NIF` · `ES_NIE` · `PL_PESEL` · `FI_PERSONAL_IDENTITY_CODE` · `SE_PERSONNUMMER` · `SE_ORGANISATIONSNUMMER` · `IT_FISCAL_CODE` · `UK_NHS` · `DE_TAX_ID` · `US_NPI` · `ABA_ROUTING_NUMBER` · `CREDIT_CARD`

Con `luhnValid` cubres cinco de golpe.

**Segunda tanda — el patrón se basta solo:**

`UK_NINO` · `EMAIL_ADDRESS` · `UUID` · `MAC_ADDRESS` · `IP_ADDRESS` (delega en un parser) · `PHONE_NUMBER` (delega en una librería)

**Solo con contexto — score base ≤ 0.1.** No los actives sin palabras clave alrededor:

`ES_PASSPORT` (0.05) · `DE_PLZ` (0.05) · `US_BANK_NUMBER` (0.05) · `US_PASSPORT` (0.05) · `IT_VAT_CODE` (0.1) · `UK_POSTCODE` (0.1) · `UK_PASSPORT` (0.1) · `IT_IDENTITY_CARD` (0.01) · `IT_PASSPORT` (0.01) · `US_DRIVER_LICENSE` (0.01)

**Necesitan política de solapamiento antes de servir resultados:**

- `DE_BSNR` ↔ `DE_LANR` — ambos `\b\d{9}\b`
- `DE_ID_CARD` ↔ `DE_PASSPORT` — mismo patrón ICAO
- `IT_PASSPORT` ↔ `IT_IDENTITY_CARD` ↔ `UK_PASSPORT` — todos `[A-Z]{2}\d{7}`
- `US_SSN` ↔ `US_PASSPORT` ↔ `US_BANK_NUMBER` ↔ `US_DRIVER_LICENSE` — todos casan 9 dígitos
- `ES_NIF` ↔ `ES_NIE` — el prefijo del NIE es opcional; lo resuelve la validación

### Checklist

- [ ] Flags `"gsmi"` en todos los patrones. Sin `i` pierdes la mitad de las detecciones.
- [ ] No compartir una instancia de `RegExp` con `g` entre llamadas (`lastIndex` guarda estado).
- [ ] `String.raw` para escribir los patrones sin duplicar barras invertidas.
- [ ] Escribir `[0-9]` en lugar de `\d`.
- [ ] En `DE_KFZ`, sustituir `[\w-]` por la clase completa con umlauts.
- [ ] Arreglar `US_DRIVER_LICENSE`: `A-Z]{2}` → `[A-Z]{2}`.
- [ ] Tipar la validación como `true | false | null`, nunca `boolean`.
- [ ] En `IBAN_CODE`, usar `BigInt` o el resto por bloques. Nunca `Number()`.
- [ ] En `hetuValid`, comprobar los componentes de la fecha a mano.
- [ ] Poner un umbral de score. Sin umbral, las entidades de 0.01 te inundan.
- [ ] Probar con `"gsmiu"` en desarrollo para que los patrones mal formados fallen.

### Lo que los patrones no te dan

Con esto tienes la detección, no la confianza final. Faltan dos piezas:

1. **Palabras de contexto.** Cada entidad tiene una lista de términos asociados (`ES_NIF`: `documento nacional de identidad`, `DNI`, `NIF`, `identificación`) que suben el score cuando aparecen cerca de la coincidencia. Para las entidades de score 0.01–0.1 esto no es un extra: es lo único que las hace utilizables.
2. **Resolución de solapamientos.** Con las colisiones de la lista de arriba, sin esta capa emites duplicados.

Verifica contra la fuente antes de copiar: estos patrones cambian entre versiones y esto es una foto del commit `2bb88d2`.
