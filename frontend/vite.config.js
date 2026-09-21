import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true,
    watch: {
      // Required for HMR to work inside Docker on Windows —
      // bind mounts don't propagate inotify events so we fall back to polling.
      usePolling: true,
      interval: 300
    }
  }
});
