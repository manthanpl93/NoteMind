'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { userApi, APIKeysResponse } from '@/lib/api'

export interface ApiKeys {
  openai: string
  anthropic: string
  google: string
}

export function useApiKeys(autoFetch: boolean = true) {
  const [apiKeys, setApiKeys] = useState<ApiKeys>({
    openai: '',
    anthropic: '',
    google: '',
  })
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Debounce timer ref
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)
  // Ref to track current apiKeys state for debounced callback
  const apiKeysRef = useRef<ApiKeys>(apiKeys)

  // Map API response format to frontend format
  const mapApiToFrontend = useCallback((apiResponse: APIKeysResponse): ApiKeys => {
    return {
      openai: apiResponse.openai_api_key || '',
      anthropic: apiResponse.anthropic_api_key || '',
      google: apiResponse.google_api_key || '',
    }
  }, [])

  // Map frontend format to API request format
  const mapFrontendToApi = useCallback((keys: Partial<ApiKeys>) => {
    const apiKeys: { openai_api_key?: string | null; anthropic_api_key?: string | null; google_api_key?: string | null } = {}
    
    if (keys.openai !== undefined) {
      apiKeys.openai_api_key = keys.openai || null
    }
    if (keys.anthropic !== undefined) {
      apiKeys.anthropic_api_key = keys.anthropic || null
    }
    if (keys.google !== undefined) {
      apiKeys.google_api_key = keys.google || null
    }
    
    return apiKeys
  }, [])

  // Check if a key is masked (contains **** pattern)
  const isMaskedKey = useCallback((key: string): boolean => {
    return key.includes('****')
  }, [])

  // Update ref when apiKeys changes
  useEffect(() => {
    apiKeysRef.current = apiKeys
  }, [apiKeys])

  // Fetch keys from API
  const fetchKeys = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      const response = await userApi.getApiKeys()
      const mappedKeys = mapApiToFrontend(response)
      setApiKeys(mappedKeys)
    } catch (err: any) {
      const errorMessage = err?.message || 'Failed to fetch API keys'
      setError(errorMessage)
      console.error('Error fetching API keys:', err)
    } finally {
      setIsLoading(false)
    }
  }, [mapApiToFrontend])

  // Update keys with debouncing
  const updateKeys = useCallback((keys: Partial<ApiKeys>) => {
    // Update local state immediately
    setApiKeys((prev) => ({ ...prev, ...keys }))
    setError(null)

    // Clear existing timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }

    // Set new timer for debounced API call
    debounceTimerRef.current = setTimeout(async () => {
      setIsSaving(true)
      
      try {
        // Get current state from ref to check for masked keys
        const current = apiKeysRef.current
        
        // Filter out masked keys and empty values - only send non-masked keys
        const keysToUpdate: Partial<ApiKeys> = {}
        
        if (keys.openai !== undefined) {
          const value = current.openai
          if (value && !isMaskedKey(value)) {
            keysToUpdate.openai = value
          }
        }
        if (keys.anthropic !== undefined) {
          const value = current.anthropic
          if (value && !isMaskedKey(value)) {
            keysToUpdate.anthropic = value
          }
        }
        if (keys.google !== undefined) {
          const value = current.google
          if (value && !isMaskedKey(value)) {
            keysToUpdate.google = value
          }
        }

        // Only make API call if there are keys to update
        if (Object.keys(keysToUpdate).length > 0) {
          const apiFormat = mapFrontendToApi(keysToUpdate)
          await userApi.updateApiKeys(apiFormat)
          
          // Refresh keys after update to get masked response
          await fetchKeys()
        }
      } catch (err: any) {
        const errorMessage = err?.message || 'Failed to update API keys'
        setError(errorMessage)
        console.error('Error updating API keys:', err)
      } finally {
        setIsSaving(false)
      }
    }, 500) // 500ms debounce
  }, [isMaskedKey, mapFrontendToApi, fetchKeys])

  // Auto-fetch on mount if enabled
  useEffect(() => {
    if (autoFetch) {
      fetchKeys()
    }
  }, [autoFetch, fetchKeys])

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [])

  return {
    apiKeys,
    isLoading,
    isSaving,
    error,
    fetchKeys,
    updateKeys,
  }
}
