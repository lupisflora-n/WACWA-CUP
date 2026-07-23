# Current Full Flow Status

Updated: 2026-07-23

## Implemented and verified

- `src/App.jsx` is now the single application coordinator; `src/main.jsx` only bootstraps React.
- The old inlined receipt editor was removed from the application entry point.
- Records are normalized when loaded, so older local drafts continue to open.
- Form changes are stored immediately in localStorage. Explicit save records the latest timestamp.
- Completion report validation checks required text, numeric totals, tax, and conditional spray detail.
- Marusan validation checks the site, numeric year/month/day range, and the first worker.
- Saving a Marusan report locks worker row 1 as the signed-in user's local profile for the sample environment.
- Valid reports enter a `ready` PDF job state before preview. Completed reports remain in the job history.
- Job rows can reopen the preview, and failed jobs have a retry path in the UI.
- Settings now provide local JSON backup export, JSON restore, profile editing, and local draft deletion.
- `npm.cmd run build` passes after the new flow changes.
- Browser verification passed for completion validation, completion preview, Marusan validation, worker locking, Marusan preview, and job history.

## Still required before production operation

- Enable GitHub Pages for the private repository and verify the fixed public URL.
- Replace localStorage with authenticated Google Drive/Sheets storage.
- Replace browser print/PDF saving with the production PDF renderer and Drive file storage.
- Use the supplied PDF/Excel templates as the final background and perform pixel-level layout calibration.
- Convert receipt crop and filters into persisted processed image files, while retaining the original.
- Add server-side authorization and audit history.

The current app is a functional sample environment. These remaining items are production integration gates, not reasons to change the approved form requirements.

