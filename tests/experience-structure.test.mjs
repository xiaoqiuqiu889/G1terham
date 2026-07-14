import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import test from "node:test";
import ts from "typescript";

const [page, css, audio, storySource, logicSource, launcher] = await Promise.all([
  readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
  readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
  readFile(new URL("../app/audio-engine.ts", import.meta.url), "utf8"),
  readFile(new URL("../app/story.ts", import.meta.url), "utf8"),
  readFile(new URL("../app/game-logic.ts", import.meta.url), "utf8"),
  readFile(new URL("../启动游戏.cmd", import.meta.url), "utf8"),
]);
const storyJs = ts.transpileModule(storySource, {
  compilerOptions: { module: ts.ModuleKind.ES2022, target: ts.ScriptTarget.ES2022 },
}).outputText.replace(/^import .*?;\s*$/gm, "");
const story = await import(`data:text/javascript;base64,${Buffer.from(storyJs).toString("base64")}`);
const logicJs = ts.transpileModule(logicSource, {
  compilerOptions: { module: ts.ModuleKind.ES2022, target: ts.ScriptTarget.ES2022 },
}).outputText;
const logic = await import(`data:text/javascript;base64,${Buffer.from(logicJs).toString("base64")}`);

test("main choices use speak, keep and survive through understandable actions", () => {
  const byId = Object.fromEntries(Object.values(story.memoryContracts).flat().map(option => [option.id, option.axis]));
  for (const id of ["poem","reporter","truth"]) assert.equal(byId[id], "speak");
  for (const id of ["kiss","book","escape"]) assert.equal(byId[id], "keep");
  for (const id of ["leave","burn","conceal"]) assert.equal(byId[id], "survive");
});

test("every main option fulfills the complete memory echo contract", () => {
  const options = Object.values(story.memoryContracts).flat();
  assert.equal(options.length, 9);
  for (const option of options) {
    for (const field of ["memory","confirmation","nearEcho","farEcho","endingFragment","revisitEcho","motif","sound"]) {
      assert.ok(option[field], `${option.id} missing ${field}`);
    }
  }
});

test("three resonance actions are configured and do not carry score axes", () => {
  assert.deepEqual(Object.keys(story.resonanceContracts), ["photo","email","gaze"]);
  for (const options of Object.values(story.resonanceContracts)) {
    assert.equal(options.length, 3);
    options.forEach(option => assert.equal("axis" in option, false));
  }
});

test("required full-run operations stay within 35 to 40", () => {
  const actions = logic.estimateMinimumActions(story.scenes) + 2; // 第三次协作直接切入第一次选择，净增加两次操作
  assert.ok(actions >= 35 && actions <= 40, `estimated actions: ${actions}`);
  assert.ok(story.scenes.findIndex(scene => scene.choiceId === "choice-one") <= 3);
  assert.match(page, /ProjectorRepair/);
});

test("late game keeps email and gaze as meaningful inputs", () => {
  const lateStart = Math.floor(story.scenes.length * 2 / 3);
  const lateIds = story.scenes.slice(lateStart).filter(scene => scene.kind === "resonance").map(scene => scene.resonanceId);
  assert.ok(lateIds.includes("email"));
  assert.ok(lateIds.includes("gaze"));
});

test("choice confirmation waits for the player after animation", () => {
  assert.match(page, /setTimeout\(\(\)=>\{setConfirmationReady\(true\);timerRef\.current=null\},700\)/);
  assert.match(page, /setConfirmationReady\(true\)/);
  assert.match(page, /带着这段记忆继续/);
  assert.match(page, /commitSelection/);
  const selectBlock = page.slice(page.indexOf("const selectOption="), page.indexOf("const commitSelection="));
  assert.doesNotMatch(selectBlock, /setSceneIndex|reduced\?80|prefers-reduced-motion/);
});

test("first echo is readable and reunion observation is not duplicated", () => {
  assert.ok(story.scenes.some(scene => scene.id === "echo-one"));
  assert.match(page, /echoChoiceByScene/);
  assert.match(page, /resolveFutureEchoes/);
  assert.ok(Object.values(story.futureEchoRoutes).every(routes => routes.length <= 2));
  assert.doesNotMatch(page, /scene\.id==="gaze"|scene\.id==="book"|scene\.id==="crossroads"/);
});

test("memory editing room compares future echoes after a five-second pause", () => {
  assert.equal(story.revisitScenes.filter(scene => scene.kind === "revisitEcho").length, 3);
  assert.match(page, /window\.setTimeout\(\(\)=>setEchoReady\(true\),5500\)/);
  assert.match(page, /沿用上轮/);
  assert.match(page, /futureBefore/);
  assert.match(page, /futureAfter/);
  assert.match(page, /未选择的记忆残片/);
});

