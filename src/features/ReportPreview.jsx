import { ArrowLeft, Check, Printer } from 'lucide-react'

const valueText = value => value == null ? '' : String(value)

function getValue(data, key) {
  if (key === 'supporters') return Array.isArray(data.supporters) ? data.supporters.join(', ') : data.supporters || ''
  if (['occurrence', 'parkingFee', 'tollMode', 'tollLink', 'materialCost', 'construction1', 'construction2', 'material1', 'material2', 'free1', 'free2', 'free3', 'freeTime', 'free4', 'diary'].includes(key)) return data[key] || ''
  if (key === 'workerName') return data.workers?.[0] || data.workerName || ''
  if (key === 'ms_personInCharge') return data.ms_personInCharge || data.personInCharge || data.workers?.[0] || ''
  if (key === 'ms_date') return data.ms_date || data.submittedAt || [data.year, data.month, data.day].filter(Boolean).join('/')
  if (key === 'ms_am_time') return data.ms_am_time || data.amTime || ''
  if (key === 'ms_pm_time') return data.ms_pm_time || data.pmTime || ''
  if (key === 'ms_work2' || key === 'ms_work3' || key === 'ms_work4') {
    const direct = data[key]
    if (direct) return direct
    const index = Number(key.slice(-1)) - 2
    return data.workSlots?.[index] || valueText(data.workContent).split(/\r?\n/)[index] || ''
  }
  if (key === 'ms_company') return data.companyName || '丸産技研'
  if (key === 'ms_supporters') {
    if (data.supporters) return data.supporters
    const extraWorkers = (data.workers || []).slice(1).filter(Boolean)
    return extraWorkers.length ? extraWorkers.join('、') : ''
  }
  if (key === 'ms_site') return data.ms_site || [data.siteName, data.workContent].filter(Boolean).join('\n')
  if (key.startsWith('workSlot')) return data.workSlots?.[Number(key.slice(-1)) - 1] || ''
  if (key.startsWith('ms_name')) {
    const index = key.endsWith('1') ? 0 : key.endsWith('2') ? 1 : 2
    return data.workers?.[(key.includes('R') ? 3 : 0) + index] || ''
  }
  if (key === 'work2' || key === 'work3' || key === 'work4') {
    const line = valueText(data.workContent).split(/\r?\n/)[Number(key.slice(-1)) - 2] || ''
    return line || data[`free${Number(key.slice(-1)) - 1}`] || ''
  }
  if (key === 'quantity') return '一式'
  if (key === 'remarks') return ''
  if (key === 'spray') return data.spray === 'あり' ? '○ あり　　　○ なし' : '○ なし　　　○ あり'
  if (key === 'constructionTotal') return data.total
  if (key === 'totalAmount') return data.total && data.tax ? String(Number(data.total) + Number(data.tax)) : data.total
  if (key === 'submittedAt') return data.submittedAt || data.ms_date || ''
  if (['submittedYear', 'submittedMonth', 'submittedDay'].includes(key)) {
    const raw = String(data.submittedAt || '').replace(/-/g, '/')
    const match = raw.match(/(\d{4})\/(\d{1,2})\/(\d{1,2})/)
    if (!match) return ''
    return key === 'submittedYear' ? match[1] : key === 'submittedMonth' ? match[2] : match[3]
  }
  return data[key] ?? ''
}

function Overlay({ item, value }) {
  if (!item || !valueText(value)) return null
  const className = item.kind === 'circle' ? 'template-overlay template-choice-overlay' : 'template-overlay'
  return <span className={className} style={{ left: `${item.x}%`, top: `${item.y}%`, width: `${item.width}%`, height: `${item.height}%`, fontSize: `${item.fontSize || 11}px` }}>{valueText(value)}</span>
}

function ReceiptOverlay({ data }) {
  if (!data.receiptImages?.length) return null
  return <div className="formal-receipts">{data.receiptImages.slice(0, 2).map(item => <img key={item.id} src={item.processedUrl || item.url} alt={item.name} />)}</div>
}

function ReportHeader({ data, onBack, onPrint, onDone, onGeneratePdf }) {
  const title = data.type === 'marusan' ? '丸産報告書' : '工事完了報告書'
  return <>
    <div className="form-top report-toolbar"><button className="back-link" onClick={onBack}><ArrowLeft size={17} />入力画面へ戻る</button><span className="form-step">帳票プレビュー</span></div>
    <div className="page-header report-page-header"><div><div className="eyebrow">出力確認</div><h1>{title}</h1><p>入力値を台紙上に配置しています。印刷ボタンからPDF保存できます。</p></div><div className="page-header-actions report-actions">{onGeneratePdf && <button className="button secondary" onClick={onGeneratePdf}>Google Slides PDF</button>}<button className="button secondary" onClick={onPrint}><Printer size={16} />印刷/PDF</button><button className="button primary" onClick={onDone}><Check size={16} />完了として記録</button></div></div>
  </>
}

function FormalReport({ data, placements, tags = [], type }) {
  const templatePlacements = placements.filter(item => item.template === type)
  const placementMap = Object.fromEntries(templatePlacements.map(item => [item.sourceKey, item]))
  const background = type === 'marusan' ? './templates/marusan-report.png' : './templates/completion-report.png'
  const keys = type === 'marusan'
    ? ['ms_personInCharge', 'ms_date', 'ms_site', 'ms_am_time', 'ms_pm_time', 'ms_work2', 'ms_work3', 'ms_work4', 'ms_nameL1', 'ms_nameL2', 'ms_nameL3', 'ms_nameR1', 'ms_nameR2', 'ms_nameR3', 'ms_supporters', 'notes']
    : ['toCompany', 'toOffice', 'toPerson', 'workerName', 'occurrence', 'completionStatus', 'supporters', 'workDate', 'siteName', 'orderNo', 'address', 'work2', 'work3', 'work4', 'quantity', 'remarks', 'parkingFee', 'tollMode', 'tollLink', 'materialCost', 'construction1', 'construction2', 'material1', 'material2', 'freeTime', 'diary', 'spray', 'sprayDetail', 'specialMaterial', 'constructionTotal', 'tax', 'totalAmount']
  const builtInKeys = new Set(keys)
  const customKeys = tags.filter(item => item?.template === type && item?.sourceKey?.startsWith('custom-')).map(item => item.sourceKey).filter(key => !builtInKeys.has(key))
  return <article className={`formal-sheet ${type}-formal-sheet`}>
    <img className="template-background" src={background} alt={type === 'marusan' ? '丸産報告書' : '工事完了報告書'} />
    {[...keys, ...customKeys].map(key => <Overlay key={key} item={placementMap[key]} value={getValue(data, key)} />)}
    {type === 'completion' && <ReceiptOverlay data={data} />}
  </article>
}

export default function ReportPreview({ data, records = {}, placements = [], tags = [], back, done, generatePdf }) {
  const grouped = data.bundleId
    ? Object.values(records).filter(item => item.bundleId === data.bundleId && item.type === data.type)
    : []
  const reportRecords = grouped.length ? grouped : [data]
  return <div className="page-wrap report-preview-page"><ReportHeader data={data} onBack={back} onPrint={() => window.print()} onDone={done} onGeneratePdf={generatePdf} />{reportRecords.map((item, index) => <FormalReport key={item.id || index} data={item} placements={placements} tags={tags} type={item.type === 'marusan' ? 'marusan' : 'completion'} />)}</div>
}
