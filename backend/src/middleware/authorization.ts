import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from './authentication';
import { getLogger } from '../config/logger';

const logger = getLogger('authorization');

export type RoleType = 'admin' | 'doctor' | 'pharmacy' | 'patient';

export function authorize(...allowedRoles: RoleType[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!allowedRoles.includes(req.user.role as RoleType)) {
      logger.warn(`Unauthorized access attempt by ${req.user.email} (${req.user.role}) to ${req.path}`);
      return res.status(403).json({
        error: 'Forbidden: insufficient permissions',
        requiredRoles: allowedRoles,
      });
    }

    next();
  };
}

export function checkPermission(permission: string) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!req.user.permissions.includes(permission)) {
      logger.warn(`Permission denied for ${req.user.email}: ${permission}`);
      return res.status(403).json({
        error: 'Forbidden: missing required permission',
        required: permission,
      });
    }

    next();
  };
}
