import { NextFunction, Request, Response } from 'express';

type ValidationResult = {
  valid: boolean;
  errors: string[];
};

type Validator = (req: Request) => ValidationResult;

export function validateRequest(validator: Validator) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = validator(req);

    if (!result.valid) {
      return res.status(400).json({
        error: 'Validation failed',
        details: result.errors,
      });
    }

    return next();
  };
}
