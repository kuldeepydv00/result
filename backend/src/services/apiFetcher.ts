import axios from 'axios';
import Settings from '../models/Settings';
import FetchLog from '../models/FetchLog';
import Game from '../models/Game';
import Result from '../models/Result';
import { sendPushNotification } from './webPush';
import User from '../models/User';
import logger from '../utils/logger';

// Helper to resolve nested keys like "results.gali" or "data.0.number"
export const getValueByJsonPath = (obj: any, path: string): any => {
  if (!path) return undefined;
  const cleanPath = path.replace(/\[(\w+)\]/g, '.$1').replace(/^\./, '');
  const keys = cleanPath.split('.');
  let current = obj;
  for (const key of keys) {
    if (current === null || current === undefined) return undefined;
    current = current[key];
  }
  return current;
};

// Replace placeholders recursively
const replacePlaceholders = (val: any, gameCode: string, dateStr: string): any => {
  if (typeof val === 'string') {
    return val
      .replace(/{game_code}/g, gameCode)
      .replace(/{date}/g, dateStr);
  }
  if (typeof val === 'object' && val !== null) {
    const res: any = Array.isArray(val) ? [] : {};
    for (const k in val) {
      res[k] = replacePlaceholders(val[k], gameCode, dateStr);
    }
    return res;
  }
  return val;
};

// Send Push Notifications anonymously to subscriptions
export const notifyUsersForResult = async (gameId: any, gameName: string, resultNumber: string) => {
  try {
    const PushSubscription = require('../models/PushSubscription').default;
    const subscriptions = await PushSubscription.find({
      $or: [
        { favorites: gameId },
        { favorites: { $size: 0 } }
      ]
    });

    if (subscriptions.length === 0) return;

    logger.info(`Sending push notifications to ${subscriptions.length} anonymous subscriptions for game ${gameName}`);

    const payload = {
      title: `${gameName} Result Announced!`,
      body: `Today's result for ${gameName} is ${resultNumber}.`,
      data: {
        url: '/'
      }
    };

    for (const subDoc of subscriptions) {
      try {
        await sendPushNotification(subDoc.subscription, payload);
      } catch (err: any) {
        if (err.message === 'SUB_EXPIRED') {
          logger.info(`Cleaning up expired subscription: ${subDoc._id}`);
          await subDoc.deleteOne();
        }
      }
    }
  } catch (error) {
    logger.error('Error in notifyUsersForResult: %o', error);
  }
};

interface ApiConfig {
  url: string;
  method: string;
  auth_type: string;
  auth_header_key?: string;
  auth_header_value?: string;
  headers?: Record<string, string>;
  body_template?: any;
  query_params?: Record<string, string>;
  response_mapping: {
    game_code_field: string;
    result_field: string;
    date_field: string;
    status_field?: string;
  };
}

