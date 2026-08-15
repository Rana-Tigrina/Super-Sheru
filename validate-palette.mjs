#!/usr/bin/env node
/* validate-palette.mjs — the GRD v2 palette gate
 * ───────────────────────────────────────────────
 * SpriteFactory is palette-locked: every pixel the game draws must resolve
 * to a key in the PALETTE table of src/art/SpriteFactory.js. This script
 * enforces the contract so CI can block the build on violations:
 *
 *   1. PALETTE exists; every entry is a lowercase '#rrggbb'.
 *   2. No two palette entries share the same RGB value.
 *   3. Every BANK_* array holds ≤ 32 entries, all valid PALETTE keys.
 *   4. No raw '#rrggbb' literals anywhere outside the PALETTE block —
 *      sprites reference palette keys, never hex.
 *
 * Exit 0 = clean · exit 1 = gate failure.
 */
import { readFileSync } from 'node:fs';

const FACTORY_PATH = new URL('./src/art/SpriteFactory.js', import.meta.url);
const HEX = /^#[0-9a-f]{6}$/;
const BANK_MAX = 32;

function fail(msg) {
    console.error(`✗ palette: ${msg}`);
    process.exit(1);
}

let src;
try {
    src = readFileSync(FACTORY_PATH, 'utf8');
} catch {
    fail('src/art/SpriteFactory.js not found — run from the project root.');
}

/* ── rule 1: extract + validate the PALETTE table ───────────────────────── */
const block = src.match(/export const PALETTE\s*=\s*\{([\s\S]*?)\n\};/);
if (!block) fail('`export const PALETTE = { … };` table not found.');

const entries = [...block[1].matchAll(/([A-Za-z0-9_]+)\s*:\s*'(#[0-9a-fA-F]{1,8})'/g)]
    .map(([, name, hex]) => ({ name, hex: hex.toLowerCase() }));

if (!entries.length) fail('PALETTE table is empty.');

for (const { name, hex } of entries) {
    if (!HEX.test(hex)) fail(`PALETTE.${name} = '${hex}' is not '#rrggbb'.`);
}

/* ── rule 2: unique RGB values ──────────────────────────────────────────── */
const seen = new Map();
for (const { name, hex } of entries) {
    if (seen.has(hex)) {
        fail(`duplicate rgb ${hex} (PALETTE.${seen.get(hex)} vs PALETTE.${name}).`);
    }
    seen.set(hex, name);
}

/* ── rule 3: banks ⊆ palette, ≤ BANK_MAX each ───────────────────────────── */
const keys = new Set(entries.map((e) => e.name));
const banks = [...src.matchAll(/export const (BANK_[A-Z0-9_]+)\s*=\s*\[([\s\S]*?)\];/g)];

for (const [, bank, body] of banks) {
    const refs = body.split(',').map((s) => s.trim().replace(/^['"]|['"]$/g, '')).filter(Boolean);
    if (refs.length > BANK_MAX) {
        fail(`${bank} has ${refs.length} entries (max ${BANK_MAX}).`);
    }
    for (const ref of refs) {
        if (!keys.has(ref)) fail(`${bank} references unknown palette key '${ref}'.`);
    }
}

/* ── rule 4: no stray hex literals outside PALETTE ──────────────────────── */
const outside = src.replace(block[0], '');
const stray = outside.match(/#[0-9a-fA-F]{6}\b/g);
if (stray) {
    fail(`raw hex literal(s) outside PALETTE: ${[...new Set(stray)].join(', ')}`);
}

console.log(
    `✓ palette locked — ${entries.length} colors, ${banks.length} bank(s), 0 stray hex.`
);