test("prop and character continuity is explicit", () => {
  assert.match(storySource, /冲洗了两张(?:相同的|同版)照片/);
  assert.match(storySource, /六个月后获释/);
  assert.match(storySource, /父亲中风/);
  assert.match(storySource, /空荡的停车场/);
  assert.match(storySource, /记录流星|流星轨迹/);
  assert.doesNotMatch(storySource, /选择没有改变/);
});

test("photo reveal, arrival message and marriage dialogue keep their chronology", () => {
  const photo = story.scenes.find(scene => scene.id === "photo");
  const photoImmediateCopy = [
    ...(photo?.body ?? []),
    ...(photo?.resonances ?? []).flatMap(option => [
      option.label, option.detail, option.action, option.echo, option.confirmation,
    ].filter(Boolean)),
  ].join(" ");
  assert.doesNotMatch(photoImmediateCopy, /两张|另一张|同版/);

  const promiseCopy = story.scenes.find(scene => scene.id === "promise")?.body?.join(" ") ?? "";
  assert.match(promiseCopy, /冲洗了两张同版照片/);
  assert.match(promiseCopy, /女生带走一张，男生把另一张夹进诗集/);

  const airportCopy = story.scenes.find(scene => scene.id === "echo-three")?.body?.join(" ") ?? "";
  assert.match(airportCopy, /男生发来一条迟到的信息：“我到了。”/);
  const sanJoseCopy = story.scenes.find(scene => scene.id === "two-cities")?.beats?.join(" ") ?? "";
  assert.match(sanJoseCopy, /航班落地了。我在取行李。/);
  assert.doesNotMatch(sanJoseCopy, /给卡姆兰发：“我到了。”/);

  assert.equal(story.scenes.find(scene => scene.id === "kamran")?.paidDialogueId, "paid-marriage-truth");
  assert.notEqual(story.scenes.find(scene => scene.id === "last-email")?.paidDialogueId, "paid-marriage-truth");
});

test("early intimacy and present-day relationships are built through concrete reciprocal actions", () => {
  const firstChoiceCopy = story.scenes.find(scene => scene.id === "choice-one")?.body ?? [];
  assert.ok(firstChoiceCopy.length >= 3);
  assert.match(firstChoiceCopy.slice(0, -1).join(" "), /20:03/);
  assert.match(firstChoiceCopy.slice(0, -1).join(" "), /电影票背面/);
  assert.match(firstChoiceCopy.slice(0, -1).join(" "), /半颗石榴/);

  const publicationCopy = story.scenes.find(scene => scene.id === "publication")?.body?.join(" ") ?? "";
  assert.match(publicationCopy, /蓝铅笔.*小太阳/);
  assert.doesNotMatch(publicationCopy, /六个月后获释|儿童图书馆/);
  const disciplineCopy = story.scenes.find(scene => scene.id === "echo-two")?.body?.join(" ") ?? "";
  assert.match(disciplineCopy, /儿童图书馆/);
  assert.match(disciplineCopy, /蓝铅笔画的小太阳/);

  const kamranCopy = story.scenes.find(scene => scene.id === "kamran")?.body?.join(" ") ?? "";
  assert.match(kamranCopy, /接触印样/);
  assert.match(kamranCopy, /请她替摄影投稿选一格/);
  assert.match(kamranCopy, /当场划掉那张/);
  const cityCopy = story.scenes.find(scene => scene.id === "two-cities")?.beats?.join(" ") ?? "";
  assert.match(cityCopy, /玛丽亚姆.*误差范围.*坏传感器/);
  assert.match(cityCopy, /男生.*望远镜跟踪架.*流星轨迹/);
});

test("first-run journal hides axes while post-game unlocks explanations", () => {
  assert.match(page, /!unlocked\?/);
  assert.match(page, /通关后解锁 · 三种动作/);
  assert.match(page, /记忆天气/);
});

test("object closeups and restrained sound motifs cover all required props", () => {
  for (const motif of ["photo","paper","ash","ticket","email"]) assert.match(audio, new RegExp(motif));
  assert.match(css, /\.object-shot/);
  const objects = new Set(story.scenes.map(scene => scene.object).filter(Boolean));
  for (const object of ["photo","ticket","poem","list","email","book"]) assert.ok(objects.has(object));
});

test("resonance actions use three physical interaction languages and literary confirmations", () => {
  for (const options of Object.values(story.resonanceContracts)) {
    for (const option of options) assert.ok(option.confirmation);
  }
  for (const component of ["PhotoInteraction","EmailInteraction","GazeInteraction"]) assert.match(page, new RegExp(`function ${component}`));
  for (const type of ["photo","email","gaze"]) assert.match(css, new RegExp(`\\.${type}-interaction`));
  assert.doesNotMatch(page, /不改变分数|历史不会改变/);
  assert.match(page, /onDrop/);
  assert.match(page, /<textarea/);
  assert.match(page, /gaze-hotspot/);
});

