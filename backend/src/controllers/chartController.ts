import { Request, Response } from 'express';
import Chart from '../models/Chart';
import Result from '../models/Result';
import logger from '../utils/logger';

// PUBLIC: Get monthly chart
export const getChartData = async (req: Request, res: Response) => {
  try {
    const { gameId, year, month } = req.params;
    const y = parseInt(year);
    const m = parseInt(month);

    if (isNaN(y) || isNaN(m) || m < 1 || m > 12) {
      return res.status(400).json({ message: 'Invalid year or month parameter' });
    }

    const chart = await Chart.findOne({ game_id: gameId, year: y, month: m });

    // Sync query results for missing days from main Results collection
    const startDate = new Date(Date.UTC(y, m - 1, 1));
    const endDate = new Date(Date.UTC(y, m, 1));

    const results = await Result.find({
      game_id: gameId,
      date: { $gte: startDate, $lt: endDate },
      status: 'announced'
    });

    const daysCount = new Date(y, m, 0).getDate();
    const data = Array.from({ length: daysCount }, (_, i) => {
      const day = i + 1;
      const resItem = results.find(r => r.date.getUTCDate() === day);
      const chartItem = chart?.data.find(d => d.day === day);

      return {
        day,
        result: chartItem?.result || resItem?.result_number || ''
      };
    });

    return res.status(200).json({
      game_id: gameId,
      year: y,
      month: m,
      data
    });
  } catch (error) {
    logger.error('Failed to get monthly chart: %o', error);
    return res.status(500).json({ message: 'Error retrieving chart' });
  }
};

// ADMIN: Manual chart save
export const adminSaveChartGrid = async (req: Request, res: Response) => {
  try {
    const { game_id, year, month, data } = req.body;
    const y = parseInt(year);
    const m = parseInt(month);

    if (isNaN(y) || isNaN(m) || !Array.isArray(data)) {
      return res.status(400).json({ message: 'Invalid request parameters' });
    }

    const chart = await Chart.findOneAndUpdate(
      { game_id, year: y, month: m },
      { data },
      { upsert: true, new: true }
    );

    // Sync to results table
    for (const item of data) {
      const utcDate = new Date(Date.UTC(y, m - 1, item.day));
      const val = String(item.result).trim();

      await Result.findOneAndUpdate(
        { game_id, date: utcDate },
        {
          result_number: val || null,
          status: val ? 'announced' : 'pending',
          source: 'manual',
          fetched_at: new Date()
        },
        { upsert: true }
      );
    }

    logger.info(`Chart grid manually saved by admin for Game: ${game_id}, Date: ${y}-${m}`);
    return res.status(200).json(chart);
  } catch (error) {
    logger.error('Failed to save chart grid: %o', error);
    return res.status(500).json({ message: 'Error saving chart' });
  }
};

// ADMIN: Bulk CSV chart upload
export const adminUploadChartCsv = async (req: Request, res: Response) => {
  try {
    const { game_id, year, month, csvText } = req.body;
    const y = parseInt(year);
    const m = parseInt(month);

    if (isNaN(y) || isNaN(m) || !csvText) {
      return res.status(400).json({ message: 'Missing CSV content or date params' });
    }

    const lines = csvText.split('\n');
    const parsedData: { day: number; result: string }[] = [];

    for (const line of lines) {
      if (!line.trim()) continue;
      const parts = line.split(',');
      if (parts.length >= 2) {
        const d = parseInt(parts[0].trim());
        const r = parts[1].trim();
        if (!isNaN(d) && d >= 1 && d <= 31) {
          parsedData.push({ day: d, result: r });
        }
      }
    }

    const chart = await Chart.findOneAndUpdate(
      { game_id, year: y, month: m },
      { data: parsedData },
      { upsert: true, new: true }
    );

    // Sync back to results
    for (const item of parsedData) {
      const utcDate = new Date(Date.UTC(y, m - 1, item.day));
      const val = String(item.result).trim();

      await Result.findOneAndUpdate(
        { game_id, date: utcDate },
        {
          result_number: val || null,
          status: val ? 'announced' : 'pending',
          source: 'manual',
          fetched_at: new Date()
        },
        { upsert: true }
      );
    }

    logger.info(`CSV uploaded successfully for Game: ${game_id}, Date: ${y}-${m}. Entries: ${parsedData.length}`);
    return res.status(200).json(chart);
  } catch (error) {
    logger.error('CSV upload error: %o', error);
    return res.status(500).json({ message: 'Error parsing CSV upload' });
  }
};
