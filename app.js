import { tutorial } from "./tutorial-data.js";

(function () {
  "use strict";

  const content = tutorial;
  const steps = [
    { id: "welcome", shortTitle: "Welcome" },
    ...content.lessons.map((lesson) => ({ id: lesson.id, shortTitle: lesson.shortTitle })),
  ];
  const appScriptUrl = new URL(import.meta.url);
  const basePath = appScriptUrl.pathname.slice(0, appScriptUrl.pathname.lastIndexOf("/") + 1);

  const blankState = () => ({
    currentStep: 0,
    completed: [],
    code: Object.fromEntries(content.lessons.map((lesson) => [lesson.id, lesson.exercise.starterCode])),
    answers: {},
    checkResults: {},
  });

  let state = blankState();

  const screen = document.querySelector("#screen");
  const navigation = document.querySelector("#step-navigation");
  const resetButton = document.querySelector("#reset-button");
  const brandLink = document.querySelector(".brand");

  function stepIndexFromPath() {
    const relativePath = window.location.pathname.startsWith(basePath)
      ? window.location.pathname.slice(basePath.length)
      : "";
    const route = decodeURIComponent(relativePath).replace(/^\/+|\/+$/g, "");

    if (!route || route === "index.html" || route === "404.html") return 0;
    return steps.findIndex((step) => step.id === route);
  }

  function pathForStep(index) {
    const step = steps[index];
    return step.id === "welcome" ? basePath : `${basePath}${encodeURIComponent(step.id)}`;
  }

  function updatePath(index, mode = "push") {
    const path = pathForStep(index);
    if (window.location.pathname === path) return;
    window.history[`${mode}State`]({ step: steps[index].id }, "", path);
  }

  function escapeHtml(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function render() {
    renderNavigation();
    const step = steps[state.currentStep];
    document.title = step.id === "welcome" ? content.meta.title : `${step.shortTitle} · ${content.meta.title}`;
    if (step.id === "welcome") renderWelcome();
    else renderLesson(content.lessons.find((lesson) => lesson.id === step.id));
    updateProgress();
    window.Prism?.highlightAllUnder(screen);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function renderNavigation() {
    navigation.innerHTML = `
      <ol class="step-list">
        ${steps
          .map((step, index) => {
            const active = index === state.currentStep;
            const complete = state.completed.includes(step.id);
            return `<li>
              <button type="button" data-step="${index}" class="step-button ${active ? "is-active" : ""} ${complete ? "is-complete" : ""}" ${active ? 'aria-current="step"' : ""}>
                <span class="step-dot">${complete ? "✓" : index + 1}</span>
                <span>${escapeHtml(step.shortTitle)}</span>
              </button>
            </li>`;
          })
          .join("")}
      </ol>`;

    navigation.querySelectorAll("[data-step]").forEach((button) => {
      button.addEventListener("click", () => goToStep(Number(button.dataset.step)));
    });
  }

  function updateProgress() {
    const completedCount = state.completed.length;
    const percentage = Math.round((completedCount / steps.length) * 100);
    document.querySelector("#progress-percent").textContent = `${percentage}%`;
    document.querySelector("#progress-bar").style.width = `${percentage}%`;
    document.querySelector("#progress-copy").textContent = completedCount
      ? `${completedCount} of ${steps.length} steps complete.`
      : "Start when you are ready.";
  }

  function renderWelcome() {
    screen.innerHTML = `
      <section class="welcome-card">
        <div class="welcome-copy">
          <p class="eyebrow">${escapeHtml(content.meta.eyebrow)}</p>
          <h1>Catch the bug<br><span>before it runs.</span></h1>
          <p class="lede">${escapeHtml(content.meta.introduction)}</p>
          <button id="begin-button" class="primary-button" type="button">Begin the interactive tutorial <span aria-hidden="true">→</span></button>
        </div>
        <div class="route-card" aria-label="Tutorial outline">
          <p class="eyebrow">What you’ll practice</p>
          <ol>
            ${content.lessons
              .map(
                (lesson) => `<li>
                  <span>${lesson.number}</span>
                  <strong>${escapeHtml(lesson.shortTitle)}</strong>
                </li>`,
              )
              .join("")}
          </ol>
          <p class="route-footnote">No setup required. You can skip any activity and return later.</p>
        </div>
      </section>`;

    document.querySelector("#begin-button").addEventListener("click", () => {
      markComplete("welcome");
      goToStep(1);
    });
  }

  function renderLesson(lesson) {
    const currentCode = state.code[lesson.id] || lesson.exercise.starterCode;
    const checked = state.checkResults[lesson.id];
    const isLastLesson = state.currentStep === steps.length - 1;

    screen.innerHTML = `
      <article class="lesson">
        <header class="lesson-header">
          <div>
            <p class="eyebrow">Lesson ${lesson.number}</p>
            <h1>${escapeHtml(lesson.title)}</h1>
            <p class="lede">${escapeHtml(lesson.lead)}</p>
          </div>
          <span class="lesson-number" aria-hidden="true">${lesson.number}</span>
        </header>

        <section class="concept-grid" aria-labelledby="concept-title-${lesson.id}">
          <div class="concept-copy">
            <p class="section-label">${escapeHtml(lesson.concept.label)}</p>
            <h2 id="concept-title-${lesson.id}">${escapeHtml(lesson.concept.explanation)}</h2>
            <ul>${lesson.concept.notes.map((note) => `<li>${escapeHtml(note)}</li>`).join("")}</ul>
          </div>
          <pre class="code-card language-java"><code class="language-java">${escapeHtml(lesson.concept.code)}</code></pre>
        </section>

        <section class="workbench" aria-labelledby="exercise-title-${lesson.id}">
          <div class="workbench-head">
            <div>
              <p class="section-label">Try it yourself</p>
              <h2 id="exercise-title-${lesson.id}">${escapeHtml(lesson.exercise.title)}</h2>
              <p>${escapeHtml(lesson.exercise.prompt)}</p>
            </div>
            <span class="editor-badge">Java</span>
          </div>
          ${
            lesson.exercise.guide
              ? `<figure class="exercise-guide">
                  <img src="${escapeHtml(lesson.exercise.guide.image)}" alt="${escapeHtml(lesson.exercise.guide.alt)}" loading="lazy" decoding="async" />
                  <figcaption>${escapeHtml(lesson.exercise.guide.caption)}</figcaption>
                </figure>`
              : ""
          }
          <label class="sr-only" for="code-${lesson.id}">Editable Java exercise</label>
          <textarea id="code-${lesson.id}" class="code-editor" spellcheck="false" aria-describedby="exercise-feedback-${lesson.id}">${escapeHtml(currentCode)}</textarea>
          <div class="editor-actions">
            <button class="primary-button" id="check-${lesson.id}" type="button">Check my work</button>
            <button class="secondary-button" id="reset-${lesson.id}" type="button">Reset code</button>
            <button class="text-button" id="solution-${lesson.id}" type="button" aria-expanded="false">Show one solution</button>
          </div>
          <div id="exercise-feedback-${lesson.id}" class="exercise-feedback ${checked?.passed ? "is-success" : checked ? "is-error" : ""}" aria-live="polite">
            ${renderExerciseFeedback(checked)}
          </div>
          <div id="solution-panel-${lesson.id}" class="solution-panel" hidden>
            <div class="solution-heading"><strong>One possible solution</strong><span>Compare, don’t copy blindly.</span></div>
            <pre class="language-java"><code class="language-java">${escapeHtml(lesson.exercise.solutionCode)}</code></pre>
          </div>
        </section>

        <section class="questions" aria-labelledby="questions-title-${lesson.id}">
          <p class="section-label">Quick check</p>
          <h2 id="questions-title-${lesson.id}">Explain what LiquidJava knows</h2>
          ${lesson.questions.map((question, index) => renderQuestion(question, index + 1)).join("")}
        </section>

        ${renderFooterControls(state.currentStep, isLastLesson ? "Finish tutorial" : `Complete lesson ${lesson.number}`)}
      </article>`;

    wireLesson(lesson);
    wireQuestions(lesson.questions);
    wireFooterControls(lesson.id, isLastLesson);
  }

  function renderExerciseFeedback(result) {
    if (!result) return "<p>Run the check when you are ready. This checker looks for the contract, not exact formatting.</p>";
    if (result.passed) {
      return '<p><strong>Contract satisfied.</strong> Your annotations express the requested guarantee.</p>';
    }
    return `<p><strong>Almost there.</strong></p><ul>${result.messages.map((message) => `<li>${escapeHtml(message)}</li>`).join("")}</ul>`;
  }

  function wireLesson(lesson) {
    const textarea = document.querySelector(`#code-${lesson.id}`);
    const feedback = document.querySelector(`#exercise-feedback-${lesson.id}`);
    const solutionButton = document.querySelector(`#solution-${lesson.id}`);
    const solutionPanel = document.querySelector(`#solution-panel-${lesson.id}`);

    const editor = window.CodeMirror
      ? window.CodeMirror.fromTextArea(textarea, {
          mode: "text/x-java",
          theme: "liquidjava",
          lineNumbers: true,
          lineWrapping: true,
          indentUnit: 4,
          tabSize: 4,
          indentWithTabs: false,
          matchBrackets: true,
          autoCloseBrackets: true,
          inputStyle: "textarea",
          screenReaderLabel: `Editable Java exercise: ${lesson.exercise.title}`,
          extraKeys: {
            Tab(codeMirror) {
              if (codeMirror.somethingSelected()) codeMirror.indentSelection("add");
              else codeMirror.execCommand("insertSoftTab");
            },
            "Shift-Tab": "indentLess",
          },
        })
      : null;

    const getCode = () => (editor ? editor.getValue() : textarea.value);
    const setCode = (value) => {
      if (editor) editor.setValue(value);
      else {
        textarea.value = value;
        textarea.dispatchEvent(new Event("input"));
      }
    };
    const focusEditor = () => (editor ? editor.focus() : textarea.focus());

    const handleCodeChange = () => {
      state.code[lesson.id] = getCode();
      delete state.checkResults[lesson.id];
      feedback.className = "exercise-feedback";
      feedback.innerHTML = renderExerciseFeedback(null);
    };

    if (editor) editor.on("change", handleCodeChange);
    else textarea.addEventListener("input", handleCodeChange);

    document.querySelector(`#check-${lesson.id}`).addEventListener("click", () => {
      const failures = lesson.exercise.checks.filter((check) => !new RegExp(check.pattern, "m").test(getCode()));
      const result = { passed: failures.length === 0, messages: failures.map((check) => check.message) };
      state.checkResults[lesson.id] = result;
      feedback.className = `exercise-feedback ${result.passed ? "is-success" : "is-error"}`;
      feedback.innerHTML = renderExerciseFeedback(result);
      feedback.scrollIntoView({ behavior: "smooth", block: "nearest" });
    });

    document.querySelector(`#reset-${lesson.id}`).addEventListener("click", () => {
      setCode(lesson.exercise.starterCode);
      focusEditor();
    });

    solutionButton.addEventListener("click", () => {
      const isHidden = solutionPanel.hidden;
      solutionPanel.hidden = !isHidden;
      solutionButton.setAttribute("aria-expanded", String(isHidden));
      solutionButton.textContent = isHidden ? "Hide solution" : "Show one solution";
    });
  }

  function renderQuestion(question, number) {
    const currentAnswer = state.answers[question.id] ?? "";
    const feedback = questionFeedback(question, currentAnswer);
    const heading = `<div class="question-heading"><span>${number}</span><h3>${escapeHtml(question.prompt)}</h3></div>`;

    if (question.type === "text") {
      return `<div class="question-card">
        ${heading}
        <label class="sr-only" for="answer-${question.id}">${escapeHtml(question.prompt)}</label>
        <input class="answer-input" id="answer-${question.id}" type="text" inputmode="${escapeHtml(question.inputMode || "text")}" value="${escapeHtml(currentAnswer)}" placeholder="${escapeHtml(question.placeholder || "")}" autocomplete="off" />
        <div class="question-feedback" id="feedback-${question.id}" aria-live="polite">${feedback}</div>
      </div>`;
    }

    return `<fieldset class="question-card">
      <legend class="sr-only">${escapeHtml(question.prompt)}</legend>
      ${heading}
      <div class="option-list">
        ${question.choices
          .map(
            (choice, index) => `<label class="option">
              <input type="radio" name="${question.id}" value="${index}" ${String(currentAnswer) === String(index) ? "checked" : ""}>
              <span>${escapeHtml(choice)}</span>
            </label>`,
          )
          .join("")}
      </div>
      <div class="question-feedback" id="feedback-${question.id}" aria-live="polite">${feedback}</div>
    </fieldset>`;
  }

  function questionFeedback(question, value) {
    if (value === "" || value === undefined) return "";
    const correct = question.type === "text"
      ? question.accepted.some((answer) => answer.toLowerCase() === String(value).trim().toLowerCase())
      : Number(value) === question.correct;
    return `<p class="${correct ? "correct" : "incorrect"}"><strong>${correct ? "That’s right." : "Try once more."}</strong> ${escapeHtml(question.explanation || "")}</p>`;
  }

  function wireQuestions(questions) {
    questions.forEach((question) => {
      if (question.type === "text") {
        const input = document.querySelector(`#answer-${question.id}`);
        input.addEventListener("input", () => {
          state.answers[question.id] = input.value;
          document.querySelector(`#feedback-${question.id}`).innerHTML = questionFeedback(question, input.value);
        });
        return;
      }

      document.querySelectorAll(`input[name="${question.id}"]`).forEach((input) => {
        input.addEventListener("change", () => {
          state.answers[question.id] = input.value;
          const feedback = document.querySelector(`#feedback-${question.id}`);
          if (feedback) feedback.innerHTML = questionFeedback(question, input.value);
        });
      });
    });
  }

  function renderFooterControls(stepIndex, nextLabel) {
    return `<footer class="lesson-footer">
      <button class="secondary-button" id="previous-button" type="button" ${stepIndex === 0 ? "disabled" : ""}>← Previous</button>
      <span>You can return to any step.</span>
      <button class="primary-button" id="next-button" type="button">${escapeHtml(nextLabel)} <span aria-hidden="true">→</span></button>
    </footer>`;
  }

  function wireFooterControls(stepId, isFinal = false) {
    document.querySelector("#previous-button").addEventListener("click", () => goToStep(state.currentStep - 1));
    document.querySelector("#next-button").addEventListener("click", () => {
      markComplete(stepId);
      if (isFinal) {
        showFinishedState();
      } else {
        goToStep(Math.min(state.currentStep + 1, steps.length - 1));
      }
    });
  }

  function showFinishedState() {
    const footer = document.querySelector(".lesson-footer");
    footer.innerHTML = `
      <div class="finished-message">
        <span aria-hidden="true">✓</span>
        <div><strong>Tutorial complete.</strong><p>You finished all four guided examples.</p></div>
      </div>
      <button class="secondary-button" id="review-button" type="button">Review tutorial</button>`;
    document.querySelector("#review-button").addEventListener("click", () => goToStep(1));
    updateProgress();
  }

  function markComplete(stepId) {
    if (!state.completed.includes(stepId)) state.completed.push(stepId);
  }

  function goToStep(index, historyMode = "push") {
    state.currentStep = Math.max(0, Math.min(index, steps.length - 1));
    updatePath(state.currentStep, historyMode);
    render();
    document.querySelector("#tutorial-main").focus({ preventScroll: true });
  }

  resetButton.addEventListener("click", () => {
    if (!window.confirm("Reset this tutorial session, including edited code and answers?")) return;
    state = blankState();
    goToStep(0, "replace");
  });

  brandLink.addEventListener("click", (event) => {
    event.preventDefault();
    goToStep(0);
  });

  window.addEventListener("popstate", () => {
    const routeIndex = stepIndexFromPath();
    state.currentStep = routeIndex >= 0 ? routeIndex : 0;
    render();
    document.querySelector("#tutorial-main").focus({ preventScroll: true });
  });

  const initialRouteIndex = stepIndexFromPath();
  state.currentStep = initialRouteIndex >= 0 ? initialRouteIndex : 0;
  if (initialRouteIndex < 0) updatePath(0, "replace");
  render();
})();
