import { useEffect, useRef } from "react";

export function useSSE(url: string | null, onEvent: (event: string, data: any) => void) {
  const cbRef = useRef(onEvent);
  cbRef.current = onEvent;
  useEffect(() => {
    if (!url) return;
    const es = new EventSource(url);
    const handler = (e: MessageEvent) => {
      try { cbRef.current(e.type || "message", JSON.parse(e.data)); } catch { cbRef.current(e.type || "message", e.data); }
    };
    // generic + named
    es.onmessage = handler;
    const events = ["connected", "respons:created", "respons:anulir", "respons:deleted", "periode:created", "periode:updated", "temuan:created", "temuan:updated", "rtl:created"];
    const listeners: Array<{ ev: string; fn: (e: MessageEvent) => void }> = [];
    for (const ev of events) {
      const fn = (e: MessageEvent) => handler(e);
      es.addEventListener(ev, fn as any);
      listeners.push({ ev, fn });
    }
    es.onerror = () => { /* EventSource auto-reconnect */ };
    return () => {
      for (const { ev, fn } of listeners) es.removeEventListener(ev, fn as any);
      es.close();
    };
  }, [url]);
}
