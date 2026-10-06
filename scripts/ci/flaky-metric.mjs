#!/usr/bin/env node
/* globals process, console */
/**
 * Métrica semanal de flakiness (change `coverage-tripwire-stage-2d`, D8,
 * spec `ci-flaky-quarantine`, task 5.3).
 *
 * Agrega los artifacts de las corridas de `ci.yml` de la ventana de 14 días
 * (descargados por el workflow vía GitHub API a `.flaky-data/`) y produce:
 *
 *   - candidatos a cuarentena: ≥ MIN_RUNS ejecuciones y pass-rate < PASS_RATE_MIN
 *   - "insufficient data": < MIN_RUNS ejecuciones (NO se markan, se listan)
 *   - flaky: test que pasó tras ≥1 retry (evidencia del reporter custom)
 *   - share de cuarentena: entradas en `.github/flaky-quarantine.yml` sobre el
 *     total de tests de la suite; alerta advisory al alcanzar QUARANTINE_SHARE_MAX
 *
 * ENTRADAS ESPERADAS ( `.flaky-data/<workspace>/<run-id>/…` )
 *   reports/junit.xml          → pass/fail por test (estado final)
 *   reports/flaky-retries.json → retryCount/flaky por test (mismo test id)
 *
 * El cruce de las dos fuentes es lo que permite distinguir "verde limpio" de
 * "verde tras retry" (el JUnit colapsa los retries — ver el reporter custom).
 *
 * Uso:
 *   node scripts/ci/flaky-metric.mjs --data-dir=.flaky-data \
 *        --quarantine=.github/flaky-quarantine.yml [--json-out=out.json]
 *
 * Exit codes:
 *   0  métrica calculada (los candidatos y la alerta son ADVISORY por diseño)
 *   1  datos ausentes o ilegibles (falla ruidosamente: una métrica vacía
 *      reportando "todo verde" sería peor que no tener métrica)
 *   2  error de uso
 */
import fs from 'node:fs';
import path from 'node:path';

/** Ventana de observación (spec `ci-flaky-quarantine`). */
const WINDOW_DAYS = 14;
/** Mínimo de ejecuciones para poder emitir veredicto sobre un test. */
const MIN_RUNS = 10;
/** Pass-rate por debajo del cual el test es candidato a cuarentena. */
const PASS_RATE_MIN = 0.7;
/** Share de cuarentena sobre el total de la suite que dispara alerta advisory. */
const QUARANTINE_SHARE_MAX = 0.01;

function parseArgs(argv) {
  const args = {
    dataDir: '.flaky-data',
    quarantine: '.github/flaky-quarantine.yml',
    jsonOut: null,
  };
  for (const arg of argv) {
    const match = arg.match(/^--([^=]+)(?:=(.*))?$/);
    if (!match) continue;
    const [, key, value] = match;
    if (key === 'data-dir') args.dataDir = value ?? '.flaky-data';
    else if (key === 'quarantine') args.quarantine = value ?? args.quarantine;
    else if (key === 'json-out') args.jsonOut = value ?? null;
    else if (key === 'window-days') args.windowDays = Number(value);
    else if (key === 'min-runs') args.minRuns = Number(value);
    else if (key === 'pass-rate-min') args.passRateMin = Number(value);
  }
  return args;
}

/**
 * Extrae `<testcase classname=… name=…>` y si tiene hijos `<failure>`/`<skipped/>`
 * de un JUnit XML. Parser intencionadamente mínimo: los artifacts los genera el
 * reporter `junit` de Vitest, con estructura plana y sin DTD ni entidades.
 */
