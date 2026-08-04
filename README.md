# @axium-lab/nerium

Detección y anonimización de datos personales en texto, **sin machine learning**. Solo regex, checksums y palabras de contexto.

Alcance: Europa. 39 entidades de 7 países más las multipaís.

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
      "category": "TAX_ID",
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

### Filtrar por categoría o país

No se configura a la entrada: siempre se detecta todo y se filtra la salida. Así no dejas un DNI en claro por haber filtrado de más.

```ts
const { entities } = new Nerium().text(documento, true);

entities.filter((d) => d.category === 'BANK_ACCOUNT');
entities.filter((d) => d.country === 'ES');
entities.filter((d) => d.score === 1);
```

## Qué detecta

| País            | Entidades                                                                                                                                                                                   |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Multipaís (8)   | `CREDIT_CARD` `CRYPTO` `DATE_TIME` `EMAIL_ADDRESS` `IBAN_CODE` `IP_ADDRESS` `MAC_ADDRESS` `UUID`                                                                                            |
| Alemania (13)   | `DE_BSNR` `DE_LANR` `DE_HEALTH_INSURANCE` `DE_ID_CARD` `DE_PASSPORT` `DE_SOCIAL_SECURITY` `DE_TAX_ID` `DE_VAT_ID` `DE_TAX_NUMBER` `DE_FUEHRERSCHEIN` `DE_HANDELSREGISTER` `DE_PLZ` `DE_KFZ` |
| Reino Unido (6) | `UK_NHS` `UK_NINO` `UK_DRIVING_LICENCE` `UK_VEHICLE_REGISTRATION` `UK_PASSPORT` `UK_POSTCODE`                                                                                               |
| Italia (5)      | `IT_FISCAL_CODE` `IT_VAT_CODE` `IT_DRIVER_LICENSE` `IT_IDENTITY_CARD` `IT_PASSPORT`                                                                                                         |
| España (3)      | `ES_NIF` `ES_NIE` `ES_PASSPORT`                                                                                                                                                             |
| Suecia (2)      | `SE_PERSONNUMMER` `SE_ORGANISATIONSNUMMER`                                                                                                                                                  |
| Finlandia (1)   | `FI_PERSONAL_IDENTITY_CODE`                                                                                                                                                                 |
| Polonia (1)     | `PL_PESEL`                                                                                                                                                                                  |

39 entidades, 69 patrones, 18 categorías. De las 39: **19 con checksum**, 6 con filtro y 14 sin validación.

## Cómo decide el score

El score no dice «esto es válido», dice **cuánta confianza tiene la detección**. Tres capas, en este orden:

1. **El patrón** aporta un score base, de 0.01 a 0.8 según lo específica que sea la forma.
2. **El checksum**, si lo hay y cuadra, lo sube a **1.0** y marca `confirmedBy: 'checksum'`. Es aritmética: la letra del NIF, el módulo 97 del IBAN, Luhn en la tarjeta.
3. **Las palabras de contexto** en una ventana de 40 caracteres suman 0.35 con suelo en 0.4, y marcan `confirmedBy: 'context'`. Es búsqueda literal de términos, no similitud semántica.

Lo que quede por debajo de **0.4** se descarta.

Dos comportamientos que conviene conocer:

- **Un checksum que falla NO descarta la detección.** Un DNI con una errata sigue identificando a una persona, así que se tapa igual, con su score base y `confirmedBy: null`. Un falso positivo cuesta una palabra tapada de más; un falso negativo cuesta un DNI publicado.
- **Un `filter` sí descarta.** Es la validación que solo puede rechazar formas imposibles y nunca confirmar, como el UUID nulo o una MAC de todo ceros.

## Qué NO detecta

Esto importa más que la lista de arriba:

- **Nombres de personas, direcciones y empresas.** `PERSON` necesita un modelo de machine learning; un nombre no tiene forma que un regex pueda reconocer. En `El titular Pedro Losas con DNI <ES_NIF>` el nombre **se queda en claro**.
- **`URL`**, cuyo patrón real es una alternancia de más de 600 TLD escritos a mano, incompleta por construcción.
- **`PHONE_NUMBER`**, que la fuente no detecta con regex: delega en una librería de teléfonos.

Por tanto `blocked: false` significa «no he encontrado nada de lo que sé buscar», **no** «este texto está limpio».

## Añadir un país

El catálogo está en `src/core/catalog.ts` y está montado para que **rompa la compilación** hasta que esté todo:

```ts
export const CATALOG = {
  EU: ['CREDIT_CARD', ...],
  ES: ['ES_NIF', 'ES_NIE', 'ES_PASSPORT'],
  // añades: FR: ['FR_INSEE'],
} as const;
```

`Country` y `EntityName` se derivan de ahí, así que al añadir la clave TypeScript empieza a pedirte lo que falta:

1. la categoría, en `CATEGORY_OF` (`Record<EntityName, Category>`)
2. la definición con sus patrones, en `DEFINITIONS` (`Record<EntityName, EntityDefinition>`)

No se puede olvidar ninguno en silencio.

## Desarrollo

```bash
bun install
bun run typecheck   # tsc --noEmit
bun run manual      # los escenarios de tests/
bun run build       # dist ESM + CJS + tipos
```

Los tests son scripts manuales que imprimen el JSON, al estilo de `@axium-lab/docxium`. `tests/methods/documents.ts` es el único que **comprueba** algo: pasa un documento de ejemplo por cada país y falla si alguna entidad esperada no aparece.

Cada país tiene su documento en `tests/fixtures/xx_document.ts`, con todos los identificadores de checksum calculado. La prosa va en castellano pero las etiquetas en el idioma local, porque las palabras de contexto son locales y sin ellas las entidades de score bajo no llegan al umbral.

## De dónde salen los patrones

- **[docs/entidades.md](docs/entidades.md)** — el inventario de Presidio separado en bloque con y sin modelo.
- **[docs/deteccion-regex.md](docs/deteccion-regex.md)** — el manual de implementación: cada patrón con su score y su validación.

Verificado contra el código de Presidio.

H
