# Prototype Status

> Historical milestone record. The current implementation status is in `docs/27-current-full-flow-status.md`.

## Purpose

This prototype is the first implementation of the approved `オシゴトアプリ` direction. It uses sample data only and does not connect to the production AppSheet app, Google Sheets, Google Drive, or the existing PDF generation scripts.

## Confirmed In This Milestone

- Original desktop and mobile-friendly app shell
- Home, drafts, PDF processing, and settings screens
- Separate forms for `工事完了報告書` and `丸産報告書`
- Multiline text fields for work content, spray detail, special materials, and notes
- Tax auto-calculation at 10% with 1-yen fractional amounts discarded and manual editing allowed
- Spray selection and conditional spray detail field
- Six work-content rows and six worker fields for the Marusan form
- Fixed company display `株式会社ＴＲＣ` for the Marusan form
- Local draft state and sample PDF processing state
- Receipt image selection/camera input, preview, display enhancement, rotation, zoom, crop setting, and multiple attachments
- Separate `src/config/template-config.js` for future PDF/tag position adjustment

## Known Prototype Limits

- PDF files are not generated yet.
- The crop slider currently stores the intended crop percentage for the next PDF-processing implementation; it does not yet rewrite the image pixels.
- Image processing is currently a browser preview feature. The original file and processed PDF image need a backend or controlled storage step before production use.
- Google login, Drive/Sheets connection, permission control, production migration, and rollback automation are not implemented yet.
- The first worker field is visually marked as the本人欄, but account-based fixed-user behavior is a later authentication step.

## Verification

- `npm.cmd run build` passed.
- Browser verification passed for home screen rendering, live draft/PDF counts, settings layout configuration display, completion form navigation, and receipt editor navigation.

## Next Gate

The next implementation gate is the PDF generation layer using the approved new Excel/PDF references and the existing Slides tag map. It must be developed against sample data and visually checked before any production data migration.
