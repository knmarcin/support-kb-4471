import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import { mdsvex } from 'mdsvex';
import { fileURLToPath } from 'node:url';

const layout = (name) => fileURLToPath(new URL(`./src/lib/layouts/${name}.svelte`, import.meta.url));

/** @type {import('@sveltejs/kit').Config} */
export default {
  extensions: ['.svelte', '.svx'],
  // .svx pages are Markdown with components; `layout: runbook` in their frontmatter picks the frame.
  preprocess: [vitePreprocess(), mdsvex({ extensions: ['.svx'], layout: { runbook: layout('runbook') } })],
  kit: {
    // Every page is rendered to a plain .html file in rendered/: the page as the desk sees it.
    adapter: adapter({ pages: 'rendered', assets: 'rendered', strict: true }),
    alias: { '#lib': 'src/lib' },
    prerender: { entries: ['*'] },
    output: { bundleStrategy: 'inline' },
    paths: { relative: true },
  },
};
