import { NextFunction, Request, Response } from 'express';

// req.secure is reliable here because `trust proxy` is set in main.ts, so
// Express derives it from X-Forwarded-Proto set by Render/Railway's TLS
// termination. Only applied in production — local dev talks plain HTTP.
export function enforceHttps(req: Request, res: Response, next: NextFunction): void {
  if (req.secure) {
    next();
    return;
  }

  res.redirect(301, `https://${req.headers.host}${req.originalUrl}`);
}
