import { Request, Response, NextFunction } from 'express';
import { getLogger } from '../config/logger';
import { AppError } from '../lib/errors';

const logger = getLogger('error-handler');

export class ApiError extends Error {
  constructor(public statusCode: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

export function errorHandler(err: Error | ApiError | AppError, req: Request, res: Response, _next: NextFunction) {
  logger.error('Error:', err);

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      error: err.message,
      statusCode: err.statusCode,
    });
  }

  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      error: err.message,
      statusCode: err.statusCode,
    });
  }

  // Default error response
  res.status(500).json({
    error: 'Internal server error',
    statusCode: 500,
    ...(process.env.NODE_ENV === 'development' && { details: err.message }),
  });
}
