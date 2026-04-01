# Publish Devotionals

Run the full content pipeline and deploy to Netlify production.

## Steps

1. Run `node scripts/build-content.mjs` from the project root (`/Users/scottbrandon/Desktop/Devotionals/devotional-mockup`) to regenerate `src/data.ts` from the markdown files in `content/`.
2. Run `pnpm vite build` to build the static site.
3. Run `npx netlify-cli deploy --prod` to deploy to production.

Report the production URL when complete.

If the build-content script reports 0 days, stop and warn the user — something is wrong with the content files.
