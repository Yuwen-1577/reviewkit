# reviewkit

[![npm version](https://img.shields.io/npm/v/@yuwen_1577/reviewkit)](https://www.npmjs.com/package/@yuwen_1577/reviewkit)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/node-%3E%3D18-green)](https://nodejs.org)

[中文](./README_CN.md)

Catch security issues, code smells, and risky changes before they reach production. Runs 100% locally, no API key needed.

```bash
npx @yuwen_1577/reviewkit
```

## Demo

```
$ git add dangerous-file.ts && npx @yuwen_1577/reviewkit

ReviewKit — Code Review Report

  Summary:  1 file(s) changed, +36 -0. 3 critical issue(s) found

  Risk:     ████████████████████ 100/100

  Findings (7):

  ✖ config.ts     Possible hardcoded secret or credential    [hardcoded-secret]
  ✖ db.ts         SQL injection via string concatenation     [sql-injection]
  ✖ handler.ts    Dynamic code execution detected            [dangerous-exec]
  ▲ utils.ts      Empty catch block                          [empty-catch]
  ▲ main.ts       Recursive file deletion                    [dangerous-delete]
  ● app.ts        TODO/FIXME comment found                   [todo-comment]
  ● lib.ts        Console output left in code                [console-log]
```

## What it detects

| Severity | Rules |
|----------|-------|
| Critical | Hardcoded secrets, SQL injection, dangerous eval/exec |
| Warning  | XSS (innerHTML), insecure protocols (HTTP), empty catch blocks, mass deletions, dangerous file ops |
| Info     | Console logs, TODO/FIXME, lint suppressions, large change blocks |

## Usage

```bash
# Review staged changes (default)
reviewkit

# Review unstaged changes
reviewkit review --all

# Compare against a branch
reviewkit review --branch main

# Review last commit
reviewkit review --commit

# JSON output (for CI/CD)
reviewkit review --json

# Stats only
reviewkit stats

# Generate changelog draft
reviewkit changelog
```

## Install

```bash
npm install -g @yuwen_1577/reviewkit
```

Or run without installing:

```bash
npx @yuwen_1577/reviewkit
```

## CI/CD Integration

The CLI exits with code 1 when critical issues are found, so it works as a CI gate out of the box.

```yaml
# GitHub Actions
- name: Code Review
  run: npx @yuwen_1577/reviewkit review --commit --json
```

## How it works

reviewkit parses `git diff` output and applies pattern-based rules to detect common security and code quality issues. No data leaves your machine. No API key required.

## Roadmap

- [ ] AI-powered deep review (Claude / OpenAI integration)
- [ ] More detection rules (dependency vulns, complexity analysis)
- [ ] GitHub Actions integration with PR comments
- [ ] VS Code extension

## License

MIT
