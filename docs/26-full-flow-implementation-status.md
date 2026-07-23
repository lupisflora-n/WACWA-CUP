# Full Flow Implementation Status

Updated: 2026-07-23

## Completed in the prototype

- The completion report and Marusan daily report have separate form flows.
- Completion report work content, spray detail, special material, and notes preserve user line breaks.
- Quantity is fixed to `一式` in the report preview. Parking, expressway, and material costs are excluded from the total field.
- Tax is calculated as 10% of the entered total and discarded after the decimal point. The tax field remains editable.
- Spray selection is rendered as a circle around the selected `あり` or `なし` value.
- Marusan has numeric year/month/day fields, AM/PM time fields, six work-content rows, six worker rows, and fixed company text `株式会社ＴＲＣ`.
- The report preview is printable as A4. The browser print dialog provides the PDF save operation without a server account.
- Receipt images are stored as data URLs in the browser draft, so a reload does not invalidate the preview. Multiple receipts can be attached, and each can have an original, soft grayscale, or high-contrast grayscale view, zoom, rotation, and crop settings.
- The app has a local draft/history flow and a fixed GitHub Pages deployment workflow.

## Deliberate prototype limits

- Data is currently stored in browser localStorage. Drive/Sheets synchronization and user authentication are a later migration gate.
- Receipt crop is represented by a saved display mask and is reflected in the report preview. Pixel-level image rewriting and server-side file storage are still pending.
- The new documents are mapped to a working browser layout. Final pixel-level alignment against the supplied PDF/Excel templates remains a separate adjustment pass.
- The first worker lock for Marusan should be connected to the authenticated user profile when the account layer is added.

## Acceptance check for this milestone

1. Open the app on a phone-sized viewport.
2. Create or open each report type.
3. Enter multiline text and confirm line breaks appear in the report preview.
4. Open the receipt editor, add an image, adjust grayscale/crop/rotation/zoom, and confirm it remains after returning to the form.
5. Open the report preview and use the browser print dialog to save a PDF.
6. Confirm the saved record appears in the history/job list.

