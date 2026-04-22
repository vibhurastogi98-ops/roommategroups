import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
    plugins: [react()],
    server: {
        port: 3001,
        strictPort: true,
        open: true,
        proxy: {
            '/api': {
                target: 'http://127.0.0.1:8787',
                changeOrigin: true,
                rewrite: (path) => path.replace(/^\/api/, '')
            },
            '/r2': {
                target: 'http://127.0.0.1:8787',
                changeOrigin: true
            }
        }
    }
});