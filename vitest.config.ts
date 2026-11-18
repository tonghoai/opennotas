// Fast unit/component suite. Files under tests/nuxt use the Nuxt runtime;
// the rest run in happy-dom with fake IndexedDB and the DOM stubs in tests/setup/unit.ts.
import { defineVitestConfig } from '@nuxt/test-utils/config';

export default defineVitestConfig({
  test: {
    environment: 'happy-dom',
    setupFiles: ['./tests/setup/unit.ts'],
    include: ['tests/unit/**/*.spec.ts', 'tests/nuxt/**/*.nuxt.spec.ts'],
    testTimeout: 20_000,
    hookTimeout: 30_000,
    restoreMocks: true,
    clearMocks: true,
  },
});
