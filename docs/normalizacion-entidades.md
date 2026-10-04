# Normalización por entidad

Qué habría que cambiar en cada entidad para detectar más formas reales de escribirla **sin abrir la puerta a falsos positivos**.

Decisión de partida: la normalización se hace **por entidad**, nunca sobre el texto entero antes de buscar. Quitar puntos globalmente rompería IPs, fechas, emails y versiones, y además desplazaría los `start`/`end` que `mask` necesita para enmascarar el texto original.

---

## 1. Cómo funciona hoy

1. Cada `pattern.regex` se ejecuta sobre el **texto original**, con flags `gsmi` (o `gsm` si `caseSensitive`).
2. Por cada match, `score()` llama a `validation.run(sanitize(value), value)`.
3. `sanitize` (`src/core/sanitize.ts`) solo quita `\s` y `-`. **No quita puntos**, ni guiones tipográficos (`–`, `‑`), ni caracteres de ancho cero.
4. Un checksum fallido **no descarta**: la detección se queda con el score base del patrón. Si ese score es ≥ `MIN_SCORE` (0.4), se reporta igualmente.

Consecuencia: lo que se reconoce lo decide al 100 % la regex. Si la regex no admite un separador, el checksum nunca llega a ejecutarse. Por eso `21.00.00.11-E` no sale como NIF y, en su lugar, `21.00.00.11` sale como `IP_ADDRESS`.

### Problemas encontrados al probarlo (salidas reales)

| Entrada | Resultado actual | Problema |
| --- | --- | --- |
| `DNI 21.00.00.11-x` | `IP_ADDRESS` `21.00.00.11` | NIF no admite puntos; IP acepta octetos `00` |
| `DNI 12.345.678-Z` | nada | Formato español habitual, no se detecta |
| `DNI 12345678 Z` | nada | El NIF no admite espacio antes de la letra |
| `NIE X-1234567-L` | `ES_NIF` `1234567-L` | Etiqueta errónea: el NIE no admite guiones y el NIF se cuela |
| `IBAN ES91·2100·0418…` (NBSP) | nada | El IBAN usa `[ -]` literal, no acepta espacio duro |
| `Steuer-ID 12 345 678 901` | nada | Formato agrupado alemán no admitido |
| `P.IVA IT01234567897` | `IBAN_CODE` 0.5 | Checksum IBAN falla pero se reporta igual |
| `hash 3f2a9b7c1d4e5f6071…` | `CRYPTO` 0.5 | Checksum falla, se reporta igual; alfabeto no es base58 |
| `ref 99044051495213` | `PL_PESEL` `90440514952` | PESEL sin límites: se extrae del medio de otro número |
| `CF xRSSMRA85T10A562S` | `IT_FISCAL_CODE` 1.0 | Codice fiscale sin límites |
| `codigo XY25ABC producto` | `GB_VEHICLE_REGISTRATION` **1.0** | Un rango de edad válido se trata como checksum |
| `tel 7946095812` | `SE_ORGANISATIONSNUMMER` **1.0** | Luhn (1/10) sobre 10 dígitos pelados confirma a máxima confianza |
| `version 1.2.34` | `DATE_TIME` 0.6 | Fecha con año de 2 dígitos sin contexto |
| `fecha 31/02/2024` | `DATE_TIME` 0.95 | No se valida que la fecha exista |

---

## 2. Cambios transversales (motor y `core`)

Son la base para que los cambios por entidad sean pequeños y coherentes.

### 2.1 Un `normalize` por entidad

Añadir a `EntityDefinition`:

```ts
/**
 * Quita los separadores que ESTA entidad admite antes del checksum.
 * Por defecto `sanitize`. Nunca toca el texto original ni los offsets.
 */
normalize?: (raw: string) => string;
```

Y en `score()`:

```ts
const clean = entity.normalize?.(value) ?? sanitize(value);
const verdict = validation?.run(clean, value) ?? null;
```

Hoy cada checksum se limpia por su cuenta (`ibanValid` vuelve a quitar `[\s-]`, `DE_VAT_ID` quita puntos a mano, `macCheck` quita `:.-`…). Con `normalize`, la regla de "qué separadores admite esta entidad" vive en un solo sitio, junto a la regex que los acepta.

