import test from "node:test";
import assert from "node:assert/strict";
import { executeCode } from "./codeRunner";
import type { TestCase } from "@shared/schema";

const factorialTests: TestCase[] = [
  { id: "one", input: "5", expectedOutput: "120" },
  { id: "two", input: "0", expectedOutput: "1", isHidden: true },
];

test("executes JavaScript against canonical test inputs", async () => {
  const result = await executeCode(
    "function factorial(n) { return n < 2 ? 1 : n * factorial(n - 1); }",
    "javascript",
    factorialTests,
    1,
    64,
  );
  assert.equal(result.status, "passed");
  assert.equal(result.passedTests, 2);
});

test("transpiles TypeScript before deterministic execution", async () => {
  const result = await executeCode(
    "function square(n: number): number { return n * n; }",
    "typescript",
    [{ id: "square", input: "4", expectedOutput: "16" }],
    1,
    64,
  );
  assert.equal(result.status, "passed");
});

test("reports wrong output instead of fabricating a pass", async () => {
  const result = await executeCode(
    "function factorial(n) { return n; }",
    "javascript",
    factorialTests,
    1,
    64,
  );
  assert.equal(result.status, "failed");
  assert.equal(result.passedTests, 0);
});

test("terminates JavaScript that exceeds its time limit", async () => {
  const result = await executeCode(
    "function solve() { while (true) {} }",
    "javascript",
    [{ id: "timeout", input: "1", expectedOutput: "1" }],
    0.25,
    64,
  );
  assert.equal(result.status, "timeout");
});

test("executes Python in a resource-limited subprocess", async () => {
  const result = await executeCode(
    "def find_max(numbers):\n    return max(numbers)",
    "python",
    [{ id: "max", input: "[1, 8, 3]", expectedOutput: "8" }],
    1,
    64,
  );
  assert.equal(result.status, "passed");
});

test("blocks JavaScript attempts to escape the isolated VM", async () => {
  const result = await executeCode(
    'function solve() { return this.constructor.constructor("return process")().env; }',
    "javascript",
    [{ id: "escape", input: "null", expectedOutput: "never" }],
    1,
    64,
  );
  assert.equal(result.status, "error");
});

test("blocks Python imports in submitted code", async () => {
  const result = await executeCode(
    "import os\ndef solve(value):\n    return os.environ",
    "python",
    [{ id: "escape", input: "null", expectedOutput: "never" }],
    1,
    64,
  );
  assert.equal(result.status, "error");
});