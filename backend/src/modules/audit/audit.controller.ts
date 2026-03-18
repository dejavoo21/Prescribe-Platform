import { Request, Response } from 'express';
import { AuditService } from './audit.service';
import { AuthUserContext } from '../../types/auth';

export class AuditController {
  static async list(req: Request, res: Response) {
    const data = await AuditService.listAuditLogs(req.user as AuthUserContext, {
      from: typeof req.query.from === 'string' ? req.query.from : undefined,
      to: typeof req.query.to === 'string' ? req.query.to : undefined,
      action: typeof req.query.action === 'string' ? req.query.action : undefined,
      userId: typeof req.query.userId === 'string' ? req.query.userId : undefined,
      limit: typeof req.query.limit === 'string' ? Number(req.query.limit) : undefined,
    });

    return res.status(200).json({ data });
  }
}
