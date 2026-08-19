import type { Response } from "express";
import { EventEmitter } from "events";

type SSEClient = { id: string; res: Response; periodeId?: string };

class SSEHub extends EventEmitter {
  clients = new Set<SSEClient>();

  add(c: SSEClient) { this.clients.add(c); }
  remove(c: SSEClient) { this.clients.delete(c); }

  broadcast(event: string, data: unknown, periodeId?: string) {
    const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
    for (const c of this.clients) {
      if (periodeId && c.periodeId && c.periodeId !== periodeId) continue;
      try { c.res.write(payload); } catch {}
    }
  }
}

export const sseHub = new SSEHub();

export function sseHandler(req: import("express").Request, res: import("express").Response) {
  const periodeId = typeof req.query.periodeId === "string" ? req.query.periodeId : undefined;
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
    "X-Accel-Buffering": "no",
  });
  res.write(`event: connected\ndata: ${JSON.stringify({ ok: true, periodeId: periodeId ?? null })}\n\n`);
  // heartbeat tiap 25s agar proxy/proxy tidak timeout
  const hb = setInterval(() => { try { res.write(`: heartbeat ${Date.now()}\n\n`); } catch {} }, 25000);

  const client: SSEClient = { id: `${Date.now()}-${Math.random().toString(36).slice(2)}`, res, periodeId };
  sseHub.add(client);

  req.on("close", () => {
    clearInterval(hb);
    sseHub.remove(client);
    try { res.end(); } catch {}
  });
}
