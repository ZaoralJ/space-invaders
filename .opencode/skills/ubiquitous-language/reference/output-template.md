# Output Template

Render the generated glossary to the agreed output path (default
`UBIQUITOUS_LANGUAGE.md` at the repo root) using the structure below.

- Replace every `<...>` placeholder.
- Group term cards under `##` **category** sections (3–5 groups that reflect the
  domain structure / bounded contexts). Order categories logically; order term
  cards within a category **alphabetically**.
- Each term is a `<details>` collapsible card — **do not use `###` headings** for
  terms.
- Use the marker legend (📖 🏷️ ↔️ 📍) instead of verbose bold labels.
- Omit an optional marker line (🏷️ synonyms / ↔️ related) only when there is
  genuinely nothing to list; otherwise include it.

---

````markdown
# Ubiquitous Language — <Project / Repo Name>

> Domain glossary generated from source code. Each term is grounded in code
> references. Definitions describe observed behavior; clauses marked
> `(inferred)` are plausible but not fully provable from code.

| | |
| --- | --- |
| **Source** | `<repo path or URL>` |
| **Generated** | <YYYY-MM-DD> |
| **Scope** | <whole repo \| listed directories/services> |
| **Bounded contexts** | <Context A>, <Context B>, ... |

## How to read this

| Marker | Meaning |
| --- | --- |
| 📖 | **Definition** — what the concept means, based on code. |
| 🏷️ | **Synonyms / aliases** — other names for the same concept. |
| ↔️ | **Related terms** — linked concepts (contains, references, state-of). |
| 📍 | **Code references** — where the term is defined and used (`file:line`). |

`(inferred)` marks an interpretation not fully provable from code; confirm with
a domain expert.

---

## <Category / Bounded Context Name>

<One sentence describing what this category is responsible for.>

<details>
<summary><b><Term></b></summary>

📖 <1–3 sentences describing what the term means based on the code.>

🏷️ <comma-separated alternates, or "None observed.">

↔️ contains [<Child Term>](#child-term) · references [<Other Term>](#other-term) · state-of [<Parent Term>](#parent-term)

📍 `<path/to/file.ext>:<line>` (definition) · `<path/to/file.ext>:<line>` (usage)

<!-- Optional: inline table for an enumerable value set (states, sub-types, control variants) -->
| Value | Meaning |
| --- | --- |
| `<VALUE_A>` | <meaning> |
| `<VALUE_B>` | <meaning> |

<!-- Optional: keyboard shortcuts / cheat codes rendered with <kbd> -->
<kbd><Key></kbd> — <action>

</details>

<details>
<summary><b><Next Term></b></summary>

...

</details>

---

## <Next Category Name>

...

---

## Open questions / ambiguities

Terms or concepts that could not be confidently defined from code and need
human confirmation:

- **<Term>** — <what is unclear and which references were inspected>.
- **<Term>** — <conflicting usages, ambiguous naming, etc.>.
````

---

## Rendering notes

- **Cards, not headings.** Each term is a `<details><summary>` block; the term
  name goes in `<summary>` (bold). This keeps long glossaries collapsible.
- **Anchors.** Since terms are not `###` headings, create cross-link targets by
  matching the term's lowercased, hyphenated name (e.g. `[Work Center](#work-center)`).
  If your renderer does not auto-anchor `<summary>`, add an explicit
  `<a id="work-center"></a>` inside the card.
- **Markers on their own lines.** Put each of 📖 / 🏷️ / ↔️ / 📍 on its own line.
- **References line.** Put all 📍 references on a single line, separated by ` · `
  (dot), each as `` `file:line` `` with a short parenthetical role.
- **Related-terms line.** Separate relationships with ` · `; prefix each with the
  relationship verb (contains, references, state-of, part-of, synonym-of).
- **Enumerable value sets.** Render states, sub-types, or control variants as an
  inline table inside the card rather than prose.
- **Keyboard shortcuts / cheat codes.** Wrap keys in `<kbd>...</kbd>`.
- Do not embed code snippets inside definitions — use `file:line` references.
- If there are no open questions, keep the heading and write
  "None — all terms are grounded in code."