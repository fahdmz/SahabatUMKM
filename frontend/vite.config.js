import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      // App shell only — precaches build assets so the UI loads instantly
      // and works offline; data still needs a connection (Supabase calls).
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico}'],
      },
      manifest: {
        name: 'Sahabat UMKM',
        short_name: 'Sahabat UMKM',
        description: 'Catat jualan jadi gampang, Ibu makin tenang',
        lang: 'id',
        start_url: '/Beranda',
        display: 'standalone',
        background_color: '#f5f2eb',
        theme_color: '#15803d',
        icons: [
          {
            src: 'pwa-192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'pwa-512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: 'pwa-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
    }),
  ],
})