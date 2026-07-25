import { copyFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'

const distIndex = resolve('dist/index.html')
const distFallback = resolve('dist/404.html')

if (!existsSync(distIndex)) {
  throw new Error('dist/index.html が見つかりません。先にViteのビルドを実行してください。')
}

copyFileSync(distIndex, distFallback)
console.log('GitHub Pages用のSPAフォールバックを作成しました: dist/404.html')
