import { db } from "./db";
import { reports, type InsertReport, type Report } from "@shared/schema";
import { eq, desc, and } from "drizzle-orm";

export interface IStorage {
  createReport(report: InsertReport): Promise<Report>;
  getReports(filters?: { city?: string; neighborhood?: string; days?: number }): Promise<Report[]>;
  getStats(city?: string): Promise<{
    total: number;
    distribution: { rojo: number; amarillo: number; verde: number };
    byDimension: Record<string, { rojo: number; amarillo: number; verde: number; n: number }>;
  }>;
}

export class DatabaseStorage implements IStorage {
  async createReport(insertReport: InsertReport): Promise<Report> {
    const [report] = await db.insert(reports).values(insertReport).returning();
    return report;
  }

  async getReports(filters?: { city?: string; neighborhood?: string; days?: number }): Promise<Report[]> {
    // Basic implementation - filters can be expanded
    return await db.select().from(reports).orderBy(desc(reports.createdAt));
  }

  async getStats(city?: string): Promise<{
    total: number;
    distribution: { rojo: number; amarillo: number; verde: number };
    byDimension: Record<string, { rojo: number; amarillo: number; verde: number; n: number }>;
  }> {
    // In a real app, do aggregation in SQL. For now, fetch and aggregate in memory to keep it simple with JSONB
    const allReports = await db.select().from(reports);
    const filtered = city ? allReports.filter(r => r.city === city) : allReports;

    const stats = {
      total: filtered.length,
      distribution: { rojo: 0, amarillo: 0, verde: 0 },
      byDimension: {} as Record<string, { rojo: number; amarillo: number; verde: number; n: number }>
    };

    // Initialize dimensions (hardcoded list from instrument)
    const dimensions = ["salud", "educacion", "trabajo", "vivienda", "prevision", "cultura"];
    dimensions.forEach(d => {
      stats.byDimension[d] = { rojo: 0, amarillo: 0, verde: 0, n: 0 };
    });

    for (const r of filtered) {
      const answers = r.answers as Record<string, string>;
      let rCount = 0, aCount = 0, vCount = 0, nCount = 0;

      // Calculate per-report overall status (simplified logic from HTML)
      Object.entries(answers).forEach(([key, val]) => {
        const dim = key.split('_')[0]; // assuming ID format 'salud_01'
        
        if (stats.byDimension[dim]) {
          stats.byDimension[dim].n++;
          if (val === 'rojo') stats.byDimension[dim].rojo++;
          else if (val === 'amarillo') stats.byDimension[dim].amarillo++;
          else if (val === 'verde') stats.byDimension[dim].verde++;
        }

        nCount++;
        if (val === 'rojo') rCount++;
        else if (val === 'amarillo') aCount++;
        else if (val === 'verde') vCount++;
      });
      
      // Overall report color logic
      if (nCount > 0) {
        if (rCount / nCount >= 0.33) stats.distribution.rojo++;
        else if (aCount / nCount >= 0.33) stats.distribution.amarillo++;
        else stats.distribution.verde++;
      }
    }

    return stats;
  }
}

export const storage = new DatabaseStorage();
