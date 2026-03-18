import { NextFunction, Request, Response } from 'express';
import { RoleType } from '../types/auth';
import { writeDeniedAuditLog } from '../lib/auditDenied';

export function authorizeRoles(...allowedRoles: RoleType[]) {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      await writeDeniedAuditLog({
        userId: req.user.userId,
        action: 'role_access_denied',
        resourceType: 'Route',
        resourceId: null,
        ipAddress: req.ip,
        reason: `Role ${req.user.role} not allowed; attempted access to ${req.originalUrl}`,
      });

      return res.status(403).json({ error: 'Role not allowed' });
    }

    next();
  };
}
