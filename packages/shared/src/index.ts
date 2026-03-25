// ============================================
// Shared types & constants for vb_start_kit
// ============================================

/** Authenticated user payload from Supabase JWT */
export interface AuthUser {
  id: string;
  email: string;
  role?: string;
}

/** Standard API response wrapper */
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

/** Pagination params */
export interface PaginationQuery {
  page?: number;
  limit?: number;
}

/** Pagination metadata */
export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

/** Paginated API response */
export interface PaginatedResponse<T = unknown> extends ApiResponse<T[]> {
  meta?: PaginationMeta;
}

/** Upload response */
export interface UploadResult {
  path: string;
  url: string;
}

// Route constants
export const AUTH_ROUTES = {
  LOGIN: '/login',
  SIGNUP: '/signup',
} as const;

export const PROTECTED_ROUTES = ['/dashboard'] as const;
