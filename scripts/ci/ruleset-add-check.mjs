// Builds the ruleset PUT payload from the LIVE ruleset, adding one required
// status check. Refuses to proceed if the live shape is not what we expect.
// Usage: node scripts/ci/ruleset-add-check.mjs <live.json> <out.json> "<check name>"
import { readFileSync, writeFileSync } from 'node:fs';

const [, , livePath, outPath, checkName] = process.argv;
if (!livePath || !outPath || !checkName) {
  console.error(
    'usage: node ruleset-add-check.mjs <live.json> <out.json> "<check>"'
  );
  process.exit(2);
}

// PowerShell's `Set-Content -Encoding utf8` prepends a BOM; strip it (and any
// stray NULs from UTF-16 redirects) before parsing.
const raw = readFileSync(livePath, 'utf8')
  .replace(/^\uFEFF/, '')
  .replace(/\0/g, '');
const live = JSON.parse(raw);

// Preserve every rule verbatim; only touch required_status_checks.
const rules = live.rules.map((r) => {
  if (r.type !== 'required_status_checks') return r;
  const existing = r.parameters?.required_status_checks ?? [];
  if (existing.some((c) => c.context === checkName)) {
    console.error(`check "${checkName}" already present — nothing to do`);
    process.exit(3);
  }
  return {
    ...r,
    parameters: {
      ...r.parameters,
      required_status_checks: [
        ...existing,
        { context: checkName, integration_id: 15368 },
      ],
    },
  };
});

if (!rules.some((r) => r.type === 'required_status_checks')) {
  console.error('live ruleset has no required_status_checks rule — aborting');
  process.exit(4);
}

const payload = {
  name: live.name,
  target: live.target,
  enforcement: live.enforcement,
  conditions: live.conditions,
  rules,
  bypass_actors: live.bypass_actors ?? [],
};

writeFileSync(outPath, JSON.stringify(payload, null, 2));

const rsc = rules.find((r) => r.type === 'required_status_checks');
console.log('rules preserved:', rules.map((r) => r.type).join(', '));
console.log('required checks now:');
for (const c of rsc.parameters.required_status_checks)
  console.log('  -', c.context);
console.log(
  'strict policy:',
  rsc.parameters.strict_required_status_checks_policy
);
