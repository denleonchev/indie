import "@supabase/functions-js/edge-runtime.d.ts";
import { Hono } from "hono";

const app = new Hono().basePath("/api");

app.get("/", (c) => c.json({ ok: true }));

Deno.serve(app.fetch);
