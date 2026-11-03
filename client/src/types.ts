export type ResultSource = "model" | "heuristic";

export interface ScreenResult {
  score: number;
  summary: string;
  matchedSkills: string[];
  missingSkills: string[];
  risks: string[];
  rewrittenBullets: string[];
  source: ResultSource;
  model?: string;
}

export interface ScreenRecord {
  id: string;
  candidateName: string;
  resumeText: string;
  jobText: string;
  result: ScreenResult;
  createdAt: string;
}

export interface HealthInfo {
  ok: true;
  store: "memory" | "mongo";
  ai: "model" | "heuristic";
  model: string | null;
}
