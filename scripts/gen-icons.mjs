// PWA 아이콘 생성 — 폰트 의존 없는 벡터({ • } 로고)를 PNG로 래스터화.
import sharp from 'sharp'
import { mkdirSync } from 'node:fs'
import { join } from 'node:path'

const publicDir = join(import.meta.dirname, '..', 'public')
mkdirSync(publicDir, { recursive: true })

const svg = `<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <rect width="512" height="512" rx="112" fill="#11141c"/>
  <g fill="none" stroke="#5eead4" stroke-width="26" stroke-linecap="round" stroke-linejoin="round">
    <path d="M214 144 C 176 144 190 232 150 256 C 190 280 176 368 214 368"/>
    <path d="M298 144 C 336 144 322 232 362 256 C 322 280 336 368 298 368"/>
  </g>
  <circle cx="256" cy="256" r="20" fill="#fbbf24"/>
</svg>`

const buf = Buffer.from(svg)

async function gen(name, size) {
  await sharp(buf).resize(size, size).png().toFile(join(publicDir, name))
  console.log('wrote', name, size)
}

await gen('pwa-192.png', 192)
await gen('pwa-512.png', 512)
await gen('maskable-512.png', 512)
await gen('apple-touch-icon.png', 180)
console.log('done')
