import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/environment';
import { getLogger } from '../config/logger';

const logger = getLogger('auth-middleware');

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
    permissions: string[];
  };
  token: string;
}

export function authenticateToken(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: 'Authorization token required' });
  }

  try {
    const decoded = jwt.verify(token, config.jwt.secret) as any;
    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
      permissions: decoded.permissions || [],
    };
    req.token = token;
    next();
  } catch (error) {
    logger.error('Token verification failed', error);
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
}

export function optionalAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (token) {
    try {
      const decoded = jwt.verify(token, config.jwt.secret) as any;
      req.user = {
        id: decoded.id,
        email: decoded.email,
        role: decoded.role,
        permissions: decoded.permissions || [],
      };
      req.token = token;
    } catch (error) {
      logger.debug('Optional auth token invalid, continuing without user', error);
    }
  }

  next();
}
