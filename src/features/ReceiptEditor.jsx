import { useState } from 'react'
import { ArrowLeft, Check, ImagePlus, ReceiptText, RotateCw } from 'lucide-react'

function readAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export default function ReceiptEditor({ data, update, back, done }) {
  const [selected, setSelected] = useState(data.receiptImages?.[0] || null)
  const [filter, setFilter] = useState(selected?.filter || 'original')
  const [zoom, setZoom] = useState(selected?.zoom || 100)
  const [rotation, setRotation] = useState(selected?.rotation || 0)
  const [crop, setCrop] = useState(selected?.crop || 0)

  const changeItem = changes => {
    if (!selected) return
    const next = { ...selected, ...changes }
    setSelected(next)
    update({ ...data, receiptImages: data.receiptImages.map(item => item.id === next.id ? next : item) })
  }

  const addFile = async files => {
    const file = files?.[0]
    if (!file) return
    const url = await readAsDataUrl(file)
    const item = { id: `receipt-${Date.now()}`, name: file.name, url, filter: 'original', rotation: 0, crop: 0, zoom: 100 }
    setSelected(item)
    setFilter('original')
    setRotation(0)
    setCrop(0)
    setZoom(100)
    update({ ...data, receiptImages: [...(data.receiptImages || []), item] })
  }

  const selectItem = item => {
    setSelected(item)
    setFilter(item.filter || 'original')
    setRotation(item.rotation || 0)
    setCrop(item.crop || 0)
    setZoom(item.zoom || 100)
  }

  const imageStyle = {
    transform: `rotate(${rotation}deg) scale(${zoom / 100})`,
    filter: filter === 'bw' ? 'grayscale(1) contrast(1.25)' : filter === 'soft' ? 'grayscale(.7) contrast(1.1)' : 'none',
    clipPath: crop ? `inset(${crop}% ${crop}% ${crop}% ${crop}%)` : undefined,
  }

  return <div className="page-wrap receipt-page">
    <div className="form-top"><button className="back-link" onClick={back}><ArrowLeft size={17} />完了報告書へ戻る</button><span className="form-step">領収書編集</span></div>
    <div className="page-header"><div><div className="eyebrow">領収書</div><h1>領収書を整える</h1><p>PDFへ貼り付ける前に、見やすさと範囲を確認できます。</p></div><div className="page-header-actions"><button className="button primary" onClick={done}><Check size={17} />保存して戻る</button></div></div>
    <div className="receipt-layout">
      <div className="receipt-canvas"><div className="canvas-label"><span>プレビュー</span><small>PDF貼り付け枠</small></div><div className="receipt-preview">{selected ? <img src={selected.url} alt="領収書プレビュー" style={imageStyle} /> : <div className="receipt-empty"><ReceiptText size={34} /><strong>領収書を追加してください</strong><span>撮影または画像ファイルを選択できます</span></div>}</div></div>
      <div className="receipt-controls">
        <div className="control-block"><div className="control-title">画像を追加</div><label className="upload-button"><ImagePlus size={18} />撮影・画像を選択<input type="file" accept="image/*" capture="environment" onChange={e => addFile(e.target.files)} /></label><small>原本を保持し、加工内容も保存します。</small></div>
        <div className="control-block"><div className="control-title">見やすさ</div><div className="segmented">{[['original', '原本'], ['soft', 'ソフト白黒'], ['bw', '白黒・高コントラスト']].map(([value, label]) => <button type="button" key={value} className={filter === value ? 'selected' : ''} onClick={() => { setFilter(value); changeItem({ filter: value }) }}>{label}</button>)}</div></div>
        <div className="control-block"><div className="control-title">位置調整</div><label className="range-label">拡大 <output>{zoom}%</output><input type="range" min="80" max="140" value={zoom} onChange={e => { const value = Number(e.target.value); setZoom(value); changeItem({ zoom: value }) }} /></label><label className="range-label">トリミング <output>{crop}%</output><input type="range" min="0" max="30" value={crop} onChange={e => { const value = Number(e.target.value); setCrop(value); changeItem({ crop: value }) }} /></label><button className="button secondary full" onClick={() => { const next = (rotation + 90) % 360; setRotation(next); changeItem({ rotation: next }) }}><RotateCw size={16} />90度回転</button></div>
        {data.receiptImages?.length > 0 && <div className="control-block"><div className="control-title">添付済み <span>{data.receiptImages.length}枚</span></div>{data.receiptImages.map(item => <button key={item.id} className={`attachment-item ${selected?.id === item.id ? 'active' : ''}`} onClick={() => selectItem(item)}><img src={item.url} alt="" /><span>{item.name}</span><Check size={15} /></button>)}</div>}
      </div>
    </div>
  </div>
}
