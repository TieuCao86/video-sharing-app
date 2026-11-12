/** Jest chạy trực tiếp trên mã TypeScript của app (src/), thay Supabase bằng backend giả lập in-memory. */
module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>/test'],
  transform: { '^.+\\.tsx?$': ['ts-jest', { diagnostics: false, tsconfig: { esModuleInterop: true, jsx: 'react', target: 'es2020', module: 'commonjs', allowJs: true } }] },
  moduleNameMapper: {
    '.*/utils/supabase$': '<rootDir>/test/mocks/fakeSupabase.ts',
    '^@react-native-async-storage/async-storage$': '<rootDir>/test/mocks/asyncStorage.ts',
    '^base64-arraybuffer$': '<rootDir>/test/mocks/base64.ts',
    '^react$': '<rootDir>/test/mocks/react.ts',
    '.*/utils/persistRecording$': '<rootDir>/test/mocks/persistRecording.ts',
  },
  reporters: ['default', ['jest-html-reporter', { pageTitle: '8ThreadsTV – Jest Test Report', outputPath: 'reports/jest-report.html', includeFailureMsg: true }]],
};
