import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0', // Permite acesso de qualquer IP
    port: 5173, // Porta padrão
    https: false, // Desabilita HTTPS para desenvolvimento
  },
  preview: {
    host: '0.0.0.0',
    port: 5173,
  },
})
