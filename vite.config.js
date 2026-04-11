import { defineConfig } from "vite";

export default defineConfig({
    server: {
        port: 3001,       // change to 3001
        strictPort: true, // IMPORTANT: stop auto switching
        open: true,
        proxy: {
            '/api': 'http://localhost:3002',
            '/uploads': 'http://localhost:3002'
        }
    }
});