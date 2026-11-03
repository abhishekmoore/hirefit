import { z } from "zod";

export const modelResultSchema = z.object({
  score: z.number().min(0).max(100),
  summary: z.string().trim().min(1).max(700),
  matchedSkills: z.array(z.string().trim().min(1).max(80)).max(12),
  missingSkills: z.array(z.string().trim().min(1).max(80)).max(12),
  risks: z.array(z.string().trim().min(1).max(280)).max(6),
  rewrittenBullets: z.array(z.string().trim().min(1).max(320)).max(4),
});

export type ModelResult = z.infer<typeof modelResultSchema>;

export const screenRequestSchema = z.object({
  resumeText: z.string().trim().min(80).max(20000),
  jobText: z.string().trim().min(80).max(20000),
  candidateName: z.string().trim().max(120).optional(),
});
