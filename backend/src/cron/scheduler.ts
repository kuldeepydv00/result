import cron from 'node-cron';
import Settings from '../models/Settings';
import { fetchResultsFromApi } from '../services/apiFetcher';
import logger from '../utils/logger';

let lastFetchTime = 0;

export const startCronScheduler = () => {
  // Run check every minute
  cron.schedule('* * * * *', async () => {
    try {
      const systemSettings = await Settings.findOne({ key: 'system_settings' });
      const intervalMinutes = systemSettings?.value?.fetch_interval_minutes || 5;

      const now = Date.now();
      const elapsedMs = now - lastFetchTime;
      const intervalMs = intervalMinutes * 60 * 1000;

      if (elapsedMs >= intervalMs) {
        lastFetchTime = now;
        logger.info('Running cron API result fetcher...');
        // We fetch for today's local date (which is usually the server local time)
        const result = await fetchResultsFromApi(new Date());
        logger.info(`Cron execution complete. Status: ${result.success ? 'Success' : 'Failure'}. Count: ${result.count}`);
      }
    } catch (error) {
      logger.error('Cron scheduler task failed: %o', error);
    }
  });
  logger.info('Background scheduler started successfully.');
};
export default { startCronScheduler };
