import { useEffect, useState } from 'react'
import {
  Archive, ArrowLeft, ArrowRight, Check, ChevronDown, ClipboardList, Cloud,
  Copy, Download, FileCheck2, FileText, LayoutDashboard, Menu, MoreHorizontal,
  Plus, Printer, ReceiptText, Save, Settings2, ShieldCheck, SlidersHorizontal,
  Sparkles, Tags, Trash2, Upload, WandSparkles,
} from 'lucide-react'
import { tagRegistry, templateConfig } from './config/template-config'
import ReceiptEditor from './features/ReceiptEditor'
import ReportPreview from './features/ReportPreview'
import './styles-operations.css'

const storageKey = 'oshigoto-app-records-v2'
const legacyStorageKey = 'oshigoto-prototype-records'
const profileKey = 'oshigoto-app-profile'
const tagStorageKey = 'oshigoto-app-tag-registry-v1'

const completionSeed = {
  type: 'completion', status: 'draft', siteName: '', orderNo: '', workDate: '', address: '',
  toCompany: '', toOffice: '', toPerson: '', workContent: '', total: '', tax: '',
  spray: 'なし', sprayDetail: '', specialMaterial: '', completionStatus: '完了', receiptImages: [],
}

const marusanSeed = {
  type: 'marusan', status: 'draft', siteName: '', personInCharge: '',
  year: '', month: '', day: '', amTime: '', pmTime: '',
  workSlots: ['', '', '', '', '', ''], workers: ['', '', '', '', '', ''], notes: '',
}

function clone(value) {
  return JSON.parse(JSON.stringify(value))
}

function loadTagRegistry() {
  try {
    const raw = localStorage.getItem(tagStorageKey)
    const saved = raw ? JSON.parse(raw) : null
    if (!Array.isArray(saved)) return clone(tagRegistry)
    const savedBySourceKey = Object.fromEntries(saved.map(item => [item.sourceKey, item]))
    return tagRegistry.map(item => ({ ...item, tag: savedBySourceKey[item.sourceKey]?.tag || item.tag }))
  } catch {
    return clone(tagRegistry)
  }
}

function normalizeRecord(record) {
  const seed = record.type === 'marusan' ? marusanSeed : completionSeed
  const normalized = { ...clone(seed), ...record }
  if (normalized.type === 'marusan') {
    normalized.workSlots = Array.from({ length: 6 }, (_, index) => normalized.workSlots?.[index] || '')
    normalized.workers = Array.from({ length: 6 }, (_, index) => normalized.workers?.[index] || '')
  }
  normalized.receiptImages = normalized.receiptImages || []
  return normalized
}

function loadRecords() {
  try {
    const raw = localStorage.getItem(storageKey) || localStorage.getItem(legacyStorageKey)
    const parsed = raw ? JSON.parse(raw) : {}
    if (Array.isArray(parsed)) return Object.fromEntries(parsed.map(item => [item.id, normalizeRecord(item)]))
    return Object.fromEntries(Object.entries(parsed).map(([id, item]) => [id, normalizeRecord({ ...item, id })]))
  } catch {
    return {}
  }
}

function persistRecords(records) {
  localStorage.setItem(storageKey, JSON.stringify(records))
}

function nowLabel() {
  return new Date().toLocaleString('ja-JP', { hour12: false })
}

function createRecord(type) {
  const seed = type === 'marusan' ? marusanSeed : completionSeed
  return { ...clone(seed), id: `${type}-${Date.now()}`, updatedAt: nowLabel() }
}

function lockFirstWorker(record) {
  if (record.type !== 'marusan' || !record.workers?.[0]?.trim()) return record
  return { ...record, firstWorkerLocked: true }
}

