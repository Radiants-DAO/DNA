import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    // Don't pre-bundle local workspace packages — serve their dist directly
    // so tsup rebuilds are picked up immediately without Vite cache staleness.
    exclude: ['@rdna/dithwather-core', '@rdna/dithwather-react'],
  },
})
