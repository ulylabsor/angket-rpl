import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export type AuthedRequest = Request & { user?: { id: string; email: string; role: string } };

export function auth(requiredRoles?: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const token = (req as any).cookies?.token || (req.headers.authorization?.startsWith("Bearer ") ? req.headers.authorization.slice(7) : null);
    if (!token) return res.status(401).json({ error: "Unauthorized" });
    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET!) as any;
      (req as AuthedRequest).user = { id: payload.sub, email: payload.email, role: payload.role };
      if (requiredRoles && !requiredRoles.includes(payload.role)) return res.status(403).json({ error: "Forbidden" });
      next();
    } catch {
      return res.status(401).json({ error: "Token tidak valid" });
    }
  };
}
