import '@testing-library/jest-dom'

// Mock environment variables for testing
process.env.NEXT_PUBLIC_ZK_EMAIL_ENABLED = 'true'
process.env.NEXT_PUBLIC_ZK_EMAIL_DEV_MODE = 'true'
process.env.NEXT_PUBLIC_ZK_EMAIL_BLUEPRINT_ID = '0213eb97-8d11-4e69-a35f-e152c311c2d7'

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}