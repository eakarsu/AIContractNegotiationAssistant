import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [
    react({
      include: [/\.tsx?$/, /\.jsx?$/],
    }),
  ],
  esbuild: {
    loader: 'tsx',
    include: [/src\/.*\.[jt]sx?$/],
    exclude: [],
  },
  optimizeDeps: {
    esbuildOptions: {
      loader: { '.js': 'jsx' },
    },
  },
  server: {
    host: '127.0.0.1',
    port: Number(process.env.FRONTEND_PORT || 5173),
    proxy: {
      '/api': {
        target: `http://127.0.0.1:${process.env.BACKEND_PORT || process.env.PORT || 5001}`,
        changeOrigin: true,
      },
    },
  },
})
