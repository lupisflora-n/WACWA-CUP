/**
 * オシゴトアプリ - Google Slides PDF renderer
 *
 * 現行方式: Sheets/AppSheet -> Apps Script -> Slides -> PDF -> Drive
 * このファイルは新アプリから doPost で呼び出す連携用です。
 * 本番で使う前に Script Properties と Web アプリのアクセス権を設定してください。
 */

const PROPERTY_KEYS = {
  outputFolderId: 'OUTPUT_FOLDER_ID',
  completionTemplateId: 'COMPLETION_TEMPLATE_ID',
  marusanTemplateId: 'MARUSAN_TEMPLATE_ID',
  storageSpreadsheetId: 'STORAGE_SPREADSHEET_ID',
  storageSheetName: 'STORAGE_SHEET_NAME',
  googleClientId: 'GOOGLE_CLIENT_ID',
  allowedEmails: 'ALLOWED_EMAILS',
  adminEmails: 'ADMIN_EMAILS',
  viewerEmails: 'VIEWER_EMAILS',
  authRequired: 'AUTH_REQUIRED',
};

// 現行Driveで確認済みの台紙・保存先。Script Propertiesで上書きできる。
const DEFAULT_IDS = {
  outputFolderId: '1S_je5bOw_KWBcgYeKbpjKWD3551T83Jl',
  completionTemplateId: '1X6ouLZBV56-Mz8XmdnR0kSC63gJnsTPegmTK_gmfRUU',
  marusanTemplateId: '1hNAWOSqYxBlhpP7N6-_bi3f8tKa0nMQLAQfqFlJHR1o',
};

function doPost(e) {
  try {
    const request = JSON.parse(e.postData.contents || '{}');
    const identity = authenticateRequest_(request);
    let result;
    if (request.action === 'generatePdf') result = generatePdf_(request, identity);
    else if (request.action === 'listRecords') result = listRecords_(identity);
    else if (request.action === 'saveRecord') result = saveRecord_(request.record, identity);
    else if (request.action === 'deleteRecord') result = deleteRecord_(request.recordId, identity);
    else if (request.action === 'saveConfig') result = saveConfig_(request.config, identity);
    else if (request.action === 'listNotifications') result = listNotifications_(identity);
    else return json_({ ok: false, error: 'unsupported_action' });
    return json_({ ok: true, ...result });
  } catch (error) {
    console.error(error && error.stack ? error.stack : error);
    return json_({ ok: false, error: String(error && error.message ? error.message : error) });
  }
}

function doGet() {
  return json_({ ok: true, service: 'oshigoto-app', version: 'storage-v2', authRequired: String(getProperty_(PROPERTY_KEYS.authRequired, 'false')).toLowerCase() === 'true' });
}

function authenticateRequest_(request) {
  if (String(getProperty_(PROPERTY_KEYS.authRequired, 'false')).toLowerCase() !== 'true') {
    return { email: 'development', role: 'admin', development: true };
  }
  const token = String(request.idToken || '').trim();
  const clientId = requiredProperty_(PropertiesService.getScriptProperties(), PROPERTY_KEYS.googleClientId);
  if (!token) throw new Error('Googleログインが必要です');
  const response = UrlFetchApp.fetch('https://oauth2.googleapis.com/tokeninfo?id_token=' + encodeURIComponent(token), { muteHttpExceptions: true });
  if (response.getResponseCode() !== 200) throw new Error('Googleログインの確認に失敗しました');
  const claims = JSON.parse(response.getContentText() || '{}');
  if (claims.aud !== clientId || claims.email_verified !== 'true') throw new Error('ログイン情報が確認できません');
  const email = String(claims.email || '').toLowerCase();
  const allowed = csvProperty_(PROPERTY_KEYS.allowedEmails);
  if (!allowed.length || !allowed.includes(email)) throw new Error('このアプリの利用許可がありません');
  const admins = csvProperty_(PROPERTY_KEYS.adminEmails);
  const viewers = csvProperty_(PROPERTY_KEYS.viewerEmails);
  return { email, role: admins.includes(email) ? 'admin' : viewers.includes(email) ? 'viewer' : 'user', name: claims.name || email };
}