export function parseJUnit(xml) {
  const results = [];
  // Spliteo por etiqueta de apertura para que cada `<testcase>` se revise con su
  // cuerpo hasta el cierre correspondiente (un un regex alterno con `*?` perezoso
  // puede aparejar el cierre de un testcase con el del siguiente).
  const openRe = /<testcase\b([^>]*?)(\/?)>/g;
  const closeTag = '</testcase>';
  let match;
  while ((match = openRe.exec(xml)) !== null) {
    const attrs = match[1] ?? '';
    const selfClosing = match[2] === '/';
    // `\bname=` evita que `name=` case dentro de `classname=`.
    const classname = (attrs.match(/\bclassname="([^"]*)"/) || [])[1] ?? '';
    const name = (attrs.match(/\bname="([^"]*)"/) || [])[1] ?? '';
    if (!classname && !name) continue;

    let body = '';
    if (!selfClosing) {
      const closeIndex = xml.indexOf(closeTag, openRe.lastIndex);
      body = closeIndex === -1 ? '' : xml.slice(openRe.lastIndex, closeIndex);
      if (closeIndex !== -1) openRe.lastIndex = closeIndex + closeTag.length;
    }

    results.push({
      key: `${classname}::${name}`,
      classname,
      name,
      failed: /<failure\b/.test(body),
      errored: /<error\b/.test(body),
      skipped: /<skipped\b/.test(body),
    });
  }
  return results;
}

/** Lee el artefacto del reporter custom (retryCount/flaky por test). */
function readRetryEvidence(filePath) {
  const raw = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  const map = new Map();
  for (const test of raw.tests || []) {
    // El reporter custom guarda `name` = título del test; el `name` del JUnit
    // incluye la jerarquía de suites ("Suite B > test x"). Se indexa por varias
    // claves para que el cruce sea robusto ante diferencias de formato:
    // ruta+título exactos, ruta+título desnudo, y título global.
    map.set(`${test.file}::${test.name}`, test);
    map.set(`${test.file}::${bareTitle(test.name)}`, test);
    map.set(`title::${test.name}`, test);
  }
  return map;
}

/** Normaliza un nombre de test quitando la jerarquía de suites ("A > B > c" → "c"). */
function bareTitle(name) {
  // El JUnit de Vitest escapa `>` como `&gt;` en el atributo `name`: hay que
  // des-escapar ANTES de cortar por `>` o la jerarquía nunca se separa.
  const decoded = String(name)
    .replace(/&gt;/g, '>')
    .replace(/&lt;/g, '<')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&');
  const parts = decoded.split('>').map((p) => p.trim());
  return parts[parts.length - 1] || decoded.trim();
}

/** Lista recursivamente los artifacts JUnit bajo un directorio de datos. */
function collectRunDirs(dataDir) {
  const found = [];
  const walk = (dir) => {
    let entries;
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (entry.name === 'junit.xml') found.push(full);
    }
  };
  walk(dataDir);
  return found.sort();
}

/**
 * Agrega los resultados. Devuelve candidatos, insufficient-data y flaky.
 * La clave de un test es `fichero::nombre completo del test` (estable entre runs).
 */
