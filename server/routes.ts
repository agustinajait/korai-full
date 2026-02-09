import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  app.post(api.reports.create.path, async (req, res) => {
    try {
      const input = api.reports.create.input.parse(req.body);
      const report = await storage.createReport(input);
      res.status(201).json(report);
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ message: err.errors[0].message });
      } else {
        res.status(500).json({ message: "Internal Server Error" });
      }
    }
  });

  function requireAdmin(req: any, res: any, next: any) {
    if (req.session?.isAdmin) return next();
    return res.status(401).json({ message: "No autorizado" });
  }

  app.get(api.reports.list.path, requireAdmin, async (req, res) => {
    const filters = {
      city: req.query.city as string,
      neighborhood: req.query.neighborhood as string,
      days: req.query.days ? Number(req.query.days) : undefined
    };
    const reports = await storage.getReports(filters);
    res.json(reports);
  });

  app.get(api.reports.stats.path, requireAdmin, async (req, res) => {
    const city = req.query.city as string;
    const stats = await storage.getStats(city);
    res.json(stats);
  });

  app.post("/api/admin/login", (req, res) => {
    const { password } = req.body;
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminPassword) {
      return res.status(500).json({ message: "Admin password not configured" });
    }

    if (password === adminPassword) {
      req.session.isAdmin = true;
      return req.session.save(() => {
        res.json({ ok: true });
      });
    }

    return res.status(401).json({ message: "Contraseña incorrecta" });
  });

  app.get("/api/admin/session", (req, res) => {
    res.json({ isAdmin: req.session.isAdmin === true });
  });

  app.post("/api/admin/logout", (req, res) => {
    req.session.destroy(() => {
      res.json({ ok: true });
    });
  });

  await seedDatabase();

  return httpServer;
}

async function seedDatabase() {
  const existing = await storage.getReports();
  if (existing.length > 0) return;

  console.log("Seeding database with mock reports...");
  
  const cities = ["Berazategui", "Quilmes", "Florencio Varela"];
  const dimensions = ["salud", "educacion", "trabajo", "vivienda", "prevision", "cultura"];
  
  const indicators = [
     "salud_01", "salud_02", "educacion_01", "trabajo_01", "vivienda_01"
  ];

  for (let i = 0; i < 50; i++) {
    const city = cities[Math.floor(Math.random() * cities.length)];
    const answers: Record<string, string> = {};
    
    indicators.forEach(ind => {
      const r = Math.random();
      if (r < 0.3) answers[ind] = 'rojo';
      else if (r < 0.6) answers[ind] = 'amarillo';
      else answers[ind] = 'verde';
    });

    await storage.createReport({
      city,
      neighborhood: "Centro",
      answers,
      openText: Math.random() > 0.7 ? "Comentario de prueba..." : undefined,
      demographics: { age: "30-39" }
    });
  }
  console.log("Seeding complete.");
}
