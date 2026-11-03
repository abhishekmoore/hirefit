import type { HealthInfo, ScreenRecord } from "./types";

async function readError(response: Response): Promise<string> {
  try {
    const body = (await response.json()) as { error?: string };
    return body.error || `Request failed (${response.status}).`;
  } catch {
    return `Request failed (${response.status}).`;
  }
}

export async function getHealth(): Promise<HealthInfo> {
  const response = await fetch("/api/health");
  if (!response.ok) throw new Error(await readError(response));
  return response.json() as Promise<HealthInfo>;
}

export async function listScreens(): Promise<ScreenRecord[]> {
  const response = await fetch("/api/screens");
  if (!response.ok) throw new Error(await readError(response));
  const body = (await response.json()) as { screens: ScreenRecord[] };
  return body.screens;
}

export async function createScreen(input: {
  candidateName: string;
  resumeText: string;
  jobText: string;
}): Promise<ScreenRecord> {
  const response = await fetch("/api/screens", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!response.ok) throw new Error(await readError(response));
  const body = (await response.json()) as { screen: ScreenRecord };
  return body.screen;
}

export async function deleteScreen(id: string): Promise<void> {
  const response = await fetch(`/api/screens/${id}`, { method: "DELETE" });
  if (!response.ok && response.status !== 204) throw new Error(await readError(response));
}