export function aggregate(junitFiles, retryEvidenceByJUnit) {
  const stats = new Map(); // key → { file, name, runs, passed, flaky, skipped }

  for (const junitFile of junitFiles) {
    const xml = fs.readFileSync(junitFile, 'utf8', 'utf8');
    const cases = parseJUnit(xml);
    const retryMap = retryEvidenceByJUnit.get(junitFile) || new Map();

    for (const testCase of cases) {
      // El JUnit no distingue "pasa" de "pasa tras retry": se busca la
      // evidencia del reporter custom para marcar el caso flaky. Se prueba el
      // cruce exacto (ruta + título), luego ruta + título desnudo (el JUnit
      // incluye la jerarquía de suites) y por último el título global.
      const bare = bareTitle(testCase.name);
      const retry =
        retryMap.get(`${testCase.classname}::${testCase.name}`) ||
        retryMap.get(`${testCase.classname}::${bare}`) ||
        retryMap.get(`title::${bare}`) ||
        retryMap.get(testCase.name);
      const flaky = retry?.flaky === true || (retry?.retryCount ?? 0) > 0;

      let entry = stats.get(testCase.key);
      if (!entry) {
        entry = {
          file: testCase.classname,
          name: testCase.name,
          runs: 0,
          passed: 0,
          flakyRuns: 0,
          skippedRuns: 0,
        };
        stats.set(testCase.key, entry);
      }
      if (testCase.skipped) {
        entry.skippedRuns += 1;
        continue; // un test omitido no cuenta como ejecución ni como fallo
      }
      entry.runs += 1;
      if (!testCase.failed && !testCase.errored) entry.passed += 1;
      if (flaky && !testCase.failed && !testCase.errored) entry.flakyRuns += 1;
    }
  }

  const candidates = [];
  const insufficient = [];
  const flaky = [];

  for (const entry of stats.values()) {
    const passRate = entry.runs > 0 ? entry.passed / entry.runs : 0;
    const record = {
      file: entry.file,
      name: entry.name,
      runs: entry.runs,
      passed: entry.passed,
      passRate: Number(passRate.toFixed(3)),
      flakyRuns: entry.flakyRuns,
    };
    if (entry.flakyRuns > 0) flaky.push(record);
    if (entry.runs < MIN_RUNS) insufficient.push(record);
    else if (passRate < PASS_RATE_MIN) candidates.push(record);
  }

  const byPassRate = (a, b) => a.passRate - b.passRate;
  candidates.sort(byPassRate);
  flaky.sort((a, b) => b.flakyRuns - a.flakyRuns);
  insufficient.sort((a, b) => a.runs - b.runs);

  return { candidates, insufficient, flaky, totalTests: stats.size };
}

