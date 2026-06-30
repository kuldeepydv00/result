import { Response } from 'express';
import bcrypt from 'bcryptjs';
import { AuthenticatedUserRequest, AuthenticatedAdminRequest } from '../middlewares/authMiddleware';
import User from '../models/User';
import logger from '../utils/logger';

// USER: Get profile
export const getUserProfile = async (req: AuthenticatedUserRequest, res: Response) => {
  try {
    const user = req.user;
    if (!user) return res.status(401).json({ message: 'Unauthorized' });

    return res.status(200).json({
      id: user._id,
      email: user.email,
      full_name: user.full_name,
      favorites: user.favorites,
      notification_settings: user.notification_settings
    });
  } catch (error) {
    logger.error('Error fetching user profile: %o', error);
    return res.status(500).json({ message: 'Error retrieving profile' });
  }
};

// USER: Update profile
export const updateUserProfile = async (req: AuthenticatedUserRequest, res: Response) => {
  try {
    const user = req.user;
    if (!user) return res.status(401).json({ message: 'Unauthorized' });

    const { full_name, password } = req.body;

    if (full_name !== undefined) {
      user.full_name = full_name;
    }

    if (password) {
      user.password_hash = await bcrypt.hash(password, 12);
    }

    await user.save();
    logger.info(`Profile updated for user: ${user.email}`);

    return res.status(200).json({
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        email: user.email,
        full_name: user.full_name,
        favorites: user.favorites,
        notification_settings: user.notification_settings
      }
    });
  } catch (error) {
    logger.error('Error updating user profile: %o', error);
    return res.status(500).json({ message: 'Failed to update profile' });
  }
};

// USER: Toggle favorite game
export const toggleFavoriteGame = async (req: AuthenticatedUserRequest, res: Response) => {
  try {
    const user = req.user;
    if (!user) return res.status(401).json({ message: 'Unauthorized' });

    const { gameId } = req.body;
    if (!gameId) {
      return res.status(400).json({ message: 'Game ID is required' });
    }

    const idx = user.favorites.indexOf(gameId);
    if (idx > -1) {
      // Remove
      user.favorites.splice(idx, 1);
    } else {
      // Add
      user.favorites.push(gameId);
    }

    await user.save();
    return res.status(200).json({
      message: 'Favorites updated successfully',
      favorites: user.favorites
    });
  } catch (error) {
    logger.error('Failed to toggle favorite: %o', error);
    return res.status(500).json({ message: 'Failed to update favorites' });
  }
};

// USER: Update notification settings
export const updateNotificationSettings = async (req: AuthenticatedUserRequest, res: Response) => {
  try {
    const user = req.user;
    if (!user) return res.status(401).json({ message: 'Unauthorized' });

    const { push_enabled, email_enabled } = req.body;

    if (push_enabled !== undefined) {
      user.notification_settings.push_enabled = push_enabled;
    }
    if (email_enabled !== undefined) {
      user.notification_settings.email_enabled = email_enabled;
    }

    await user.save();
    return res.status(200).json({
      message: 'Notification settings updated',
      settings: user.notification_settings
    });
  } catch (error) {
    logger.error('Failed to update notification settings: %o', error);
    return res.status(500).json({ message: 'Failed to update settings' });
  }
};

// ADMIN: Get all users
export const adminGetUsers = async (req: AuthenticatedAdminRequest, res: Response) => {
  try {
    const users = await User.find({}, '-password_hash').sort({ created_at: -1 });
    return res.status(200).json(users);
  } catch (error) {
    logger.error('Failed to fetch users list: %o', error);
    return res.status(500).json({ message: 'Error retrieving users list' });
  }
};

// ADMIN: Disable/Enable user
export const adminToggleUserStatus = async (req: AuthenticatedAdminRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { is_active } = req.body;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.is_active = is_active;
    await user.save();

    logger.info(`Admin set user status (${user.email}) is_active to ${is_active}`);
    return res.status(200).json({ message: `User account is ${is_active ? 'enabled' : 'disabled'}` });
  } catch (error) {
    logger.error('Failed to toggle user status: %o', error);
    return res.status(500).json({ message: 'Error updating user status' });
  }
};

// ADMIN: Update user role
export const adminUpdateUserRole = async (req: AuthenticatedAdminRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { role } = req.body; // 'user', 'admin' etc.

    if (role !== 'user' && role !== 'admin') {
      return res.status(400).json({ message: 'Invalid role value' });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.role = role;
    await user.save();

    logger.info(`Admin changed user ${user.email} role to ${role}`);
    return res.status(200).json({ message: `User role updated to ${role}` });
  } catch (error) {
    logger.error('Failed to change user role: %o', error);
    return res.status(500).json({ message: 'Error updating user role' });
  }
};
