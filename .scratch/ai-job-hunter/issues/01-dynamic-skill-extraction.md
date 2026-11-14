# Issue 01: Dynamic Candidate Skill Incorporation in Extraction

Status: resolved
Type: task

## Description

`extractSkillsFromText` in `frontend/src/lib/job-hunter.ts` currently references a static list of 41 technology keywords. Candidates with specialized, modern, or niche tech stacks (e.g. Svelte, Rust, Snowflake, Terraform, Flutter) may not have their skills matched if their skills are omitted from the hardcoded list.

## Proposed Change

Merge `profile.skills` dynamically into the search vocabulary during evaluation:
```typescript
const allSkillsToSearch = Array.from(new Set([...COMMON_TECH_SKILLS, ...profile.skills]));
```
Ensure word boundaries and escaped punctuation (e.g. `C++`, `Node.js`, `.NET`, `C#`) are cleanly matched.

## Answer

Implemented in `frontend/src/lib/job-hunter.ts`. `extractSkillsFromText` now accepts `customSkills: string[] = []`, merging candidate profile competencies dynamically, with safe regex escaping (`escapeRegex`) supporting punctuation-heavy languages (`C++`, `.NET`, `C#`, `Node.js`). Verified in production build.