function getProperty_(key, fallback) {
  return PropertiesService.getScriptProperties().getProperty(key) || fallback;
}

function csvProperty_(key) {
  return String(getProperty_(key, '')).split(',').map(item => item.trim().toLowerCase()).filter(Boolean);
}

function storageSheet_() {
  const props = PropertiesService.getScriptProperties();
  const spreadsheetId = requiredProperty_(props, PROPERTY_KEYS.storageSpreadsheetId);
  const name = getProperty_(PROPERTY_KEYS.storageSheetName, '_oshigoto_records');
  const spreadsheet = SpreadsheetApp.openById(spreadsheetId);
  let sheet = spreadsheet.getSheetByName(name);
  if (!sheet) sheet = spreadsheet.insertSheet(name);
  if (sheet.getLastRow() === 0) sheet.appendRow(['id', 'ownerEmail', 'updatedAt', 'status', 'type', 'recordJson']);
  return sheet;
}

function listRecords_(identity) {
  requireStorageAuth_(identity);
  const sheet = storageSheet_();
  const values = sheet.getDataRange().getValues();
  const records = [];
  values.slice(1).forEach(row => {
    if (!row[0]) return;
    if (identity.role !== 'admin' && String(row[1]).toLowerCase() !== identity.email) return;
    try { records.push(JSON.parse(row[5] || '{}')); } catch (ignored) {}
  });
  return { records, identity: { email: identity.email, role: identity.role, name: identity.name || '' } };
}

function saveRecord_(record, identity) {
  requireStorageAuth_(identity);
  requireWritable_(identity);
  if (!record || !record.id) throw new Error('保存する帳票のIDがありません');
  const sheet = storageSheet_();
  const values = sheet.getDataRange().getValues();
  const id = String(record.id);
  let rowNumber = -1;
  values.slice(1).forEach((row, index) => { if (String(row[0]) === id) rowNumber = index + 2; });
  if (rowNumber > 0 && identity.role !== 'admin' && String(values[rowNumber - 1][1]).toLowerCase() !== identity.email) throw new Error('この帳票を変更する権限がありません');
  const updatedAt = new Date().toISOString();
  const payload = { ...record, updatedAt, ownerEmail: record.ownerEmail || identity.email };
  const row = [id, payload.ownerEmail, updatedAt, payload.status || 'draft', payload.type || 'completion', JSON.stringify(payload)];
  if (rowNumber > 0) sheet.getRange(rowNumber, 1, 1, row.length).setValues([row]);
  else sheet.appendRow(row);
  writeAudit_(identity, 'saveRecord', id, payload.status || 'draft');
  return { record: payload };
}

function deleteRecord_(recordId, identity) {
  requireStorageAuth_(identity);
  requireWritable_(identity);
  if (!recordId) throw new Error('削除する帳票のIDがありません');
  const sheet = storageSheet_();
  const values = sheet.getDataRange().getValues();
  for (let index = values.length - 1; index >= 1; index -= 1) {
    if (String(values[index][0]) !== String(recordId)) continue;
    if (identity.role !== 'admin' && String(values[index][1]).toLowerCase() !== identity.email) throw new Error('この帳票を削除する権限がありません');
    sheet.deleteRow(index + 1);
    writeAudit_(identity, 'deleteRecord', String(recordId), 'deleted');
    return { deleted: true };
  }
  return { deleted: false };
}

function saveConfig_(config, identity) {
  requireStorageAuth_(identity);
  if (identity.role !== 'admin') throw new Error('帳票設定を変更できるのは管理者だけです');
  const props = PropertiesService.getScriptProperties();
  const payload = JSON.stringify(config || {});
  props.setProperty('TAG_CONFIG_JSON', payload);
  const sheet = historySheet_('_oshigoto_config_history', ['version', 'updatedAt', 'updatedBy', 'configJson']);
  sheet.appendRow([Utilities.getUuid(), new Date().toISOString(), identity.email, payload]);
  writeAudit_(identity, 'saveConfig', 'TAG_CONFIG_JSON', 'updated');
  return { saved: true, updatedAt: new Date().toISOString() };
}

