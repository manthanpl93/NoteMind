// Test setup for API keys integration tests
import { jest } from '@jest/globals'

// Mock fetch globally
global.fetch = jest.fn() as jest.MockedFunction<typeof fetch>

// Mock NextAuth session
export const mockSession = {
  user: {
    id: 'test-user-id',
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
  },
  accessToken: 'test-access-token',
  expires: '2025-12-31',
}

export const mockUseSession = jest.fn(() => ({
  data: mockSession,
  status: 'authenticated',
}))

// Reset mocks before each test
beforeEach(() => {
  jest.clearAllMocks()
  ;(global.fetch as jest.MockedFunction<typeof fetch>).mockClear()
})