Excepción importante: `FI_PERSONAL_IDENTITY_CODE`. Su separador (`-`, `+`, `A`…) **codifica el siglo**, así que su `normalize` no puede quitarlo. Ya usa `raw` y debe seguir así.

### 2.2 Clases de separadores compartidas

Crear `src/core/separators.ts` con clases reutilizables, en vez de escribir `[ -]` o `\s` en cada regex:

```ts
/** Espacio horizontal: espacio, tab, NBSP (U+00A0) y NNBSP (U+202F). Sin saltos de línea. */
export const SPACE = String.raw`[ \t  ]`;

/** Guion ASCII y los tipográficos que meten Word y los PDF: ‐ ‑ ‒ – — − */
export const DASH = String.raw`[\-‐‑‒–—−]`;

export const DOT = String.raw`\.`;

/** Caracteres invisibles que aparecen al copiar de PDF/web: ZWSP, ZWNJ, ZWJ, BOM, soft hyphen. */
export const INVISIBLE = String.raw`[​‌‍﻿­]`;
```

Y un `strip(value, ...clases)` para que `normalize` quite exactamente lo mismo que la regex aceptó.

- **Usar `SPACE` en lugar de `\s`**: `\s` incluye `\n`, y con eso se unen trozos de líneas distintas (un número al final de una línea y una letra al principio de la siguiente).
- Los caracteres de `INVISIBLE` no se pueden quitar del texto antes de buscar (romperían los offsets). Lo que sí se puede hacer es admitirlos como separador opcional en las entidades con checksum fuerte.

### 2.3 Patrón estricto + patrón laxo

Es la técnica que ya usan `SE_PERSONNUMMER` y `FI_PERSONAL_IDENTITY_CODE` (`delimited` / `free`), generalizada:

| Patrón | Qué acepta | Score base | Se reporta… |
| --- | --- | --- | --- |
| **estricto** | Las agrupaciones oficiales o habituales del formato | ≥ 0.4 | siempre |
| **laxo** | Cualquier separador suelto entre caracteres | **< 0.4** (p. ej. 0.3) | solo si pasa el checksum o hay contexto |

Así, ampliar los separadores **no puede** añadir falsos positivos sin respaldo: un match laxo sin checksum válido ni palabra de contexto se queda por debajo de `MIN_SCORE` y se descarta.

**Regla:** solo tienen patrón laxo las entidades con **checksum**. Las que solo tienen `filter` o nada se quedan con el estricto.

### 2.4 Separador consistente (retrorreferencia)

Cuando el formato usa grupos, exigir el **mismo** separador en todo el valor, como ya hace `MAC_ADDRESS` con `\1`:

```
[0-9]{2}([. ])[0-9]{3}\1[0-9]{3}     ✓ 12.345.678   ✓ 12 345 678   ✗ 12.345 678
```

Mezclar separadores es raro en datos reales y frecuente en ruido (tablas, listados, números de teléfono).

### 2.5 Límites: lookarounds en vez de `\b`

`\b` falla en tres casos que ya están dando problemas:

- **No hay límite entre letra y dígito**: `IT01234567897` no tiene `\b` entre `T` y `0`.
- **No hay límite tras un separador**: un patrón que termina en `-?` puede tragarse un guion final.
- **Patrones sin límite alguno** (`PL_PESEL`, `IT_FISCAL_CODE`, `CRYPTO`): se extraen del medio de cadenas más largas.

Usar `(?<![A-Z0-9])…(?![A-Z0-9])` y, para números, `(?<![0-9]|[0-9][.\s-])…(?![0-9])`. Este último bloquea también "dígito + separador" antes del valor: sin él, `1 2345678 Z` daría un NIF de 7 dígitos.

### 2.6 Fuerza del checksum

No todos los checksums valen lo mismo. Hoy cualquier `true` da score 1.0:

