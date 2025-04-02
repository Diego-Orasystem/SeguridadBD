export interface User {
  id: number;
  username: string;
  email: string;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  token: string;
  user: User;
}

export interface RegisterRequest {
  username: string;
  password: string;
  email: string;
} 