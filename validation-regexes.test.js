import assert from "node:assert/strict";
import test from "node:test";

import { validationRegexes } from "./validation-regexes.js";

function accepts(pattern, source) {
  return new RegExp(pattern, "m").test(source);
}

function assertAllAccepted(pattern, sources) {
  for (const source of sources) {
    assert.equal(accepts(pattern, source), true, `Expected this source to be accepted:\n${source}`);
  }
}

function annotation(name, expression, declaration, reversedArguments = false, toExpression = null) {
  let argumentsSource = `${name}="${expression}"`;
  if (toExpression !== null) {
    const to = `to="${toExpression}"`;
    argumentsSource = reversedArguments ? `${to}, ${argumentsSource}` : `${argumentsSource}, ${to}`;
  }
  return `@StateRefinement(${argumentsSource})\n${declaration}`;
}

test("RGB accepts every supported spelling and order of the two valid bounds", () => {
  const lowerBounds = ["_ >= 0", "0 <= _", "red >= 0", "0 <= red"];
  const upperBounds = ["_ <= 255", "255 >= _", "red <= 255", "255 >= red"];
  const refinements = [];

  for (const lower of lowerBounds) {
    for (const upper of upperBounds) {
      refinements.push(`${lower} && ${upper}`, `${upper} && ${lower}`);
    }
  }

  assertAllAccepted(
    validationRegexes.rgb.refinement,
    refinements.map((expression) => `@Refinement("${expression}")\nint red = 128;`),
  );
  assert.equal(
    accepts(validationRegexes.rgb.refinement, '@Refinement("_ <= 0 && _ >= 255")\nint red = 128;'),
    false,
  );
});

test("midpoint's parameter accepts `_` or `low` with either operand order", () => {
  const expressions = ["_ <= high", "high >= _", "low <= high", "high >= low"];
  assertAllAccepted(
    validationRegexes.midpoint.bounds,
    expressions.map((expression) => `@Refinement("${expression}") int low, int high`),
  );
  assert.equal(
    accepts(validationRegexes.midpoint.bounds, '@Refinement("low >= high") int low, int high'),
    false,
  );
});

test("midpoint's result accepts operand and conjunction permutations", () => {
  const normalLower = ["_ >= low", "low <= _"];
  const normalUpper = ["_ <= high", "high >= _"];
  const reversedLower = ["_ >= high", "high <= _"];
  const reversedUpper = ["_ <= low", "low >= _"];
  const expressions = [];

  for (const [lowerBounds, upperBounds] of [
    [normalLower, normalUpper],
    [reversedLower, reversedUpper],
  ]) {
    for (const lower of lowerBounds) {
      for (const upper of upperBounds) {
        expressions.push(`${lower} && ${upper}`, `${upper} && ${lower}`);
      }
    }
  }

  expressions.push("(low <= _) && (_ <= high)", "(high <= _ && low >= _)");
  assertAllAccepted(
    validationRegexes.midpoint.result,
    expressions.map((expression) => `@Refinement("${expression}")\npublic static int midpoint(int low, int high)`),
  );
  assert.equal(
    accepts(
      validationRegexes.midpoint.result,
      '@Refinement("_ >= low && _ >= high")\npublic static int midpoint(int low, int high)',
    ),
    false,
  );
});

test("socket transitions accept named annotation arguments in either order", () => {
  assertAllAccepted(validationRegexes.socket.bind, [
    annotation("from", "unconnected(this)", "public void bind(SocketAddress add);", false, "bound(this)"),
    annotation("from", "unconnected(this)", "public void bind(SocketAddress add);", true, "bound(this)"),
  ]);
  assertAllAccepted(validationRegexes.socket.connect, [
    annotation("from", "bound(this)", "public void connect(SocketAddress add);", false, "connected(this)"),
    annotation("from", "bound(this)", "public void connect(SocketAddress add);", true, "connected(this)"),
  ]);
  assertAllAccepted(validationRegexes.socket.sendUrgentData, [
    annotation("from", "connected(this)", "public void sendUrgentData(int n);"),
    annotation("from", "connected(this)", "public void sendUrgentData(int n);", false, "connected(this)"),
    annotation("from", "connected(this)", "public void sendUrgentData(int n);", true, "connected(this)"),
  ]);
});

test("close accepts !closed or every permutation of the other states joined by ||", () => {
  const states = ["unconnected(this)", "bound(this)", "connected(this)"];
  const expressions = [];

  for (const first of states) {
    for (const second of states.filter((state) => state !== first)) {
      const third = states.find((state) => state !== first && state !== second);
      expressions.push(`${first} || ${second} || ${third}`);
    }
  }
  expressions.push("!closed(this)", "(unconnected(this) || bound(this) || connected(this))");

  const sources = expressions.flatMap((expression) => [
    annotation("from", expression, "public void close();", false, "closed(this)"),
    annotation("from", expression, "public void close();", true, "closed(this)"),
  ]);
  assertAllAccepted(validationRegexes.socket.close, sources);
  assert.equal(
    accepts(
      validationRegexes.socket.close,
      annotation("from", "unconnected(this) || bound(this)", "public void close();", false, "closed(this)"),
    ),
    false,
  );
});

test("ghost checks accept equivalent equality, comparison, arithmetic, and argument orders", () => {
  assertAllAccepted(validationRegexes.stack.constructor, [
    '@StateRefinement(to="size(this) == 0") public void Stack();',
    '@StateRefinement(to="0 == size(this)") public void Stack();',
  ]);
  assertAllAccepted(validationRegexes.stack.push, [
    '@StateRefinement(to="size(this) == size(old(this)) + 1") public E push(E elem);',
    '@StateRefinement(to="1 + size(old(this)) == size(this)") public E push(E elem);',
  ]);
  assertAllAccepted(validationRegexes.stack.pop, [
    annotation("from", "size(this) > 0", "public E pop();", false, "size(this) == size(old(this)) - 1"),
    annotation("from", "0 < size(this)", "public E pop();", true, "size(old(this)) - 1 == size(this)"),
  ]);
  assertAllAccepted(validationRegexes.stack.peek, [
    '@StateRefinement(from="size(this) > 0") public E peek();',
    '@StateRefinement(from="0 < size(this)") public E peek();',
  ]);
});
