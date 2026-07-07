#!/usr/bin/env node
/**
 * Structural census diff — rewrite-invariant, mechanical, zero sampling.
 *
 * Compares SOURCE vs REPLICA on invariants that survive copy rewriting and
 * image substitution: per-section heights, element counts (img/link/button),
 * leaf-text font-size multisets, left-edge anchor sets, and the open-menu
 * state. Prints a full table + flags every violation. The live source is the
 * oracle — never a hand-written spec.
 *
 * Role: EVIDENCE for the agent's visual judgment, not a verdict. It
 * guarantees coverage (which places to look, with numbers eyes can't read),
 * while the agent's eyes remain the acceptance test — bugs like overlapping
 * glyphs or a wrong-mood hero photo pass every invariant here.
 *
 * Usage (run from the recon workspace, where `playwright` is installed):
 *   node <skill>/scripts/structural-census.mjs <sourceURL> <replicaURL> [width=1440] [shotsDir]
 * With shotsDir set, emits per-section paired screenshots
 * (secN-src.png / secN-rep.png) so the visual walk is mechanically complete.
 */
import { createRequire } from 'node:module';
const require = createRequire(process.cwd() + '/');
const { chromium } = require('playwright');

const [, , SRC, REP, W = '1440', SHOTS] = process.argv;
if (!SRC || !REP) {
  console.error('usage: node structural-census.mjs <sourceURL> <replicaURL> [width]');
  process.exit(1);
}
const width = parseInt(W, 10);
const height = width < 500 ? 844 : 900;

const censusFn = () => {
  const vis = (el) => {
    const b = el.getBoundingClientRect();
    if (b.width < 3 || b.height < 3) return false;
    const cs = getComputedStyle(el);
    return cs.visibility !== 'hidden' && cs.display !== 'none';
  };
  const docH = document.documentElement.scrollHeight;
  // sections = outermost full-width bands, excluding page-swallowing wrappers
  const collect = (sel, maxHFrac) => {
    const cands = [...document.querySelectorAll(sel)]
      .filter(el => {
        const b = el.getBoundingClientRect();
        return b.width > innerWidth * 0.95 && b.height > 350 && b.height < docH * maxHFrac;
      })
      .map(el => ({ el, top: Math.round(el.getBoundingClientRect().top + scrollY), h: Math.round(el.getBoundingClientRect().height) }))
      .sort((a, b) => a.top - b.top);
    const out = [];
    for (const c of cands) {
      const last = out[out.length - 1];
      if (last && c.top < last.top + last.h - 50) continue;
      out.push(c);
    }
    return out;
  };
  const SEL = 'section, footer, main > div, [data-framer-name]';
  let sections = collect(SEL, 0.5);
  // fallback 1: semantic selectors found too little → pure geometric scan
  if (sections.length < 3) sections = collect('body *', 0.5);
  // fallback 2: short/single-section pages → relax the wrapper exclusion
  if (sections.length < 2) sections = collect('body *', 0.92);
  if (sections.length < 2) return { warn: 'SEGMENTATION FAILED: no full-width vertical bands found — this layout genre (sidebar / horizontal-scroll / canvas) needs manual section mapping', sections: [] };
  const rows = sections.map(({ el, top, h }, i) => {
    const imgs = [...el.querySelectorAll('img')].filter(vis);
    const links = [...el.querySelectorAll('a')].filter(vis);
    const buttons = [...el.querySelectorAll('button')].filter(vis);
    // font sizes of TEXT NODES (TreeWalker — <br>/<sup> children don't hide text)
    const sizes = {};
    const parents = new Set();
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) {
      const n = walker.currentNode;
      if (n.textContent.trim().length < 3) continue;
      const p = n.parentElement;
      if (!p || !vis(p) || parents.has(p)) continue;
      parents.add(p);
      const fs = Math.round(parseFloat(getComputedStyle(p).fontSize));
      if (fs >= 14) sizes[fs] = (sizes[fs] || 0) + 1;
    }
    // left-edge histogram of visible blocks (quantized 2px, ≥3 occurrences)
    const edges = {};
    [...el.querySelectorAll('*')].forEach(n => {
      const b = n.getBoundingClientRect();
      if (b.width > 80 && b.height > 20 && vis(n)) {
        const x = Math.round(b.x / 2) * 2;
        edges[x] = (edges[x] || 0) + 1;
      }
    });
    const anchorSet = Object.entries(edges).filter(([, c]) => c >= 3).map(([x]) => +x).filter(x => x >= 0).sort((a, b) => a - b);
    return {
      i, top, h,
      nImg: imgs.length, nLink: links.length, nBtn: buttons.length,
      sizes,
      anchors: anchorSet.slice(0, 10),
    };
  });
  return { warn: null, sections: rows };
};

async function census(page, url) {
  await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 }).catch(() => {});
  await page.waitForTimeout(6000);
  await page.evaluate(() => { document.documentElement.style.scrollBehavior = 'auto'; });
  await page.evaluate(async () => {
    const H = document.documentElement.scrollHeight;
    for (let y = 0; y < H; y += 700) { window.scrollTo(0, y); await new Promise(r => setTimeout(r, 130)); }
    window.scrollTo(0, 0);
  });
  await page.waitForTimeout(800);
  return await page.evaluate(censusFn);
}

const fmtSizes = (s) =>
  Object.entries(s).sort((a, b) => b[1] - a[1]).slice(0, 7).map(([k, c]) => `${k}×${c}`).join(' ');

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 1 });
const pageS = await ctx.newPage();
const pageR = await ctx.newPage();
const srcRes = await census(pageS, SRC);
const repRes = await census(pageR, REP);
for (const [name, r] of [['source', srcRes], ['replica', repRes]]) {
  if (r.warn) { console.error(name + ': ' + r.warn); process.exit(3); }
}
const src = srcRes.sections, rep = repRes.sections;

