# Delta for i18n-infrastructure

## MODIFIED Requirements

### Requirement: i18n Framework Configuration

The system MUST initialize react-i18next at app startup with 7 namespaces (`common`, `landing`, `clients`, `pets`, `services`, `validation`, `appointments`), `i18next-browser-languagedetector` with `navigator.language` detection, and `en` fallback. The `<html lang>` attribute SHALL sync to the active language.

(Previously: configured 6 namespaces without `appointments`)

#### Scenario: Spanish browser preference

- GIVEN `navigator.language` returns `"es-ES"`
- WHEN the app initializes
- THEN `i18next.language` is `"es"` and `<html lang="es">` is set

#### Scenario: English browser preference

- GIVEN `navigator.language` returns `"en-US"`
- WHEN the app initializes
- THEN `i18next.language` is `"en"` and `<html lang="en">` is set

#### Scenario: Unsupported language fallback

- GIVEN `navigator.language` returns `"fr-FR"` (not in supported locales)
- WHEN the app initializes
- THEN language falls back to `"en"`

### Requirement: Locale File Structure

The system MUST provide 14 locale JSON files under `src/locales/{en,es}/` — one per namespace per language, including `appointments`. Keys SHALL follow `section.subsection.label` convention. Every key present in `es` MUST have a corresponding `en` entry.

(Previously: required 12 locale files across 6 namespaces)

#### Scenario: Key parity across languages

- GIVEN `es/appointments.json` has key `"status.pending"`
- WHEN the `en/appointments.json` file is inspected
- THEN key `"status.pending"` exists with the English equivalent "Pending"

#### Scenario: Namespace isolation

- GIVEN a component uses `useTranslation('appointments')`
- WHEN `t('calendar.weekOf')` is called
- THEN the key resolves from `src/locales/{lang}/appointments.json` exclusively
