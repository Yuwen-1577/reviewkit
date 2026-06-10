import type { DiffResult, DiffHunk } from "./diff.js";

export interface Finding {
  severity: "critical" | "warning" | "info";
  file: string;
  line?: number;
  rule: string;
  message: string;
}

export interface AnalysisResult {
  findings: Finding[];
  stats: {
    filesChanged: number;
    additions: number;
    deletions: number;
    riskScore: number;
    languages: Record<string, number>;
  };
  summary: string;
}

const RISK_PATTERNS: Array<{
  pattern: RegExp;
  severity: Finding["severity"];
  rule: string;
  message: string;
}> = [
  {
    pattern: /(?:password|secret|api.?key|token|credential)\s*[:=]\s*["'][^"']+["']/i,
    severity: "critical",
    rule: "hardcoded-secret",
    message: "Possible hardcoded secret or credential detected",
  },
  {
    pattern: /(?:eval|exec|system|child_process|subprocess\.call)\s*\(/,
    severity: "critical",
    rule: "dangerous-exec",
    message: "Dynamic code execution detected — potential injection risk",
  },
  {
    pattern: /(?:SELECT|INSERT|UPDATE|DELETE).*\+\s*(?:req\.|params\.|args\.|input)/i,
    severity: "critical",
    rule: "sql-injection",
    message: "Possible SQL injection via string concatenation",
  },
  {
    pattern: /innerHTML\s*=/,
    severity: "warning",
    rule: "xss-innerHTML",
    message: "Direct innerHTML assignment — potential XSS vector",
  },
  {
    pattern: /(?:http:\/\/|ftp:\/\/)\S+/,
    severity: "warning",
    rule: "insecure-protocol",
    message: "Insecure protocol (HTTP/FTP) — prefer HTTPS",
  },
  {
    pattern: /(?:console\.(?:log|debug|info|warn|error))\s*\(/,
    severity: "info",
    rule: "console-log",
    message: "Console output left in code",
  },
  {
    pattern: /(?:TODO|FIXME|HACK|XXX|TEMP)\b/,
    severity: "info",
    rule: "todo-comment",
    message: "TODO/FIXME comment found",
  },
  {
    pattern: /catch\s*\(\s*\w*\s*\)\s*\{\s*\}/,
    severity: "warning",
    rule: "empty-catch",
    message: "Empty catch block — errors are silently swallowed",
  },
  {
    pattern: /(?:rm\s+-rf|os\.remove|rmdir|shutil\.rmtree|fs\.rm)/,
    severity: "warning",
    rule: "dangerous-delete",
    message: "Recursive/dangerous file deletion",
  },
  {
    pattern: /\/\/\s*@ts-ignore|\/\/\s*noqa|\/\/\s*type:\s*ignore|\/\/\s*eslint-disable/,
    severity: "info",
    rule: "suppressed-lint",
    message: "Linting/type checking suppression comment",
  },
];

function detectLanguage(file: string): string {
  const ext = file.split(".").pop()?.toLowerCase() ?? "";
  const map: Record<string, string> = {
    ts: "TypeScript",
    tsx: "TypeScript",
    js: "JavaScript",
    jsx: "JavaScript",
    py: "Python",
    go: "Go",
    rs: "Rust",
    java: "Java",
    kt: "Kotlin",
    swift: "Swift",
    rb: "Ruby",
    php: "PHP",
    cs: "C#",
    cpp: "C++",
    c: "C",
    vue: "Vue",
    svelte: "Svelte",
    css: "CSS",
    scss: "SCSS",
    html: "HTML",
    sql: "SQL",
    sh: "Shell",
    yml: "YAML",
    yaml: "YAML",
    json: "JSON",
    toml: "TOML",
    md: "Markdown",
  };
  return map[ext] ?? ext.toUpperCase();
}

function checkLargeHunk(hunk: DiffHunk): Finding[] {
  const findings: Finding[] = [];
  const size = hunk.additions.length + hunk.deletions.length;

  if (size > 200) {
    findings.push({
      severity: "warning",
      file: hunk.file,
      rule: "large-change",
      message: `Large change block (${size} lines) — consider splitting into smaller commits`,
    });
  }

  if (hunk.additions.length > 150) {
    findings.push({
      severity: "info",
      file: hunk.file,
      rule: "large-addition",
      message: `${hunk.additions.length} lines added — high complexity risk`,
    });
  }

  return findings;
}

function checkDeletedLines(hunk: DiffHunk): Finding[] {
  const findings: Finding[] = [];

  if (hunk.deletions.length > 100 && hunk.additions.length < hunk.deletions.length * 0.1) {
    findings.push({
      severity: "warning",
      file: hunk.file,
      rule: "mass-deletion",
      message: `Mostly deletions (${hunk.deletions.length} removed, ${hunk.additions.length} added) — is this intentional?`,
    });
  }

  return findings;
}

export function analyzeDiff(diff: DiffResult): AnalysisResult {
  const findings: Finding[] = [];
  const languages: Record<string, number> = {};

  for (const file of diff.filesChanged) {
    const lang = detectLanguage(file);
    languages[lang] = (languages[lang] ?? 0) + 1;
  }

  for (const hunk of diff.hunks) {
    const allLines = [...hunk.additions, ...hunk.deletions];

    for (const line of hunk.additions) {
      for (const rule of RISK_PATTERNS) {
        if (rule.pattern.test(line)) {
          findings.push({
            severity: rule.severity,
            file: hunk.file,
            rule: rule.rule,
            message: rule.message,
          });
        }
      }
    }

    findings.push(...checkLargeHunk(hunk));
    findings.push(...checkDeletedLines(hunk));
  }

  // Deduplicate findings by file + rule
  const seen = new Set<string>();
  const deduped = findings.filter((f) => {
    const key = `${f.file}:${f.rule}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  // Sort by severity
  const order: Record<string, number> = { critical: 0, warning: 1, info: 2 };
  deduped.sort((a, b) => order[a.severity] - order[b.severity]);

  // Calculate risk score (0-100)
  const critCount = deduped.filter((f) => f.severity === "critical").length;
  const warnCount = deduped.filter((f) => f.severity === "warning").length;
  const infoCount = deduped.filter((f) => f.severity === "info").length;
  const sizePenalty = Math.min(diff.totalAdditions + diff.totalDeletions, 500) / 10;
  const riskScore = Math.min(
    100,
    critCount * 25 + warnCount * 10 + infoCount * 2 + sizePenalty
  );

  const summary = buildSummary(diff, deduped, riskScore);

  return {
    findings: deduped,
    stats: {
      filesChanged: diff.filesChanged.length,
      additions: diff.totalAdditions,
      deletions: diff.totalDeletions,
      riskScore: Math.round(riskScore),
      languages,
    },
    summary,
  };
}

function buildSummary(diff: DiffResult, findings: Finding[], riskScore: number): string {
  const parts: string[] = [];
  const crits = findings.filter((f) => f.severity === "critical").length;
  const warns = findings.filter((f) => f.severity === "warning").length;

  parts.push(
    `${diff.filesChanged.length} file(s) changed, +${diff.totalAdditions} -${diff.totalDeletions}`
  );

  if (crits > 0) {
    parts.push(`${crits} critical issue(s) found — review before merging`);
  } else if (warns > 0) {
    parts.push(`${warns} warning(s) — check recommended`);
  } else if (riskScore < 20) {
    parts.push("Looks clean — low risk");
  } else {
    parts.push("Minor issues detected");
  }

  return parts.join(". ");
}
