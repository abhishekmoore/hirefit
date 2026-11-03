import type { ScreenResult } from "../types.js";

const SKILLS = [
  "javascript",
  "typescript",
  "react",
  "node.js",
  "nodejs",
  "express",
  "mongodb",
  "mongoose",
  "postgres",
  "postgresql",
  "sql",
  "graphql",
  "rest",
  "next.js",
  "docker",
  "kubernetes",
  "aws",
  "git",
  "jest",
  "playwright",
  "python",
  "redis",
  "tailwind",
  "html",
  "css",
  "oauth",
  "jwt",
  "ci/cd",
  "system design",
  "testing",
];

function hasSkill(text: string, skill: string): boolean {
  const escaped = skill.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(^|[^a-z0-9])${escaped}([^a-z0-9]|$)`, "i").test(text);
}

function tidyBullet(line: string): string {
  const clean = line.replace(/\s+/g, " ").replace(/[.]+$/, "");
  const headed = clean.charAt(0).toUpperCase() + clean.slice(1);
  return `${headed}.`;
}

export function heuristicScreen(resumeText: string, jobText: string): ScreenResult {
  const jobSkills = SKILLS.filter((skill) => hasSkill(jobText, skill));
  const pool = jobSkills.length > 0 ? jobSkills : SKILLS;
  const matched = pool.filter((skill) => hasSkill(resumeText, skill) && hasSkill(jobText, skill));
  const missing = pool.filter((skill) => hasSkill(jobText, skill) && !hasSkill(resumeText, skill));
  const unique = (skills: string[]) => [...new Set(skills.map((skill) => (skill === "nodejs" ? "node.js" : skill)))];
  const matchedSkills = unique(matched);
  const missingSkills = unique(missing);
  const denom = matchedSkills.length + missingSkills.length;
  const score = denom === 0 ? 40 : Math.round((matchedSkills.length / denom) * 100);

  const risks: string[] = [];
  const words = resumeText.trim().split(/\s+/).filter(Boolean).length;
  if (words < 80) risks.push("The resume is short, so this overlap score is a weak signal.");
  if (!/\d/.test(resumeText)) risks.push("No numbers or measurable outcomes showed up in the resume.");
  if (missingSkills.length >= 4) risks.push("Several skills named in the role are absent from the resume.");
  if (denom === 0) risks.push("No shared skill vocabulary was found. Treat the score as a placeholder.");

  const rewrittenBullets = resumeText
    .split(/\n+/)
    .map((line) => line.replace(/^[\s\-*•\d.)]+/, "").trim())
    .filter((line) => line.length > 28)
    .slice(0, 3)
    .map(tidyBullet);

  const summary =
    denom === 0
      ? "Offline check only. The two texts did not share a known skill, so a model should read them before you trust a score."
      : `Offline overlap check: ${matchedSkills.length} shared skill${matchedSkills.length === 1 ? "" : "s"}, ${missingSkills.length} named in the role but not the resume. This does not judge seniority.`;

  return {
    score,
    summary,
    matchedSkills: label(matchedSkills),
    missingSkills: label(missingSkills),
    risks,
    rewrittenBullets,
    source: "heuristic",
  };
}

function label(skills: string[]): string[] {
  return skills.map((skill) =>
    skill
      .split(" ")
      .map((part) => (part === "node.js" || part === "ci/cd" ? part : part.charAt(0).toUpperCase() + part.slice(1)))
      .join(" "),
  );
}
