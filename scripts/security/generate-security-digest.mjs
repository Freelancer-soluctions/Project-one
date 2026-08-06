#!/usr/bin/env node
/* global console, process */
/**
 * generate-security-digest.mjs
 *
 * Pure Node.js (>=20) script to generate a human-readable security digest from:
 *   1. CycloneDX SBOM (sbom-project-one.json)
 *   2. OSV Scanner JSON report (osv-report.json)
 *   3. Optional Gitleaks JSON report (gitleaks-report.json)
 *
 * Usage: node generate-security-digest.mjs <sbom-path> <osv-report-path> <gitleaks-report-path> <output-path>
 * All paths are optional and default to current directory if not provided.
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

// ============================================================================
// LICENSE_DENY_LIST — aligned with actions/dependency-review-action default deny-list
// https://github.com/actions/dependency-review-action/blob/main/src/license-check.ts
// ============================================================================
const LICENSE_DENY_LIST = [
  'GPL-2.0',
  'GPL-3.0',
  'LGPL-2.0',
  'LGPL-2.1',
  'LGPL-3.0',
  'AGPL-3.0',
  'GPL-2.0+',
  'GPL-3.0+',
  'AGPL-3.0+',
  'GPL-1.0',
  'GPL-1.0+',
  'LGPL-1.0',
  'LGPL-1.0+',
  'AGPL-1.0',
  'AGPL-1.0+',
];

// Severity ordering for consistent output
const SEVERITY_ORDER = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];
const SEVERITY_BADGES = {
  CRITICAL: '🚨 CRITICAL',
  HIGH: '🔴 HIGH',
  MEDIUM: '🟡 MEDIUM',
  LOW: '🟢 LOW',
};

// ============================================================================
// Helper functions
// ============================================================================
function readJsonFile(filePath) {
  try {
    if (!existsSync(filePath)) {
      return null;
    }
    const content = readFileSync(filePath, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    console.error(
      `Warning: Failed to read/parse ${filePath}: ${error.message}`
    );
    return null;
  }
}

function formatTimestamp() {
  return new Date().toISOString().replace('T', ' ').replace('Z', ' UTC');
}

function getLicenseFromComponent(component) {
  // CycloneDX components can have licenses in multiple formats
  if (component.licenses) {
    // Array of { license: { id, name } } or { expression }
    for (const lic of component.licenses) {
      if (lic.license?.id) return lic.license.id;
      if (lic.expression) return lic.expression;
    }
  }
  if (component.license) {
    // Single license object
    if (typeof component.license === 'string') return component.license;
    if (component.license.id) return component.license.id;
    if (component.license.expression) return component.license.expression;
  }
  return 'UNKNOWN';
}

function normalizeLicense(license) {
  return license?.toUpperCase().replace(/\s+/g, '-') || 'UNKNOWN';
}

function isDenyListed(license) {
  const normalized = normalizeLicense(license);
  return LICENSE_DENY_LIST.some(
    (deny) =>
      normalized === deny.toUpperCase() ||
      normalized.startsWith(deny.toUpperCase() + '-')
  );
}

// ============================================================================
// SBOM Parsing (CycloneDX JSON)
// ============================================================================
function parseSbom(sbom) {
  if (!sbom || !sbom.components) {
    return { totalDependencies: 0, licenseCounts: {}, denyListed: [] };
  }

  const licenseCounts = {};
  const denyListed = [];

  for (const component of sbom.components) {
    const license = getLicenseFromComponent(component);
    const normalized = normalizeLicense(license);

    licenseCounts[normalized] = (licenseCounts[normalized] || 0) + 1;

    if (isDenyListed(license)) {
      denyListed.push({
        name: component.name,
        version: component.version,
        license: normalized,
      });
    }
  }

  return {
    totalDependencies: sbom.components.length,
    licenseCounts,
    denyListed,
  };
}

// ============================================================================
// OSV Scanner JSON Parsing
// ============================================================================
function parseOsVReport(osvReport) {
  if (!osvReport || !osvReport.results) {
    return { vulnerabilities: [], bySeverity: {} };
  }

  const vulnerabilities = [];
  const bySeverity = { CRITICAL: [], HIGH: [], MEDIUM: [], LOW: [] };

  for (const result of osvReport.results) {
    if (!result.packages) continue;

    for (const pkg of result.packages) {
      if (!pkg.vulnerabilities) continue;

      for (const vuln of pkg.vulnerabilities) {
        const severity = vuln.severity?.toUpperCase() || 'UNKNOWN';
        const entry = {
          package: pkg.package?.name || pkg.package?.path || 'unknown',
          version: pkg.package?.version || 'unknown',
          vulnerability: vuln.id || 'unknown',
          title: vuln.summary || vuln.details || '',
          severity,
          cvss: vuln.cvss?.score,
        };

        vulnerabilities.push(entry);

        if (bySeverity[severity]) {
          bySeverity[severity].push(entry);
        }
      }
    }
  }

  return { vulnerabilities, bySeverity };
}

// ============================================================================
// Gitleaks Report Parsing
// ============================================================================
function parseGitleaksReport(gitleaksReport) {
  if (!gitleaksReport) {
    return { available: false, findings: 0 };
  }

  // Gitleaks JSON report is an array of findings
  const findings = Array.isArray(gitleaksReport) ? gitleaksReport.length : 0;
  return { available: true, findings };
}

// ============================================================================
// Markdown Generation
// ============================================================================
function generateMarkdown(sbomData, osvData, gitleaksData) {
  const lines = [];

  // Header
  lines.push(`# Security Digest — ${formatTimestamp()}`);
  lines.push('');

  // Total Dependencies
  lines.push('## 📦 Total Dependencies');
  lines.push('');
  lines.push(
    `**${sbomData.totalDependencies}** packages in the dependency tree (from CycloneDX SBOM)`
  );
  lines.push('');

  // Vulnerable Packages
  lines.push('## 🔍 Vulnerable Packages');
  lines.push('');

  const totalVulns = osvData.vulnerabilities.length;
  if (totalVulns === 0) {
    lines.push('✅ **No known vulnerabilities found** by OSV Scanner.');
  } else {
    lines.push(`**${totalVulns}** vulnerable package(s) detected:`);
    lines.push('');

    for (const severity of SEVERITY_ORDER) {
      const vulns = osvData.bySeverity[severity] || [];
      if (vulns.length === 0) continue;

      const badge = SEVERITY_BADGES[severity] || severity;
      lines.push(`### ${badge} (${vulns.length})`);
      lines.push('');

      for (const vuln of vulns) {
        const cvss = vuln.cvss ? ` (CVSS: ${vuln.cvss})` : '';
        lines.push(
          `- **${vuln.package}@${vuln.version}** — ${vuln.vulnerability}: ${vuln.title}${cvss}`
        );
      }
      lines.push('');
    }
  }

  // License Summary
  lines.push('## ⚖️ License Summary');
  lines.push('');

  const licenseEntries = Object.entries(sbomData.licenseCounts).sort(
    (a, b) => b[1] - a[1]
  );

  if (licenseEntries.length === 0) {
    lines.push('No license information available in SBOM.');
  } else {
    lines.push('| License | Count | Status |');
    lines.push('|---------|-------|--------|');

    for (const [license, count] of licenseEntries) {
      const denied = isDenyListed(license);
      const status = denied ? '⛔ **DENY-LIST**' : '✅ Allowed';
      lines.push(`| ${license} | ${count} | ${status} |`);
    }
  }
  lines.push('');

  // Deny-list details
  if (sbomData.denyListed.length > 0) {
    lines.push('### ⛔ Packages with Deny-Listed Licenses');
    lines.push('');
    for (const pkg of sbomData.denyListed) {
      lines.push(`- **${pkg.name}@${pkg.version}** — License: ${pkg.license}`);
    }
    lines.push('');
  }

  // Secret Scan Cross-Reference
  lines.push('## 🔐 Secret Scan Cross-Reference');
  lines.push('');

  if (gitleaksData.available) {
    lines.push(
      `**Findings: ${gitleaksData.findings}** secret(s) detected by Gitleaks (from scheduled-security.yml weekly run)`
    );
  } else {
    lines.push(
      '**Secret report unavailable** — `gitleaks-report` artifact not found from sibling workflow run.'
    );
    lines.push('');
    lines.push(
      '_Note: The sibling workflow `scheduled-security.yml` runs weekly on Monday 03:00 UTC. If it has not run yet or the artifact has expired, this section will show as unavailable._'
    );
  }
  lines.push('');

  // Footer
  lines.push('---');
  lines.push('');
  lines.push(
    '_Generated by `scripts/security/generate-security-digest.mjs` as part of the **Scheduled Security Digest** workflow._'
  );
  lines.push('');

  return lines.join('\n');
}

// ============================================================================
// Main
// ============================================================================
function main() {
  const args = process.argv.slice(2);

  const sbomPath = args[0]
    ? resolve(args[0])
    : resolve('sbom-project-one.json');
  const osvReportPath = args[1] ? resolve(args[1]) : resolve('osv-report.json');
  const gitleaksReportPath = args[2]
    ? resolve(args[2])
    : resolve('gitleaks-report.json');
  const outputPath = args[3] ? resolve(args[3]) : resolve('security-digest.md');

  console.log(`Reading SBOM from: ${sbomPath}`);
  console.log(`Reading OSV report from: ${osvReportPath}`);
  console.log(`Reading Gitleaks report from: ${gitleaksReportPath}`);
  console.log(`Writing digest to: ${outputPath}`);

  const sbom = readJsonFile(sbomPath);
  const osvReport = readJsonFile(osvReportPath);
  const gitleaksReport = readJsonFile(gitleaksReportPath);

  const sbomData = parseSbom(sbom);
  const osvData = parseOsVReport(osvReport);
  const gitleaksData = parseGitleaksReport(gitleaksReport);

  const markdown = generateMarkdown(sbomData, osvData, gitleaksData);

  writeFileSync(outputPath, markdown, 'utf8');
  console.log(`Security digest written to ${outputPath}`);
}

main();
