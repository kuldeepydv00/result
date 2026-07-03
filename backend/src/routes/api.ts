import { Router, Request, Response } from 'express';
import { publicLimiter, authLimiter } from '../middlewares/rateLimiter';
import { validateRequest } from '../middlewares/validationMiddleware';
import {
  authenticateUser,
  authenticateAdmin,
  requireSuperAdmin
} from '../middlewares/authMiddleware';

import {
  registerSchema,
  loginSchema,
  gameSchema,
  resultUpdateSchema,
  apiConfigSchema,
  systemSettingsSchema
} from '../middlewares/validationSchemas';

import {
  registerUser,
  loginUser,
  loginAdmin,
  loginAdminByLink
} from '../controllers/authController';

import {
  getActiveGames,
  adminGetGames,
  adminCreateGame,
  adminUpdateGame,
  adminDeleteGame
} from '../controllers/gameController';

import {
  getResultsByDate,
  getPaginatedGameResults,
  searchResults,
  adminGetResultsByDate,
  adminUpdateResult,
  adminBulkUploadResults,
  adminMarkAllAnnounced
} from '../controllers/resultController';

import {
  getChartData,
  adminSaveChartGrid,
  adminUploadChartCsv
} from '../controllers/chartController';

import {
  getStats,
  getSystemSettings,
  updateSystemSettings,
  getApiConfig,
  updateApiConfig,
  testApiConnection,
  triggerFetchNow,
  getFetchLogs
} from '../controllers/settingsController';

import {
  getVapidKey,
  saveSubscription
} from '../controllers/notificationController';

import {
  getUserProfile,
  updateUserProfile,
  toggleFavoriteGame,
  updateNotificationSettings,
  adminGetUsers,
  adminToggleUserStatus,
  adminUpdateUserRole
} from '../controllers/userController';

const router = Router();

// ==========================================
// 0. MOCK EXTERNAL API (For Local testing/Test Connection)
// ==========================================
router.get('/mock-external-results', (req: Request, res: Response) => {
  const dateStr = (req.query.date as string) || new Date().toISOString().split('T')[0];
  const games = ['disawar', 'gali', 'faridabad', 'ghaziabad', 'delhi_bazar', 'taj'];
  
  const mockResults = games.map((game, index) => {
    // Deterministic random numbers based on date & game code for reliable testing
    const codeVal = game.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
    const dateVal = dateStr.split('-').reduce((sum, part) => sum + (parseInt(part, 10) || 0), 0);
    const resultNum = String((codeVal + dateVal + index) % 100).padStart(2, '0');

    return {
      game,
      result: resultNum,
      date: dateStr,
      status: 'announced'
    };
  });

  return res.status(200).json(mockResults);
});

// ==========================================
// 1. PUBLIC AUTH ENDPOINTS
// ==========================================
router.post('/auth/register', authLimiter, validateRequest(registerSchema), registerUser);
router.post('/auth/login', authLimiter, validateRequest(loginSchema), loginUser);
router.post('/admin/login', authLimiter, validateRequest(loginSchema), loginAdmin);
router.post('/admin/login-by-link', authLimiter, loginAdminByLink);

import { fetchResultsFromApi } from '../services/apiFetcher';

// ==========================================
// 2. PUBLIC informational ENDPOINTS
// ==========================================
router.get('/games', publicLimiter, getActiveGames);
router.get('/results/date/:date', publicLimiter, getResultsByDate);
router.get('/results/game/:gameId', publicLimiter, getPaginatedGameResults);
router.get('/charts/:gameId/:year/:month', publicLimiter, getChartData);
router.post('/search', publicLimiter, searchResults);
router.get('/notifications/subscribe', publicLimiter, getVapidKey);
router.post('/notifications/subscribe', publicLimiter, saveSubscription);
router.get('/cron/run', async (req: Request, res: Response) => {
  try {
    const result = await fetchResultsFromApi(new Date());
    return res.status(200).json({
      success: true,
      message: 'Cron triggered successfully',
      data: result
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: 'Failed to run cron',
      error: error.message
    });
  }
});


// ==========================================
// 3. USER AUTHENTICATED ENDPOINTS
// ==========================================
router.get('/user/profile', authenticateUser, getUserProfile);
router.put('/user/profile', authenticateUser, updateUserProfile);
router.put('/user/favorites', authenticateUser, toggleFavoriteGame);
router.put('/user/notifications', authenticateUser, updateNotificationSettings);

// ==========================================
// 4. ADMIN AUTHENTICATED ENDPOINTS
// ==========================================
router.get('/admin/stats', authenticateAdmin, getStats);

// Games CRUD
router.get('/admin/games', authenticateAdmin, adminGetGames);
router.post('/admin/games', authenticateAdmin, validateRequest(gameSchema), adminCreateGame);
router.put('/admin/games/:id', authenticateAdmin, validateRequest(gameSchema.partial()), adminUpdateGame);
router.delete('/admin/games/:id', authenticateAdmin, adminDeleteGame);

// Results CRUD
router.get('/admin/results', authenticateAdmin, adminGetResultsByDate);
router.post('/admin/results', authenticateAdmin, validateRequest(resultUpdateSchema), adminUpdateResult);
router.post('/admin/results/bulk', authenticateAdmin, adminBulkUploadResults);
router.post('/admin/results/mark-all-announced', authenticateAdmin, adminMarkAllAnnounced);

// Charts CRUD
router.post('/admin/charts', authenticateAdmin, adminSaveChartGrid);
router.post('/admin/charts/upload', authenticateAdmin, adminUploadChartCsv);

// Settings CRUD
router.get('/admin/settings/api', authenticateAdmin, getApiConfig);
router.put('/admin/settings/api', authenticateAdmin, validateRequest(apiConfigSchema), updateApiConfig);
router.post('/admin/settings/api/test', authenticateAdmin, validateRequest(apiConfigSchema), testApiConnection);
router.post('/admin/settings/api/trigger-fetch', authenticateAdmin, triggerFetchNow);

router.get('/admin/settings/system', authenticateAdmin, getSystemSettings);
router.put('/admin/settings/system', authenticateAdmin, validateRequest(systemSettingsSchema), updateSystemSettings);

// Fetch Logs
router.get('/admin/logs', authenticateAdmin, getFetchLogs);

// Users Control
router.get('/admin/users', authenticateAdmin, adminGetUsers);
router.put('/admin/users/:id/disable', authenticateAdmin, adminToggleUserStatus);
router.put('/admin/users/:id/role', authenticateAdmin, requireSuperAdmin, adminUpdateUserRole);

export default router;
