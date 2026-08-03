# Entidades predefinidas de Presidio — Europa y Estados Unidos

| País        | Entidades |
| ----------- | --------- |
| Alemania    | 13        |
| Reino Unido | 6         |
| Italia      | 5         |
| España      | 3         |
| Suecia      | 2         |
| Finlandia   | 1         |
| Polonia     | 1         |

## Bloque 1 — Sin machine learning (solo regex)

Leyenda de la columna _Validación extra_:

| Símbolo | Significado                                 | Efecto en la detección                         |
| ------- | ------------------------------------------- | ---------------------------------------------- |
| ✓       | Recalcula un dígito de control y lo compara | Confirma: la detección pasa a confianza máxima |
| ~       | Solo rechaza lo que es imposible            | Descarta ruido, pero nunca confirma nada       |
| —       | Nada más allá del regex                     | Todo lo que tenga la forma se reporta          |

Todas funcionan sin descargar ni un solo modelo.

### Genéricas / multipaís — 10 entidades

Aplican a cualquier país, incluidos los que no tienen recognizer propio.

| Entidad         | Recognizer             | Fichero                             | Validación extra |
| --------------- | ---------------------- | ----------------------------------- | ---------------- |
| `CREDIT_CARD`   | `CreditCardRecognizer` | `generic/credit_card_recognizer.py` | ✓ Luhn           |
| `CRYPTO`        | `CryptoRecognizer`     | `generic/crypto_recognizer.py`      | ✓ base58         |
| `DATE_TIME`     | `DateRecognizer`       | `generic/date_recognizer.py`        | —                |
| `EMAIL_ADDRESS` | `EmailRecognizer`      | `generic/email_recognizer.py`       | ✓ TLD            |
| `IBAN_CODE`     | `IbanRecognizer`       | `generic/iban_recognizer.py`        | ✓ módulo 97      |
| `IP_ADDRESS`    | `IpRecognizer`         | `generic/ip_recognizer.py`          | ~ parseo de IP   |
| `MAC_ADDRESS`   | `MacAddressRecognizer` | `generic/mac_recognizer.py`         | ~ formato hex    |
| `PHONE_NUMBER`  | `PhoneRecognizer`      | `generic/phone_recognizer.py`       | `phonenumbers`   |
| `URL`           | `UrlRecognizer`        | `generic/url_recognizer.py`         | —                |
| `UUID`          | `UuidRecognizer`       | `generic/uuid_recognizer.py`        | ~ RFC 4122       |

`IBAN_CODE` es la entidad genérica con más peso en contexto europeo: cubre los 27 países de la UE con validación módulo 97 real, sin necesidad de recognizer por país. Sus patrones viven en `generic/iban_patterns.py`, que no define ninguna clase — es solo datos.

`PHONE_NUMBER` cubre todas las regiones de `phonenumbers.SUPPORTED_REGIONS`, también las de países sin recognizer propio.

### Europa — 31 entidades

#### Alemania — 13

Todos en `country_specific/germany/`.

| Entidad               | Recognizer                    | Validación extra |
| --------------------- | ----------------------------- | ---------------- |
| `DE_BSNR`             | `DeBsnrRecognizer`            | ~                |
| `DE_FUEHRERSCHEIN`    | `DeFuehrerscheinRecognizer`   | —                |
| `DE_HANDELSREGISTER`  | `DeHandelsregisterRecognizer` | —                |
| `DE_HEALTH_INSURANCE` | `DeHealthInsuranceRecognizer` | ✓                |
| `DE_ID_CARD`          | `DeIdCardRecognizer`          | ✓                |
| `DE_KFZ`              | `DeKfzRecognizer`             | —                |
| `DE_LANR`             | `DeLanrRecognizer`            | ✓                |
| `DE_PASSPORT`         | `DePassportRecognizer`        | ✓                |
| `DE_PLZ`              | `DePlzRecognizer`             | —                |
| `DE_SOCIAL_SECURITY`  | `DeSocialSecurityRecognizer`  | ✓                |
| `DE_TAX_ID`           | `DeTaxIdRecognizer`           | ✓                |
| `DE_TAX_NUMBER`       | `DeTaxNumberRecognizer`       | —                |
| `DE_VAT_ID`           | `DeVatIdRecognizer`           | ✓                |

Contraste que conviene notar: `DE_TAX_ID` valida checksum y `DE_TAX_NUMBER` no. Son dos identificadores fiscales alemanes distintos con niveles de precisión distintos en Presidio — el segundo dará más falsos positivos.

Alemania es también el único de los siete con entidades del ámbito sanitario (`DE_BSNR`, `DE_LANR`, `DE_HEALTH_INSURANCE`).

#### Reino Unido — 6