function listNotifications_(identity) {
  requireStorageAuth_(identity);
  const sheet = storageSheet_();
  const notifications = [];
  const values = sheet.getDataRange().getValues();
  values.slice(1).forEach(row => {
    if (row[3] === 'ready' && (identity.role === 'admin' || String(row[1]).toLowerCase() === identity.email)) {
      notifications.push({ type: 'pdf-ready', recordId: row[0], updatedAt: row[2] });
    }
  });
  return { notifications };
}

function requireStorageAuth_(identity) {
  if (!identity || identity.development) throw new Error('共有保存を使うにはGoogleログインと認証設定が必要です');
}

function requireWritable_(identity) {
  if (identity.role === 'viewer') throw new Error('閲覧者は帳票を変更できません');
}

function historySheet_(name, headers) {
  const props = PropertiesService.getScriptProperties();
  const spreadsheetId = requiredProperty_(props, PROPERTY_KEYS.storageSpreadsheetId);
  const spreadsheet = SpreadsheetApp.openById(spreadsheetId);
  let sheet = spreadsheet.getSheetByName(name);
  if (!sheet) sheet = spreadsheet.insertSheet(name);
  if (sheet.getLastRow() === 0) sheet.appendRow(headers);
  return sheet;
}

function auditSheet_() {
  return historySheet_('_oshigoto_audit', ['timestamp', 'email', 'role', 'action', 'targetId', 'detail']);
}

function writeAudit_(identity, action, targetId, detail) {
  try {
    if (!identity || identity.development) return;
    auditSheet_().appendRow([new Date().toISOString(), identity.email, identity.role, action, targetId || '', detail || '']);
  } catch (ignored) {}
}

function generatePdf_(request, identity) {
  const reports = Array.isArray(request.reports) && request.reports.length
    ? request.reports
    : [request.report || {}];
  const report = reports[0] || {};
  const template = templateType_(report);
  const props = PropertiesService.getScriptProperties();
  const outputFolderId = requiredProperty_(props, PROPERTY_KEYS.outputFolderId);
  const outputFolder = DriveApp.getFolderById(outputFolderId);
  const baseName = sanitizeFileName_(String(request.fileName || defaultFileName_(report, template)));
  const temporaryFile = DriveApp.getFileById(requiredProperty_(props, template === 'marusan' ? PROPERTY_KEYS.marusanTemplateId : PROPERTY_KEYS.completionTemplateId))
    .makeCopy('_tmp_' + baseName, outputFolder);

  try {
    const presentation = SlidesApp.openById(temporaryFile.getId());
    reports.forEach((item, index) => {
      if (index > 0) appendTemplateSlide_(presentation, item, props);
      const values = buildTagValues_(item, (request.tagValuesById || {})[item.id] || (index === 0 ? request.tagValues || {} : {}));
      applyPlacements_(presentation, request.tags || [], request.placements || [], index);
      replaceTags_(presentation, values, index);
      placeReceipt_(presentation, item.receiptImage || item.parkingReceiptImage || '', '{{parkingReceiptImg}}', index);
    });
    presentation.saveAndClose();

    const pdfBaseName = /\.pdf$/i.test(baseName) ? baseName : baseName + '.pdf';
    const pdfName = uniqueFileName_(outputFolder, pdfBaseName);
    const pdfFile = outputFolder.createFile(DriveApp.getFileById(temporaryFile.getId()).getBlob().getAs(MimeType.PDF)).setName(pdfName);
    const result = { fileId: pdfFile.getId(), fileUrl: pdfFile.getUrl(), fileName: pdfName, template, pageCount: reports.length };
    writeAudit_(identity, 'generatePdf', report.id || '', `${template}:${reports.length}`);
    return result;
  } finally {
    try { temporaryFile.setTrashed(true); } catch (ignored) {}
  }
}

function appendTemplateSlide_(presentation, report, props) {
  const type = templateType_(report);
  const templateId = requiredProperty_(props, type === 'marusan' ? PROPERTY_KEYS.marusanTemplateId : PROPERTY_KEYS.completionTemplateId);
  const source = SlidesApp.openById(templateId);
  try {
    presentation.appendSlide(source.getSlides()[0]);
  } finally {
    source.saveAndClose();
  }
}

