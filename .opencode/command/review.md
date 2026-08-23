---
description: Review a pull request or branch with the design-system-reviewer agent.
agent: design-system-reviewer
---

Review the following pull request or branch: $ARGUMENTS

Steps:
1. If a PR number/URL was given, load it with `gh pr view` and `gh pr diff`. If a branch name was given, diff it against `main` (`git fetch origin && git diff origin/main...<branch>`).
2. Read every changed file in full.
3. Apply the full review checklist from your instructions (token pipeline, component conventions, Radix usage, a11y, stories, React correctness, hygiene).
4. Run the applicable verification commands on changed files.
5. Output the review report in the required format (verdict + findings with severities and file:line references).
