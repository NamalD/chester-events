import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://namald.github.io',
  base: '/chester-events',
  output: 'static',
  devToolbar: { enabled: false },
});
