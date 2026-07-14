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

const [story, progression] = await Promise.all([
  loadTs("../app/story.ts"),
  loadTs("../app/progression.ts"),
]);

function assertUnique(values, label) {
  const duplicates = values.filter((value, index) => values.indexOf(value) !== index);
  assert.equal(
    new Set(values).size,
    values.length,
    `${label} must be unique; duplicates: ${[...new Set(duplicates)].join(", ") || "none"}`,
  );
}

function findOnlyMainScene(sceneId, owner) {
  const matches = story.scenes.filter(scene => scene.id === sceneId);
  assert.equal(matches.length, 1, `${owner} must point to exactly one main scene: ${sceneId}`);
  return matches[0];
}

test("scene identities are unique inside each authored timeline", () => {
  assert.equal(story.scenes.length, 25);
  assertUnique(story.scenes.map(scene => scene.id), "main scene ids");
  assertUnique(story.revisitScenes.map(scene => scene.id), "revisit scene ids");

  const revisitIds = new Set(story.revisitScenes.map(scene => scene.id));
  const sharedIds = story.scenes
    .map(scene => scene.id)
    .filter(sceneId => revisitIds.has(sceneId))
    .sort();

  assert.deepEqual(
    sharedIds,
    [...story.choiceIds].sort(),
    "only the three canonical choice scenes may be reused by the revisit timeline",
  );
});

test("all fifteen interactions have a one-to-one, bidirectional scene route", () => {
  assert.equal(progression.interactionCatalog.length, 15);
  assertUnique(progression.interactionCatalog.map(item => item.id), "interaction ids");

  const storyRoutes = story.scenes.flatMap(scene =>
    (scene.interactionIds ?? []).map(interactionId => ({ interactionId, sceneId: scene.id })),
  );
  assert.equal(storyRoutes.length, 15, "story must expose exactly fifteen interaction routes");
  assertUnique(storyRoutes.map(route => route.interactionId), "story interaction routes");

  const interactionsById = new Map(
    progression.interactionCatalog.map(interaction => [interaction.id, interaction]),
  );

  for (const interaction of progression.interactionCatalog) {
    const scene = findOnlyMainScene(interaction.sceneId, interaction.id);
    assert.equal(
      (scene.interactionIds ?? []).filter(id => id === interaction.id).length,
      1,
      `${interaction.id} must appear exactly once in ${interaction.sceneId}.interactionIds`,
    );
  }

  for (const route of storyRoutes) {
    const interaction = interactionsById.get(route.interactionId);
    assert.ok(interaction, `${route.interactionId} must exist in interactionCatalog`);
    assert.equal(
      interaction.sceneId,
      route.sceneId,
      `${route.interactionId} disagrees between story and progression`,
    );
  }
});

test("all five paid dialogues have a one-to-one, bidirectional scene route", () => {
  assert.equal(progression.paidDialogues.length, 5);
  assertUnique(progression.paidDialogues.map(dialogue => dialogue.id), "paid dialogue ids");
  assertUnique(
    progression.paidDialogues.map(dialogue => dialogue.anchorSceneId),
    "paid dialogue anchor scene ids",
  );

  const storyRoutes = story.scenes
    .filter(scene => scene.paidDialogueId)
    .map(scene => ({ dialogueId: scene.paidDialogueId, sceneId: scene.id }));
  assert.equal(storyRoutes.length, 5, "story must expose exactly five paid dialogue routes");
  assertUnique(storyRoutes.map(route => route.dialogueId), "story paid dialogue routes");

  const dialoguesById = new Map(
    progression.paidDialogues.map(dialogue => [dialogue.id, dialogue]),
  );

  for (const dialogue of progression.paidDialogues) {
    const scene = findOnlyMainScene(dialogue.anchorSceneId, dialogue.id);
    assert.equal(
      scene.paidDialogueId,
      dialogue.id,
      `${dialogue.id} must be declared by its anchor scene`,
    );
  }

  for (const route of storyRoutes) {
    const dialogue = dialoguesById.get(route.dialogueId);
    assert.ok(dialogue, `${route.dialogueId} must exist in paidDialogues`);
    assert.equal(
      dialogue.anchorSceneId,
      route.sceneId,
      `${route.dialogueId} disagrees between story and progression`,
    );
  }
});

