import { access, readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const source = await readFile(resolve(root, "tutorial-data.js"), "utf8");
const sandbox = { window: {} };

vm.runInNewContext(source, sandbox, { filename: "tutorial-data.js" });

const tutorial = sandbox.window.LIQUID_JAVA_TUTORIAL;
const failures = [];

if (!tutorial?.lessons?.length) {
  failures.push("Tutorial data must contain at least one lesson.");
}

for (const lesson of tutorial?.lessons ?? []) {
  const label = lesson.id || "unnamed lesson";

  for (const check of lesson.exercise?.checks ?? []) {
    if (!new RegExp(check.pattern, "m").test(lesson.exercise.solutionCode)) {
      failures.push(`${label}: the provided solution fails the check “${check.message}”`);
    }
  }

  if (lesson.exercise?.guide) {
    const guidePath = lesson.exercise.guide.image.split(/[?#]/)[0];
    try {
      await access(resolve(root, guidePath));
    } catch {
      failures.push(`${label}: guide image does not exist: ${guidePath}`);
    }
  }

  for (const question of lesson.questions ?? []) {
    if (question.type === "radio") {
      if (!Array.isArray(question.choices) || !Number.isInteger(question.correct) || !question.choices[question.correct]) {
        failures.push(`${label}: radio question ${question.id} has an invalid correct answer.`);
      }
    } else if (question.type === "text") {
      if (!Array.isArray(question.accepted) || question.accepted.length === 0) {
        failures.push(`${label}: text question ${question.id} needs at least one accepted answer.`);
      }
    } else {
      failures.push(`${label}: question ${question.id} uses unsupported type ${question.type}.`);
    }
  }
}

if (failures.length) {
  console.error(failures.join("\n"));
  process.exit(1);
}

console.log(`Validated ${tutorial.lessons.length} lessons and their solutions.`);
