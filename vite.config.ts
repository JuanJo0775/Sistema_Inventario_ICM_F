import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { resolve } from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [tailwindcss(), react()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          if (id.includes('/node_modules/react/') || id.includes('/node_modules/react-dom/') || id.includes('/node_modules/react-router-dom/')) {
            return 'vendor-react'
          }
          if (id.includes('/node_modules/lucide-react/') || id.includes('/node_modules/i18next/') || id.includes('/node_modules/react-i18next/') || id.includes('/node_modules/zustand/') || id.includes('/node_modules/axios/') || id.includes('/node_modules/zod/') || id.includes('/node_modules/react-hook-form/') || id.includes('/node_modules/@hookform/')) {
            return 'vendor-ui'
          }
        },
      },
    },
  },
})
