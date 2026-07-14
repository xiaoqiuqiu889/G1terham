import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import ts from "typescript";

const [source, analyticsSource, pageSource] = await Promise.all([
  readFile(new URL("../app/progression.ts", import.meta.url), "utf8"),
  readFile(new URL("../app/analytics.ts", import.meta.url), "utf8"),
  readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
]);

async function loadTs(moduleSource) {
  const javascript = ts.transpileModule(moduleSource, {
    compilerOptions: { module: ts.ModuleKind.ES2022, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  return import(`data:text/javascript;base64,${Buffer.from(javascript).toString("base64")}`);
}

const [progression, analytics] = await Promise.all([loadTs(source), loadTs(analyticsSource)]);

const expectedEvents = [
  "scene_enter",
  "interaction_start",
  "interaction_complete",
  "clue_discovered",
  "memory_value_change",
  "collectible_get",
  "paid_dialogue_impression",
  "paid_dialogue_unlock_click",
  "paid_dialogue_skip",
  "paid_dialogue_complete",
  "chapter_pack_impression",
  "chapter_pack_click",
  "full_pass_impression",
  "full_pass_click",
  "chapter_reward_reveal",
  "chapter_reward_claim",
  "chapter_complete",
  "next_chapter_start",
  "save_resume",
  "ending_complete",
  "revisit_start",
  "return_teaser_click",
];

function tierIdentity(tier) {
  assert.ok(tier, "memoryTier must return a tier contract");
  if (typeof tier === "string") return tier;
  return tier.id ?? tier.key ?? tier.label ?? tier.min;
}

test("the interaction catalog contains fifteen authored interactions across five chapters", () => {
  assert.equal(progression.interactionCatalog.length, 15);
  assert.equal(new Set(progression.interactionCatalog.map(item => item.id)).size, 15);
  assert.deepEqual([...progression.chapterIds], ["chapter1", "chapter2", "chapter3", "chapter4", "chapter5"]);

  for (const chapterId of progression.chapterIds) {
    const chapterInteractions = progression.interactionCatalog.filter(item => item.chapterId === chapterId);
    assert.equal(chapterInteractions.length, 3, `${chapterId} should own exactly three meaningful interactions`);
    assert.ok(chapterInteractions.some(item => item.isCore), `${chapterId} needs a chapter-defining core mechanic`);
  }

  const kinds = new Set(progression.interactionCatalog.map(item => item.kind));
  assert.ok(kinds.size >= 6, `expected at least six interaction grammars, found ${[...kinds].join(", ")}`);
  for (const item of progression.interactionCatalog) {
    assert.ok(item.memoryGain > 0, `${item.id} must produce visible memory progress`);
    assert.ok(item.action && item.completion, `${item.id} needs authored action and completion feedback`);
  }
  const authoredGain = progression.interactionCatalog.reduce((sum, item) => sum + item.memoryGain, 0);
  const chapterGain = progression.chapterContracts.reduce((sum, chapter) => sum + chapter.completionMemory, 0);
  assert.equal(authoredGain, 85, "the fifteen interactions should expose exactly 85 authored memory points");
  assert.equal(authoredGain + chapterGain, 100, "chapter completion bonuses should make a complete run reach 100");

  const required = progression.firstRunRequiredInteractions();
  const optional = progression.firstRunOptionalInteractions();
  assert.equal(required.length, 10);
  assert.deepEqual(optional.map(item => item.id), [
    "publication-clues",
    "discipline-record",
    "departure-packing",
    "dual-city-objects",
    "receipt-memory-combination",
  ]);
  assert.ok(required.every(item => item.requirement === "required"));
  assert.ok(optional.every(item => item.requirement === "optional"));
  assert.deepEqual(progression.firstRunRequiredInteractions("chapter2").map(item => item.id), ["names-decision"]);
  assert.deepEqual(progression.firstRunOptionalInteractions("chapter2").map(item => item.id), ["publication-clues", "discipline-record"]);
  assert.equal(progression.firstRunRequiredMemory(), 75, "a mainline run should reach the archive threshold without optional detours");
  assert.equal(progression.fullCollectionMemory(), 100, "all optional memories should complete the collection");
});

test("memory visibility tiers change only at 21, 41, 61 and 81", () => {
  const pairs = [[0, 20], [21, 40], [41, 60], [61, 80], [81, 100]];
  const identities = pairs.map(([start, end]) => {
    const first = tierIdentity(progression.memoryTier(start));
    assert.equal(tierIdentity(progression.memoryTier(end)), first);
    return first;
  });
  assert.equal(new Set(identities).size, 5, "all five visibility stages must be distinguishable");

  assert.equal(progression.nextMemoryUnlock(0).threshold, 21);
  assert.equal(progression.nextMemoryUnlock(0).remaining, 21);
  assert.equal(progression.nextMemoryUnlock(20).remaining, 1);
  assert.equal(progression.nextMemoryUnlock(21).threshold, 41);
  assert.equal(progression.nextMemoryUnlock(40).remaining, 1);
  assert.equal(progression.nextMemoryUnlock(60).threshold, 61);
  assert.equal(progression.nextMemoryUnlock(80).threshold, 81);
  assert.equal(progression.nextMemoryUnlock(80).remaining, 1);
  assert.equal(progression.nextMemoryUnlock(81), null);
  assert.equal(tierIdentity(progression.memoryTier(-5)), identities[0]);
  assert.equal(tierIdentity(progression.memoryTier(500)), identities[4]);
});

test("completing an interaction is immutable and idempotent", () => {
  const contract = progression.interactionCatalog.find(item => item.collectible && item.clue);
  assert.ok(contract, "fixture requires an interaction that grants both a clue and collectible");
  const initial = progression.createInitialProfile();
  const firstMutation = progression.completeInteraction(initial, contract.id);
  const once = firstMutation.profile;
  const secondMutation = progression.completeInteraction(once, contract.id);
  const twice = secondMutation.profile;

  assert.notEqual(once, initial, "completion should return a new profile");
  assert.equal(initial.progression.memoryExposure, 0, "the original profile must remain unchanged");
  assert.equal(firstMutation.changed, true);
  assert.equal(firstMutation.memoryGained, contract.memoryGain);
  assert.equal(once.progression.memoryExposure, contract.memoryGain);
  assert.equal(secondMutation.changed, false);
  assert.equal(secondMutation.memoryGained, 0);
  assert.equal(twice.progression.memoryExposure, once.progression.memoryExposure, "replaying a completed hotspot must not farm visibility");
  assert.equal(once.progression.completedInteractionIds.filter(id => id === contract.id).length, 1);
  assert.equal(twice.progression.completedInteractionIds.filter(id => id === contract.id).length, 1);
  assert.equal(twice.progression.discoveredClueIds.filter(id => id === contract.clue.id).length, 1);
  assert.equal(twice.progression.collectibleIds.filter(id => id === contract.collectible.id).length, 1);
});

test("five chapter rewards use exact JD demo codes and a no-value disclaimer", () => {
  const expectedCodes = [
    "JD-DEMO-LOVE-01",
    "JD-DEMO-NAMES-02",
    "JD-DEMO-ROAD-03",
    "JD-DEMO-CITIES-04",
    "JD-DEMO-MEMORY-05",
  ];
  const demo = "\u6f14\u793a";
  const noFaceValue = "\u65e0\u5b9e\u9645\u9762\u503c";
  const noRealValue = "\u65e0\u5b9e\u9645\u4ef7\u503c";
  const notRedeemable = "\u4e0d\u53ef\u5151\u6362";
  const forbiddenClaims = ["\u4eac\u4e1c\u5408\u4f5c", "\u4eac\u4e1c\u5b98\u65b9", "\u8054\u5408\u51fa\u54c1"];

  assert.equal(progression.chapterRewards.length, 5);
  assert.deepEqual(progression.chapterRewards.map(item => item.code), expectedCodes);
  assert.equal(new Set(progression.chapterRewards.map(item => item.chapterId)).size, 5);
  for (const reward of progression.chapterRewards) {
    assert.ok(reward.disclaimer.includes(demo) || /demo/i.test(reward.disclaimer));
    assert.ok(reward.disclaimer.includes(noFaceValue) || reward.disclaimer.includes(noRealValue));
    assert.ok(reward.disclaimer.includes(notRedeemable));
    const fullCopy = `${reward.title ?? ""} ${reward.prop ?? ""} ${reward.disclaimer}`;
    for (const claim of forbiddenClaims) assert.equal(fullCopy.includes(claim), false);
  }
});

test("the analytics contract exposes all twenty-two required local events", () => {
  assert.equal(analytics.gameEventNames.length, 22);
  assert.equal(new Set(analytics.gameEventNames).size, 22);
  assert.deepEqual(new Set(analytics.gameEventNames), new Set(expectedEvents));
});

test("multi-object exploration contracts expose all three authored steps", () => {
  for (const id of ["publication-clues", "discipline-record"]) {
    const contract = progression.interactionCatalog.find(item => item.id === id);
    assert.ok(contract, `${id} must exist`);
    assert.equal(contract.steps.length, 3, `${id} must not collapse into a one-click reveal`);
    assert.equal(new Set(contract.steps).size, 3);
  }
  assert.match(pageSource, /const interactionsVisible=.*montageComplete.*scene\.progressive/s);
  assert.match(pageSource, /if\(scene\.kind==="montage"\)\{\s*if\(!montageComplete\).*?if\(incompleteRequiredDiscoveryIds\.length\)return;/s);
  assert.match(pageSource, /if\(scene\.progressive&&beatIndex<sceneBody\.length-1\).*?if\(incompleteRequiredDiscoveryIds\.length\)return;/s);
  assert.match(pageSource, /disabled=\{.*?interactionsVisible&&incompleteRequiredDiscoveryIds\.length>0/s);
  assert.match(pageSource, /继续阅读/);
});

test("legacy and partial profiles normalize into a safe V6 save", () => {
  const firstDialogue = progression.paidDialogues[0];
  const normalized = progression.normalizeProfile({
    version: 5,
    progression: {
      memoryExposure: 140,
      completedInteractionIds: ["publication-clues", "publication-clues"],
      discoveredClueIds: ["clue", "clue"],
      collectibleIds: ["paper", "paper"],
      completedChapterIds: ["chapter1", "unknown", "chapter1"],
      axisValues: { speak: 2 },
    },
    entitlements: {
      directDialogues: [firstDialogue.id, firstDialogue.id],
      simulatedPurchases: [{
        productId: "dialogue:" + firstDialogue.id,
        priceFen: 100,
        at: 15,
        provider: "local-demo",
      }],
    },
    paidContent: {
      impressionIds: [firstDialogue.id, firstDialogue.id],
    },
    revisit: {
      visitsByChapter: { chapter1: 2 },
      dailyFragmentIds: ["0", "1"],
      specialEpilogue: "locked",
    },
    firstPlayedAt: 10,
    lastSeenAt: 20,
  }, 30);

  assert.equal(normalized.version, 6);
  assert.equal(normalized.progression.memoryExposure, 100);
  assert.deepEqual(normalized.progression.completedInteractionIds, ["publication-clues"]);
  assert.deepEqual(normalized.progression.completedChapterIds, ["chapter1"]);
  assert.deepEqual(normalized.progression.axisValues, { speak: 2, keep: 0, survive: 0 });
  assert.deepEqual(normalized.entitlements.directDialogues, [firstDialogue.id]);
  assert.equal(normalized.entitlements.fullPass, false);
  assert.deepEqual(normalized.entitlements.simulatedPurchases, [{
    productId: "dialogue:" + firstDialogue.id,
    priceFen: 100,
    listPriceFen: 100,
    creditFen: 0,
    payableFen: 100,
    at: 15,
    provider: "local-demo",
  }]);
  assert.deepEqual(normalized.paidContent.impressionIds, [firstDialogue.id]);
  assert.deepEqual(normalized.paidContent.completedIds, []);
  assert.equal(normalized.revisit.dailyFragmentClaimCount, 2, "old saves infer the claim counter from known fragments");
  assert.deepEqual(normalized.revisit.dailyFragmentIds, progression.dailyFragmentEntries.slice(0, 2).map(entry => entry.id), "legacy numeric fragment ids migrate to stable authored ids");
  assert.equal(normalized.revisit.visitsByChapter.chapter1, 2);
  assert.deepEqual(normalized.romance, { heartbeatIds: [], favoriteHeartbeatId: undefined, dailyMemoryRecords: [], unlockedMilestoneIds: [] }, "old saves receive a safe romance/replay state" );
});

test("daily fragment preview is side-effect free and is consumed only by an explicit claim", () => {
  const profile = progression.createInitialProfile();
  const before = structuredClone(profile);
  const firstEntry = progression.dailyFragmentEntries[0];
  const preview = progression.previewDailyFragment(profile, "2026-07-14");

  assert.deepEqual(preview, {
    available: true,
    fragment: firstEntry.text,
    fragmentId: firstEntry.id,
  });
  assert.deepEqual(profile, before, "preview must never mutate or consume the profile");
  assert.deepEqual(progression.previewDailyFragment(profile, "2026-07-14"), preview, "repeated previews remain stable before claiming");

  const claim = progression.claimDailyFragment(profile, "2026-07-14");
  assert.equal(claim.changed, true);
  assert.equal(claim.fragmentId, firstEntry.id);
  assert.deepEqual(progression.previewDailyFragment(claim.profile, "2026-07-14"), { available: false });
  assert.equal(progression.claimDailyFragment(claim.profile, "2026-07-14").changed, false);
});

test("daily fragments are idempotent per date and continue cycling after all five", () => {
  let profile = progression.createInitialProfile();
  const received = [];
  const receivedIds = [];
  for (let index = 0; index < 7; index += 1) {
    const dateKey = `2026-07-${String(index + 10).padStart(2, "0")}`;
    const claim = progression.claimDailyFragment(profile, dateKey);
    assert.equal(claim.changed, true);
    received.push(claim.fragment);
    receivedIds.push(claim.fragmentId);
    const duplicate = progression.claimDailyFragment(claim.profile, dateKey);
    assert.equal(duplicate.changed, false);
    assert.equal(duplicate.profile, claim.profile);
    profile = claim.profile;
  }
  assert.deepEqual(received, [
    ...progression.dailyFragments,
    progression.dailyFragments[0],
    progression.dailyFragments[1],
  ]);
  assert.deepEqual(receivedIds, [
    ...progression.dailyFragmentEntries.map(entry => entry.id),
    progression.dailyFragmentEntries[0].id,
    progression.dailyFragmentEntries[1].id,
  ]);
  assert.equal(profile.revisit.dailyFragmentClaimCount, 7);
  assert.equal(profile.revisit.dailyFragmentIds.length, progression.dailyFragments.length);
});

test("the special epilogue requires all chapters and sufficient exposure", () => {
  let shallow = progression.createInitialProfile();
  for (const chapterId of progression.chapterIds) shallow = progression.completeChapter(shallow, chapterId).profile;
  assert.equal(shallow.progression.memoryExposure, 15);
  assert.equal(shallow.revisit.specialEpilogue, "locked");
  assert.equal(progression.markSpecialEpilogueViewed(shallow), shallow);

  let complete = progression.createInitialProfile();
  for (const item of progression.interactionCatalog) complete = progression.completeInteraction(complete, item.id).profile;
  for (const chapterId of progression.chapterIds.slice(0, 4)) complete = progression.completeChapter(complete, chapterId).profile;
  assert.equal(complete.revisit.specialEpilogue, "locked", "exposure alone cannot bypass the final chapter");
  complete = progression.completeChapter(complete, "chapter5").profile;
  assert.equal(complete.progression.memoryExposure, 100);
  assert.equal(complete.revisit.specialEpilogue, "available");
  assert.equal(complete.progression.chapterRewards.chapter5, "revealed");
  assert.equal(progression.markSpecialEpilogueViewed(complete).revisit.specialEpilogue, "viewed");
});
