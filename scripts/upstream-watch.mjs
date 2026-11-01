import { readFileSync } from 'node:fs';
const lock = JSON.parse(readFileSync(new URL('../upstream.json', import.meta.url), 'utf8'));
const repository = process.env.GITHUB_REPOSITORY;
if (repository !== 'XuanFengTechnology/dsh-superagent') throw new Error('Run only in the maintained fork');
const token = process.env.GITHUB_TOKEN;
if (!token) throw new Error('GITHUB_TOKEN required');
async function api(path, body) {
  const response = await fetch(`https://api.github.com${path}`, { method: body ? 'POST' : 'GET', headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28', ...(body ? { 'Content-Type': 'application/json' } : {}) }, ...(body ? { body: JSON.stringify(body) } : {}) });
  if (!response.ok) throw new Error(`GitHub request failed (${response.status})`);
  return response.json();
}
const head = await api(`/repos/${lock.repository}/commits/${lock.branch}`);
const npm = await fetch('https://registry.npmjs.org/@deepseek-ai%2Fdsh/latest');
if (!npm.ok) throw new Error(`Registry request failed (${npm.status})`);
const { version } = await npm.json();
const changes = [];
if (head.sha !== lock.commit) changes.push(`Upstream commit: ${lock.commit} → ${head.sha}.\nCompare: https://github.com/${lock.repository}/compare/${lock.commit}...${head.sha}`);
if (version !== lock.dsh) changes.push(`DSH latest: ${lock.dsh} → ${version}.`);
if (!changes.length) { console.log('No upstream changes.'); process.exit(0); }
const marker = `<!-- upstream:${head.sha};dsh:${version} -->`;
// Closed proposals remain deduplicated until maintainers intentionally advance the lock.
for (let page = 1; ; page++) {
  const issues = await api(`/repos/${repository}/issues?state=all&per_page=100&page=${page}`);
  if (issues.some(issue => issue.body?.includes(marker))) { console.log('Update proposal already recorded.'); process.exit(0); }
  if (issues.length < 100) break;
}
const issue = await api(`/repos/${repository}/issues`, { title: `Upstream review: ${head.sha.slice(0, 8)}, DSH ${version}`, body: `${marker}\n${changes.join('\n\n')}\n\nReview and merge upstream in an isolated branch, update upstream.json only after review, and run the platform matrix. No automatic merge, release or employee deployment. Check database migration and rollback compatibility before release.` });
console.log(`Created update proposal ${issue.html_url}`);
