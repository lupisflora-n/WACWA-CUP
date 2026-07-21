# AppSheet Editor Inventory

Date: 2026-07-22

This note records what was confirmed directly in the AppSheet editor. It is intentionally summarized and anonymized for GitHub.

## Access Result

- Chrome extension access works.
- The AppSheet editor tab can be inspected directly without repeated screenshots.
- Current editor app name: `レポートジェネレータ`.
- Current app concept shown in settings: a field-complete report creation system connected with AppSheet and automation, supporting single PDF and bundled PDF output.
- Industry/function metadata: construction / administration.

## Existing App Purpose

The existing app is not only a data-entry form. It is a field-work document workflow:

1. Create and manage completion reports.
2. Keep reports as drafts or completed records.
3. Request PDF generation for individual reports.
4. Request bundled PDF generation for grouped reports.
5. Manage monthly billing/invoice-related records.
6. Generate invoice and summary files through automation.

For the renewed app, this should be treated as a business workflow system, not a direct AppSheet clone.

## Data Tables Seen In AppSheet

- `completion_reports`
  - Main report table.
  - AppSheet reports 59 columns in the editor.
  - Contains report lifecycle fields such as status, PDF name/file/id/url related fields, and billing/work detail fields.
- `daily_billing_records`
  - Daily work/billing records.
- `monthly_summaries`
  - Monthly billing/invoice summary records.
- `menu_items`
  - Top-level menu items used by the app home/menu screen.
- `settings`
  - App-level configurable values.
- `solvent_master`
  - Master data for solvent/items/pricing.

## Views Seen In AppSheet

Primary navigation:

- `下書き一覧`
- `完了済み`

Menu navigation:

- `書類ハブ`
- `月次まとめ`

Reference view:

- `月次請求一覧`

System-generated views include detail/form views for each table or slice.

Preview menu items visible from `書類ハブ`:

- `完了報告書`
- `丸産`
- `月報（準備中）`
- `請求関連`

## Important Actions Seen In AppSheet

Actions under `completion_reports`:

- `PDFを開く`
- `PDF作成を依頼する`
- `グループ全員を下書きに戻す`
- `まとめてPDF作成`
- `下書き一覧へ移動`
- `高速料金`
- `再編集する`
- `削除`
- `修正のために下書きへ戻す`
- `新規作成`
- AppSheet-generated add/delete/edit/open actions

Important behavior confirmed:

- `PDF作成を依頼する`
  - Type: set values on the current row.
  - Sets `status` to `"作成依頼中"`.
  - Shown inline, attached near `completionStatus`.
- `まとめてPDF作成`
  - Type: set values on the current row.
  - Sets `status` to `"作成依頼中(まとめ)"`.
  - Sets `bundleId` using timestamp + worker/settings-derived value + bundle suffix.
  - Sets `requestedPdfName` to `[bundleId]`.
  - Shown as a prominent action.

Interpretation for the renewed app:

- PDF generation is currently modeled as a status-change trigger.
- The new app should model this explicitly as a background job queue:
  - Report PDF job
  - Bundle PDF job
  - Job status
  - Retry/error state
  - Generated file record

## Automation Seen In AppSheet

Automation/Bot:

- Table: `monthly_summaries`
- Bot: `請求書作成`
- Event: `請求月の更新時`
- Process steps:
  - `PDFファイル作成`
  - `一覧表ファイル作成`

Interpretation for the renewed app:

- Monthly invoice generation should be its own workflow.
- The new app should avoid hiding this inside table status updates only.
- A clearer model is:
  - Monthly summary selected/updated
  - Invoice generation job starts
  - PDF/spreadsheet/list files are generated
  - Result files are attached to the monthly summary
  - User can see progress, success, failure, and retry options

## Security Seen In AppSheet

- Sign-in required.
- Authentication provider: Google.
- `Allow all signed-in users` is off.
- User management is expected.

Interpretation for the renewed app:

- The renewed app needs an explicit role and permission design.
- Minimum role candidates:
  - Admin/owner
  - Office/billing manager
  - Field worker
  - Viewer/read-only

## Manage/Deployment Seen In AppSheet

- App is not fully deployed in the inspected editor state.
- Manage includes deployment check, versions, monitor, collaborate/publish.
- AppSheet shows plan/deployment warnings, which supports the goal of moving beyond AppSheet limitations.

## Design Renewal Notes

The current UI is functional but AppSheet-shaped:

- Green AppSheet theme.
- Menu-card based home screen.
- Mobile-preview-first navigation.
- Workflow meaning is spread across views, actions, status values, and automation.

Renewed app design goals:

- Original visual design, not AppSheet-like.
- Work-dashboard first screen.
- Clear separation of:
  - Draft reports
  - Completed reports
  - PDF jobs
  - Monthly billing
  - Masters/settings
- Visible status and error handling.
- Faster repeated entry for field work.
- Maintainable data model and source code.

## Next Phase Goal Proposal

Phase 2 should turn this inventory into a product blueprint:

1. Define user roles and daily workflows.
2. Define target screens and navigation.
3. Define the new data model.
4. Decide the app platform approach:
   - Web app first
   - PWA/mobile-friendly web app
   - Native mobile later if needed
5. Define PDF/invoice generation architecture.
6. Create wireframe-level screen specs before implementation.

Open confirmation needed before implementation:

- Who are the actual user roles?
- Is Google login mandatory in the new app?
- Should Google Sheets remain the database for phase 1, or should we move to a real database?
- Should generated PDFs continue to live in Google Drive?
- Which workflow is highest priority for the first working prototype?