| Checksum | Probabilidad de que un valor aleatorio pase |
| --- | --- |
| base58check (`CRYPTO`) | ~1 / 4.000 millones |
| IBAN mod 97 | ~1 / 97 |
| Codice fiscale (mod 26) | ~1 / 26 |
| NIF / NIE (mod 23) | ~1 / 23 |
| NHS (mod 11) | ~1 / 11 |
| Luhn, PESEL, mod 10 | ~1 / 10 |

Propuesta: añadir `strength: 'weak' | 'strong'` a la validación. Un checksum **débil** (≤ 1/26) confirma a 1.0 solo si el match viene del patrón estricto **o** hay contexto. Si viene del laxo, o son dígitos pelados sin contexto, sube a ~0.7 en vez de 1.0. Es lo que evita que `7946095812` salga como organisationsnummer confirmado.

### 2.7 Checksum fallido

Hoy un checksum fallido conserva el score base del patrón (`nie.ts` documenta que es deliberado). Para los **patrones laxos nuevos** es imprescindible que su score base sea < 0.4, como se dice en 2.3. Para los existentes con score ≥ 0.4 (`IBAN_CODE`, `CRYPTO`, `ES_NIF`…), conviene revisar si un checksum fallido sin contexto debe seguir reportándose. Es lo que genera los casos `IT01234567897 → IBAN` y `hash → CRYPTO` de la tabla.

### 2.8 Mayúsculas y minúsculas por entidad

El flag `i` es global salvo `caseSensitive`. Para formatos que **siempre** se imprimen en mayúsculas y no tienen checksum (pasaportes, matrículas, códigos postales), el flag `i` solo aporta ruido: `abc123456` sale como pasaporte. Recomendación: `caseSensitive: true`, o un segundo patrón en minúsculas con score menor.

### 2.9 Zona de lectura mecánica (MRZ)

Los pasaportes y DNIs no tienen dígito de control en el número impreso, pero **sí en la MRZ** (las líneas `P<ESP…` / `IDESP…` de la parte inferior). Si el texto viene de un OCR del documento, una entidad `MRZ` (formatos TD1/TD3, checksum 7-3-1 en cada campo) daría precisión casi total. Es una entidad nueva, no un cambio de las existentes.

---

## 3. Por entidad

Formato de cada ficha:

- **Hoy**: qué acepta la regex actual.
- **Formatos reales**: cómo aparece escrito.
- **Normalizar**: qué debe quitar `normalize` antes del checksum.
- **Cambios**: qué tocar.
- **Riesgo**: con qué puede confundirse.

### España

#### `ES_NIF` (DNI)

- **Hoy**: `\b[0-9]?[0-9]{7}[-]?[A-Z]\b`. Solo admite un guion antes de la letra.
- **Formatos reales**: `12345678Z`, `12345678-Z`, `12345678 Z`, `12.345.678-Z`, `12.345.678 Z`, `12 345 678 Z`, `1234567Z` (cero inicial omitido). Y cosas raras como `21.00.00.11-E`.
- **Normalizar**: quitar espacios (`SPACE`), puntos y guiones (`DASH`), y pasar a mayúsculas. Debe quedar `^[0-9]{7,8}[A-Z]$`.
- **Cambios**:
  1. Restringir la letra a las que existen como control: `[TRWAGMYFPDXBNJZSQVHLCKE]`. Nunca son `I`, `Ñ`, `O` ni `U`.
  2. **Estricto** (score 0.5): sin separadores o con agrupación de miles consistente.
     ```
     (?<![A-Z0-9]|[0-9XYZ][.\s-])(?:[0-9]{7,8}|[0-9]{1,2}([. ])[0-9]{3}\1[0-9]{3})[-\s]?[TRWAGMYFPDXBNJZSQVHLCKE](?![A-Z0-9])
     ```
  3. **Laxo** (score 0.3): cualquier separador suelto entre dígitos. Solo sobrevive con checksum o contexto.
     ```
     (?<![A-Z0-9]|[0-9XYZ][.\s-])[0-9](?:[.\s-]?[0-9]){6,7}[.\s-]?[TRWAGMYFPDXBNJZSQVHLCKE](?![A-Z0-9])
     ```
  4. El lookbehind `[XYZ][.\s-]` impide que la cola de un NIE (`X-1234567-L`) se etiquete como NIF.
