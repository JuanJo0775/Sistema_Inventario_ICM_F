import { defineConfig } from 'vitest/config'
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
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    exclude: ['e2e/**', 'node_modules/**'],
    env: {
      VITE_API_BASE_URL: 'http://localhost:8000/api/v1',
      VITE_USE_MOCKS: 'false',
    },
    css: false,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'json-summary'],
      reportsDirectory: './coverage',
      include: ['src/features/**/*.{ts,tsx}', 'src/services/**/*.{ts,tsx}', 'src/store/**/*.{ts,tsx}'],
      exclude: [
        'src/features/**/*.test.{ts,tsx}',
        'src/features/landing/LandingPage.tsx',
        'src/mocks/**',
        'src/test/**',
        'src/**/*.d.ts',
        'src/main.tsx',
        'src/vite-env.d.ts',
      ],
      thresholds: {
        lines: 60,
        functions: 60,
        branches: 50,
        statements: 60,
      },
    },
  },
})