function validateRecord(record) {
  const errors = []
  const requireValue = (key, label, value = record[key]) => { if (!String(value || '').trim()) errors.push({ key, label, message: `${label}を入力してください` }) }

  if (record.type === 'completion') {
    requireValue('toCompany', '宛先会社')
    requireValue('workDate', '作業日')
    requireValue('siteName', '現場名')
    requireValue('workContent', '工事内容')
    if (!/^\d+(\.\d+)?$/.test(String(record.total || ''))) errors.push({ key: 'total', label: '合計金額', message: '合計金額は数値で入力してください' })
    if (!/^\d+(\.\d+)?$/.test(String(record.tax || ''))) errors.push({ key: 'tax', label: '消費税', message: '消費税は数値で入力してください' })
    if (record.spray === 'あり') requireValue('sprayDetail', '吹付詳細')
  } else {
    requireValue('siteName', '現場名')
    requireValue('year', '年')
    requireValue('month', '月')
    requireValue('day', '日')
    requireValue('workers[0]', '作業者1', record.workers?.[0])
    const year = Number(record.year)
    const month = Number(record.month)
    const day = Number(record.day)
    if (!Number.isInteger(year) || year < 2000 || year > 2100) errors.push({ key: 'year', label: '年', message: '年は西暦4桁で入力してください' })
    if (!Number.isInteger(month) || month < 1 || month > 12) errors.push({ key: 'month', label: '月', message: '月は1から12で入力してください' })
    if (!Number.isInteger(day) || day < 1 || day > 31) errors.push({ key: 'day', label: '日', message: '日は1から31で入力してください' })
  }
  return errors
}

