import { Request, Response } from 'express';
import Game from '../models/Game';
import logger from '../utils/logger';

// PUBLIC: Get active games
export const getActiveGames = async (req: Request, res: Response) => {
  try {
    const games = await Game.find({ is_active: true }).sort({ sort_order: 1 });
    return res.status(200).json(games);
  } catch (error) {
    logger.error('Error fetching active games: %o', error);
    return res.status(500).json({ message: 'Error retrieving active games' });
  }
};

// ADMIN: Get all games
export const adminGetGames = async (req: Request, res: Response) => {
  try {
    const games = await Game.find().sort({ sort_order: 1 });
    return res.status(200).json(games);
  } catch (error) {
    logger.error('Error fetching admin games list: %o', error);
    return res.status(500).json({ message: 'Error retrieving games' });
  }
};

// ADMIN: Create game
export const adminCreateGame = async (req: Request, res: Response) => {
  try {
    const { name, code, display_name, schedule_time, timezone, is_active, is_featured, sort_order } = req.body;

    const codeLower = code.trim().toLowerCase();
    const existingCode = await Game.findOne({ code: codeLower });
    if (existingCode) {
      return res.status(400).json({ message: 'Game code must be unique' });
    }

    const existingName = await Game.findOne({ name });
    if (existingName) {
      return res.status(400).json({ message: 'Game name must be unique' });
    }

    const game = new Game({
      name,
      code: codeLower,
      display_name,
      schedule_time,
      timezone: timezone || 'Asia/Kolkata',
      is_active: is_active !== undefined ? is_active : true,
      is_featured: is_featured !== undefined ? is_featured : false,
      sort_order: sort_order || 0
    });

    await game.save();
    logger.info(`Game created by admin: ${name} (${codeLower})`);
    return res.status(201).json(game);
  } catch (error) {
    logger.error('Failed to create game: %o', error);
    return res.status(500).json({ message: 'Server error creating game' });
  }
};

// ADMIN: Update game
export const adminUpdateGame = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, code, display_name, schedule_time, timezone, is_active, is_featured, sort_order } = req.body;

    const game = await Game.findById(id);
    if (!game) {
      return res.status(444).json({ message: 'Game not found' });
    }

    if (code) {
      const codeLower = code.trim().toLowerCase();
      const duplicate = await Game.findOne({ code: codeLower, _id: { $ne: id } });
      if (duplicate) {
        return res.status(400).json({ message: 'Another game already uses this code' });
      }
      game.code = codeLower;
    }

    if (name) {
      const duplicate = await Game.findOne({ name, _id: { $ne: id } });
      if (duplicate) {
        return res.status(400).json({ message: 'Another game already uses this name' });
      }
      game.name = name;
    }

    if (display_name !== undefined) game.display_name = display_name;
    if (schedule_time !== undefined) game.schedule_time = schedule_time;
    if (timezone !== undefined) game.timezone = timezone;
    if (is_active !== undefined) game.is_active = is_active;
    if (is_featured !== undefined) game.is_featured = is_featured;
    if (sort_order !== undefined) game.sort_order = sort_order;

    await game.save();
    logger.info(`Game updated by admin: ${game.name}`);
    return res.status(200).json(game);
  } catch (error) {
    logger.error('Failed to update game: %o', error);
    return res.status(500).json({ message: 'Server error updating game' });
  }
};

// ADMIN: Delete game
export const adminDeleteGame = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const game = await Game.findById(id);
    if (!game) {
      return res.status(404).json({ message: 'Game not found' });
    }

    await Game.findByIdAndDelete(id);
    // Also delete references in results or charts if preferred, but usually keeping them is fine or we cascade delete:
    // await Result.deleteMany({ game_id: id });
    // await Chart.deleteMany({ game_id: id });

    logger.info(`Game deleted by admin: ${game.name}`);
    return res.status(200).json({ message: 'Game and associations deleted successfully' });
  } catch (error) {
    logger.error('Failed to delete game: %o', error);
    return res.status(500).json({ message: 'Server error deleting game' });
  }
};
