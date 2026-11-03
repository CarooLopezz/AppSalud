import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

// Borra lo que dibujó cada test. Testing Library lo hace solo únicamente si
// Vitest corre con globals, y este proyecto no los usa.
afterEach(() => {
  cleanup()
})