function App() {
  const [page, setPage] = useState('home')
  const [records, setRecords] = useState(loadRecords)
  const [activeId, setActiveId] = useState(null)
  const [notice, setNotice] = useState('')
  const [errors, setErrors] = useState([])
  const [menuOpen, setMenuOpen] = useState(false)
  const [profile, setProfile] = useState(() => localStorage.getItem(profileKey) || '富田')
  const [tags, setTags] = useState(loadTagRegistry)

  useEffect(() => {
    if (!notice) return undefined
    const timer = setTimeout(() => setNotice(''), 3600)
    return () => clearTimeout(timer)
  }, [notice])

  const activeForm = activeId ? records[activeId] : null
  const draftCount = Object.values(records).filter(record => record.status === 'draft').length
  const processingCount = Object.values(records).filter(record => ['ready', 'processing'].includes(record.status)).length

  const updateRecord = record => {
    const normalized = normalizeRecord(record)
    setRecords(previous => {
      const next = { ...previous, [normalized.id]: normalized }
      persistRecords(next)
      return next
    })
    setErrors([])
  }

  const openForm = (type, existing) => {
    const record = normalizeRecord(existing || createRecord(type))
    if (!existing) updateRecord(record)
    setActiveId(record.id)
    setPage(`${type}-form`)
    setErrors([])
    setMenuOpen(false)
  }

  const save = () => {
    if (!activeForm) return
    const saved = lockFirstWorker({ ...activeForm, status: 'draft', updatedAt: nowLabel() })
    updateRecord(saved)
    setNotice('下書きを保存しました')
  }

  const complete = () => {
    if (!activeForm) return
    const next = lockFirstWorker(activeForm)
    const validationErrors = validateRecord(next)
    if (validationErrors.length) {
      setErrors(validationErrors)
      setNotice('入力内容を確認してください')
      return
    }
    updateRecord({ ...next, status: 'ready', updatedAt: nowLabel(), pdfJob: { status: 'queued', attempts: next.pdfJob?.attempts || 0, createdAt: nowLabel() } })
    setPage('report-preview')
    setNotice('帳票プレビューを作成しました。内容を確認してください。')
  }

  const completePreview = () => {
    if (!activeForm) return
    updateRecord({ ...activeForm, status: 'completed', updatedAt: nowLabel(), pdfJob: { ...(activeForm.pdfJob || {}), status: 'completed', completedAt: nowLabel() } })
    setPage('jobs')
    setNotice('完了として記録しました。印刷/PDF保存も利用できます。')
  }

  const openJob = record => {
    setActiveId(record.id)
    if (['ready', 'processing', 'completed', 'failed'].includes(record.status)) setPage('report-preview')
    else setPage(`${record.type}-form`)
  }

  const retryJob = record => {
    const next = { ...record, status: 'ready', updatedAt: nowLabel(), pdfJob: { ...(record.pdfJob || {}), status: 'queued', attempts: (record.pdfJob?.attempts || 0) + 1 } }
    updateRecord(next)
    setActiveId(record.id)
    setPage('report-preview')
    setNotice('PDF作成を再試行できる状態に戻しました')
  }

  const exportBackup = () => {
    const blob = new Blob([JSON.stringify({ exportedAt: new Date().toISOString(), records, profile }, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `oshigoto-backup-${new Date().toISOString().slice(0, 10)}.json`
    anchor.click()
    URL.revokeObjectURL(url)
    setNotice('バックアップを書き出しました')
  }

  const importBackup = file => {
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result))
        const imported = parsed.records || parsed
        const next = Object.fromEntries(Object.entries(imported).map(([id, item]) => [id, normalizeRecord({ ...item, id })]))
        setRecords(next)
        persistRecords(next)
        if (parsed.profile) { setProfile(parsed.profile); localStorage.setItem(profileKey, parsed.profile) }
        setNotice('バックアップを復元しました')
      } catch {
        setNotice('バックアップを読み込めませんでした')
      }
    }
    reader.readAsText(file)
  }

  const clearLocalData = () => {
    if (!window.confirm('この端末に保存した下書きを削除しますか？')) return
    setRecords({})
    localStorage.removeItem(storageKey)
    localStorage.removeItem(legacyStorageKey)
    setActiveId(null)
    setPage('home')
    setNotice('この端末の下書きを削除しました')
  }

  const updateProfile = value => {
    setProfile(value)
    localStorage.setItem(profileKey, value)
  }

  const updateTag = (sourceKey, value) => {
    setTags(current => {
      const next = current.map(item => item.sourceKey === sourceKey ? { ...item, tag: value } : item)
      localStorage.setItem(tagStorageKey, JSON.stringify(next))
      return next
    })
  }

  const resetTags = () => {
    const next = clone(tagRegistry)
    setTags(next)
    localStorage.setItem(tagStorageKey, JSON.stringify(next))
    setNotice('タグを初期設定に戻しました')
  }

  const copyTag = async tag => {
    try {
      await navigator.clipboard.writeText(tag)
      setNotice(`${tag} をコピーしました`)
    } catch {
      setNotice('タグのコピーに失敗しました')
    }
  }

  return <div className="app-shell">
    <aside className={`sidebar ${menuOpen ? 'is-open' : ''}`}>
      <div className="brand-lockup"><div className="brand-mark"><Sparkles size={18} /></div><div><strong>オシゴト</strong><span>帳票ワークスペース</span></div></div>
      <div className="environment-pill"><i />サンプル環境</div>
      <nav>
        <NavButton active={page === 'home'} onClick={() => setPage('home')} icon={<LayoutDashboard size={18} />}>ホーム</NavButton>
        <NavButton active={page === 'drafts'} onClick={() => setPage('drafts')} icon={<Archive size={18} />}>下書き <b>{draftCount}</b></NavButton>
        <NavButton active={page === 'jobs'} onClick={() => setPage('jobs')} icon={<Cloud size={18} />}>PDF処理</NavButton>
        <hr />
        <NavButton active={page === 'settings'} onClick={() => setPage('settings')} icon={<Settings2 size={18} />}>設定</NavButton>
        <NavButton active={page === 'tag-settings'} onClick={() => setPage('tag-settings')} icon={<Tags size={18} />}>タグ調整</NavButton>
      </nav>
      <div className="sidebar-footer"><div className="avatar">{profile.slice(0, 1) || 'K'}</div><div><strong>{profile || '未設定'}</strong><span>管理者・試作ユーザー</span></div><ChevronDown size={16} /></div>
    </aside>
    <main className="main-content">
      <header className="topbar"><button className="icon-button mobile-menu" aria-label="メニュー" onClick={() => setMenuOpen(!menuOpen)}><Menu size={20} /></button><div className="breadcrumb">オシゴトアプリ <ChevronDown size={15} /></div><div className="topbar-actions"><span className="sync-state"><i />ローカル保存</span><button className="button secondary tag-shortcut" aria-label="タグ調整" title="タグ調整" onClick={() => setPage('tag-settings')}><Tags size={17} /><span>タグ調整</span></button><button className="icon-button" aria-label="その他" onClick={() => setMenuOpen(!menuOpen)}><MoreHorizontal size={20} /></button></div></header>
      {notice && <div className="toast" role="status"><Check size={16} />{notice}</div>}
      {page === 'home' && <Home create={openForm} go={setPage} draftCount={draftCount} processingCount={processingCount} />}
      {page === 'drafts' && <Drafts records={records} open={openForm} />}
      {page === 'jobs' && <Jobs records={records} back={() => setPage('home')} open={openJob} retry={retryJob} />}
        {page === 'settings' && <SettingsPage records={records} profile={profile} setProfile={updateProfile} exportBackup={exportBackup} importBackup={importBackup} clearLocalData={clearLocalData} copyTag={copyTag} />}
       {page === 'tag-settings' && <TagEditorPage tags={tags} updateTag={updateTag} resetTags={resetTags} copyTag={copyTag} back={() => setPage('settings')} />}
      {page === 'completion-form' && activeForm && <CompletionForm data={activeForm} update={updateRecord} back={() => setPage('home')} save={save} complete={complete} receipt={() => setPage('receipt')} errors={errors} />}
      {page === 'marusan-form' && activeForm && <MarusanForm data={activeForm} update={updateRecord} back={() => setPage('home')} save={save} complete={complete} errors={errors} />}
      {page === 'receipt' && activeForm && <ReceiptEditor data={activeForm} update={updateRecord} back={() => setPage(`${activeForm.type}-form`)} done={() => { setPage(`${activeForm.type}-form`); setNotice('領収書を保存しました') }} />}
      {page === 'report-preview' && activeForm && <ReportPreview data={activeForm} back={() => setPage(`${activeForm.type}-form`)} done={completePreview} />}
    </main>
  </div>
}

