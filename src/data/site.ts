// Facts about Rahul used across the site. Everything here is real (sourced from his GitHub,
// his profile README, pipecd.dev and Triumph). Anything unknown is marked TODO so it shows.

export const site = {
  name: 'Rahul Shendre',
  shortName: 'Rahul',
  tagline: 'I write the docs that ship the deploys.',
  description:
    'CS student in Pune. LFX 2026 mentee on PipeCD, a CNCF project. Open source, Kubernetes, Go, and a white Triumph Scrambler 400X.',
  location: 'Pune, India',
  email: 'rahulshendre789@gmail.com',
  links: {
    github: 'https://github.com/rahulshendre',
    x: 'https://x.com/shendreee',
    xHandle: '@shendreee',
    linkedin: 'https://www.linkedin.com/in/rahul-shendre',
  },
  stack: ['Go', 'TypeScript', 'React / React Native', 'Kubernetes', 'Docker', 'GitHub Actions', 'Python', 'C / C++'],
  personal: ['Finance nerd', '100 push-ups in one go', 'Good coffee', 'Rides a white Scrambler 400X'],
} as const;

export const nav = [
  { href: '/builds', label: 'Builds' },
  { href: '/open-source', label: 'Open Source' },
  { href: '/videos', label: 'Videos' },
  { href: '/garage', label: 'Garage' },
  { href: '/writing', label: 'Writing' },
  { href: '/about', label: 'About' },
  { href: '/resume', label: 'Resume' },
] as const;

export const pipecd = {
  role: 'LFX Mentee 2026',
  focus: 'Plugin development, v1 docs, developer experience and adoption',
  repo: 'https://github.com/pipe-cd/pipecd',
  site: 'https://pipecd.dev',
  cncf: 'https://www.cncf.io/projects/pipecd/',
  kubecon: {
    title: 'PipeCD booth at KubeCon India 2026',
    url: 'https://pipecd.dev/blog/2026/07/14/pipecd-at-kubecon-india-2026/',
  },
  gsoc: {
    title: 'cloudrun-mvp: proof of work for a GSoC 2026 proposal, a Cloud Run plugin for PipeCD v1',
    url: 'https://github.com/rahulshendre/cloudrun-mvp',
    issue: 'https://github.com/pipe-cd/pipecd/issues/6114',
  },
  highlights: [
    'Wrote the PipeCD v1 plugin tutorial, chapters 1 to 9: setup, config types, lifecycle methods, sync stages, DIFF, SYNC and ROLLBACK, wiring main.go with Piped',
    'Expanded the v1 plugin docs: Kubernetes, Terraform and Analysis plugins, stage plugins (wait, wait-approval, script-run), plugins overview',
    'Split pipe-cd/examples into v0 and v1 and added v1 Kubernetes examples (simple, bluegreen, wait-approval, helm local chart)',
    'Added the v1 Application Configuration Reference and user guide pages (deployment trace, secret management, drift detection, rollbacks)',
    'Moved docs and examples from gcr.io images to ghcr.io',
  ],
};

// Other CNCF / community projects he has shipped PRs to. Keys match src/data/github.json repo names.
export const otherProjects = [
  { repo: 'kubestellar/kubestellar', name: 'KubeStellar', blurb: 'Multi-cluster configuration management (CNCF sandbox).' },
  { repo: 'kubestellar/ui', name: 'KubeStellar UI', blurb: "KubeStellar's web interface." },
  { repo: 'kubestellar/docs', name: 'KubeStellar docs', blurb: 'Documentation site.' },
  { repo: 'llaske/sugarizer', name: 'Sugarizer', blurb: 'Sugar Labs learning platform that runs in any browser.' },
  { repo: 'sugarlabs/sugar-toolkit-gtk3', name: 'Sugar toolkit', blurb: 'Sugar Learning Environment activity toolkit.' },
  { repo: 'meshery/meshery', name: 'Meshery', blurb: 'The cloud native manager (CNCF).' },
  { repo: 'antiwork/gumroad', name: 'Gumroad', blurb: 'Open source creator commerce.' },
  { repo: 'firstcontributions/first-contributions', name: 'First Contributions', blurb: 'Where the first PR happened.' },
] as const;

export const planetread = {
  org: 'PlanetRead',
  url: 'https://planetread.org',
  what: 'Non-profit behind Same Language Subtitling (SLS), which uses subtitles in the same language as the audio to build reading skills.',
  sls: 'https://en.wikipedia.org/wiki/Same_language_subtitling',
  plugins: [
    { name: 'Click and Align Subtitle Tool', url: 'https://exchange.adobe.com/apps/cc/204683/click-and-align-subtitle-tool' },
    { name: 'Slide and Align Subtitle Tool', url: 'https://exchange.adobe.com/apps/cc/204734/slide-and-align-subtitle-tool' },
  ],
  bookbox: {
    play: 'https://play.google.com/store/apps/details?id=com.bookbox.anibooks&hl=en_IN',
    amazon: 'https://www.amazon.com/BookBox-Inc-English/dp/B007XK02OO',
    appStore: 'https://apps.apple.com/in/app/bookbox/id375316138',
  },
};

// Triumph Scrambler 400 X, white. Specs from triumphmotorcycles.com and Bennetts / Rider Magazine reviews.
export const bike = {
  name: 'Triumph Scrambler 400 X',
  colour: 'White',
  specs: [
    ['Engine', '398 cc, liquid-cooled single, DOHC, 4 valves'],
    ['Power', '40 PS at 8,000 rpm'],
    ['Torque', '37.5 Nm at 6,500 rpm'],
    ['Gearbox', '6-speed, chain drive'],
    ['Fuel tank', '13 litres'],
    ['Seat height', '835 mm'],
  ] as [string, string][],
  sources: [
    { label: 'Triumph', url: 'https://www.triumphmotorcycles.com/motorcycles/classic/scrambler-400-x' },
    { label: 'Bennetts review', url: 'https://www.bennetts.co.uk/bikesocial/reviews/bikes/triumph/scrambler-400x-2024-review' },
  ],
  todo: ['Odometer reading', 'Ride log (routes, dates, photos)', 'Gear list (helmet, jacket, boots)', 'Photo of the actual bike'],
};

// Ride milestones shown on the road. Years from GitHub history.
export const milestones = [
  { top: '2023', label: 'FIRST REPO' },
  { top: '2025', label: 'SUGARIZER' },
  { top: '2026', label: 'LFX · PIPECD' },
  { top: 'PIPECD', label: '45 MERGED' },
] as const;
