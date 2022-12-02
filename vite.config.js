import { resolve } from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// root entry path
const root = resolve(__dirname, 'src/views');

export default defineConfig({
  root,
  publicDir: resolve(__dirname, 'public'),

  resolve: {
    alias: {
      // Important: the slash `/` must be before an alias, otherwise in dev mode alias don't work
      '/@/assets': resolve(__dirname, 'src/assets'),
      '/@/styles': `${resolve(__dirname, 'src/assets/sass')}/`,
      '/@/images': `${resolve(__dirname, 'src/assets/images')}/`,
      '/@/components': resolve(__dirname, 'src/components'),
      '/@/hooks': resolve(__dirname, 'src/hooks'),
      '/@/helpers': resolve(__dirname, 'src/helpers'),
    },
  },

  build: {
    outDir: resolve(__dirname, 'dist'),
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: resolve(root, 'index.html'),
        about: resolve(root, 'about/index.html'),
      },
    },
  },

  plugins: [react()],
  // server: {
  //   open: true,
  // },
});