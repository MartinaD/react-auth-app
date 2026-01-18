import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AuthenticatedRequest, JwtUserPayload } from '../types/index.js';

export const authenticateToken = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    res.status(401).json({ error: 'Access token required' });
    return;
  }

  jwt.verify(
    token,
    process.env.JWT_SECRET || 'your-secret-key-change-in-production',
    (err, user) => {
      if (err) {
        res.status(403).json({ error: 'Invalid or expired token' });
        return;
      }
      req.user = user as JwtUserPayload;
      next();
    }
  );
};

