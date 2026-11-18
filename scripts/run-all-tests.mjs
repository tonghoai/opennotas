#!/usr/bin/env node
/**
 * Full test gate for OpenNotas.
 *
 * This is the single "run everything" command used locally and in CI:
 *
 *   1. UI/design-system audit  — fails if DaisyUI names/colors leak back in.
 *   2. i18n audit              — verifies en/vi/ru/zhtw expose the same key tree.
 *   3. Unit/component tests    — Vitest + Nuxt environment + fake IndexedDB.
 *   4. Production build        — built with NUXT_PUBLIC_ENV=production so the
 *                                service worker path is exercised like a deploy.
 *   5. Production E2E          — Playwright desktop + mobile against .output,
 *                                including accessibility and offline PWA tests.
 *
 * Every stage is sequential and fail-fast: a failing stage stops the run with
 * a non-zero exit code so CI cannot publish a partially tested build.
 */
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const packageJsonPath = fileURLToPath(new URL('../package.json', import.meta.url));
const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'));

if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log('OpenNotas test scripts:\n');
  for (const [name, description] of Object.entries(packageJson.scriptsComments || {})) {
    if (name !== 'test:help') {
      console.log(`  npm run ${name.padEnd(18)} ${description}`);
    }
  }
  console.log('\nRun everything with: npm run test:all');
  process.exit(0);
}

const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const npx = process.platform === 'win32' ? 'npx.cmd' : 'npx';

const stages = [
  {
    name: 'UI design-system audit',
    command: npm,
    args: ['run', 'ui:audit'],
  },
  {
    name: 'i18n key parity audit',
    command: npm,
    args: ['run', 'i18n:audit'],
  },
  {
    name: 'Vitest unit/component tests',
    command: npm,
    args: ['run', 'test:unit'],
  },
  {
    name: 'Production build (PWA service worker enabled)',
    command: npm,
    args: ['run', 'build'],
    env: { NUXT_PUBLIC_ENV: 'production' },
  },
  {
    name: 'Playwright E2E desktop + mobile (production, a11y, PWA offline)',
    command: npx,
    args: ['playwright', 'test'],
    env: { E2E_SERVER: 'prod' },
  },
];

const startedAt = Date.now();
const completed = [];

for (const [index, stage] of stages.entries()) {
  const label = `[${index + 1}/${stages.length}] ${stage.name}`;
  console.log(`\n${'='.repeat(label.length)}\n${label}\n${'='.repeat(label.length)}\n`);

  const result = spawnSync(stage.command, stage.args, {
    cwd: root,
    stdio: 'inherit',
    env: { ...process.env, ...stage.env },
  });

  if (result.error) {
    console.error(`\nCould not start stage: ${stage.name}`);
    console.error(result.error.message);
    process.exit(1);
  }

  if (result.status !== 0) {
    console.error(`\nFAILED: ${stage.name} (exit ${result.status ?? 'signal'}). Stopping the test gate.`);
    process.exit(result.status || 1);
  }

  completed.push(stage.name);
}

const seconds = ((Date.now() - startedAt) / 1000).toFixed(1);
console.log(`\nAll test stages passed in ${seconds}s:`);
for (const name of completed) console.log(`  ✓ ${name}`);
