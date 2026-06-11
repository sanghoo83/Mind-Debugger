import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// GitHub Pages(프로젝트 사이트)는 /<저장소>/ 하위에 서빙된다.
// CI에서는 저장소명을 자동으로 base로 잡고, 로컬·다른 호스트(Netlify 등)에선 '/'.
const repo = (process.env.GITHUB_REPOSITORY || '').split('/')[1]
const base = process.env.GITHUB_ACTIONS === 'true' && repo ? `/${repo}/` : '/'

export default defineConfig({
  base,
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['apple-touch-icon.png'],
      manifest: {
        name: 'Mind Debugger',
        short_name: 'Mind Debugger',
        description: '피드백에서 사실과 감정을 분리하는 생각 파서 — 먼저 네 편이 되어줄게.',
        lang: 'ko',
        theme_color: '#0f1117',
        background_color: '#0f1117',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        icons: [
          { src: 'pwa-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
    }),
  ],
})
