import type { DiffResult } from "./diff.js";
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
export declare function analyzeDiff(diff: DiffResult): AnalysisResult;
