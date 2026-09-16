# Placement Path

A private daily study workspace for Java, DSA and placement preparation.

## Sharing with friends

See [GitHub sign-in setup](docs/GITHUB-SIGNIN-SETUP.md) for hosting and configuration.
Each student signs in with their own GitHub account, keeps separate study progress,
streaks, code drafts and can automatically contribute accepted solutions to their
own repository (`Placement_path`).
Authentication is exclusively powered by GitHub OAuth with `PLACEMENT_AUTH_MODE=github`.

The redesigned blue-and-white workspace uses top navigation, a four-column daily checklist board, a persistent focus timer, a searchable lesson directory, a dedicated Coding navigation section, and a project interview studio. The roadmap pairs phase navigation with a focused lesson list, and the lesson reader separates concepts, worked examples, and interview practice into tabs. Each topic displays a direct GeeksforGeeks link.

The dashboard opens with today's topic, checklist progress, study streak, coding results, a 7/28-day activity chart, recent revision notes, roadmap mastery and project talking-point progress. Its totals come from saved work; completed checklist tasks are never presented as measured study time. Empty queued sessions and future dates do not inflate activity totals.

The Coding page exposes 590 Java/SQL exercises across 59 topics through a grouped topic picker, with the problem, input/output formats, constraints, editor, samples, custom input, full submissions, and step-by-step debugging feedback. The dashboard and each Java/DSA guide have direct editor shortcuts. Daily-task attempts save with the daily session; extra practice saves per-topic drafts, explanations, hints, and judge summaries through an optional `practice` field in the existing D1 JSON record. This preserves older saved state without a schema migration. Coding totals include these practice records; checklist charts still measure daily checklist work.

The app provides a 60-minute checklist, four focus timers, a six-phase learning roadmap, coding drafts with gradual hints, a daily reflection, weekly progress and project interview checklists for FlockSense and FlowPulse. Topic previews are separate from the current session, so browsing a lesson does not change the study plan. Choosing a different next topic preserves existing checklist work, coding steps, written approaches, and reflections.

The searchable topic library covers all 41 Java/DSA lessons and 18 placement references, including all eight aptitude areas, Resume, GitHub, FlockSense, and FlowPulse. Every entry links to a GeeksforGeeks reference and includes brief teaching notes and an example. Named project guides use explicitly labeled general interview references and original preparation frameworks; hypothetical scenarios do not claim actual implementation or results. Java/DSA lessons also include subtopics, a Java concept snippet, complexity notes and interview questions. Worked example walkthroughs are revealed on demand; practice problems still require an attempt and explanation before coaching. Source links were reviewed on September 10, 2026. Source content lives in `lib/topic-resources.ts` and `lib/placement-resources.ts` and is independent of saved user data.

Each of the 59 topics now has 10 distinct, original questions: 3 Easy, 4 Medium, and 3 Hard (590 total). Direct “10 questions” buttons open practice inside the topic reader. Difficulty filters, multiple-choice checking, and a separate collapsed answer key support attempts before review. Every set mixes multiple-choice, short-answer, case-study, and discussion formats. Intermediate and advanced answers provide exemplar reasoning, not automatic grading of written responses. These practice selections are session-local and do not change saved coding acceptance or mastery. Question content lives in `lib/question-banks/` and is loaded on demand. Daily guidance recommends 2–3 questions within existing revision time rather than adding to the one-hour routine.

Responsive layouts, checkbox feedback, animated progress rings, activity charts and card transitions respect reduced-motion preferences. UI changes do not change the D1 schema or authentication.

Progress is saved in D1 and scoped to the signed-in GitHub user. Optimistic version checks prevent stale tabs from overwriting newer progress. No external AI API is used: the coach button copies the current topic, revision needs and coding attempt for review with your AI coach. The coding workspace runs Java through the public Paiza.IO API. Each of the 41 Java/DSA tasks has an exact input/output contract, constraints, two samples, and additional boundary cases (219 cases total). Users can run samples, submit all provided cases, or run custom stdin. Compiler diagnostics, runtime errors, timeouts, and expected-versus-actual output are displayed separately. A successful full submission updates the solved count and auto-commits the accepted code to the user's connected GitHub repository. Previously saved judge results identify the source by SHA-256, and the interface identifies stale results after edits. Output judging checks correctness for the supplied cases; algorithm choice, code quality, and complexity explanations still need review.

Code and test input are sent to Paiza.IO only after explicit consent through the permission checkbox or the Allow & run dialog. The API also requires the consent flag. The authenticated server fixes the provider and Java language, validates task/case IDs and source sizes, limits response sizes and waiting time, and never forwards identity headers or cookies. Service unavailability produces an explicit retry state. Existing progress remains compatible through optional judge/complexity fields; the database schema is unchanged.

## Development

Use the Sites building and hosting workflows for setup, build, preview when requested and publication. This project uses the managed Linux execution profile and the standard Vinext starter.

- `npm run build` creates the Worker and client assets.
- `npm run db:generate` creates a new Drizzle migration after schema changes.
- `node node_modules/typescript/bin/tsc --noEmit` checks TypeScript.
- `node scripts/verify-questions.mjs` validates topic coverage, difficulty distribution, distinct prompts, formats, and answer-key integrity for all 590 questions.
- `node scripts/verify-coding.mjs` checks task coverage, output comparison and progress compatibility. Add `--java-local` to execute locally using the installed JDK, or `--live` only after permission to send the test programs and inputs to Paiza.IO. These modes check Java reference solutions for all 219 fixtures plus representative successful, wrong-answer, compilation-error, runtime-error and timeout programs.

Keep applied migrations immutable. Do not place secrets in source. The `DB` binding and stable Site identity are declared in `.openai/hosting.json`.