function buildTagValues_(report, configuredValues) {
  const values = {};
  Object.keys(report).forEach(key => { values[key] = formatValue_(report[key]); });
  Object.keys(configuredValues).forEach(key => { values[key] = formatValue_(configuredValues[key]); });

  // 丸産は現行台紙のタグ名をそのまま優先する。完了報告書のタグ名へ変換しない。
  if (templateType_(report) === 'marusan') {
    values.ms_personInCharge = values.ms_personInCharge || values.personInCharge || firstWorker_(report);
    values.ms_date = values.ms_date || values.submittedAt || values.workDate || joinDate_(report);
    values.ms_site = values.ms_site || values.siteName || '';
    values.ms_am_time = values.ms_am_time || values.amTime || '';
    values.ms_pm_time = values.ms_pm_time || values.pmTime || '';
    const slots = Array.isArray(report.workSlots) ? report.workSlots : [];
    values.ms_work2 = values.ms_work2 || slots[0] || report.work2 || '';
    values.ms_work3 = values.ms_work3 || slots[1] || report.work3 || '';
    values.ms_work4 = values.ms_work4 || slots[2] || report.work4 || '';
    values.ms_nameL1 = values.ms_nameL1 || report.workers?.[0] || '';
    values.ms_nameL2 = values.ms_nameL2 || report.workers?.[1] || '';
    values.ms_nameL3 = values.ms_nameL3 || report.workers?.[2] || '';
    values.ms_nameR1 = values.ms_nameR1 || report.workers?.[3] || '';
    values.ms_nameR2 = values.ms_nameR2 || report.workers?.[4] || '';
    values.ms_nameR3 = values.ms_nameR3 || report.workers?.[5] || '';
  }

  if (templateType_(report) === 'completion') {
    // 現行台紙のタグ名を優先し、新アプリの入力名からも解決する。
    values.toCompany = values.toCompany || values.companyName || report.company || '';
    values.toOffice = values.toOffice || values.officeName || report.office || '';
    values.toPerson = values.toPerson || values.supervisorName || values.personInCharge || '';
    values.workDate = values.workDate || report.date || report.submittedAt || '';
    values.siteName = values.siteName || report.site || '';
    values.orderNo = values.orderNo || report.orderNumber || '';
    values.address = values.address || report.siteAddress || '';
    values.workerName = values.workerName || firstWorker_(report);
    values.supporters = values.supporters || buildSupportersText_(report.supporters || '');

    const workLines = String(report.workContent || report.diary || '').split(/\r?\n/);
    if (Array.isArray(report.works)) {
      report.works.forEach((work, index) => {
        const line = typeof work === 'string' ? work : (work.description || work.name || '');
        if (line) workLines[index] = line;
      });
    }
    for (let index = 2; index <= 10; index += 1) {
      const key = 'work' + index;
      values[key] = values[key] || workLines[index - 2] || '';
    }
    // 現行台紙の先頭行は workContent、次行以降は work2〜work10。
    // 新アプリの単一複数行入力をそのまま work2 にも入れると、先頭行が重複する。
    if (report.workContent && !Array.isArray(report.works) && !report.work2) values.work2 = '';
    values.workerName = values.workerName || firstWorker_(report);
    values.diary1 = values.diary1 || values.diary || report.diary || '';
    values.materialFee = values.materialFee || values.materialCost || report.materialCost || '';
    values.constructionTotal = values.constructionTotal || values.total || report.total || report.constructionTotal || '';
    values.parkingFee = formatMoney_(values.parkingFee || report.parkingFee);
    values.tollFee = values.tollFee || buildTollFee_(report);
    if (String(values.tollFee) === '0') values.tollFee = '';
    values.materialFee = formatMoney_(values.materialFee || report.materialFee || report.materialCost);
    values.constructionTotal = formatMoney_(values.constructionTotal || values.total || report.total || report.constructionTotal);
    values.tax = formatMoney_(values.tax || report.tax);
  }

  // 現行GASと同じ選択マークの考え方。台紙側の専用タグを置換する。
  const status = String(report.completionStatus || report.status || '');
  const occurrence = String(report.occurrence || report.attemptCount || report.visitCount || '');
  values.markComplete = status === '完了' ? '〇' : '';
  values.markIncomplete = status === '未完' ? '〇' : '';
  values.mark1 = occurrence === '1回目' ? '〇' : '';
  values.mark2 = occurrence === '2回目' ? '〇' : '';
  values.mark3 = occurrence === '3回目' ? '〇' : '';

  if (Array.isArray(report.supporters)) values.supporters = buildSupportersText_(report.supporters);
  if (report.ms_supporters == null && Array.isArray(report.workers)) values.ms_supporters = buildSupportersText_(report.workers.slice(1));
  if (report.type === 'marusan' && !values.submittedYear) splitDate_(report.submittedAt, values);
  if (report.type === 'completion') values.quantity = '一式';
  // 備考は承認済み仕様どおり3行とも空欄固定。
  values.remarks = '';
  return values;
}