/* Align sections by fingerprint similarity (DP, gap penalty) so an extra or
   missing band produces ONE flag instead of cascading index mismatches. */
function alignSections(A, B) {
  const cost = (a, b) => {
    const dh = Math.abs(a.h - b.h) / Math.max(a.h, b.h);
    const di = Math.abs(a.nImg - b.nImg) / Math.max(a.nImg, b.nImg, 1);
    const dl = Math.abs(a.nLink - b.nLink) / Math.max(a.nLink, b.nLink, 1);
    return dh + 0.5 * di + 0.3 * dl;
  };
  const GAP = 0.9;
  const m = A.length, n = B.length;
  const D = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 1; i <= m; i++) D[i][0] = i * GAP;
  for (let j = 1; j <= n; j++) D[0][j] = j * GAP;
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      D[i][j] = Math.min(D[i - 1][j - 1] + cost(A[i - 1], B[j - 1]), D[i - 1][j] + GAP, D[i][j - 1] + GAP);
  const pairs = [];
  let i = m, j = n;
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && D[i][j] === D[i - 1][j - 1] + cost(A[i - 1], B[j - 1])) { pairs.unshift([i - 1, j - 1]); i--; j--; }
    else if (i > 0 && D[i][j] === D[i - 1][j] + GAP) { pairs.unshift([i - 1, null]); i--; }
    else { pairs.unshift([null, j - 1]); j--; }
  }
  return pairs;
}
const aligned = alignSections(src, rep);

let violations = 0;
console.log(`=== structural census @${width}px — src ${src.length} sections, rep ${rep.length} sections ===`);
console.log('sec | height src→rep (Δ%) | img | link | btn | font-size multiset (src || rep)');
for (const [si, ri] of aligned) {
  if (si === null) { console.log(' +  | REPLICA-ONLY section h=' + rep[ri].h + ' at y=' + rep[ri].top + '  <<< EXTRA'); violations++; continue; }
  if (ri === null) { console.log(' -  | SOURCE-ONLY section h=' + src[si].h + ' at y=' + src[si].top + '  <<< MISSING'); violations++; continue; }
  const i = si;
  const s = src[si], r = rep[ri];
  const dh = (r.h - s.h) / s.h;
  const sizeKeys = new Set([...Object.keys(s.sizes), ...Object.keys(r.sizes)]);
  const sizeDiff = [...sizeKeys].filter(k => (s.sizes[k] || 0) !== (r.sizes[k] || 0) && Math.max(s.sizes[k] || 0, r.sizes[k] || 0) > 1);
  const flags = [];
  if (Math.abs(dh) > 0.04) flags.push(`HEIGHT ${(dh * 100).toFixed(1)}%`);
  if (s.nImg !== r.nImg) flags.push(`IMG ${s.nImg}→${r.nImg}`);
  if (s.nLink !== r.nLink) flags.push(`LINK ${s.nLink}→${r.nLink}`);
  if (sizeDiff.length) flags.push(`SIZES ${sizeDiff.join(',')}`);
  const anchorMiss = s.anchors.filter(a => !r.anchors.some(b => Math.abs(a - b) <= 4));
  if (anchorMiss.length) flags.push(`ANCHORS missing ${anchorMiss.join(',')}`);
  if (flags.length) violations++;
  console.log(
    String(i).padStart(3), '|',
    `${s.h}→${r.h}`.padEnd(12), '|',
    `${s.nImg}→${r.nImg}`.padEnd(6), '|',
    `${s.nLink}→${r.nLink}`.padEnd(6), '|',
    `${s.nBtn}→${r.nBtn}`.padEnd(4), '|',
    fmtSizes(s.sizes), '||', fmtSizes(r.sizes),
    flags.length ? '  <<< ' + flags.join(' | ') : ''
  );
}
// paired per-section screenshots: mechanical coverage for the VISUAL pass
if (SHOTS) {
  const fs = await import('node:fs');
  fs.mkdirSync(SHOTS, { recursive: true });
  // clip beyond the viewport silently fails on current Playwright — scroll
  // to the section instead and shoot the viewport (plus a bottom shot for
  // sections much taller than one screen).
  const shoot = async (pg, sec, name) => {
    const stops = sec.h > height * 1.25 ? [sec.top, sec.top + sec.h - height] : [sec.top];
    for (let t = 0; t < stops.length; t++) {
      await pg.evaluate((y) => window.scrollTo(0, y), Math.max(0, stops[t]));
      await pg.waitForTimeout(450);
      await pg.screenshot({ path: `${SHOTS}/${name}${t ? '-b' : ''}.png` }).catch(() => {});
    }
  };
  for (let k = 0; k < aligned.length; k++) {
    const [si, ri] = aligned[k];
    if (si !== null) await shoot(pageS, src[si], `sec${k}-src`);
    if (ri !== null) await shoot(pageR, rep[ri], `sec${k}-rep`);
  }
  console.log(`\nPaired section screenshots written to ${SHOTS}/ — READ every pair; the visual comparison is the acceptance test, this table is only its evidence.`);
}
await browser.close();
console.log(violations === 0 ? '\nCENSUS invariants clean (NOT acceptance — do the visual pass)' : `\nCENSUS: ${violations} section(s) flagged — every flag is a fix-list row.`);
process.exit(violations === 0 ? 0 : 2);
