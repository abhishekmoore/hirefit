import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createMemoryStore } from "./memory.js";
import type { ScreenResult } from "../types.js";

const result: ScreenResult = {
  score: 61,
  summary: "Partial overlap.",
  matchedSkills: ["TypeScript"],
  missingSkills: ["Docker"],
  risks: [],
  rewrittenBullets: ["Shipped a Node.js API."],
  source: "heuristic",
};

describe("memory store", () => {
  it("inserts, lists newest first, and deletes", async () => {
    const store = createMemoryStore();
    const first = await store.insert({
      candidateName: "First",
      resumeText: "resume",
      jobText: "job",
      result,
    });
    const second = await store.insert({
      candidateName: "Second",
      resumeText: "resume",
      jobText: "job",
      result,
    });
    const listed = await store.list(10);
    assert.deepEqual(
      listed.map((row) => row.id),
      [second.id, first.id],
    );
    assert.equal((await store.get(first.id))?.candidateName, "First");
    assert.equal(await store.remove(first.id), true);
    assert.equal(await store.get(first.id), null);
    assert.equal(await store.remove(first.id), false);
  });
});
