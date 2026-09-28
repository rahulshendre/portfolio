import data from '../data/github.json';

export type PR = (typeof data.prs)[number];
export type Repo = (typeof data.repos)[number];

export const snapshotDate = new Date(data.generatedAt);

/** PRs whose repo is in the given org (e.g. "pipe-cd") or exact repo ("pipe-cd/pipecd"). */
export function prsFor(scope: string, prs: PR[] = data.prs): PR[] {
  return prs.filter((p) => (scope.includes('/') ? p.repo === scope : p.repo.startsWith(scope + '/')));
}

/** PRs to other people's projects (drops his own repos and forks). */
export const externalPrs = (prs: PR[] = data.prs) => prs.filter((p) => !p.repo.startsWith(data.profile.login + '/'));

export function countByState(prs: PR[]) {
  return {
    total: prs.length,
    merged: prs.filter((p) => p.state === 'merged').length,
    open: prs.filter((p) => p.state === 'open').length,
  };
}

/** Earliest PR date per repo, used for the "how I got here" timeline. */
export function firstPrDate(repo: string, prs: PR[] = data.prs): string | undefined {
  return prs
    .filter((p) => p.repo === repo)
    .map((p) => p.createdAt)
    .sort()[0];
}

/** Own (non-fork) repos, newest push first, minus the ones in `exclude`. */
export function ownRepos(exclude: string[] = [], repos: Repo[] = data.repos): Repo[] {
  const skip = new Set(exclude.map((n) => n.toLowerCase()));
  return repos.filter((r) => !r.fork && !skip.has(r.name.toLowerCase()) && r.name !== 'rahulshendre');
}

export const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

export { data as github };
