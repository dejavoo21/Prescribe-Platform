import { Request, Response, NextFunction } from 'express';
import { getLogger } from '../config/logger';
import { AuthRequest } from './authentication';

const logger = getLogger('audit-log');

export function auditLog(req: AuthRequest, res: Response, next: NextFunction) {
  // Only log mutations (not GET requests)
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
    const originalSend = res.send;

    res.send = function (data: any) {
      logger.info({
        action: `${req.method} ${req.path}`,
        userId: req.user?.id,
        email: req.user?.email,
        statusCode: res.statusCode,
        path: req.path,
        method: req.method,
        timestamp: new Date().toISOString(),
      });

      return originalSend.call(this, data);
    };
  }

  next();
}
