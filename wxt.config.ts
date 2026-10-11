import { defineConfig } from 'wxt';
import tailwindcss from '@tailwindcss/vite';

// See https://wxt.dev/api/config.html
export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  vite: () => ({
    plugins: [tailwindcss()],
  }),
  manifest: {
    name: 'Gimme My Feed',
    description: 'A dry one-line reality check above every LinkedIn post.',
    permissions: ['storage'],
    host_permissions: [
      '*://*.linkedin.com/*',
      'https://generativelanguage.googleapis.com/*',
    ],
  },
});