function NavButton({ active, onClick, icon, children }) { return <button className={`nav-item ${active ? 'active' : ''}`} onClick={onClick}>{icon}{children}</button> }

function Header({ eyebrow, title, text, action }) {
  return <div className="page-header"><div><div className="eyebrow">{eyebrow}</div><h1>{title}</h1><p>{text}</p></div><div className="page-header-actions">{action}<button className="button secondary print-button" onClick={() => window.print()} title="印刷またはPDF保存"><Printer size={16} />印刷/PDF</button></div></div>
}

function Home({ create, go, draftCount, processingCount }) {
  return <div className="page-wrap"><Header eyebrow="今日の仕事" title="おつかれさまです" text="現場の記録から帳票作成まで、ここから進められます。" action={<button className="button primary" onClick={() => create('completion')}><Plus size={17} />新しい報告書</button>} /><section className="hero-band"><div><div className="hero-kicker"><Sparkles size={15} />現場の流れをひとつに</div><h2>入力した内容を、<br />そのまま帳票へ。</h2><p>下書き保存と処理状況が見えるので、現場から事務所まで迷いません。</p></div><div className="hero-orbit"><FileCheck2 size={54} /><span>PDF</span></div></section><div className="section-heading"><h2>すぐに作成</h2><span>よく使う帳票を選択してください</span></div><div className="create-grid"><CreateCard tone="teal" icon={<FileText size={23} />} title="工事完了報告書" text="現場・工事内容・金額・領収書" onClick={() => create('completion')} /><CreateCard tone="orange" icon={<ClipboardList size={23} />} title="丸産報告書" text="作業日・AM/PM・作業者" onClick={() => create('marusan')} /></div><div className="dashboard-grid"><Stat icon={<Archive size={17} />} title="下書き" value={String(draftCount)} unit="件" text="続きを入力する" onClick={() => go('drafts')} /><Stat icon={<Cloud size={17} />} title="PDF処理" value={String(processingCount)} unit="件" text="作成状況を確認する" onClick={() => go('jobs')} /><Stat quiet icon={<ShieldCheck size={17} />} title="保存状態" value="安定" text="この端末に保存" /></div></div>
}

