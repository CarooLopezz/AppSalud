import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: { tsconfigPaths: true },
  test: {
    globals: true,
    root: './',
    include: ['**/*.e2e-spec.ts'],
      env: {
      MONGO_URI: 'mongodb://localhost:27017/appsalud_test_users',
      JWT_SECRET: 'clave_de_test',
    },
    testTimeout: 30000,

  
  },
});
