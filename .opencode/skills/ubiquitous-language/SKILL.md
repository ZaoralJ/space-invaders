---
name: ubiquitous-language
description: >-
  Extracts the ubiquitous (domain) language from any codebase and writes a
  DDD-style glossary to UBIQUITOUS_LANGUAGE.md, with definitions, code
  references, synonyms, and inter-term relationships grouped by bounded context.
  USE WHEN the user asks to extract ubiquitous language, build a domain
  glossary, create a domain dictionary, document domain terms, map domain
  concepts, or describe the business vocabulary of a codebase. DO NOT USE FOR
  API reference docs, code-comment generation, README generation, or
  changelog writing.
metadata:
  version: "1.0.0"
---

# Ubiquitous Language Extraction

Build a Domain-Driven Design **ubiquitous language** glossary for *any*
codebase, regardless of programming language or framework. The output is a
single Markdown file containing domain terms, evidence-based definitions, code
references, synonyms/aliases, and relationships, grouped by bounded context.

This skill is **language-agnostic**: it relies on directory structure, naming
patterns, and full-text search (`glob`, `grep`, `task`), never on
language-specific tooling.

## Reference files

Read these before producing output. Paths are relative to this skill's folder.

| File | Use it for |
| ---- | ---------- |
| `reference/extraction-heuristics.md` | Deciding what is a domain term vs. technical noise; language-agnostic search patterns. |
| `reference/output-template.md` | The exact structure of the generated `UBIQUITOUS_LANGUAGE.md`. |

## Core principles (non-negotiable)

1. **Evidence over assumption.** Every term MUST cite at least one
   `path/to/file.ext:line`. No reference, no entry.
2. **Describe behavior, not intent.** Definitions state what the code *does*.
   Any meaning that is plausible but not provable from code is tagged
   `(inferred)`.
3. **Domain over infrastructure.** Exclude purely technical terms (e.g.
   `Controller`, `Repository`, `DTO`, `Mapper`, `Utils`, `Helper`, `Config`)
   unless they clearly carry business meaning in this codebase.
4. **Consistency.** Always render with `reference/output-template.md`.

## Workflow

Follow these steps in order. Use the `task` tool with the `explore` agent for
broad searches to keep context small; read specific files directly only when
synthesizing a definition.

### Step 1 — Scope and confirm

- Detect the repository root and the languages present (by file extensions).
- Confirm with the user:
  - Scope: entire repo, or specific directories/services.
  - Output path (default: `UBIQUITOUS_LANGUAGE.md` at the repo root).
- If the user already gave scope and output path, skip the questions.

### Step 2 — Map bounded contexts

Infer bounded contexts (the top-level grouping for the glossary) from, in order
of preference:

1. Explicit module/service/package boundaries (top-level source dirs,
   monorepo packages, microservice folders).
2. Domain-named directories (e.g. `billing/`, `orders/`, `inventory/`).
3. If the codebase is small or flat, use a single context named after the
   project.

Produce a short list of context names. These become the `##` sections.

### Step 3 — Harvest term candidates

For each context, gather identifier candidates from high-signal, cross-language
sources. See `reference/extraction-heuristics.md` for concrete patterns. Sources
include:

- Type definitions: classes, structs, interfaces, enums, type aliases, records.
- Domain models: entities, aggregates, value objects.
- Behavior: domain events, commands, states/status enums, lifecycle names.
- Persistence: database table and column names, schema/migration files.
- Boundaries: route/endpoint path segments, message/queue/topic names,
  config keys.
- Recurring business nouns inside function and method names.

Delegate this breadth-first collection to the `explore` agent via `task`.

### Step 4 — Filter signal from noise

Apply the keep/drop heuristics in `reference/extraction-heuristics.md`:

- **Keep** business nouns and concepts a domain expert would recognize.
- **Drop** framework/infrastructure boilerplate, generic technical scaffolding,
  and pure plumbing — unless the term demonstrably carries domain meaning here.
- Collapse obvious synonyms/aliases into a single canonical term (record the
  others under "Synonyms / aliases").

### Step 5 — Synthesize definitions from evidence

For each kept term:

1. Read its definition site plus 1–3 representative usages.
2. Write a 1–3 sentence definition grounded in observed behavior.
3. Collect the `file:line` references.
4. If meaning is partly assumed, append `(inferred)` to the uncertain clause.

### Step 6 — Detect relationships

Record relationships between terms:

- **Contains / part-of** (aggregates, composition, embedded objects).
- **References / associates with** (foreign keys, fields holding other terms).
- **Synonym / alias** (different names, same concept).
- **State-of** (status enums belonging to an entity).

Cross-link related terms in each entry.

### Step 7 — Emit the document

Render the glossary using `reference/output-template.md`. The template encodes
the full presentable format — read it before writing anything. Key points:

- **Output path:** `docs/ubiquitous-language.md` (not the repo root).
- **Header:** metadata table (Source, Generated, Bounded context).
- **Marker legend table** — 📖 🏷️ ↔️ 📍 — replaces verbose bold labels.
- **Category `##` sections** (3–5 groups reflecting domain structure), each
  containing `<details>` collapsible cards — one per term. No `###` headings.
- **Inside each card:** markers on their own lines; 📍 references on a single
  dot-separated line; `<kbd>` tags for keyboard shortcuts/cheat codes; inline
  tables for enumerable value sets (phases, sub-types, control variants).
- **Emoji** on creature/effect terms where they aid scannability.
- A final "Open questions" section.

Write to `docs/ubiquitous-language.md` with the `write` tool.

### Step 8 — Verify

Spot-check 3–5 entries by re-reading their cited `file:line` to confirm the
references resolve and the definitions match the code. Fix any mismatch before
reporting completion. Then summarize: contexts covered, term count, and any
open questions.

## Notes

- Prefer enriching an existing `UBIQUITOUS_LANGUAGE.md` over silently
  overwriting; if one exists, confirm with the user before replacing it.
- Keep definitions free of code snippets — link with `file:line` instead.
- If the codebase has no discernible domain terms (e.g. pure infrastructure),
  say so plainly rather than inventing terms.
