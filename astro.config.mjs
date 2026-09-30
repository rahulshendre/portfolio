import { defineConfig } from 'astro/config';

// The public address drives canonical links, share cards and the sitemap. Set SITE_URL when deploying to a custom domain;
// on Vercel the production address is picked up automatically. TODO(rahul): pin the real domain once it exists.
const site = process.env.SITE_URL
  ?? (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : 'https://rahulshendre.github.io');

export default defineConfig({ site, devToolbar: { enabled: false } }); // the dev toolbar sits over the bottom of the ride and hides the bike
