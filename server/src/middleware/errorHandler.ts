import { Request, Response, NextFunction } from 'express';

export function errorHandler(err: any, req: Request, res: Response, next: NextFunction): void {
  console.error('Unhandled Server Error:', err);

  const status = err.statusCode || err.status || 500;
  const message = err.message || 'Internal server error occurred.';

  res.status(status).json({
    data: null,
    error: {
      message,
      code: err.code || 'INTERNAL_ERROR',
      details: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    },
  });
}
