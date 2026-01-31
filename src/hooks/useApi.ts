'use client';

import { useState, useCallback } from 'react';
import type { ApiError } from '@/types';

const API_URL = process.env.NEXT_PUBLIC_VPS_API || '';

interface UseApiOptions {
  password?: string;
}

interface UseApiReturn {
  loading: boolean;
  error: ApiError | null;
  fetchApi: <T>(endpoint: string, options?: RequestInit) => Promise<T | null>;
  clearError: () => void;
}

export function useApi({ password }: UseApiOptions = {}): UseApiReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  const fetchApi = useCallback(async <T,>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<T | null> => {
    if (!API_URL) {
      setError({ message: 'API URL not configured', code: 'CONFIG_ERROR' });
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      const sep = endpoint.includes('?') ? '&' : '?';
      const url = `${API_URL}${endpoint}${sep}pwd=${encodeURIComponent(password || '')}`;
      
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        const apiError: ApiError = data.error || { 
          message: 'Request failed', 
          code: 'REQUEST_ERROR' 
        };
        setError(apiError);
        return null;
      }

      return data as T;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError({ message: errorMessage, code: 'NETWORK_ERROR' });
      return null;
    } finally {
      setLoading(false);
    }
  }, [password]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return { loading, error, fetchApi, clearError };
}