- **Probado** (incluye `\s` por brevedad; en la implementación, `SPACE`):

  | Entrada | Estricto | Laxo |
  | --- | --- | --- |
  | `21.00.00.11-E` | — | ✓ |
  | `21.000.011-E`, `21 000 011 E`, `21000011E` | ✓ | ✓ |
  | `12.345 678-Z` (mezclado) | — | ✓ |
  | `X-1234567-L` | — | — |
  | `Tel 91 234 56 78 Y` | — | — |
  | `precio 12345678 euros` | — | — |

- **Riesgo**: checksum 1/23. El laxo **debe** quedarse < 0.4 y conviene que el checksum cuente como débil (2.6).

#### `ES_NIE`

- **Hoy**: `\b[X-Z][0-9]?[0-9]{7}[-]?[A-Z]\b`. Sin separador tras el prefijo.
- **Formatos reales**: `X1234567L`, `X-1234567-L`, `X 1234567 L`, `X.1234567.L`, `X-01234567-L`.
- **Normalizar**: igual que el NIF.
- **Cambios**: separador opcional (`[.\s-]?`, consistente con `\1`) tras el prefijo y antes de la letra. Letra restringida a la tabla de control. Laxo con miles (`X-1.234.567-L`) a score 0.3.
- **Riesgo**: bajo, el prefijo `XYZ` + checksum lo acotan. Al ser más largo que la cola que captura el NIF, gana el solapamiento.

#### `ES_PASSPORT`

- **Hoy**: `\b[A-Z]{3}[0-9]{6}\b` con flag `i`, score 0.05.
- **Formatos reales**: siempre mayúsculas, sin separadores (`PAA123456`).
- **Normalizar**: nada.
- **Cambios**: `caseSensitive: true`. No añadir separadores: no hay checksum que filtre.
- **Riesgo**: alto (códigos de producto, referencias). Solo útil con contexto o MRZ (2.9).

### Global

#### `IBAN_CODE`

- **Hoy**: grupos con `[ -]?` literal.
- **Formatos reales**: `ES9121000418450200051332`, `ES91 2100 0418 4502 0005 1332`, a veces con NBSP o con prefijo `IBAN`.
- **Normalizar**: quitar `SPACE`, `DASH` y mayúsculas. `ibanValid` deja de limpiar por su cuenta.
- **Cambios**:
  1. `[ -]` → `(?:SPACE|DASH)` para aceptar NBSP y guiones tipográficos.
  2. Exigir separador consistente entre grupos.
  3. Revisar el checksum fallido (2.7): hoy `IT01234567897` (una partita IVA con prefijo) sale como IBAN 0.5.
- **Riesgo**: bajo con mod 97 + longitud por país.

#### `CREDIT_CARD`

- **Hoy**: `[- ]?` entre grupos, mezcla permitida.
- **Formatos reales**: `4111111111111111`, `4111 1111 1111 1111`, `4111-1111-1111-1111`, Amex `3782 822463 10005`.
- **Normalizar**: quitar `SPACE` y `DASH`. Comprobar longitud 13–19 tras normalizar.
- **Cambios**: `SPACE`/`DASH` en lugar de `[- ]`, y separador consistente (`\1`). Revisar el prefijo `1\d{3}` (UATP), que casi no existe y amplía la superficie.
- **Riesgo**: Luhn es 1/10. Con dígitos pelados sin contexto, que confirme como débil (2.6).

#### `CRYPTO`

- **Hoy**: `(bc1|[13])[a-zA-HJ-NP-Z0-9]{25,59}`, sin límites. Admite `0` y `l`, que no están en base58.
- **Normalizar**: nada (son sensibles a mayúsculas).
- **Cambios**:
  1. Límites `(?<![A-Za-z0-9])…(?![A-Za-z0-9])`.
  2. Separar en dos patrones:
     - base58: `[13][1-9A-HJ-NP-Za-km-z]{25,34}`
     - bech32: `bc1[02-9ac-hj-np-z]{11,71}`, solo minúsculas
  3. Implementar el checksum bech32 (polymod) en lugar de devolver `null`.
