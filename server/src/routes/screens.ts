import { Router } from "express";
import { screenRequestSchema } from "../ai/schema.js";
import { screenPair } from "../ai/screen.js";
import type { AppEnv } from "../env.js";
import type { ScreenStore } from "../types.js";

export function screensRouter(store: ScreenStore, env: AppEnv): Router {
  const router = Router();

  router.get("/", async (req, res, next) => {
    try {
      const requested = Number(req.query.limit ?? 20);
      const limit = Number.isFinite(requested) ? Math.min(Math.max(requested, 1), 50) : 20;
      res.json({ screens: await store.list(limit) });
    } catch (error) {
      next(error);
    }
  });

  router.get("/:id", async (req, res, next) => {
    try {
      const screen = await store.get(req.params.id);
      if (!screen) {
        res.status(404).json({ error: "Screen not found." });
        return;
      }
      res.json({ screen });
    } catch (error) {
      next(error);
    }
  });

  router.post("/", async (req, res, next) => {
    try {
      const parsed = screenRequestSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: "Resume and job description must each be between 80 and 20,000 characters." });
        return;
      }
      const { resumeText, jobText, candidateName } = parsed.data;
      const result = await screenPair({
        resumeText,
        jobText,
        apiKey: env.openAiKey,
        baseURL: env.baseURL,
        model: env.model,
      });
      const screen = await store.insert({
        candidateName: candidateName?.trim() || "Untitled candidate",
        resumeText,
        jobText,
        result,
      });
      res.status(201).json({ screen });
    } catch (error) {
      next(error);
    }
  });

  router.delete("/:id", async (req, res, next) => {
    try {
      const removed = await store.remove(req.params.id);
      if (!removed) {
        res.status(404).json({ error: "Screen not found." });
        return;
      }
      res.status(204).end();
    } catch (error) {
      next(error);
    }
  });

  return router;
}
