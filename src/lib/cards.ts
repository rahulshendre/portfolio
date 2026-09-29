// The pages that have their own share card, and what each card says.
/** Pages that get their own card (path to what the card says). Anything else falls back to /og.png. */
export const CARDS: Record<string, { title: string; sub: string }> = {
  '/about': { title: 'About', sub: 'CS student in Pune. PipeCD mentee. Scrambler rider.' },
  '/builds': { title: 'Things I built', sub: 'Plugins, an app with 10k+ downloads, and Go tooling.' },
  '/open-source': { title: 'Open source', sub: 'PipeCD (CNCF): the v1 plugin tutorial, docs and examples.' },
  '/planetread': { title: 'PlanetRead', sub: 'Premiere Pro subtitle plugins and the BookBox app.' },
  '/garage': { title: 'The garage', sub: 'A white Triumph Scrambler 400 X: specs, rides and gear.' },
  '/writing': { title: 'Writing', sub: 'Technical writing on PipeCD, Kubernetes and DevOps.' },
  '/videos': { title: 'Videos', sub: 'Kubernetes, DevOps and PipeCD. Starting October 2026.' },
  '/resume': { title: 'Resume', sub: 'LFX 2026 mentee on PipeCD. Go, TypeScript, Kubernetes.' },
  '/list': { title: 'Everything', sub: 'Builds, open source, videos, the bike, writing and about.' },
};
