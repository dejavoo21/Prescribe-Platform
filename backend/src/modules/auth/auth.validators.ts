import { Request } from 'express';
import { isNonEmptyString } from '../../lib/validators';

export function validateLogin(req: Request) {
  const errors: string[] = [];
  const body = req.body ?? {};

  if (!isNonEmptyString(body.email)) errors.push('email is required');
  if (!isNonEmptyString(body.password)) errors.push('password is required');

  return {
    valid: errors.length === 0,
    errors,
  };
}
