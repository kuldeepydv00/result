import { Request, Response } from 'express';
import { getVapidPublicKey } from '../services/webPush';
import PushSubscription from '../models/PushSubscription';
import logger from '../utils/logger';

// PUBLIC: Get VAPID public key
export const getVapidKey = async (req: Request, res: Response) => {
  try {
    const publicKey = await getVapidPublicKey();
    if (!publicKey) {
      return res.status(404).json({ message: 'VAPID keys not generated yet' });
    }
    return res.status(200).json({ publicKey });
  } catch (error) {
    logger.error('Error fetching VAPID key: %o', error);
    return res.status(500).json({ message: 'Error retrieving VAPID configuration' });
  }
};

// PUBLIC: Save push subscription anonymously
export const saveSubscription = async (req: Request, res: Response) => {
  try {
    const { subscription, favorites } = req.body;

    if (!subscription || !subscription.endpoint) {
      return res.status(400).json({ message: 'Valid subscription payload required' });
    }

    // Upsert subscription anonymously
    const existing = await PushSubscription.findOneAndUpdate(
      { 'subscription.endpoint': subscription.endpoint },
      {
        subscription,
        favorites: favorites || []
      },
      { upsert: true, new: true }
    );

    logger.info(`Anonymous Web Push subscription registered: ${subscription.endpoint}`);

    return res.status(200).json({
      message: 'Subscription registered successfully',
      subscription: existing
    });
  } catch (error) {
    logger.error('Failed to save push subscription: %o', error);
    return res.status(500).json({ message: 'Failed to register subscription' });
  }
};
