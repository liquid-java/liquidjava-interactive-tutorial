/*
 * Lightweight source checks used by the interactive exercises.
 *
 * These remain regular expressions rather than a Java parser, but the helpers
 * below make equivalent refinements explicit: operands and boolean clauses may
 * be reordered, and a refined local/parameter may be written as either `_` or
 * its declared name.
 */

const whitespace = "\\s*";

function optionalParens(pattern) {
  return `(?:${pattern}|\\(${whitespace}${pattern}${whitespace}\\))`;
}

function comparison(left, operator, right) {
  return `${left}${whitespace}${operator}${whitespace}${right}`;
}

function orderedComparison(value, operator, bound, reversedOperator) {
  return `(?:${comparison(value, operator, bound)}|${comparison(bound, reversedOperator, value)})`;
}

function equality(left, right) {
  return `(?:${comparison(left, "==", right)}|${comparison(right, "==", left)})`;
}

function conjunction(first, second) {
  const left = optionalParens(first);
  const right = optionalParens(second);
  return optionalParens(`(?:${left}${whitespace}&&${whitespace}${right}|${right}${whitespace}&&${whitespace}${left})`);
}

function permutations(values) {
  if (values.length <= 1) return [values];
  return values.flatMap((value, index) =>
    permutations(values.filter((_, candidateIndex) => candidateIndex !== index)).map((rest) => [value, ...rest]),
  );
}

function disjunction(values) {
  const alternatives = permutations(values).map((items) =>
    items.map(optionalParens).join(`${whitespace}\\|\\|${whitespace}`),
  );
  return optionalParens(`(?:${alternatives.join("|")})`);
}

function quoted(expression) {
  return `"${whitespace}${expression}${whitespace}"`;
}

function refinement(expression, declaration) {
  return `@Refinement${whitespace}\\(${whitespace}${quoted(expression)}${whitespace}\\)${whitespace}${declaration}`;
}

function namedArgument(name, expression) {
  return `${name}${whitespace}=${whitespace}${quoted(expression)}`;
}

function stateRefinement(argumentsPattern, declaration) {
  return `@StateRefinement${whitespace}\\(${whitespace}${argumentsPattern}${whitespace}\\)${whitespace}${declaration}`;
}

function transition(from, to, declaration) {
  const fromArgument = namedArgument("from", from);
  const toArgument = namedArgument("to", to);
  const argumentsPattern = `(?:${fromArgument}${whitespace},${whitespace}${toArgument}|${toArgument}${whitespace},${whitespace}${fromArgument})`;
  return stateRefinement(argumentsPattern, declaration);
}

function fromWithOptionalSameTo(state, declaration) {
  const fromArgument = namedArgument("from", state);
  const toArgument = namedArgument("to", state);
  const argumentsPattern = `(?:${fromArgument}|${fromArgument}${whitespace},${whitespace}${toArgument}|${toArgument}${whitespace},${whitespace}${fromArgument})`;
  return stateRefinement(argumentsPattern, declaration);
}

const rgbValue = "(?:_|red)";
const rgbLower = orderedComparison(rgbValue, ">=", "0", "<=");
const rgbUpper = orderedComparison(rgbValue, "<=", "255", ">=");

const lowValue = "(?:_|low)";
const lowBeforeHigh = orderedComparison(lowValue, "<=", "high", ">=");

const midpointNormalLower = orderedComparison("_", ">=", "low", "<=");
const midpointNormalUpper = orderedComparison("_", "<=", "high", ">=");
const midpointReversedLower = orderedComparison("_", ">=", "high", "<=");
const midpointReversedUpper = orderedComparison("_", "<=", "low", ">=");
const midpointRange = `(?:${conjunction(midpointNormalLower, midpointNormalUpper)}|${conjunction(midpointReversedLower, midpointReversedUpper)})`;

const state = (name) => `${name}${whitespace}\\(${whitespace}this${whitespace}\\)`;
const unconnected = state("unconnected");
const bound = state("bound");
const connected = state("connected");
const closed = state("closed");
const notClosed = `!${whitespace}${closed}`;
const anyOpenState = `(?:${notClosed}|${disjunction([unconnected, bound, connected])})`;

const sizeNow = `size${whitespace}\\(${whitespace}this${whitespace}\\)`;
const sizeOld = `size${whitespace}\\(${whitespace}old${whitespace}\\(${whitespace}this${whitespace}\\)${whitespace}\\)`;
const zeroSize = equality(sizeNow, "0");
const positiveSize = orderedComparison(sizeNow, ">", "0", "<");
const incrementedSize = equality(sizeNow, `(?:${comparison(sizeOld, "\\+", "1")}|${comparison("1", "\\+", sizeOld)})`);
const decrementedSize = equality(sizeNow, comparison(sizeOld, "-", "1"));

export const validationRegexes = Object.freeze({
  rgb: Object.freeze({
    refinement: refinement(conjunction(rgbLower, rgbUpper), `int\\s+red\\b`),
    assignment: "int\\s+red\\s*=\\s*(?:[0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\\s*;",
  }),
  midpoint: Object.freeze({
    result: refinement(midpointRange, "public\\s+static\\s+int\\s+midpoint\\b"),
    bounds: refinement(lowBeforeHigh, "int\\s+low\\b"),
  }),
  socket: Object.freeze({
    bind: transition(unconnected, bound, "public\\s+void\\s+bind\\b"),
    connect: transition(bound, connected, "public\\s+void\\s+connect\\b"),
    sendUrgentData: fromWithOptionalSameTo(connected, "public\\s+void\\s+sendUrgentData\\b"),
    close: transition(anyOpenState, closed, "public\\s+void\\s+close\\b"),
  }),
  stack: Object.freeze({
    constructor: stateRefinement(namedArgument("to", zeroSize), "public\\s+void\\s+Stack\\b"),
    push: stateRefinement(namedArgument("to", incrementedSize), "public\\s+E\\s+push\\b"),
    pop: transition(positiveSize, decrementedSize, "public\\s+E\\s+pop\\b"),
    peek: stateRefinement(namedArgument("from", positiveSize), "public\\s+E\\s+peek\\b"),
  }),
});
