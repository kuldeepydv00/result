import { Request, Response } from 'express';
import axios from 'axios';
import Settings from '../models/Settings';
import FetchLog from '../models/FetchLog';
import Game from '../models/Game';
import Result from '../models/Result';
import User from '../models/User';
import { fetchResultsFromApi, getValueByJsonPath } from '../services/apiFetcher';
import logger from '../utils/logger';

// Helper to replace placeholders (local copy)
const replacePlaceholders = (val: any, gameCode: string, dateStr: string): any => {
  if (typeof val === 'string') {
    return val.replace(/{game_code}/g, gameCode).replace(/{date}/g, dateStr);
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

// GET Stats for Admin Dashboard
export const getStats = async (req: Request, res: Response) => {
  try {
    const todayStr = new Date().toISOString().split('T')[0];
    const todayMidnight = new Date(Date.UTC(new Date().getFullYear(), new Date().getMonth(), new Date().getDate()));

    const totalGames = await Game.countDocuments();
    const activeGames = await Game.countDocuments({ is_active: true });
    const totalUsers = await User.countDocuments({ role: 'user' });

    // Announced today
    const announcedToday = await Result.countDocuments({
      date: todayMidnight,
      status: 'announced'
    });

    const recentLogs = await FetchLog.find().sort({ created_at: -1 }).limit(5);
    const successfulFetches = await FetchLog.countDocuments({ success: true });
    const failedFetches = await FetchLog.countDocuments({ success: false });

    return res.status(200).json({
      total_games: totalGames,
      active_games: activeGames,
      total_users: totalUsers,
      announced_today: announcedToday,
      fetches: {
        success: successfulFetches,
        failure: failedFetches,
        recent: recentLogs
      }
    });
  } catch (error) {
    logger.error('Error fetching admin stats: %o', error);
    return res.status(500).json({ message: 'Error retrieving statistics' });
  }
};

// GET System Settings
export const getSystemSettings = async (req: Request, res: Response) => {
  try {
    let settings = await Settings.findOne({ key: 'system_settings' });
    if (!settings) {
      settings = new Settings({
        key: 'system_settings',
        value: {
          site_name: 'Satta King Fast',
          timezone: 'Asia/Kolkata',
          fetch_interval_minutes: 5
        }
      });
      await settings.save();
    }
    return res.status(200).json(settings.value);
  } catch (error) {
    logger.error('Failed to get system settings: %o', error);
    return res.status(500).json({ message: 'Error retrieving system settings' });
  }
};

// UPDATE System Settings
export const updateSystemSettings = async (req: Request, res: Response) => {
  try {
    const { site_name, timezone, fetch_interval_minutes } = req.body;
    
    const settings = await Settings.findOneAndUpdate(
      { key: 'system_settings' },
      {
        value: {
          site_name: site_name || 'Satta King Fast',
          timezone: timezone || 'Asia/Kolkata',
          fetch_interval_minutes: parseInt(fetch_interval_minutes || '5', 10)
        }
      },
      { upsert: true, new: true }
    );

    logger.info('System settings updated by admin.');
    return res.status(200).json(settings.value);
  } catch (error) {
    logger.error('Failed to update system settings: %o', error);
    return res.status(500).json({ message: 'Failed to save system settings' });
  }
};

// GET External API Config
export const getApiConfig = async (req: Request, res: Response) => {
  try {
    let settings = await Settings.findOne({ key: 'external_api_config' });
    if (!settings) {
      settings = new Settings({
        key: 'external_api_config',
        value: {
          url: '',
          method: 'GET',
          auth_type: 'none',
          auth_header_key: '',
          auth_header_value: '',
          headers: {},
          body_template: {},
          query_params: {},
          response_mapping: {
            game_code_field: 'game',
            result_field: 'result',
            date_field: 'date',
            status_field: 'status'
          }
        }
      });
      await settings.save();
    }
    return res.status(200).json(settings.value);
  } catch (error) {
    logger.error('Failed to get API configuration: %o', error);
    return res.status(500).json({ message: 'Error retrieving API configuration' });
  }
};

// UPDATE External API Config
export const updateApiConfig = async (req: Request, res: Response) => {
  try {
    const config = req.body;
    const settings = await Settings.findOneAndUpdate(
      { key: 'external_api_config' },
      { value: config },
      { upsert: true, new: true }
    );
    logger.info('External API configuration updated by admin.');
    return res.status(200).json(settings.value);
  } catch (error) {
    logger.error('Failed to update API configuration: %o', error);
    return res.status(500).json({ message: 'Failed to save API configuration' });
  }
};

// TEST External API Connection
export const testApiConnection = async (req: Request, res: Response) => {
  try {
    const config = req.body;
    const testGameCode = 'gali';
    const testDateStr = new Date().toISOString().split('T')[0];

    const testUrl = replacePlaceholders(config.url, testGameCode, testDateStr);
    const testHeaders = { ...replacePlaceholders(config.headers || {}, testGameCode, testDateStr) };
    const testQueryParams = { ...replacePlaceholders(config.query_params || {}, testGameCode, testDateStr) };
    const testBody = config.body_template ? replacePlaceholders(config.body_template, testGameCode, testDateStr) : undefined;

    if (config.auth_type === 'bearer' && config.auth_header_value) {
      testHeaders['Authorization'] = `Bearer ${config.auth_header_value}`;
    } else if (config.auth_type === 'api_key' && config.auth_header_key && config.auth_header_value) {
      testHeaders[config.auth_header_key] = config.auth_header_value;
    }

    logger.info(`Testing API Connection: ${testUrl}`);

    const response = await axios({
      url: testUrl,
      method: config.method,
      headers: testHeaders,
      params: testQueryParams,
      data: testBody,
      timeout: 5000
    });

    const responseData = response.data;
    
    // Evaluate mapping on response data
    let mappedResult: any = null;
    let mappedStatus: any = 'announced';
    let mappedGame: any = null;

    const isSingle = config.url.includes('{game_code}') || 
                     JSON.stringify(config.query_params || {}).includes('{game_code}') ||
                     JSON.stringify(config.body_template || {}).includes('{game_code}');

    if (isSingle) {
      mappedResult = getValueByJsonPath(responseData, config.response_mapping.result_field);
      if (config.response_mapping.status_field) {
        mappedStatus = getValueByJsonPath(responseData, config.response_mapping.status_field);
      }
      mappedGame = testGameCode;
    } else {
      // Global list response
      let dataItems = responseData;
      const arrayPath = (config.response_mapping as any).array_path;
      if (arrayPath) {
        dataItems = getValueByJsonPath(responseData, arrayPath) || responseData;
      }

      if (Array.isArray(dataItems)) {
        // Search for matching test code
        let item = dataItems.find(i => {
          const codeVal = getValueByJsonPath(i, config.response_mapping.game_code_field);
          if (codeVal === undefined || codeVal === null) return false;
          return String(codeVal).toLowerCase() === testGameCode;
        });

        // Fallback: grab first element in list for diagnostic preview
        if (!item && dataItems.length > 0) {
          item = dataItems[0];
        }

        if (item) {
          mappedResult = getValueByJsonPath(item, config.response_mapping.result_field);
          mappedStatus = config.response_mapping.status_field ? getValueByJsonPath(item, config.response_mapping.status_field) : 'announced';
          mappedGame = getValueByJsonPath(item, config.response_mapping.game_code_field);
        }
      } else if (typeof dataItems === 'object' && dataItems !== null) {
        const customPath = config.response_mapping.result_field.replace(/{game_code}/g, testGameCode);
        mappedResult = getValueByJsonPath(dataItems, customPath);
        if (config.response_mapping.status_field) {
          const customStatusPath = config.response_mapping.status_field.replace(/{game_code}/g, testGameCode);
          mappedStatus = getValueByJsonPath(dataItems, customStatusPath);
        }
        mappedGame = testGameCode;
      }
    }

    return res.status(200).json({
      status: 'success',
      request: {
        url: testUrl,
        method: config.method,
        headers: testHeaders,
        params: testQueryParams,
        data: testBody
      },
      response: {
        status: response.status,
        data: responseData
      },
      mapping_result: {
        game_matched: mappedGame,
        extracted_result: mappedResult,
        extracted_status: mappedStatus
      }
    });
  } catch (error: any) {
    logger.error('API Test connection failed: %o', error);
    return res.status(200).json({
      status: 'error',
      message: error.message,
      response: error.response ? {
        status: error.response.status,
        data: error.response.data
      } : null
    });
  }
};

// TRIGGER API manual fetch for today
export const triggerFetchNow = async (req: Request, res: Response) => {
  try {
    logger.info('Admin triggered manual API results fetch.');
    const result = await fetchResultsFromApi(new Date());
    if (result.success) {
      return res.status(200).json({
        message: `API fetch complete. Processed ${result.count} games successfully.`
      });
    } else {
      return res.status(400).json({ message: result.error || 'Fetch operation failed' });
    }
  } catch (error: any) {
    logger.error('Failed to trigger fetch: %o', error);
    return res.status(500).json({ message: error.message });
  }
};

// GET Fetch Logs (paginated)
export const getFetchLogs = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const skip = (page - 1) * limit;

    const logs = await FetchLog.find()
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(limit);

    const total = await FetchLog.countDocuments();

    return res.status(200).json({
      logs,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    logger.error('Failed to get fetch logs: %o', error);
    return res.status(500).json({ message: 'Error retrieving logs' });
  }
};
