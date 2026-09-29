// Share cards: a 1200x630 picture per page, drawn at build time with satori (layout to SVG) and resvg (SVG to PNG).
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';

const require = createRequire(import.meta.url);
const font = (pkg: string, file: string) => readFileSync(require.resolve(`@fontsource/${pkg}/files/${file}`));

type Node = { type: string; props: { style?: Record<string, unknown>; children?: unknown } };
const el = (type: string, style: Record<string, unknown>, children?: unknown): Node => ({ type, props: { style: { display: 'flex', ...style }, children } });

export async function card(kicker: string, title: string, sub: string): Promise<Buffer> {
  const tree = el('div', { width: 1200, height: 630, background: '#1b1712', color: '#fff6e0', padding: 64, flexDirection: 'column', justifyContent: 'space-between', borderBottom: '16px solid #e8b923' }, [
    el('div', { fontFamily: 'Silkscreen', fontSize: 30, color: '#e8b923', letterSpacing: 3 }, kicker.toUpperCase()),
    el('div', { flexDirection: 'column' }, [
      el('div', { fontFamily: 'Plex', fontWeight: 700, fontSize: title.length > 26 ? 72 : 96, lineHeight: 1.05, marginBottom: 24 }, title),
      el('div', { fontFamily: 'Plex', fontSize: 38, color: '#c9bfa8', lineHeight: 1.3 }, sub),
    ]),
    el('div', { fontFamily: 'Silkscreen', fontSize: 26, color: '#a89d8b' }, "RAHUL SHENDRE  ·  RAHUL'S GARAGE"),
  ]);
  const svg = await satori(tree as never, {
    width: 1200,
    height: 630,
    fonts: [
      { name: 'Plex', data: font('ibm-plex-sans', 'ibm-plex-sans-latin-400-normal.woff'), weight: 400, style: 'normal' },
      { name: 'Plex', data: font('ibm-plex-sans', 'ibm-plex-sans-latin-700-normal.woff'), weight: 700, style: 'normal' },
      { name: 'Silkscreen', data: font('silkscreen', 'silkscreen-latin-400-normal.woff'), weight: 400, style: 'normal' },
    ],
  });
  return Buffer.from(new Resvg(svg).render().asPng());
}
