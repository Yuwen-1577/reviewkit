import chalk from "chalk";
import type { AnalysisResult, Finding } from "./analyze.js";

const SEVERITY_ICONS: Record<string, string> = {
  critical: "✖",
  warning: "▲",
  info: "●",
};

const SEVERITY_COLORS: Record<string, typeof chalk> = {
  critical: chalk.red.bold,
  warning: chalk.yellow,
  info: chalk.cyan,
};

function formatFinding(f: Finding): string {
  const icon = SEVERITY_ICONS[f.severity] ?? "?";
  const color = SEVERITY_COLORS[f.severity] ?? chalk.white;
  const loc = f.line ? `${f.file}:${f.line}` : f.file;
  return `  ${color(icon)} ${chalk.gray(loc)} ${f.message} ${chalk.dim(`[${f.rule}]`)}`;
}

function riskBar(score: number): string {
  const filled = Math.round(score / 5);
  const empty = 20 - filled;
  const color = score >= 70 ? chalk.red : score >= 40 ? chalk.yellow : chalk.green;
  return color("█".repeat(filled)) + chalk.dim("░".repeat(empty));
}

export function printReport(result: AnalysisResult): void {
  console.log();
  console.log(chalk.bold.underline("ReviewKit — Code Review Report"));
  console.log();

  // Summary
  console.log(chalk.bold("  Summary:  ") + result.summary);
  console.log();

  // Risk score
  const score = result.stats.riskScore;
  console.log(chalk.bold("  Risk:     ") + riskBar(score) + ` ${score}/100`);
  console.log();

  // Stats
  console.log(chalk.bold("  Stats:"));
  console.log(
    `    Files: ${chalk.white(String(result.stats.filesChanged))}  ` +
      `+${chalk.green(String(result.stats.additions))}  ` +
      `-${chalk.red(String(result.stats.deletions))}`
  );

  const langs = Object.entries(result.stats.languages)
    .map(([lang, count]) => `${lang}(${count})`)
    .join(", ");
  if (langs) {
    console.log(`    Languages: ${chalk.gray(langs)}`);
  }
  console.log();

  // Findings
  if (result.findings.length === 0) {
    console.log(chalk.green("  ✓ No issues found"));
  } else {
    console.log(chalk.bold(`  Findings (${result.findings.length}):`));
    console.log();
    for (const f of result.findings) {
      console.log(formatFinding(f));
    }
  }
  console.log();
}

export function printJsonReport(result: AnalysisResult): void {
  console.log(JSON.stringify(result, null, 2));
}
