#!/usr/bin/env node
import { Command } from "commander";
import chalk from "chalk";
import { getStagedDiff, getUnstagedDiff, getDiffAgainstBranch, getDiffBetween, getLastCommitDiff } from "./diff.js";
import { analyzeDiff } from "./analyze.js";
import { printReport, printJsonReport } from "./report.js";

const program = new Command();

program
  .name("reviewkit")
  .description("AI-powered code review from the command line")
  .version("0.1.0");

program
  .command("review", { isDefault: true })
  .description("Review staged changes (default: staged diff)")
  .option("--all, --unstaged", "Review all unstaged changes instead")
  .option("--branch <name>", "Review changes against a branch")
  .option("--commit", "Review the last commit")
  .option("--from <ref> --to <ref>", "Review diff between two refs")
  .option("--json", "Output as JSON")
  .action((opts: { unstaged?: boolean; branch?: string; commit?: boolean; from?: string; to?: string; json?: boolean }) => {
    let diff;

    if (opts.from && opts.to) {
      console.log(chalk.gray(`  Comparing ${opts.from}..${opts.to}\n`));
      diff = getDiffBetween(opts.from, opts.to);
    } else if (opts.branch) {
      console.log(chalk.gray(`  Comparing against branch: ${opts.branch}\n`));
      diff = getDiffAgainstBranch(opts.branch);
    } else if (opts.commit) {
      console.log(chalk.gray("  Reviewing last commit\n"));
      diff = getLastCommitDiff();
    } else if (opts.unstaged) {
      console.log(chalk.gray("  Reviewing unstaged changes\n"));
      diff = getUnstagedDiff();
    } else {
      console.log(chalk.gray("  Reviewing staged changes (use --all for unstaged)\n"));
      diff = getStagedDiff();
    }

    if (diff.filesChanged.length === 0) {
      console.log(chalk.yellow("  No changes found."));
      return;
    }

    const result = analyzeDiff(diff);

    if (opts.json) {
      printJsonReport(result);
    } else {
      printReport(result);
    }

    // Exit with non-zero if critical issues found
    const hasCritical = result.findings.some((f) => f.severity === "critical");
    if (hasCritical) {
      process.exit(1);
    }
  });

program
  .command("stats")
  .description("Show diff statistics only")
  .option("--branch <name>", "Stats for changes against a branch")
  .option("--commit", "Stats for the last commit")
  .action((opts: { branch?: string; commit?: boolean }) => {
    let diff;

    if (opts.branch) {
      diff = getDiffAgainstBranch(opts.branch);
    } else if (opts.commit) {
      diff = getLastCommitDiff();
    } else {
      diff = getStagedDiff();
    }

    if (diff.filesChanged.length === 0) {
      console.log(chalk.yellow("  No changes found."));
      return;
    }

    const result = analyzeDiff(diff);
    const s = result.stats;

    console.log();
    console.log(chalk.bold.underline("ReviewKit — Stats"));
    console.log();
    console.log(`  Files changed:  ${s.filesChanged}`);
    console.log(`  Lines added:    ${chalk.green("+" + s.additions)}`);
    console.log(`  Lines removed:  ${chalk.red("-" + s.deletions)}`);
    console.log(`  Net change:     ${s.additions - s.deletions}`);
    console.log(`  Risk score:     ${s.riskScore}/100`);
    console.log();

    console.log(chalk.bold("  Files:"));
    for (const file of diff.filesChanged) {
      console.log(`    ${file}`);
    }
    console.log();
  });

program
  .command("changelog")
  .description("Generate a changelog entry from diff")
  .option("--branch <name>", "Changes against a branch")
  .option("--commit", "From the last commit")
  .action((opts: { branch?: string; commit?: boolean }) => {
    let diff;

    if (opts.branch) {
      diff = getDiffAgainstBranch(opts.branch);
    } else if (opts.commit) {
      diff = getLastCommitDiff();
    } else {
      diff = getStagedDiff();
    }

    if (diff.filesChanged.length === 0) {
      console.log(chalk.yellow("  No changes found."));
      return;
    }

    console.log();
    console.log(chalk.bold.underline("ReviewKit — Changelog Draft"));
    console.log();

    // Group files by type of change
    const added = diff.hunks.filter((h) => h.deletions.length === 0 && h.additions.length > 0);
    const modified = diff.hunks.filter((h) => h.deletions.length > 0 && h.additions.length > 0);
    const removed = diff.hunks.filter((h) => h.additions.length === 0 && h.deletions.length > 0);

    if (added.length > 0) {
      console.log(chalk.bold("  Added:"));
      for (const h of added) {
        console.log(`    - ${h.file}`);
      }
    }

    if (modified.length > 0) {
      console.log(chalk.bold("  Changed:"));
      for (const h of modified) {
        console.log(`    - ${h.file} (+${h.additions.length} -${h.deletions.length})`);
      }
    }

    if (removed.length > 0) {
      console.log(chalk.bold("  Removed:"));
      for (const h of removed) {
        console.log(`    - ${h.file}`);
      }
    }

    console.log();
  });

program.parse();
