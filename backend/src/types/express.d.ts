import { AuthUserContext } from './auth';

declare global {
  namespace Express {
    interface Request {
      user?: AuthUserContext;
    }
  }
}

export {};
