# AiDD kit

Portable **AiDD Workflow** tooling for Cursor (and similar agents): stage specialists, templates, SPEC linter, conductor skill, and project rules.

This repo **is** the kit. Its tree matches a consuming project’s `.cursor/` directory — install by cloning or rsync into `.cursor/`.

**Repository:** [github.com/martynow-lab/aidd-kit](https://github.com/martynow-lab/aidd-kit)

**Source of truth:** this repository. Consumer projects (e.g. a sandbox app, then production) keep a vendored copy under `.cursor/` and sync with `rsync`. Do **not** use a git submodule at `.cursor/` — product docs and `workspace/` live there and must stay in the consumer repo.

## Prerequisites (consumer project)

Toolchain agents and husky gates expect in the **application** repo (adapt via one `rules/tech-stack-*.md`):

| Need | Typical scripts / paths |
|------|-------------------------|
| Node.js ≥ 22 | `.nvmrc` / `package.json` `engines` |
| ESLint + Prettier | `lint`, `format`, `check` |
| Unit tests (Vitest, PHPUnit, …) | `test` / `test:unit` / `test:changed` |
| E2E (Playwright, …) | `test:e2e` (may no-op when no specs) |
| Husky + lint-staged | Stage 1 gates from `docs/templates/husky/` |
| SPEC linter | `"spec:validate": "node .cursor/tools/spec-validate/index.js"` |

Husky templates expect `check` and either `test:changed` (pre-commit) or `test:e2e` (pre-push) — wire them to match your repo.

## Install into a project

```bash
# Greenfield — clone into .cursor
git clone https://github.com/martynow-lab/aidd-kit.git .cursor
# Then create product docs locally (ARCHITECTURE, ROADMAP, workspace) — only in the consumer
```

Or rsync from a clone / local checkout (same excludes as updates below).

Then in the project:

1. Add the `spec:validate` npm script (table above) if missing.
2. Keep **one** `rules/tech-stack-*.md` that matches your stack; ignore or remove the others.
3. Create product docs locally (not part of this kit):
   - Stage 0 → `docs/PRODUCT-VISION.md`
   - Stage 1 → `docs/ARCHITECTURE.md` from `docs/templates/ARCHITECTURE-template.md`
   - Stage 2 → `docs/ROADMAP.md` (or `docs/planning/`)

Full inventory: [`docs/AIDD-KIT.md`](./docs/AIDD-KIT.md).  
Process: [`docs/WORKFLOW.md`](./docs/WORKFLOW.md).

## Updating a consumer (kit → project)

Pull newer kit files without wiping product-local paths:

```bash
KIT=~/path/to/aidd-kit          # or: git clone … /tmp/aidd-kit
DST=/path/to/your-project/.cursor

rsync -a \
  --exclude '.git' \
  --exclude 'LICENSE' \
  --exclude 'README.md' \
  --exclude 'workspace/' \
  --exclude 'plans/' \
  --exclude 'docs/ARCHITECTURE.md' \
  --exclude 'docs/PRODUCT-VISION.md' \
  --exclude 'docs/ROADMAP.md' \
  --exclude 'docs/planning/' \
  "$KIT/" "$DST/"
```

Commit the vendored `.cursor` changes in the **consumer** repo. For production, rsync from `main` or a release tag.

## Promoting fixes (consumer → kit)

Do **not** leave kit fixes only in the consumer. Prefer editing this repo, then rsync into the sandbox. If you already fixed files under the consumer’s `.cursor/`, copy back only kit-owned paths:

```bash
SRC=/path/to/your-project/.cursor
KIT=~/path/to/aidd-kit

rsync -a "$SRC/agents/"              "$KIT/agents/"
rsync -a "$SRC/skills/"              "$KIT/skills/"
rsync -a "$SRC/tools/"               "$KIT/tools/"
rsync -a "$SRC/docs/templates/"      "$KIT/docs/templates/"
rsync -a "$SRC/docs/WORKFLOW.md"     "$KIT/docs/WORKFLOW.md"
rsync -a "$SRC/docs/AIDD-KIT.md"     "$KIT/docs/AIDD-KIT.md"
rsync -a "$SRC/rules/anti-over-engineering.md" "$KIT/rules/"
rsync -a "$SRC/rules/spec-patterns-by-layer.md" "$KIT/rules/"
rsync -a "$SRC/rules/phpstorm-mcp.md" "$KIT/rules/"
rsync -a "$SRC/rules/"tech-stack-*.md "$KIT/rules/"
```

Commit and push here, then rsync kit → other consumers again.

## What’s included

| Path | Role |
|------|------|
| `agents/` | specify, spec-reviewer, test-plan, test-plan-reviewer, revizor |
| `skills/conductor/` | `/conductor` — Stages 3–8 orchestrator |
| `docs/WORKFLOW.md` | Stage model |
| `docs/templates/` | SPEC, TEST-PLAN, reviews, ARCHITECTURE, husky hooks |
| `tools/spec-validate/` | SPEC linter |
| `rules/` | anti-OE + optional stack / PhpStorm / layer patterns |
| `workspace/{active,archived}/` | Empty placeholders |

## License

MIT — see [LICENSE](./LICENSE).
