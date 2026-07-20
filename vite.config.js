import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  base: '/GR_Store/',
  plugins: [react(), tailwindcss()],
  // Evita falhas do observador nativo dentro de diretórios sincronizados pelo OneDrive.
  server: {
    fs: { strict: false },
    watch: { usePolling: true },
  },
})
