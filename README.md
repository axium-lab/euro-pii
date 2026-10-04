# @axium-lab/nerium

Detección y anonimización de datos personales en texto, **sin machine learning**. Solo regex, checksums y palabras de contexto.

Alcance: Europa. 44 entidades de 7 países más las multipaís.

> **Provisional.** El paquete funciona y está verificado, pero la API todavía puede cambiar. El repo nació como investigación (`documentation-NER`) y sigue conteniendo los documentos de análisis en `docs/`, que son la fuente de la que salen los patrones.

## Cómo se usa

No hay nada que configurar.

```ts
import { Nerium } from '@axium-lab/nerium';

const { anonymized_text, entities } = new Nerium().text(documento, true);
```

Entra texto, sale el texto con los identificadores tapados más el detalle de lo que se encontró:

```ts
new Nerium().text('El titular con DNI 12345678-Z firma el contrato.', true);
```

```json
{
  "blocked": false,
  "anonymized_text": "El titular con DNI <ES_NIF> firma el contrato.",
  "entities": [
    {
      "entity": "ES_NIF",
      "kind": "TAX_ID",
      "dataClass": "PERSONAL",
      "identifiability": "DIRECT",
      "country": "ES",
      "start": 19,
      "end": 29,
      "score": 1,
      "value": "12345678-Z",
      "pattern": "nif",
      "confirmedBy": "checksum"
    }
  ]
}
```

**Los offsets son del texto original**, nunca del anonimizado. `<ES_NIF>` mide 8 caracteres y `12345678-Z` mide 10, así que en el texto tapado esas posiciones ya no valen.

### El segundo argumento: tapar o bloquear

```ts
ner.text(documento, true); // devuelve el texto anonimizado
ner.text(documento, false); // si encuentra algo, bloquea y NO devuelve texto
```

El resultado bloqueado **no tiene campo de texto**, así que TypeScript te impide leerlo por error:

```ts
type ScanResult =
  | { blocked: false; anonymized_text: string; entities: Detection[] }
  | { blocked: true; entities: Detection[] };
```

### Filtrar el resultado

No se configura a la entrada: siempre se detecta todo y se filtra la salida. Así no dejas un DNI en claro por haber filtrado de más.

```ts
const { entities } = new Nerium().text(documento, true);

entities.filter((d) => d.kind === 'BANK_ACCOUNT');
entities.filter((d) => d.dataClass === 'HEALTH');
entities.filter((d) => d.identifiability === 'DIRECT');
entities.filter((d) => d.country === 'ES');
entities.filter((d) => d.score === 1);
```

## Qué detecta

| País            | Entidades                                                                                                                                                                                   |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Global (8)      | `CREDIT_CARD` `CRYPTO` `DATE_TIME` `EMAIL_ADDRESS` `IBAN_CODE` `IP_ADDRESS` `MAC_ADDRESS` `UUID`                                                                                            |
| Alemania (13)   | `DE_BSNR` `DE_LANR` `DE_HEALTH_INSURANCE` `DE_ID_CARD` `DE_PASSPORT` `DE_SOCIAL_SECURITY` `DE_TAX_ID` `DE_VAT_ID` `DE_TAX_NUMBER` `DE_FUEHRERSCHEIN` `DE_HANDELSREGISTER` `DE_PLZ` `DE_KFZ` |
| Reino Unido (6) | `GB_NHS` `GB_NINO` `GB_DRIVING_LICENCE` `GB_VEHICLE_REGISTRATION` `GB_PASSPORT` `GB_POSTCODE`                                                                                               |
| Italia (5)      | `IT_FISCAL_CODE` `IT_VAT_CODE` `IT_DRIVER_LICENSE` `IT_IDENTITY_CARD` `IT_PASSPORT`                                                                                                         |
| España (8)      | `ES_NIF` `ES_NIE` `ES_PASSPORT` `ES_CIF` `ES_VAT_ID` `ES_NUSS` `ES_CCC` `ES_VEHICLE_PLATE`                                                                                                  |
| Suecia (2)      | `SE_PERSONNUMMER` `SE_ORGANISATIONSNUMMER`                                                                                                                                                  |
| Finlandia (1)   | `FI_PERSONAL_IDENTITY_CODE`                                                                                                                                                                 |
| Polonia (1)     | `PL_PESEL`                                                                                                                                                                                  |

