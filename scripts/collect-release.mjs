import { readFileSync, readdirSync, mkdirSync, copyFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
const targets = ['windows-amd64', 'linux-amd64', 'linux-arm64', 'macos-amd64', 'macos-arm64'];
mkdirSync('.artifacts/publish', { recursive: true });
const manifests = [];
for (const target of targets) {
  const dir = `.artifacts/platforms/plugin-${target}`;
  const manifest = JSON.parse(readFileSync(`${dir}/manifest-${target}.json`, 'utf8'));
  const bytes = readFileSync(`${dir}/${manifest.filename}`);
  if (manifest.target !== target || createHash('sha256').update(bytes).digest('hex') !== manifest.sha256 || bytes.length !== manifest.size) throw new Error(`Artifact mismatch: ${target}`);
  const filename = `dsh-superagent-${manifest.version}-${target}.tgz`;
  copyFileSync(`${dir}/${manifest.filename}`, `.artifacts/publish/${filename}`);
  manifests.push({ ...manifest, filename });
}
if (new Set(manifests.map(m => `${m.version}:${m.source_commit}:${m.dsh}:${m.upstream_commit}`)).size !== 1) throw new Error('Mixed release versions');
writeFileSync('.artifacts/publish/manifest.json', JSON.stringify({ schema_version: 1, version: manifests[0].version, artifacts: manifests }, null, 2) + '\n');
writeFileSync('.artifacts/publish/SHA256SUMS', readdirSync('.artifacts/publish').filter(name => name !== 'SHA256SUMS').sort().map(name => `${createHash('sha256').update(readFileSync(`.artifacts/publish/${name}`)).digest('hex')}  ${name}`).join('\n') + '\n');
