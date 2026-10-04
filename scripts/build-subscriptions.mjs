import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { buildSubscriptions, readSources, repositoryRoot } from './lib.mjs';

try {
  const args = process.argv.slice(2);
  if (args.length > 1 || args.some(arg => arg !== '--check')) {
    throw new Error('Usage: node scripts/build-subscriptions.mjs [--check]');
  }
  const check = args.includes('--check');
  const generated = buildSubscriptions(await readSources());
  const directory = path.join(repositoryRoot, 'subscriptions');
  const stale = [];
  if (!check) await mkdir(directory, { recursive: true });
  for (const [name, expected] of Object.entries(generated)) {
    const file = path.join(directory, name);
    if (check) {
      let actual;
      try {
        actual = await readFile(file, 'utf8');
      } catch (error) {
        if (error.code !== 'ENOENT') throw error;
      }
      if (actual !== expected) stale.push(`subscriptions/${name}`);
    } else {
      await writeFile(file, expected, 'utf8');
      console.log(`Generated subscriptions/${name}`);
    }
  }
  if (stale.length) {
    throw new Error(`Stale or missing build outputs: ${stale.join(', ')}. Run node scripts/build-subscriptions.mjs.`);
  }
  if (check) console.log('Subscription outputs are up to date.');
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}

