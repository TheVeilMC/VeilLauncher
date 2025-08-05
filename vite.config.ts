import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { resolve } from 'path';
// import obfuscator from 'rollup-plugin-obfuscator'

export default defineConfig({
  plugins: [vue()],

  root: 'renderer',

  base: './',

  build: {
    outDir: '../dist/renderer',
    emptyOutDir: true,
    rollupOptions: {
      input: resolve(__dirname, 'renderer/index.html'),
      // plugins: [
      //   obfuscator({
      //     options: {
      //       compact: true,
      //       controlFlowFlattening: true,
      //       controlFlowFlatteningThreshold: 0.75,
      //       deadCodeInjection: true,
      //       deadCodeInjectionThreshold: 0.4,
      //       debugProtection: true,
      //       debugProtectionInterval: 2000,
      //       disableConsoleOutput: true,
      //       identifierNamesGenerator: 'hexadecimal',
      //       log: false,
      //       numbersToExpressions: true,
      //       renameGlobals: false,
      //       rotateStringArray: true,
      //       selfDefending: true,
      //       shuffleStringArray: true,
      //       simplify: true,
      //       splitStrings: true,
      //       splitStringsChunkLength: 10,
      //       stringArray: true,
      //       stringArrayThreshold: 0.75,
      //       transformObjectKeys: true,
      //       unicodeEscapeSequence: false
      //     }
      //   })
      // ],
      external: ['electron'],
    },
    // minify: 'terser',
    // terserOptions: {
    //   compress: {
    //     drop_console: true,
    //     drop_debugger: true,
    //     pure_funcs: ['console.log', 'console.info', 'console.debug', 'console.warn']
    //   },
    //   mangle: {
    //     toplevel: true
    //   },
    //   format: {
    //     comments: false
    //   }
    // }
  },

  server: {
    port: 3000,
    strictPort: true,
  },

  resolve: {
    alias: {
      '@': resolve(__dirname, 'renderer/src'),
      '@components': resolve(__dirname, 'renderer/src/components'),
      '@views': resolve(__dirname, 'renderer/src/views'),
      '@stores': resolve(__dirname, 'renderer/src/stores'),
      '@services': resolve(__dirname, 'renderer/src/services'),
      '@utils': resolve(__dirname, 'renderer/src/utils'),
      '@assets': resolve(__dirname, 'renderer/src/assets'),
    },
  },

  css: {
    postcss: './postcss.config.js',
  },
});
