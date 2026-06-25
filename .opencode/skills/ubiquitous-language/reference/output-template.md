# Output Template

Render the generated glossary to the agreed output path (default
`UBIQUITOUS_LANGUAGE.md` at the repo root) using the structure below.

- Replace every `<...>` placeholder.
- Group `###` term entries under their `##` bounded context, **alphabetically**.
- Order bounded contexts alphabetically, except a single-context project may use
  the project name.
- Omit an optional field (Synonyms / Related) only when there is genuinely
  nothing to list; otherwise include it.

---

````markdown
# Ubiquitous Language — <Project / Repo Name>

> Domain glossary generated from source code. Each term is grounded in code
> references. Definitions describe observed behavior; clauses marked
> `(inferred)` are plausible but not fully provable from code.

- **Source:** `<repo path or URL>`
- **Generated:** <YYYY-MM-DD>
- **Scope:** <whole repo | listed directories/services>
- **Bounded contexts covered:** <Context A>, <Context B>, ...

## How to read this

- **Definition** — what the concept means, based on code.
- **Code references** — where the term is defined and used (`file:line`).
- **Synonyms / aliases** — other names for the same concept in the codebase.
- **Related terms** — linked domain concepts (contains, references, state-of).
- `(inferred)` — interpretation not fully provable from code; confirm with a
  domain expert.

---

## <Bounded Context Name>

<One sentence describing what this context is responsible for.>

### <Term>

**Definition.** <1–3 sentences describing what the term means based on the
code.>

**Code references.**
- `<path/to/file.ext>:<line>` — <definition site>
- `<path/to/file.ext>:<line>` — <representative usage>

**Synonyms / aliases.** <comma-separated alternates, or "None observed.">

**Related terms.** <[Other Term](#other-term)>, contains
<[Child Term](#child-term)>, state-of <[Parent Term](#parent-term)>.

### <Next Term>

...

---

## <Next Bounded Context Name>

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

- Anchors: Markdown auto-anchors `### Term` as `#term` (lowercase, spaces →
  hyphens). Cross-link with `[Term](#term)`.
- Keep one blank line between entries.
- Do not embed code blocks inside definitions — use `file:line` references.
- If there are no open questions, keep the heading and write
  "None — all terms are grounded in code."
