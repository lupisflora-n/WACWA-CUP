import { ArrowLeft, Check, Printer } from 'lucide-react'

function dateParts(data) {
  if (data.type === 'marusan') return `${data.year || ''}年 ${data.month || ''}月 ${data.day || ''}日`
  return data.workDate || ''
}

function multiline(value) {
  return value || ' '
}

function ReportHeader({ data, onBack, onPrint, onDone }) {
  const title = data.type === 'marusan' ? '丸産報告書' : '工事完了報告書'
  return <>
    <div className="form-top report-toolbar"><button className="back-link" onClick={onBack}><ArrowLeft size={17} />入力画面へ戻る</button><span className="form-step">帳票プレビュー</span></div>
    <div className="page-header report-page-header"><div><div className="eyebrow">出力確認</div><h1>{title}</h1><p>入力内容を確認し、印刷画面からPDFとして保存できます。</p></div><div className="page-header-actions report-actions"><button className="button secondary" onClick={onPrint}><Printer size={16} />印刷/PDF</button><button className="button primary" onClick={onDone}><Check size={16} />完了として記録</button></div></div>
  </>
}

function CompletionReport({ data }) {
  const spray = data.spray === 'あり'
  return <article className="report-sheet completion-report">
    <div className="report-title-row"><h2>工事完了報告書</h2><div className="report-meta"><span>提出日</span><strong>{dateParts(data)}</strong></div></div>
    <div className="completion-upper"><div className="recipient-block"><div>御中</div><div className="recipient-value">{data.toCompany || ' '}</div><div>{data.toOffice || ' '}</div><div>{data.toPerson || ' '} 様</div></div><div className="completion-status-block"><div><span>作業者</span><strong>{data.workers?.[0] || ' '}</strong></div><div><span>完了状態</span><strong>{data.completionStatus || ' '}</strong></div><div><span>作業日</span><strong>{dateParts(data)}</strong></div></div></div>
    <div className="report-grid completion-info"><div className="label-cell">日付</div><div className="value-cell">{data.workDate || ' '}</div><div className="label-cell">現場名</div><div className="value-cell">{data.siteName || ' '}</div><div className="label-cell">注文No</div><div className="value-cell">{data.orderNo || ' '}</div><div className="label-cell">住所</div><div className="value-cell">{data.address || ' '}</div></div>
    <div className="report-grid completion-work"><div className="table-head">工事内容</div><div className="table-head quantity-head">数量</div><div className="table-head">備考欄</div><div className="table-cell work-content">{multiline(data.workContent)}</div><div className="table-cell quantity-cell">一式</div><div className="table-cell"> </div></div>
    <div className="completion-time-row"><span>作業時間</span><strong> </strong></div>
    <div className="completion-material-grid"><div><div className="table-head">吹付塗装　（ <span className={spray ? 'circle-selected' : ''}>有</span>　・　<span className={!spray ? 'circle-selected' : ''}>無</span>　）</div><div className="detail-cell">{spray ? multiline(data.sprayDetail) : ' '}</div></div><div><div className="table-head">通常材料以外に材料を使った場合</div><div className="detail-cell">{multiline(data.specialMaterial)}</div></div></div>
    <div className="completion-journal"><div className="table-head">お客様の為に取り組んだこと　現場日誌</div><div className="journal-cell"> </div></div>
    <div className="amount-row"><span>合計</span><strong>{data.total || ' '}</strong><span>消費税</span><strong>{data.tax || ' '}</strong><span>合計額</span><strong> </strong></div>
    {data.receiptImages?.length > 0 && <div className="report-receipts"><div className="table-head">領収書（1枚目を帳票へ添付）</div><div className="receipt-report-grid">{data.receiptImages.map(item => <img key={item.id} src={item.url} alt="領収書" style={{ filter: item.filter === 'bw' ? 'grayscale(1) contrast(1.25)' : item.filter === 'soft' ? 'grayscale(.7) contrast(1.1)' : 'none', transform: `rotate(${item.rotation || 0}deg) scale(${(item.zoom || 100) / 100})`, clipPath: item.crop ? `inset(${item.crop}% ${item.crop}% ${item.crop}% ${item.crop}%)` : undefined }} />)}</div></div>}
  </article>
}

function MarusanReport({ data }) {
  const workRows = data.workSlots || []
  const workers = data.workers || []
  return <article className="report-sheet marusan-report">
    <div className="marusan-topline"><div><span>工事担当名</span><strong>{workers[0] || ' '}</strong><em>殿</em></div><div>提出日： {dateParts(data)}</div></div>
    <h2>作　業　日　報</h2>
    <div className="marusan-date-row"><span>作業日</span><strong>{dateParts(data)}</strong></div>
    <div className="marusan-site-row"><span>現場名及び工事内容</span><strong>{data.siteName || ' '}</strong></div>
    <div className="marusan-section"><div className="marusan-label">作業日の作業内容<br /><small>※具体的に記入</small></div><div className="marusan-columns"><div><div className="table-head">AM {data.amTime || ' '}</div>{workRows.slice(0, 3).map((row, index) => <div className="marusan-line" key={`am-${index}`}>{multiline(row)}</div>)}</div><div><div className="table-head">PM {data.pmTime || ' '}</div>{workRows.slice(3, 6).map((row, index) => <div className="marusan-line" key={`pm-${index}`}>{multiline(row)}</div>)}</div></div></div>
    <div className="marusan-section"><div className="marusan-label">作業員名</div><div className="marusan-columns">{[0, 1].map(column => <div key={column}><div className="table-head">氏　名</div>{workers.slice(column * 3, column * 3 + 3).map((row, index) => <div className="marusan-line" key={`${column}-${index}`}>{multiline(row)}</div>)}</div>)}</div></div>
    <div className="marusan-notes"><div className="marusan-label">連絡事項<br />注意事項<br />明日の作業予定</div><div className="notes-cell">{multiline(data.notes)}</div></div>
    <div className="marusan-company">社　名　　株式会社ＴＲＣ</div>
  </article>
}

export default function ReportPreview({ data, back, done }) {
  return <div className="page-wrap report-preview-page"><ReportHeader data={data} onBack={back} onPrint={() => window.print()} onDone={done} />{data.type === 'marusan' ? <MarusanReport data={data} /> : <CompletionReport data={data} />}</div>
}