function splitDate_(dateValue, values) {
  const match = String(dateValue || '').replace(/-/g, '/').match(/(\d{4})\/(\d{1,2})\/(\d{1,2})/);
  if (!match) return;
  values.submittedYear = match[1];
  values.submittedMonth = match[2];
  values.submittedDay = match[3];
}

function templateType_(report) {
  return String(report.type || '').toLowerCase() === 'marusan' ? 'marusan' : 'completion';
}

function firstWorker_(report) {
  return Array.isArray(report.workers) ? report.workers[0] || '' : '';
}

function joinDate_(report) {
  return [report.year, report.month, report.day].filter(Boolean).join('/');
}

function replaceTags_(presentation, values) {
  Object.keys(values).forEach(key => {
    const value = values[key] == null ? '' : String(values[key]);
    // 既存の {{tag}} と、新アプリ設定画面の <<tag>> を両方受け付ける。
    presentation.replaceAllText('{{' + key + '}}', value);
    presentation.replaceAllText('<<' + key + '>>', value);
  });
}

// 配置設定は画面上のA4台紙に対する割合で保存する。
// PDF生成時にも同じ設定をSlides側へ適用し、プレビューだけが動く状態を防ぐ。
function applyPlacements_(presentation, tags, placements, slideIndex) {
  const slide = presentation.getSlides()[slideIndex];
  if (!slide || !Array.isArray(placements)) return;
  const tagBySourceKey = {};
  (Array.isArray(tags) ? tags : []).forEach(item => {
    if (item && item.sourceKey && item.tag) tagBySourceKey[item.sourceKey] = String(item.tag);
  });
  const pageWidth = presentation.getPageWidth();
  const pageHeight = presentation.getPageHeight();
  placements.forEach(item => {
    if (!item || !item.sourceKey) return;
    const marker = tagBySourceKey[item.sourceKey] || '<<' + item.sourceKey + '>>';
    const shape = findShapeContainingText_(slide, marker);
    if (!shape) return;
    const x = Number(item.x);
    const y = Number(item.y);
    const width = Number(item.width);
    const height = Number(item.height);
    if ([x, y, width, height].every(Number.isFinite)) {
      shape.setLeft(pageWidth * x / 100);
      shape.setTop(pageHeight * y / 100);
      shape.setWidth(pageWidth * width / 100);
      shape.setHeight(pageHeight * height / 100);
    }
    const fontSize = Number(item.fontSize);
    if (Number.isFinite(fontSize) && fontSize > 0) {
      try { shape.getText().getTextStyle().setFontSize(fontSize); } catch (ignored) {}
    }
  });
}

function buildSupportersText_(value) {
  const items = Array.isArray(value) ? value.filter(Boolean) : String(value || '').split(/[,、]/).map(item => item.trim()).filter(Boolean);
  return items.length ? items.join('、') : '応援なし';
}

function buildTollFee_(report) {
  const mode = String(report.tollMode || report.tollType || '');
  const oneWay = toNumber_(report.tollOneWay || report.tollFee || report.tollAmount);
  if (mode === '片道') return formatYen_(oneWay);
  if (mode === '往復') return `${formatYen_(oneWay * 2)}(${oneWay.toLocaleString()}×2)`;
  if (mode === '行き帰り別') {
    const go = toNumber_(report.tollGo);
    const back = toNumber_(report.tollReturn);
    return `${formatYen_(go + back)}(${go.toLocaleString()}＋${back.toLocaleString()})`;
  }
  return '';
}

