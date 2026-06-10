export interface DiffHunk {
    file: string;
    additions: string[];
    deletions: string[];
}
export interface DiffResult {
    hunks: DiffHunk[];
    filesChanged: string[];
    totalAdditions: number;
    totalDeletions: number;
}
export declare function getStagedDiff(): DiffResult;
export declare function getUnstagedDiff(): DiffResult;
export declare function getDiffAgainstBranch(branch: string): DiffResult;
export declare function getDiffBetween(ref1: string, ref2: string): DiffResult;
export declare function getLastCommitDiff(): DiffResult;
