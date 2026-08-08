# LiquidJava Interactive Tutorial

This repository contains a web-based, interactive introduction to LiquidJava. The tutorial has four short examples:

1. RGB value refinements;
2. Midpoint method contracts;
3. External socket state refinements;
4. Stack ghost variables.

Learners can edit Java snippets, run lightweight in-browser checks, answer quick knowledge questions, and move freely between sections. The tutorial does not collect, persist, or export user data.

## Preview Locally

Run the local development server:

```sh
npm run dev
```

Then open `http://localhost:8000`.

## Examples

All tutorial content is in [`tutorial-data.js`](tutorial-data.js). The interface renders the lessons from that single configuration object.

Each lesson contains:

- Explanatory copy and a read-only example;
- Starter and solution code;
- Regular-expression checks for the coding task;
- Automatically checked multiple-choice and short-answer questions.

Add, remove, or reorder lesson objects to change the tutorial without editing `app.js` or `index.html`.

## Checker Scope

The browser checker is intentionally lightweight: it recognizes the requested annotations and values but does not run the LiquidJava compiler. Use the LiquidJava VS Code extension for real verification tasks.
