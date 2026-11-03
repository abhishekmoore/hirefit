import OpenAI from "openai";
import { heuristicScreen } from "./heuristic.js";
import { extractJson } from "./parse.js";
import { modelResultSchema } from "./schema.js";
import type { ScreenResult } from "../types.js";

const SYSTEM = `You compare a resume to a job description for a hiring screen.
Return JSON only with keys: score (number 0-100), summary (string, two sentences), matchedSkills (string[]), missingSkills (string[]), risks (string[]), rewrittenBullets (string[], max 3).
Rules:
- Count a skill as matched only when the resume text supports it.
- Never invent employers, degrees, dates, metrics, or tools.
- rewrittenBullets rephrase evidence that is already in the resume so it faces this role. If you cannot support a bullet, leave the array shorter.
- risks are specific gaps, not personality comments.
- If either text is too thin to judge, lower the score and say that in the summary.`;

export async function screenPair(input: {
  resumeText: string;
  jobText: string;
  apiKey: string;
  baseURL: string;
  model: string;
}): Promise<ScreenResult> {
  if (!input.apiKey) {
    return heuristicScreen(input.resumeText, input.jobText);
  }
  try {
    return await fromModel(input);
  } catch (error) {
    const fallback = heuristicScreen(input.resumeText, input.jobText);
    const message = error instanceof Error ? error.message : "model request failed";
    return {
      ...fallback,
      risks: [`Model request failed (${clip(message)}). Showing the offline overlap check instead.`, ...fallback.risks].slice(0, 6),
    };
  }
}

async function fromModel(input: {
  resumeText: string;
  jobText: string;
  apiKey: string;
  baseURL: string;
  model: string;
}): Promise<ScreenResult> {
  const client = new OpenAI({
    apiKey: input.apiKey,
    baseURL: input.baseURL || undefined,
  });
  const user = `RESUME:\n${input.resumeText}\n\nJOB DESCRIPTION:\n${input.jobText}`;
  let raw = await complete(client, input.model, user, true);
  let parsed = readModel(raw);
  if (!parsed.ok) {
    raw = await complete(
      client,
      input.model,
      `${user}\n\nThe previous reply was invalid (${parsed.reason}). Reply with one JSON object only.`,
      false,
    );
    parsed = readModel(raw);
  }
  if (!parsed.ok) {
    throw new Error(parsed.reason);
  }
  return {
    ...parsed.value,
    score: Math.round(parsed.value.score),
    source: "model",
    model: input.model,
  };
}

function readModel(raw: string): { ok: true; value: ReturnType<typeof modelResultSchema.parse> } | { ok: false; reason: string } {
  try {
    const json = extractJson(raw);
    const value = modelResultSchema.parse(json);
    return { ok: true, value };
  } catch (error) {
    return { ok: false, reason: error instanceof Error ? clip(error.message) : "invalid model JSON" };
  }
}

async function complete(client: OpenAI, model: string, user: string, jsonMode: boolean): Promise<string> {
  try {
    const response = await client.chat.completions.create({
      model,
      temperature: 0.2,
      messages: [
        { role: "system", content: SYSTEM },
        { role: "user", content: user },
      ],
      ...(jsonMode ? { response_format: { type: "json_object" as const } } : {}),
    });
    return response.choices[0]?.message?.content ?? "";
  } catch (error) {
    if (!jsonMode) throw error;
    const response = await client.chat.completions.create({
      model,
      temperature: 0.2,
      messages: [
        { role: "system", content: SYSTEM },
        { role: "user", content: user },
      ],
    });
    return response.choices[0]?.message?.content ?? "";
  }
}

function clip(message: string): string {
  return message.replace(/\s+/g, " ").slice(0, 180);
}
