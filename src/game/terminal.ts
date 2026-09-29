// The garage TV's terminal: a tiny command interpreter. Pure logic, so it can be tested; terminal-ui.ts draws it.
import { bike, nav, pipecd, planetread, site } from '../data/site';

export interface Line { text: string; href?: string; external?: boolean; tone?: 'dim' | 'err' | 'ok' }
export type Effect = 'close' | 'clear' | 'night' | 'radio' | 'ride' | { go: string; external?: boolean };
export interface Result { lines: Line[]; effect?: Effect }

const dim = (text: string): Line => ({ text, tone: 'dim' });
const link = (text: string, href: string, external = false): Line => ({ text, href, external });

const SECTIONS = nav.map((n) => ({ key: n.label.toLowerCase().replace(/\s+/g, '-'), label: n.label, href: n.href }));
const EXTRA: Record<string, { href: string; external: boolean }> = {
  github: { href: site.links.github, external: true },
  x: { href: site.links.x, external: true },
  twitter: { href: site.links.x, external: true },
  linkedin: { href: site.links.linkedin, external: true },
  pipecd: { href: pipecd.site, external: true },
  planetread: { href: planetread.url, external: true },
  list: { href: '/list', external: false },
  home: { href: '/?garage', external: false },
};

const HELP: [string, string][] = [
  ['about', 'who is Rahul'],
  ['pipecd', 'the LFX mentorship'],
  ['planetread', 'the subtitle plugins'],
  ['stack', 'tools I use'],
  ['bike', 'the Scrambler 400 X'],
  ['ls', 'every section'],
  ['open <name>', 'go to a section (try: open builds)'],
  ['contact', 'find me'],
  ['night', 'lights on or off'],
  ['radio', 'lo-fi on or off'],
  ['ride', 'take the ride'],
  ['clear', 'wipe the screen'],
  ['exit', 'back to the garage'],
];

export const COMMANDS = ['help', 'about', 'pipecd', 'planetread', 'stack', 'bike', 'ls', 'open', 'contact', 'links', 'night', 'radio', 'ride', 'clear', 'exit'];

export const BOOT: Line[] = [
  dim('RS-OS 1.0 . garage terminal'),
  { text: `hello. I am ${site.shortName}. type "help".` },
];

export function complete(prefix: string): string[] {
  const p = prefix.trim().toLowerCase();
  if (!p) return [];
  const [head, ...rest] = p.split(/\s+/);
  if (rest.length === 0 && !prefix.endsWith(' ')) return COMMANDS.filter((c) => c.startsWith(head));
  if (head === 'open') {
    const arg = rest.join(' ');
    return [...SECTIONS.map((s) => s.key), ...Object.keys(EXTRA)].filter((k) => k.startsWith(arg)).map((k) => `open ${k}`);
  }
  return [];
}

export function run(raw: string): Result {
  const input = raw.trim().toLowerCase().replace(/\s+/g, ' ');
  if (!input) return { lines: [] };
  const [cmd, ...args] = input.split(' ');
  const arg = args.join(' ');

  switch (cmd) {
    case 'help':
    case '?':
      return { lines: HELP.map(([c, d]) => ({ text: `${c.padEnd(13)} ${d}` })) };
    case 'about':
    case 'whoami':
      return { lines: [{ text: site.name }, { text: site.description }, dim(site.tagline), link('more on the about page', '/about')] };
    case 'pipecd':
      return {
        lines: [
          { text: `${pipecd.role}` },
          { text: pipecd.focus },
          link('pipecd.dev', pipecd.site, true),
          link('open source log', '/open-source'),
        ],
      };
    case 'planetread':
      return {
        lines: [{ text: planetread.what }, ...planetread.plugins.map((p) => link(p.name, p.url, true))],
      };
    case 'stack':
      return { lines: [{ text: site.stack.join(', ') }, link('the pegboard', '/about#stack')] };
    case 'bike':
    case 'scrambler':
      return { lines: [{ text: `${bike.colour} ${bike.name}` }, ...bike.specs.slice(0, 3).map(([k, v]) => ({ text: `${k}: ${v}` })), link('the garage page', '/garage')] };
    case 'ls':
    case 'dir':
      return { lines: SECTIONS.map((s) => link(`${s.key.padEnd(12)} ${s.href}`, s.href)) };
    case 'contact':
    case 'links':
      return {
        lines: [
          link(site.email, `mailto:${site.email}`, true),
          link(`x ${site.links.xHandle}`, site.links.x, true),
          link('github', site.links.github, true),
          link('linkedin', site.links.linkedin, true),
        ],
      };
    case 'open':
    case 'cd':
    case 'go': {
      if (!arg) return { lines: [{ text: 'open what? try: open builds', tone: 'err' }] };
      const key = arg.replace(/^\//, '');
      const s = SECTIONS.find((x) => x.key === key);
      if (s) return { lines: [dim(`opening ${s.href}`)], effect: { go: s.href } };
      const e = EXTRA[key];
      if (e) return { lines: [dim(`opening ${e.href}`)], effect: { go: e.href, external: e.external } };
      return { lines: [{ text: `no such place: ${arg}. try "ls".`, tone: 'err' }] };
    }
    case 'night':
    case 'lights':
      return { lines: [dim('click.')], effect: 'night' };
    case 'radio':
    case 'music':
      return { lines: [dim('tuning...')], effect: 'radio' };
    case 'ride':
      return { lines: [dim('kickstand up.')], effect: 'ride' };
    case 'clear':
    case 'cls':
      return { lines: [], effect: 'clear' };
    case 'exit':
    case 'quit':
    case 'q':
      return { lines: [], effect: 'close' };
    case 'sudo':
      return { lines: [{ text: 'nice try. this is a garage, not a server.', tone: 'err' }] };
    case 'rm':
      return { lines: [{ text: 'the bike is not for deleting.', tone: 'err' }] };
    case 'vim':
    case 'emacs':
    case 'nano':
      return { lines: [{ text: 'you can enter. leaving is your problem.', tone: 'ok' }] };
    default:
      return { lines: [{ text: `command not found: ${cmd}. try "help".`, tone: 'err' }] };
  }
}
