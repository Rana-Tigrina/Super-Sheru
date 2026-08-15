import { defineConfig } from 'vite';

/* GRD v2 build notes:
 *  - base './'         → dist/ runs from file:// or any static host.
 *  - JSON level files  → bundled as ES modules (imported by main.js),
 *                        so the built game has zero runtime fetches.
 *  - es2020 target     → BigInt/optional-chaining era browsers only.
 */
export default defineConfig({
    base: './',
    build: {
        target: 'es2020',
        outDir: 'dist',
        assetsInlineLimit: 0,
        sourcemap: false,
        modulePreload: { polyfill: false },
    },
    server: {
        port: 5173,
        strictPort: true,
    },
    json: {
        namedExports: true,
    },
});