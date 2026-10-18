#!/usr/bin/env node
// Scans frontend projects and writes a taste/stack profile to ../profile.md
// Usage: node scan-projects.mjs <root> [<root> ...]   (roots are searched to depth 3 for package.json)
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const out = path.join(here, "..", "profile.md");
const roots = process.argv.slice(2);
if (!roots.length) { console.error("Pass at least one root dir"); process.exit(1); }

const SKIP = new Set(["node_modules", ".git", ".next", "dist", "build", ".claude", ".vercel", "out", "coverage"]);
const INTEREST = {
  framework: ["next", "react", "vue", "svelte", "astro", "vite", "nuxt"],
  styling: ["tailwindcss", "styled-components", "@emotion/react", "sass", "@chakra-ui/react", "@radix-ui/react-dialog"],
  animation: ["gsap", "framer-motion", "motion", "lenis", "@studio-freight/lenis", "locomotive-scroll", "animejs", "lottie-react", "lottie-web", "react-spring", "@react-spring/web", "aos", "barba.js", "@barba/core"],
  threeD: ["three", "@react-three/fiber", "@react-three/drei", "@splinetool/react-spline", "babylonjs", "ogl", "pixi.js"],
  maps: ["maplibre-gl", "mapbox-gl", "leaflet", "react-leaflet", "d3"],
  backend: ["@supabase/supabase-js", "firebase", "prisma"],
};

function findProjects(dir, depth, acc) {
  if (depth < 0) return;
  let ents; try { ents = fs.readdirSync(dir, { withFileTypes: true }); } catch { return; }
  if (ents.some(e => e.isFile() && e.name === "package.json")) acc.push(dir);
  for (const e of ents) if (e.isDirectory() && !SKIP.has(e.name) && !e.name.startsWith(".")) findProjects(path.join(dir, e.name), depth - 1, acc);
}

function walk(dir, exts, acc = [], depth = 6) {
  if (depth < 0) return acc;
  let ents; try { ents = fs.readdirSync(dir, { withFileTypes: true }); } catch { return acc; }
  for (const e of ents) {
    if (SKIP.has(e.name) || e.name.startsWith(".")) continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, exts, acc, depth - 1);
    else if (exts.some(x => e.name.endsWith(x))) acc.push(p);
  }
  return acc;
}

const read = p => { try { return fs.readFileSync(p, "utf8"); } catch { return ""; } };
const uniq = a => [...new Set(a)];

function scan(dir) {
  const pkg = JSON.parse(read(path.join(dir, "package.json")) || "{}");
  const deps = { ...pkg.dependencies, ...pkg.devDependencies };
  const found = {};
  for (const [k, names] of Object.entries(INTEREST)) {
    const hit = names.filter(n => deps[n]).map(n => `${n}@${String(deps[n]).replace(/^[\^~]/, "")}`);
    if (hit.length) found[k] = hit;
  }
  const styleFiles = walk(dir, [".css", ".scss"]).slice(0, 40);
  const codeFiles = walk(dir, [".tsx", ".jsx", ".vue", ".svelte", ".astro", ".html"]).slice(0, 300);
  const css = styleFiles.map(read).join("\n");
  const code = codeFiles.map(read).join("\n");
  const tokens = uniq([...css.matchAll(/--([\w-]+)\s*:\s*(#[0-9a-fA-F]{3,8}|rgba?\([^)]*\)|hsl[a]?\([^)]*\))/g)].map(m => `--${m[1]}: ${m[2]}`)).slice(0, 24);
  const fonts = uniq([
    ...[...code.matchAll(/\b([A-Z][A-Za-z_]+)\s*\(\s*\{[^}]*subsets/g)].map(m => m[1].replace(/_/g, " ")),
    ...[...css.matchAll(/font-family\s*:\s*([^;}{]+)/g)].map(m => m[1].split(",")[0].replace(/["']/g, "").trim()),
    ...[...css.matchAll(/@font-face\s*{[^}]*font-family\s*:\s*["']?([^;"']+)/g)].map(m => m[1].trim()),
  ].filter(f => f && !f.startsWith("var(") && f !== "inherit")).slice(0, 10);
  const sections = uniq(codeFiles.map(f => path.basename(f).replace(/\.(tsx|jsx|vue|svelte|astro|html)$/, "")).filter(n => /^[A-Z]/.test(n))).slice(0, 40);
  const patterns = [];
  const has = (re, label) => re.test(code) && patterns.push(label);
  has(/ScrollTrigger|useScroll|IntersectionObserver|whileInView/, "scroll-driven reveals");
  has(/new Lenis|lenis/i, "smooth scroll (Lenis)");
  has(/cursor/i, "custom cursor");
  has(/marquee/i, "marquee / ticker");
  has(/<Canvas|THREE\./, "WebGL / 3D");
  has(/clip-path|clipPath/, "clip-path reveals");
  has(/mix-blend-mode|mixBlendMode/, "blend-mode effects");
  has(/backdrop-filter|backdrop-blur/, "glass / backdrop blur");
  has(/prefers-reduced-motion|useReducedMotion/, "reduced-motion handling");
  has(/next\/image|<Image/, "optimised images");
  has(/cloudinary/i, "Cloudinary delivery");
  return { name: pkg.name || path.basename(dir), dir, found, tokens, fonts, sections, patterns, lines: code.split("\n").length };
}

const all = uniq(roots.flatMap(r => { const a = []; findProjects(path.resolve(r), 3, a); return a; }));
// drop parents of nested projects (e.g. a repo root wrapping a Next app)
const dirs = all.filter(d => !all.some(o => o !== d && o.startsWith(d + path.sep)));
const results = dirs.map(scan).filter(r => r.lines > 50);

const tally = (key) => {
  const c = {};
  for (const r of results) for (const v of (key === "dep" ? Object.values(r.found).flat().map(x => x.slice(0, x.lastIndexOf("@"))) : r[key])) c[v] = (c[v] || 0) + 1;
  return Object.entries(c).sort((a, b) => b[1] - a[1]).map(([k, n]) => `${k} (${n})`).join(", ") || "none";
};

let md = `# Frontend profile\n\nGenerated ${new Date().toISOString().slice(0, 10)} by scripts/scan-projects.mjs from ${results.length} projects.\n\n## Across all projects\n- Libraries: ${tally("dep")}\n- Fonts: ${tally("fonts")}\n- Patterns: ${tally("patterns")}\n\n## Per project\n`;
for (const r of results) {
  md += `\n### ${r.name}\n\`${r.dir}\` (~${r.lines} lines of UI code)\n`;
  for (const [k, v] of Object.entries(r.found)) md += `- ${k}: ${v.join(", ")}\n`;
  if (r.fonts.length) md += `- fonts: ${r.fonts.join(", ")}\n`;
  if (r.patterns.length) md += `- patterns: ${r.patterns.join(", ")}\n`;
  if (r.tokens.length) md += `- colour tokens: ${r.tokens.slice(0, 12).join("; ")}\n`;
  if (r.sections.length) md += `- components: ${r.sections.join(", ")}\n`;
}
md += `\n## Decision log\n_Append design decisions here (what was chosen, why, from which Awwwards reference). The skill reads this to stay consistent._\n`;

// Preserve any existing decision log
if (fs.existsSync(out)) {
  const old = read(out), i = old.indexOf("## Decision log");
  if (i >= 0) md = md.slice(0, md.indexOf("## Decision log")) + old.slice(i);
}
fs.writeFileSync(out, md);
console.log(`Wrote ${out} (${results.length} projects)`);
