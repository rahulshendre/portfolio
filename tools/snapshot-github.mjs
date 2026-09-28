// Refreshes src/data/github.json from the GitHub API through the gh CLI.
// Usage: pnpm snapshot   (needs `gh auth login` once)
import { execFileSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';

const USER = 'rahulshendre';
const gh = (...args) => JSON.parse(execFileSync('gh', args, { encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 }));
const search = (...extra) =>
  gh('search', 'prs', '--author', USER, '--limit', '500', '--json', 'repository,title,state,createdAt,url,number', ...extra);

const profile = gh('api', `users/${USER}`);
const repos = gh('api', '--paginate', '--slurp', `users/${USER}/repos?per_page=100`).flat();
const allPrs = search();
const mergedUrls = new Set(search('--merged').map((p) => p.url));

const prs = allPrs
  .map((p) => ({
    repo: p.repository.nameWithOwner,
    number: p.number,
    title: p.title.trim(),
    url: p.url,
    createdAt: p.createdAt,
    state: mergedUrls.has(p.url) ? 'merged' : p.state,
  }))
  .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

const prCounts = {};
for (const p of prs) {
  const c = (prCounts[p.repo] ??= { total: 0, merged: 0, open: 0 });
  c.total++;
  if (p.state === 'merged') c.merged++;
  if (p.state === 'open') c.open++;
}

const out = {
  generatedAt: new Date().toISOString(),
  profile: {
    login: profile.login,
    name: profile.name,
    bio: profile.bio,
    location: profile.location,
    followers: profile.followers,
    publicRepos: profile.public_repos,
    createdAt: profile.created_at,
    twitter: profile.twitter_username,
  },
  repos: repos
    .map((r) => ({
      name: r.name,
      description: r.description,
      language: r.language,
      fork: r.fork,
      stars: r.stargazers_count,
      pushedAt: r.pushed_at,
      url: r.html_url,
    }))
    .sort((a, b) => b.pushedAt.localeCompare(a.pushedAt)),
  prs,
  prCounts,
};

writeFileSync(new URL('../src/data/github.json', import.meta.url), JSON.stringify(out, null, 2) + '\n');
console.log(`repos ${out.repos.length}, prs ${prs.length}, pipecd merged ${prCounts['pipe-cd/pipecd']?.merged ?? 0}`);
