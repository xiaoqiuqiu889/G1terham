import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import ts from "typescript";

async function loadTs(path) {
  const source = await readFile(new URL(path, import.meta.url), "utf8");
  const javascript = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.ES2022, target: ts.ScriptTarget.ES2022 },
  }).outputText.replace(/^import .*?;\s*$/gm, "");
  return import(`data:text/javascript;base64,${Buffer.from(javascript).toString("base64")}`);
}

const logic = await loadTs("../app/game-logic.ts");

test("each clear behavioral axis receives its matching ending", () => {
  assert.equal(logic.determineEnding({ speak: 3, keep: 0, survive: 0 }), "speak");
  assert.equal(logic.determineEnding({ speak: 0, keep: 2, survive: 1 }), "keep");
  assert.equal(logic.determineEnding({ speak: 1, keep: 0, survive: 2 }), "survive");
});

test("one choice on every axis yields a neutral mixed ending", () => {
  assert.equal(logic.determineEnding({ speak: 1, keep: 1, survive: 1 }), "mixed");
  assert.equal(logic.determineEnding({ speak: 2, keep: 2, survive: 0 }), "mixed");
});

test("scores derive only from the three main answers", () => {
  const scores = logic.scoreAnswers({
    one: { axis: "speak" },
    two: { axis: "keep" },
    three: { axis: "survive" },
  });
  assert.deepEqual(scores, { speak: 1, keep: 1, survive: 1 });
});

test("combined ending includes only choices and resonances that occurred", () => {
  const answers = { one: { endingFragment: "chosen main fragment" } };
  const resonances = { photo: { endingFragment: "chosen resonance fragment" } };
  assert.deepEqual(
    logic.composeEndingFragments(answers, resonances, ["one", "missing"], ["photo", "missing"]),
    ["chosen main fragment", "chosen resonance fragment"],
  );
});

test("revisit diff compares future echoes, not just labels", () => {
  const before = { one: { optionId: "a", revisitEcho: "old future" } };
  const after = { one: { optionId: "b", revisitEcho: "new future" } };
  const [diff] = logic.choiceDiff(before, after, ["one"]);
  assert.equal(diff.changed, true);
  assert.equal(diff.futureBefore, "old future");
  assert.equal(diff.futureAfter, "new future");
});


test("selected resonance options never return as unchosen fragments", () => {
  const fragments = [
    { optionId: "poem", text: "poem shard" },
    { optionId: "well", text: "email shard" },
    { optionId: "clock", text: "gaze shard" },
  ];
  const answers = { one: { optionId: "poem" } };
  const resonances = { email: { optionId: "well" } };
  assert.deepEqual(logic.selectUnchosenFragments(fragments, answers, resonances), [
    { optionId: "clock", text: "gaze shard" },
  ]);
});

function answer(axis, optionId) {
  return { axis, optionId, endingFragment: "", revisitEcho: "" };
}

test("cinematic epilogues stay short, name both present-day partners, and cover four tones", () => {
  const routes = [
    ["speak", { one: answer("speak", "poem"), two: answer("speak", "reporter"), three: answer("speak", "truth") }],
    ["keep", { one: answer("keep", "kiss"), two: answer("keep", "book"), three: answer("keep", "escape") }],
    ["survive", { one: answer("survive", "leave"), two: answer("survive", "burn"), three: answer("survive", "conceal") }],
    ["mixed", { one: answer("speak", "poem"), two: answer("keep", "book"), three: answer("survive", "conceal") }],
  ];
  const resonances = { photo: { optionId: "front" } };
  for (const [ending, answers] of routes) {
    const text = logic.composeCinematicEpilogue(ending, answers, resonances);
    assert.ok(text.length >= 80 && text.length <= 120, `${ending}: ${text.length} chars`);
    assert.match(text, /卡姆兰/);
    assert.match(text, /玛丽亚姆/);
  }
});

test("the reunion gaze becomes the final visible camera lens", () => {
  const answers = { one: answer("speak", "poem"), two: answer("keep", "book"), three: answer("survive", "conceal") };
  for (const [optionId, marker] of [["hands", "茶杯的手"], ["book", "旧诗集"], ["clock", "机场方向牌"]]) {
    const text = logic.composeCinematicEpilogue("mixed", answers, { photo: { optionId: "front" }, gaze: { optionId } });
    assert.match(text, new RegExp(marker));
  }
});

test("secondary axis is not invented from array order when the runners-up tie", () => {
  assert.equal(logic.determineSecondaryAxis({ speak: 3, keep: 0, survive: 0 }, "speak"), "speak");
  assert.equal(logic.determineSecondaryAxis({ speak: 2, keep: 1, survive: 0 }, "speak"), "keep");
  assert.equal(logic.determineSecondaryAxis({ speak: 1, keep: 1, survive: 1 }, "mixed"), null);
});

test("future echo routing never emits more than two configured lines", () => {
  const routes = [
    { source: "choice", id: "one", field: "farEcho" },
    { source: "resonance", id: "email", field: "farEcho" },
    { source: "choice", id: "two", field: "farEcho" },
  ];
  const answers = { one: { farEcho: "first" }, two: { farEcho: "third" } };
  const resonances = { email: { farEcho: "second" } };
  assert.deepEqual(logic.resolveFutureEchoes(routes, answers, resonances), ["first", "second"]);
});
