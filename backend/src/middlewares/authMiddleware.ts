import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User, { IUser } from '../models/User';
import AdminUser, { IAdminUser } from '../models/AdminUser';
import logger from '../utils/logger';

const JWT_SECRET = process.env.JWT_SECRET || 'some-very-secret-key-1234567890';

export interface AuthenticatedUserRequest extends Request {
  user?: IUser;
}

export interface AuthenticatedAdminRequest extends Request {
  admin?: IAdminUser;
}

// User Authenticator Middleware
export const authenticateUser = async (
  req: AuthenticatedUserRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Authorization token required' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string; role: string };

    if (decoded.role !== 'user') {
      return res.status(403).json({ message: 'Invalid token role context' });
    }

    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({ message: 'User not found or disabled' });
    }

    if (!user.is_active) {
      return res.status(403).json({ message: 'User account is deactivated' });
    }

    req.user = user;
    next();
  } catch (error) {
    logger.warn('User JWT authentication failed: %o', error);
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};

// Admin Authenticator Middleware
export const authenticateAdmin = async (
  req: AuthenticatedAdminRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Authorization token required' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string; role: string };

    if (decoded.role !== 'admin' && decoded.role !== 'super_admin') {
      return res.status(403).json({ message: 'Insufficient privileges' });
    }

    const admin = await AdminUser.findById(decoded.id);
    if (!admin) {
      return res.status(401).json({ message: 'Admin account not found' });
    }

    req.admin = admin;
    next();
  } catch (error) {
    logger.warn('Admin JWT authentication failed: %o', error);
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};

// Admin Role Guard Middleware
export const requireSuperAdmin = (
  req: AuthenticatedAdminRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.admin || req.admin.role !== 'super_admin') {
    return res.status(403).json({ message: 'Requires Super Admin permission' });
  }
  next();
};