44 entidades, 75 patrones, 18 `kind` distintos. De las 44: **23 con checksum**, 6 con filtro y 15 sin validación.

El prefijo de cada entidad es el código ISO de su país, así que las británicas son `GB_*`. En Presidio, y por tanto en `docs/`, se llaman `UK_*`.

## Cómo se clasifica cada entidad

Cada entidad lleva cuatro clasificaciones, cada una con un único valor, y todas viajan también en cada detección:

| Campo             | Responde a                              | Valores                                                       |
| ----------------- | --------------------------------------- | ------------------------------------------------------------- |
| `country`         | ¿Quién lo emite?                        | `GLOBAL` `ES` `DE` `GB` `IT` `SE` `FI` `PL`                   |
| `kind`            | ¿Qué es, sea del país que sea?          | `TAX_ID` `PASSPORT` `DRIVER_LICENCE` `BANK_ACCOUNT`… (18 en uso) |
| `dataClass`       | ¿Qué tipo de dato sensible es?          | `PERSONAL` `FINANCIAL` `HEALTH` `TECHNICAL` `CORPORATE`       |
| `identifiability` | ¿Identifica a alguien por sí solo?      | `DIRECT` `QUASI`                                              |

`kind` es lo que permite tratar igual documentos que cada país llama distinto: `DE_FUEHRERSCHEIN`, `GB_DRIVING_LICENCE` e `IT_DRIVER_LICENSE` son todos `DRIVER_LICENCE`.

`dataClass`:

- **`PERSONAL` (28):** identifica o describe a una persona física. La regla general del RGPD.
- **`FINANCIAL` (4):** `CREDIT_CARD`, `CRYPTO`, `IBAN_CODE`, `ES_CCC`.
- **`HEALTH` (4):** `DE_BSNR`, `DE_LANR`, `DE_HEALTH_INSURANCE`, `GB_NHS`. Categoría especial del art. 9 del RGPD.
- **`TECHNICAL` (3):** `IP_ADDRESS`, `MAC_ADDRESS`, `UUID`.
- **`CORPORATE` (5):** `ES_CIF`, `DE_VAT_ID`, `DE_HANDELSREGISTER`, `IT_VAT_CODE`, `SE_ORGANISATIONSNUMMER`. Identifican empresas, normalmente no son dato personal.

`identifiability`: solo **3 son `QUASI`** (`DATE_TIME`, `DE_PLZ`, `GB_POSTCODE`). No identifican a nadie por separado, pero código postal más fecha de nacimiento sí.

Ante la duda, cada entidad lleva la clasificación más protectora: un email puede ser `info@empresa.com`, pero el regex no lo distingue del de una persona, así que es `PERSONAL`.

## Cómo decide el score

El score no dice «esto es válido», dice **cuánta confianza tiene la detección**. Tres capas, en este orden:

1. **El patrón** aporta un score base, de 0.01 a 0.8 según lo específica que sea la forma.
2. **El checksum**, si lo hay y cuadra, lo sube a **1.0** y marca `confirmedBy: 'checksum'`. Es aritmética: la letra del NIF, el módulo 97 del IBAN, Luhn en la tarjeta.
3. **Las palabras de contexto** en una ventana de 40 caracteres suman 0.35 con suelo en 0.4, y marcan `confirmedBy: 'context'`. Es búsqueda literal de términos, no similitud semántica.

Lo que quede por debajo de **0.4** se descarta.

Dos comportamientos que conviene conocer:

