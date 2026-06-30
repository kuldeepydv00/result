import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import Game from '../models/Game';
import AdminUser from '../models/AdminUser';
import Settings from '../models/Settings';
import logger from '../utils/logger';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/satta-king';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'kuldeepyadav200507@gmail.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'kuldeep4616';

const gamesData = [
  { name: 'DISAWAR', code: 'disawar', display_name: 'Disawar', schedule_time: '05:00 AM', sort_order: 1 },
  { name: 'TAJ', code: 'taj', display_name: 'Taj', schedule_time: '03:10 PM', sort_order: 2 },
  { name: 'DELHI BAZAR', code: 'delhi_bazar', display_name: 'Delhi Bazar', schedule_time: '03:15 PM', sort_order: 3 },
  { name: 'SHRI GANESH', code: 'shri_ganesh', display_name: 'Shri Ganesh', schedule_time: '04:30 PM', sort_order: 4 },
  { name: 'FARIDABAD', code: 'faridabad', display_name: 'Faridabad', schedule_time: '06:00 PM', sort_order: 5 },
  { name: 'GHAZIABAD', code: 'ghaziabad', display_name: 'Ghaziabad', schedule_time: '08:30 PM', sort_order: 6 },
  { name: 'GALI', code: 'gali', display_name: 'Gali', schedule_time: '11:30 PM', sort_order: 7 }
];

const defaultApiConfig = {
  url: 'http://localhost:5000/api/mock-external-results',
  method: 'GET',
  auth_type: 'none',
  auth_header_key: '',
  auth_header_value: '',
  headers: {},
  body_template: {},
  query_params: { date: '{date}' },
  response_mapping: {
    game_code_field: 'game',
    result_field: 'result',
    date_field: 'date',
    status_field: 'status'
  },
  fetch_interval_minutes: 5
};

const defaultSystemSettings = {
  site_name: 'Satta King Fast',
  timezone: 'Asia/Kolkata',
  fetch_interval_minutes: 5
};

const seed = async () => {
  try {
    logger.info('Connecting to MongoDB for seeding...');
    await mongoose.connect(MONGODB_URI);
    logger.info('Connected to MongoDB.');

    // 1. Seed Admin User
    logger.info('Seeding administrative users...');
    const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 12);
    // Delete legacy admin if exists
    await AdminUser.deleteMany({ email: 'admin@example.com' });

    // Upsert the target admin user
    await AdminUser.findOneAndUpdate(
      { email: ADMIN_EMAIL },
      {
        username: 'admin',
        email: ADMIN_EMAIL,
        password_hash: passwordHash,
        role: 'super_admin'
      },
      { upsert: true, new: true }
    );
    logger.info(`Default super_admin configured: ${ADMIN_EMAIL}`);

    // 2. Seed Games
    logger.info('Seeding games markets...');
    for (const gameData of gamesData) {
      const existingGame = await Game.findOne({ name: gameData.name });
      if (!existingGame) {
        const game = new Game(gameData);
        await game.save();
        logger.info(`Created game: ${gameData.name}`);
      } else {
        // Update schedule and sort_order if exists
        existingGame.schedule_time = gameData.schedule_time;
        existingGame.sort_order = gameData.sort_order;
        await existingGame.save();
      }
    }

    // 3. Seed Settings
    logger.info('Seeding system settings...');
    await Settings.findOneAndUpdate(
      { key: 'system_settings' },
      { value: defaultSystemSettings },
      { upsert: true }
    );
    logger.info('System settings seeded.');

    // 4. Seed API config
    logger.info('Seeding API configuration settings...');
    const existingConfig = await Settings.findOne({ key: 'external_api_config' });
    if (!existingConfig || !existingConfig.value?.url) {
      await Settings.findOneAndUpdate(
        { key: 'external_api_config' },
        { value: defaultApiConfig },
        { upsert: true }
      );
      logger.info('Default mock API config seeded.');
    } else {
      logger.info('API Config already configured, skipping overwrite.');
    }

    logger.info('Database seeding completed successfully.');
    process.exit(0);
  } catch (error) {
    logger.error('Error during seeding: %o', error);
    process.exit(1);
  }
};

seed();
