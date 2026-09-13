#!/usr/bin/env node
/**
 * validate-graph.mjs — the build is the editor.
 *
 * FATAL (exit 1, nothing ships):
 *  - unresolvable /e/<id> link in any Markdown (src/content/**, docs/** excluded)
 *  - duplicate entity ids
 *  - alias colliding with another entity's id or alias
 *  - relation type outside the vocabulary
 *  - relation endpoint pointing at an unknown entity
 *  - `end` before `start` (entities + relations)
 *  - `critiques` / `funds` edge with no source
 *
 * WARNINGS (non-fatal — this output is the research backlog):
 *  - orphan entities (no edges at all)
 *  - entities still in draft
 *  - entities with no prose body
 *  - count of unsourced edges
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import yaml from 'yaml';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ENTITIES_DIR = path.join(ROOT, 'src', 'data', 'entities');
const RELATIONS_FILE = path.join(ROOT, 'src', 'data', 'relations.yaml');
const REL_TYPES_FILE = path.join(ROOT, 'src', 'data', 'relation-types.yaml');
const BODIES_DIR = path.join(ROOT, 'src', 'content', 'entities');
const ARTICLES_DIR = path.join(ROOT, 'src', 'content', 'articles');

const errors = [];
const warnings = [];
const fail = (msg) => errors.push(msg);
const warn = (msg) => warnings.push(msg);

// ---------- load ----------
function loadYamlDir(dir) {
  const items = [];
  if (!fs.existsSync(dir)) return items;
  for (const f of fs.readdirSync(dir).filter((f) => f.endsWith('.yaml') || f.endsWith('.yml'))) {
    const parsed = yaml.parse(fs.readFileSync(path.join(dir, f), 'utf-8'));
    if (Array.isArray(parsed)) items.push(...parsed);
    else if (parsed && typeof parsed === 'object') items.push(parsed);
  }
  return items;
}

const entities = loadYamlDir(ENTITIES_DIR);
const relations = fs.existsSync(RELATIONS_FILE)
  ? (yaml.parse(fs.readFileSync(RELATIONS_FILE, 'utf-8')) ?? [])
  : [];
const relTypesRaw = fs.existsSync(REL_TYPES_FILE)
  ? (yaml.parse(fs.readFileSync(REL_TYPES_FILE, 'utf-8')) ?? {})
  : {};

// Vocabulary: { institutional: [{id,...}], ... } -> Set of type ids
const vocab = new Set();
for (const cat of Object.values(relTypesRaw)) {
  if (Array.isArray(cat)) for (const t of cat) if (t?.id) vocab.add(t.id);
}

const ids = new Set();
const aliasToId = new Map();

// ---------- entity checks ----------
for (const e of entities) {
  if (!e?.id) { fail('Entity missing id: ' + JSON.stringify(e)?.slice(0, 80)); continue; }
  if (ids.has(e.id)) fail(`Duplicate entity id: ${e.id}`);
  ids.add(e.id);
  if (!e.short) fail(`Entity ${e.id} missing required 'short'`);
  for (const a of e.aliases ?? []) {
    if (ids.has(a)) fail(`Alias "${a}" of ${e.id} collides with an entity id`);
    if (aliasToId.has(a) && aliasToId.get(a) !== e.id) {
      fail(`Alias "${a}" of ${e.id} collides with alias of ${aliasToId.get(a)}`);
    }
    aliasToId.set(a, e.id);
  }
  // end before start
  const s = e.dates?.start, en = e.dates?.end;
  if (s && en && String(en) < String(s)) fail(`Entity ${e.id}: end (${en}) before start (${s})`);
}

// ---------- relation checks ----------
const CONTENTIOUS = new Set(['critiques', 'funds']);
relations.forEach((r, i) => {
  const tag = `Relation #${i} (${r?.from} --${r?.type}--> ${r?.to})`;
  if (!r?.from || !r?.to || !r?.type) { fail(`${tag} missing from/to/type`); return; }
  if (!vocab.has(r.type)) fail(`${tag}: unknown relation type "${r.type}"`);
  if (!ids.has(r.from)) fail(`${tag}: unknown endpoint "${r.from}"`);
  if (!ids.has(r.to)) fail(`${tag}: unknown endpoint "${r.to}"`);
  if (r.start && r.end && String(r.end) < String(r.start)) {
    fail(`${tag}: end (${r.end}) before start (${r.start})`);
  }
  if (CONTENTIOUS.has(r.type) && (!r.sources || r.sources.length === 0)) {
    fail(`${tag}: contentious type "${r.type}" requires a source`);
  }
});

// ---------- markdown /e/ link checks ----------
function* walkMd(dir) {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) yield* walkMd(p);
    else if (entry.name.endsWith('.md')) yield p;
  }
}

// Matches [label](/e/<id>), [label](/e/<id>/panel), and <a href="/e/<id>...">
const MD_LINK = /\]\(\/e\/([a-z0-9-]+)(?:\/panel)?\/?(?:[?#][^)]*)?\)/g;
const HTML_LINK = /href="\/e\/([a-z0-9-]+)(?:\/panel)?\/?(?:[?#][^"]*)?"/g;

const linkedIds = new Set();
for (const dir of [BODIES_DIR, ARTICLES_DIR]) {
  for (const file of walkMd(dir)) {
    const text = fs.readFileSync(file, 'utf-8');
    const rel = path.relative(ROOT, file);
    for (const re of [MD_LINK, HTML_LINK]) {
      re.lastIndex = 0;
      let m;
      while ((m = re.exec(text)) !== null) {
        linkedIds.add(m[1]);
        if (!ids.has(m[1])) fail(`${rel}: unresolvable /e/${m[1]} link`);
      }
    }
  }
}

// ---------- warnings (research backlog) ----------
const touchedByEdge = new Set();
for (const r of relations) { touchedByEdge.add(r.from); touchedByEdge.add(r.to); }

let unsourced = 0;
for (const r of relations) if (!r.sources || r.sources.length === 0) unsourced++;

for (const e of entities) {
  const hasEdges = touchedByEdge.has(e.id);
  const hasLinks = linkedIds.has(e.id);
  if (!hasEdges && !hasLinks) warn(`Orphan: ${e.id} (no edges, no inbound links)`);
  if (e.status === 'draft' || !e.status) warn(`Draft: ${e.id}`);
  if (!fs.existsSync(path.join(BODIES_DIR, `${e.id}.md`))) warn(`No prose body: ${e.id}`);
}
if (unsourced > 0) warn(`${unsourced} unsourced edge(s)`);

// ---------- report ----------
console.log(`\nvalidate-graph: ${entities.length} entities, ${relations.length} relations`);
if (warnings.length) {
  console.log(`\nWarnings (${warnings.length}) — research backlog:`);
  for (const w of warnings) console.log(`  ~ ${w}`);
}
if (errors.length) {
  console.error(`\nFATAL (${errors.length}):`);
  for (const e of errors) console.error(`  ✗ ${e}`);
  console.error('\nBuild blocked. Fix the above.\n');
  process.exit(1);
}
console.log('\n✓ graph valid — build may proceed.\n');
