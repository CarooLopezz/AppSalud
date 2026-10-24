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
    // Todos los archivos usan la misma base de prueba: de a uno, para que
    // no se pisen los datos entre sí
    fileParallelism: false,
  },
});
