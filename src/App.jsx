import { useEffect, useRef, useState } from 'react'
import {
  Archive, ArrowLeft, ArrowRight, Check, ChevronDown, ClipboardList, Cloud,
  Copy, Download, FileCheck2, FileText, LayoutDashboard, Menu, MoreHorizontal,
  Plus, Printer, ReceiptText, Save, Settings2, ShieldCheck, SlidersHorizontal,
  Sparkles, Tags, Trash2, Upload, WandSparkles,
} from 'lucide-react'
import { tagPlacementDefaults, tagRegistry, templateConfig } from './config/template-config'
import ReceiptEditor from './features/ReceiptEditor'
import ReportPreview from './features/ReportPreview'
import { isAppsScriptConfigured, requestSlidesPdf } from './integrations/pdf-provider'
import { isSharedStorageConfigured, requestSharedStorage } from './integrations/shared-storage'
import { getGoogleIdToken, getGoogleProfile, isGoogleAuthConfigured, loadGoogleIdentity, renderGoogleButton } from './integrations/google-auth'
import './styles-operations.css'

const storageKey = 'oshigoto-app-records-v2'
const legacyStorageKey = 'oshigoto-prototype-records'
const profileKey = 'oshigoto-app-profile'
const tagStorageKey = 'oshigoto-app-tag-registry-v1'
const placementStorageKey = 'oshigoto-app-tag-placements-v1'
const configHistoryKey = 'oshigoto-app-config-history-v1'

const completionSeed = {
  type: 'completion', status: 'draft', siteName: '', orderNo: '', workDate: '', address: '',
  workerName: '', toCompany: '', toOffice: '', toPerson: '', occurrence: '1回目',
  completionStatus: '完了', supporters: [], parkingFee: '', receiptImages: [],
  tollMode: '片道', tollLink: 'https://www.driveplaza.com/dp/SearchTop', materialCost: '',
  construction1: '', construction2: '', material1: '', material2: '',
  free1: '', free2: '', free3: '', freeTime: '', free4: '', diary: '',
  workContent: '', total: '', tax: '', spray: 'なし', sprayDetail: '', specialMaterial: '',
}

const marusanSeed = {
  type: 'marusan', status: 'draft', siteName: '', personInCharge: '',
  year: '', month: '', day: '', amTime: '', pmTime: '',
  workSlots: ['', '', '', '', '', ''], workers: ['', '', '', '', '', ''], notes: '',
}

const referenceCompletionFixture = {
  ...completionSeed,
  id: 'fixture-completion-reference', status: 'ready',
  workerName: '大西 和哉', occurrence: '1回目', completionStatus: '未完',
  supporters: ['菊', '笠'], parkingFee: '￥700ー', tollMode: '', materialCost: '',
  toCompany: 'AHC', toOffice: '神奈川メゾン', toPerson: '武田', workDate: '2026-07-21',
  siteName: '鈴木正明邸', orderNo: 'RN40214', address: '横浜市泉区中田西1-11',
  workContent: '補修工事', freeTime: '16:00－18:00', diary: '※1回目', total: '', tax: '',
}

const referenceMarusanFixture = {
  ...marusanSeed,
  id: 'fixture-marusan-reference', status: 'ready',
  ms_personInCharge: '丸産技研', ms_date: '2026/03/03', ms_site: '西野邸',
  ms_am_time: '９：００', ms_pm_time: '１４：００',
  ms_work2: '窓カウンター劣化塗装、床剥がれ', ms_work3: '', ms_work4: '',
  workers: ['大西', '', '', '', '', ''],
  personInCharge: '早川アキ', submittedAt: '2026/03/03',
}

function clone(value) {
  return JSON.parse(JSON.stringify(value))
}

function addConfigHistory(entry) {
  try {
    const current = JSON.parse(localStorage.getItem(configHistoryKey) || '[]')
    const next = [{ ...entry, createdAt: new Date().toISOString() }, ...current].slice(0, 50)
    localStorage.setItem(configHistoryKey, JSON.stringify(next))
  } catch { /* 設定履歴は本体保存を妨げない */ }
}

function loadTagRegistry() {
  try {
    const raw = localStorage.getItem(tagStorageKey)
    const saved = raw ? JSON.parse(raw) : null
    if (!Array.isArray(saved)) return clone(tagRegistry)
    const savedBySourceKey = Object.fromEntries(saved.map(item => [item.sourceKey, item]))
    const merged = tagRegistry.map(item => {
      const savedItem = savedBySourceKey[item.sourceKey]
      if (!savedItem) return item
      return {
        ...item,
        formName: savedItem.formName ?? item.formName,
        tag: savedItem.tag ?? item.tag,
      }
    })
    const baseKeys = new Set(tagRegistry.map(item => item.sourceKey))
    return [...merged, ...saved.filter(item => item?.sourceKey && !baseKeys.has(item.sourceKey))]
  } catch {
    return clone(tagRegistry)
  }
}

