export const templateConfig = {
  completion: {
    label: '工事完了報告書',
    templateVersion: 'sample-v1',
    fields: {
      recipientCompany: { x: 64, y: 58, width: 220, height: 24, fontSize: 13 },
      workContent: { x: 70, y: 312, width: 470, height: 96, fontSize: 11, lineHeight: 1.35 },
      total: { x: 425, y: 548, width: 115, height: 24, fontSize: 12 },
      tax: { x: 425, y: 576, width: 115, height: 24, fontSize: 12 },
    },
  },
  marusan: {
    label: '丸産報告書',
    templateVersion: 'sample-v1',
    fields: {
      workDate: { x: 420, y: 62, width: 120, height: 24, fontSize: 12 },
      workRows: { x: 68, y: 210, width: 472, height: 176, fontSize: 10, lineHeight: 1.3 },
      workers: { x: 68, y: 402, width: 472, height: 104, fontSize: 10, lineHeight: 1.3 },
    },
  },
  receiptBox: {
    label: '領収書貼り付け枠',
    source: 'existing-slide-template',
    imageMode: 'first-image-to-formal-slot-plus-additional-attachments',
    preserveOriginal: true,
  },
}