test("journal and ending expose literary state without flattening all memories", () => {
  assert.match(page, /paperState/);
  assert.match(page, /lightState/);
  assert.match(page, /distanceState/);
  assert.match(page, /三个主动作/);
  assert.match(page, /三个镜头锚点/);
  assert.match(page, /查看本轮剪辑 \/ 记忆档案/);
  assert.match(page, /selectUnchosenFragments/);
  assert.match(page, /trapFocus/);
  assert.doesNotMatch(page, /第 \{pad\(sceneNumber\)\} \/ \{pad\(totalScenes\)\} 幕/);
});

test("near echoes receive a visible object signature", () => {
  assert.match(page, /echo-signature/);
  assert.match(page, /回声抵达/);
});
test("chapter-aware music remains restrained and explicitly opt-in", () => {
  for (const marker of ["shurCents","startPersianTheme","santurSpark","tombak","musicTimer"]) assert.match(audio, new RegExp(marker));
  assert.match(page, /useState\(false\)/);
  assert.match(page, /有声进入/);
  assert.match(page, /静音进入/);
  assert.doesNotMatch(page, /波斯调式音乐 · 默认关闭/);
  assert.match(page, /音乐开/);
});

test("art library retains V4 shots and integrates the canonical V5 continuity set", async () => {
  const [v2, v3, v4, v5] = await Promise.all([
    readdir(new URL("../public/art-v2/", import.meta.url)),
    readdir(new URL("../public/art-v3/", import.meta.url)),
    readdir(new URL("../public/art-v4/", import.meta.url)),
    readdir(new URL("../public/art-v5/", import.meta.url)),
  ]);
  const png = files => files.filter(file => file.endsWith(".png"));
  const expectedV4 = [
    "university-gate-autumn.png", "underground-projector-close.png", "graduation-photo-day.png",
    "student-publication-room.png", "dorm-search-night.png", "university-gate-expulsion.png",
    "video-call-kamran.png", "final-rooftop-night.png", "airport-clock-goodbye.png",
    "localization-office.png", "maryam-telescope-rooftop.png", "email-delete-night.png",
    "istanbul-cafe-arrival.png", "poetry-book-photo-close.png",
  ];
  assert.equal(png(v4).length, 14);
  assert.ok(png(v2).length + png(v3).length + png(v4).length + png(v5).length >= 38);
  for (const asset of expectedV4) {
    assert.ok(v4.includes(asset), `missing ${asset}`);
  }
  const expectedV5 = [
    "canonical-graduation-photo.png", "graduation-photo-day.png", "istanbul-cafe-photo-close.png",
    "istanbul-reunion-aged.png", "istanbul-reunion-aged-mobile.png", "poetry-book-photo-close.png",
    "istanbul-crossroads-aged.png", "istanbul-crossroads-aged-mobile.png",
    "san-jose-arrival-2011.png", "san-jose-arrival-2011-mobile.png",
  ];
  for (const asset of expectedV5) {
    assert.ok(v5.includes(asset), `missing ${asset}`);
    assert.match(storySource + page, new RegExp(asset.replace(".", "\\.")), `unreferenced ${asset}`);
  }
  assert.match(page, /scene\.arts/);
  assert.match(page, /key=\{imageSrc\}/);
  assert.ok(story.scenes.some(scene => scene.kind === "montage" && scene.arts?.length === 3));
});

test("U.S. departure continuity stays at airports, never a railway station", () => {
  assert.match(storySource, /德黑兰国际机场/);
  assert.match(storySource, /国际出发大厅/);
  assert.match(storySource, /安检口/);
  assert.doesNotMatch(storySource, /火车站|列车因此|确认了车次|art-v2\/departure-station/);
});
test("desktop and mobile controls remain available", () => {
  assert.match(page, /handleSceneClick/);
  assert.match(page, /event\.key===" "/);
  assert.match(css, /\.choices\{grid-template-columns:1fr/);
  assert.match(css, /min-width:44px;min-height:44px/);
  assert.match(css, /prefers-reduced-motion:reduce/);
});

test("launcher uses installed vinext directly and has package-manager fallbacks", () => {
  assert.match(launcher, /node_modules\\\.bin\\vinext\.cmd/);
  assert.match(launcher, /BUNDLED_ROOT/);
  assert.match(launcher, /EnableDelayedExpansion/);
  assert.match(launcher, /npm\.cmd/);
  assert.match(launcher, /pnpm\.cmd/);
  assert.match(launcher, /ci --ignore-scripts --no-audit --no-fund/);
  assert.match(launcher, /--bootstrap-check/);
  assert.match(launcher, /call "!PACKAGE_COMMAND!" --version/);
  assert.match(launcher, /read-only for the current Windows account/);
  assert.match(launcher, /%USERPROFILE%/);
  assert.doesNotMatch(launcher, /call "%PNPM%"/);
  assert.doesNotMatch(launcher, /^:[a-z_]+/gim);
});
