import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import ts from "typescript";

const [pageSource, storySource, logicSource, cssSource, readme, contract] = await Promise.all([
  readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
  readFile(new URL("../app/story.ts", import.meta.url), "utf8"),
  readFile(new URL("../app/game-logic.ts", import.meta.url), "utf8"),
  readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
  readFile(new URL("../README.md", import.meta.url), "utf8"),
  readFile(new URL("../docs/V5-DESIGN-CONTRACT.md", import.meta.url), "utf8"),
]);

async function loadTs(source) {
  const javascript = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.ES2022, target: ts.ScriptTarget.ES2022 },
  }).outputText.replace(/^import .*?;\s*$/gm, "");
  return import(`data:text/javascript;base64,${Buffer.from(javascript).toString("base64")}`);
}

const story = await loadTs(storySource);
const logic = await loadTs(logicSource);

function routeId(route) {
  if (typeof route === "string") return route;
  return route.memoryId ?? route.choiceId ?? route.resonanceId ?? route.sourceId ?? route.id ?? "";
}

function routeIds(sceneId) {
  return (story.futureEchoRoutes?.[sceneId] ?? []).map(routeId);
}

test("README and design contract agree on locked endpoints and writable micro-actions", () => {
  for (const document of [readme, contract]) {
    for (const endpoint of ["被处分", "离开", "结婚", "重逢"]) assert.match(document, new RegExp(endpoint));
    assert.match(document, /宏观端点/);
    assert.match(document, /微观动作/);
    assert.match(document, /说出/);
    assert.match(document, /留住/);
    assert.match(document, /活下去/);
  }
  assert.doesNotMatch(readme, /玩家无法改变已经发生的历史|所有历史完全不可改变/);
});

test("player-facing title uses the endpoint contract without development-version copy", () => {
  assert.match(pageSource, /她被处分/);
  assert.match(pageSource, /离开/);
  assert.match(pageSource, /结婚/);
  assert.match(pageSource, /重逢/);
  assert.match(pageSource, /有声进入/);
  assert.match(pageSource, /静音进入/);
  assert.doesNotMatch(pageSource, /记忆剪辑 V[0-9]|波斯调式音乐\s*[·・]\s*默认关闭/);
});

test("photo, email and gaze are three distinct physical interaction components", () => {
  for (const component of ["PhotoInteraction", "EmailInteraction", "GazeInteraction"]) {
    assert.match(pageSource, new RegExp(`function\\s+${component}\\b`), `missing ${component}`);
  }
  for (const className of ["photo-interaction", "email-interaction", "gaze-interaction"]) {
    assert.match(cssSource, new RegExp(`\\.${className}\\b`), `missing .${className}`);
  }
  assert.match(pageSource, /onDragStart|draggable=/);
  assert.match(pageSource, /onDrop/);
  assert.match(pageSource, /正面朝上/);
  assert.match(pageSource, /反面朝上/);
  assert.match(pageSource, /收回包里/);
  assert.match(pageSource, /<textarea|role="textbox"/);
  assert.match(pageSource, /onPointerDown/);
  assert.match(pageSource, /onPointerUp|onPointerCancel/);
  assert.match(pageSource, /gaze-hotspot/);
  assert.match(pageSource, /手与白发/);
  assert.match(pageSource, /诗集/);
  assert.match(pageSource, /时钟与机场方向/);
});

