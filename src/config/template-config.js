// Keep field names, source keys, and layout controls in one place.
// Existing AppSheet keys are preserved until the original Slides tags are verified.
export const templateConfig = {
  completion: {
    label: '工事完了報告書',
    templateVersion: 'formal-pdf-v1',
    source: '完了報告書.pdf / 既存フォーム名優先',
    fields: {
      recipientCompany: { x: 4, y: 16, width: 39, height: 4, fontSize: 12 },
      workContent: { x: 5, y: 40.3, width: 41, height: 12.1, fontSize: 11 },
      sprayDetail: { x: 5, y: 57, width: 41, height: 13, fontSize: 11 },
      specialMaterial: { x: 53, y: 57, width: 40, height: 13, fontSize: 11 },
      total: { x: 5, y: 89.7, width: 25, height: 4, fontSize: 12 },
      tax: { x: 35, y: 89.7, width: 25, height: 4, fontSize: 12 },
      // New fields remain adjustable until the new form is calibrated against the final PDF.
      newFields: { x: 0, y: 0, width: 0, height: 0, fontSize: 11, calibration: 'pending' },
    },
  },
  marusan: {
    label: '丸産報告書',
    templateVersion: 'formal-pdf-v1',
    source: '丸産報告書.pdf / 完全新規帳票',
    fields: {
      workDate: { x: 30, y: 15, width: 62, height: 4, fontSize: 11 },
      workRows: { x: 28, y: 33.8, width: 65, height: 10.9, fontSize: 11, lineHeight: 1.25 },
      workers: { x: 28, y: 46.7, width: 65, height: 11.4, fontSize: 11, lineHeight: 1.25 },
      notes: { x: 28, y: 60, width: 65, height: 24, fontSize: 11, lineHeight: 1.35 },
      newFields: { x: 0, y: 0, width: 0, height: 0, fontSize: 11, calibration: 'pending' },
    },
  },
  receiptBox: {
    label: '領収書貼り付け枠',
    source: 'existing-slide-template',
    imageMode: 'first-image-to-formal-slot-plus-additional-attachments',
    preserveOriginal: true,
  },
}

const inferTemplate = sourceKey => sourceKey.startsWith('ms_') || ['year', 'month', 'day', 'amTime', 'pmTime', 'notes', 'submittedAt'].includes(sourceKey) || sourceKey.startsWith('workSlot') ? 'marusan' : 'completion'
const existing = (formName, sourceKey, tag, field = sourceKey) => ({ formName, sourceKey, tag, field, template: inferTemplate(sourceKey), origin: '現行アプリ', status: '引き継ぎ' })
const newField = (formName, sourceKey, tag, field = sourceKey) => ({ formName, sourceKey, tag, field, template: inferTemplate(sourceKey), origin: '新PDF', status: '新規' })

// Tags are copyable now; their exact spelling will be confirmed against the original Slides before migration.
export const tagRegistry = [
  existing('宛先会社', 'toCompany', '<<toCompany>>'),
  existing('宛先事業所', 'toOffice', '<<toOffice>>'),
  existing('宛先担当者', 'toPerson', '<<toPerson>>'),
  existing('作業者', 'workerName', '<<workerName>>'),
  existing('現場名', 'siteName', '<<siteName>>'),
  existing('注文No', 'orderNo', '<<orderNo>>'),
  existing('住所', 'address', '<<address>>'),
  existing('日付', 'workDate', '<<workDate>>'),
  existing('工事内容 1', 'work2', '<<work2>>', 'workContent'),
  existing('工事内容 2', 'work3', '<<work3>>', 'workContent'),
  existing('工事内容 3', 'work4', '<<work4>>', 'workContent'),
  existing('合計', 'constructionTotal', '<<constructionTotal>>', 'total'),
  existing('消費税', 'tax', '<<tax>>'),
  existing('工事担当名', 'ms_personInCharge', '<<ms_personInCharge>>'),
  existing('現場名及び工事内容', 'ms_site', '<<ms_site>>', 'siteName'),
  existing('作業員名 1', 'ms_nameL1', '<<ms_nameL1>>'),
  existing('作業員名 2', 'ms_nameL2', '<<ms_nameL2>>'),
  existing('作業員名 3', 'ms_nameL3', '<<ms_nameL3>>'),
  existing('作業員名 4', 'ms_nameR1', '<<ms_nameR1>>'),
  existing('作業員名 5', 'ms_nameR2', '<<ms_nameR2>>'),
  existing('作業員名 6', 'ms_nameR3', '<<ms_nameR3>>'),
  newField('数量', 'quantity', '<<quantity>>'),
  newField('備考', 'remarks', '<<remarks>>'),
  newField('吹付塗装の有無', 'spray', '<<spray>>'),
  newField('吹付塗装の詳細', 'sprayDetail', '<<sprayDetail>>'),
  newField('通常材料以外に材料を使った場合', 'specialMaterial', '<<specialMaterial>>'),
  newField('合計額', 'totalAmount', '<<totalAmount>>'),
  newField('提出日', 'submittedAt', '<<submittedAt>>'),
  newField('年', 'year', '<<year>>'),
  newField('月', 'month', '<<month>>'),
  newField('日', 'day', '<<day>>'),
  newField('AM', 'amTime', '<<amTime>>'),
  newField('PM', 'pmTime', '<<pmTime>>'),
  newField('作業日の作業内容 AM 1', 'workSlot1', '<<workSlot1>>'),
  newField('作業日の作業内容 AM 2', 'workSlot2', '<<workSlot2>>'),
  newField('作業日の作業内容 AM 3', 'workSlot3', '<<workSlot3>>'),
  newField('作業日の作業内容 PM 1', 'workSlot4', '<<workSlot4>>'),
  newField('作業日の作業内容 PM 2', 'workSlot5', '<<workSlot5>>'),
  newField('作業日の作業内容 PM 3', 'workSlot6', '<<workSlot6>>'),
  newField('連絡事項・注意事項・明日の作業予定', 'notes', '<<notes>>'),
]

