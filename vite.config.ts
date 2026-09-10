import { defineConfig } from 'vite'

export default defineConfig({
  publicDir: false,
  build: {
    lib: {
      entry: 'src/carlinko-card.ts',
      formats: ['es'],
      fileName: () => 'carlinko-card.js',
    },
    outDir: 'custom_components/carlinko/www',
    emptyOutDir: false,
  },
})