| Entidad                   | Recognizer                        | Validación extra |
| ------------------------- | --------------------------------- | ---------------- |
| `UK_DRIVING_LICENCE`      | `UkDrivingLicenceRecognizer`      | ~                |
| `UK_NHS`                  | `NhsRecognizer`                   | ✓                |
| `UK_NINO`                 | `UkNinoRecognizer`                | —                |
| `UK_PASSPORT`             | `UkPassportRecognizer`            | —                |
| `UK_POSTCODE`             | `UkPostcodeRecognizer`            | —                |
| `UK_VEHICLE_REGISTRATION` | `UkVehicleRegistrationRecognizer` | ✓                |

`UK_NHS` viene de `NhsRecognizer`, sin prefijo en el nombre de clase. Si buscas `UkNhsRecognizer` no lo encuentras.

#### Italia — 5

| Entidad             | Recognizer                  | Validación extra |
| ------------------- | --------------------------- | ---------------- |
| `IT_DRIVER_LICENSE` | `ItDriverLicenseRecognizer` | —                |
| `IT_FISCAL_CODE`    | `ItFiscalCodeRecognizer`    | ✓                |
| `IT_IDENTITY_CARD`  | `ItIdentityCardRecognizer`  | —                |
| `IT_PASSPORT`       | `ItPassportRecognizer`      | —                |
| `IT_VAT_CODE`       | `ItVatCodeRecognizer`       | ✓                |

`IT_VAT_CODE` vive en `it_vat_code.py`, el único fichero de todo el árbol sin sufijo `_recognizer`.

#### España — 3

| Entidad       | Recognizer             | Fichero                                            | Validación extra |
| ------------- | ---------------------- | -------------------------------------------------- | ---------------- |
| `ES_NIE`      | `EsNieRecognizer`      | `country_specific/spain/es_nie_recognizer.py`      | ✓                |
| `ES_NIF`      | `EsNifRecognizer`      | `country_specific/spain/es_nif_recognizer.py`      | ✓                |
| `ES_PASSPORT` | `EsPassportRecognizer` | `country_specific/spain/es_passport_recognizer.py` | —                |

**Identificadores españoles que sí puedes detectar:**

| Identificador      | Entidad Presidio | De dónde sale | Validación extra   |
| ------------------ | ---------------- | ------------- | ------------------ |
| DNI / NIF          | `ES_NIF`         | propia        | ✓ letra de control |
| NIE                | `ES_NIE`         | propia        | ✓ letra de control |
| Pasaporte          | `ES_PASSPORT`    | propia        | —                  |
| Cuenta bancaria    | `IBAN_CODE`      | genérica      | ✓ módulo 97        |
| Teléfono           | `PHONE_NUMBER`   | genérica      | `phonenumbers`     |
| Email              | `EMAIL_ADDRESS`  | genérica      | ✓ TLD              |
| Tarjeta de crédito | `CREDIT_CARD`    | genérica      | ✓ Luhn             |

**Identificadores españoles que NO tienen recognizer:**

| Identificador                                | Nota                                                                                                                                                                   |
| -------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **CIF** (identificación fiscal de empresas)  | El más notable. Verificado: el regex de `ES_NIF` **no** lo captura, porque exige dígitos antes de la letra y el CIF empieza por letra (`B12345674` → sin coincidencia) |
| **NUSS** (número de la seguridad social)     | 12 dígitos, sin cobertura                                                                                                                                              |
| **Tarjeta sanitaria individual** (TSI / CIP) | Formato distinto por comunidad autónoma                                                                                                                                |
| **Permiso de conducir**                      | Existe para Alemania, Italia, Reino Unido — no para España                                                                                                             |
| **Matrícula de vehículo**                    | Existe para Alemania, Reino Unido — no para España                                                                                                                     |
| **Código postal**                            | Existe para Alemania (`DE_PLZ`) y Reino Unido (`UK_POSTCODE`) — no para España                                                                                         |

Todo lo de la segunda tabla hay que cubrirlo con recognizers propios. Y ojo con un detalle: el regex de `ES_NIE` lleva el prefijo opcional (`[X-Z]?`), así que también casa un NIF normal como `12345678Z`. Lo salva la validación, que exige que el primer carácter sea `X`, `Y` o `Z` y descarta la coincidencia. Es un buen ejemplo de por qué la columna _Validación extra_ importa: sin ella tendrías el mismo número etiquetado como dos entidades distintas.

#### Suecia — 2

| Entidad                  | Recognizer                        | Validación extra |
| ------------------------ | --------------------------------- | ---------------- |
| `SE_ORGANISATIONSNUMMER` | `SeOrganisationsnummerRecognizer` | ✓                |
| `SE_PERSONNUMMER`        | `SePersonnummerRecognizer`        | ✓                |

