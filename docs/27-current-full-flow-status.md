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

## New-item and tag editing status (2026-07-24)

- New form items are registered separately from existing AppSheet items. Their initial titles are taken from the approved new-template field analysis.
- Item titles and tag strings are stored as separate editable values.
- Tags can be copied, duplicated, added, and deleted. Deletion can be undone by restoring the initial tag registry.
- Completion-report and Marusan-report tags are separated by `template`; the Marusan editor displays and adds Marusan tags only.
- Each added or duplicated tag receives an editable placement record for x/y position, width, height, and font size.
- Added placement records are retained when the app is reopened, so custom tags do not lose their position settings.
- Custom tags are rendered in the selected report preview when their placement exists.
- These edits are currently stored in the browser's localStorage. They have not yet been migrated to authenticated Drive/Sheets storage.

## PDF calibration evidence (2026-07-24)

- Chrome headless output produced a one-page A4 PDF (`594.96 x 841.92 pt`) from the completion fixture.
- The supplied completion background is present in the output and the known reference values are rendered.
- The first comparison found placement differences; completion coordinates were recalibrated once, but exact pixel parity is not yet accepted.
- The reference PDF contains a receipt image. The actual Drive receipt for the verified 2026/07/21 row was identified and included in the final comparison; receipt placement is now verified for that fixture.

## Slides renderer integration scaffold (2026-07-24)

- Added `integrations/apps-script/Code.gs` with a `doPost` PDF generation endpoint.
- The endpoint follows the verified current sequence: copy a Slides template, replace tags, place a receipt image, export PDF, save to Drive, and remove the temporary Slides file.
- Added `src/integrations/pdf-provider.js` and a `Google Slides PDF` action in the preview. It uses the fixed Apps Script endpoint by default, while `VITE_APPS_SCRIPT_URL` can override it.
- The Web App endpoint is deployed at the fixed URL in `src/integrations/pdf-provider.js`; it has been tested with both templates and with the actual completion receipt image. Production data persistence and server-side authorization remain separate gates.