function CreateCard({ tone, icon, title, text, onClick }) { return <button className={`create-card ${tone}`} onClick={onClick}><div className="card-icon">{icon}</div><div><strong>{title}</strong><span>{text}</span></div><ArrowRight size={19} /></button> }
function Stat({ icon, title, value, unit, text, onClick, quiet }) { return <button className={`stat-card ${quiet ? 'quiet' : ''}`} onClick={onClick}><div className="stat-label">{icon}{title}</div><strong>{value}{unit && <small>{unit}</small>}</strong><span>{text}</span><ArrowRight size={17} /></button> }

function Drafts({ records, open }) {
  const list = Object.values(records).filter(record => record.status === 'draft')
  return <div className="page-wrap"><Header eyebrow="作成中の書類" title="下書き一覧" text="入力途中の書類はここから再開できます。" action={<button className="button primary" onClick={() => open('completion')}><Plus size={17} />新規作成</button>} /><div className="filter-row"><button className="filter-chip active">すべて <b>{list.length}</b></button></div><div className="record-list">{list.length ? list.map(item => <RecordRow item={item} key={item.id} onClick={() => open(item.type, item)} />) : <Empty text="下書きはありません" />}</div></div>
}

function statusLabel(status) {
  return ({ draft: '下書き', ready: '確認待ち', processing: '作成中', completed: '作成済み', failed: '失敗・再試行' })[status] || '下書き'
}

function RecordRow({ item, onClick }) {
  const marusan = item.type === 'marusan'
  return <button className="record-row" onClick={onClick}><div className={`record-type ${marusan ? 'orange' : 'teal'}`}>{marusan ? <ClipboardList size={19} /> : <FileText size={19} />}</div><div className="record-main"><strong>{item.siteName || '未入力の書類'}</strong><span>{marusan ? '丸産報告書' : '工事完了報告書'} <i>・</i> {item.updatedAt || '保存済み'}</span></div><span className={`status-label ${item.status || 'draft'}`}>{statusLabel(item.status)}</span><ArrowRight size={18} /></button>
}

function Empty({ text = '対象の書類はありません' }) { return <div className="empty-state"><Archive size={28} /><strong>{text}</strong><span>新しい報告書を作成すると、ここに表示されます。</span></div> }

function Jobs({ records, back, open, retry }) {
  const jobs = Object.values(records).filter(record => ['ready', 'processing', 'completed', 'failed'].includes(record.status))
  return <div className="page-wrap"><Header eyebrow="処理状況" title="PDF処理" text="帳票の確認、印刷/PDF保存、再試行をここから行えます。" action={<button className="button secondary" onClick={back}><ArrowLeft size={17} />ホームへ戻る</button>} /><div className="job-summary"><div><span>現在の処理</span><strong>{jobs.length ? `${jobs.length}件を表示中` : '処理中の書類はありません'}</strong></div><div className="job-spinner"><Cloud size={22} /></div></div><div className="record-list">{jobs.length ? jobs.map(item => <div className="job-row" key={item.id}><RecordRow item={item} onClick={() => open(item)} />{item.status === 'failed' && <button className="button secondary retry-button" onClick={() => retry(item)}>再試行</button>}</div>) : <Empty text="PDF処理はありません" />}</div><div className="info-callout"><Sparkles size={18} /><div><strong>サンプル環境で動作中</strong><span>現在はこの端末に保存しています。本番のDrive・Sheets接続は次の移行段階で追加します。</span></div></div></div>
}

function Field({ label, required, hint, children, className = '' }) { return <label className={`field ${className}`}><span className="field-label">{label}{required && <em>必須</em>}</span>{children}{hint && <small>{hint}</small>}</label> }
function Input({ value, onChange, type = 'text', placeholder, disabled = false }) { return <input className="text-input" type={type} value={value ?? ''} placeholder={placeholder} disabled={disabled} onChange={e => onChange(e.target.value)} /> }
function Area({ value, onChange, rows = 4, placeholder }) { return <textarea className="text-input textarea" rows={rows} value={value ?? ''} placeholder={placeholder} onChange={e => onChange(e.target.value)} /> }

