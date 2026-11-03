import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { heuristicScreen } from "./heuristic.js";
import { extractJson } from "./parse.js";
import { modelResultSchema } from "./schema.js";

const resume = `Aisha Raman
Backend engineer. Built a TypeScript and Node.js billing API with Express and MongoDB.
Cut invoice generation from 40 minutes to 3 minutes for 1200 monthly accounts.
Wrote Jest tests around the payment webhook and shipped with Git and CI/CD.
The admin UI is owned by another teammate. I read it. I do not ship it.`;

const job = `We need a TypeScript engineer who has shipped Node.js services with Express and MongoDB.
You will also own a React dashboard, Docker images, and AWS deploys.
Testing with Jest is expected. Kubernetes is a plus.`;

describe("heuristicScreen", () => {
  it("matches skills that appear in both texts and lists role skills the resume lacks", () => {
    const result = heuristicScreen(resume, job);
    assert.equal(result.source, "heuristic");
    assert.ok(result.matchedSkills.some((skill) => skill.toLowerCase().includes("typescript")));
    assert.ok(result.matchedSkills.some((skill) => skill.toLowerCase().includes("mongodb")));
    assert.ok(result.missingSkills.some((skill) => skill.toLowerCase() === "react"));
    assert.ok(result.missingSkills.some((skill) => skill.toLowerCase() === "docker"));
    assert.ok(result.score > 0 && result.score < 100);
    assert.equal(
      result.rewrittenBullets.some((line) => /kubernetes|docker|react/i.test(line)),
      false,
    );
  });

  it("does not invent a perfect score when nothing overlaps", () => {
    const result = heuristicScreen(
      "I bake sourdough on weekends and sell loaves at the Saturday market near the station.",
      job,
    );
    assert.ok(result.score < 80);
    assert.ok(result.missingSkills.length > 0);
  });
});

describe("extractJson", () => {
  it("reads a fenced JSON object", () => {
    const value = extractJson('```json\n{"score":72,"summary":"Solid API overlap."}\n```');
    assert.deepEqual(value, { score: 72, summary: "Solid API overlap." });
  });
});

describe("modelResultSchema", () => {
  it("rejects a score outside 0-100", () => {
    const parsed = modelResultSchema.safeParse({
      score: 140,
      summary: "Too confident.",
      matchedSkills: ["TypeScript"],
      missingSkills: [],
      risks: [],
      rewrittenBullets: [],
    });
    assert.equal(parsed.success, false);
  });
});
