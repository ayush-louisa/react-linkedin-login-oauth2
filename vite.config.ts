import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import dts from 'vite-plugin-dts';
import { resolve } from 'node:path';
import { fileURLToPath, URL } from 'node:url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig({
  plugins: [
    react(),
    dts({
      insertTypesEntry: true,
    }),
  ],
  build: {
    cssCodeSplit: true,
    emptyOutDir: true,
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'ReactLinkedInLoginOAuth2',
      formats: ['es', 'cjs'],
      fileName: (format) => `index.${format === 'es' ? 'esm' : 'cjs'}.js`,
    },
    rollupOptions: {
      external: ['react', 'react-dom'],
      // Enable tree-shaking optimizations
      treeshake: {
        moduleSideEffects: false,
        propertyReadSideEffects: false,
        unknownGlobalSideEffects: false,
      },
      output: {
        // Use named exports consistently
        exports: 'named',
        // Preserve modules for better tree-shaking
        preserveModules: true,
        preserveModulesRoot: 'src',
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
        },
      },
      // Additional rollup options for production builds
      ...(process.env.BUILD_MODE !== 'dev' && {
        plugins: [
          // Drop console statements in production
          // {
          //   name: 'drop-console',
          //   renderChunk(code) {
          //     const transformedCode = code.replace(
          //       /console\.(log|info|warn|error|debug)\([^)]*\);?/g,
          //       '',
          //     );
          //     return {
          //       code: transformedCode,
          //       map: null, // Explicitly set map to null since we're doing simple replacement
          //     };
          //   },
          // },
        ],
      }),
    },
    sourcemap: true,
    minify: process.env.BUILD_MODE !== 'dev',
    target: 'es2015',
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/__tests__/setup.ts'],
    include: [
      'src/**/__tests__/**/*.{test,spec}.{ts,tsx}',
      'src/**/*.{test,spec}.{ts,tsx}',
    ],
    exclude: ['**/setup.ts', 'node_modules/**', 'dist/**'],
    coverage: {
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['src/**/*.d.ts', 'src/**/__tests__/**'],
    },
  },
});