- **Riesgo**: hoy cualquier hash hexadecimal que empiece por `1` o `3` sale a 0.5.

#### `IP_ADDRESS`

- **Hoy**: el octeto `[01]?[0-9][0-9]?` acepta `00`, `01`, `007`.
- **Normalizar**: nada.
- **Cambios**:
  1. Octeto sin ceros a la izquierda: `25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9]?[0-9]`. Con esto, `21.00.00.11` deja de ser IP.
  2. Lookahead que no acepte la IP si va seguida de `[-\s]?[A-Z]\b` (cola de un NIF).
  3. Recall: el IPv6 comprimido (`fe80::1`) no está cubierto.
- **Riesgo**: versiones de software (`1.2.3.4`). Sin checksum, que dependan de contexto si se quiere bajar el score.

#### `MAC_ADDRESS`

- **Hoy**: correcto, ya exige separador consistente.
- **Cambios**: ninguno en separadores. **No** añadir la forma de 12 hex sin separador (colisiona con hashes).

#### `UUID`

- **Hoy**: correcto.
- **Cambios**: opcionalmente aceptar llaves `{…}` (formato GUID de Microsoft). **No** aceptar 32 hex sin guiones.

#### `EMAIL_ADDRESS`

- **Hoy**: correcto para la forma estándar.
- **Cambios** (recall, opcional): un patrón de score bajo para ofuscaciones (`juan [at] dominio [dot] com`, `juan(arroba)dominio.com`) que solo sobreviva con contexto.
- **Riesgo**: ninguno nuevo si el patrón ofuscado queda < 0.4.

#### `DATE_TIME`

- **Hoy**: múltiples patrones sin validar la fecha.
- **Cambios**:
  1. `filter` con `realDate` (ya existe en `core/checksums.ts`): descarta `31/02/2024` y `00.13.99`.
  2. Patrones con año de 2 dígitos (`dd.mm.yy`, `mm/yy`) con score < 0.4: `1.2.34` es una versión, no una fecha.
  3. Admitir `SPACE` alrededor del separador (`21 / 05 / 2024`).
- **Riesgo**: es la entidad más ruidosa. No ampliar sin filtro.

### Alemania

#### `DE_TAX_ID` (Steuer-ID)

- **Hoy**: `\b[1-9][0-9]{10}\b`, sin separadores.
- **Formatos reales**: `12345678901`, `12 345 678 901` (2-3-3-3, el de la carta del BZSt), a veces `12/345/678/901`.
- **Normalizar**: quitar `SPACE`, `/` y `DASH`.
- **Cambios**: estricto con 2-3-3-3 y separador consistente. Laxo con separadores sueltos a 0.3.
- **Riesgo**: bajo, el checksum incluye la regla de dígitos repetidos.

#### `DE_SOCIAL_SECURITY` (Rentenversicherungsnummer)

- **Hoy**: 12 caracteres seguidos.
- **Formatos reales**: `15070649C103`, `15 070649 C 103`, `15 070649 C10 3`.
- **Normalizar**: quitar `SPACE`; mayúsculas.
- **Cambios**: `SPACE?` opcional entre bloques área(2) · fecha(6) · letra(1) · serie(2) · control(1).
- **Riesgo**: bajo con checksum.

#### `DE_VAT_ID`

- **Hoy**: ya admite `[\s.\-]` entre grupos 3-3-3, sin consistencia.
- **Normalizar**: quitar `DE`, `SPACE`, `.`, `DASH`. Mover aquí lo que hoy hace a mano el `run`.
- **Cambios**: separador consistente; `SPACE`/`DASH` en lugar de `\s`/`-`.

#### `DE_TAX_NUMBER` (Steuernummer)

- **Hoy**: 13 dígitos o formatos con `/`, sin validación.
- **Cambios**: el formato con barras depende del Land (Bayern 3/3/5, Berlín 2/3/5, NRW 3/4/4…). Lista blanca de formatos por Land en lugar de `slashed-loose`. Implementar el checksum (varía por Land) si se quiere confirmar.
- **Riesgo**: alto sin validación. No añadir separadores nuevos.

#### `DE_HEALTH_INSURANCE` (KVNR)

