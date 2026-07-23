# AiDD kit — portable setup

Cheatsheet for using this repository as the AiDD Workflow tooling inside another project.
**Product docs stay per-project** — only this kit travels.

This repo **is** the kit. Its tree is what belongs under a project’s `.cursor/`.

**Do not** install as a git submodule at `.cursor/` (or `.cursor/kit`). Consumers need local `workspace/`, `docs/ARCHITECTURE.md`, and related product files in the same tree; those must stay in the consumer repo. Use clone / `rsync` instead (see below).

## Quick install

```bash
KIT=https://github.com/martynow-lab/aidd-kit.git
DST=/path/to/new-project

git clone "$KIT" /tmp/aidd-kit
rsync -a \
  --exclude '.git' \
  --exclude 'LICENSE' \
  --exclude 'README.md' \
  /tmp/aidd-kit/ "$DST/.cursor/"
```

Or, for a greenfield repo with an empty `.cursor/`:

```bash
git clone https://github.com/martynow-lab/aidd-kit.git .cursor
```

Then in `$DST`:

1. Add npm script (if missing):

   ```json
   "spec:validate": "node .cursor/tools/spec-validate/index.js"
   ```

2. Keep **one** stack rule that matches the project; delete or ignore the others under `.cursor/rules/tech-stack-*.md`.
3. Create product artifacts locally (do **not** copy from another app):
   - Stage 0 → `docs/PRODUCT-VISION.md`
   - Stage 1 → `docs/ARCHITECTURE.md` from `templates/ARCHITECTURE-template.md`
   - Stage 2 → `docs/ROADMAP.md` (or `docs/planning/`)
4. Optionally install husky gates from `docs/templates/husky/` (see WORKFLOW Stage 1).

## Inventory

| Path | Role |
|------|------|
| `agents/*.md` | Stage specialists: specify, spec-reviewer, test-plan, test-plan-reviewer, revizor |
| `skills/conductor/` | `/conductor` orchestrator (Stages 3–8) |
| `docs/WORKFLOW.md` | Process contract |
| `docs/AIDD-KIT.md` | This memo |
| `docs/templates/` | SPEC, TEST-PLAN, reviews, ARCHITECTURE, MANUAL-CHECKLIST, husky hooks |
| `tools/spec-validate/` | SPEC linter (`npm run spec:validate`) |
| `rules/anti-over-engineering.md` | RED/GREEN / YAGNI |
| `rules/tech-stack-*.md` | Pick **one** for the target stack |
| `rules/phpstorm-mcp.md` | Optional — PhpStorm MCP for RED/GREEN |
| `rules/spec-patterns-by-layer.md` | Optional — pure-module SPEC patterns (`domain` / `state` / `persist`) |
| `workspace/active/` | Empty working area (create feature folders as you go) |
| `workspace/archived/` | Empty archive for finished features |

## Templates → runtime artifacts

| Template | Becomes | Stage |
|----------|---------|-------|
| `ARCHITECTURE-template.md` | `docs/ARCHITECTURE.md` | 1 |
| `SPEC-template.md` | `workspace/active/<feature>/SPEC.md` | 3 |
| `SPEC-REVIEW-template.md` | `…/SPEC-REVIEW.md` | 3.5 |
| `TEST-PLAN-template.md` | `…/TEST-PLAN.md` | 4 |
| `TEST-PLAN-REVIEW-template.md` | `…/TEST-PLAN-REVIEW.md` | 4.5 |
| `MANUAL-CHECKLIST-template.md` | `…/MANUAL-CHECKLIST.md` | 5 (when needed) |
| `REVIZOR-REVIEW-template.md` | `…/REVIZOR-REVIEW.md` | 7 |
| `husky/pre-commit`, `husky/pre-push` | `.husky/*` | 1 tooling |

Agents own the draft; conductor (optional) freezes SPEC / TEST-PLAN and drives Stages 3–8.

## Do **not** put in this kit / do not copy between apps

| Artifact | Why |
|----------|-----|
| `docs/PRODUCT-VISION.md` | Product-specific |
| `docs/ARCHITECTURE.md` | Product / stack decisions for one app |
| `docs/ROADMAP.md`, `docs/planning/` | Feature plan for one app |
| `workspace/archived/**` | Finished features of one app |
| `workspace/active/**` (non-empty) | In-flight work for one app |
| Application `src/`, tests, app CI | Application code, not AiDD |

## Updating a consumer project (kit → project)

Pull newer kit files without wiping product docs:

```bash
KIT=~/path/to/aidd-kit          # or fresh clone / checkout of a tag
DST=/path/to/project/.cursor

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

Commit vendored `.cursor` changes in the **consumer** repo. Pin production to a release tag when you want a fixed kit version.

## Promoting fixes (consumer → kit)

Prefer editing this repository, then rsync into the sandbox. If you already changed kit files under a consumer’s `.cursor/`, copy back only shared paths:

```bash
SRC=/path/to/project/.cursor
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

Commit and push here, then rsync kit → other consumers.

## Smoke check after install

```bash
test -f .cursor/docs/WORKFLOW.md
test -f .cursor/agents/specify.md
test -f .cursor/skills/conductor/SKILL.md
test -f .cursor/tools/spec-validate/index.js
npm run spec:validate   # OK if no active SPEC yet, or validates drafts
```

## Related

- [WORKFLOW.md](./WORKFLOW.md) — full stage model
- [../skills/conductor/SKILL.md](../skills/conductor/SKILL.md) — conductor mode
- [../tools/spec-validate/README.md](../tools/spec-validate/README.md) — linter flags
