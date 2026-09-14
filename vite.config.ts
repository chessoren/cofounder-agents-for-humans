import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { miraAccountPlugin } from './mira-account-plugin';

// /api/chat, /api/auth and /api/save-session are served in dev by
// mira-account-plugin.ts, which delegates to electron/api.cjs (shared with prod).
export default defineConfig({
  plugins: [react(), miraAccountPlugin()],
});
