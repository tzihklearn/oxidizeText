import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig({
  plugins: [vue()],
  test: {
    environment: 'happy-dom',
    include: ['src/**/*.{test,spec}.{ts,js}'],
    globals: true,
    setupFiles: ['src/__tests__/setup.ts'],
    alias: {
      '@tauri-apps/api/core': resolve(__dirname, 'src/__tests__/__mocks__/tauri-api.ts'),
    },
  },
})
