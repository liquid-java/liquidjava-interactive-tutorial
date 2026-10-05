# LiquidJava Interactive Tutorial

This repository contains a web-based, interactive introduction to LiquidJava. The tutorial has four short examples:

1. RGB value refinements;
2. Midpoint method contracts;
3. External socket state refinements;
4. Stack ghost variables.

Learners can edit Java snippets, run LiquidJava verification in the browser, answer quick knowledge questions, and move freely between sections. The tutorial does not collect, persist, or export user data.

## Preview Locally

Build and export the shared runtime as described below, then run the local development server:

```sh
npm run dev
```

Then open `http://localhost:8000`.

## Examples

All tutorial content is in [`tutorial-data.js`](tutorial-data.js). The interface renders the lessons from that single configuration object. Reusable exercise checks are centralized in [`validation-regexes.js`](validation-regexes.js).

Each lesson contains:

- Explanatory copy and a read-only example;
- Starter and solution code;
- A Java filename and exercise-pattern hints for the coding task;
- Automatically checked multiple-choice and short-answer questions.

Add, remove, or reorder lesson objects to change the tutorial without editing `app.js` or `index.html`.

## Checker Scope

Checks run the real LiquidJava verifier locally in a browser worker. Results show diagnostic titles and messages. Exercise-pattern hints are separate from verification: valid Java with a missing requested contract is reported as “Exercise incomplete”. Editing, resetting, or leaving a lesson cancels pending verification.

Before development or building, build the shared runtime in the adjacent `liquidjava-docs` checkout with JDK 17, then export it here:

```sh
cd ../liquidjava-docs
npm ci
npm run build:playground
node scripts/playground/export.mjs ../liquidjava-interactive-tutorial
cd ../liquidjava-interactive-tutorial
npm run dev
```

The workflow builds and exports the runtime from a pinned docs commit, validates pull requests, and deploys only from `main`. Update the checkout `ref` after testing a shared-runtime upgrade. Serve over HTTPS (or localhost) with HTTP range support; `npm run dev` supports JAR range requests. The isolation service worker reloads once before mounting the tutorial. The verifier downloads only when you first check an exercise; Stop terminates it. No source code is sent to a verification server.
