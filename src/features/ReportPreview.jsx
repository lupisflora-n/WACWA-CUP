import { ArrowLeft, Check, Printer } from 'lucide-react'

function printDate(data) {
  if (data.type === 'marusan') return `${data.year || ''}年 ${data.month || ''}月 ${data.day || ''}日`
  return data.workDate || ''
}

function text(value) {
  return value || ''
}

function Overlay({ className = '', children }) {
  return <span className={`template-overlay ${className}`}>{children}</span>
}

function ReportHeader({ data, onBack, onPrint, onDone }) {
  const title = data.type === 'marusan' ? '丸産報告書' : '工事完了報告書'
  return <>
    <div className="form-top report-toolbar"><button className="back-link" onClick={onBack}><ArrowLeft size={17} />入力画面へ戻る</button><span className="form-step">帳票プレビュー</span></div>
    <div className="page-header report-page-header"><div><div className="eyebrow">出力確認</div><h1>{title}</h1><p>正式な台紙に入力内容を重ねて表示しています。印刷/PDFで保存できます。</p></div><div className="page-header-actions report-actions"><button className="button secondary" onClick={onPrint}><Printer size={16} />印刷/PDF</button><button className="button primary" onClick={onDone}><Check size={16} />完了として記録</button></div></div>
  </>
}

function CompletionReport({ data }) {
  const spray = data.spray === 'あり'
  return <article className="formal-sheet completion-formal-sheet">
    <img className="template-background" src="./templates/completion-report.png" alt="工事完了報告書の台紙" />
    <Overlay className="completion-to-company">{text(data.toCompany)}</Overlay>
    <Overlay className="completion-office">{text(data.toOffice)}</Overlay>
    <Overlay className="completion-person">{text(data.toPerson)}</Overlay>
    <Overlay className="completion-worker">{text(data.workers?.[0])}</Overlay>
    <Overlay className="completion-date">{text(data.workDate)}</Overlay>
    <Overlay className="completion-site">{text(data.siteName)}</Overlay>
    <Overlay className="completion-order">{text(data.orderNo)}</Overlay>
    <Overlay className="completion-address">{text(data.address)}</Overlay>
    <Overlay className="completion-work-content">{text(data.workContent)}</Overlay>
    <Overlay className="completion-quantity">一式</Overlay>
    <Overlay className="completion-spray">{spray ? '○ 有' : '有'}　・　{spray ? '無' : '○ 無'}</Overlay>
    {spray && <Overlay className="completion-spray-detail">{text(data.sprayDetail)}</Overlay>}
    <Overlay className="completion-special-material">{text(data.specialMaterial)}</Overlay>
    <Overlay className="completion-total">{text(data.total)}</Overlay>
    <Overlay className="completion-tax">{text(data.tax)}</Overlay>
  </article>
}

function MarusanReport({ data }) {
  const workRows = data.workSlots || []
  const workers = data.workers || []
  return <article className="formal-sheet marusan-formal-sheet">
    <img className="template-background" src="./templates/marusan-report.png" alt="丸産報告書の台紙" />
    <Overlay className="marusan-person">{text(workers[0] || data.personInCharge)}</Overlay>
    <Overlay className="marusan-submit-date">{printDate(data)}</Overlay>
    <Overlay className="marusan-work-date">{printDate(data)}</Overlay>
    <Overlay className="marusan-site">{text(data.siteName)}</Overlay>
    <Overlay className="marusan-am-time">{text(data.amTime)}</Overlay>
    <Overlay className="marusan-pm-time">{text(data.pmTime)}</Overlay>
    {workRows.slice(0, 3).map((row, index) => <Overlay key={`am-${index}`} className={`marusan-am-row row-${index}`}>{text(row)}</Overlay>)}
    {workRows.slice(3, 6).map((row, index) => <Overlay key={`pm-${index}`} className={`marusan-pm-row row-${index}`}>{text(row)}</Overlay>)}
    {workers.slice(0, 3).map((row, index) => <Overlay key={`left-worker-${index}`} className={`marusan-left-worker row-${index}`}>{text(row)}</Overlay>)}
    {workers.slice(3, 6).map((row, index) => <Overlay key={`right-worker-${index}`} className={`marusan-right-worker row-${index}`}>{text(row)}</Overlay>)}
    <Overlay className="marusan-notes">{text(data.notes)}</Overlay>
    <Overlay className="marusan-company">株式会社ＴＲＣ</Overlay>
  </article>
}

export default function ReportPreview({ data, back, done }) {
  return <div className="page-wrap report-preview-page"><ReportHeader data={data} onBack={back} onPrint={() => window.print()} onDone={done} />{data.type === 'marusan' ? <MarusanReport data={data} /> : <CompletionReport data={data} />}</div>
}
