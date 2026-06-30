import { Request, Response } from 'express';
import Game from '../models/Game';
import Result from '../models/Result';
import Chart from '../models/Chart';
import { notifyUsersForResult } from '../services/apiFetcher';
import logger from '../utils/logger';

// Normalize date to UTC midnight
const getUtcMidnight = (dateVal: string | Date): Date => {
  const d = new Date(dateVal);
  return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
};

// PUBLIC: Get results for a date (maps active games and defaults missing results to pending)
export const getResultsByDate = async (req: Request, res: Response) => {
  try {
    const { date } = req.params;
    const utcDate = getUtcMidnight(date);
    if (isNaN(utcDate.getTime())) {
      return res.status(400).json({ message: 'Invalid date parameter' });
    }

    const activeGames = await Game.find({ is_active: true }).sort({ sort_order: 1 });
    const results = await Result.find({ date: utcDate });

    const mapped = activeGames.map(game => {
      const resObj = results.find(r => r.game_id.toString() === game._id.toString());
      return {
        game_id: game._id,
        name: game.name,
        code: game.code,
        display_name: game.display_name,
        schedule_time: game.schedule_time,
        result_number: resObj ? resObj.result_number : null,
        status: resObj ? resObj.status : 'pending',
        source: resObj ? resObj.source : 'api',
        updated_at: resObj ? resObj.updated_at : null
      };
    });

    return res.status(200).json(mapped);
  } catch (error) {
    logger.error('Error in getResultsByDate: %o', error);
    return res.status(500).json({ message: 'Error retrieving results' });
  }
};

