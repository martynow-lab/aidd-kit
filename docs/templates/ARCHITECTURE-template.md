# ARCHITECTURE — <project-name>

<!-- Stage 1 output. Copy this template to .cursor/docs/ARCHITECTURE.md and fill it in.
     This is the single source of technical project rules: every later stage
     (SPEC, TEST-PLAN, RED/GREEN, review) treats it as the contract.
     Attach the matching tech-stack rule from .cursor/rules/ while drafting;
     reference the rule here and record project-specific exceptions only —
     do not duplicate the whole rule.
     Done when: all 12 sections are filled and the user says "architecture frozen". -->

| | |
|---|---|
| **Project** | <project-name> |
| **Status** | `draft` <!-- draft → frozen --> |
| **Date** | YYYY-MM-DD |
| **Stack rule** | `.cursor/rules/tech-stack-<...>.md` <!-- vanilla-js / astro-js / wp-classic-theme / wp-plugin --> |

---

## 1. Tech stack

<!-- Languages, runtime, build tool, deploy target. Versions where they matter.
     Example: Node 22, Vite 6, Astro 5, deployed to Cloudflare Pages. -->

- Language(s): ...
- Runtime: ...
- Build: ...
- Deploy: ...

## 2. Architectural principles

<!-- Layers and their responsibilities, dependency direction, no circular deps.
     Keep it to 3-7 enforceable statements, not aspirations. -->

- ...

## 3. Directory structure

<!-- Folder tree with one-line purpose per folder. Only folders that exist or
     are planned for the MVP — no speculative structure. -->

```text
src/
├── ...        # ...
└── ...        # ...
```

## 4. Naming conventions

<!-- Files, variables, functions, components, CSS classes, WP hooks/prefixes.
     One line per convention with an example. -->

- Files: ...
- Variables / functions: ...
- Components: ...

## 5. Allowed libraries

<!-- Whitelist with one-line rationale each. If a library is not here,
     adding it requires updating this document first. -->

| Library | Purpose / rationale |
|---------|---------------------|
| ... | ... |

## 6. Forbidden libraries

<!-- Blacklist: frameworks that conflict with the stack, utilities that duplicate
     the platform or an allowed library. State the alternative. -->

| Library / category | Why forbidden | Use instead |
|--------------------|---------------|-------------|
| ... | ... | ... |

## 7. Security

<!-- Secrets handling, output escaping, input sanitization, auth, CORS,
     nonces/capabilities (WP). These feed SPEC Edge Cases and revizor checks. -->

- Secrets: ...
- Escaping / sanitization: ...
- Auth: ...

## 8. Testing standards

<!-- Which check types this project uses and when (see WORKFLOW Stage 4):
     unit / integration / E2E / manual. Name the tools and the commands. -->

- Unit: ... <!-- e.g. Vitest; pure logic without I/O -->
- Integration: ...
- E2E: ... <!-- e.g. Playwright; critical user flows only -->
- Manual: ...
- Commands: `npm test`, ...

### Quality gates

<!-- Mandatory objective gates. Hooks are part of the project setup, not optional. -->

Husky pre-commit and pre-push hooks are **required**. Templates live in
`.cursor/docs/templates/husky/`.

Install:

1. `npm i -D husky lint-staged`
2. `npx husky init`
3. Copy `.cursor/docs/templates/husky/pre-commit` and `.cursor/docs/templates/husky/pre-push` into `.husky/`

- Pre-commit: lint-staged + project checks on staged files
- Pre-push: full test run (+ E2E if specs exist)
- Bypassing a gate (`--no-verify`) is allowed only deliberately for RED commits, with an explanation in the commit message

## 9. API rules

<!-- REST/GraphQL conventions, error format, versioning, mocking strategy for tests.
     Delete this section only if the project truly has no API surface. -->

- Style: ...
- Errors: ...
- Mocking: ...

## 10. Database rules

<!-- Migrations, ORM vs raw SQL, indexing policy, naming. For WP: custom tables
     vs post meta / options. Delete only if there is no persistence. -->

- ...

## 11. Coding style

<!-- Lint and format tooling with config location; comment policy.
     Comments are English only and explain non-obvious intent. -->

- Lint: ...
- Format: ...
- Comments: English only, non-obvious intent only

## 12. Technical constraints

<!-- Hard limits the code must respect: browser targets, Node version,
     hosting limits, bundle budget, PHP/WP minimum versions. -->

- ...