// Initial positions are percentages of each A4 background. They are deliberately editable.
export const tagPlacementDefaults = [
  ['completion', 'toCompany', 4, 16, 39, 4], ['completion', 'toOffice', 4, 22, 39, 4], ['completion', 'toPerson', 4, 27, 39, 4],
  ['completion', 'workerName', 57, 7.3, 35, 3.5], ['completion', 'workDate', 5, 33.5, 25, 3.5], ['completion', 'siteName', 31, 33.5, 60, 3.5],
  ['completion', 'orderNo', 5, 37.1, 28, 3.5], ['completion', 'address', 37, 37.1, 54, 3.5], ['completion', 'work2', 5, 40.3, 41, 3.7],
  ['completion', 'work3', 5, 44, 41, 3.7], ['completion', 'work4', 5, 47.7, 41, 3.7], ['completion', 'quantity', 46, 40.3, 5, 12.1],
  ['completion', 'remarks', 53, 40.3, 40, 12.1], ['completion', 'spray', 5, 53.8, 41, 3.2], ['completion', 'sprayDetail', 5, 57, 41, 13],
  ['completion', 'specialMaterial', 53, 57, 40, 13], ['completion', 'constructionTotal', 5, 89.7, 25, 4], ['completion', 'tax', 35, 89.7, 25, 4],
  ['completion', 'totalAmount', 66, 89.7, 28, 4],
  ['marusan', 'ms_personInCharge', 7, 3, 30, 3.5], ['marusan', 'submittedAt', 61, 3, 32, 3.5], ['marusan', 'year', 42, 15, 14, 4],
  ['marusan', 'month', 61, 15, 14, 4], ['marusan', 'day', 80, 15, 14, 4], ['marusan', 'ms_site', 28, 21, 65, 7],
  ['marusan', 'amTime', 28, 30, 31, 3.5], ['marusan', 'pmTime', 61, 30, 31, 3.5],
  ['marusan', 'workSlot1', 28, 33.8, 31, 3.7], ['marusan', 'workSlot2', 28, 37.5, 31, 3.7], ['marusan', 'workSlot3', 28, 41.2, 31, 3.7],
  ['marusan', 'workSlot4', 61, 33.8, 31, 3.7], ['marusan', 'workSlot5', 61, 37.5, 31, 3.7], ['marusan', 'workSlot6', 61, 41.2, 31, 3.7],
  ['marusan', 'ms_nameL1', 28, 46.7, 31, 3.8], ['marusan', 'ms_nameL2', 28, 50.5, 31, 3.8], ['marusan', 'ms_nameL3', 28, 54.3, 31, 3.8],
  ['marusan', 'ms_nameR1', 61, 46.7, 31, 3.8], ['marusan', 'ms_nameR2', 61, 50.5, 31, 3.8], ['marusan', 'ms_nameR3', 61, 54.3, 31, 3.8],
  ['marusan', 'notes', 28, 60, 65, 24],
].map(([template, sourceKey, x, y, width, height]) => ({ template, sourceKey, x, y, width, height, fontSize: 11 }))
