import { getSession } from 'next-auth/react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

interface ApiError {
  message: string;
  status: number;
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    includeAuth: boolean = true
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    // Get JWT token from NextAuth session
    if (includeAuth) {
      const session = await getSession();
      if (session?.accessToken) {
        (headers as Record<string, string>)['Authorization'] = `Bearer ${session.accessToken}`;
      }
    }

    const config: RequestInit = {
      ...options,
      headers,
    };

    const response = await fetch(url, config);

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      const apiError: ApiError = {
        message: error.detail || 'An error occurred',
        status: response.status,
      };
      throw apiError;
    }

    return response.json();
  }

  async get<T>(endpoint: string, includeAuth: boolean = true): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' }, includeAuth);
  }

  async post<T>(endpoint: string, data: unknown, includeAuth: boolean = true): Promise<T> {
    return this.request<T>(
      endpoint,
      {
        method: 'POST',
        body: JSON.stringify(data),
      },
      includeAuth
    );
  }

  async put<T>(endpoint: string, data: unknown, includeAuth: boolean = true): Promise<T> {
    return this.request<T>(
      endpoint,
      {
        method: 'PUT',
        body: JSON.stringify(data),
      },
      includeAuth
    );
  }

  async delete<T>(endpoint: string, includeAuth: boolean = true): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' }, includeAuth);
  }
}

// Export singleton instance
export const api = new ApiClient(API_URL);

// Types
export interface SignupData {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
}

export interface UserResponse {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: UserResponse;
}

// User API methods (signup only - login handled by NextAuth)
export const userApi = {
  /**
   * Create a new user account
   * After signup, user should login through NextAuth
   */
  signup: async (data: SignupData): Promise<AuthResponse> => {
    return api.post<AuthResponse>('/users/', data, false);
  },

  /**
   * Get current user profile (requires auth)
   */
  getProfile: (): Promise<UserResponse> => {
    return api.get<UserResponse>('/users/me');
  },
};