- **Hoy**: `filter`, nunca confirma.
- **Cambios**: la KVNR **sí tiene dígito de control público**. La letra pasa a 2 dígitos (A=01…), pesos 1-2 alternos, suma de cifras, mod 10. Pasar de `filter` a `checksum`. Separadores: no hacen falta.

#### `DE_ID_CARD` / `DE_PASSPORT`

- **Hoy**: mismo patrón ICAO, mismo checksum. Solo el contexto los distingue.
- **Cambios**: `caseSensitive: true`, porque se imprimen siempre en mayúsculas y el alfabeto ICAO excluye vocales. Sin separadores.
- **Riesgo**: entre ellas, inevitable sin contexto. MRZ (2.9) lo resolvería.

#### `DE_FUEHRERSCHEIN`

- **Hoy**: sin validación.
- **Cambios**: verificar la especificación del dígito de control en la posición 10 (mod 11, `X` = 10) y, si se confirma, añadirlo como checksum. `caseSensitive: true`.

#### `DE_HANDELSREGISTER`

- **Hoy**: `HR[AB]\s*[0-9]{1,6}`.
- **Formatos reales**: `HRB 12345`, `HR B 12345`, `HRB 12345 B` (sufijo de Berlín), `HRB-Nr. 12345`. Existen también `GnR`, `PR` y `VR`.
- **Cambios**: `HR\s?[AB]`, prefijo `Nr.` opcional, sufijo de letra opcional. Valorar `GnR`, `PR` y `VR`.
- **Riesgo**: bajo, el prefijo es muy específico.

#### `DE_KFZ`

- **Hoy**: bien resuelto con lookarounds y `caseSensitive`.
- **Cambios**: `SPACE` en lugar de `\s` (NBSP sí, saltos de línea no). Filtro con la lista oficial de Unterscheidungszeichen (~700 prefijos): elimina la mayor parte del ruido.

#### `DE_BSNR` / `DE_LANR`

- **Hoy**: el mismo `\b[0-9]{9}\b`.
- **Cambios**: BSNR: filtrar por los dos primeros dígitos (código de la KV regional, lista cerrada). LANR: ya tiene checksum; los dos últimos dígitos (Fachgruppe) se pueden filtrar contra su lista. Sin separadores.

#### `DE_PLZ`

- **Cambios**: ninguno. Cinco dígitos sin checksum: solo con contexto. No ampliar.

### Reino Unido

#### `GB_NHS`

- **Hoy**: 3-3-4 con `[- ]?` mezclable.
- **Normalizar**: quitar `SPACE` y `DASH`.
- **Cambios**: separador consistente (`943 476 5919` ✓, `943-476 5919` ✗). Los 10 dígitos pelados, con score menor que la forma agrupada.
- **Riesgo**: teléfonos de 10 dígitos; mod 11 es débil.

#### `GB_NINO`

- **Hoy**: excelente, admite espacio simple entre pares.
- **Cambios**: `SPACE` en lugar de espacio literal. Valorar `DASH` (`QQ-12-34-56-C`), raro pero existe.

#### `GB_DRIVING_LICENCE`

- **Hoy**: 16 caracteres seguidos.
- **Formatos reales**: `MORGA753116SM9IJ`, `MORGA 753116 SM9IJ`, a veces seguido del número de emisión (`MORGA753116SM9IJ 35`).
- **Cambios**: `SPACE?` entre bloques 5-6-5 e incluir el número de emisión opcional en el match, para que quede enmascarado.

#### `GB_VEHICLE_REGISTRATION`

- **Hoy**: `vehicleAgeCheck` está declarado como `checksum` y devuelve `true` → `XY25ABC` sale a **1.0**.
- **Cambios**: cambiar a `kind: 'filter'`. Un rango de edad plausible no confirma nada. `caseSensitive: true`. Separador consistente.

#### `GB_POSTCODE`

- **Cambios**: `SPACE` en lugar de `\s`. `caseSensitive: true`. No ampliar más.

#### `GB_PASSPORT`

