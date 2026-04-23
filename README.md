# Safety Field App

Static prototype for a construction-site safety app in Hebrew, designed for:

- Engineer
- Site manager
- Safety officer

Current prototype capabilities:

- Multi-screen static app shell for dashboard, inspections, issues, reports, and settings
- Hebrew-only interface focused on a local field workflow
- Mock-data driven rendering for sites, checklist items, issues, media cards, and report history
- Interactive checklist states that update the summary metrics, issue center, and selected issue card
- Printable branded report flow with clean preview and browser PDF export via print
- Richer media/signature workspace with progress states for photos, GPS, and digital sign-off
- Responsive layout for desktop and mobile review

## Files

- `index.html` - main app shell and screens
- `styles.css` - visual system and responsive layout
- `app.js` - screen navigation, Hebrew content rendering, mock data, and report/interaction logic

## Publish

This project is ready to publish as a static site on GitHub Pages.

## Cloud document storage

Worker document uploads are wired for Supabase Storage. To enable real cloud uploads, set these values in `app.js`:

```js
const CLOUD_STORAGE_CONFIG = {
  supabaseUrl: "https://YOUR_PROJECT.supabase.co",
  supabaseAnonKey: "YOUR_SUPABASE_ANON_KEY",
  bucket: "worker-documents",
};
```

Create a Supabase Storage bucket named `worker-documents`. For this static prototype, uploaded document links are opened through the bucket public URL, so the bucket/policies must allow the intended access.
