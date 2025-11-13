export default {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  testMatch: [
    '**/__tests__/**/*.test.{ts,tsx}',
    '!**/e2e/**',
  ],
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      tsconfig: {
        esModuleInterop: true,
        target: 'ES2020',
      },
      isolatedModules: false,
    }],
  },
  transformIgnorePatterns: [
    'node_modules/(?!(.*\\.mjs$))',
  ],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '^pdfjs-dist/web/pdf_viewer\\.css$': '<rootDir>/src/__tests__/__mocks__/pdfjs-dist-web-pdf_viewer.css.js',
    '^pdfjs-dist$': '<rootDir>/src/__tests__/__mocks__/pdfjs-dist.js',
    '^pdfjs-dist/build/pdf\\.worker\\.min\\.js\\?url$': '<rootDir>/src/__tests__/__mocks__/pdfjs-worker.js',
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.ts'],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/main.tsx',
    '!src/vite-env.d.ts',
    '!src/components/PDFViewer.tsx', // Exclude PDFViewer from coverage for now
  ],
  coverageThreshold: {
    global: {
      branches: 0,
      functions: 0,
      lines: 0,
      statements: 0,
    },
  },
};

