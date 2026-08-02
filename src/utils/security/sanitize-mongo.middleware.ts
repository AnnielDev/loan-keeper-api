import { NextFunction, Request, Response } from 'express';

function sanitizeInPlace(value: unknown): void {
  if (Array.isArray(value)) {
    value.forEach(sanitizeInPlace);
    return;
  }

  if (value === null || typeof value !== 'object') {
    return;
  }

  const record = value as Record<string, unknown>;
  for (const key of Object.keys(record)) {
    if (key.startsWith('$') || key.includes('.')) {
      delete record[key];
      continue;
    }
    sanitizeInPlace(record[key]);
  }
}

export function sanitizeMongoOperators(
  req: Request,
  _res: Response,
  next: NextFunction,
): void {
  sanitizeInPlace(req.body);
  sanitizeInPlace(req.params);
  sanitizeInPlace(req.query);
  next();
}
