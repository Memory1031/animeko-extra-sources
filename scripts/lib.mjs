import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const repositoryRoot = fileURLToPath(new URL('../', import.meta.url));

function object(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

export function assertSource(source, file) {
  const require = (condition, message) => {
    if (!condition) throw new Error(`${file}: ${message}`);
  };
  require(object(source), 'expected a source object');
  require(source.factoryId === 'web-selector', 'factoryId must be web-selector');
  require(source.version === 2, 'version must be 2');
  require(object(source.arguments), 'arguments must be an object');
  require(typeof source.arguments.name === 'string' && source.arguments.name.trim().length > 0,
    'arguments.name must be a non-empty string');
  require(Number.isInteger(source.arguments.tier) && source.arguments.tier >= 0,
    'arguments.tier must be a non-negative integer');
  require(object(source.arguments.searchConfig), 'arguments.searchConfig must be an object');
}

async function readJson(file) {
  try {
    return JSON.parse(await readFile(file, 'utf8'));
  } catch (error) {
    throw new Error(`${file}: ${error.message}`);
  }
}

async function discoverJson(directory, prefix = 'web') {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const relative = `${prefix}/${entry.name}`;
    if (entry.isSymbolicLink()) throw new Error(`${relative}: source symlinks are unsupported`);
    if (entry.isDirectory()) {
      files.push(...await discoverJson(path.join(directory, entry.name), relative));
    } else if (entry.isFile() && entry.name.endsWith('.json')) {
      files.push(relative);
    }
  }
  return files.sort();
}

export async function readSources(root = repositoryRoot) {
  const sourceDirectory = path.join(root, 'sources');
  const catalog = await readJson(path.join(sourceDirectory, 'catalog.json'));
  if (!object(catalog) || !Array.isArray(catalog.sources)) {
    throw new Error('sources/catalog.json: expected a sources array');
  }
  const files = new Set(await discoverJson(path.join(sourceDirectory, 'web')));
  const paths = new Set();
  const names = new Set();
  const sources = [];
  for (const entry of catalog.sources) {
    if (!object(entry) || typeof entry.path !== 'string' || !entry.path.startsWith('web/') ||
        !entry.path.endsWith('.json') || entry.path.includes('\\') ||
        entry.path.split('/').some(part => !part || part === '.' || part === '..')) {
      throw new Error('sources/catalog.json: each path must be a relative web/**/*.json path');
    }
    if (!['stable', 'experimental'].includes(entry.status)) {
      throw new Error(`${entry.path}: status must be stable or experimental`);
    }
    if (paths.has(entry.path)) throw new Error(`${entry.path}: duplicate catalog path`);
    if (!files.has(entry.path)) throw new Error(`${entry.path}: catalog references a missing source`);
    paths.add(entry.path);
    const source = await readJson(path.join(sourceDirectory, entry.path));
    assertSource(source, entry.path);
    const name = source.arguments.name.trim();
    if (names.has(name)) throw new Error(`${entry.path}: duplicate source name ${name}`);
    names.add(name);
    sources.push({ ...entry, source });
  }
  const unlisted = [...files].filter(file => !paths.has(file));
  if (unlisted.length) throw new Error(`sources/catalog.json: unlisted sources: ${unlisted.join(', ')}`);
  return sources.sort((a, b) => a.source.arguments.tier - b.source.arguments.tier ||
    (a.path < b.path ? -1 : a.path > b.path ? 1 : 0));
}

export function buildSubscriptions(entries) {
  const encode = list => JSON.stringify({
    exportedMediaSourceDataList: { mediaSources: list.map(entry => entry.source) },
  }, null, 2) + '\n';
  return {
    'dev.json': encode(entries),
    'web.json': encode(entries.filter(entry => entry.status === 'stable')),
  };
}

