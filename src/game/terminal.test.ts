import { describe, expect, it } from 'vitest';
import { COMMANDS, complete, run } from './terminal';
import { nav } from '../data/site';

describe('terminal', () => {
  it('ignores empty input', () => expect(run('   ')).toEqual({ lines: [] }));

  it('lists every command in help', () => {
    const help = run('help').lines.map((l) => l.text).join('\n');
    for (const c of ['about', 'pipecd', 'ls', 'open', 'night', 'radio', 'clear', 'exit']) expect(help).toContain(c);
  });

  it('is case and space tolerant', () => {
    expect(run('  OPEN   Builds ').effect).toEqual({ go: '/builds' });
  });

  it('opens every nav section', () => {
    for (const n of nav) expect(run(`open ${n.label.toLowerCase().replace(/\s+/g, '-')}`).effect, n.href).toEqual({ go: n.href });
  });

  it('marks outside links as external', () => {
    expect(run('open github').effect).toMatchObject({ external: true });
  });

  it('errors on unknown commands and places', () => {
    expect(run('flarp').lines[0].tone).toBe('err');
    expect(run('open nowhere').lines[0].tone).toBe('err');
    expect(run('open').lines[0].tone).toBe('err');
  });

  it('routes UI effects', () => {
    expect(run('night').effect).toBe('night');
    expect(run('radio').effect).toBe('radio');
    expect(run('ride').effect).toBe('ride');
    expect(run('clear').effect).toBe('clear');
    expect(run('exit').effect).toBe('close');
  });

  it('completes commands and open targets', () => {
    expect(complete('pi')).toEqual(['pipecd']);
    expect(complete('open bu')).toEqual(['open builds']);
    expect(complete('')).toEqual([]);
    for (const c of COMMANDS) expect(complete(c)).toContain(c);
  });
});
