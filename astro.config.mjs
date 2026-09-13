// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  site: 'https://hakanotal.github.io',
  base: '/future-of-ai',
  output: 'static',
  redirects: {
    '/a/tescreal': '/',
  },
  vite: {
    plugins: [tailwindcss()],
  },
});
