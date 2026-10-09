import { defineConfig } from 'vite';
export default defineConfig({ server: { port: 5173, proxy: { '/ws': { target: 'ws://127.0.0.1:3001', ws: true }, '/health': 'http://127.0.0.1:3001' } }, build: { outDir: 'dist' } });
