import { describe, it, expect } from "vitest";
import { parseDiff, analyzeDiff } from "../src/analyze.js";

// We can't easily test the git-dependent parts without a real repo,
// so we test the analysis logic directly with synthetic diffs.

describe("analyzeDiff", () => {
  it("detects hardcoded secrets", () => {
    const diff = {
      hunks: [
        {
          file: "config.ts",
          additions: ['const API_KEY = "sk-1234567890abcdef"'],
          deletions: [],
        },
      ],
      filesChanged: ["config.ts"],
      totalAdditions: 1,
      totalDeletions: 0,
    };

    const result = analyzeDiff(diff);
    expect(result.findings.length).toBeGreaterThan(0);
    expect(result.findings.some((f) => f.rule === "hardcoded-secret")).toBe(true);
  });

  it("detects SQL injection", () => {
    const diff = {
      hunks: [
        {
          file: "db.ts",
          additions: ['const q = "SELECT * FROM users WHERE id = " + req.params.id'],
          deletions: [],
        },
      ],
      filesChanged: ["db.ts"],
      totalAdditions: 1,
      totalDeletions: 0,
    };

    const result = analyzeDiff(diff);
    expect(result.findings.some((f) => f.rule === "sql-injection")).toBe(true);
  });

  it("detects dangerous eval", () => {
    const diff = {
      hunks: [
        {
          file: "handler.ts",
          additions: ["const result = eval(userInput);"],
          deletions: [],
        },
      ],
      filesChanged: ["handler.ts"],
      totalAdditions: 1,
      totalDeletions: 0,
    };

    const result = analyzeDiff(diff);
    expect(result.findings.some((f) => f.rule === "dangerous-exec")).toBe(true);
  });

  it("reports clean diffs with low risk", () => {
    const diff = {
      hunks: [
        {
          file: "utils.ts",
          additions: ["export function add(a: number, b: number) { return a + b; }"],
          deletions: [],
        },
      ],
      filesChanged: ["utils.ts"],
      totalAdditions: 1,
      totalDeletions: 0,
    };

    const result = analyzeDiff(diff);
    expect(result.stats.riskScore).toBeLessThan(20);
    expect(result.findings.length).toBe(0);
  });

  it("calculates risk score correctly", () => {
    const diff = {
      hunks: [
        {
          file: "bad.ts",
          additions: [
            'const secret = "abc123"',
            'eval("code")',
            'const q = "SELECT * FROM t WHERE x = " + y',
          ],
          deletions: [],
        },
      ],
      filesChanged: ["bad.ts"],
      totalAdditions: 3,
      totalDeletions: 0,
    };

    const result = analyzeDiff(diff);
    expect(result.stats.riskScore).toBeGreaterThanOrEqual(50);
  });
});
