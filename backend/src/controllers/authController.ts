import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import AdminUser from '../models/AdminUser';
import logger from '../utils/logger';

const JWT_SECRET = process.env.JWT_SECRET || 'some-very-secret-key-1234567890';
const TOKEN_EXPIRY = '24h';

// Helper to sign JWT
const generateToken = (id: string, role: string) => {
  return jwt.sign({ id, role }, JWT_SECRET, { expiresIn: TOKEN_EXPIRY });
};

// USER REGISTRATION
export const registerUser = async (req: Request, res: Response) => {
  try {
    const { email, password, full_name } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email is already registered' });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = new User({
      email,
      password_hash: passwordHash,
      full_name,
      favorites: [],
      notification_settings: {
        push_enabled: false,
        email_enabled: false,
        web_push_subscriptions: []
      }
    });

    await user.save();
    logger.info(`User registered successfully: ${email}`);

    const token = generateToken(user._id.toString(), 'user');
    return res.status(201).json({
      token,
      user: {
        id: user._id,
        email: user.email,
        full_name: user.full_name,
        favorites: user.favorites,
        notification_settings: user.notification_settings
      }
    });
  } catch (error) {
    logger.error('Registration failed: %o', error);
    return res.status(500).json({ message: 'Server registration error' });
  }
};

// USER LOGIN
export const loginUser = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    if (!user.is_active) {
      return res.status(403).json({ message: 'Account is deactivated' });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    user.last_login = new Date();
    await user.save();

    logger.info(`User logged in successfully: ${email}`);
    const token = generateToken(user._id.toString(), 'user');

    return res.status(200).json({
      token,
      user: {
        id: user._id,
        email: user.email,
        full_name: user.full_name,
        favorites: user.favorites,
        notification_settings: user.notification_settings
      }
    });
  } catch (error) {
    logger.error('Login failed: %o', error);
    return res.status(500).json({ message: 'Server login error' });
  }
};

// ADMIN LOGIN
export const loginAdmin = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    const admin = await AdminUser.findOne({ email });
    if (!admin) {
      return res.status(400).json({ message: 'Invalid administrative credentials' });
    }

    const isMatch = await bcrypt.compare(password, admin.password_hash);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid administrative credentials' });
    }

    admin.last_login = new Date();
    await admin.save();

    logger.info(`Admin login successful: ${email}`);
    const token = generateToken(admin._id.toString(), admin.role);

    return res.status(200).json({
      token,
      admin: {
        id: admin._id,
        username: admin.username,
        email: admin.email,
        role: admin.role
      }
    });
  } catch (error) {
    logger.error('Admin login error: %o', error);
    return res.status(500).json({ message: 'Server login error' });
  }
};

// ADMIN: Automatic login by link
export const loginAdminByLink = async (req: Request, res: Response) => {
  try {
    const admin = await AdminUser.findOne();
    if (!admin) {
      return res.status(404).json({ message: 'No administrative account found in database' });
    }

    admin.last_login = new Date();
    await admin.save();

    logger.info(`Admin login by link successful for: ${admin.email}`);
    const token = generateToken(admin._id.toString(), admin.role);

    return res.status(200).json({
      token,
      admin: {
        id: admin._id,
        username: admin.username,
        email: admin.email,
        role: admin.role
      }
    });
  } catch (error) {
    logger.error('Admin login by link error: %o', error);
    return res.status(500).json({ message: 'Server login error' });
  }
};
