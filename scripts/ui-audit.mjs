#!/usr/bin/env node
/**
 * UI audit: fails when DaisyUI names or color variables leak back in.
 *
 * Run with: npm run ui:audit
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const ROOT = process.cwd();
const SKIP = new Set(["node_modules", ".git", ".nuxt", ".output", ".claude", "dist"]);
const EXTENSIONS = new Set([".vue", ".ts", ".js", ".css"]);

/*
 * Exact names only. Prefix matching would flag unrelated third-party classes
 * such as Milkdown's `.link-importer`, `.menu-group` or Tiptap's `a.link`.
 */
const DAISY_TOKENS = new Set([
  "btn", "btn-primary", "btn-secondary", "btn-ghost", "btn-outline",
  "btn-error", "btn-success", "btn-warning", "btn-info", "btn-sm", "btn-xs",
  "btn-lg", "btn-md", "btn-circle", "btn-square", "btn-block", "btn-link",
  "modal", "modal-box", "modal-action", "modal-backdrop", "modal-top",
  "modal-bottom", "modal-middle",
  "input", "input-sm", "input-md", "input-lg", "input-bordered", "input-error",
  "select", "select-sm", "select-md", "select-lg", "select-bordered",
  "textarea", "textarea-bordered",
  "checkbox", "checkbox-sm", "checkbox-primary",
  "toggle", "toggle-primary",
  "radio", "radio-sm",
  "range", "range-sm",
  "file-input", "file-input-bordered", "file-input-sm", "file-input-md",
  "form-control", "label", "label-text", "label-text-alt",
  "menu", "menu-sm", "menu-xs", "menu-md", "menu-lg", "menu-horizontal",
  "menu-title",
  "badge", "badge-sm", "badge-md", "badge-primary", "badge-secondary",
  "alert", "alert-warning", "alert-error", "alert-info", "alert-success",
  "link", "link-hover", "link-error",
  "tab", "tab-active", "tabs", "tabs-bordered", "tabs-boxed",
  "drawer", "drawer-toggle", "drawer-side", "drawer-overlay", "drawer-content",
  "drawer-end",
  "dropdown", "dropdown-content", "dropdown-end", "dropdown-start",
  "dropdown-top", "dropdown-bottom",
  "collapse", "collapse-arrow", "collapse-title", "collapse-content",
  "loading", "loading-spinner", "loading-xs", "loading-sm", "loading-lg",
  "join", "join-item", "avatar", "placeholder", "navbar", "footer",
  "footer-title",
]);

const DAISY_COLORS = new Set([
  "base-100", "base-200", "base-300", "base-400", "base-content",
  "primary-content", "secondary-content", "neutral-content", "error",
  "error-content", "warning-content", "success-content", "info-content",
]);

const COLOR_PREFIX =
  /^(ring-offset|ring|divide|border|text|bg|from|via|to|fill|stroke|decoration|outline)-(.+)$/;

const DAISY_VAR =
  /var\(--(b1|b2|b3|bc|p|pc|s|sc|a|ac|n|nc|wa|wac|er|erc|su|suc|in|inc)\)/;

const violations = [];

function walk(dir) {
  for (const entry of readdirSync(dir)) {
    if (SKIP.has(entry)) continue;
    const path = join(dir, entry);
    const stat = statSync(path);
    if (stat.isDirectory()) {
      walk(path);
      continue;
    }
    if (!EXTENSIONS.has(path.slice(path.lastIndexOf(".")))) continue;
    auditFile(path);
  }
}

function add(path, line, message) {
  violations.push(`${relative(ROOT, path)}:${line}  ${message}`);
}

function auditTokens(path, line, value) {
  for (const raw of value.split(/\s+/)) {
    if (!raw) continue;
    const token = raw.replace(/^!+/, "").replace(/^[a-z-]+:/, "");
    if (!token) continue;
    if (DAISY_TOKENS.has(token)) {
      add(path, line, `DaisyUI class "${raw}"`);
      continue;
    }
    const color = token.match(COLOR_PREFIX);
    if (!color) continue;
    const name = color[2].split("/")[0];
    if (DAISY_COLORS.has(name)) {
      add(path, line, `DaisyUI color utility "${raw}"`);
    }
  }
}

function stripComments(value) {
  return value.replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, " "));
}

function auditFile(path) {
  const source = stripComments(readFileSync(path, "utf8"));
  const lines = source.split("\n");
  const isVue = path.endsWith(".vue");

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    const lineNo = i + 1;

    if (line.includes("oklch(var(--")) {
      add(path, lineNo, "DaisyUI oklch color variable");
    }

    if (DAISY_VAR.test(line)) {
      add(path, lineNo, "DaisyUI theme variable");
    }

    if (path.endsWith(".css")) {
      const selector = line.trim();
      if (!selector.startsWith(".")) continue;
      for (const match of selector.matchAll(/\.([a-zA-Z][\w-]*)/g)) {
        if (!DAISY_TOKENS.has(match[1])) continue;
        // Third-party editors own these class names; they are not ours.
        if (path.endsWith("crepe.css") && match[1] === "placeholder") continue;
        if (path.endsWith("markdown.css") && match[1] === "link") continue;
        add(path, lineNo, `DaisyUI CSS selector ".${match[1]}"`);
      }
      continue;
    }

    if (!isVue && !line.includes("classList")) continue;

    const classAttr = line.match(/(?:^|\s)class="([^"]*)"/);
    if (classAttr) auditTokens(path, lineNo, classAttr[1]);

    const boundClass = line.match(/:class="([^"]*)"/);
    if (boundClass) {
      for (const quoted of boundClass[1].matchAll(/(['"])([^'"]*)\1/g)) {
        auditTokens(path, lineNo, quoted[2]);
      }
    }

    const classList = line.match(/classList\.(?:add|remove|toggle)\(([^)]*)\)/);
    if (classList) {
      for (const quoted of classList[1].matchAll(/(['"])([^'"]*)\1/g)) {
        auditTokens(path, lineNo, quoted[2]);
      }
    }
  }
}

walk(ROOT);

const packageJson = JSON.parse(readFileSync(join(ROOT, "package.json"), "utf8"));
const allDeps = {
  ...packageJson.dependencies,
  ...packageJson.devDependencies,
};
if (allDeps.daisyui) {
  violations.push("package.json  DaisyUI is still a dependency");
}

if (violations.length > 0) {
  console.error(`UI audit failed: ${violations.length} violation(s)\n`);
  for (const violation of violations) console.error(`  ${violation}`);
  console.error("\nRemove DaisyUI names before committing.\n");
  process.exit(1);
}

console.log("UI audit passed: no DaisyUI names, color utilities or variables found.");
