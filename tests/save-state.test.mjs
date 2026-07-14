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

const saveState = await loadTs("../app/save-state.ts");

test("content revision is an explicit positive integer", () => {
  assert.equal(Number.isInteger(saveState.CURRENT_CONTENT_REVISION), true);
  assert.ok(saveState.CURRENT_CONTENT_REVISION > 0);
});

test("stable scene ids survive insertions before the saved scene", () => {
  const saved = { sceneId: "choice-two", sceneIndex: 7 };
  const currentSceneIds = ["photo", "new-transition", "publication", "choice-two", "echo-two"];

  assert.equal(saveState.resolveSavedSceneIndex(saved, currentSceneIds), 3);
});

test("stable scene ids survive removals before the saved scene", () => {
  const saved = { sceneId: "email", sceneIndex: 20 };
  const currentSceneIds = ["photo", "choice-one", "email", "gaze"];

  assert.equal(saveState.resolveSavedSceneIndex(saved, currentSceneIds), 2);
});

test("missing or deleted scene ids safely fall back to the legacy index", () => {
  const currentSceneIds = ["photo", "campus", "choice-one"];

  assert.equal(
    saveState.resolveSavedSceneIndex({ sceneId: "deleted-scene", sceneIndex: 1 }, currentSceneIds),
    1,
  );
  assert.equal(
    saveState.resolveSavedSceneIndex({ sceneId: "deleted-scene", sceneIndex: 99 }, currentSceneIds),
    2,
  );
  assert.equal(
    saveState.resolveSavedSceneIndex({ sceneId: "deleted-scene", sceneIndex: -12 }, currentSceneIds),
    0,
  );
});

test("old saves without scene ids use a clamped numeric index", () => {
  const currentSceneIds = ["photo", "campus", "choice-one"];

  assert.equal(saveState.resolveSavedSceneIndex({ sceneIndex: 1.9 }, currentSceneIds), 1);
  assert.equal(saveState.resolveSavedSceneIndex({ sceneIndex: 3 }, currentSceneIds), 2);
  assert.equal(saveState.resolveSavedSceneIndex({ sceneIndex: -1 }, currentSceneIds), 0);
});

test("invalid saved positions and empty timelines resolve safely", () => {
  const currentSceneIds = ["photo", "campus"];

  assert.equal(saveState.resolveSavedSceneIndex(undefined, currentSceneIds), 0);
  assert.equal(saveState.resolveSavedSceneIndex(null, currentSceneIds), 0);
  assert.equal(saveState.resolveSavedSceneIndex({ sceneIndex: Number.NaN }, currentSceneIds), 0);
  assert.equal(saveState.resolveSavedSceneIndex({ sceneIndex: Number.POSITIVE_INFINITY }, currentSceneIds), 0);
  assert.equal(saveState.resolveSavedSceneIndex({ sceneIndex: "1" }, currentSceneIds), 0);
  assert.equal(saveState.resolveSavedSceneIndex({ sceneId: 42, sceneIndex: 1 }, currentSceneIds), 1);
  assert.equal(saveState.resolveSavedSceneIndex({ sceneId: "photo", sceneIndex: 99 }, currentSceneIds), 0);
  assert.equal(saveState.resolveSavedSceneIndex({ sceneId: "photo", sceneIndex: 99 }, []), 0);
});

test("run-start memory remains inside zero and the current memory total", () => {
  assert.equal(saveState.normalizeRunStartMemory(40, 75), 40);
  assert.equal(saveState.normalizeRunStartMemory(-5, 75), 0);
  assert.equal(saveState.normalizeRunStartMemory(120, 75), 75);
  assert.equal(saveState.normalizeRunStartMemory(12.5, 75), 12.5);
});

test("legacy or corrupt run-start memory defaults to the current safe total", () => {
  assert.equal(saveState.normalizeRunStartMemory(undefined, 60), 60);
  assert.equal(saveState.normalizeRunStartMemory(null, 60), 60);
  assert.equal(saveState.normalizeRunStartMemory(Number.NaN, 60), 60);
  assert.equal(saveState.normalizeRunStartMemory(Number.POSITIVE_INFINITY, 60), 60);
  assert.equal(saveState.normalizeRunStartMemory("25", 60), 60);
});

test("invalid current memory cannot produce an unsafe baseline", () => {
  assert.equal(saveState.normalizeRunStartMemory(20, -10), 0);
  assert.equal(saveState.normalizeRunStartMemory(20, Number.NaN), 0);
  assert.equal(saveState.normalizeRunStartMemory(20, Number.POSITIVE_INFINITY), 0);
  assert.equal(saveState.normalizeRunStartMemory(20, "80"), 0);
});
