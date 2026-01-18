import { Request } from 'express';
import { JwtPayload } from 'jsonwebtoken';

export interface User {
  id: number;
  name: string;
  email: string;
  password: string;
  created_at?: string;
}

export interface UserResponse {
  id: number;
  name: string;
  email: string;
}

export interface AuthResponse {
  message: string;
  token: string;
  user: UserResponse;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface JwtUserPayload extends JwtPayload {
  userId: number;
  email: string;
}

export interface AuthenticatedRequest extends Request {
  user?: JwtUserPayload;
}

export interface DbResult {
  lastID: number;
  changes: number;
}

