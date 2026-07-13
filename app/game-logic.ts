export type Axis = "speak" | "keep" | "survive";
export type EndingKey = Axis | "mixed";
export type Scores = Record<Axis, number>;

export type AnswerRecord = {
  choiceId: string;
  optionId: string;
  label: string;
  axis: Axis;
  memory: string;
  motif: string;
  sound: string;
  nearEcho: string;
  farEcho: string;
  endingFragment: string;
  revisitEcho: string;
};

export type ResonanceRecord = {
  resonanceId: string;
  optionId: string;
  label: string;
  motif: string;
  echo: string;
  endingFragment: string;
  sound: string;
};

export const emptyScores = (): Scores => ({ speak: 0, keep: 0, survive: 0 });

export function scoreAnswers(answers: Record<string, AnswerRecord>): Scores {
  return Object.values(answers).reduce((scores, answer) => {
    scores[answer.axis] += 1;
    return scores;
  }, emptyScores());
}

export function determineEnding(scores: Scores): EndingKey {
  const entries = Object.entries(scores) as [Axis, number][];
  const highest = Math.max(...entries.map(([, value]) => value));
  const leaders = entries.filter(([, value]) => value === highest);
  return leaders.length === 1 ? leaders[0][0] : "mixed";
}

export function memoryStrength(value: number): "微弱" | "清晰" | "强烈" {
  if (value <= 1) return "微弱";
  if (value === 2) return "清晰";
  return "强烈";
}

export function composeEndingFragments(
  answers: Record<string, AnswerRecord>,
  resonances: Record<string, ResonanceRecord>,
  choiceOrder: string[],
  resonanceOrder: string[],
) {
  return [
    ...choiceOrder.flatMap((id) => answers[id]?.endingFragment ? [answers[id].endingFragment] : []),
    ...resonanceOrder.flatMap((id) => resonances[id]?.endingFragment ? [resonances[id].endingFragment] : []),
  ];
}

export function choiceDiff(
  previous: Record<string, AnswerRecord>,
  current: Record<string, AnswerRecord>,
  choiceIds: string[],
) {
  return choiceIds.map((choiceId) => ({
    choiceId,
    before: previous[choiceId] ?? null,
    after: current[choiceId] ?? null,
    changed: previous[choiceId]?.optionId !== current[choiceId]?.optionId,
    futureBefore: previous[choiceId]?.revisitEcho ?? "",
    futureAfter: current[choiceId]?.revisitEcho ?? "",
  }));
}

export function estimateMinimumActions(scenes: Array<{
  kind: string;
  body?: string[];
  progressive?: boolean;
}>) {
  return 1 + scenes.reduce((total, scene) => {
    let actions = 1;
    if (scene.kind === "choice" || scene.kind === "resonance") actions += 1;
    if (scene.kind === "montage") actions += 1;
    if (scene.progressive && scene.body) actions += Math.max(0, scene.body.length - 1);
    return total + actions;
  }, 0);
}


export function selectUnchosenFragments(
  fragments: Array<{ optionId: string; text: string }>,
  answers: Record<string, AnswerRecord>,
  resonances: Record<string, ResonanceRecord>,
  limit = 2,
) {
  const selected = new Set([
    ...Object.values(answers).map((answer) => answer.optionId),
    ...Object.values(resonances).map((resonance) => resonance.optionId),
  ]);
  return fragments.filter((fragment) => !selected.has(fragment.optionId)).slice(0, limit);
}