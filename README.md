# reviewkit

AI-powered code review from the command line. Analyzes git diffs for security issues, code smells, and risk — no API key required.

```
npx reviewkit
```

## What it detects

| Severity | Examples |
|----------|---------|
| Critical | Hardcoded secrets, SQL injection, dangerous eval/exec |
| Warning  | XSS vectors, insecure protocols, empty catch blocks, mass deletions |
| Info     | Console logs, TODO/FIXME comments, lint suppressions |

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
npm install -g reviewkit
```

Or run without installing:

```bash
npx reviewkit
```

## CI/CD Integration

```yaml
# GitHub Actions example
- name: Code Review
  run: npx reviewkit review --commit --json
```

The CLI exits with code 1 when critical issues are found, so it works as a CI gate out of the box.

## How it works

reviewkit runs 100% locally. It parses `git diff` output and applies pattern-based rules to detect common security and code quality issues. No data leaves your machine.

## License

MIT
