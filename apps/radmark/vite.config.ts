import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'
import { copyFileSync, mkdirSync, existsSync, readdirSync } from 'fs'

// Plugin to copy public files to dist after build
function copyPublicPlugin() {
  return {
    name: 'copy-public',
    closeBundle() {
      const publicDir = resolve(__dirname, 'public')
      const distDir = resolve(__dirname, 'dist')

      // Copy manifest.json
      copyFileSync(
        resolve(publicDir, 'manifest.json'),
        resolve(distDir, 'manifest.json')
      )

      // Copy icons if they exist
      const iconsDir = resolve(publicDir, 'icons')
      const distIconsDir = resolve(distDir, 'icons')
      if (existsSync(iconsDir)) {
        if (!existsSync(distIconsDir)) {
          mkdirSync(distIconsDir, { recursive: true })
        }
        const icons = readdirSync(iconsDir)
        icons.forEach((icon) => {
          copyFileSync(resolve(iconsDir, icon), resolve(distIconsDir, icon))
        })
      }

      // Copy content.css if it exists
      const contentCss = resolve(publicDir, 'assets', 'content.css')
      const distAssetsDir = resolve(distDir, 'assets')
      if (existsSync(contentCss)) {
        if (!existsSync(distAssetsDir)) {
          mkdirSync(distAssetsDir, { recursive: true })
        }
        copyFileSync(contentCss, resolve(distAssetsDir, 'content.css'))
      }
    },
  }
}

export default defineConfig({
  plugins: [react(), copyPublicPlugin()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        popup: resolve(__dirname, 'src/popup/index.html'),
        options: resolve(__dirname, 'src/options/index.html'),
        content: resolve(__dirname, 'src/content/index.ts'),
        background: resolve(__dirname, 'src/background/index.ts'),
      },
      output: {
        entryFileNames: '[name].js',
        chunkFileNames: 'chunks/[name].[hash].js',
        assetFileNames: 'assets/[name].[ext]',
      },
    },
    emptyOutDir: true,
  },
})
