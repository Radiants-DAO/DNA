import { defineConfig } from 'wxt';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  srcDir: 'src',
  modules: ['@wxt-dev/module-react'],
  vite: () => ({
    plugins: [tailwindcss()],
  }),
  manifest: {
    name: 'Flow',
    description: 'Visual context tool for AI-assisted web development',
    permissions: ['activeTab', 'scripting', 'storage', 'tabs', 'debugger', 'webNavigation', 'alarms', 'sidePanel'],
    host_permissions: ['<all_urls>'],
    action: {},
  },
});