#### Finlandia — 1

| Entidad                     | Recognizer                         | Validación extra |
| --------------------------- | ---------------------------------- | ---------------- |
| `FI_PERSONAL_IDENTITY_CODE` | `FiPersonalIdentityCodeRecognizer` | ✓                |

#### Polonia — 1

| Entidad    | Recognizer          | Validación extra |
| ---------- | ------------------- | ---------------- |
| `PL_PESEL` | `PlPeselRecognizer` | ✓                |

Suecia, Finlandia y Polonia comparten un patrón: pocas entidades, pero **todas con checksum**. Cobertura estrecha y precisa, al contrario que Estados Unidos.

### Estados Unidos — 9 entidades

Todos en `country_specific/us/`.

| Entidad              | Recognizer                 | Validación extra |
| -------------------- | -------------------------- | ---------------- |
| `ABA_ROUTING_NUMBER` | `AbaRoutingRecognizer`     | ✓                |
| `MEDICAL_LICENSE`    | `MedicalLicenseRecognizer` | ✓                |
| `US_BANK_NUMBER`     | `UsBankRecognizer`         | —                |
| `US_DRIVER_LICENSE`  | `UsLicenseRecognizer`      | —                |
| `US_ITIN`            | `UsItinRecognizer`         | —                |
| `US_MBI`             | `UsMbiRecognizer`          | —                |
| `US_NPI`             | `UsNpiRecognizer`          | ✓                |
| `US_PASSPORT`        | `UsPassportRecognizer`     | —                |
| `US_SSN`             | `UsSsnRecognizer`          | ~                |

Dos trampas de nomenclatura:

- `US_DRIVER_LICENSE` lo emite `UsLicenseRecognizer`, no `UsDriverLicenseRecognizer`.
- `ABA_ROUTING_NUMBER` y `MEDICAL_LICENSE` **no llevan prefijo `US_`** aunque vivan en `country_specific/us/`. Si filtras entidades estadounidenses por prefijo, se te escapan las dos.

`US_SSN` es un caso aparte: el número de la seguridad social estadounidense **no tiene dígito de control**, así que no hay nada que recalcular. Su única comprobación es que los separadores sean coherentes — rechaza `123-45.6789` por mezclar guion y punto, pero no puede decirte si el número existe.

---

## Bloque 2 — Con machine learning

Necesitan un modelo. No son específicos de país: cubren las entidades semánticas, las que no tienen forma sintáctica que un patrón pueda capturar. Se subdividen por dónde vive el modelo.

### Qué cubre este bloque y el bloque 1 no

Estas cuatro entidades **solo existen aquí**. No hay ningún regex en el bloque 1 que las detecte, y no puede haberlo: un nombre de persona no tiene forma.

| Entidad        | Qué detecta                            |
| -------------- | -------------------------------------- |
| `PERSON`       | Nombres de personas                    |
| `LOCATION`     | Direcciones, ciudades, países          |
| `ORGANIZATION` | Empresas, instituciones                |
| `NRP`          | Nacionalidad, religión, grupo político |

Si tu caso de uso incluye anonimizar nombres o direcciones, **el bloque 1 no te sirve** y necesitas modelo. No es una cuestión de esfuerzo: es que no hay patrón que escribir.

### El idioma sí importa aquí

A diferencia del bloque 1, donde un regex funciona igual sea el texto en español o en inglés, aquí el modelo se entrena por idioma. Verificado en los ficheros de configuración de `presidio_analyzer/conf/`:

| Configuración              | Idiomas incluidos                               |
| -------------------------- | ----------------------------------------------- |
| `default.yaml`             | **solo inglés** (`en_core_web_lg`)              |
| `spacy_multilingual.yaml`  | inglés, alemán, **español** (`es_core_news_md`) |
| `stanza.yaml`              | solo inglés                                     |
| `stanza_multilingual.yaml` | inglés, alemán — **sin español**                |
| `transformers.yaml`        | solo inglés                                     |

Dos consecuencias para un proyecto en español:

1. **De serie no funciona.** La configuración por defecto es inglés únicamente. Hay que cambiar a `spacy_multilingual.yaml` o declarar el modelo español a mano.
2. **Con Stanza no hay español.** Si necesitas ese motor, tendrías que añadir el modelo tú.

### Dos ajustes por defecto que conviene saber

Ambos verificados en los mismos ficheros de configuración:

