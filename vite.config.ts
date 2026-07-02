import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  // 상대 경로 빌드: GitHub Pages(프로젝트 페이지) 등 어떤 하위 경로에서도 동작
  base: './',
  plugins: [react()],
  build: {
    target: 'es2020',
    chunkSizeWarningLimit: 1600,
  },
})
