import { createClient } from './supabase/client';
import type { ApiResponse } from '@vb/shared';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000';

/**
 * Resolve access token: use explicit token if provided,
 * otherwise fall back to Supabase session with auto-refresh.
 */
async function resolveToken(accessToken?: string): Promise<string | null> {
  if (accessToken) return accessToken;

  const supabase = createClient();

  // getUser() validates and refreshes the token if needed
  const { error } = await supabase.auth.getUser();
  if (error) return null;

  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token ?? null;
}

/**
 * Authenticated fetch wrapper for backend API calls.
 * Pass accessToken explicitly, or it will auto-resolve from Supabase session.
 */
export async function apiFetch<T = unknown>(
  path: string,
  options: RequestInit = {},
  accessToken?: string,
): Promise<ApiResponse<T>> {
  const token = await resolveToken(accessToken);

  if (!token) {
    return { success: false, error: 'Not authenticated' };
  }

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;

  const response = await fetch(`${BACKEND_URL}/api${path}`, {
    ...options,
    headers,
  });

  return response.json();
}

/**
 * Upload a file to the backend.
 * Uses FormData instead of JSON.
 */
export async function apiUpload<T = unknown>(
  path: string,
  file: File,
  accessToken?: string,
): Promise<ApiResponse<T>> {
  const token = await resolveToken(accessToken);

  if (!token) {
    return { success: false, error: 'Not authenticated' };
  }

  const formData = new FormData();
  formData.append('file', file);

  const headers: Record<string, string> = {
    'Authorization': `Bearer ${token}`,
  };

  const response = await fetch(`${BACKEND_URL}/api${path}`, {
    method: 'POST',
    headers,
    body: formData,
  });

  return response.json();
}
