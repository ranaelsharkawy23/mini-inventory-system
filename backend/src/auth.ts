import { NextFunction, Request, Response } from "express";
import { verifyToken } from "./services/authService";

export interface AuthenticatedRequest extends Request {
    userId?: number;
}

export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    const header = req.header("authorization");
    const token = header?.startsWith("Bearer ") ? header.slice(7) : null;

    if (!token) {
        return res.status(401).json({ error: "Missing authentication token" });
    }

    try {
        const payload = verifyToken(token);
        req.userId = payload.userId;
        next();
    } catch {
        return res.status(401).json({ error: "Invalid or expired token" });
    }
}