function toNumber_(value) {
  const cleaned = String(value == null ? '' : value).replace(/[^0-9.-]/g, '');
  const number = Number(cleaned);
  return Number.isFinite(number) ? number : 0;
}

function formatYen_(value) {
  const number = toNumber_(value);
  return number > 0 ? `￥${Math.floor(number).toLocaleString()}ー` : '';
}

function formatMoney_(value) {
  if (value == null || value === '') return '';
  const text = String(value);
  return /￥|円/.test(text) ? text : formatYen_(value);
}

function placeReceipt_(presentation, imageValue, placeholder) {
  if (!imageValue) {
    presentation.replaceAllText(placeholder, '');
    return;
  }
  const blob = getImageBlob_(imageValue);
  if (!blob) {
    presentation.replaceAllText(placeholder, '');
    return;
  }
  for (const slide of presentation.getSlides()) {
    const shape = findShapeContainingText_(slide, placeholder);
    if (!shape) continue;
    const left = shape.getLeft();
    const top = shape.getTop();
    const width = shape.getWidth();
    const height = shape.getHeight();
    shape.getText().setText('');
    slide.insertImage(blob, left, top, width, height);
    return;
  }
}

function getImageBlob_(value) {
  const raw = String(value || '').trim();
  const dataUrl = raw.match(/^data:([^;,]+);base64,(.+)$/);
  if (dataUrl) {
    try {
      return Utilities.newBlob(Utilities.base64Decode(dataUrl[2]), dataUrl[1], 'receipt.jpg');
    } catch (ignored) {}
  }
  const id = (raw.match(/[?&]id=([A-Za-z0-9_-]{10,})/) || [])[1] || (raw.match(/\/d\/([A-Za-z0-9_-]{10,})/) || [])[1] || (/^[A-Za-z0-9_-]{20,}$/.test(raw) ? raw : '');
  try {
    if (id) return DriveApp.getFileById(id).getBlob();
    const files = DriveApp.getFilesByName(raw);
    if (files.hasNext()) return files.next().getBlob();
  } catch (ignored) {}
  return null;
}

function findShapeContainingText_(slide, text) {
  for (const element of slide.getPageElements()) {
    if (element.getPageElementType() !== SlidesApp.PageElementType.SHAPE) continue;
    try {
      if (element.asShape().getText().asString().indexOf(text) !== -1) return element.asShape();
    } catch (ignored) {}
  }
  return null;
}

function formatValue_(value) {
  if (value == null) return '';
  if (Array.isArray(value)) return value.filter(Boolean).join('、');
  return String(value);
}

function defaultFileName_(report, template) {
  return [template === 'marusan' ? '丸産報告書' : '工事完了報告書', report.workDate || report.submittedAt || '', report.siteName || ''].filter(Boolean).join('_');
}

function sanitizeFileName_(name) {
  return name.replace(/[\\/:*?"<>|]/g, '_').trim() || 'オシゴト帳票';
}

function uniqueFileName_(folder, name) {
  const dot = name.lastIndexOf('.');
  const stem = dot > 0 ? name.slice(0, dot) : name;
  const ext = dot > 0 ? name.slice(dot) : '';
  let candidate = name;
  let count = 1;
  while (folder.getFilesByName(candidate).hasNext()) candidate = stem + '(' + count++ + ')' + ext;
  return candidate;
}

function requiredProperty_(properties, key) {
  const fallbackKey = Object.keys(PROPERTY_KEYS).find(name => PROPERTY_KEYS[name] === key);
  const value = properties.getProperty(key) || (fallbackKey ? DEFAULT_IDS[fallbackKey] : '');
  if (!value) throw new Error('Script Property is missing: ' + key);
  return value;
}

function json_(value) {
  return ContentService.createTextOutput(JSON.stringify(value)).setMimeType(ContentService.MimeType.JSON);
}
