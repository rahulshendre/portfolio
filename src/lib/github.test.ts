import { describe, expect, it } from 'vitest';
import { countByState, firstPrDate, ownRepos, prsFor, type PR, type Repo } from './github';

const pr = (repo: string, state: string, createdAt: string): PR => ({ repo, state, createdAt, number: 1, title: 't', url: 'u' });

describe('github helpers', () => {
  const prs = [
    pr('pipe-cd/pipecd', 'merged', '2026-02-01'),
    pr('pipe-cd/examples', 'merged', '2026-03-01'),
    pr('pipe-cd/pipecd', 'open', '2026-01-01'),
    pr('kubestellar/ui', 'merged', '2025-12-01'),
  ];

  it('scopes by org or exact repo', () => {
    expect(prsFor('pipe-cd', prs)).toHaveLength(3);
    expect(prsFor('pipe-cd/pipecd', prs)).toHaveLength(2);
  });

  it('counts states', () => {
    expect(countByState(prsFor('pipe-cd', prs))).toEqual({ total: 3, merged: 2, open: 1 });
  });

  it('finds the first PR date per repo', () => {
    expect(firstPrDate('pipe-cd/pipecd', prs)).toBe('2026-01-01');
    expect(firstPrDate('nope/nope', prs)).toBeUndefined();
  });

  it('lists own repos without forks, the profile repo or excluded names', () => {
    const r = (name: string, fork = false) => ({ name, fork }) as Repo;
    const out = ownRepos(['Saytask'], [r('saytask'), r('pipecd', true), r('rahulshendre'), r('undark')]);
    expect(out.map((x) => x.name)).toEqual(['undark']);
  });
});

describe('externalPrs', () => {
  it('drops PRs to his own repos', async () => {
    const { externalPrs } = await import('./github');
    const own = { repo: 'rahulshendre/undark', state: 'merged', createdAt: '2026-01-01', number: 1, title: 't', url: 'u' };
    const ext = { ...own, repo: 'pipe-cd/pipecd' };
    expect(externalPrs([own, ext])).toEqual([ext]);
  });
});