function loadTagPlacements() {
  try {
    const raw = localStorage.getItem(placementStorageKey)
    const saved = raw ? JSON.parse(raw) : null
    if (!Array.isArray(saved)) return clone(tagPlacementDefaults)
    const savedByKey = Object.fromEntries(saved.map(item => [`${item.template}:${item.sourceKey}`, item]))
    const merged = tagPlacementDefaults.map(item => savedByKey[`${item.template}:${item.sourceKey}`] ? { ...item, ...savedByKey[`${item.template}:${item.sourceKey}`] } : item)
    const baseKeys = new Set(tagPlacementDefaults.map(item => `${item.template}:${item.sourceKey}`))
    return [...merged, ...saved.filter(item => item?.template && item?.sourceKey && !baseKeys.has(`${item.template}:${item.sourceKey}`))]
  } catch {
    return clone(tagPlacementDefaults)
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
  const fixture = new URLSearchParams(window.location.search).get('fixture')
  const fixtureRecord = fixture === 'completion-reference' ? referenceCompletionFixture : fixture === 'marusan-reference' ? referenceMarusanFixture : null
  const [page, setPage] = useState(() => { const open = new URLSearchParams(window.location.search).get('open'); return fixtureRecord ? 'report-preview' : open === 'tags' ? 'tag-settings' : open === 'placements' ? 'tag-placement' : 'home' })
  const [records, setRecords] = useState(() => fixtureRecord ? { [fixtureRecord.id]: normalizeRecord(fixtureRecord) } : loadRecords())
  const [activeId, setActiveId] = useState(() => fixtureRecord?.id || null)
  const [notice, setNotice] = useState('')
  const [errors, setErrors] = useState([])
  const [menuOpen, setMenuOpen] = useState(false)
  const [profile, setProfile] = useState(() => localStorage.getItem(profileKey) || '富田')
  const [tags, setTags] = useState(loadTagRegistry)
  const [placements, setPlacements] = useState(loadTagPlacements)
  const [identity, setIdentity] = useState(() => getGoogleProfile())
  const [idToken, setIdToken] = useState(() => getGoogleIdToken())
  const [sharedStatus, setSharedStatus] = useState(isSharedStorageConfigured ? '接続待ち' : '端末保存')

  useEffect(() => {
    if (!isGoogleAuthConfigured) return undefined
    let mounted = true
    loadGoogleIdentity((token, profile) => {
      if (!mounted) return
      setIdToken(token)
      setIdentity(profile)
      if (isSharedStorageConfigured) {
        setSharedStatus('読み込み中')
        requestSharedStorage('listRecords', {}, token)
          .then(result => {
            if (!mounted) return
            const shared = Object.fromEntries((result.records || []).map(item => [item.id, normalizeRecord(item)]))
            setRecords(current => Object.keys(shared).length ? shared : current)
            setSharedStatus('共有保存')
          })
          .catch(error => { if (mounted) { setSharedStatus('接続エラー'); setNotice(error.message) } })
      }
    })
    return () => { mounted = false }
  }, [])

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

  const syncRecord = async record => {
    if (!isSharedStorageConfigured || !idToken) return false
    try {
      await requestSharedStorage('saveRecord', { record }, idToken)
      setSharedStatus('共有保存')
      return true
    } catch (error) {
      setSharedStatus('未同期')
      setNotice(`端末には保存しましたが、共有保存に失敗しました: ${error.message}`)
      return false
    }
  }

  const openForm = (type, existing) => {
    const record = normalizeRecord(existing || createRecord(type))
    if (!existing) updateRecord(record)
    setActiveId(record.id)
    setPage(`${type}-form`)
    setErrors([])
    setMenuOpen(false)
  }

  const save = async () => {
    if (!activeForm) return
    const saved = lockFirstWorker({ ...activeForm, status: 'draft', updatedAt: nowLabel() })
    updateRecord(saved)
    await syncRecord(saved)
    setNotice('下書きを保存しました')
  }

  const complete = () => {
    if (!activeForm) return
    const locked = lockFirstWorker(activeForm)
    const next = locked.type === 'marusan' && !locked.submittedAt
      ? { ...locked, submittedAt: new Date().toISOString().slice(0, 10) }
      : locked
    const validationErrors = validateRecord(next)
    if (validationErrors.length) {
      setErrors(validationErrors)
      setNotice('入力内容を確認してください')
      return
    }
    const ready = { ...next, status: 'ready', updatedAt: nowLabel(), pdfJob: { status: 'queued', attempts: next.pdfJob?.attempts || 0, createdAt: nowLabel() } }
    updateRecord(ready)
    syncRecord(ready)
    setPage('report-preview')
    setNotice('帳票プレビューを作成しました。内容を確認してください。')
  }

  const completePreview = () => {
    if (!activeForm) return
    const completed = { ...activeForm, status: 'completed', updatedAt: nowLabel(), pdfJob: { ...(activeForm.pdfJob || {}), status: 'completed', completedAt: nowLabel() } }
    updateRecord(completed)
    syncRecord(completed)
    setPage('jobs')
    setNotice('完了として記録しました。印刷/PDF保存も利用できます。')
  }

  const generateSlidesPdf = async () => {
    if (!activeForm) return
    setNotice('Google SlidesでPDFを作成しています…')
    try {
      const reportRecords = activeForm.bundleId
        ? Object.values(records).filter(item => item.bundleId === activeForm.bundleId)
        : [activeForm]
      const pdfReports = reportRecords.map(item => ({
        ...item,
        receiptImage: item.receiptImages?.[0]?.processedUrl || item.receiptImages?.[0]?.url || item.receiptImage || '',
      }))
      const customValuesById = Object.fromEntries(reportRecords.map(item => [item.id, Object.fromEntries(tags.filter(tag => tag?.sourceKey?.startsWith('custom-')).map(tag => [tag.sourceKey, item[tag.sourceKey] || '']))]))
      const result = await requestSlidesPdf({
        report: pdfReports[0],
        reports: pdfReports,
        tagValuesById: customValuesById,
        tags,
        placements,
        idToken,
        fileName: `${activeForm.type === 'marusan' ? '丸産報告書' : '工事完了報告書'}_${activeForm.workDate || activeForm.submittedAt || activeForm.siteName || activeForm.id}`,
      })
      updateRecord({ ...activeForm, pdfJob: { ...(activeForm.pdfJob || {}), status: 'completed', provider: 'google-slides', fileId: result.fileId, fileUrl: result.fileUrl, fileName: result.fileName, completedAt: nowLabel() } })
      syncRecord({ ...activeForm, pdfJob: { ...(activeForm.pdfJob || {}), status: 'completed', provider: 'google-slides', fileId: result.fileId, fileUrl: result.fileUrl, fileName: result.fileName, completedAt: nowLabel() } })
      setNotice('Google Slides経由のPDFを保存しました')
    } catch (error) {
      updateRecord({ ...activeForm, pdfJob: { ...(activeForm.pdfJob || {}), status: 'failed', provider: 'google-slides', error: error.message } })
      setNotice(error.message || 'Google Slides PDFの作成に失敗しました')
    }
  }

  const openJob = record => {
    setActiveId(record.id)
    if (['ready', 'processing', 'completed', 'failed'].includes(record.status)) setPage('report-preview')
    else setPage(`${record.type}-form`)
  }

  const retryJob = record => {
    const next = { ...record, status: 'ready', updatedAt: nowLabel(), pdfJob: { ...(record.pdfJob || {}), status: 'queued', attempts: (record.pdfJob?.attempts || 0) + 1 } }
    updateRecord(next)
    syncRecord(next)
    setActiveId(record.id)
    setPage('report-preview')
    setNotice('PDF作成を再試行できる状態に戻しました')
  }

  const deleteRecord = record => {
    if (!window.confirm(`${record.siteName || 'この帳票'}を削除しますか？`)) return
    setRecords(current => {
      const next = { ...current }
      delete next[record.id]
      persistRecords(next)
      return next
    })
    if (activeId === record.id) setActiveId(null)
    setNotice('帳票を削除しました')
    if (isSharedStorageConfigured && idToken) requestSharedStorage('deleteRecord', { recordId: record.id }, idToken).catch(error => setNotice(`端末からは削除しましたが、共有側の削除に失敗しました: ${error.message}`))
  }

  const bundleRecords = () => {
    const selected = Object.values(records).filter(record => ['ready', 'processing', 'completed'].includes(record.status))
    if (selected.length < 2) {
      setNotice('まとめる帳票が2件以上ありません')
      return
    }
    const bundleId = `bundle-${Date.now()}`
    const next = { ...records }
    selected.forEach(record => {
      next[record.id] = { ...record, bundleId, status: 'ready', updatedAt: nowLabel(), pdfJob: { ...(record.pdfJob || {}), status: 'queued', bundleId, createdAt: nowLabel() } }
    })
    setRecords(next)
    persistRecords(next)
    if (isSharedStorageConfigured && idToken) selected.forEach(record => syncRecord({ ...next[record.id] }))
    setActiveId(selected[0].id)
    setPage('report-preview')
    setNotice(`${selected.length}件をまとめたPDFの確認画面を開きました`)
  }

  const exportBackup = () => {
    const blob = new Blob([JSON.stringify({ exportedAt: new Date().toISOString(), records, profile, tags, placements }, null, 2)], { type: 'application/json' })
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
        if (Array.isArray(parsed.tags)) { setTags(parsed.tags); localStorage.setItem(tagStorageKey, JSON.stringify(parsed.tags)) }
        if (Array.isArray(parsed.placements)) { setPlacements(parsed.placements); localStorage.setItem(placementStorageKey, JSON.stringify(parsed.placements)) }
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

  const updateTagField = (sourceKey, field, value) => {
    setTags(current => {
      const next = current.map(item => item.sourceKey === sourceKey ? { ...item, [field]: value } : item)
      localStorage.setItem(tagStorageKey, JSON.stringify(next))
      return next
    })
    addConfigHistory({ kind: 'tag', sourceKey, field, value })
  }

  const resetTags = () => {
    const next = clone(tagRegistry)
    setTags(next)
    localStorage.setItem(tagStorageKey, JSON.stringify(next))
    addConfigHistory({ kind: 'tag-reset' })
    setNotice('タグを初期設定に戻しました')
  }

  const addTag = (selectedTemplate = 'completion') => {
    const sourceKey = `custom-${Date.now()}`
    const targetTemplate = selectedTemplate === 'marusan' ? 'marusan' : 'completion'
    const next = [...tags, { sourceKey, formName: targetTemplate === 'marusan' ? '新しい丸産項目' : '新しい項目', tag: `<<${sourceKey}>>`, field: sourceKey, template: targetTemplate, origin: 'ユーザー追加', status: '新規項目' }]
    const nextPlacements = [...placements, { template: targetTemplate, sourceKey, x: 5, y: 74, width: 40, height: 4, fontSize: 11 }]
    setTags(next)
    setPlacements(nextPlacements)
    localStorage.setItem(tagStorageKey, JSON.stringify(next))
    localStorage.setItem(placementStorageKey, JSON.stringify(nextPlacements))
    setNotice('新しいタグを追加しました')
  }

  const duplicateTag = item => {
    const sourceKey = `custom-${Date.now()}`
    const copied = { ...item, sourceKey, formName: `${item.formName} コピー`, tag: `<<${sourceKey}>>`, origin: 'ユーザー複製', status: '新規項目' }
    const nextTags = [...tags, copied]
    const originalPlacement = placements.find(placement => placement.sourceKey === item.sourceKey && placement.template === item.template)
    const nextPlacements = [...placements, { ...(originalPlacement || { template: item.template || 'completion', x: 5, y: 74, width: 40, height: 4, fontSize: 11 }), sourceKey, x: Math.min(90, (originalPlacement?.x || 5) + 2), y: Math.min(94, (originalPlacement?.y || 74) + 2) }]
    setTags(nextTags); setPlacements(nextPlacements)
    localStorage.setItem(tagStorageKey, JSON.stringify(nextTags)); localStorage.setItem(placementStorageKey, JSON.stringify(nextPlacements))
    setNotice('タグを複製しました')
  }

  const deleteTag = sourceKey => {
    const nextTags = tags.filter(item => item.sourceKey !== sourceKey)
    const nextPlacements = placements.filter(item => item.sourceKey !== sourceKey)
    setTags(nextTags); setPlacements(nextPlacements)
    localStorage.setItem(tagStorageKey, JSON.stringify(nextTags)); localStorage.setItem(placementStorageKey, JSON.stringify(nextPlacements))
    addConfigHistory({ kind: 'tag-delete', sourceKey })
    setNotice('タグを削除しました。初期設定に戻すと復元できます')
  }

  const deletePlacement = (template, sourceKey) => {
    if (sourceKey === undefined) {
      const parts = String(template).split('-')
      sourceKey = parts.slice(1).join('-')
      template = parts[0]
    }
    const next = placements.filter(item => !(item.template === template && item.sourceKey === sourceKey))
    setPlacements(next); localStorage.setItem(placementStorageKey, JSON.stringify(next))
    addConfigHistory({ kind: 'placement-delete', template, sourceKey })
  }

  const copyTag = async tag => {
    try {
      await navigator.clipboard.writeText(tag)
      setNotice(`${tag} をコピーしました`)
    } catch {
      setNotice('タグのコピーに失敗しました')
    }
  }

  const updatePlacement = (template, sourceKey, field, value) => {
    setPlacements(current => {
      const next = current.map(item => item.template === template && item.sourceKey === sourceKey ? { ...item, [field]: Number(value) } : item)
      localStorage.setItem(placementStorageKey, JSON.stringify(next))
      return next
    })
    addConfigHistory({ kind: 'placement', template, sourceKey, field, value: Number(value) })
  }

  const resetPlacements = () => {
    const next = clone(tagPlacementDefaults)
    setPlacements(next)
    localStorage.setItem(placementStorageKey, JSON.stringify(next))
    addConfigHistory({ kind: 'placement-reset' })
    setNotice('タグ配置を初期設定に戻しました')
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
        <NavButton active={page === 'tag-settings'} onClick={() => setPage('tag-settings')} icon={<Tags size={18} />}>項目・タグ名</NavButton>
        <NavButton active={page === 'tag-placement'} onClick={() => setPage('tag-placement')} icon={<Tags size={18} />}>タグ配置</NavButton>
      </nav>
      <div className="sidebar-footer"><div className="avatar">{profile.slice(0, 1) || 'K'}</div><div><strong>{profile || '未設定'}</strong><span>管理者・試作ユーザー</span></div><ChevronDown size={16} /></div>
    </aside>
    <main className="main-content">
      {page === 'jobs' && <div className="bulk-actions"><button className="button primary" onClick={bundleRecords}>表示中の帳票をまとめてPDF</button></div>}
      <header className="topbar"><button className="icon-button mobile-menu" aria-label="メニュー" onClick={() => setMenuOpen(!menuOpen)}><Menu size={20} /></button><div className="breadcrumb">オシゴトアプリ <ChevronDown size={15} /></div><div className="topbar-actions"><span className={`sync-state ${sharedStatus === '共有保存' ? 'is-shared' : ''}`}><i />{sharedStatus}{identity?.email ? `（${identity.email}）` : ''}</span><GoogleAccountControl identity={identity} onLogin={(token, profile) => { setIdToken(token); setIdentity(profile) }} /><button className="button secondary tag-shortcut" aria-label="タグ調整" title="タグ調整" onClick={() => setPage('tag-settings')}><Tags size={17} /><span>タグ調整</span></button><button className="icon-button" aria-label="その他" onClick={() => setMenuOpen(!menuOpen)}><MoreHorizontal size={20} /></button></div></header>
      {notice && <div className="toast" role="status"><Check size={16} />{notice}</div>}
      {page === 'home' && <Home create={openForm} go={setPage} draftCount={draftCount} processingCount={processingCount} />}
      {page === 'drafts' && <Drafts records={records} open={openForm} />}
      {page === 'jobs' && <Jobs records={records} back={() => setPage('home')} open={openJob} retry={retryJob} bundle={bundleRecords} remove={deleteRecord} />}
        {page === 'settings' && <SettingsPage records={records} profile={profile} setProfile={updateProfile} exportBackup={exportBackup} importBackup={importBackup} clearLocalData={clearLocalData} copyTag={copyTag} />}
       {page === 'tag-settings' && <TagEditorPage tags={tags} updateTag={updateTag} updateTagField={updateTagField} resetTags={resetTags} copyTag={copyTag} addTag={addTag} duplicateTag={duplicateTag} deleteTag={deleteTag} back={() => setPage('settings')} />}
       {page === 'tag-placement' && <TagPlacementPage tags={tags} placements={placements} updatePlacement={updatePlacement} deletePlacement={deletePlacement} resetPlacements={resetPlacements} back={() => setPage('settings')} />}
      {page === 'completion-form' && activeForm && <CompletionForm data={activeForm} update={updateRecord} tags={tags} back={() => setPage('home')} save={save} complete={complete} receipt={() => setPage('receipt')} errors={errors} />}
      {page === 'marusan-form' && activeForm && <MarusanForm data={activeForm} update={updateRecord} tags={tags} back={() => setPage('home')} save={save} complete={complete} errors={errors} />}
      {page === 'receipt' && activeForm && <ReceiptEditor data={activeForm} update={updateRecord} back={() => setPage(`${activeForm.type}-form`)} done={() => { setPage(`${activeForm.type}-form`); setNotice('領収書を保存しました') }} />}
      {page === 'report-preview' && activeForm && <ReportPreview data={activeForm} records={records} placements={placements} tags={tags} back={() => setPage(`${activeForm.type}-form`)} done={completePreview} generatePdf={isAppsScriptConfigured ? generateSlidesPdf : null} />}
    </main>
  </div>
}

function NavButton({ active, onClick, icon, children }) { return <button className={`nav-item ${active ? 'active' : ''}`} onClick={onClick}>{icon}{children}</button> }

function Header({ eyebrow, title, text, action }) {
  return <div className="page-header"><div><div className="eyebrow">{eyebrow}</div><h1>{title}</h1><p>{text}</p></div><div className="page-header-actions">{action}<button className="button secondary print-button" onClick={() => window.print()} title="印刷またはPDF保存"><Printer size={16} />印刷/PDF</button></div></div>
}

function GoogleAccountControl({ identity, onLogin }) {
  const container = useRef(null)
  useEffect(() => {
    if (!isGoogleAuthConfigured || identity) return undefined
    loadGoogleIdentity(onLogin).then(() => renderGoogleButton(container.current))
    return undefined
  }, [identity, onLogin])
  if (!isGoogleAuthConfigured) return null
  if (identity?.email) return <span className="account-chip">Googleログイン済み</span>
  return <div className="google-login-button" ref={container} aria-label="Googleでログイン" />
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

function Jobs({ records, back, open, retry, bundle, remove }) {
  const jobs = Object.values(records).filter(record => ['ready', 'processing', 'completed', 'failed'].includes(record.status))
  const canBundle = jobs.length > 1
  return <div className="page-wrap"><Header eyebrow="処理状況" title="PDF処理" text="帳票の確認、印刷/PDF保存、再試行をここから行えます。" action={<button className="button secondary" onClick={back}><ArrowLeft size={17} />ホームへ戻る</button>} /><div className="job-summary"><div><span>現在の処理</span><strong>{jobs.length ? `${jobs.length}件を表示中` : '処理中の書類はありません'}</strong></div><div className="job-spinner"><Cloud size={22} /></div></div><div className="record-list">{jobs.length ? jobs.map(item => <div className="job-row" key={item.id}><RecordRow item={item} onClick={() => open(item)} />{item.status === 'failed' && <button className="button secondary retry-button" onClick={() => retry(item)}>再試行</button>}</div>) : <Empty text="PDF処理はありません" />}</div><div className="info-callout"><Sparkles size={18} /><div><strong>サンプル環境で動作中</strong><span>現在はこの端末に保存しています。本番のDrive・Sheets接続は次の移行段階で追加します。</span></div></div></div>
}

function Field({ label, required, hint, children, className = '' }) { return <label className={`field ${className}`}><span className="field-label">{label}{required && <em>必須</em>}</span>{children}{hint && <small>{hint}</small>}</label> }
function Input({ value, onChange, type = 'text', placeholder, disabled = false }) { return <input className="text-input" type={type} value={value ?? ''} placeholder={placeholder} disabled={disabled} onChange={e => onChange(e.target.value)} /> }
function Area({ value, onChange, rows = 4, placeholder }) { return <textarea className="text-input textarea" rows={rows} value={value ?? ''} placeholder={placeholder} onChange={e => onChange(e.target.value)} /> }

function FormShell({ eyebrow, title, text, back, save, complete, step, children, errors }) {
  return <div className="page-wrap form-page"><div className="form-top"><button className="back-link" onClick={back}><ArrowLeft size={17} />一覧へ戻る</button><span className="form-step">{step}</span></div><Header eyebrow={eyebrow} title={title} text={text} />{errors.length > 0 && <div className="form-errors" role="alert"><strong>入力内容を確認してください</strong><ul>{errors.map(error => <li key={`${error.key}-${error.message}`}>{error.message}</li>)}</ul></div>}<div className="form-layout"><div className="form-body">{children}</div><aside className="form-side"><div className="side-card"><div className="side-icon"><Save size={18} /></div><strong>下書き保存</strong><span>入力途中でも、いつでも保存できます。</span><button className="button secondary full" onClick={save}>保存する</button></div><div className="side-card pale"><div className="side-icon"><FileCheck2 size={18} /></div><strong>確認してPDF作成</strong><span>入力内容を確認してから帳票を作成します。</span><button className="button primary full" onClick={complete}>確認してPDF作成</button></div></aside></div></div>
}

function CompletionExtraFields({ data, patch }) {
  return <>
    <Section title="現行アプリ互換項目" note="現行AppSheetの入力欄を引き継ぎます">
      <div className="form-grid two">
        <Field label="作業者"><Input value={data.workerName} onChange={v => patch('workerName', v)} /></Field>
        <Field label="回数"><Segment value={data.occurrence} options={['1回目', '2回目', '3回目']} onChange={v => patch('occurrence', v)} /></Field>
        <Field label="応援者"><Input value={(data.supporters || []).join(', ')} onChange={v => patch('supporters', v.split(',').map(item => item.trim()).filter(Boolean))} /></Field>
        <Field label="駐車場代"><Input type="number" value={data.parkingFee} onChange={v => patch('parkingFee', v)} /></Field>
        <Field label="高速代"><Segment value={data.tollMode} options={['片道', '往復', '行き帰り別']} onChange={v => patch('tollMode', v)} /></Field>
        <Field label="高速料金検索リンク"><Input value={data.tollLink} onChange={v => patch('tollLink', v)} /></Field>
        <Field label="材料費（丸産駐車場）"><Input type="number" value={data.materialCost} onChange={v => patch('materialCost', v)} /></Field>
        <Field label="建新1"><Input value={data.construction1} onChange={v => patch('construction1', v)} /></Field>
        <Field label="建新2"><Input value={data.construction2} onChange={v => patch('construction2', v)} /></Field>
        <Field label="材料1"><Input value={data.material1} onChange={v => patch('material1', v)} /></Field>
        <Field label="材料2"><Input value={data.material2} onChange={v => patch('material2', v)} /></Field>
        <Field label="フリー"><Input value={data.free1} onChange={v => patch('free1', v)} /></Field>
        <Field label="フリー"><Input value={data.free2} onChange={v => patch('free2', v)} /></Field>
        <Field label="フリー"><Input value={data.free3} onChange={v => patch('free3', v)} /></Field>
        <Field label="フリー（作業時間）"><Input value={data.freeTime} onChange={v => patch('freeTime', v)} /></Field>
        <Field label="フリー"><Input value={data.free4} onChange={v => patch('free4', v)} /></Field>
      </div>
      <Field label="現場日誌など"><Area value={data.diary} onChange={v => patch('diary', v)} rows={4} /></Field>
    </Section>
  </>
}

function CustomFields({ data, patch, tags, template }) {
  const fields = (tags || []).filter(item => item?.sourceKey?.startsWith('custom-') && item.template === template)
  if (!fields.length) return null
  return <Section title="追加項目" note="項目・タグ名で追加・編集できます"><div className="form-grid two">{fields.map(item => <Field key={item.sourceKey} label={item.formName || item.sourceKey}><Input value={data[item.sourceKey] || ''} onChange={value => patch(item.sourceKey, value)} placeholder={item.formName || '追加項目'} /></Field>)}</div></Section>
}

function CompletionForm({ data, update, tags, back, save, complete, receipt, errors }) {
  const patch = (key, value) => update({ ...data, [key]: value })
  return <FormShell eyebrow="工事完了報告書" title="工事完了報告書を作成" text="現場の内容を入力してください。長い文章は枠に合わせて自動で折り返されます。" back={back} save={save} complete={complete} step="01 / 02 基本情報" errors={errors}><CompletionExtraFields data={data} patch={patch} /><CustomFields data={data} patch={patch} tags={tags} template="completion" /><Section title="基本情報" note="書類の宛先と現場"><div className="form-grid two"><Field label="御中" required><Input value={data.toCompany} onChange={v => patch('toCompany', v)} placeholder="会社名" /></Field><Field label="事業所"><Input value={data.toOffice} onChange={v => patch('toOffice', v)} placeholder="事業所名" /></Field><Field label="担当者"><Input value={data.toPerson} onChange={v => patch('toPerson', v)} placeholder="担当者名" /></Field><Field label="日付" required><Input type="date" value={data.workDate} onChange={v => patch('workDate', v)} /></Field><Field label="現場名" required><Input value={data.siteName} onChange={v => patch('siteName', v)} placeholder="現場名" /></Field><Field label="注文No"><Input value={data.orderNo} onChange={v => patch('orderNo', v)} placeholder="注文番号" /></Field><Field label="住所" className="span-two"><Input value={data.address} onChange={v => patch('address', v)} placeholder="住所" /></Field></div></Section><Section title="工事内容" note="改行はPDFでも保持されます"><Field label="工事内容" required><Area value={data.workContent} onChange={v => patch('workContent', v)} rows={5} placeholder="工事内容を入力" /></Field><div className="inline-note"><Check size={15} />数量は先頭行のみ「一式」で固定。備考欄は空欄で出力します。</div></Section><Section title="金額" note="駐車場代・高速代・材料代は含めません"><div className="form-grid two"><Field label="合計" required hint="税抜の金額を入力"><Input type="number" value={data.total} onChange={v => update({ ...data, total: v, tax: v ? String(Math.floor(Number(v) * 0.1)) : '' })} placeholder="金額" /></Field><Field label="消費税" required hint="10%を自動計算・手動編集可"><Input type="number" value={data.tax} onChange={v => patch('tax', v)} placeholder="自動計算" /></Field></div></Section><Section title="吹付塗装" note="PDF上で選択項目に丸印を表示"><Field label="吹付塗装"><Segment value={data.spray} options={['あり', 'なし']} onChange={v => patch('spray', v)} /></Field>{data.spray === 'あり' && <Field label="吹付塗装詳細" required><Area value={data.sprayDetail} onChange={v => patch('sprayDetail', v)} rows={4} placeholder="吹付塗装の詳細を入力" /></Field>}<Field label="通常材料以外に材料を使った場合"><Area value={data.specialMaterial} onChange={v => patch('specialMaterial', v)} rows={3} placeholder="使用した材料を入力" /></Field><Field label="完了"><Segment value={data.completionStatus} options={['完了', '未完']} onChange={v => patch('completionStatus', v)} /></Field></Section><Section title="領収書" note="任意・複数枚対応"><button className="receipt-launch" onClick={receipt} type="button"><div className="receipt-icon"><ReceiptText size={22} /></div><div><strong>{data.receiptImages?.length ? `${data.receiptImages.length}枚の領収書を確認` : '領収書を追加・加工'}</strong><span>撮影・画像選択、トリミング、白黒化</span></div><ArrowRight size={18} /></button></Section></FormShell>
}

function Section({ title, note, children }) { return <div className="form-section"><div className="form-section-title"><span>{title}</span><small>{note}</small></div>{children}</div> }
function Segment({ value, options, onChange }) { return <div className="segmented">{options.map(option => <button type="button" key={option} className={value === option ? 'selected' : ''} onClick={() => onChange(option)}>{option}</button>)}</div> }

function MarusanForm({ data, update, tags, back, save, complete, errors }) {
  const patch = (key, value) => update({ ...data, [key]: value })
  const arrayPatch = (key, index, value) => { const next = [...data[key]]; next[index] = value; update({ ...data, [key]: next }) }
  return <FormShell eyebrow="丸産報告書" title="丸産報告書を作成" text="作業日、時間帯、作業内容、作業者を入力してください。" back={back} save={save} complete={complete} step="01 / 02 作業日報" errors={errors}><CustomFields data={data} patch={patch} tags={tags} template="marusan" /><Section title="作業情報" note="会社名は固定です"><div className="fixed-company"><ShieldCheck size={17} /><span>株式会社ＴＲＣ</span><small>固定</small></div><div className="form-grid two"><Field label="工事担当名"><Input value={data.personInCharge} onChange={v => patch('personInCharge', v)} placeholder="担当者名" /></Field><Field label="現場名及び工事内容" required><Input value={data.siteName} onChange={v => patch('siteName', v)} placeholder="現場名・工事内容" /></Field><Field label="年" required><Input type="number" value={data.year} onChange={v => patch('year', v)} placeholder="西暦" /></Field><Field label="月" required><Input type="number" value={data.month} onChange={v => patch('month', v)} placeholder="月" /></Field><Field label="日" required><Input type="number" value={data.day} onChange={v => patch('day', v)} placeholder="日" /></Field></div></Section><Section title="作業日の作業内容" note="AM / PMそれぞれ3行"><div className="form-grid two"><Field label="AM"><Input value={data.amTime} onChange={v => patch('amTime', v)} placeholder="作業時間" /></Field><Field label="PM"><Input value={data.pmTime} onChange={v => patch('pmTime', v)} placeholder="作業時間" /></Field></div><div className="repeat-fields">{data.workSlots.map((value, index) => <Field key={index} label={`${index < 3 ? 'AM' : 'PM'} ${index % 3 + 1}`}><Input value={value} onChange={v => arrayPatch('workSlots', index, v)} placeholder="作業内容" /></Field>)}</div></Section><Section title="作業員名" note={data.firstWorkerLocked ? '1行目は保存済みの本人として固定されています' : '保存すると1行目が本人として固定されます'}><div className="repeat-fields">{data.workers.map((value, index) => <Field key={index} label={`氏名 ${index + 1}`}><Input value={value} disabled={index === 0 && data.firstWorkerLocked} onChange={v => arrayPatch('workers', index, v)} placeholder={index === 0 ? '本人の名前' : '作業員名'} /></Field>)}</div></Section><Section title="連絡事項・注意事項・明日の作業予定" note="改行はPDFでも保持されます"><Field label="連絡事項・注意事項・明日の作業予定"><Area value={data.notes} onChange={v => patch('notes', v)} rows={5} placeholder="必要事項を入力" /></Field></Section></FormShell>
}

function TagEditorPage({ tags, updateTagField, resetTags, copyTag, addTag, duplicateTag, deleteTag, back }) {
  const [template, setTemplate] = useState('marusan')
  const visibleTags = tags.filter(item => item.template === template)
  return <div className="page-wrap"><div className="form-top"><button className="back-link" onClick={back}><ArrowLeft size={17} />設定へ戻る</button><span className="form-step">項目名・タグ名</span></div><Header eyebrow="帳票テンプレート" title="項目名・タグ名" text="項目タイトルとタグ文字列を別々に編集できます。" /><div className="info-callout"><Tags size={18} /><div><strong>帳票ごとに項目とタグを分けて管理します</strong><span>丸産報告書のタグは丸産報告書だけで使われます。複製・追加・削除ができます。</span></div></div><div className="config-preview tag-editor-panel"><div className="section-heading"><div><h2>項目名・タグ台帳</h2><span>変更はこの端末に保存されます</span></div><div className="settings-tool-actions"><select className="select-control" value={template} onChange={event => setTemplate(event.target.value)}><option value="marusan">丸産報告書</option><option value="completion">工事完了報告書</option></select><button className="button secondary" onClick={() => addTag(template)}><Plus size={16} />この帳票にタグを追加</button><button className="button secondary tag-reset" onClick={resetTags}>初期設定に戻す</button></div></div><div className="tag-list">{visibleTags.map(item => <div className="tag-row tag-row-title" key={item.sourceKey}><div><span>{item.origin} ・ {item.sourceKey}</span></div><input className="tag-title-input" aria-label={`${item.sourceKey}の項目タイトル`} value={item.formName} onChange={event => updateTagField(item.sourceKey, 'formName', event.target.value)} /><input className="tag-edit-input" aria-label={`${item.sourceKey}のタグ文字列`} value={item.tag} onChange={event => updateTagField(item.sourceKey, 'tag', event.target.value)} /><button className="icon-button tag-copy" title="タグ文字列をコピー" aria-label={`${item.tag}をコピー`} onClick={() => copyTag(item.tag)}><Copy size={16} /></button><button className="icon-button" title="このタグを複製" aria-label={`${item.formName}を複製`} onClick={() => duplicateTag(item)}><Plus size={16} /></button><button className="icon-button" title="このタグを削除" aria-label={`${item.formName}を削除`} onClick={() => deleteTag(item.sourceKey)}><Trash2 size={16} /></button></div>)}</div><p className="tag-help">項目タイトルとタグ文字列は別々に変更できます。削除したタグは「初期設定に戻す」で復元できます。</p></div></div>
}

function TagPlacementPage({ tags, placements, updatePlacement, deletePlacement, resetPlacements, back }) {
  const [template, setTemplate] = useState('marusan')
  const visible = placements.filter(item => item.template === template)
  const tagByKey = Object.fromEntries(tags.map(item => [item.sourceKey, item]))
  const background = template === 'completion' ? './templates/completion-report.png' : './templates/marusan-report.png'
  const change = (item, field, value) => updatePlacement(item.template, item.sourceKey, field, value)
  return <div className="page-wrap"><div className="form-top"><button className="back-link" onClick={back}><ArrowLeft size={17} />設定へ戻る</button><span className="form-step">タグ配置</span></div><Header eyebrow="帳票テンプレート" title="タグの位置・大きさ・文字サイズ" text="丸産報告書と工事完了報告書は別々に調整できます。" /><div className="placement-toolbar"><select className="select-control" value={template} onChange={event => setTemplate(event.target.value)}><option value="marusan">丸産報告書</option><option value="completion">工事完了報告書</option></select><button className="button secondary" onClick={() => resetPlacements(template)}>初期状態に戻す</button></div><div className="placement-layout"><div className="placement-preview"><img src={background} alt="台紙プレビュー" />{visible.map(item => <span key={item.id || item.sourceKey} className="placement-tag" style={{ left: `${item.x}%`, top: `${item.y}%`, width: `${item.width}%`, height: `${item.height}%`, fontSize: `${item.fontSize || 11}px` }}>{tagByKey[item.sourceKey]?.tag || item.sourceKey}</span>)}</div><div className="placement-list">{visible.map(item => <div className="placement-row" key={item.id || item.sourceKey}><strong>{tagByKey[item.sourceKey]?.formName || item.sourceKey}</strong><code>{tagByKey[item.sourceKey]?.tag || item.sourceKey}</code><div className="placement-fields">{['x', 'y', 'width', 'height', 'fontSize'].map(field => <label key={field}>{field}<input type="number" step="0.1" value={item[field]} onChange={event => change(item, field, Number(event.target.value))} /></label>)}</div><button className="icon-button" title="この配置を削除" onClick={() => deletePlacement(item.id || `${item.template}-${item.sourceKey}`)}><Trash2 size={16} /></button></div>)}</div></div></div>
}

function SettingsPage({ records, profile, setProfile, exportBackup, importBackup, clearLocalData, copyTag }) {
  let historyCount = 0
  try { historyCount = JSON.parse(localStorage.getItem(configHistoryKey) || '[]').length } catch { historyCount = 0 }
  return <div className="page-wrap"><Header eyebrow="運用・管理" title="設定" text="帳票と保存データの運用設定を管理します。" /><div className="settings-grid"><Setting icon={<SlidersHorizontal size={20} />} title="帳票レイアウト" text="PDFの枠・位置・文字設定を管理" tone="teal" /><Setting icon={<ShieldCheck size={20} />} title="ユーザーと権限" text="管理者・利用者・閲覧者を管理" tone="orange" /><Setting icon={<WandSparkles size={20} />} title="マスターデータ" text="会社名・材料・交通費を管理" tone="blue" /></div><div className="settings-tool"><div className="section-heading"><h2>本人設定</h2><span>丸産報告書の1行目に使います</span></div><Field label="作業者名"><Input value={profile} onChange={setProfile} /></Field></div><div className="settings-tool"><div className="section-heading"><h2>端末データのバックアップ</h2><span>{Object.keys(records).length}件</span></div><p>端末を変える前に書き出し、復元できます。Drive接続後も緊急時の退避として利用します。</p><div className="settings-tool-actions"><button className="button secondary" onClick={exportBackup}><Download size={16} />バックアップを書き出す</button><label className="button secondary"><Upload size={16} />バックアップを復元<input className="settings-file-input" type="file" accept="application/json" onChange={event => importBackup(event.target.files?.[0])} /></label><button className="button danger" onClick={clearLocalData}><Trash2 size={16} />端末データを削除</button></div></div><div className="config-preview"><div className="section-heading"><h2>タグ台帳</h2><span>既存項目は引き継ぎ、新規項目はPDF名を採用</span></div><div className="tag-list">{tagRegistry.map(item => <div className="tag-row" key={item.tag}><div><strong>{item.formName}</strong><span>{item.sourceKey} ・ {item.origin}</span></div><code>{item.tag}</code><button className="icon-button tag-copy" title="タグをコピー" aria-label={`${item.tag}をコピー`} onClick={() => copyTag(item.tag)}><Copy size={16} /></button></div>)}</div></div><div className="config-preview"><div className="section-heading"><h2>現在のレイアウト設定</h2><span>調整値はコードから分離されています</span></div><div className="config-list">{Object.values(templateConfig).map(config => <div className="config-row" key={config.label}><strong>{config.label}</strong><span>{config.templateVersion || config.source}</span><span>{config.imageMode ? '添付ルール' : '台紙設定'}</span></div>)}</div><p className="tag-help">配置・タグの変更履歴: {historyCount}件（初期状態へ戻す操作も記録）</p></div><div className="info-callout"><Settings2 size={18} /><div><strong>レイアウト設定は帳票プレビューにも反映されます</strong><span>タグ名、位置、幅、高さ、文字サイズを設定画面から変更できます。</span></div></div></div>
}

function Setting({ icon, title, text, tone }) { return <div className="settings-card"><div className={`settings-card-icon ${tone}`}>{icon}</div><div><strong>{title}</strong><span>{text}</span></div><em>準備中</em></div> }

export default App
