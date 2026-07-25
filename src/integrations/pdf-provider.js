// 固定の公開WebアプリURL。環境変数があれば将来の差し替えにも対応する。
const appsScriptUrl = import.meta.env.VITE_APPS_SCRIPT_URL
  || 'https://script.google.com/macros/s/AKfycbypf--ECDZXeaXM32FvkkO_f1092xI-_L75k2LnceqsImgUgQk9ZgJFn6wLd_A1Imgz/exec'

export const isAppsScriptConfigured = Boolean(appsScriptUrl)

export async function requestSlidesPdf({ report, reports, tagValues, tagValuesById, tags, placements, fileName, idToken = '' }) {
  if (!appsScriptUrl) throw new Error('Apps Scriptの接続先が設定されていません')
  const response = await fetch(appsScriptUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ action: 'generatePdf', report, reports, tagValues, tagValuesById, tags, placements, fileName, idToken }),
  })
  if (!response.ok) throw new Error(`PDF生成サービスに接続できませんでした (${response.status})`)
  const result = await response.json()
  if (!result.ok) throw new Error(result.error || 'PDF生成に失敗しました')
  return result
}