- **Hoy**: `[A-Z]{2}[0-9]{7}`, idéntico a `IT_PASSPORT`.
- **Cambios**: verificar el formato. Los pasaportes británicos han sido históricamente de **9 dígitos numéricos**. `caseSensitive: true`. Sin separadores.

### Italia

#### `IT_FISCAL_CODE`

- **Hoy**: sin límites → se extrae de dentro de palabras (`xRSSMRA85T10A562S` → 1.0).
- **Formatos reales**: `RSSMRA85T10A562S`, `RSS MRA 85T10 A562S`.
- **Normalizar**: quitar `SPACE`; mayúsculas.
- **Cambios**: límites `(?<![A-Z0-9])…(?![A-Z0-9])`. Patrón con `SPACE?` entre bloques apellido(3) · nombre(3) · fecha(5) · municipio(4) · control(1).

#### `IT_VAT_CODE` (partita IVA)

- **Hoy**: `\b([0-9][ _]?){11}\b`. Admite un espacio o `_` entre **cualquier** par de dígitos, y no detecta `IT01234567897` (no hay `\b` entre `T` y `0`).
- **Normalizar**: quitar el prefijo `IT` y `SPACE`.
- **Cambios**:
  1. Prefijo `IT` opcional con lookarounds en vez de `\b`.
  2. Estricto: 11 dígitos seguidos. Eliminar el `[ _]?` libre o moverlo a un patrón laxo < 0.4.
  3. Filtro: los dígitos 8-10 son el código de oficina (001-100, 120, 121, 888, 999).
- **Riesgo**: checksum 1/10; hoy cualquier secuencia de 11 dígitos con espacios es candidata.

#### `IT_IDENTITY_CARD` / `IT_PASSPORT` / `IT_DRIVER_LICENSE`

- **Cambios**: `caseSensitive: true`. Sin separadores (sin checksum). Siguen dependiendo del contexto; MRZ (2.9) para pasaporte y CIE.

### Polonia

#### `PL_PESEL`

- **Hoy**: sin ningún límite → `99044051495213` produce un PESEL desde el medio.
- **Cambios**: `(?<![0-9])…(?![0-9])`. Filtro de fecha real (el mes codifica el siglo: +20, +40, +60, +80) antes del checksum. Sin separadores, no se usan.

### Suecia

#### `SE_PERSONNUMMER`

- **Hoy**: patrón `free` sin límites a 0.1.
- **Cambios**: aceptar `SPACE` como separador además de `-`/`+` (`811218 9876`). Validar la fecha con `realDate` en vez de rangos sueltos (incluye *samordningsnummer*: día + 60).

#### `SE_ORGANISATIONSNUMMER`

- **Hoy**: `7946095812` (un teléfono) sale confirmado a 1.0.
- **Cambios**: la forma sin guion pasa a score < 0.4 y el Luhn cuenta como débil (2.6). Aceptar el prefijo `16` (forma de 12 dígitos).

### Finlandia

#### `FI_PERSONAL_IDENTITY_CODE`

- **Hoy**: correcto, el checksum ya usa `raw` y valida la fecha.
- **Cambios**: ninguno en separadores. **Su `normalize` no debe quitar el separador central**: es el siglo.

---

## 4. Orden sugerido

1. **Motor**: `normalize` por entidad, `core/separators.ts`, regla estricto/laxo (2.1–2.3).
2. **Bugs de precisión** (cambios pequeños, impacto alto): límites en `PL_PESEL`, `IT_FISCAL_CODE` y `CRYPTO`; `GB_VEHICLE_REGISTRATION` a `filter`; octetos de `IP_ADDRESS`; `filter` de fecha en `DATE_TIME`.
3. **Recall con checksum**: `ES_NIF`, `ES_NIE`, `IBAN_CODE`, `DE_TAX_ID`, `DE_SOCIAL_SECURITY`, `IT_VAT_CODE`, `GB_NHS`.
4. **Fuerza del checksum** (2.6) y revisión del checksum fallido (2.7).
5. **Entidades sin checksum**: `caseSensitive` y listas blancas (KFZ, BSNR, Steuernummer).

En cada paso, añadir a `tests/fixtures` los formatos de la columna "Formatos reales" como positivos y las entradas de la tabla 1 como negativos.
