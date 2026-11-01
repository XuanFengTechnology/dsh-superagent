import { spawnSync } from 'node:child_process';
// Upstream deployment/environment/service tests execute POSIX scripts and need a Unix host.
const excluded = process.platform === 'win32' ? ['tests/deployment.spec.ts', 'tests/environment.spec.ts', 'tests/service-script.spec.ts'] : [];
console.log(JSON.stringify({ platform: process.platform, excluded_posix_fixtures: excluded }));
const run = spawnSync(process.execPath, ['node_modules/vitest/vitest.mjs', 'run', '--maxWorkers', '4', ...excluded.flatMap(file => ['--exclude', file])], { stdio: 'inherit', windowsHide: true });
process.exit(run.status ?? 1);
