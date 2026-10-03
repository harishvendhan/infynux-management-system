import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/env';

export interface AuthUser {
  id: string;
  email?: string;
  role: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  try {
    let token = req.cookies?.token;

    // Fallback to Bearer authorization header if present
    if (!token && req.headers.authorization?.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      res.status(401).json({ error: { message: 'Authentication required. No session found.', code: 'UNAUTHORIZED' } });
      return;
    }

    const decoded = jwt.verify(token, config.jwtSecret) as { sub: string; email?: string; role: string };
    req.user = {
      id: decoded.sub,
      email: decoded.email,
      role: decoded.role,
    };

    next();
  } catch (error) {
    res.status(401).json({ error: { message: 'Invalid or expired session. Please log in again.', code: 'INVALID_TOKEN' } });
  }
}

export function requireRole(allowedRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      res.status(403).json({ error: { message: 'Forbidden. Insufficient permissions.', code: 'FORBIDDEN' } });
      return;
    }
    next();
  };
}
