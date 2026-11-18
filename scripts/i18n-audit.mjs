#!/usr/bin/env node
/**
 * Locale audit: every locale must expose exactly the same key tree.
 * Run with: npm run i18n:audit
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
const LOCALES = ["en", "vi", "ru", "zhtw"];

function flatten(value, prefix = "", result = new Set()) {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    for (const [key, child] of Object.entries(value)) {
      flatten(child, prefix ? `${prefix}.${key}` : key, result);
    }
  } else {
    result.add(prefix);
  }
  return result;
}

const trees = Object.fromEntries(LOCALES.map((locale) => {
  const file = join(ROOT, "locales", `${locale}.json`);
  return [locale, flatten(JSON.parse(readFileSync(file, "utf8")))];
}));

const allKeys = new Set(LOCALES.flatMap((locale) => [...trees[locale]]));
const missing = [];
for (const key of allKeys) {
  for (const locale of LOCALES) {
    if (!trees[locale].has(key)) missing.push(`${locale}: ${key}`);
  }
}

if (missing.length) {
  console.error(`i18n audit failed: ${missing.length} missing key(s)\n`);
  missing.forEach((entry) => console.error(`  ${entry}`));
  process.exit(1);
}

console.log(`i18n audit passed: ${allKeys.size} keys in ${LOCALES.join(", ")}.`);
