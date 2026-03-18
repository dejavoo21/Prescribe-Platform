/// <reference path="../../types/express.d.ts" />
import { Response, Request } from 'express';
import { env } from '../../config/env';
import { AuthService } from './auth.service';

const COOKIE_NAME = 'prescribe_token';

export class AuthController {
  static async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body as {
        email?: string;
        password?: string;
      };

      if (!email || !password) {
        return res.status(400).json({
          error: 'Email and password are required',
        });
      }

      const result = await AuthService.login(email, password);

      res.cookie(COOKIE_NAME, result.token, {
        httpOnly: true,
        secure: env.cookieSecure,
        sameSite: 'lax',
        path: '/',
        maxAge: 24 * 60 * 60 * 1000,
      });

      return res.status(200).json({
        message: 'Login successful',
        user: result.user,
      });
    } catch (error) {
      return res.status(401).json({
        error: error instanceof Error ? error.message : 'Login failed',
      });
    }
  }

  static async me(req: Request, res: Response) {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    return res.status(200).json({
      user: req.user,
    });
  }

  static async logout(_req: Request, res: Response) {
    res.clearCookie(COOKIE_NAME, {
      httpOnly: true,
      secure: env.cookieSecure,
      sameSite: 'lax',
      path: '/',
    });

    return res.status(200).json({
      message: 'Logout successful',
    });
  }
}
