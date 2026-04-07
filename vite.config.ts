import vue from '@vitejs/plugin-vue'
import path from 'node:path'
import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'

// https://vitejs.dev/config/
export default defineConfig({
  build: {
    lib: {
      entry: path.resolve(__dirname, 'src/entry.ts'),
      name: 'VueTailwindDatepicker',
      fileName: (format) => {
        return format === 'es'
          ? 'vue-tailwind-datepicker.js'
          : 'vue-tailwind-datepicker.umd.cjs'
      },
    },
    rollupOptions: {
      external: ['vue'],
      output: {
        // Provide global variables to use in the UMD build
        // Add external deps here
        globals: {
          vue: 'Vue',
        },
      },
    },
  },
  plugins: [
    vue(),
    dts({
      include: ['src'],
      exclude: [
        'src/App.vue',
        'src/main.ts',
      ],
    }),
  ],
})
