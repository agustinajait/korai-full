import { z } from 'zod';
import { insertReportSchema, reports } from './schema';

export const api = {
  reports: {
    create: {
      method: 'POST' as const,
      path: '/api/reports',
      input: insertReportSchema,
      responses: {
        201: z.custom<typeof reports.$inferSelect>(),
        400: z.object({ message: z.string() })
      }
    },
    list: {
      method: 'GET' as const,
      path: '/api/reports',
      input: z.object({
        city: z.string().optional(),
        neighborhood: z.string().optional(),
        days: z.coerce.number().optional()
      }).optional(),
      responses: {
        200: z.array(z.custom<typeof reports.$inferSelect>())
      }
    },
    stats: {
      method: 'GET' as const,
      path: '/api/stats',
      input: z.object({
        city: z.string().optional()
      }).optional(),
      responses: {
        200: z.custom<{
          total: number;
          distribution: { rojo: number; amarillo: number; verde: number };
          byDimension: Record<string, { rojo: number; amarillo: number; verde: number }>;
        }>()
      }
    }
  }
};
