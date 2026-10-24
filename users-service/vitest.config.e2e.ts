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
      // Límite de intentos muy alto para que los tests de login/registro no lo
      // toquen. El test del límite (rate-limit.e2e-spec.ts) lo baja por su cuenta.
      THROTTLE_LIMIT: '100000',
    },
    testTimeout: 30000,
    // Todos los archivos usan la misma base de prueba: de a uno, para que no se
    // pisen los datos ni la variable THROTTLE_LIMIT entre archivos.
    fileParallelism: false,
  },
});
