// ../types/auth.ts
export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  iat?: number; // Optional: issued-at timestamp
  exp?: number; // Optional: expiration timestamp
}

export interface AuthResponse {
  token: string;
  user: User;
}