test("chapter ends and rewards are complete, unique and bidirectional", () => {
  assert.equal(progression.chapterContracts.length, 5);
  assert.equal(progression.chapterRewards.length, 5);
  assertUnique(progression.chapterContracts.map(chapter => chapter.id), "chapter ids");
  assertUnique(progression.chapterContracts.map(chapter => chapter.endSceneId), "chapter end scene ids");
  assertUnique(progression.chapterRewards.map(reward => reward.chapterId), "reward ids");
  assertUnique(progression.chapterRewards.map(reward => reward.sourceSceneId), "reward source scene ids");

  const endRoutes = story.scenes
    .filter(scene => scene.chapterEnd)
    .map(scene => ({ chapterId: scene.chapterEnd, sceneId: scene.id }));
  const rewardRoutes = story.scenes
    .filter(scene => scene.rewardId)
    .map(scene => ({ chapterId: scene.rewardId, sceneId: scene.id }));

  assert.equal(endRoutes.length, 5, "story must expose exactly five chapter ends");
  assert.equal(rewardRoutes.length, 5, "story must expose exactly five reward routes");
  assertUnique(endRoutes.map(route => route.chapterId), "story chapter end routes");
  assertUnique(rewardRoutes.map(route => route.chapterId), "story reward routes");

  const chapterById = new Map(
    progression.chapterContracts.map(chapter => [chapter.id, chapter]),
  );
  const rewardById = new Map(
    progression.chapterRewards.map(reward => [reward.chapterId, reward]),
  );

  for (const chapter of progression.chapterContracts) {
    const scene = findOnlyMainScene(chapter.endSceneId, chapter.id);
    const reward = rewardById.get(chapter.id);
    assert.ok(reward, `${chapter.id} must have a reward contract`);
    assert.equal(scene.chapterEnd, chapter.id, `${chapter.id} end scene must declare chapterEnd`);
    assert.equal(scene.rewardId, chapter.id, `${chapter.id} end scene must declare rewardId`);
    assert.equal(
      reward.sourceSceneId,
      chapter.endSceneId,
      `${chapter.id} reward source must match its chapter end`,
    );
  }

  for (const route of endRoutes) {
    const chapter = chapterById.get(route.chapterId);
    assert.ok(chapter, `${route.chapterId} must exist in chapterContracts`);
    assert.equal(chapter.endSceneId, route.sceneId);
  }

  for (const route of rewardRoutes) {
    const reward = rewardById.get(route.chapterId);
    assert.ok(reward, `${route.chapterId} must exist in chapterRewards`);
    assert.equal(reward.sourceSceneId, route.sceneId);
  }
});

test("every chapter core interaction belongs to that chapter", () => {
  const interactionsById = new Map(
    progression.interactionCatalog.map(interaction => [interaction.id, interaction]),
  );
  const declaredCoreIds = progression.chapterContracts.map(chapter => chapter.coreInteractionId);
  assertUnique(declaredCoreIds, "chapter core interaction ids");

  for (const chapter of progression.chapterContracts) {
    const interaction = interactionsById.get(chapter.coreInteractionId);
    assert.ok(interaction, `${chapter.id} core interaction must exist`);
    assert.equal(interaction.chapterId, chapter.id, `${chapter.id} core interaction must belong to it`);
    assert.equal(interaction.isCore, true, `${chapter.coreInteractionId} must be declared isCore`);
  }

  assert.deepEqual(
    progression.interactionCatalog
      .filter(interaction => interaction.isCore)
      .map(interaction => interaction.id)
      .sort(),
    declaredCoreIds.sort(),
    "isCore interactions and chapter coreInteractionIds must describe the same set",
  );
});

test("runtime choices and resonances each hydrate three owner-scoped unique options", () => {
  assert.equal(story.choiceIds.length, 3);
  assert.equal(story.resonanceIds.length, 3);
  assertUnique(story.choiceIds, "choice ids");
  assertUnique(story.resonanceIds, "resonance ids");
  assert.deepEqual(Object.keys(story.memoryContracts).sort(), [...story.choiceIds].sort());
  assert.deepEqual(Object.keys(story.resonanceContracts).sort(), [...story.resonanceIds].sort());

  const groups = [
    ...story.choiceIds.map(groupId => ({
      groupId,
      kind: "choice",
      options: story.memoryContracts[groupId],
    })),
    ...story.resonanceIds.map(groupId => ({
      groupId,
      kind: "resonance",
      options: story.resonanceContracts[groupId],
    })),
  ];

  const compositeOptionIds = [];
  for (const group of groups) {
    assert.equal(group.options.length, 3, `${group.kind} ${group.groupId} must have three options`);
    assertUnique(
      group.options.map(option => option.id),
      `${group.kind} ${group.groupId} option ids`,
    );
    compositeOptionIds.push(
      ...group.options.map(option => `${group.kind}:${group.groupId}:${option.id}`),
    );
  }
  assertUnique(compositeOptionIds, "owner-scoped option ids");

  const allScenes = [...story.scenes, ...story.revisitScenes];
  for (const scene of allScenes) {
    if (scene.choiceId) {
      assert.ok(story.choiceIds.includes(scene.choiceId), `${scene.id} has an unknown choiceId`);
      assert.deepEqual(
        scene.choices?.map(option => option.id),
        story.memoryContracts[scene.choiceId].map(option => option.id),
        `${scene.id} must hydrate choices from its runtime contract`,
      );
    }
    if (scene.resonanceId) {
      assert.ok(story.resonanceIds.includes(scene.resonanceId), `${scene.id} has an unknown resonanceId`);
      assert.deepEqual(
        scene.resonances?.map(option => option.id),
        story.resonanceContracts[scene.resonanceId].map(option => option.id),
        `${scene.id} must hydrate resonances from its runtime contract`,
      );
    }
  }

  for (const choiceId of story.choiceIds) {
    assert.ok(allScenes.some(scene => scene.choiceId === choiceId), `${choiceId} must be routed by a scene`);
  }
  for (const resonanceId of story.resonanceIds) {
    assert.ok(allScenes.some(scene => scene.resonanceId === resonanceId), `${resonanceId} must be routed by a scene`);
  }
});