function FormShell({ eyebrow, title, text, back, save, complete, step, children, errors }) {
  return <div className="page-wrap form-page"><div className="form-top"><button className="back-link" onClick={back}><ArrowLeft size={17} />一覧へ戻る</button><span className="form-step">{step}</span></div><Header eyebrow={eyebrow} title={title} text={text} />{errors.length > 0 && <div className="form-errors" role="alert"><strong>入力内容を確認してください</strong><ul>{errors.map(error => <li key={`${error.key}-${error.message}`}>{error.message}</li>)}</ul></div>}<div className="form-layout"><div className="form-body">{children}</div><aside className="form-side"><div className="side-card"><div className="side-icon"><Save size={18} /></div><strong>下書き保存</strong><span>入力途中でも、いつでも保存できます。</span><button className="button secondary full" onClick={save}>保存する</button></div><div className="side-card pale"><div className="side-icon"><FileCheck2 size={18} /></div><strong>確認してPDF作成</strong><span>入力内容を確認してから帳票を作成します。</span><button className="button primary full" onClick={complete}>確認してPDF作成</button></div></aside></div></div>
}

function CompletionForm({ data, update, back, save, complete, receipt, errors }) {
  const patch = (key, value) => update({ ...data, [key]: value })
  return <FormShell eyebrow="工事完了報告書" title="工事完了報告書を作成" text="現場の内容を入力してください。長い文章は枠に合わせて自動で折り返されます。" back={back} save={save} complete={complete} step="01 / 02 基本情報" errors={errors}><Section title="基本情報" note="書類の宛先と現場"><div className="form-grid two"><Field label="御中" required><Input value={data.toCompany} onChange={v => patch('toCompany', v)} placeholder="会社名" /></Field><Field label="事業所"><Input value={data.toOffice} onChange={v => patch('toOffice', v)} placeholder="事業所名" /></Field><Field label="担当者"><Input value={data.toPerson} onChange={v => patch('toPerson', v)} placeholder="担当者名" /></Field><Field label="日付" required><Input type="date" value={data.workDate} onChange={v => patch('workDate', v)} /></Field><Field label="現場名" required><Input value={data.siteName} onChange={v => patch('siteName', v)} placeholder="現場名" /></Field><Field label="注文No"><Input value={data.orderNo} onChange={v => patch('orderNo', v)} placeholder="注文番号" /></Field><Field label="住所" className="span-two"><Input value={data.address} onChange={v => patch('address', v)} placeholder="住所" /></Field></div></Section><Section title="工事内容" note="改行はPDFでも保持されます"><Field label="工事内容" required><Area value={data.workContent} onChange={v => patch('workContent', v)} rows={5} placeholder="工事内容を入力" /></Field><div className="inline-note"><Check size={15} />数量は先頭行のみ「一式」で固定。備考欄は空欄で出力します。</div></Section><Section title="金額" note="駐車場代・高速代・材料代は含めません"><div className="form-grid two"><Field label="合計" required hint="税抜の金額を入力"><Input type="number" value={data.total} onChange={v => update({ ...data, total: v, tax: v ? String(Math.floor(Number(v) * 0.1)) : '' })} placeholder="金額" /></Field><Field label="消費税" required hint="10%を自動計算・手動編集可"><Input type="number" value={data.tax} onChange={v => patch('tax', v)} placeholder="自動計算" /></Field></div></Section><Section title="吹付塗装" note="PDF上で選択項目に丸印を表示"><Field label="吹付塗装"><Segment value={data.spray} options={['あり', 'なし']} onChange={v => patch('spray', v)} /></Field>{data.spray === 'あり' && <Field label="吹付塗装詳細" required><Area value={data.sprayDetail} onChange={v => patch('sprayDetail', v)} rows={4} placeholder="吹付塗装の詳細を入力" /></Field>}<Field label="通常材料以外に材料を使った場合"><Area value={data.specialMaterial} onChange={v => patch('specialMaterial', v)} rows={3} placeholder="使用した材料を入力" /></Field><Field label="完了"><Segment value={data.completionStatus} options={['完了', '未完']} onChange={v => patch('completionStatus', v)} /></Field></Section><Section title="領収書" note="任意・複数枚対応"><button className="receipt-launch" onClick={receipt} type="button"><div className="receipt-icon"><ReceiptText size={22} /></div><div><strong>{data.receiptImages?.length ? `${data.receiptImages.length}枚の領収書を確認` : '領収書を追加・加工'}</strong><span>撮影・画像選択、トリミング、白黒化</span></div><ArrowRight size={18} /></button></Section></FormShell>
}

