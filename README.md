# documentation-NER

Investigación sobre las entidades de PII que detecta [Microsoft Presidio](https://github.com/microsoft/presidio), separadas según **necesiten o no un modelo de machine learning**.

Alcance: Europa y Estados Unidos.

## La pregunta

¿Qué datos personales se pueden detectar con solo expresiones regulares, y qué datos exigen un modelo?

## La respuesta

| | Cuántas | Qué detecta | Necesita |
| --- | --- | --- | --- |
| **Bloque 1 — sin modelo** | 50 entidades | Identificadores con formato: DNI, IBAN, teléfono, tarjeta, matrícula… | Nada |
| **Bloque 2 — con modelo** | 4 entidades | Nombres de personas, direcciones, empresas, nacionalidad | Un modelo descargado o un servicio externo |

Casi todo el catálogo de Presidio es regex. Pero las cuatro entidades del bloque 2 son inevitables si necesitas anonimizar nombres: **un nombre de persona no tiene forma**, así que no hay patrón que escribir.

## Los documentos

- **[docs/entidades.md](docs/entidades.md)** — el inventario. Qué entidad hay en cada bloque, por país, y cuáles son fiables.
- **[docs/deteccion-regex.md](docs/deteccion-regex.md)** — el manual de implementación en TypeScript. Cada patrón con su regex, su nivel de confianza y su validación.

## Cosas que conviene saber antes de empezar

- **España solo tiene 3 entidades propias**: NIF, NIE y pasaporte. No existe recognizer para CIF, seguridad social, tarjeta sanitaria, permiso de conducir, matrícula ni código postal.
- **`IBAN_CODE` es la entidad más rentable**: un patrón y un cálculo te cubren 76 países con validación real.
- **En español, el bloque 2 no funciona de serie**: la configuración por defecto de Presidio es solo inglés.
- **Casi la mitad de los patrones son ruido sin contexto**: encuentran sobre todo falsos positivos si no hay una palabra clave cerca que confirme de qué se habla.

---

Verificado contra el código fuente de Presidio en el commit `2bb88d2` (29 jul 2026). Los patrones se probaron en Node v25.2.1.
