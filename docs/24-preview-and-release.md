# Preview and Release

## Fixed Preview

The intended single preview address is:

`https://lupisflora-n.github.io/WACWA-CUP/`

GitHub Pages deployment is prepared in `.github/workflows/deploy-pages.yml`. The address becomes usable after the repository receives the commit and GitHub Pages is enabled for the repository. Future updates to `main` keep the same address.

## Local Preview

During development, use:

`http://localhost:5173/`

The PWA manifest and Service Worker are included so the same app can be added to a smartphone home screen after the fixed preview is published.

## Operating Rule

The fixed preview is for visual and workflow confirmation only. Production Google Drive, Sheets, PDF generation, authentication, and migration remain separate release gates.
