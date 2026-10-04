import { readSources } from './lib.mjs';

try {
  if (process.argv.length > 2) throw new Error('Usage: node scripts/validate.mjs');
  const sources = await readSources();
  console.log(`Validated ${sources.length} source(s): ${sources.filter(entry => entry.status === 'stable').length} stable, ${sources.filter(entry => entry.status === 'experimental').length} experimental.`);
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}

