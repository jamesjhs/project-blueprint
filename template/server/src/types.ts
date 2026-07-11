export interface User {
  id: number;
  email: string;
  password_hash: string;
  role: string;
  created_at: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}
