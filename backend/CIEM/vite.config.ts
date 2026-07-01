import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    host: '0.0.0.0',
    allowedHosts: [
      '.sslip.io',
      'pierociem-ciemmonorepo-zrt1ty-11e1ec-5-189-131-197.sslip.io',
      'pierociem-ciemmonorepo-zrt1ty-a56b73-5-189-131-197.sslip.io',
    ],
  },
})
