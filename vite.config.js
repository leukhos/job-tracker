import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [
    react({
      include: "**/*.{jsx,js}", // This tells Vite to treat .js files as JSX
    }),
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
    extensions: ['.mjs', '.js', '.jsx', '.ts', '.tsx', '.json']
  },
  server: {
    port: 3000, // Match the default CRA port
    open: true,
  },
  build: {
    outDir: 'build', // Match CRA output directory
  },
});
