// Test setup for chats integration tests
import { jest } from '@jest/globals'

// Mock fetch globally
global.fetch = jest.fn() as jest.MockedFunction<typeof fetch>

// Mock NextAuth session
export const mockSession = {
  user: {
    name: 'Test User',
    email: 'test@example.com',
  },
  accessToken: 'mock-token',
  expires: '2099-12-31',
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