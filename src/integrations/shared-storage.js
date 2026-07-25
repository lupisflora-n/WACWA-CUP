// 認証付きGoogle Sheets共有保存。設定未完了時はApp.jsxの端末保存を継続する。
const storageUrl = import.meta.env.VITE_APPS_SCRIPT_URL
  || 'https://script.google.com/macros/s/AKfycbypf--ECDZXeaXM32FvkkO_f1092xI-_L75k2LnceqsImgUgQk9ZgJFn6wLd_A1Imgz/exec'

export const isSharedStorageConfigured = Boolean(storageUrl && import.meta.env.VITE_SHARED_STORAGE_ENABLED === 'true')

export async function requestSharedStorage(action, payload = {}, idToken = '') {
  if (!storageUrl) throw new Error('共有保存先が設定されていません')
  const response = await fetch(storageUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ action, ...payload, idToken }),
  })
  const result = await response.json()
  if (!response.ok || !result.ok) throw new Error(result.error || '共有保存に失敗しました')
  return result
}

