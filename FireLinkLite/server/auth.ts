import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { type Request, type Response, type NextFunction } from "express";
import { storage } from "./storage";

const JWT_SECRET = process.env.JWT_SECRET || "firelink-dev-secret-change-in-production";

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    username: string;
    role: string;
  };
}

// Hash password utility
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

// Verify password utility
export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

// Generate JWT token
export function generateToken(userId: string, username: string, role: string): string {
  return jwt.sign({ userId, username, role }, JWT_SECRET, { expiresIn: "24h" });
}

// Verify JWT token
export function verifyToken(token: string): { userId: string; username: string; role: string } | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    return {
      userId: decoded.userId,
      username: decoded.username,
      role: decoded.role,
    };
  } catch (error) {
    return null;
  }
}

// Authentication middleware
export function authenticateToken(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ message: "Access token required" });
  }

  const user = verifyToken(token);
  if (!user) {
    return res.status(403).json({ message: "Invalid or expired token" });
  }

  req.user = { ...user, id: user.userId };
  next();
}

// Role-based access control
export function requireRole(role: string) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: "Authentication required" });
    }

    if (req.user.role !== role) {
      return res.status(403).json({ message: `Access denied. ${role} role required.` });
    }

    next();
  };
}

// Login handler
export async function loginHandler(req: Request, res: Response) {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: "Username and password required" });
    }

    // Find user by username
    const user = await storage.getUserByUsername(username);
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Verify password
    const isValidPassword = await verifyPassword(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({ message: "Account is disabled" });
    }

    // Generate token
    const token = generateToken(user.id, user.username, user.role);

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        name: user.name,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

// Register handler (for community members)
export async function registerHandler(req: Request, res: Response) {
  try {
    const { username, password, name, phone } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: "Username and password required" });
    }

    // Check if user already exists
    const existingUser = await storage.getUserByUsername(username);
    if (existingUser) {
      return res.status(409).json({ message: "Username already exists" });
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user
    const user = await storage.createUser({
      username,
      password: hashedPassword,
      role: "community",
      name,
      phone,
      isActive: true,
    });

    // Generate token
    const token = generateToken(user.id, user.username, user.role);

    res.status(201).json({
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        name: user.name,
      },
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}
