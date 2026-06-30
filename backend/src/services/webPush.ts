import webpush from 'web-push';
import Settings from '../models/Settings';
import logger from '../utils/logger';

let isConfigured = false;

export const initWebPush = async () => {
  try {
    let publicKey = process.env.VAPID_PUBLIC_KEY;
    let privateKey = process.env.VAPID_PRIVATE_KEY;

    if (!publicKey || !privateKey) {
      const settings = await Settings.findOne({ key: 'vapid_keys' });
      if (settings && settings.value.publicKey && settings.value.privateKey) {
        publicKey = settings.value.publicKey;
        privateKey = settings.value.privateKey;
      } else {
        const keys = webpush.generateVAPIDKeys();
        publicKey = keys.publicKey;
        privateKey = keys.privateKey;
        
        await Settings.findOneAndUpdate(
          { key: 'vapid_keys' },
          { value: { publicKey, privateKey } },
          { upsert: true, new: true }
        );
        logger.info('Generated new VAPID keys and stored in settings database.');
      }
    }

    webpush.setVapidDetails(
      'mailto:admin@example.com',
      publicKey as string,
      privateKey as string
    );
    isConfigured = true;
    logger.info('Web Push service configured successfully.');
  } catch (error) {
    logger.error('Failed to configure Web Push service:', error);
  }
};

export const getVapidPublicKey = async (): Promise<string | null> => {
  if (process.env.VAPID_PUBLIC_KEY) return process.env.VAPID_PUBLIC_KEY;
  const settings = await Settings.findOne({ key: 'vapid_keys' });
  return settings?.value?.publicKey || null;
};

export const sendPushNotification = async (subscription: any, payload: any) => {
  if (!isConfigured) {
    logger.warn('Web Push not configured, skipping notification send');
    return;
  }
  try {
    await webpush.sendNotification(subscription, JSON.stringify(payload));
  } catch (error: any) {
    if (error.statusCode === 410 || error.statusCode === 404) {
      logger.info('Subscription has expired or is invalid. Rejecting.');
      throw new Error('SUB_EXPIRED');
    }
    logger.error('Error sending push notification: %o', error);
  }
};
export default { initWebPush, getVapidPublicKey, sendPushNotification };
