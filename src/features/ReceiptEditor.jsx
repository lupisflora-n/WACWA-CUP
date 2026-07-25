import { useState } from 'react'
import { ArrowLeft, Check, ImagePlus, ReceiptText, RotateCw, Save } from 'lucide-react'

function readAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

function loadImage(url) {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = reject
    image.src = url
  })
}

export default function ReceiptEditor({ data, update, back, done }) {
  const [selected, setSelected] = useState(data.receiptImages?.[0] || null)
  const [filter, setFilter] = useState(selected?.filter || 'original')
  const [zoom, setZoom] = useState(selected?.zoom || 100)
  const [rotation, setRotation] = useState(selected?.rotation || 0)
  const [crop, setCrop] = useState(selected?.crop || 0)
  const [busy, setBusy] = useState(false)

  const replaceSelected = changes => {
    if (!selected) return
    const next = { ...selected, ...changes }
    setSelected(next)
    update({ ...data, receiptImages: data.receiptImages.map(item => item.id === next.id ? next : item) })
  }

  const addFile = async files => {
    const selectedFiles = Array.from(files || [])
    if (!selectedFiles.length) return
    const items = await Promise.all(selectedFiles.map(async (file, index) => ({ id: `receipt-${Date.now()}-${index}`, name: file.name, url: await readAsDataUrl(file), filter: 'original', rotation: 0, crop: 0, zoom: 100 })))
    const nextImages = [...(data.receiptImages || []), ...items]
    update({ ...data, receiptImages: nextImages })
    selectItem(items[0])
  }

  const selectItem = item => {
    setSelected(item)
    setFilter(item.filter || 'original')
    setRotation(item.rotation || 0)
    setCrop(item.crop || 0)
    setZoom(item.zoom || 100)
  }

  const saveProcessedImage = async () => {
    if (!selected) return
    setBusy(true)
    try {
      const image = await loadImage(selected.url)
      const angle = (rotation * Math.PI) / 180
      const canvas = document.createElement('canvas')
      const rotated = rotation % 180 !== 0
      canvas.width = rotated ? image.naturalHeight : image.naturalWidth
      canvas.height = rotated ? image.naturalWidth : image.naturalHeight
      const context = canvas.getContext('2d')
      context.filter = filter === 'bw' ? 'grayscale(1) contrast(1.35)' : filter === 'soft' ? 'grayscale(.7) contrast(1.1)' : 'none'
      context.translate(canvas.width / 2, canvas.height / 2)
      context.rotate(angle)
      context.drawImage(image, -image.naturalWidth / 2, -image.naturalHeight / 2)
      const inset = Math.max(0, Math.min(0.45, Number(crop || 0) / 100))
      const cropX = Math.round(canvas.width * inset)
      const cropY = Math.round(canvas.height * inset)
      const cropWidth = Math.max(1, canvas.width - cropX * 2)
      const cropHeight = Math.max(1, canvas.height - cropY * 2)
      const output = document.createElement('canvas')
      output.width = cropWidth
      output.height = cropHeight
      output.getContext('2d').drawImage(canvas, cropX, cropY, cropWidth, cropHeight, 0, 0, cropWidth, cropHeight)
      const processedUrl = output.toDataURL('image/jpeg', 0.9)
      replaceSelected({ processedUrl, processedAt: new Date().toISOString() })
    } finally {
      setBusy(false)
    }
  }

  const imageStyle = {
    transform: `rotate(${rotation}deg) scale(${zoom / 100})`,
    filter: filter === 'bw' ? 'grayscale(1) contrast(1.25)' : filter === 'soft' ? 'grayscale(.7) contrast(1.1)' : 'none',
    clipPath: crop ? `inset(${crop}% ${crop}% ${crop}% ${crop}%)` : undefined,
  }

  return <div className="page-wrap receipt-page">
    <div className="form-top"><button className="back-link" onClick={back}><ArrowLeft size={17} />工事完了報告書へ戻る</button><span className="form-step">領収書調整</span></div>
    <div className="page-header"><div><div className="eyebrow">領収書</div><h1>領収書を整える</h1><p>撮影した画像を確認し、白黒加工・回転・トリミングを保存できます。</p></div><div className="page-header-actions"><button className="button primary" onClick={done}><Check size={17} />保存して戻る</button></div></div>
    <div className="receipt-layout">
      <div className="receipt-canvas"><div className="canvas-label"><span>プレビュー</span><small>帳票へ添付する画像</small></div><div className="receipt-preview">{selected ? <img src={selected.processedUrl || selected.url} alt="領収書プレビュー" style={imageStyle} /> : <div className="receipt-empty"><ReceiptText size={34} /><strong>領収書を追加してください</strong><span>撮影または画像ファイルを選択できます。</span></div>}</div></div>
      <div className="receipt-controls">
        <div className="control-block"><div className="control-title">画像を追加</div><label className="upload-button"><ImagePlus size={18} />撮影・画像を選択<input type="file" accept="image/*" capture="environment" multiple onChange={event => addFile(event.target.files)} /></label><small>元画像は保持したまま、加工後画像も別に保存します。</small></div>
        <div className="control-block"><div className="control-title">見やすさ</div><div className="segmented">{[['original', '原画像'], ['soft', 'ソフト白黒'], ['bw', '白黒・高コントラスト']].map(([value, label]) => <button type="button" key={value} className={filter === value ? 'selected' : ''} onClick={() => { setFilter(value); replaceSelected({ filter: value }) }}>{label}</button>)}</div></div>
        <div className="control-block"><div className="control-title">位置調整</div><label className="range-label">拡大 <output>{zoom}%</output><input type="range" min="80" max="140" value={zoom} onChange={event => { const value = Number(event.target.value); setZoom(value); replaceSelected({ zoom: value }) }} /></label><label className="range-label">トリミング <output>{crop}%</output><input type="range" min="0" max="30" value={crop} onChange={event => { const value = Number(event.target.value); setCrop(value); replaceSelected({ crop: value }) }} /></label><button className="button secondary full" onClick={() => { const next = (rotation + 90) % 360; setRotation(next); replaceSelected({ rotation: next }) }}><RotateCw size={16} />90度回転</button><button className="button secondary full" disabled={!selected || busy} onClick={saveProcessedImage}><Save size={16} />{busy ? '加工中…' : '加工画像を保存'}</button></div>
        {data.receiptImages?.length > 0 && <div className="control-block"><div className="control-title">添付済み <span>{data.receiptImages.length}枚</span></div>{data.receiptImages.map(item => <button key={item.id} className={`attachment-item ${selected?.id === item.id ? 'active' : ''}`} onClick={() => selectItem(item)}><img src={item.processedUrl || item.url} alt="" /><span>{item.name}</span><Check size={15} /></button>)}</div>}
      </div>
    </div>
  </div>
}
