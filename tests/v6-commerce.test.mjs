import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import ts from "typescript";

const source = await readFile(new URL("../app/progression.ts", import.meta.url), "utf8");
const javascript = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.ES2022, target: ts.ScriptTarget.ES2022 },
}).outputText;
const progression = await import(`data:text/javascript;base64,${Buffer.from(javascript).toString("base64")}`);

test("five optional paid dialogue nodes are authored one per chapter", () => {
  const expectedIds = [
    "paid-photo-developing",
    "paid-lab-door",
    "paid-marriage-truth",
    "paid-two-cities-choice",
    "paid-reunion-hypothesis",
  ];
  assert.equal(progression.paidDialogues.length, 5);
  assert.deepEqual(progression.paidDialogues.map(item => item.id), expectedIds);
  assert.equal(new Set(progression.paidDialogues.map(item => item.chapterId)).size, 5);
  assert.equal(new Set(progression.paidDialogues.map(item => item.anchorSceneId)).size, 5);
  for (const dialogue of progression.paidDialogues) {
    assert.ok(dialogue.previewLine, `${dialogue.id} needs a free preview line`);
    assert.ok(dialogue.lockedLines.length >= 2 && dialogue.lockedLines.length <= 4, `${dialogue.id} should lock two to four lines`);
    assert.ok(dialogue.archiveTitle, `${dialogue.id} must remain addressable from the memory archive`);
  }
});

