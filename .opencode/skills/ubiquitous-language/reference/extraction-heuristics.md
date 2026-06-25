# Extraction Heuristics

How to decide what is a **domain term** (part of the ubiquitous language) versus
**technical noise**, and how to find candidates across any language.

## 1. What a domain term is

A domain term is a word or phrase a non-technical domain expert (product owner,
business analyst, end user) would recognize and use to discuss the system's
purpose. It names a *concept in the problem space*, not a mechanism in the
solution space.

Quick test: **Could you explain this term to a business stakeholder without
mentioning code, frameworks, or infrastructure?** If yes, it is likely domain
language.

## 2. High-signal sources (language-agnostic)

Search these regardless of language. Use `grep`/`glob`; delegate broad sweeps to
the `explore` agent.

| Source | What to look for |
| ------ | ---------------- |
| Type declarations | classes, structs, interfaces, enums, records, type aliases |
| Domain models | entities, aggregates, value objects, anything in a `domain/`, `model/`, `entities/` folder |
| Events & commands | names ending in `Event`, `Command`, `Created`, `Updated`, `Placed`, `Cancelled`, etc. |
| States | enums/constants describing status or lifecycle (`Pending`, `Shipped`, `Active`) |
| Persistence | table names, column names, migration files, schema definitions |
| API surface | route/path segments (`/orders/{id}/invoice`), GraphQL types, RPC method names |
| Messaging | queue/topic/channel/subject names |
| Config | business-meaningful config keys and feature flags |
| Function names | recurring business nouns/verbs inside method and function names |
| Tests | test/spec names often phrase domain rules in plain language |

### Useful cross-language regex starting points

These are starting points, not exhaustive. Adapt to the languages present.

- Type-like declarations:
  `\b(class|struct|interface|enum|record|type|trait|object|data class)\s+([A-Z][A-Za-z0-9]+)`
- Constant/enum members (states):
  `^[A-Z][A-Z0-9_]{2,}\b`
- SQL tables/columns:
  `CREATE TABLE\s+["` + "`" + `]?(\w+)` and `(VARCHAR|INT|TEXT|UUID|TIMESTAMP)`
- Route segments:
  `["'](/[a-z][a-z0-9_\-/{}]*)["']`

Treat the **PascalCase / CamelCase noun core** of an identifier as the candidate
term (e.g. `OrderLineItem`, `ShippingAddress`, `InvoiceStatus`).

## 3. Keep / drop rules

### Keep
- Business nouns: `Order`, `Invoice`, `Customer`, `Subscription`, `Shipment`.
- Business processes/events: `OrderPlaced`, `PaymentCaptured`, `RefundIssued`.
- Business states: `Pending`, `Fulfilled`, `Overdue`, `Suspended`.
- Domain roles/actors: `Merchant`, `Buyer`, `Approver`.
- Domain quantities/units with meaning: `CreditLimit`, `LoyaltyPoints`.

### Drop (unless they clearly carry domain meaning here)
- Architectural roles: `Controller`, `Service`, `Repository`, `Manager`,
  `Handler`, `Factory`, `Provider`, `Gateway`, `Adapter`.
- Data-transfer plumbing: `DTO`, `VO` (when generic), `Request`, `Response`,
  `Payload`, `Mapper`, `Serializer`, `Converter`.
- Generic scaffolding: `Util`, `Helper`, `Base`, `Abstract`, `Impl`, `Config`,
  `Settings`, `Context`, `Options`, `Builder`.
- Framework/runtime types: HTTP, ORM, DI, logging, serialization primitives.
- Test scaffolding: `Mock`, `Stub`, `Fixture`, `Fake`.

### Borderline — judge by usage
`Account`, `Session`, `Token`, `Job`, `Task`, `Message`, `Channel` may be
domain terms (e.g. a bank `Account`) or pure technical terms. Decide based on
whether their behavior in *this* codebase models the business.

## 4. Synonyms and aliases

Collapse into one canonical term when the same concept appears under different
names. Common signals:
- Same fields/columns under different type names.
- A code term mapped to a different external/API/DB name.
- Abbreviations (`PO` ↔ `PurchaseOrder`), legacy vs. current naming.

Record the non-canonical forms under "Synonyms / aliases".

## 5. Definition discipline

- Definitions describe **observed behavior and data**, not guessed intent.
- 1–3 sentences. No code snippets — cite `file:line` instead.
- Tag any speculative clause with `(inferred)`.
- If a term's meaning cannot be determined from code, list it under
  "Open questions / ambiguities" instead of guessing.