// PUBLIC: Get paginated results for a game
export const getPaginatedGameResults = async (req: Request, res: Response) => {
  try {
    const { gameId } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 30;
    const skip = (page - 1) * limit;

    const results = await Result.find({ game_id: gameId, status: 'announced' })
      .sort({ date: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Result.countDocuments({ game_id: gameId, status: 'announced' });

    return res.status(200).json({
      results,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    logger.error('Error in getPaginatedGameResults: %o', error);
    return res.status(500).json({ message: 'Error retrieving results history' });
  }
};

// PUBLIC: Global search across dates, game names, and results numbers
export const searchResults = async (req: Request, res: Response) => {
  try {
    const { query } = req.body;
    if (!query) {
      return res.status(400).json({ message: 'Query string is required' });
    }

    const term = String(query).trim();
    let resultsByDate: any[] = [];
    
    // Check if query is YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(term)) {
      const utcDate = getUtcMidnight(term);
      if (!isNaN(utcDate.getTime())) {
        resultsByDate = await Result.find({ date: utcDate }).populate('game_id');
      }
    }

    // Match games by name
    const matchedGames = await Game.find({
      $or: [
        { name: { $regex: term, $options: 'i' } },
        { display_name: { $regex: term, $options: 'i' } }
      ]
    });
    const matchedGameIds = matchedGames.map(g => g._id);

    // Match results by result number
    const resultsByNumber = await Result.find({
      result_number: term,
      status: 'announced'
    })
      .populate('game_id')
      .sort({ date: -1 })
      .limit(50);

    // Get results for matched games
    let resultsByGame: any[] = [];
    if (matchedGameIds.length > 0) {
      resultsByGame = await Result.find({
        game_id: { $in: matchedGameIds },
        status: 'announced'
      })
        .populate('game_id')
        .sort({ date: -1 })
        .limit(50);
    }

    return res.status(200).json({
      query: term,
      games: matchedGames,
      results_by_date: resultsByDate.map(r => ({
        date: r.date,
        result_number: r.result_number,
        status: r.status,
        game_name: (r.game_id as any)?.name || 'Unknown',
        game_code: (r.game_id as any)?.code || ''
      })),
      results_by_number: resultsByNumber.map(r => ({
        date: r.date,
        result_number: r.result_number,
        game_name: (r.game_id as any)?.name || 'Unknown',
        game_code: (r.game_id as any)?.code || ''
      })),
      results_by_game: resultsByGame.map(r => ({
        date: r.date,
        result_number: r.result_number,
        game_name: (r.game_id as any)?.name || 'Unknown',
        game_code: (r.game_id as any)?.code || ''
      }))
    });
  } catch (error) {
    logger.error('Search failed: %o', error);
    return res.status(500).json({ message: 'Search query execution error' });
  }
};

// ADMIN: Get results list for any date (returns all games, including inactive, with status details)
export const adminGetResultsByDate = async (req: Request, res: Response) => {
  try {
    const { date } = req.query;
    if (!date) {
      return res.status(400).json({ message: 'Date parameter is required' });
    }
    const utcDate = getUtcMidnight(date as string);
    const games = await Game.find().sort({ sort_order: 1 });
    const results = await Result.find({ date: utcDate });

    const mapped = games.map(game => {
      const resObj = results.find(r => r.game_id.toString() === game._id.toString());
      return {
        _id: resObj?._id || null,
        game_id: game._id,
        name: game.name,
        display_name: game.display_name,
        code: game.code,
        schedule_time: game.schedule_time,
        is_active: game.is_active,
        result_number: resObj ? resObj.result_number : null,
        status: resObj ? resObj.status : 'pending',
        source: resObj ? resObj.source : 'api'
      };
    });

    return res.status(200).json(mapped);
  } catch (error) {
    logger.error('Admin get results error: %o', error);
    return res.status(500).json({ message: 'Failed to retrieve results' });
  }
};

// ADMIN: Manual result upsert
export const adminUpdateResult = async (req: Request, res: Response) => {
  try {
    const { game_id, date, result_number, status, source } = req.body;
    const utcDate = getUtcMidnight(date);
    if (isNaN(utcDate.getTime())) {
      return res.status(400).json({ message: 'Invalid date format' });
    }

    const game = await Game.findById(game_id);
    if (!game) {
      return res.status(444).json({ message: 'Game does not exist' });
    }

    const existingResult = await Result.findOne({ game_id, date: utcDate });

    const targetStatus = status || 'announced';
    const targetSource = source || 'manual'; // Default manual
    const normalizedNumber = targetStatus === 'pending' ? null : (result_number ? String(result_number).trim() : null);

    let updatedResult;
    let isNewAnnouncement = false;

    if (existingResult) {
      if (existingResult.status === 'pending' && targetStatus === 'announced' && normalizedNumber) {
        isNewAnnouncement = true;
      }
      existingResult.result_number = normalizedNumber;
      existingResult.status = targetStatus;
      existingResult.source = targetSource;
      existingResult.fetched_at = new Date();
      updatedResult = await existingResult.save();
    } else {
      if (targetStatus === 'announced' && normalizedNumber) {
        isNewAnnouncement = true;
      }
      const newRes = new Result({
        game_id,
        date: utcDate,
        result_number: normalizedNumber,
        status: targetStatus,
        source: targetSource,
        fetched_at: new Date()
      });
      updatedResult = await newRes.save();
    }

    // Sync to Charts collection automatically!
    const day = utcDate.getUTCDate();
    const year = utcDate.getUTCFullYear();
    const month = utcDate.getUTCMonth() + 1; // 1-indexed
    
    const chart = await Chart.findOne({ game_id, year, month });
    const resultString = normalizedNumber || '';

    if (chart) {
      const idx = chart.data.findIndex(d => d.day === day);
      if (idx !== -1) {
        chart.data[idx].result = resultString;
      } else {
        chart.data.push({ day, result: resultString });
      }
      await chart.save();
    } else {
      const newChart = new Chart({
        game_id,
        year,
        month,
        data: [{ day, result: resultString }]
      });
      await newChart.save();
    }

    // Trigger Notification
    if (isNewAnnouncement && normalizedNumber) {
      await notifyUsersForResult(game._id, game.name, normalizedNumber);
    }

    logger.info(`Admin updated result manually for ${game.name} on ${utcDate.toISOString()} to value ${normalizedNumber}`);
    return res.status(200).json(updatedResult);
  } catch (error) {
    logger.error('Admin result update failed: %o', error);
    return res.status(500).json({ message: 'Failed to update result record' });
  }
};

// ADMIN: Bulk upload results (expects a JSON array of: { date, game_code, result_number })
export const adminBulkUploadResults = async (req: Request, res: Response) => {
  try {
    const { items } = req.body;
    if (!items || !Array.isArray(items)) {
      return res.status(400).json({ message: 'Payload must contain a list of items' });
    }

    const games = await Game.find();
    let loadedCount = 0;

    for (const item of items) {
      const { date, game_code, result_number } = item;
      if (!date || !game_code || result_number === undefined) continue;

      const matchedGame = games.find(g => g.code.toLowerCase() === String(game_code).trim().toLowerCase());
      if (!matchedGame) continue;

      const utcDate = getUtcMidnight(date);
      if (isNaN(utcDate.getTime())) continue;

      const cleanNum = String(result_number).trim();

      // Upsert
      await Result.findOneAndUpdate(
        { game_id: matchedGame._id, date: utcDate },
        {
          result_number: cleanNum || null,
          status: cleanNum ? 'announced' : 'pending',
          source: 'manual',
          fetched_at: new Date()
        },
        { upsert: true }
      );

      // Add/Update chart entry
      const day = utcDate.getUTCDate();
      const year = utcDate.getUTCFullYear();
      const month = utcDate.getUTCMonth() + 1;

      const chart = await Chart.findOne({ game_id: matchedGame._id, year, month });
      if (chart) {
        const idx = chart.data.findIndex(d => d.day === day);
        if (idx !== -1) {
          chart.data[idx].result = cleanNum;
        } else {
          chart.data.push({ day, result: cleanNum });
        }
        await chart.save();
      } else {
        const newChart = new Chart({
          game_id: matchedGame._id,
          year,
          month,
          data: [{ day, result: cleanNum }]
        });
        await newChart.save();
      }

      loadedCount++;
    }

    logger.info(`Admin performed bulk results import. Loaded ${loadedCount} entries.`);
    return res.status(200).json({ message: `Successfully loaded ${loadedCount} results` });
  } catch (error) {
    logger.error('Bulk result upload error: %o', error);
    return res.status(500).json({ message: 'Failed to perform bulk upload' });
  }
};

// ADMIN: Mark all pending results for a date as "announced"
export const adminMarkAllAnnounced = async (req: Request, res: Response) => {
  try {
    const { date } = req.body;
    if (!date) {
      return res.status(400).json({ message: 'Date parameter is required' });
    }

    const utcDate = getUtcMidnight(date);
    if (isNaN(utcDate.getTime())) {
      return res.status(400).json({ message: 'Invalid date value' });
    }

    // Fetch all results for this date that are pending and have a non-null number
    const resultsToAnnounce = await Result.find({
      date: utcDate,
      status: 'pending',
      result_number: { $ne: null, $exists: true }
    });

    let count = 0;
    for (const r of resultsToAnnounce) {
      r.status = 'announced';
      r.fetched_at = new Date();
      await r.save();

      const game = await Game.findById(r.game_id);
      if (game && r.result_number) {
        await notifyUsersForResult(game._id, game.name, r.result_number);
      }
      count++;
    }

    logger.info(`Admin marked all pending results announced for date: ${utcDate.toISOString()}. Count: ${count}`);
    return res.status(200).json({ message: `Marked ${count} results as announced` });
  } catch (error) {
    logger.error('Mark all announced error: %o', error);
    return res.status(500).json({ message: 'Error marking results announced' });
  }
};
