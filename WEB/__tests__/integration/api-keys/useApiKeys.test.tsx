/**
 * @jest-environment jsdom
 */
import { renderHook, waitFor, act } from '@testing-library/react'
import { useApiKeys } from '@/app/hooks/useApiKeys'
import { userApi } from '@/lib/api'
import * as handlers from './mocks/handlers'

// Mock next-auth/react
jest.mock('next-auth/react', () => ({
  useSession: () => ({
    data: {
      user: { id: 'test-user-id', email: 'test@example.com' },
      accessToken: 'test-token',
    },
    status: 'authenticated',
  }),
}))

// Mock the API client
jest.mock('@/lib/api', () => ({
  userApi: {
    getApiKeys: jest.fn(),
    updateApiKeys: jest.fn(),
  },
}))

describe('useApiKeys Hook Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Hook initialization and fetching', () => {
    it('should fetch keys on mount when autoFetch is true', async () => {
      const mockGetApiKeys = userApi.getApiKeys as jest.MockedFunction<typeof userApi.getApiKeys>
      mockGetApiKeys.mockResolvedValueOnce(handlers.mockGetApiKeysSuccess)

      const { result } = renderHook(() => useApiKeys(true))

      expect(result.current.isLoading).toBe(true)
      expect(mockGetApiKeys).toHaveBeenCalledTimes(1)

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.apiKeys).toEqual({
        openai: 'sk-...****',
        anthropic: 'sk-ant-...****',
        google: '',
      })
    })

    it('should not fetch keys on mount when autoFetch is false', () => {
      const mockGetApiKeys = userApi.getApiKeys as jest.MockedFunction<typeof userApi.getApiKeys>

      renderHook(() => useApiKeys(false))

      expect(mockGetApiKeys).not.toHaveBeenCalled()
    })

    it('should map API response format to frontend format', async () => {
      const mockGetApiKeys = userApi.getApiKeys as jest.MockedFunction<typeof userApi.getApiKeys>
      mockGetApiKeys.mockResolvedValueOnce({
        openai_api_key: 'sk-test123',
        anthropic_api_key: 'sk-ant-test456',
        google_api_key: 'AIza-test789',
      })

      const { result } = renderHook(() => useApiKeys(true))

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.apiKeys).toEqual({
        openai: 'sk-test123',
        anthropic: 'sk-ant-test456',
        google: 'AIza-test789',
      })
    })

    it('should handle empty API response', async () => {
      const mockGetApiKeys = userApi.getApiKeys as jest.MockedFunction<typeof userApi.getApiKeys>
      mockGetApiKeys.mockResolvedValueOnce(handlers.mockGetApiKeysEmpty)

      const { result } = renderHook(() => useApiKeys(true))

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.apiKeys).toEqual({
        openai: '',
        anthropic: '',
        google: '',
      })
    })

    it('should handle masked keys correctly', async () => {
      const mockGetApiKeys = userApi.getApiKeys as jest.MockedFunction<typeof userApi.getApiKeys>
      mockGetApiKeys.mockResolvedValueOnce({
        openai_api_key: 'sk-...****',
        anthropic_api_key: null,
        google_api_key: null,
      })

      const { result } = renderHook(() => useApiKeys(true))

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.apiKeys.openai).toBe('sk-...****')
    })
  })

  describe('Update keys functionality', () => {
    it('should update single key with debouncing', async () => {
      const mockGetApiKeys = userApi.getApiKeys as jest.MockedFunction<typeof userApi.getApiKeys>
      const mockUpdateApiKeys = userApi.updateApiKeys as jest.MockedFunction<typeof userApi.updateApiKeys>

      mockGetApiKeys.mockResolvedValueOnce(handlers.mockGetApiKeysEmpty)
      mockUpdateApiKeys.mockResolvedValueOnce(handlers.mockUpdateApiKeysSuccess)
      mockGetApiKeys.mockResolvedValueOnce({
        openai_api_key: 'sk-...****',
        anthropic_api_key: null,
        google_api_key: null,
      })

      const { result } = renderHook(() => useApiKeys(true))

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      // Update a single key
      act(() => {
        result.current.updateKeys({ openai: 'sk-new-key-123' })
      })

      // State should update immediately
      expect(result.current.apiKeys.openai).toBe('sk-new-key-123')
      expect(result.current.isSaving).toBe(false) // Not saving yet due to debounce

      // Wait for debounce (500ms)
      await waitFor(
        () => {
          expect(mockUpdateApiKeys).toHaveBeenCalled()
        },
        { timeout: 1000 }
      )

      expect(mockUpdateApiKeys).toHaveBeenCalledWith({
        openai_api_key: 'sk-new-key-123',
      })
    })

    it('should debounce multiple rapid updates', async () => {
      jest.useFakeTimers()
      const mockGetApiKeys = userApi.getApiKeys as jest.MockedFunction<typeof userApi.getApiKeys>
      const mockUpdateApiKeys = userApi.updateApiKeys as jest.MockedFunction<typeof userApi.updateApiKeys>

      mockGetApiKeys.mockResolvedValueOnce(handlers.mockGetApiKeysEmpty)
      mockUpdateApiKeys.mockResolvedValueOnce(handlers.mockUpdateApiKeysSuccess)

      const { result } = renderHook(() => useApiKeys(true))

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      // Make multiple rapid updates
      act(() => {
        result.current.updateKeys({ openai: 'key1' })
      })
      act(() => {
        result.current.updateKeys({ openai: 'key2' })
      })
      act(() => {
        result.current.updateKeys({ openai: 'key3' })
      })

      // Fast-forward time but not enough to trigger debounce
      act(() => {
        jest.advanceTimersByTime(300)
      })

      expect(mockUpdateApiKeys).not.toHaveBeenCalled()

      // Fast-forward past debounce delay
      act(() => {
        jest.advanceTimersByTime(300)
      })

      await waitFor(() => {
        expect(mockUpdateApiKeys).toHaveBeenCalledTimes(1)
      })

      // Should only be called with the last value
      expect(mockUpdateApiKeys).toHaveBeenCalledWith({
        openai_api_key: 'key3',
      })

      jest.useRealTimers()
    })

    it('should update multiple keys at once', async () => {
      const mockGetApiKeys = userApi.getApiKeys as jest.MockedFunction<typeof userApi.getApiKeys>
      const mockUpdateApiKeys = userApi.updateApiKeys as jest.MockedFunction<typeof userApi.updateApiKeys>

      mockGetApiKeys.mockResolvedValueOnce(handlers.mockGetApiKeysEmpty)
      mockUpdateApiKeys.mockResolvedValueOnce(handlers.mockUpdateApiKeysSuccess)
      mockGetApiKeys.mockResolvedValueOnce(handlers.mockUpdateApiKeysSuccess)

      const { result } = renderHook(() => useApiKeys(true))

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      act(() => {
        result.current.updateKeys({
          openai: 'sk-openai-key',
          anthropic: 'sk-ant-key',
          google: 'AIza-key',
        })
      })

      await waitFor(
        () => {
          expect(mockUpdateApiKeys).toHaveBeenCalled()
        },
        { timeout: 1000 }
      )

      expect(mockUpdateApiKeys).toHaveBeenCalledWith({
        openai_api_key: 'sk-openai-key',
        anthropic_api_key: 'sk-ant-key',
        google_api_key: 'AIza-key',
      })
    })

    it('should not send masked keys to update endpoint', async () => {
      const mockGetApiKeys = userApi.getApiKeys as jest.MockedFunction<typeof userApi.getApiKeys>
      const mockUpdateApiKeys = userApi.updateApiKeys as jest.MockedFunction<typeof userApi.updateApiKeys>

      mockGetApiKeys.mockResolvedValueOnce({
        openai_api_key: 'sk-...****',
        anthropic_api_key: null,
        google_api_key: null,
      })

      const { result } = renderHook(() => useApiKeys(true))

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      // Try to update with a masked key (should be ignored)
      act(() => {
        result.current.updateKeys({ openai: 'sk-...****' })
      })

      await waitFor(
        () => {
          // Should not call updateApiKeys because key is masked
        },
        { timeout: 1000 }
      )

      // Wait a bit to ensure no API call was made
      await new Promise((resolve) => setTimeout(resolve, 600))

      expect(mockUpdateApiKeys).not.toHaveBeenCalled()
    })
  })

  describe('Error handling', () => {
    it('should handle API errors when fetching keys', async () => {
      const mockGetApiKeys = userApi.getApiKeys as jest.MockedFunction<typeof userApi.getApiKeys>
      mockGetApiKeys.mockRejectedValueOnce({
        message: 'Failed to fetch API keys',
        status: 500,
      })

      const { result } = renderHook(() => useApiKeys(true))

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.error).toBe('Failed to fetch API keys')
    })

    it('should handle API errors when updating keys', async () => {
      const mockGetApiKeys = userApi.getApiKeys as jest.MockedFunction<typeof userApi.getApiKeys>
      const mockUpdateApiKeys = userApi.updateApiKeys as jest.MockedFunction<typeof userApi.updateApiKeys>

      mockGetApiKeys.mockResolvedValueOnce(handlers.mockGetApiKeysEmpty)
      mockUpdateApiKeys.mockRejectedValueOnce({
        message: 'Failed to update API keys',
        status: 500,
      })

      const { result } = renderHook(() => useApiKeys(true))

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      act(() => {
        result.current.updateKeys({ openai: 'sk-new-key' })
      })

      await waitFor(
        () => {
          expect(result.current.error).toBe('Failed to update API keys')
        },
        { timeout: 1000 }
      )
    })

    it('should clear error on successful operation', async () => {
      const mockGetApiKeys = userApi.getApiKeys as jest.MockedFunction<typeof userApi.getApiKeys>
      const mockUpdateApiKeys = userApi.updateApiKeys as jest.MockedFunction<typeof userApi.updateApiKeys>

      // First call fails
      mockGetApiKeys.mockRejectedValueOnce({
        message: 'Failed to fetch',
        status: 500,
      })

      const { result } = renderHook(() => useApiKeys(true))

      await waitFor(() => {
        expect(result.current.error).toBe('Failed to fetch')
      })

      // Second call succeeds
      mockGetApiKeys.mockResolvedValueOnce(handlers.mockGetApiKeysSuccess)

      act(() => {
        result.current.fetchKeys()
      })

      await waitFor(() => {
        expect(result.current.error).toBeNull()
      })
    })
  })

  describe('Loading states', () => {
    it('should set isLoading during fetch', async () => {
      const mockGetApiKeys = userApi.getApiKeys as jest.MockedFunction<typeof userApi.getApiKeys>
      mockGetApiKeys.mockImplementation(
        () =>
          new Promise((resolve) => {
            setTimeout(() => resolve(handlers.mockGetApiKeysSuccess), 100)
          })
      )

      const { result } = renderHook(() => useApiKeys(true))

      expect(result.current.isLoading).toBe(true)

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })
    })

    it('should set isSaving during update', async () => {
      const mockGetApiKeys = userApi.getApiKeys as jest.MockedFunction<typeof userApi.getApiKeys>
      const mockUpdateApiKeys = userApi.updateApiKeys as jest.MockedFunction<typeof userApi.updateApiKeys>

      mockGetApiKeys.mockResolvedValueOnce(handlers.mockGetApiKeysEmpty)
      mockUpdateApiKeys.mockImplementation(
        () =>
          new Promise((resolve) => {
            setTimeout(() => resolve(handlers.mockUpdateApiKeysSuccess), 100)
          })
      )
      mockGetApiKeys.mockResolvedValueOnce(handlers.mockGetApiKeysSuccess)

      const { result } = renderHook(() => useApiKeys(true))

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      act(() => {
        result.current.updateKeys({ openai: 'sk-new-key' })
      })

      await waitFor(
        () => {
          expect(result.current.isSaving).toBe(true)
        },
        { timeout: 1000 }
      )

      await waitFor(() => {
        expect(result.current.isSaving).toBe(false)
      })
    })
  })
})