test("physical confirmation and gaze layers keep their own layout space", () => {
  assert.match(pageSource, /inline\??:boolean/);
  assert.match(pageSource, /<ConfirmationCard inline label="照片落下"/);
  assert.match(pageSource, /<ConfirmationCard inline label="视线停住"/);
  assert.match(pageSource, /aria-pressed=\{active\}/);
  assert.match(cssSource, /\.choice-memory\.inline\{position:relative;inset:auto/);
  assert.match(cssSource, /\.dropzone:not\(\.selected\)/);
  assert.match(cssSource, /\.dropzone\.selected/);
  assert.match(cssSource, /\.physical-gaze \.scene-copy\{z-index:7;left:auto/);
  assert.match(cssSource, /\.physical-gaze \.dialogue:first-child/);
  assert.match(cssSource, /\.gaze-hotspots\.has-selection \.gaze-hotspot:not\(\.selected\)/);
  assert.doesNotMatch(cssSource, /result-bag \.movable-photo\{transform:translateX\(calc\(300%/);
});

test("main choices separate action, confirmation and future/ending echoes", () => {
  const options = Object.values(story.memoryContracts).flat();
  assert.equal(options.length, 9);
  for (const option of options) {
    for (const field of ["action", "confirmation", "nearEcho", "farEcho", "endingFragment", "revisitEcho"]) {
      assert.ok(option[field], `${option.id} missing ${field}`);
    }
    assert.notEqual(option.confirmation, option.farEcho, `${option.id} repeats confirmation as farEcho`);
    assert.notEqual(option.nearEcho, option.farEcho, `${option.id} repeats nearEcho as farEcho`);
  }
});

test("the list choice withholds Mazya's future and states a gain and cost", () => {
  const index = story.scenes.findIndex(scene => scene.choiceId === "choice-two");
  assert.ok(index >= 0);
  const scene = story.scenes[index];
  const beforeChoice = (scene.body ?? []).join(" ");
  assert.match(beforeChoice, /二十八/);
  assert.match(beforeChoice, /去向不明/);
  assert.match(beforeChoice, /搜查/);
  assert.doesNotMatch(beforeChoice, /六个月后|获释/);
  const afterChoice = story.scenes.slice(index + 1).flatMap(item => item.body ?? []).join(" ");
  assert.match(afterChoice, /六个月后/);
  assert.match(afterChoice, /获释/);

  const options = Object.fromEntries(story.memoryContracts["choice-two"].map(option => [option.id, option]));
  assert.match(`${options.reporter?.detail} ${options.reporter?.action}`, /脱离控制/);
  assert.match(`${options.book?.detail} ${options.book?.action}`, /搜查风险/);
  assert.match(`${options.burn?.detail} ${options.burn?.action}`, /核验/);
});

test("all final-night options explicitly position Kamran", () => {
  const options = story.memoryContracts["choice-three"];
  assert.equal(options.length, 3);
  for (const option of options) assert.match(`${option.label} ${option.detail} ${option.action}`, /卡姆兰/);
  assert.ok(options.some(option => /一次说完/.test(`${option.detail} ${option.action}`)));
  assert.ok(options.some(option => /另一条路/.test(`${option.detail} ${option.action}`)));
  assert.ok(options.some(option => /信封/.test(`${option.detail} ${option.action}`)));
});

test("future echoes are configured and no future scene receives more than two", () => {
  assert.ok(story.futureEchoRoutes && typeof story.futureEchoRoutes === "object");
  for (const [sceneId, routes] of Object.entries(story.futureEchoRoutes)) {
    assert.ok(routes.length <= 2, `${sceneId} has ${routes.length} dynamic echoes`);
  }
  const cafeRoutes = [...routeIds("cafe-arrival"), ...routeIds("gaze")];
  assert.ok(cafeRoutes.includes("choice-one"));
  const arrivalRoutes = [...routeIds("arash-arrival"), ...routeIds("gaze")];
  assert.ok(arrivalRoutes.includes("email"));
  assert.deepEqual(new Set(routeIds("book")), new Set(["photo", "choice-two"]));
  assert.deepEqual(routeIds("crossroads"), ["choice-three"]);
  const routedSources = Object.values(story.futureEchoRoutes).flat().map(routeId);
  assert.equal(routedSources.includes("gaze"), false, "gaze should alter the final lens, not repeat as a next-scene echo");
});

test("cinematic epilogue precedes a collapsed memory archive", () => {
  assert.equal(typeof logic.composeCinematicEpilogue, "function");
  assert.match(pageSource, /composeCinematicEpilogue/);
  assert.match(pageSource, /<details/);
  assert.match(pageSource, /查看本轮剪辑|记忆档案/);
  assert.doesNotMatch(pageSource, /<details[^>]*\sopen(?:=|\s|>)/);
  assert.match(logicSource + storySource, /卡姆兰/);
  assert.match(logicSource + storySource, /玛丽亚姆/);
  assert.match(logicSource + storySource, /她没有让一种记忆替另外两种作证/);

  const allSpeak = Object.fromEntries(story.choiceIds.map(id => [id, { ...story.memoryContracts[id][0], choiceId: id }]));
  const mixed = Object.fromEntries(story.choiceIds.map((id, index) => [id, { ...story.memoryContracts[id][index], choiceId: id }]));
  for (const [endingKey, answers] of [["speak", allSpeak], ["mixed", mixed]]) {
    const epilogue = logic.composeCinematicEpilogue(endingKey, answers, {
      photo: { ...story.resonanceContracts.photo[0], resonanceId: "photo", optionId: "front" },
    });
    assert.ok(epilogue.length >= 80 && epilogue.length <= 120, `${endingKey} epilogue length: ${epilogue.length}`);
    assert.match(epilogue, /卡姆兰/);
    assert.match(epilogue, /玛丽亚姆/);
    assert.match(epilogue, /毕业照/);
  }
});

test("editing room offers quick and complete re-edits and defaults to changed fragments", () => {
  assert.match(pageSource, /快速重剪/);
  assert.match(pageSource, /完整重剪/);
  assert.match(pageSource, /revisit-quick|quickRevisit|startQuickRevisit/);
  assert.match(pageSource, /revisit-full|fullRevisit|startFullRevisit/);
  assert.match(pageSource, /filter\([^)]*changed|changedOnly/);
});

test("all graduation-photo uses point back to one canonical asset", () => {
  const canonical = "canonical-graduation-photo.png";
  const references = (storySource + pageSource).match(new RegExp(canonical.replace(".", "\\."), "g")) ?? [];
  assert.ok(references.length >= 3, `expected at least three references to ${canonical}, found ${references.length}`);
});

test("first-run hierarchy stays cinematic and accessible", () => {
  assert.match(pageSource, /自动保存/);
  assert.match(pageSource, /prefers-reduced-motion/);
  assert.match(pageSource, /aria-live|role="status"/);
  assert.match(cssSource, /min-width:\s*44px|min-height:\s*44px/);
  assert.match(cssSource, /@media\s*\([^)]*max-width/);
});
