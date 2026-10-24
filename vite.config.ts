import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

// Cấu hình Vite cho paperfly.site
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
})
