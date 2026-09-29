import type { APIRoute, GetStaticPaths } from 'astro';
import { getCollection } from 'astro:content';
import { CARDS } from '../../lib/cards';
import { card } from '../../lib/og';

export const getStaticPaths: GetStaticPaths = async () => {
  const builds = await getCollection('builds', (b) => b.data.problem || b.data.decision || b.data.result);
  return [
    ...Object.entries(CARDS).map(([path, c]) => ({ params: { slug: path.slice(1) }, props: { kicker: 'Portfolio', ...c } })),
    ...builds.map((b) => ({ params: { slug: `builds/${b.id}` }, props: { kicker: 'Case study', title: b.data.title, sub: b.data.summary } })),
  ];
};

export const GET: APIRoute = async ({ props }) => {
  const { kicker, title, sub } = props as { kicker: string; title: string; sub: string };
  return new Response(new Uint8Array(await card(kicker, title, sub)), { headers: { 'Content-Type': 'image/png' } });
};