/** Cuenta entradas de la lista de cuarentena reutilizando el parser del repo. */
function countQuarantine(quarantineFile) {
  if (!fs.existsSync(quarantineFile)) return 0;
  const src = fs.readFileSync(quarantineFile, 'utf8');
  const lines = src.split(/\r?\n/);
  const start = lines.findIndex((l) =>
    /^quarantine:\s*(\[\s*\])?\s*(#.*)?$/.test(l)
  );
  if (start === -1) return 0;
  if (/^\s*\[\s*\]\s*$/.test(lines[start].slice('quarantine:'.length)))
    return 0;
  let count = 0;
  for (let i = start + 1; i < lines.length; i++) {
    if (/^\S/.test(lines[i]) && lines[i].trim() !== '') break;
    if (/^\s*-\s+test:/.test(lines[i])) count += 1;
  }
  return count;
}

function renderMarkdown(result, quarantineCount, windowDays) {
  const { candidates, insufficient, flaky, totalTests } = result;
  const share = totalTests > 0 ? quarantineCount / totalTests : 0;
  const shareAlert = share >= QUARANTINE_SHARE_MAX;

  const lines = [
    '## Métrica semanal de flakiness',
    '',
    `Ventana: ${windowDays} días · ${totalTests} tests distintos observados · ${quarantineCount} en cuarentena.`,
    '',
    `### Candidatos a cuarentena (≥${MIN_RUNS} ejecuciones y pass-rate <${Math.round(PASS_RATE_MIN * 100)}%)`,
    '',
  ];
  if (!candidates.length) {
    lines.push(
      '_Ninguno: ningún test con datos suficientes cae por debajo del umbral._'
    );
  } else {
    lines.push('| Pass-rate | Ejecuciones | Test | Fichero |');
    lines.push('| --- | --- | --- | --- |');
    for (const c of candidates) {
      lines.push(
        `| ${(c.passRate * 100).toFixed(1)}% | ${c.runs} | ${escapePipes(c.name)} | \`${c.file}\` |`
      );
    }
  }

  lines.push(
    '',
    `### Flaky (pasó tras retry — verde en CI, señal de intervensión)`,
    ''
  );
  if (!flaky.length) {
    lines.push('_Ninguno en la ventana._');
  } else {
    lines.push('| Test | Fichero | Corridas con retry |');
    lines.push('| --- | --- | --- |');
    for (const f of flaky) {
      lines.push(`| ${escapePipes(f.name)} | \`${f.file}\` | ${f.flakyRuns} |`);
    }
  }

  lines.push(
    '',
    '### Insufficient data (no se marcan: <' + MIN_RUNS + ' ejecuciones)',
    ''
  );
  if (!insufficient.length) {
    lines.push('_Todos los tests observados tienen datos suficientes._');
  } else {
    lines.push(
      `**${insufficient.length} test(s)** con menos de ${MIN_RUNS} ejecuciones — se listan, no se marcan.`
    );
    lines.push('');
    lines.push('| Ejecuciones | Pass-rate | Test |');
    lines.push('| --- | --- | --- |');
    for (const t of insufficient.slice(0, 25)) {
      lines.push(
        `| ${t.runs} | ${(t.passRate * 100).toFixed(1)}% | ${escapePipes(t.name)} |`
      );
    }
    if (insufficient.length > 25)
      lines.push(`_… y ${insufficient.length - 25} más._`);
  }

  lines.push(
    '',
    '### Share de cuarentena',
    '',
    `${quarantineCount}/${totalTests} = ${(share * 100).toFixed(2)}% (objetivo <${(QUARANTINE_SHARE_MAX * 100).toFixed(0)}%).`,
    ''
  );
  if (shareAlert) {
    lines.push(
      `> **Alerta de triaje (advisory):** el share de cuarentena alcanzó ${(share * 100).toFixed(2)}%. ` +
        'Requiere triaje. Esto NO bloquea el merge: `ci-complete` y el merge gate no se ven afectados.'
    );
  } else {
    lines.push('Sin alerta: share por debajo del objetivo.');
  }

  lines.push(
    '',
    '### Restauración (solo PR humano)',
    '',
    'Los tests en `.github/flaky-quarantine.yml` con pass-rate ≥' +
      `${Math.round(PASS_RATE_MIN * 100)}%` +
      ' en la ventana son candidatos a restaurar. Esta métrica NO edita la lista: ' +
      'borrar una entrada es siempre un PR humano.'
  );

  return lines.join('\n');
}

function escapePipes(value) {
  return String(value).replace(/\|/g, '\\|');
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const windowDays = args.windowDays || WINDOW_DAYS;

  const junitFiles = collectRunDirs(args.dataDir);
  if (!junitFiles.length) {
    console.error(
      `::error::no se encontró ningún reports/junit.xml bajo ${args.dataDir} — ` +
        'la métrica no puede calcularse (preferible a reportar "todo verde").'
    );
    process.exit(1);
  }

  // Índice de evidencia de retry por artifact JUnit (mismo directorio).
  const retryEvidenceByJUnit = new Map();
  for (const junitFile of junitFiles) {
    const retryFile = path.join(path.dirname(junitFile), 'flaky-retries.json');
    if (fs.existsSync(retryFile)) {
      try {
        retryEvidenceByJUnit.set(junitFile, readRetryEvidence(retryFile));
      } catch (error) {
        console.log(
          `::warning::retry evidence ilegible (${retryFile}): ${error.message}`
        );
      }
    }
  }

  const result = aggregate(junitFiles, retryEvidenceByJUnit);
  const quarantineCount = countQuarantine(args.quarantine);
  const markdown = renderMarkdown(result, quarantineCount, windowDays);

  console.log(markdown);

  if (args.jsonOut) {
    fs.writeFileSync(
      args.jsonOut,
      JSON.stringify(
        {
          windowDays,
          minRuns: MIN_RUNS,
          passRateMin: PASS_RATE_MIN,
          quarantineCount,
          ...result,
        },
        null,
        2
      )
    );
    console.log(`\nMétrica escrita en ${args.jsonOut}`);
  }

  // Los candidatos y la alerta de share son ADVISORY: exit 0 siempre que la
  // métrica se haya calculado (spec `ci-flaky-quarantine`).
  process.exit(0);
}

if (process.argv[1] && process.argv[1].endsWith('flaky-metric.mjs')) {
  main();
}
