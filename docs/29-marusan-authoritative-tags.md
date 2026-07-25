# Marusan authoritative template tags

Confirmed from the Drive spreadsheet and the existing Google Slides presentation on 2026-07-24.

Presentation ID: `1hNAWOSqYxBlhpP7N6-_bi3f8tKa0nMQLAQfqFlJHR1o`

The existing Marusan path uses these tags. They are kept separate from the completion-report tags:

`ms_personInCharge`, `ms_date`, `ms_site`, `ms_am_time`, `ms_pm_time`, `ms_work2`, `ms_work3`, `ms_work4`, `ms_nameL1`, `ms_nameL2`, `ms_nameL3`, `ms_nameR1`, `ms_nameR2`, `ms_nameR3`.

Observed font sizes are 13pt for the person in charge and 12pt for the date, site, time, work, and worker fields.

The new app now has these tags in its tag registry and initial placement values derived from the Slides geometry. The placement editor can change their x/y/width/height/font size. The current six-slot work form remains available as additional new-app input; it is not silently treated as a replacement for the authoritative `ms_work2`-`ms_work4` fields.

The production PDF path still requires deployment of the Apps Script Web App and confirmation of its authentication policy. Until then, the local browser preview is a QA preview, not the company-submission PDF.