- **`default.yaml` descarta `ORGANIZATION` por completo.** Aparece en `labels_to_ignore` con el comentario del propio Presidio: `# Has many false positives`. Si esperas detectar empresas con la configuración por defecto, no vas a ver ninguna.
- **`spacy_multilingual.yaml` no la descarta, pero le baja el score.** Mete `ORG` y `ORGANIZATION` en `low_score_entity_names`, y `low_confidence_score_multiplier: 0.4` multiplica su confianza por 0.4.

Es decir: de las cuatro entidades exclusivas de este bloque, `ORGANIZATION` es la menos fiable y Presidio lo asume explícitamente.

### 2.a — Modelo local (pesos en tu máquina)

| Recognizer                 | Fichero                                             | Entidades por defecto                                                                   |
| -------------------------- | --------------------------------------------------- | --------------------------------------------------------------------------------------- |
| `SpacyRecognizer`          | `nlp_engine_recognizers/spacy_recognizer.py`        | `DATE_TIME`, `NRP`, `LOCATION`, `PERSON`, `ORGANIZATION`                                |
| `StanzaRecognizer`         | `nlp_engine_recognizers/stanza_recognizer.py`       | Hereda de `SpacyRecognizer` (mismas 5)                                                  |
| `TransformersRecognizer`   | `nlp_engine_recognizers/transformers_recognizer.py` | `PERSON`, `LOCATION`, `ORGANIZATION`, `AGE`, `ID`, `EMAIL`, `DATE_TIME`, `PHONE_NUMBER` |
| `GLiNERRecognizer`         | `ner/gliner_recognizer.py`                          | Configurable; por defecto toma `NerModelConfiguration`                                  |
| `HuggingFaceNerRecognizer` | `ner/huggingface_ner_recognizer.py`                 | Derivadas de `label_mapping` del modelo                                                 |
| `MedicalNERRecognizer`     | `ner/medical_ner_recognizer.py`                     | 8 entidades clínicas (abajo)                                                            |

Las entidades por defecto de `GLiNERRecognizer` salen de `MODEL_TO_PRESIDIO_ENTITY_MAPPING` en `nlp_engine/ner_model_configuration.py`. El mapa tiene 19 claves de modelo que colapsan en **9 entidades Presidio** únicas:

`PERSON`, `LOCATION`, `ORGANIZATION`, `DATE_TIME`, `NRP`, `AGE`, `ID`, `EMAIL`, `PHONE_NUMBER`

El colapso es intencionado: `PER`/`PERSON`/`PATIENT`/`STAFF`/`HCW` → `PERSON`; `LOC`/`LOCATION`/`GPE` → `LOCATION`; `ORG`/`HOSP`/`PATORG`/`HOSPITAL` → `ORGANIZATION`; `DATE`/`TIME` → `DATE_TIME`.

`MedicalNERRecognizer` extiende `HuggingFaceNerRecognizer` con el modelo `blaze999/Medical-NER` y aporta las únicas entidades clínicas del catálogo:

`MEDICAL_DISEASE_DISORDER`, `MEDICAL_MEDICATION`, `MEDICAL_THERAPEUTIC_PROCEDURE`, `MEDICAL_CLINICAL_EVENT`, `MEDICAL_BIOLOGICAL_ATTRIBUTE`, `MEDICAL_BIOLOGICAL_STRUCTURE`, `MEDICAL_FAMILY_HISTORY`, `MEDICAL_HISTORY`

### 2.b — Modelo remoto (servicio externo)

| Recognizer                         | Fichero                                              | Clase base              | Entidades                                        |
| ---------------------------------- | ---------------------------------------------------- | ----------------------- | ------------------------------------------------ |
| `AzureAILanguageRecognizer`        | `third_party/azure_ai_language.py`                   | `RemoteRecognizer`      | Enum `PiiEntityCategory` del SDK de Azure        |
| `AzureHealthDeidRecognizer`        | `third_party/ahds_recognizer.py`                     | `RemoteRecognizer`      | Enum `PhiCategory` de Azure Health Data Services |
| `BasicLangExtractRecognizer`       | `third_party/basic_langextract_recognizer.py`        | `LangExtractRecognizer` | Definidas en configuración                       |
| `AzureOpenAILangExtractRecognizer` | `third_party/azure_openai_langextract_recognizer.py` | `LangExtractRecognizer` | Definidas en configuración                       |

`LangExtractRecognizer` (`third_party/langextract_recognizer.py`) es una `ABC` que extiende `LMRecognizer`: es la vía LLM. No se instancia; sus dos subclases sí. `third_party/azure_openai_provider.py` no define ningún recognizer — es solo el proveedor de cliente.

// Esto es importante

Aquí las entidades **no están en el código de Presidio**. Vienen del enum del SDK de Azure o de tu fichero de configuración. Cualquier lista que escribas en un doc queda desactualizada cuando el proveedor cambia su catálogo.
xx

---
