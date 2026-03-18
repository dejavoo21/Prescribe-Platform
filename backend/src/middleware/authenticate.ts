import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { JwtPayload } from '../types/auth';
import { AuthService } from '../modules/auth/auth.service';

const COOKIE_NAME = 'prescribe_token';

export async function authenticate(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const token = req.cookies?.[COOKIE_NAME];

    if (!token) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const decoded = jwt.verify(token, env.jwtSecret) as JwtPayload;

    const authContext = await AuthService.getAuthContextFromUserId(decoded.sub);
    if (!authContext) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    req.user = authContext;
    return next();
  } catch {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
}
