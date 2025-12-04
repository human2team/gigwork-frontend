import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const isDev = mode === 'development'
  
  return {
    plugins: [react()],
    server: {
      proxy: {
        '/api': {
          target: isDev ? 'http://localhost:8080' : 'https://gigwork.cloud',
          changeOrigin: true,
          //secure: !isDev, // 운영에서는 SSL 검증
        }
      }
    }
  }
})
