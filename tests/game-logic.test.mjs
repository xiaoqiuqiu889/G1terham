import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import ts from "typescript";

const source = await readFile(new URL("../app/game-logic.ts", import.meta.url), "utf8");
const javascript = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.ES2022, target: ts.ScriptTarget.ES2022 },
}).outputText;
const logic = await import(`data:text/javascript;base64,${Buffer.from(javascript).toString("base64")}`);

test("each clear leader receives its matching ending", () => {
  assert.equal(logic.determineEnding({ love: 3, idealism: 0, survival: 0 }), "love");
  assert.equal(logic.determineEnding({ love: 0, idealism: 2, survival: 1 }), "idealism");
  assert.equal(logic.determineEnding({ love: 1, idealism: 0, survival: 2 }), "survival");
});

test("one point in every tendency yields the mixed ending", () => {
  assert.equal(logic.determineEnding({ love: 1, idealism: 1, survival: 1 }), "mixed");
});

test("any unresolved highest-score tie is mixed rather than order-dependent", () => {
  assert.equal(logic.determineEnding({ love: 2, idealism: 2, survival: 0 }), "mixed");
  assert.equal(logic.determineEnding({ love: 0, idealism: 4, survival: 4 }), "mixed");
});

test("scores are derived from answer records", () => {
  const scores = logic.scoreAnswers({
    one: { tendency: "love" },
    two: { tendency: "idealism" },
    three: { tendency: "survival" },
  });
  assert.deepEqual(scores, { love: 1, idealism: 1, survival: 1 });
});

test("literary strength labels hide exact values from visual UI", () => {
  assert.equal(logic.memoryStrength(0), "尚未显现");
  assert.equal(logic.memoryStrength(1), "微弱");
  assert.equal(logic.memoryStrength(2), "清晰");
  assert.equal(logic.memoryStrength(3), "强烈");
});
