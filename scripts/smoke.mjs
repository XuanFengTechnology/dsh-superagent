import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Store, SettingsSchema, Engine, record } from '../lib/extension.js';
import { Config } from '../lib/index.js';
const directory = mkdtempSync(join(tmpdir(), 'superagent-smoke-'));
let store;
try {
  Config({ stateDir: directory, standalone: true });
  store = new Store(join(directory, 'orchestrator.sqlite'));
  store.saveSettings(SettingsSchema.parse({}));
  store.set(record('smoke'), 'persisted');
  store.close(); store = new Store(join(directory, 'orchestrator.sqlite'));
  if (store.get(record('smoke')) !== 'persisted' || typeof Engine !== 'function') throw new Error('Runtime smoke failed');
  console.log(JSON.stringify({ smoke: 'passed', node: process.version, platform: process.platform, arch: process.arch }));
} finally { store?.close(); rmSync(directory, { recursive: true, force: true }); }
