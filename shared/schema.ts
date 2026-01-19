import { pgTable, text, timestamp, jsonb, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const reports = pgTable("reports", {
  id: uuid("id").primaryKey().defaultRandom(),
  city: text("city").notNull(),
  neighborhood: text("neighborhood"),
  answers: jsonb("answers").notNull(), // Record<string, 'verde' | 'amarillo' | 'rojo'>
  openText: text("open_text"),
  demographics: jsonb("demographics"), // { edad, civil, children... }
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertReportSchema = createInsertSchema(reports).omit({ 
  id: true, 
  createdAt: true 
});

export type Report = typeof reports.$inferSelect;
export type InsertReport = z.infer<typeof insertReportSchema>;

export interface DashboardStats {
  total: number;
  distribution: { rojo: number; amarillo: number; verde: number };
  byDimension: Record<string, { rojo: number; amarillo: number; verde: number; n: number }>;
  recentComments: { text: string; city: string; timestamp: string }[];
}
