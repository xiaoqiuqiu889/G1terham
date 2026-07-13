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
const story = await loadTs("../app/story.ts");

function answer(choiceId, option) {
  return { choiceId, optionId: option.id, label: option.label, ...option };
}

function resonance(resonanceId, option) {
  return { resonanceId, optionId: option.id, label: option.label, ...option };
}

test("a complete first run carries every chosen memory into a valid ending", () => {
  const answers = Object.fromEntries(story.choiceIds.map(id => [id, answer(id, story.memoryContracts[id][0])]));
  const resonances = Object.fromEntries(story.resonanceIds.map(id => [id, resonance(id, story.resonanceContracts[id][0])]));

  assert.equal(Object.keys(answers).length, 3);
  assert.equal(Object.keys(resonances).length, 3);
  for (const selected of Object.values(answers)) {
    assert.ok(selected.confirmation && selected.nearEcho && selected.farEcho && selected.endingFragment && selected.revisitEcho);
  }

  const ending = logic.determineEnding(logic.scoreAnswers(answers));
  assert.equal(ending, "speak");
  const fragments = logic.composeEndingFragments(answers, resonances, story.choiceIds, story.resonanceIds);
  assert.equal(fragments.length, 6);
  assert.ok(fragments.every(Boolean));
});

test("memory editing revisit compares the old and changed futures", () => {
  const previous = Object.fromEntries(story.choiceIds.map(id => [id, answer(id, story.memoryContracts[id][0])]));
  const revised = Object.fromEntries(story.choiceIds.map(id => [id, answer(id, story.memoryContracts[id][2])]));
  const diffs = logic.choiceDiff(previous, revised, story.choiceIds);

  assert.equal(logic.determineEnding(logic.scoreAnswers(previous)), "speak");
  assert.equal(logic.determineEnding(logic.scoreAnswers(revised)), "survive");
  assert.equal(diffs.length, 3);
  assert.ok(diffs.every(diff => diff.changed));
  assert.ok(diffs.every(diff => diff.futureBefore && diff.futureAfter && diff.futureBefore !== diff.futureAfter));
  assert.equal(story.revisitScenes.filter(scene => scene.kind === "revisitEcho").length, 3);
});
