import "dotenv/config";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";

import { authRouter } from "./routes/auth.js";
import { periodeRouter } from "./routes/periode.js";
import { angketRouter } from "./routes/angket.js";
import { responsRouter } from "./routes/respons.js";
import { rekapRouter } from "./routes/rekap.js";
import { temuanRouter } from "./routes/temuan.js";
import { beritaAcaraRouter } from "./routes/beritaAcara.js";
import { masterRouter } from "./routes/master.js";
import { exportRouter } from "./routes/exports.js";
import { usersRouter } from "./routes/users.js";
import { dashboardRouter } from "./routes/dashboard.js";
import { sseHandler } from "./utils/sse.js";

const app = express();
const PORT = parseInt(process.env.PORT ?? "4100", 10);
const CLIENT_URL = process.env.CLIENT_URL ?? "http://localhost:5273";

app.set("trust proxy", 1);
app.use(cors({ origin: [CLIENT_URL, "http://localhost:5273", "http://localhost:5173", "http://localhost:3000"], credentials: true }));
app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());

// Health
app.get("/api/health", (_req, res) => res.json({ ok: true, time: new Date().toISOString() }));
// SSE — harus sebelum json parser limit? sudah ok
app.get("/api/events", sseHandler);

// Rate limit untuk submit publik
const submitLimiter = rateLimit({ windowMs: 60_000, max: 20, standardHeaders: true, legacyHeaders: false });
app.use("/api/respons", (req, _res, next) => {
  if (req.method === "POST" && req.path === "/") return submitLimiter(req as any, _res as any, next);
  next();
});

app.use("/api/auth", authRouter);
app.use("/api/periode", periodeRouter);
app.use("/api/angket", angketRouter);
app.use("/api/respons", responsRouter);
app.use("/api/rekap", rekapRouter);
app.use("/api/temuan", temuanRouter);
app.use("/api/berita-acara", beritaAcaraRouter);
app.use("/api/users", usersRouter);
app.use("/api/master", masterRouter);
app.use("/api/exports", exportRouter);
app.use("/api/dashboard", dashboardRouter);

// 404
app.use((req, res) => res.status(404).json({ error: `Not found: ${req.method} ${req.path}` }));

// Error handler
app.use((err: any, _req: any, res: any, _next: any) => {
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
});

app.listen(PORT, () => {
  console.log(`[server] listening on http://localhost:${PORT}  (CLIENT_URL=${CLIENT_URL})`);
});