function Section({ title, note, children }) { return <div className="form-section"><div className="form-section-title"><span>{title}</span><small>{note}</small></div>{children}</div> }
function Segment({ value, options, onChange }) { return <div className="segmented">{options.map(option => <button type="button" key={option} className={value === option ? 'selected' : ''} onClick={() => onChange(option)}>{option}</button>)}</div> }

function MarusanForm({ data, update, back, save, complete, errors }) {
  const patch = (key, value) => update({ ...data, [key]: value })
  const arrayPatch = (key, index, value) => { const next = [...data[key]]; next[index] = value; update({ ...data, [key]: next }) }
  return <FormShell eyebrow="丸産報告書" title="丸産報告書を作成" text="作業日、時間帯、作業内容、作業者を入力してください。" back={back} save={save} complete={complete} step="01 / 02 作業日報" errors={errors}><Section title="作業情報" note="会社名は固定です"><div className="fixed-company"><ShieldCheck size={17} /><span>株式会社ＴＲＣ</span><small>固定</small></div><div className="form-grid two"><Field label="工事担当名"><Input value={data.personInCharge} onChange={v => patch('personInCharge', v)} placeholder="担当者名" /></Field><Field label="現場名及び工事内容" required><Input value={data.siteName} onChange={v => patch('siteName', v)} placeholder="現場名・工事内容" /></Field><Field label="年" required><Input type="number" value={data.year} onChange={v => patch('year', v)} placeholder="西暦" /></Field><Field label="月" required><Input type="number" value={data.month} onChange={v => patch('month', v)} placeholder="月" /></Field><Field label="日" required><Input type="number" value={data.day} onChange={v => patch('day', v)} placeholder="日" /></Field></div></Section><Section title="作業日の作業内容" note="AM / PMそれぞれ3行"><div className="form-grid two"><Field label="AM"><Input value={data.amTime} onChange={v => patch('amTime', v)} placeholder="作業時間" /></Field><Field label="PM"><Input value={data.pmTime} onChange={v => patch('pmTime', v)} placeholder="作業時間" /></Field></div><div className="repeat-fields">{data.workSlots.map((value, index) => <Field key={index} label={`${index < 3 ? 'AM' : 'PM'} ${index % 3 + 1}`}><Input value={value} onChange={v => arrayPatch('workSlots', index, v)} placeholder="作業内容" /></Field>)}</div></Section><Section title="作業員名" note={data.firstWorkerLocked ? '1行目は保存済みの本人として固定されています' : '保存すると1行目が本人として固定されます'}><div className="repeat-fields">{data.workers.map((value, index) => <Field key={index} label={`氏名 ${index + 1}`}><Input value={value} disabled={index === 0 && data.firstWorkerLocked} onChange={v => arrayPatch('workers', index, v)} placeholder={index === 0 ? '本人の名前' : '作業員名'} /></Field>)}</div></Section><Section title="連絡事項・注意事項・明日の作業予定" note="改行はPDFでも保持されます"><Field label="連絡事項・注意事項・明日の作業予定"><Area value={data.notes} onChange={v => patch('notes', v)} rows={5} placeholder="必要事項を入力" /></Field></Section></FormShell>
}

