import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwind from 'tailwindcss';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const app = fileURLToPath(new URL('../../../apps/web/', import.meta.url));
const theme = require(app + 'tailwind.config.js');
export default defineConfig({
  root: fileURLToPath(new URL('.', import.meta.url)), envDir: false, publicDir: app + 'public',
  plugins: [react()],
  resolve: { alias: [
    { find: '@/features/business-panel/hooks/useBusinessPanelTheme', replacement: fileURLToPath(new URL('./theme-fixture.ts', import.meta.url)) },
    { find: '@/utils', replacement: app + 'src/shared/utils' },
    { find: '@', replacement: app + 'src' },
  ] },
  css: { postcss: { plugins: [tailwind({ ...theme, content: [app + 'src/**/*.{ts,tsx}', fileURLToPath(new URL('./*.tsx', import.meta.url))] })] } },
  server: { host: '127.0.0.1', port: 4332, strictPort: true, fs: { allow: [fileURLToPath(new URL('../../../', import.meta.url))] } },
});