- **Un checksum que falla NO descarta la detección.** Un DNI con una errata sigue identificando a una persona, así que se tapa igual, con su score base y `confirmedBy: null`. Un falso positivo cuesta una palabra tapada de más; un falso negativo cuesta un DNI publicado.
- **Un `filter` sí descarta.** Es la validación que solo puede rechazar formas imposibles y nunca confirmar, como el UUID nulo o una MAC de todo ceros.
- **Si dos detecciones se solapan, gana una sola**: la de más score, después la más larga, después la que empieza antes y, si siguen empatadas, **la primera por orden alfabético del nombre**. Ese último desempate es arbitrario: `8112180008` pasa a la vez el Luhn sueco y el módulo 11 del NHS, y sale como `GB_NHS` aunque al lado ponga «personnummer».

## Qué NO detecta

Esto importa más que la lista de arriba:

- **Nombres de personas, direcciones y empresas.** `PERSON` necesita un modelo de machine learning; un nombre no tiene forma que un regex pueda reconocer. En `El titular Pedro Losas con DNI <ES_NIF>` el nombre **se queda en claro**.
- **`URL`**, cuyo patrón real es una alternancia de más de 600 TLD escritos a mano, incompleta por construcción.
- **`PHONE_NUMBER`**, que la fuente no detecta con regex: delega en una librería de teléfonos.

Por tanto `blocked: false` significa «no he encontrado nada de lo que sé buscar», **no** «este texto está limpio».

## Añadir una entidad o un país

Cada país es una carpeta en `src/entities/`, con un fichero por entidad. Las de ningún país están en `global/`.

```
src/entities/
  index.ts            ← une todos los países: de aquí salen REGISTRY y EntityName
  spain/
    nif.ts            ← una entidad
    nie.ts
    passport.ts
    checksums.ts      ← sus algoritmos de validación
    index.ts          ← las entidades del país, en orden
```

Cada fichero empieza por su clasificación, para que se lea sin bajar al código:

```ts
export const ES_NIF = defineEntity({
  // ── Classification ──────────────────────────
  name: 'ES_NIF',
  country: 'ES',
  kind: 'TAX_ID',
  dataClass: 'PERSONAL',
  identifiability: 'DIRECT',

  // ── Detection ───────────────────────────────
  description: 'Spanish tax identification number',
  patterns: [{ name: 'nif', regex: String.raw`\b[0-9]?[0-9]{7}[-]?[A-Z]\b`, score: 0.5 }],
  validation: { kind: 'checksum', run: nifValid },
  context: ['dni', 'nif', 'documento nacional de identidad', 'identificación'],
});
```

**Una entidad nueva** son dos pasos: crear su fichero y añadirla a la lista del `index.ts` de su país. `EntityName` y el catálogo se derivan de ahí.

**Un país nuevo**, además:

1. añadir su código a `Country` en `src/core/types.ts`;
2. añadir su lista a `ENTITIES` y su clave a `CATALOG` en `src/entities/index.ts`.

Lo que no compila:

- un campo de clasificación olvidado, o un valor mal escrito (`'TAX_IDD'`);
- una entidad que declara otro país que el de su carpeta: el `index.ts` del país lo comprueba con `satisfies`;
- un país en `Country` que falta en `CATALOG`.

Lo único que **no** avisa: un fichero de entidad que no se añade al `index.ts` de su país. Simplemente no se usa.

## Desarrollo

```bash
bun install
bun run typecheck   # tsc --noEmit
bun run manual      # los escenarios de tests/
bun run build       # dist ESM + CJS + tipos
```

Los tests son scripts manuales que imprimen el JSON, al estilo de `@axium-lab/docxium`. `tests/methods/documents.ts` es el único que **comprueba** algo: pasa un documento de ejemplo por cada país y falla si alguna entidad esperada no aparece.

Cada país tiene su documento en `tests/fixtures/xx_document.ts` (las globales en `global_document.ts`), con todos los identificadores de checksum calculado. La prosa va en castellano pero las etiquetas en el idioma local, porque las palabras de contexto son locales y sin ellas las entidades de score bajo no llegan al umbral.

## De dónde salen los patrones

- **[docs/entidades.md](docs/entidades.md)** — el inventario de Presidio separado en bloque con y sin modelo.
- **[docs/deteccion-regex.md](docs/deteccion-regex.md)** — el manual de implementación: cada patrón con su score y su validación.

Verificado contra el código de Presidio.
