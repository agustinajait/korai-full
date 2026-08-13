import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import { verifyJoinToken, JoinTokenError } from "./joinToken";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  // Magic link OportunAI → Korai. El front (client/src/pages/join.tsx,
  // ruta /join/:token) llama acá con el token de la URL para validarlo
  // antes de armar el contexto local del usuario. Korai no usa sesión de
  // servidor ni Supabase Auth: si el token es válido devolvemos el payload
  // y el cliente lo guarda en localStorage como hace con el resto del flujo.
  app.post("/api/join/verify", (req, res) => {
    const { token } = req.body ?? {};

    if (!token || typeof token !== "string") {
      return res.status(400).json({ ok: false, error: "token_requerido" });
    }

    try {
      const payload = verifyJoinToken(token);
      return res.json({ ok: true, data: payload });
    } catch (err) {
      if (err instanceof JoinTokenError) {
        if (err.code === "config") {
          console.error("[join/verify] falta configurar KORAI_JOIN_SECRET");
          return res.status(500).json({ ok: false, error: "config" });
        }
        const status = err.code === "expired" ? 410 : 401;
        return res.status(status).json({ ok: false, error: err.code });
      }
      console.error("[join/verify] error inesperado:", err);
      return res.status(500).json({ ok: false, error: "error_interno" });
    }
  });

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
