#!/usr/bin/env node
'use strict';

/**
 * Runs `npm audit` and fails on any vulnerability that is not covered by a
 * time-boxed exception below.
 *
 * npm audit has no native allowlist. This wrapper exists so a vulnerability
 * with no published fix can be accepted explicitly (with an expiry date and a
 * reason) instead of disabling audit checks or letting `npm audit fix --force`
 * install a downgrade.
 *
 * Keep this list in sync with `.osv-scanner.toml`, which applies the same
 * exceptions to the OSV-Scanner CI job.
 */

const { spawnSync } = require('node:child_process');

const ALLOWED_ADVISORIES = [
  {
    id: 'GHSA-fc5q-39xc-vjpf',
    package: 'picomatch',
    // Upstream has not published a patched release (advisory says "Patched
    // versions: None"). Re-check https://github.com/micromatch/picomatch/pull/194
    // and https://github.com/advisories/GHSA-fc5q-39xc-vjpf before extending.
    expires: '2026-12-17',
    reason:
      'No patched picomatch release exists; the package is only reachable through build-time globbing in this static site.',
  },
];

const GHSA_PATTERN = /GHSA-[a-z0-9]+-[a-z0-9]+-[a-z0-9]+/i;

const today = new Date().toISOString().slice(0, 10);
const active = new Map();
let expired = false;

for (const entry of ALLOWED_ADVISORIES) {
  if (entry.expires < today) {
    expired = true;
    console.error(
      `EXPIRED: ${entry.id} (${entry.package}) exception expired on ${entry.expires}. ` +
        'Update the dependency or remove the exception.'
    );
    continue;
  }
  active.set(entry.id, entry);
}

const audit = spawnSync('npm', ['audit', '--json'], {
  encoding: 'utf8',
  maxBuffer: 64 * 1024 * 1024,
});

if (audit.error) {
  console.error(`Unable to run npm audit: ${audit.error.message}`);
  process.exit(2);
}

let report;
try {
  report = JSON.parse(audit.stdout);
} catch {
  console.error('Unable to parse npm audit output.');
  if (audit.stderr) console.error(audit.stderr.trim());
  process.exit(2);
}

const vulnerabilities = report.vulnerabilities ?? {};

// A package is accepted when every advisory affecting it is accepted, and any
// packages it is affected through are themselves accepted. This resolves the
// dependency chain (`picomatch` -> `micromatch` -> `@docusaurus/utils`, ...)
// without hard-coding every intermediate package.
const acceptedPackages = new Set();
const usedAdvisories = new Set();
let changed = true;

while (changed) {
  changed = false;

  for (const [name, vuln] of Object.entries(vulnerabilities)) {
    if (acceptedPackages.has(name)) continue;

    const via = vuln.via ?? [];
    if (via.length === 0) continue;

    const accepted = via.every((entry) => {
      if (typeof entry === 'string') return acceptedPackages.has(entry);
      const id = String(entry.url ?? '').match(GHSA_PATTERN)?.[0];
      return id ? active.has(id) : false;
    });

    if (accepted) {
      acceptedPackages.add(name);
      changed = true;
    }
  }
}

for (const [name, vuln] of Object.entries(vulnerabilities)) {
  if (!acceptedPackages.has(name)) continue;
  for (const entry of vuln.via ?? []) {
    if (typeof entry !== 'object') continue;
    const id = String(entry.url ?? '').match(GHSA_PATTERN)?.[0];
    if (id && active.has(id)) usedAdvisories.add(id);
  }
}

const remaining = Object.entries(vulnerabilities).filter(
  ([name]) => !acceptedPackages.has(name)
);

if (acceptedPackages.size > 0) {
  console.log('Accepted exceptions:');
  for (const [id, entry] of active) {
    if (!usedAdvisories.has(id)) continue;
    console.log(`  - ${id} (${entry.package}), expires ${entry.expires}`);
    console.log(`    ${entry.reason}`);
  }
  console.log(`  ${acceptedPackages.size} package(s) affected through accepted advisories.`);
  console.log('');
}

for (const [id, entry] of active) {
  if (usedAdvisories.has(id)) continue;
  console.error(
    `STALE: ${id} (${entry.package}) no longer matches a reported vulnerability. ` +
      'Remove the exception so the dependency stays protected.'
  );
}

if (remaining.length > 0) {
  console.error('Unaccepted vulnerabilities:');
  for (const [name, vuln] of remaining) {
    const advisories = (vuln.via ?? [])
      .filter((entry) => typeof entry === 'object')
      .map((entry) => {
        const id = String(entry.url ?? '').match(GHSA_PATTERN)?.[0];
        return `${entry.severity}: ${id ?? entry.title ?? entry.name}`;
      });
    const via = (vuln.via ?? []).filter((entry) => typeof entry === 'string');
    const detail = advisories.concat(via.map((entry) => `via ${entry}`)).join(', ');
    console.error(`  - ${name} (${vuln.severity})${detail ? `: ${detail}` : ''}`);
  }
}

const stale = active.size - usedAdvisories.size;
if (remaining.length > 0 || expired || stale > 0) {
  process.exit(1);
}

console.log('npm audit: no unaccepted vulnerabilities.');
