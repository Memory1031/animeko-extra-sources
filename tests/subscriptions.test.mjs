import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, rm, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { execFileSync, spawnSync } from 'node:child_process';
import { assertSource, buildSubscriptions, readSources, repositoryRoot } from '../scripts/lib.mjs';

const source = (name, tier = 3) => ({
  factoryId: 'web-selector', version: 2, arguments: { name, tier, searchConfig: {} },
});
const sourceList = text => JSON.parse(text).exportedMediaSourceDataList.mediaSources;

async function cleanFixture(root) {
  const resolved = path.resolve(root);
  if (path.dirname(resolved) !== path.resolve(tmpdir()) ||
      !path.basename(resolved).startsWith('animeko-extra-sources-')) {
    throw new Error(`Refusing to remove unexpected test directory: ${resolved}`);
  }
  await rm(resolved, { recursive: true, force: true });
}

async function fixture(t, entries, files) {
  const root = await mkdtemp(path.join(tmpdir(), 'animeko-extra-sources-'));
  t.after(() => cleanFixture(root));
  await mkdir(path.join(root, 'sources/web/nested'), { recursive: true });
  await writeFile(path.join(root, 'sources/catalog.json'), JSON.stringify({ sources: entries }));
  for (const [file, value] of Object.entries(files)) {
    await writeFile(path.join(root, 'sources', file), typeof value === 'string' ? value : JSON.stringify(value));
  }
  return root;
}

test('dev includes all sources; web only includes explicitly stable sources', async t => {
  const root = await fixture(t, [
    { path: 'web/nested/z.json', status: 'experimental' },
    { path: 'web/a.json', status: 'stable' },
  ], { 'web/nested/z.json': source('Experimental'), 'web/a.json': source('Stable', 1) });
  const output = buildSubscriptions(await readSources(root));
  assert.deepEqual(sourceList(output['dev.json']).map(item => item.arguments.name), ['Stable', 'Experimental']);
  assert.deepEqual(sourceList(output['web.json']).map(item => item.arguments.name), ['Stable']);
  assert.equal('status' in sourceList(output['dev.json'])[0], false);
});

test('empty catalog produces valid empty subscriptions', async t => {
  const root = await fixture(t, [], {});
  const output = buildSubscriptions(await readSources(root));
  assert.deepEqual(sourceList(output['dev.json']), []);
  assert.deepEqual(sourceList(output['web.json']), []);
});

test('invalid source fields are rejected before building subscriptions', () => {
  for (const value of [null, [], { ...source('x'), factoryId: 'other' },
    { ...source('x'), version: 1 }, { ...source('x'), arguments: null }, source(''),
    source('x', -1), source('x', '3')]) {
    assert.throws(() => assertSource(value, 'invalid.json'), /invalid.json:/);
  }
});

test('malformed JSON and uncatalogued sources cannot silently enter a subscription', async t => {
  const broken = await fixture(t, [{ path: 'web/a.json', status: 'experimental' }], { 'web/a.json': '{' });
  await assert.rejects(readSources(broken), /a\.json:/);
  const unlisted = await fixture(t, [], { 'web/a.json': source('Unlisted') });
  await assert.rejects(readSources(unlisted), /unlisted sources/);
});

test('missing, duplicate, unknown-status and escaping catalog entries are rejected', async t => {
  const entry = { path: 'web/a.json', status: 'experimental' };
  for (const [entries, pattern] of [
    [[{ path: 'web/missing.json', status: 'stable' }], /missing source/],
    [[entry, entry], /duplicate catalog path/],
    [[{ ...entry, status: 'stabel' }], /status must/],
    [[{ path: 'web/../secret.json', status: 'stable' }], /relative web/],
  ]) {
    const root = await fixture(t, entries, { 'web/a.json': source('A') });
    await assert.rejects(readSources(root), pattern);
  }
});

test('duplicate names are rejected to preserve subscription update identity', async t => {
  const root = await fixture(t, [
    { path: 'web/a.json', status: 'experimental' }, { path: 'web/b.json', status: 'stable' },
  ], { 'web/a.json': source('Same'), 'web/b.json': source('Same') });
  await assert.rejects(readSources(root), /duplicate source name/);
});

test('--check fails on stale artifacts without overwriting them', async t => {
  const root = await mkdtemp(path.join(tmpdir(), 'animeko-extra-sources-cli-'));
  t.after(() => cleanFixture(root));
  await mkdir(path.join(root, 'scripts'), { recursive: true });
  await mkdir(path.join(root, 'sources/web'), { recursive: true });
  await mkdir(path.join(root, 'subscriptions'), { recursive: true });
  for (const name of ['lib.mjs', 'build-subscriptions.mjs']) {
    await writeFile(path.join(root, 'scripts', name), await readFile(path.join(repositoryRoot, 'scripts', name)));
  }
  await writeFile(path.join(root, 'sources/catalog.json'), '{"sources":[]}');
  const script = path.join(root, 'scripts/build-subscriptions.mjs');
  const run = args => spawnSync(process.execPath, [script, ...args], { encoding: 'utf8' });
  assert.equal(run(['--check']).status, 1);
  execFileSync(process.execPath, [script]);
  assert.equal(run(['--check']).status, 0);
  await writeFile(path.join(root, 'subscriptions/dev.json'), 'stale\n');
  assert.equal(run(['--check']).status, 1);
  assert.equal(await readFile(path.join(root, 'subscriptions/dev.json'), 'utf8'), 'stale\n');
});
