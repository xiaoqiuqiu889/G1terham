import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import ts from "typescript";

const [page, css, audio, storySource] = await Promise.all([
  readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
  readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
  readFile(new URL("../app/audio-engine.ts", import.meta.url), "utf8"),
  readFile(new URL("../app/story.ts", import.meta.url), "utf8"),
]);
const storyJs = ts.transpileModule(storySource, {
  compilerOptions: { module: ts.ModuleKind.ES2022, target: ts.ScriptTarget.ES2022 },
}).outputText.replace(/^import .*?;\s*$/gm, "");
const story = await import(`data:text/javascript;base64,${Buffer.from(storyJs).toString("base64")}`);

test("expanded story has sustained scenes, chapters and skippable montages", () => {
  assert.ok(story.scenes.length >= 28);
  assert.ok(story.scenes.filter(scene => scene.kind === "chapter").length >= 5);
  assert.ok(story.scenes.filter(scene => scene.kind === "montage").length >= 2);
  assert.match(page, /显示全部/);
});

test("all three choices have configured feedback and nine later echoes", () => {
  assert.equal(Object.values(story.choiceEchoes).flatMap(Object.values).length, 9);
  for (const choiceId of story.choiceIds) {
    const scene = story.scenes.find(item => item.choiceId === choiceId);
    assert.equal(scene.choices.length, 3);
    scene.choices.forEach(option => {
      assert.ok(option.memory);
      assert.ok(option.confirmation);
      assert.ok(option.motif);
    });
  }
  assert.match(page, /reduced\?140:760/);
  assert.match(page, /disabled=\{Boolean\(selectedOption\)\}/);
  assert.match(page, /role="status"/);
});

test("back navigation and local saves preserve full snapshots", () => {
  assert.match(page, /type HistoryEntry/);
  assert.match(page, /setAnswers\(previous\.answers\)/);
  assert.match(page, /localStorage\.setItem\(SAVE_KEY/);
  assert.match(page, /继续上次记忆/);
  assert.match(page, /进度已保存到本设备/);
});

test("journal is literary, accessible and available on touch screens", () => {
  assert.match(page, /motif-strip/);
  assert.match(page, /memoryStrength\(scores\[key\]\)/);
  assert.match(page, /aria-modal="true"/);
  assert.match(page, /journalCloseRef\.current\?\.focus/);
  assert.match(page, /journalTriggerRef\.current\?\.focus/);
  assert.match(css, /\.top-actions button\{min-width:44px;min-height:44px/);
  assert.match(css, /\.choices\{grid-template-columns:1fr/);
  assert.match(css, /-webkit-overflow-scrolling:touch/);
  assert.doesNotMatch(css, /\.top-actions button:first-child\{display:none/);
});

test("quick replay is locked to three choices and compares every answer", () => {
  assert.equal(story.revisitScenes.length, 6);
  assert.equal(story.revisitScenes.filter(scene => scene.kind === "choice").length, 3);
  assert.match(page, /重访关键记忆/);
  assert.match(page, /上轮选择/);
  assert.match(page, /choice-comparison/);
  assert.match(page, /item\.before\?\.label/);
  assert.match(page, /item\.after\?\.label/);
});

test("sound system is opt-in, remembered and chapter-aware", () => {
  for (const chapter of ["chapter1","chapter2","chapter3","chapter4","chapter5"]) {
    assert.match(audio, new RegExp(chapter));
  }
  assert.match(page, /SOUND_KEY/);
  assert.match(page, /localStorage\.setItem\(SOUND_KEY/);
  assert.match(page, /声音关/);
  assert.match(audio, /cue\(type: Cue\)/);
  assert.match(audio, /stop\(\)/);
});

test("reduced motion and ritual ending remain available", () => {
  assert.match(css, /prefers-reduced-motion:reduce/);
  assert.match(page, /ending-ritual/);
  assert.match(page, /翻开最后一页/);
  assert.ok(story.endings.mixed);
  assert.equal(story.endings.mixed.title, "你记住了他们完整的矛盾");
});
