// Facts about Rahul used across the site. Everything here is real (sourced from his GitHub,
// his profile README, pipecd.dev and Triumph). Anything unknown is marked TODO so it shows.

export const site = {
  name: 'Rahul Shendre',
  shortName: 'Rahul',
  tagline: 'I write the docs that ship the deploys.',
  description:
    'CS student in Pune. LFX 2026 mentee on PipeCD, a CNCF project. Open source, Kubernetes, Go, and a white Triumph Scrambler 400X.',
  location: 'Pune, India',
  // One line in the garage's bottom bar, so who this is reads at a glance. Upper-case safe for the pixel font.
  badge: 'PIPECD MENTEE · PLANETREAD DEV',
  // The garage whiteboard: three lines, 12 characters at most.
  now: ['PIPECD V1', 'SUBTITLE QA', 'VIDEOS: OCT'],
  email: 'rahulshendre789@gmail.com',
  links: {
    github: 'https://github.com/rahulshendre',
    x: 'https://x.com/shendreee',
    xHandle: '@shendreee',
    linkedin: 'https://www.linkedin.com/in/rahul-shendre',
    // TODO(rahul): add the channel URL once it exists. Until then YouTube signs point at /videos.
    youtube: '',
  },
  stack: ['Go', 'TypeScript', 'React / React Native', 'Kubernetes', 'Docker', 'GitHub Actions', 'Python', 'C / C++'],
  personal: ['Finance nerd', '100 push-ups in one go', 'Good coffee', 'Rides a white Scrambler 400X'],
} as const;

// Social signs on the road hoardings and the garage wall.
export const socials = [
  { id: 'youtube', name: 'YOUTUBE', line: 'VIDEOS FROM OCT', href: site.links.youtube || '/videos' },
  { id: 'x', name: 'X', line: site.links.xHandle.toUpperCase(), href: site.links.x },
  { id: 'linkedin', name: 'LINKEDIN', line: 'RAHUL SHENDRE', href: site.links.linkedin },
  { id: 'github', name: 'GITHUB', line: 'RAHULSHENDRE', href: site.links.github },
] as const;