test("simulated products use the required one-yuan, chapter and full-pass prices", () => {
  const dialogue = progression.paidDialogues[0];
  assert.equal(progression.priceForProduct(`dialogue:${dialogue.id}`), 100);
  assert.equal(progression.priceForProduct(`chapter:${dialogue.chapterId}`), 290);
  assert.equal(progression.priceForProduct("full-pass"), 990);

  const initial = progression.createInitialProfile(1000);
  const purchased = progression.simulateLocalPurchase(initial, `dialogue:${dialogue.id}`, 2000);
  assert.equal(initial.entitlements.simulatedPurchases.length, 0, "purchase simulation must not mutate the prior save");
  assert.deepEqual(purchased.entitlements.simulatedPurchases, [{
    productId: `dialogue:${dialogue.id}`,
    priceFen: 100,
    at: 2000,
    provider: "local-demo",
  }]);
  assert.equal(progression.simulateLocalPurchase(purchased, `dialogue:${dialogue.id}`, 3000), purchased, "the same simulated product cannot be bought twice");
  assert.doesNotMatch(source, /\bfetch\s*\(|XMLHttpRequest|PaymentRequest|checkout\.session|createPayment/i);
});

test("direct, chapter and full-pass entitlements form a strict access matrix", () => {
  const [first, second, third] = progression.paidDialogues;
  const initial = progression.createInitialProfile();
  assert.equal(progression.hasDialogueAccess(initial.entitlements, first), false);
  assert.equal(progression.hasDialogueAccess(initial.entitlements, second), false);

  const direct = progression.simulateLocalPurchase(initial, `dialogue:${first.id}`);
  assert.equal(progression.hasDialogueAccess(direct.entitlements, first), true);
  assert.equal(progression.hasDialogueAccess(direct.entitlements, second), false);
  assert.equal(progression.hasFullDialogueAccess(direct.entitlements, first), false);
  assert.equal(progression.visibleDialogueLineCount(direct.entitlements, first), 1);
  assert.equal(progression.visibleDialogueLineCount(direct.entitlements, second), 0);
  assert.ok(first.lockedLines.length > progression.visibleDialogueLineCount(direct.entitlements, first));

  const chapter = progression.simulateLocalPurchase(direct, `chapter:${second.chapterId}`);
  assert.equal(progression.hasDialogueAccess(chapter.entitlements, first), true);
  assert.equal(progression.hasDialogueAccess(chapter.entitlements, second), true);
  assert.equal(progression.hasDialogueAccess(chapter.entitlements, third), false);
  assert.equal(progression.hasFullDialogueAccess(chapter.entitlements, second), true);
  assert.equal(progression.visibleDialogueLineCount(chapter.entitlements, second), second.lockedLines.length);
  assert.equal(progression.visibleDialogueLineCount(chapter.entitlements, first), 1);

  const fullPass = progression.simulateLocalPurchase(chapter, "full-pass");
  for (const dialogue of progression.paidDialogues) {
    assert.equal(progression.hasDialogueAccess(fullPass.entitlements, dialogue), true, `${dialogue.id} should be open through the full pass`);
    assert.equal(progression.hasFullDialogueAccess(fullPass.entitlements, dialogue), true);
    assert.equal(progression.visibleDialogueLineCount(fullPass.entitlements, dialogue), dialogue.lockedLines.length);
  }
});

test("offer recommendations escalate from segment to chapter pack to full pass", () => {
  const [first, second, third] = progression.paidDialogues;
  const initial = progression.createInitialProfile();
  assert.equal(progression.recommendOffer(initial, first), `dialogue:${first.id}`);

  const afterFirst = progression.simulateLocalPurchase(initial, `dialogue:${first.id}`);
  assert.equal(progression.recommendOffer(afterFirst, first), `chapter:${first.chapterId}`);
  assert.equal(progression.recommendOffer(afterFirst, second), `dialogue:${second.id}`);

  const afterChapter = progression.simulateLocalPurchase(afterFirst, `chapter:${first.chapterId}`);
  assert.equal(progression.recommendOffer(afterChapter, first), null);

  const completedOne = progression.completeChapter(afterChapter, "chapter1").profile;
  const completedTwo = progression.completeChapter(completedOne, "chapter2").profile;
  assert.equal(progression.recommendOffer(completedTwo, third), "full-pass");

  const directThird = progression.simulateLocalPurchase(completedTwo, `dialogue:${third.id}`);
  assert.equal(progression.recommendOffer(directThird, third), `chapter:${third.chapterId}`);

  const fullPass = progression.simulateLocalPurchase(directThird, "full-pass");
  assert.equal(progression.recommendOffer(fullPass, third), null);
});

test("upgrade credit is transparent and never exceeds the target price", () => {
  const [first, second, third] = progression.paidDialogues;
  let profile = progression.createInitialProfile();
  profile = progression.simulateLocalPurchase(profile, `dialogue:${first.id}`);
  profile = progression.simulateLocalPurchase(profile, `dialogue:${second.id}`);

  assert.deepEqual(progression.computeUpgradeCredit(profile, "full-pass"), {
    paidFen: 990,
    creditFen: 200,
    displayFen: 790,
  });

  let sameChapter = progression.createInitialProfile();
  sameChapter = progression.simulateLocalPurchase(sameChapter, `dialogue:${third.id}`);
  assert.deepEqual(progression.computeUpgradeCredit(sameChapter, `chapter:${third.chapterId}`), {
    paidFen: 290,
    creditFen: 100,
    displayFen: 190,
  });

  const saturated = {
    ...profile,
    entitlements: {
      ...profile.entitlements,
      directDialogues: [...progression.paidDialogues.map(item => item.id), ...progression.paidDialogues.map(item => item.id)],
      chapterPacks: [...progression.chapterIds],
    },
  };
  const credit = progression.computeUpgradeCredit(saturated, "full-pass");
  assert.equal(credit.creditFen, 990);
  assert.equal(credit.displayFen, 0);
});

test("remaining dialogue counts measure unrevealed lines rather than product ownership alone", () => {
  const first = progression.paidDialogues[0];
  const initial = progression.createInitialProfile();
  const allLockedLines = progression.paidDialogues.reduce((total, item) => total + item.lockedLines.length, 0);

  assert.equal(progression.unresolvedDialogueCount(initial), allLockedLines);
  assert.deepEqual(
    {
      nodes: progression.buildChapterSummary(initial, first.chapterId).lockedPaidCount,
      lines: progression.buildChapterSummary(initial, first.chapterId).remainingDialogueLines,
    },
    { nodes: 1, lines: first.lockedLines.length },
  );

  const direct = progression.simulateLocalPurchase(initial, `dialogue:${first.id}`);
  assert.equal(progression.unresolvedDialogueCount(direct), allLockedLines - 1);
  assert.equal(progression.buildChapterSummary(direct, first.chapterId).lockedPaidCount, 1);
  assert.equal(progression.buildChapterSummary(direct, first.chapterId).remainingDialogueLines, first.lockedLines.length - 1);

  const chapter = progression.simulateLocalPurchase(direct, `chapter:${first.chapterId}`);
  assert.equal(progression.unresolvedDialogueCount(chapter), allLockedLines - first.lockedLines.length);
  assert.equal(progression.buildChapterSummary(chapter, first.chapterId).lockedPaidCount, 0);
  assert.equal(progression.buildChapterSummary(chapter, first.chapterId).remainingDialogueLines, 0);
});
