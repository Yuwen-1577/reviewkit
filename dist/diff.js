import { execSync } from "node:child_process";
function runGit(args) {
    try {
        return execSync(`git ${args}`, { encoding: "utf-8", maxBuffer: 10 * 1024 * 1024 }).trim();
    }
    catch {
        return "";
    }
}
export function getStagedDiff() {
    const raw = runGit("diff --cached --unified=0");
    return parseDiff(raw);
}
export function getUnstagedDiff() {
    const raw = runGit("diff --unified=0");
    return parseDiff(raw);
}
export function getDiffAgainstBranch(branch) {
    const raw = runGit(`diff ${branch}...HEAD --unified=0`);
    return parseDiff(raw);
}
export function getDiffBetween(ref1, ref2) {
    const raw = runGit(`diff ${ref1}..${ref2} --unified=0`);
    return parseDiff(raw);
}
export function getLastCommitDiff() {
    const raw = runGit("diff HEAD~1..HEAD --unified=0");
    return parseDiff(raw);
}
function parseDiff(raw) {
    const hunks = [];
    const filesChanged = [];
    let totalAdditions = 0;
    let totalDeletions = 0;
    if (!raw)
        return { hunks, filesChanged, totalAdditions, totalDeletions };
    const fileBlocks = raw.split(/^diff --git /m).filter(Boolean);
    for (const block of fileBlocks) {
        const nameMatch = block.match(/^a\/(.+?) b\//);
        if (!nameMatch)
            continue;
        const file = nameMatch[1];
        filesChanged.push(file);
        const additions = [];
        const deletions = [];
        const lines = block.split("\n");
        for (const line of lines) {
            if (line.startsWith("+") && !line.startsWith("+++")) {
                additions.push(line.slice(1));
                totalAdditions++;
            }
            else if (line.startsWith("-") && !line.startsWith("---")) {
                deletions.push(line.slice(1));
                totalDeletions++;
            }
        }
        hunks.push({ file, additions, deletions });
    }
    return { hunks, filesChanged, totalAdditions, totalDeletions };
}
//# sourceMappingURL=diff.js.map