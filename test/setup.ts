import '@testing-library/jest-dom/vitest'
import { afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'

// Auto-cleanup only registers itself when vitest runs with globals enabled.
afterEach(cleanup)