export const fetchResultsFromApi = async (targetDate: Date): Promise<{ success: boolean; count: number; error?: string }> => {
  const startedAt = new Date();
  
  // Format targetDate as YYYY-MM-DD
  const dateStr = targetDate.toISOString().split('T')[0];

  try {
    const apiSettings = await Settings.findOne({ key: 'external_api_config' });
    if (!apiSettings || !apiSettings.value?.url) {
      return { success: false, count: 0, error: 'API not configured' };
    }

    const config: ApiConfig = apiSettings.value;
    const isSingleGameEndpoint = 
      config.url.includes('{game_code}') || 
      JSON.stringify(config.query_params || {}).includes('{game_code}') ||
      JSON.stringify(config.body_template || {}).includes('{game_code}');

    const activeGames = await Game.find({ is_active: true });
    if (activeGames.length === 0) {
      return { success: true, count: 0 };
    }

    let processedCount = 0;

    if (isSingleGameEndpoint) {
      // Loop through all active games
      for (const game of activeGames) {
        const gameStart = new Date();
        try {
          const gameUrl = replacePlaceholders(config.url, game.code, dateStr);
          const reqHeaders = { ...replacePlaceholders(config.headers || {}, game.code, dateStr) };
          const reqQueryParams = { ...replacePlaceholders(config.query_params || {}, game.code, dateStr) };
          const reqBody = config.body_template ? replacePlaceholders(config.body_template, game.code, dateStr) : undefined;

          // Inject authorization if any
          if (config.auth_type === 'bearer' && config.auth_header_value) {
            reqHeaders['Authorization'] = `Bearer ${config.auth_header_value}`;
          } else if (config.auth_type === 'api_key' && config.auth_header_key && config.auth_header_value) {
            reqHeaders[config.auth_header_key] = config.auth_header_value;
          }

          const response = await axios({
            url: gameUrl,
            method: config.method as any,
            headers: reqHeaders,
            params: reqQueryParams,
            data: reqBody,
            timeout: 10000 // 10s timeout
          });

          // Process the response mapped values
          const responseData = response.data;
          const resultNum = getValueByJsonPath(responseData, config.response_mapping.result_field);
          const responseStatus = config.response_mapping.status_field 
            ? getValueByJsonPath(responseData, config.response_mapping.status_field) 
            : 'announced';

          await logFetch(gameStart, new Date(), game.code, true, undefined, responseData);

          if (resultNum !== undefined && resultNum !== null && String(resultNum).trim() !== '') {
            const updated = await updateResult(game._id, targetDate, String(resultNum).trim(), responseStatus);
            if (updated) processedCount++;
          }
        } catch (err: any) {
          logger.error(`Error fetching api results for ${game.name}: ${err.message}`);
          await logFetch(gameStart, new Date(), game.code, false, err.message, err.response?.data);
        }
      }
    } else {
      // Global multi-game endpoint (Fetch once)
      const fetchStart = new Date();
      try {
        const url = replacePlaceholders(config.url, '', dateStr);
        const reqHeaders = { ...replacePlaceholders(config.headers || {}, '', dateStr) };
        const reqQueryParams = { ...replacePlaceholders(config.query_params || {}, '', dateStr) };
        const reqBody = config.body_template ? replacePlaceholders(config.body_template, '', dateStr) : undefined;

        if (config.auth_type === 'bearer' && config.auth_header_value) {
          reqHeaders['Authorization'] = `Bearer ${config.auth_header_value}`;
        } else if (config.auth_type === 'api_key' && config.auth_header_key && config.auth_header_value) {
          reqHeaders[config.auth_header_key] = config.auth_header_value;
        }

        const response = await axios({
          url,
          method: config.method as any,
          headers: reqHeaders,
          params: reqQueryParams,
          data: reqBody,
          timeout: 10000
        });

        const responseData = response.data;
        await logFetch(fetchStart, new Date(), undefined, true, undefined, responseData);

        // Check if there is an array path configured, e.g. "results.data"
        let dataItems = responseData;
        const arrayPath = (config.response_mapping as any).array_path;
        if (arrayPath) {
          dataItems = getValueByJsonPath(responseData, arrayPath) || responseData;
        }

        // We will loop through our active games and look for matches in the response payload.
        for (const game of activeGames) {
          let resultNum: any = undefined;
          let responseStatus = 'announced';

          if (Array.isArray(dataItems)) {
            // Find in array matching either game.code or game.name
            const record = dataItems.find((item: any) => {
              const codeVal = getValueByJsonPath(item, config.response_mapping.game_code_field);
              if (codeVal === undefined || codeVal === null) return false;
              return String(codeVal).toLowerCase() === game.code.toLowerCase() || 
                     String(codeVal).toLowerCase() === game.name.toLowerCase();
            });
            if (record) {
              resultNum = getValueByJsonPath(record, config.response_mapping.result_field);
              if (config.response_mapping.status_field) {
                responseStatus = getValueByJsonPath(record, config.response_mapping.status_field);
              }
            }
          } else if (typeof dataItems === 'object' && dataItems !== null) {
            // Try resolving using {game_code} replacement in response path or search object keys
            const customPath = config.response_mapping.result_field.replace(/{game_code}/g, game.code);
            resultNum = getValueByJsonPath(dataItems, customPath);
            
            if (resultNum === undefined) {
              const resultsObj = getValueByJsonPath(dataItems, 'results') || dataItems;
              if (resultsObj && resultsObj[game.code] !== undefined) {
                resultNum = resultsObj[game.code];
              }
            }

            if (config.response_mapping.status_field) {
              const statusPath = config.response_mapping.status_field.replace(/{game_code}/g, game.code);
              responseStatus = getValueByJsonPath(dataItems, statusPath) || 'announced';
            }
          }

          if (resultNum !== undefined && resultNum !== null && String(resultNum).trim() !== '') {
            const updated = await updateResult(game._id, targetDate, String(resultNum).trim(), responseStatus);
            if (updated) processedCount++;
          }
        }
      } catch (err: any) {
        logger.error(`Error fetching global API results: ${err.message}`);
        await logFetch(fetchStart, new Date(), undefined, false, err.message, err.response?.data);
        return { success: false, count: 0, error: err.message };
      }
    }

    return { success: true, count: processedCount };
  } catch (error: any) {
    logger.error('API Fetcher service encountered error: %o', error);
    return { success: false, count: 0, error: error.message };
  }
};