function TagEditorPage({ tags, updateTag, resetTags, copyTag, back }) {
  return <div className="page-wrap"><div className="form-top"><button className="back-link" onClick={back}><ArrowLeft size={17} />設定へ戻る</button><span className="form-step">タグ管理</span></div><Header eyebrow="帳票テンプレート" title="タグ調整" text="Googleスライドのタグを貼り替え、端末に保存できます。" /><div className="info-callout"><Tags size={18} /><div><strong>既存タグを優先して引き継ぎます</strong><span>現行アプリ由来の項目はキーを保持し、新規項目はPDFの項目名に対応したタグを用意しています。</span></div></div><div className="config-preview tag-editor-panel"><div className="section-heading"><div><h2>タグ台帳</h2><span>変更は入力ごとにこの端末へ保存されます</span></div><button className="button secondary tag-reset" onClick={resetTags}>初期設定に戻す</button></div><div className="tag-list">{tags.map(item => <div className="tag-row" key={item.sourceKey}><div><strong>{item.formName}</strong><span>{item.sourceKey} ・ {item.origin}</span></div><input className="tag-edit-input" aria-label={`${item.formName}のタグ`} value={item.tag} onChange={event => updateTag(item.sourceKey, event.target.value)} /><button className="icon-button tag-copy" title="タグをコピー" aria-label={`${item.tag}をコピー`} onClick={() => copyTag(item.tag)}><Copy size={16} /></button></div>)}</div><p className="tag-help">Googleスライド側のタグを確認したら、該当欄へ貼り付けて保存してください。</p></div></div>
}

function SettingsPage({ records, profile, setProfile, exportBackup, importBackup, clearLocalData, copyTag }) {
  return <div className="page-wrap"><Header eyebrow="運用・管理" title="設定" text="帳票と保存データの運用設定を管理します。" /><div className="settings-grid"><Setting icon={<SlidersHorizontal size={20} />} title="帳票レイアウト" text="PDFの枠・位置・文字設定を管理" tone="teal" /><Setting icon={<ShieldCheck size={20} />} title="ユーザーと権限" text="管理者・利用者・閲覧者を管理" tone="orange" /><Setting icon={<WandSparkles size={20} />} title="マスターデータ" text="会社名・材料・交通費を管理" tone="blue" /></div><div className="settings-tool"><div className="section-heading"><h2>本人設定</h2><span>丸産報告書の1行目に使います</span></div><Field label="作業者名"><Input value={profile} onChange={setProfile} /></Field></div><div className="settings-tool"><div className="section-heading"><h2>端末データのバックアップ</h2><span>{Object.keys(records).length}件</span></div><p>端末を変える前に書き出し、復元できます。Drive接続後も緊急時の退避として利用します。</p><div className="settings-tool-actions"><button className="button secondary" onClick={exportBackup}><Download size={16} />バックアップを書き出す</button><label className="button secondary"><Upload size={16} />バックアップを復元<input className="settings-file-input" type="file" accept="application/json" onChange={event => importBackup(event.target.files?.[0])} /></label><button className="button danger" onClick={clearLocalData}><Trash2 size={16} />端末データを削除</button></div></div><div className="config-preview"><div className="section-heading"><h2>タグ台帳</h2><span>既存項目は引き継ぎ、新規項目はPDF名を採用</span></div><div className="tag-list">{tagRegistry.map(item => <div className="tag-row" key={item.tag}><div><strong>{item.formName}</strong><span>{item.sourceKey} ・ {item.origin}</span></div><code>{item.tag}</code><button className="icon-button tag-copy" title="タグをコピー" aria-label={`${item.tag}をコピー`} onClick={() => copyTag(item.tag)}><Copy size={16} /></button></div>)}</div></div><div className="config-preview"><div className="section-heading"><h2>現在のレイアウト設定</h2><span>コードと履歴から分離して調整できます</span></div><div className="config-list">{Object.values(templateConfig).map(config => <div className="config-row" key={config.label}><strong>{config.label}</strong><span>{config.templateVersion || config.source}</span><span>{Object.keys(config.fields || {}).length ? `${Object.keys(config.fields).length}項目` : '添付ルール'}</span></div>)}</div></div><div className="info-callout"><Settings2 size={18} /><div><strong>レイアウト調整は次の段階で有効化します</strong><span>配置設定は帳票本体から分離済みです。最終的な枠位置と文字サイズをここから変更できるようにします。</span></div></div></div>
}

function Setting({ icon, title, text, tone }) { return <div className="settings-card"><div className={`settings-card-icon ${tone}`}>{icon}</div><div><strong>{title}</strong><span>{text}</span></div><em>準備中</em></div> }

export default App
