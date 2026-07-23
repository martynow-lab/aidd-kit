#!/usr/bin/env node
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = process.env.SPEC_VALIDATE_REPO_ROOT
  ? resolve(process.env.SPEC_VALIDATE_REPO_ROOT)
  : join(__dirname, '../../..');

const REQUIRED_SECTIONS = [
  { num: 1, title: 'Goal' },
  { num: 2, title: 'Requirements' },
  { num: 3, title: 'Acceptance Criteria' },
  { num: 4, title: 'Edge Cases' },
  { num: 5, title: 'Out of Scope' },
  { num: 6, title: 'Local Constraints' },
  { num: 7, title: 'Open Questions' },
];

const REQUIRED_SECTION_NUMS = [1, 2, 3, 4, 5, 6, 7];

// --- parse-spec ---

/**
 * @param {string} markdown
 * @returns {import('./index.js').ParsedSpec}
 */
export function parseSpec(markdown) {
  const sections = splitSections(markdown);
  const metadata = parseMetadata(markdown);

  const requirementsSection = sections.get(2) ?? '';
  const acSection = sections.get(3) ?? '';
  const ecSection = sections.get(4) ?? '';
  const constraintsSection = sections.get(6) ?? '';
  const questionsSection = sections.get(7) ?? '';

  const functionalRequirements = parseFunctionalRequirements(requirementsSection);
  const acceptanceCriteria = parseAcceptanceCriteria(acSection);
  const edgeCases = parseEdgeCases(ecSection);
  const openQuestions = parseOpenQuestions(questionsSection);
  const errorCodes = parseErrorCodesTable(requirementsSection);
  const localConstraints = parseBulletList(constraintsSection);

  const sectionTitles = new Map();
  for (const [num, body] of sections) {
    const match = body.match(/^## \d+\.\s+(.+)$/m);
    if (match) {
      sectionTitles.set(num, match[1].trim());
    }
  }

  for (const { num, title } of REQUIRED_SECTIONS) {
    if (!sections.has(num)) {
      sectionTitles.set(num, title);
    }
  }

  return {
    metadata,
    sections: {
      present: [...sections.keys()],
      titles: sectionTitles,
    },
    functionalRequirements,
    acceptanceCriteria,
    edgeCases,
    openQuestions,
    errorCodes,
    localConstraints,
    hasEslintDeliverable: detectEslintDeliverable(localConstraints),
    hasErrorCodesProfile: errorCodes.length > 0,
    frIdsWithMessageRequirement: functionalRequirements
      .filter((fr) => /\bmessage\b/i.test(fr.text) && /error/i.test(fr.text))
      .map((fr) => fr.id),
  };
}

function splitSections(markdown) {
  /** @type {Map<number, string>} */
  const sections = new Map();
  const parts = markdown.split(/^## /m);

  for (const part of parts) {
    if (!part.trim()) continue;
    const headingMatch = part.match(/^(\d+)\.\s+([^\n]+)\n([\s\S]*)$/);
    if (!headingMatch) continue;
    const num = Number(headingMatch[1]);
    sections.set(num, `## ${part}`);
  }

  return sections;
}

function parseMetadata(markdown) {
  const featureMatch = markdown.match(/\*\*Feature\*\*\s*\|\s*`([^`]+)`/);
  const statusMatch = markdown.match(/\*\*Status\*\*\s*\|\s*`([^`]+)`/);
  return {
    feature: featureMatch?.[1] ?? null,
    status: statusMatch?.[1] ?? null,
  };
}

function parseFunctionalRequirements(section) {
  const items = [];
  const pattern = /^- \*\*FR-(\d+)\*\* — (.+)$/gm;
  let match;
  while ((match = pattern.exec(section)) !== null) {
    items.push({
      id: `FR-${match[1]}`,
      num: Number(match[1]),
      text: match[2].trim(),
    });
  }
  return items;
}

function parseAcceptanceCriteria(section) {
  const items = [];
  const pattern = /^- \[ \] \*\*AC-(\d+)\*\* \(([^)]+)\) — (.+)$/gm;
  let match;
  while ((match = pattern.exec(section)) !== null) {
    const frRefs = [...match[2].matchAll(/FR-(\d+)/g)].map((m) => `FR-${m[1]}`);
    items.push({
      id: `AC-${match[1]}`,
      num: Number(match[1]),
      frRefs,
      text: match[3].trim(),
      fullLine: match[0],
    });
  }
  return items;
}

function parseEdgeCases(section) {
  const items = [];
  const lines = section.split('\n');
  for (const line of lines) {
    const match = line.match(/^\| EC-(\d+[a-z]?) \|/i);
    if (!match) continue;
    const id = `EC-${match[1]}`;
    const cells = line
      .split('|')
      .map((c) => c.trim())
      .filter(Boolean);
    items.push({
      id,
      scenario: cells[1] ?? '',
      expected: cells[2] ?? '',
      text: line,
    });
  }
  return items;
}

function parseOpenQuestions(section) {
  const items = [];
  const lines = section.split('\n');
  for (const line of lines) {
    if (!line.startsWith('| Q-')) continue;
    const cells = line
      .split('|')
      .map((c) => c.trim())
      .filter((c) => c && !c.match(/^[-#]+$/));
    if (cells.length < 4) continue;
    const id = cells[0].replace(/\|.*/, '').trim();
    if (!id.startsWith('Q-')) continue;
    const statusCell = cells[3] ?? '';
    const status = parseQuestionStatus(statusCell);
    items.push({
      id,
      question: cells[1] ?? '',
      owner: cells[2] ?? '',
      status,
      rawStatus: statusCell,
    });
  }
  return items;
}

function parseQuestionStatus(statusCell) {
  const lower = statusCell.toLowerCase();
  if (/\bopen\b/.test(lower) && !/\bresolved\b/.test(lower) && !/\bdeferred\b/.test(lower)) {
    return 'open';
  }
  if (/\bdeferred\b/.test(lower)) return 'deferred';
  if (/\bresolved\b/.test(lower)) return 'resolved';
  return 'unknown';
}

function parseErrorCodesTable(section) {
  if (!/\*\*Error codes\*\*/i.test(section)) return [];

  const afterHeading = section.split(/\*\*Error codes\*\*/i)[1] ?? '';
  const tableLines = afterHeading.split('\n').filter((l) => l.startsWith('|'));

  if (tableLines.length < 2) return [];

  const header = tableLines[0];
  if (!/Code/i.test(header) || !/message/i.test(header)) return [];

  const codes = [];
  for (let i = 2; i < tableLines.length; i++) {
    const line = tableLines[i];
    if (!line.includes('`')) continue;
    const cells = line
      .split('|')
      .map((c) => c.trim())
      .filter(Boolean);
    if (cells.length < 3) continue;
    const code = cells[0].replace(/`/g, '').trim();
    const field = cells[1].replace(/`/g, '').trim();
    const messageRaw = cells[2].replace(/`/g, '').trim();
    codes.push({ code, field, message: messageRaw });
  }

  return codes;
}

function parseBulletList(section) {
  return section
    .split('\n')
    .filter((line) => line.startsWith('- '))
    .map((line) => line.replace(/^- /, '').trim());
}

function detectEslintDeliverable(constraints) {
  const combined = constraints.join('\n');
  return (
    /eslint\.config\.js/i.test(combined) &&
    /(extend|forbid|GREEN|no-restricted-imports)/i.test(combined)
  );
}

/**
 * @param {string} text
 * @param {import('./index.js').ErrorCode[]} errorCodes
 */
export function extractCitedErrorCodes(text, errorCodes) {
  const cited = new Set();
  const knownCodes = errorCodes.map((e) => e.code);

  for (const code of knownCodes) {
    if (
      text.includes(code) ||
      text.includes(`code: '${code}'`) ||
      text.includes(`code: "${code}"`) ||
      new RegExp(`error code\\s+${code}`, 'i').test(text)
    ) {
      cited.add(code);
    }
  }

  return [...cited];
}

/**
 * @param {string} text
 * @param {string} canonicalMessage
 */
export function acContainsCanonicalMessage(text, canonicalMessage) {
  const normalized = canonicalMessage.replace(/^['"]|['"]$/g, '');
  return (
    text.includes(`message: '${normalized}'`) ||
    text.includes(`message: "${normalized}"`) ||
    text.includes(`message: '${canonicalMessage}'`) ||
    text.includes(`message: "${canonicalMessage}"`)
  );
}

/**
 * @param {import('./index.js').ParsedSpec} spec
 */
export function buildFrToAcMap(spec) {
  /** @type {Map<string, string[]>} */
  const map = new Map();
  for (const fr of spec.functionalRequirements) {
    map.set(fr.id, []);
  }
  for (const ac of spec.acceptanceCriteria) {
    for (const frRef of ac.frRefs) {
      if (!map.has(frRef)) map.set(frRef, []);
      map.get(frRef).push(ac.id);
    }
  }
  return map;
}

// --- rules ---

/** @type {import('./index.js').LintRule} */
function specSections(spec) {
  const findings = [];
  for (const num of REQUIRED_SECTION_NUMS) {
    if (!spec.sections.present.includes(num)) {
      const title = spec.sections.titles.get(num) ?? `Section ${num}`;
      findings.push({
        ruleId: 'spec-sections',
        severity: 'error',
        specRef: `§${num}`,
        message: `Missing required section ## ${num}. ${title}`,
      });
    }
  }
  return findings;
}

/** @type {import('./index.js').LintRule} */
function frCoverage(spec) {
  const frToAc = buildFrToAcMap(spec);
  const findings = [];

  for (const fr of spec.functionalRequirements) {
    const acs = frToAc.get(fr.id) ?? [];
    if (acs.length === 0) {
      findings.push({
        ruleId: 'fr-coverage',
        severity: 'error',
        specRef: fr.id,
        message: `${fr.id} has no AC — add an AC referencing ${fr.id}`,
      });
    }
  }

  return findings;
}

/** @type {import('./index.js').LintRule} */
function acFrRefs(spec) {
  const frIds = new Set(spec.functionalRequirements.map((fr) => fr.id));
  const findings = [];

  for (const ac of spec.acceptanceCriteria) {
    if (ac.frRefs.length === 0) {
      findings.push({
        ruleId: 'ac-fr-refs',
        severity: 'error',
        specRef: ac.id,
        message: `${ac.id} has no (FR-n) references — add at least one FR reference`,
      });
      continue;
    }

    for (const ref of ac.frRefs) {
      if (!frIds.has(ref)) {
        findings.push({
          ruleId: 'ac-fr-refs',
          severity: 'error',
          specRef: ac.id,
          message: `${ac.id} references unknown ${ref} — fix or add the FR`,
        });
      }
    }
  }

  return findings;
}

/** @type {import('./index.js').LintRule} */
function acTestable(spec) {
  const findings = [];

  for (const ac of spec.acceptanceCriteria) {
    const text = ac.fullLine ?? ac.text;
    const hasGiven = /\bgiven\b/i.test(text);
    const hasWhen = /\bwhen\b/i.test(text);
    const hasThen = /\bthen\b/i.test(text);

    if (!hasGiven || !hasWhen || !hasThen) {
      const missing = [];
      if (!hasGiven) missing.push('Given');
      if (!hasWhen) missing.push('when');
      if (!hasThen) missing.push('then');
      findings.push({
        ruleId: 'ac-testable',
        severity: 'error',
        specRef: ac.id,
        message: `${ac.id} is not testable — missing ${missing.join(', ')} (use Given/when/then)`,
      });
    }
  }

  return findings;
}

/** @type {import('./index.js').LintRule} */
function openQuestions(spec, options) {
  if (!options.freeze) return [];

  const findings = [];
  for (const q of spec.openQuestions) {
    if (q.status === 'open') {
      findings.push({
        ruleId: 'open-questions',
        severity: 'error',
        specRef: q.id,
        message: `${q.id} is still open — resolve or defer before freeze`,
      });
    }
  }
  return findings;
}

/** @type {import('./index.js').LintRule} */
function duplicateFrIds(spec) {
  const seen = new Map();
  const findings = [];

  for (const fr of spec.functionalRequirements) {
    if (seen.has(fr.id)) {
      findings.push({
        ruleId: 'duplicate-fr-ids',
        severity: 'warning',
        specRef: fr.id,
        message: `Duplicate ${fr.id} in Requirements — renumber or remove duplicate`,
      });
    }
    seen.set(fr.id, true);
  }

  return findings;
}

/** @type {import('./index.js').LintRule} */
function ecFrBoundary(spec) {
  const failurePattern = /\b(reject|rejects|rejected|fail|fails|failed|throw|throws|invalid)\b/i;
  const frToAc = buildFrToAcMap(spec);
  const findings = [];

  for (const fr of spec.functionalRequirements) {
    if (!failurePattern.test(fr.text)) continue;

    const hasEc = spec.edgeCases.some(
      (ec) =>
        ec.text.includes(fr.id) ||
        ec.expected.includes(fr.id) ||
        spec.acceptanceCriteria.some(
          (ac) =>
            ac.frRefs.includes(fr.id) && (ec.text.includes(ac.id) || ec.expected.includes(ac.id)),
        ),
    );

    const hasDeferredQ = spec.openQuestions.some(
      (q) => q.status === 'deferred' && q.rawStatus.includes(fr.id),
    );

    const acs = frToAc.get(fr.id) ?? [];
    const hasNegativeAc = acs.some((acId) => {
      const ac = spec.acceptanceCriteria.find((a) => a.id === acId);
      return ac && failurePattern.test(ac.text);
    });

    if (!hasEc && !hasDeferredQ && hasNegativeAc) {
      findings.push({
        ruleId: 'ec-fr-boundary',
        severity: 'warning',
        specRef: fr.id,
        message: `${fr.id} describes failure behavior but has no EC row covering the boundary`,
      });
    }
  }

  return findings;
}

/** @type {import('./index.js').LintRule} */
function acEcTrace(spec) {
  const findings = [];

  for (const ec of spec.edgeCases) {
    const mentionsAc = /AC-\d+/i.test(ec.text);
    if (!mentionsAc) {
      findings.push({
        ruleId: 'ac-ec-trace',
        severity: 'warning',
        specRef: ec.id,
        message: `${ec.id} does not reference an AC-n — add traceability (e.g. AC-16)`,
      });
    }
  }

  return findings;
}

/** @type {import('./index.js').LintRule} */
function errorMessageComplete(spec) {
  if (!spec.hasErrorCodesProfile) return [];

  const findings = [];
  const codeMap = new Map(spec.errorCodes.map((e) => [e.code, e]));

  for (const ac of spec.acceptanceCriteria) {
    const text = ac.fullLine ?? ac.text;
    const cited = extractCitedErrorCodes(text, spec.errorCodes);

    for (const code of cited) {
      const entry = codeMap.get(code);
      if (!entry) continue;

      if (!acContainsCanonicalMessage(text, entry.message)) {
        findings.push({
          ruleId: 'error-message-complete',
          severity: 'error',
          specRef: ac.id,
          message: `${ac.id} cites ${code} but omits canonical message '${entry.message}' (Error codes table)`,
        });
      }
    }
  }

  return findings;
}

/** @type {import('./index.js').LintRule} */
function errorMessageAllFr7(spec) {
  if (!spec.hasErrorCodesProfile || spec.frIdsWithMessageRequirement.length === 0) {
    return [];
  }

  const findings = [];
  const failurePattern = /valid:\s*false|valid:\s*false/i;

  for (const frId of spec.frIdsWithMessageRequirement) {
    const relatedAcs = spec.acceptanceCriteria.filter(
      (ac) => ac.frRefs.includes(frId) && failurePattern.test(ac.text),
    );

    for (const ac of relatedAcs) {
      const text = ac.fullLine ?? ac.text;
      const cited = extractCitedErrorCodes(text, spec.errorCodes);
      if (cited.length === 0) continue;

      for (const code of cited) {
        const entry = spec.errorCodes.find((e) => e.code === code);
        if (!entry) continue;

        if (!acContainsCanonicalMessage(text, entry.message)) {
          findings.push({
            ruleId: 'error-message-all-fr7',
            severity: 'error',
            specRef: ac.id,
            message: `${ac.id} (${frId}) failure path cites ${code} without full message '${entry.message}'`,
          });
        }
      }
    }
  }

  return findings;
}

/** @type {import('./index.js').LintRule} */
function multiErrorOrder(spec) {
  const findings = [];

  for (const ac of spec.acceptanceCriteria) {
    const text = ac.fullLine ?? ac.text;
    const isMultiError =
      (/\btwo\b errors/i.test(text) || /\*\*two\*\* errors/i.test(text) || /два/i.test(text)) &&
      /valid:\s*false/i.test(text);

    if (!isMultiError) continue;

    const hasIndexedOrder = /errors\[0\]/i.test(text) && /errors\[1\]/i.test(text);
    const hasStableOrder =
      /stable order/i.test(text) &&
      (/errors\[0\]/i.test(text) || /title.*steps|steps.*title/i.test(text));

    if (!hasIndexedOrder && !hasStableOrder) {
      findings.push({
        ruleId: 'multi-error-order',
        severity: 'error',
        specRef: ac.id,
        message: `${ac.id} describes multiple errors but does not pin order (use errors[0]/errors[1] or stable order with field names)`,
      });
    }
  }

  return findings;
}

/** @type {import('./index.js').LintRule} */
function eslintDeliverableAc(spec) {
  if (!spec.hasEslintDeliverable) return [];

  const hasConfigAc = spec.acceptanceCriteria.some((ac) =>
    /eslint\.config\.js/i.test(ac.fullLine ?? ac.text),
  );

  if (!hasConfigAc) {
    return [
      {
        ruleId: 'eslint-deliverable-ac',
        severity: 'error',
        specRef: '§6 Local Constraints',
        message:
          '§6 requires eslint.config.js changes (GREEN/extend/forbid) but no AC inspects eslint.config.js — add an AC like file-persistence AC-1',
      },
    ];
  }

  return [];
}

// --- pure-module rules (Stage 3 layer patterns) ---

const PURE_LAYER_PATH = /src\/(domain|state|persist)\//i;

/**
 * Trigger text for pure-module detection: FR bodies + Local Constraints only.
 * (Not AC text — ACs are what we check for, not what declares the requirement.)
 * @param {import('./index.js').ParsedSpec} spec
 */
function pureModuleTriggerText(spec) {
  return [...spec.functionalRequirements.map((fr) => fr.text), ...spec.localConstraints].join('\n');
}

/** @param {import('./index.js').ParsedSpec} spec */
function declaresPureModuleBoundary(spec) {
  const text = pureModuleTriggerText(spec);
  if (!PURE_LAYER_PATH.test(text)) return false;
  return /no DOM|file I\/O|must not import|does not import|not import from|no-restricted-imports|pure (domain|module|logic|state)|File System Access|no `?fetch`?/i.test(
    text,
  );
}

/** @param {import('./index.js').ParsedSpec} spec */
function hasBoundaryScanAc(spec) {
  return spec.acceptanceCriteria.some((ac) => {
    const t = ac.fullLine ?? ac.text;
    const scope =
      PURE_LAYER_PATH.test(t) ||
      /statically|static (boundary|scan|review|check)|module sources|source text|module namespace/i.test(
        t,
      );
    const boundary =
      /no-restricted-imports|export default|no imports from|does not import|not import from|\bfetch\b|\bdocument\b|\bwindow\b|File System Access|showOpenFilePicker|showSaveFilePicker|createWritable|getFile|FileSystem(File)?Handle/i.test(
        t,
      );
    return scope && boundary;
  });
}

/** @param {import('./index.js').ParsedSpec} spec */
function declaresSoleExport(spec) {
  const text = pureModuleTriggerText(spec);
  if (!PURE_LAYER_PATH.test(text)) return false;
  return /(sole|single|exactly one|its only) (public )?(named )?export/i.test(text);
}

/** @param {import('./index.js').ParsedSpec} spec */
function hasExportSurfaceAc(spec) {
  return spec.acceptanceCriteria.some((ac) => {
    const t = ac.fullLine ?? ac.text;
    return /Object\.keys/i.test(t) || /(sole|single|exactly one|its only) (public )?named export/i.test(t);
  });
}

/** @type {import('./index.js').LintRule} */
function pureModuleBoundaryAc(spec) {
  if (!declaresPureModuleBoundary(spec)) return [];
  if (hasBoundaryScanAc(spec)) return [];
  return [
    {
      ruleId: 'pure-module-boundary-ac',
      severity: 'error',
      specRef: '§3 Acceptance Criteria',
      message:
        'Pure-module SPEC (src/domain|state|persist) declares import/purity boundaries but no AC performs a static boundary scan — add one (catalog-state AC-18 pattern: statically assert no forbidden sibling imports, no export default, no DOM/fetch/File System Access identifiers). See .cursor/rules/spec-patterns-by-layer.md',
    },
  ];
}

/** @type {import('./index.js').LintRule} */
function pureModuleExportAc(spec) {
  if (!declaresSoleExport(spec)) return [];
  if (hasExportSurfaceAc(spec)) return [];
  return [
    {
      ruleId: 'pure-module-export-ac',
      severity: 'warning',
      specRef: '§3 Acceptance Criteria',
      message:
        'SPEC declares a sole/single public export but no AC pins the export surface — add an AC asserting Object.keys(module).sort() equals the exact declared export(s) (domain-validate-recipe AC-20 pattern). See .cursor/rules/spec-patterns-by-layer.md',
    },
  ];
}

/** @type {import('./index.js').LintRule[]} */
const ALL_RULES = [
  specSections,
  frCoverage,
  acFrRefs,
  acTestable,
  openQuestions,
  errorMessageComplete,
  errorMessageAllFr7,
  multiErrorOrder,
  eslintDeliverableAc,
  pureModuleBoundaryAc,
  duplicateFrIds,
  ecFrBoundary,
  acEcTrace,
  pureModuleExportAc,
];

// --- linter API ---

/**
 * @param {import('./index.js').ParsedSpec} spec
 * @param {import('./index.js').LintOptions} [options]
 * @returns {import('./index.js').LintResult}
 */
export function runSpecLinter(spec, options = {}) {
  const strict = options.strict ?? false;
  /** @type {import('./index.js').LintFinding[]} */
  const findings = [];

  for (const rule of ALL_RULES) {
    findings.push(...rule(spec, options));
  }

  const effective = strict
    ? findings.map((f) => (f.severity === 'warning' ? { ...f, severity: 'error' } : f))
    : findings;

  const errorCount = effective.filter((f) => f.severity === 'error').length;
  const warningCount = effective.filter((f) => f.severity === 'warning').length;

  return {
    ok: errorCount === 0 && (!strict || warningCount === 0),
    findings: effective,
    errorCount,
    warningCount,
  };
}

/**
 * @param {string} specPath
 * @param {import('./index.js').LintOptions} [options]
 */
export function lintSpecFile(specPath, options = {}) {
  const markdown = readFileSync(specPath, 'utf8');
  const spec = parseSpec(markdown);
  return runSpecLinter(spec, options);
}

/**
 * @param {import('./index.js').LintResult} result
 * @param {string} label
 */
export function formatLintReport(result, label) {
  const status = result.ok ? 'PASSED' : result.errorCount > 0 ? 'FAILED' : 'PASSED WITH WARNINGS';
  const lines = [
    `spec:validate ${label} — ${status} (${result.errorCount} errors, ${result.warningCount} warnings)`,
    '',
  ];

  let errorIdx = 0;
  let warnIdx = 0;

  for (const f of result.findings) {
    const prefix =
      f.severity === 'error'
        ? `[E${String(++errorIdx).padStart(3, '0')}]`
        : `[W${String(++warnIdx).padStart(3, '0')}]`;
    lines.push(`${prefix} ${f.ruleId.padEnd(24)} ${f.specRef} — ${f.message}`);
  }

  return lines.join('\n');
}

// --- CLI ---

/**
 * @param {string[]} argv
 */
function parseArgs(argv) {
  const flags = new Set();
  const positional = [];

  for (const arg of argv) {
    if (arg.startsWith('--')) {
      flags.add(arg);
    } else {
      positional.push(arg);
    }
  }

  return {
    json: flags.has('--json'),
    freeze: flags.has('--freeze'),
    strict: flags.has('--strict'),
    positional,
  };
}

/**
 * @param {string} input
 */
function resolveSpecPath(input) {
  if (input.endsWith('SPEC.md') || input.includes('/')) {
    return resolve(REPO_ROOT, input);
  }
  return join(REPO_ROOT, '.cursor/workspace/active', input, 'SPEC.md');
}

/**
 * @returns {{ label: string, specPath: string }[]}
 */
function listActiveSpecs() {
  const activeDir = join(REPO_ROOT, '.cursor/workspace/active');
  if (!existsSync(activeDir)) return [];

  return readdirSync(activeDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => ({
      label: entry.name,
      specPath: join(activeDir, entry.name, 'SPEC.md'),
    }))
    .filter(({ specPath }) => existsSync(specPath))
    .sort((a, b) => a.label.localeCompare(b.label));
}

/**
 * @param {import('./index.js').LintResult[]} results
 * @param {boolean} strict
 */
function exitFromResults(results, strict) {
  const errorCount = results.reduce((sum, result) => sum + result.errorCount, 0);
  const warningCount = results.reduce((sum, result) => sum + result.warningCount, 0);

  if (errorCount > 0) {
    process.exit(1);
  }
  if (warningCount > 0 && !strict) {
    process.exit(2);
  }
  process.exit(0);
}

function main() {
  const { json, freeze, strict, positional } = parseArgs(process.argv.slice(2));
  const options = { freeze, strict };

  /** @type {{ label: string, specPath: string }[]} */
  let targets;

  if (positional.length === 0) {
    targets = listActiveSpecs();
    if (targets.length === 0) {
      console.error(
        'Usage: npm run spec:validate -- [<feature-slug|path/to/SPEC.md> ...] [--json] [--freeze] [--strict]',
      );
      console.error('No active SPEC.md files found under .cursor/workspace/active/.');
      process.exit(1);
    }
  } else {
    targets = positional.map((label) => ({
      label,
      specPath: resolveSpecPath(label),
    }));
  }

  /** @type {{ label: string, specPath: string, result: import('./index.js').LintResult }[]} */
  const reports = [];

  for (const target of targets) {
    if (!existsSync(target.specPath)) {
      console.error(`SPEC not found: ${target.specPath}`);
      process.exit(1);
    }

    reports.push({
      ...target,
      result: lintSpecFile(target.specPath, options),
    });
  }

  if (json) {
    if (reports.length === 1) {
      const { label, specPath, result } = reports[0];
      console.log(JSON.stringify({ specPath, label, ...result }, null, 2));
    } else {
      const errorCount = reports.reduce((sum, entry) => sum + entry.result.errorCount, 0);
      const warningCount = reports.reduce((sum, entry) => sum + entry.result.warningCount, 0);
      console.log(
        JSON.stringify(
          {
            ok: errorCount === 0 && (!strict || warningCount === 0),
            errorCount,
            warningCount,
            specs: reports.map(({ label, specPath, result }) => ({ label, specPath, ...result })),
          },
          null,
          2,
        ),
      );
    }
  } else {
    const lines = reports.map(({ label, result }) => formatLintReport(result, label));
    console.log(lines.join('\n\n'));
  }

  exitFromResults(
    reports.map((entry) => entry.result),
    strict,
  );
}

const isMain =
  process.argv[1] && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url));