export const nav = [
  { href: '/builds', label: 'Builds' },
  { href: '/open-source', label: 'Open Source' },
  { href: '/planetread', label: 'PlanetRead' },
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
  role: 'Software development intern',
  since: 'June 2025',
  path: 'Started through C4GT DMP 2025, then stayed on as a software development intern. The work sits under BIRD, PlanetRead\'s initiative for reading and learning tools.',
  plugins: [
    { name: 'Click and Align Subtitle Tool', url: 'https://exchange.adobe.com/apps/cc/204683/click-and-align-subtitle-tool' },
    { name: 'Slide and Align Subtitle Tool', url: 'https://exchange.adobe.com/apps/cc/204734/slide-and-align-subtitle-tool' },
  ],
  bookbox: {
    play: 'https://play.google.com/store/apps/details?id=com.bookbox.anibooks&hl=en_IN',
    amazon: 'https://www.amazon.com/BookBox-Inc-English/dp/B007XK02OO',
    appStore: 'https://apps.apple.com/in/app/bookbox/id375316138',
    source: 'https://github.com/rahulshendre/BookBox',
  },
  // Everything below is checked against the repos and the DMP 2026 pull request, not written from memory.
  stats: [
    ['2', 'Premiere Pro plugins live on Adobe Exchange'],
    ['22', 'Indian languages the plugins support'],
    ['3', 'app stores carrying the BookBox app'],
    ['10k+', 'downloads on Google Play'],
    ['1,000+', 'daily users on Cricmaths'],
  ] as [string, string][],
  work: [
    {
      id: 'plugins',
      name: 'Subtitle plugins for Adobe Premiere Pro',
      tag: 'Live on Adobe Exchange',
      stack: ['JavaScript', 'CEP', 'ExtendScript', 'Premiere Pro'],
      body: [
        'Editors at PlanetRead were placing every subtitle by hand. I built two Premiere Pro extensions that turn a plain text file into a caption track, and both are live on Adobe Exchange.',
        'Click and Align: load the text, play the video, and click to mark where each line starts and ends. It writes a caption track and timeline markers, lets you export mid-session and carry on, saves your progress, and reads both UTF-16 and UTF-8 files.',
        'Slide and Align: the same text file, but timing is spread across the video in proportion to each line\'s word count, or set by hand with start and end times, with a word spacing control.',
        'Both support the 22 Indian languages, run on Windows and macOS, and have been kept working with new Premiere Pro releases (25 and 26). A developer guide is in the repo for whoever maintains them next.',
      ],
      links: [
        { label: 'Click and Align on Adobe Exchange', url: 'https://exchange.adobe.com/apps/cc/204683/click-and-align-subtitle-tool' },
        { label: 'Slide and Align on Adobe Exchange', url: 'https://exchange.adobe.com/apps/cc/204734/slide-and-align-subtitle-tool' },
        { label: 'Click and Align demo', url: 'https://youtu.be/HWKLLsV6Un4' },
        { label: 'Source', url: 'https://github.com/rahulshendre/Click_and_Align_Subtitle_tool' },
      ],
    },
    {
      id: 'bookbox',
      name: 'BookBox app, moved to React Native',
      tag: '10k+ downloads on Google Play',
      stack: ['React Native', 'Expo', 'TypeScript', 'Expo Router'],
      body: [
        'BookBox AniBooks are animated stories with same language subtitles for early readers. I moved the app fully to React Native with Expo, so one codebase serves Android, iOS and the Amazon Appstore.',
        'Stories come from PlanetRead\'s API with language and level filters and search. A story opens as a YouTube video with its own start and end times, or as a PDF, and the next one in the playlist plays on. It also handles being offline and has an error boundary so one bad story does not crash the app.',
      ],
      links: [
        { label: 'Google Play', url: 'https://play.google.com/store/apps/details?id=com.bookbox.anibooks&hl=en_IN' },
        { label: 'App Store', url: 'https://apps.apple.com/in/app/bookbox/id375316138' },
        { label: 'Amazon Appstore', url: 'https://www.amazon.com/BookBox-Inc-English/dp/B007XK02OO' },
        { label: 'Source', url: 'https://github.com/rahulshendre/BookBox' },
      ],
    },
    {
      id: 'cricmaths',
      name: 'Cricmaths, maths through live cricket',
      tag: '1,000+ daily users',
      stack: ['Laravel', 'PHP', 'MySQL', 'REST APIs'],
      body: [
        'Cricmaths turns live cricket matches into maths questions for students. I built the API layer that fetches and normalises match data from more than one provider, with a fallback so a failing provider does not take the game down, and a practice mode so students can play when no match is on.',
      ],
      links: [
        { label: 'cricmaths.com', url: 'https://cricmaths.com/' },
        { label: 'Source', url: 'https://github.com/rahulshendre/crickmaths_BIRD' },
      ],
    },
    {
      id: 'checker',
      name: 'Audio and subtitle mismatch checker',
      tag: 'C4GT DMP 2026',
      stack: ['Python', 'Whisper', 'Tesseract OCR', 'OpenCV', 'RapidFuzz'],
      body: [
        'The plugins only align subtitles. Whether the text is right was always a manual check. This tool closes that gap: it transcribes the audio with Whisper, grabs a video frame at the middle of each spoken segment, reads the burned-in subtitle with Tesseract, compares the two and flags the segments that disagree in an HTML report with thumbnails and scores.',
        'On the BookBox AniBook "Rani Goes to School" in Hindi it checked 44 segments: 42 matched and 2 were flagged, both false positives that are explained in the write-up. Marathi and Kannada run through the same pipeline on their own branches. The Kannada notes are honest about where speech recognition falls short.',
        'I submitted it to PlanetRead as my C4GT DMP 2026 demo.',
      ],
      links: [
        { label: 'Demo video', url: 'https://youtu.be/G06-LdzV9PU' },
        { label: 'DMP 2026 pull request', url: 'https://github.com/PlanetRead/Burn-in-subtitle-checker/pull/12' },
        { label: 'Source', url: 'https://github.com/rahulshendre/subtitle_mismatch_mvp' },
      ],
    },
  ],
  timeline: [
    ['Jun 2025', 'Joined PlanetRead through C4GT DMP 2025'],
    ['Jul 2025', 'First Premiere Pro plugin prototype: subtitles from a text file'],
    ['Nov 2025', 'Click and Align repo opens; BookBox MVP with the YouTube API'],
    ['Feb 2026', 'Slide and Align and the Cricmaths API work'],
    ['Apr 2026', 'Support for Premiere Pro 26; BookBox app on React Native'],
    ['Jun 2026', 'Mismatch checker prototype'],
    ['Sep 2026', 'DMP 2026 demo submitted to PlanetRead'],
  ] as [string, string][],
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

// Third-party material used on the site. CC BY needs the author, the licence and a note that it was changed.
export const credits = [
  {
    what: 'Door scene mountains',
    title: 'Ama Dablam, Nepal',
    author: 'Vyacheslav Argenberg',
    url: 'https://commons.wikimedia.org/wiki/File:Ama_Dablam,_Nepal.jpg',
    licence: 'CC BY 4.0',
    licenceUrl: 'https://creativecommons.org/licenses/by/4.0/',
    changes: 'cropped, recoloured to a dusk palette and reduced to pixel art (tools/backdrop.py)',
  },
] as const;
