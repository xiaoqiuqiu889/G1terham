import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import ts from "typescript";

async function loadTs(path) {
  const source = await readFile(new URL(path, import.meta.url), "utf8");
  const javascript = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.ES2022, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  return import(`data:text/javascript;base64,${Buffer.from(javascript).toString("base64")}`);
}

const romance = await loadTs("../app/romance-replay.ts");
const pageSource = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
const storySource = await readFile(new URL("../app/story.ts", import.meta.url), "utf8");

test("three heartbeat moments carry immediate, near and ending responses", () => {
  assert.deepEqual(romance.heartbeatMoments.map(item => item.id), ["hands", "arrival", "pomegranate"]);
  for (const moment of romance.heartbeatMoments) {
    assert.ok(moment.action.length > 8);
    assert.ok(moment.response.length > 8);
    assert.ok(moment.nearEcho.length > 8);
    assert.ok(moment.endingFragment.length > 8);
  }
  assert.equal(romance.heartbeatState(0), "初见");
  assert.equal(romance.heartbeatState(1), "熟悉");
  assert.equal(romance.heartbeatState(2), "牵挂");
  assert.equal(romance.heartbeatState(3), "难忘");
});

test("seven authored routes rotate deterministically and always contain three decisions", () => {
  assert.equal(romance.dailyMemoryRotations.length, 7);
  const ids = new Set();
  for (let day = 14; day <= 20; day += 1) {
    const rotation = romance.rotationForDate(`2026-07-${day}`);
    ids.add(rotation.id);
    assert.equal(rotation.steps.length, 3);
    assert.deepEqual(rotation.steps.map(step => step.id), ["approach", "keep", "echo"]);
    assert.ok(rotation.steps.every(step => step.options.length === 3));
  }
  assert.equal(ids.size, 7);
});

test("same-day replay updates comparison without farming distinct-day rewards", () => {
  const first = romance.upsertDailyMemoryRecord([], "2026-07-14", ["hands", "poem", "rain"], 1);
  assert.equal(first.firstCompletion, true);
  assert.equal(first.record.plays, 1);
  assert.equal(romance.unlockedDailyMilestones(first.records).length, 1);

  const replay = romance.upsertDailyMemoryRecord(first.records, "2026-07-14", ["voice", "photo", "projector"], 2);
  assert.equal(replay.firstCompletion, false);
  assert.equal(replay.records.length, 1);
  assert.equal(replay.record.plays, 2);
  assert.deepEqual(replay.record.previousChoices, ["hands", "poem", "rain"]);
  assert.equal(romance.unlockedDailyMilestones(replay.records).length, 1);
});

test("milestones unlock at one, three and five distinct dates", () => {
  let records = [];
  const counts = [];
  for (let day = 14; day <= 18; day += 1) {
    records = romance.upsertDailyMemoryRecord(records, `2026-07-${day}`, ["hands", "poem", "rain"], day).records;
    counts.push(romance.unlockedDailyMilestones(records).length);
  }
  assert.deepEqual(counts, [1, 1, 2, 2, 3]);
});

test("first-run naming is readable while canonical names remain available once", () => {
  assert.match(pageSource, /女生 <b>莱拉<\/b>/);
  assert.match(pageSource, /男生 <b>阿拉什<\/b>/);
  assert.equal((storySource.match(/莱拉|阿拉什/g) || []).length, 0);
  assert.match(storySource, /女生/);
  assert.match(storySource, /男生/);
});

test("page wires heartbeat choice into save, echo, journal and ending", () => {
  assert.match(pageSource, /heartbeatChoiceId/);
  assert.match(pageSource, /scene\.id==="echo-one"&&heartbeatMoment/);
  assert.match(pageSource, /<HeartbeatInteraction/);
  assert.match(pageSource, /heartbeat-coda/);
  assert.match(pageSource, /<DailyMemoryRoute/);
  assert.match(pageSource, /今日记忆路线/);
});