if (isMain) {
  main();
}

/**
 * @typedef {Object} FunctionalRequirement
 * @property {string} id
 * @property {number} num
 * @property {string} text
 */

/**
 * @typedef {Object} AcceptanceCriterion
 * @property {string} id
 * @property {number} num
 * @property {string[]} frRefs
 * @property {string} text
 * @property {string} fullLine
 */

/**
 * @typedef {Object} EdgeCase
 * @property {string} id
 * @property {string} scenario
 * @property {string} expected
 * @property {string} text
 */

/**
 * @typedef {Object} OpenQuestion
 * @property {string} id
 * @property {string} question
 * @property {string} owner
 * @property {'open' | 'deferred' | 'resolved' | 'unknown'} status
 * @property {string} rawStatus
 */

/**
 * @typedef {Object} ErrorCode
 * @property {string} code
 * @property {string} field
 * @property {string} message
 */

/**
 * @typedef {Object} SpecMetadata
 * @property {string | null} feature
 * @property {string | null} status
 */

/**
 * @typedef {Object} ParsedSpec
 * @property {SpecMetadata} metadata
 * @property {{ present: number[], titles: Map<number, string> }} sections
 * @property {FunctionalRequirement[]} functionalRequirements
 * @property {AcceptanceCriterion[]} acceptanceCriteria
 * @property {EdgeCase[]} edgeCases
 * @property {OpenQuestion[]} openQuestions
 * @property {ErrorCode[]} errorCodes
 * @property {string[]} localConstraints
 * @property {boolean} hasEslintDeliverable
 * @property {boolean} hasErrorCodesProfile
 * @property {string[]} frIdsWithMessageRequirement
 */

/**
 * @typedef {Object} LintFinding
 * @property {string} ruleId
 * @property {'error' | 'warning'} severity
 * @property {string} specRef
 * @property {string} message
 */

/**
 * @typedef {Object} LintOptions
 * @property {boolean} [freeze]
 * @property {boolean} [strict]
 */

/**
 * @typedef {Object} LintResult
 * @property {boolean} ok
 * @property {LintFinding[]} findings
 * @property {number} errorCount
 * @property {number} warningCount
 */

/**
 * @typedef {(spec: ParsedSpec, options: LintOptions) => LintFinding[]} LintRule
 */