const updateResult = async (gameId: any, date: Date, resultNumber: string, apiStatus: string): Promise<boolean> => {
  // Normalize date to UTC Midnight (YYYY-MM-DDT00:00:00.000Z)
  const normalizedDate = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));

  const existingResult = await Result.findOne({ game_id: gameId, date: normalizedDate });
  
  if (existingResult && existingResult.source === 'manual') {
    // Keep manually entered admin value
    logger.info(`Skipped overwriting manual result for gameId: ${gameId} on ${normalizedDate.toISOString()}`);
    return false;
  }

  const isPendingVal = apiStatus === 'pending' || apiStatus === 'pending_announcement' || resultNumber === 'XX';
  const newStatus = isPendingVal ? 'pending' : 'announced';
  const resultNum = newStatus === 'pending' ? null : resultNumber;

  if (existingResult) {
    // If the value hasn't changed, do nothing
    if (existingResult.result_number === resultNum && existingResult.status === newStatus) {
      return false;
    }

    const oldStatus = existingResult.status;
    existingResult.result_number = resultNum;
    existingResult.status = newStatus;
    existingResult.source = 'api';
    existingResult.fetched_at = new Date();
    await existingResult.save();

    // Trigger Notification if newly announced
    if (oldStatus === 'pending' && newStatus === 'announced' && resultNum) {
      const game = await Game.findById(gameId);
      if (game) {
        await notifyUsersForResult(gameId, game.name, resultNum);
      }
    }
    return true;
  } else {
    // Insert new result
    const newRes = new Result({
      game_id: gameId,
      date: normalizedDate,
      result_number: resultNum,
      status: newStatus,
      source: 'api',
      fetched_at: new Date()
    });
    await newRes.save();

    if (newStatus === 'announced' && resultNum) {
      const game = await Game.findById(gameId);
      if (game) {
        await notifyUsersForResult(gameId, game.name, resultNum);
      }
    }
    return true;
  }
};

const logFetch = async (
  startedAt: Date,
  finishedAt: Date,
  gameCode: string | undefined,
  success: boolean,
  errorMessage: string | undefined,
  responseData: any
) => {
  try {
    const log = new FetchLog({
      started_at: startedAt,
      finished_at: finishedAt,
      game_code: gameCode,
      success,
      error_message: errorMessage,
      response_data: responseData
    });
    await log.save();
  } catch (err) {
    logger.error('Failed to write fetch log to DB: %o', err);
  }
};
