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

const existing = (formName, sourceKey, tag, field = sourceKey) => ({ formName, sourceKey, tag, field, origin: '現行アプリ', status: '引き継ぎ' })
const newField = (formName, sourceKey, tag, field = sourceKey) => ({ formName, sourceKey, tag, field, origin: '新PDF', status: '新規' })

// Tags are copyable now; their exact spelling will be confirmed against the original Slides before migration.
export const tagRegistry = [
  existing('宛先会社', 'toCompany', '<<toCompany>>'),
  existing('宛先事業所', 'toOffice', '<<toOffice>>'),
  existing('宛先担当者', 'toPerson', '<<toPerson>>'),
  existing('作業者', 'workerName', '<<workerName>>'),
  existing('現場名', 'siteName', '<<siteName>>'),
  existing('注文No', 'orderNo', '<<orderNo>>'),
  existing('工事内容 1', 'work2', '<<work2>>', 'workContent'),
  existing('工事内容 2', 'work3', '<<work3>>', 'workContent'),
  existing('工事内容 3', 'work4', '<<work4>>', 'workContent'),
  existing('合計', 'constructionTotal', '<<constructionTotal>>', 'total'),
  existing('消費税', 'tax', '<<tax>>'),
  existing('工事担当名', 'ms_personInCharge', '<<ms_personInCharge>>'),
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
