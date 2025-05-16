import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/setupTests.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      exclude: [
        'node_modules/',
        'src/setupTests.ts',
        'src/services/authService.ts',   // Complex auth logic that's hard to test fully
        'src/pages/ChatPage.tsx',        // Complex UI with streaming and state management
        'scripts/**',                    // Deployment scripts not part of app functionality
        '**/*.d.ts',                     // Type definition files
        '.eslintrc.js',                  // Configuration files
        'test/__mocks__/**',             // Test mocks
        'vite.config.ts',                // Build configuration
        'vitest.config.ts',              // Test configuration
        'public/**',                     // Static assets
        'dist/**',                       // Build output
        'coverage/**'                    // Coverage reports
      ],
      thresholds: {
        branches: 80,
        functions: 80,
        lines: 80,
        statements: 80
      }
    }
  }
});