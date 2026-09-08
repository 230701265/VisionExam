import type { NextFunction, Request, Response } from "express";
import session from "express-session";
import createMemoryStore from "memorystore";
import { storage } from "./storage";

export type UserRole = "student" | "instructor" | "admin";

declare module "express-session" {
  interface SessionData {
    user: {
      id: string;
      username: string;
      role: UserRole;
    };
  }
}

declare global {
  namespace Express {
    interface Request {
      authUser?: {
        id: string;
        username: string;
        role: UserRole;
      };
    }
  }
}

const MemoryStore = createMemoryStore(session);

export function createSessionMiddleware() {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error("SESSION_SECRET is required");
  }

  return session({
    name: "opsis.sid",
    secret,
    resave: false,
    saveUninitialized: false,
    rolling: true,
    store: new MemoryStore({ checkPeriod: 24 * 60 * 60 * 1000 }),
    cookie: {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 8 * 60 * 60 * 1000,
    },
  });
}

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.session.user) {
    return res.status(401).json({ message: "Authentication required" });
  }
  try {
    const currentUser = await storage.getUser(req.session.user.id);
    if (!currentUser) {
      req.session.destroy(() => undefined);
      return res.status(401).json({ message: "Authentication required" });
    }
    req.session.user = {
      id: currentUser.id,
      username: currentUser.username,
      role: currentUser.role as UserRole,
    };
    req.authUser = req.session.user;
    next();
  } catch (error) {
    next(error);
  }
}

export function requireRole(...roles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.authUser) {
      return res.status(401).json({ message: "Authentication required" });
    }
    if (!roles.includes(req.authUser.role)) {
      return res.status(403).json({ message: "You do not have permission to perform this action" });
    }
    next();
  };
}

export function isElevated(req: Request) {
  return req.authUser?.role === "instructor" || req.authUser?.role === "admin";
}