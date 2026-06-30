import { z } from 'zod';

export const registerSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    full_name: z.string().min(2, 'Name must be at least 2 characters').optional()
  })
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(1, 'Password is required')
  })
});

export const gameSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    code: z.string().min(2, 'Code must be at least 2 characters'),
    display_name: z.string().min(2, 'Display name must be at least 2 characters'),
    schedule_time: z.string().regex(/^(0?[1-9]|1[0-2]):[0-5][0-9]\s(AM|PM)$/i, 'Format must be HH:MM AM/PM (e.g. "11:25 PM")'),
    timezone: z.string().optional(),
    is_active: z.boolean().optional(),
    is_featured: z.boolean().optional(),
    sort_order: z.number().int().optional()
  })
});

export const resultUpdateSchema = z.object({
  body: z.object({
    game_id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid Game ID format'),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date format must be YYYY-MM-DD'),
    result_number: z.string().max(4, 'Result number must be 4 characters or fewer').nullable().optional(),
    status: z.enum(['announced', 'pending']).optional(),
    source: z.enum(['api', 'manual']).optional()
  })
});

export const apiConfigSchema = z.object({
  body: z.object({
    url: z.string().url('Must be a valid API URL'),
    method: z.enum(['GET', 'POST', 'PUT']),
    auth_type: z.enum(['none', 'bearer', 'api_key']),
    auth_header_key: z.string().optional(),
    auth_header_value: z.string().optional(),
    headers: z.record(z.string()).optional(),
    body_template: z.any().optional(),
    query_params: z.record(z.string()).optional(),
    response_mapping: z.object({
      game_code_field: z.string().min(1, 'Game code JSON-path is required'),
      result_field: z.string().min(1, 'Result value JSON-path is required'),
      date_field: z.string().min(1, 'Date value JSON-path is required'),
      status_field: z.string().optional(),
      array_path: z.string().optional()
    }),
    fetch_interval_minutes: z.number().int().min(1).max(1440).optional()
  })
});

export const systemSettingsSchema = z.object({
  body: z.object({
    site_name: z.string().min(2),
    timezone: z.string().min(2),
    fetch_interval_minutes: z.number().int().min(1).max(1440)
  })
});
