const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// Token storage utilities
export const tokenStorage = {
  getToken: (): string | null => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('access_token');
    }
    return null;
  },
  setToken: (token: string): void => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('access_token', token);
    }
  },
  removeToken: (): void => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('access_token');
    }
  },
};

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

    // Add JWT token to request if available and auth is required
    if (includeAuth) {
      const token = tokenStorage.getToken();
      if (token) {
        (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
      }
    }

    const config: RequestInit = {
      ...options,
      headers,
    };

    const response = await fetch(url, config);

    if (!response.ok) {
      // Handle 401 - token expired or invalid
      if (response.status === 401) {
        tokenStorage.removeToken();
      }
      
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

export interface LoginData {
  email: string;
  password: string;
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

// User API methods
export const userApi = {
  /**
   * Create a new user account and get JWT token
   */
  signup: async (data: SignupData): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/users', data, false);
    // Store the token
    tokenStorage.setToken(response.access_token);
    return response;
  },

  /**
   * Login and get JWT token
   */
  login: async (data: LoginData): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/users/login', data, false);
    // Store the token
    tokenStorage.setToken(response.access_token);
    return response;
  },

  /**
   * Logout - clear stored token
   */
  logout: (): void => {
    tokenStorage.removeToken();
  },

  /**
   * Get current user profile (requires auth)
   */
  getProfile: (): Promise<UserResponse> => {
    return api.get<UserResponse>('/users/me');
  },

  /**
   * Check if user has a stored token
   */
  isAuthenticated: (): boolean => {
    return tokenStorage.getToken() !== null;
  },
};
