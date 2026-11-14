#!/usr/bin/env node
// ============================================================
// Validador de `security/exceptions.yml`
// (change `security-exceptions-policy`, task 1.2)
// ============================================================
// Falla (exit 1) si el fichero es inválido, si falta algún campo del schema,
// si hay ids duplicados, si una fecha no es ISO, si `expires` es anterior a
// `created`, si supera el máximo de 90 días o si la excepción está vencida.
//
// Uso:
//   node scripts/ci/security-exceptions.mjs
//   node scripts/ci/security-exceptions.mjs --file ruta.yml --today 2026-11-10
//
// `--today` existe para tests deterministas; en CI se omite (fecha real).

import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { parse } from 'yaml';

export const REQUIRED_FIELDS = [
  'id',
  'tool',
  'finding',
  'scope',
  'reason',
  'owner',
  'created',
  'expires',
  'ticket',
];

export const MAX_EXPIRY_DAYS = 90;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const DAY_MS = 86_400_000;

function parseDate(value) {
  if (typeof value !== 'string' || !DATE_RE.test(value)) return null;
  const date = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return null;
  // Rechaza fechas que ruedan (2026-02-30 -> 2026-03-02).
  if (date.toISOString().slice(0, 10) !== value) return null;
  return date;
}

const daysBetween = (from, to) => Math.round((to - from) / DAY_MS);

export function validateExceptions(
  doc,
  today = new Date().toISOString().slice(0, 10)
) {
  const todayDate = parseDate(today);
  if (!todayDate)
    return [`fecha de referencia inválida: "${today}" (se espera YYYY-MM-DD)`];

  if (!doc || typeof doc !== 'object' || Array.isArray(doc)) {
    return ['el fichero debe ser un mapa YAML con la clave `exceptions`'];
  }
  if (!Array.isArray(doc.exceptions)) {
    return ['falta la clave `exceptions` o no es una lista'];
  }

  const errors = [];
  const seen = new Set();

  doc.exceptions.forEach((entry, index) => {
    const label =
      entry &&
      typeof entry === 'object' &&
      typeof entry.id === 'string' &&
      entry.id.trim()
        ? `excepción ${entry.id}`
        : `excepción #${index + 1}`;

    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) {
      errors.push(`${label}: debe ser un mapa con los campos del schema`);
      return;
    }

    for (const field of REQUIRED_FIELDS) {
      const value = entry[field];
      if (typeof value !== 'string' || value.trim() === '') {
        errors.push(`${label}: campo \`${field}\` ausente o vacío`);
      }
    }

    if (typeof entry.id === 'string' && entry.id.trim() !== '') {
      if (seen.has(entry.id)) errors.push(`${label}: \`id\` duplicado`);
      seen.add(entry.id);
    }

    const created = parseDate(entry.created);
    const expires = parseDate(entry.expires);

    if (entry.created && !created) {
      errors.push(
        `${label}: \`created\` debe ser una fecha ISO válida (YYYY-MM-DD)`
      );
    }
    if (entry.expires && !expires) {
      errors.push(
        `${label}: \`expires\` debe ser una fecha ISO válida (YYYY-MM-DD)`
      );
    }

    if (created && expires) {
      if (expires < created) {
        errors.push(
          `${label}: \`expires\` (${entry.expires}) es anterior a \`created\` (${entry.created})`
        );
      } else {
        const span = daysBetween(created, expires);
        if (span > MAX_EXPIRY_DAYS) {
          errors.push(
            `${label}: \`expires\` supera el máximo de ${MAX_EXPIRY_DAYS} días desde \`created\` ` +
              `(${entry.created} → ${entry.expires}, ${span} días)`
          );
        }
      }
      if (expires < todayDate) {
        errors.push(
          `${label}: vencida el ${entry.expires} (hoy ${today}) — renueva con justificación o retira la supresión`
        );
      }
    }
  });

  return errors;
}

export function loadAndValidate(file, today) {
  let raw;
  try {
    raw = fs.readFileSync(file, 'utf8');
  } catch (error) {
    return [`no se pudo leer ${file}: ${error.message}`];
  }
  let doc;
  try {
    doc = parse(raw);
  } catch (error) {
    return [
      `YAML inválido en ${file}: ${String(error.message).split('\n')[0]}`,
    ];
  }
  return validateExceptions(doc, today);
}

export function main(argv = process.argv.slice(2)) {
  const args = new Map();
  for (let i = 0; i < argv.length; i += 1) {
    if (!argv[i].startsWith('--')) continue;
    const key = argv[i].slice(2);
    const next = argv[i + 1];
    if (next && !next.startsWith('--')) {
      args.set(key, next);
      i += 1;
    } else {
      args.set(key, 'true');
    }
  }

  const file = args.get('file') ?? path.join('security', 'exceptions.yml');
  const errors = loadAndValidate(file, args.get('today'));

  if (errors.length > 0) {
    console.error(
      `security-exceptions-check: ${errors.length} error(es) en ${file}`
    );
    for (const error of errors) console.error(` - ${error}`);
    return 1;
  }

  console.log(`security-exceptions-check: OK (${file})`);
  return 0;
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  process.exit(main());
}
