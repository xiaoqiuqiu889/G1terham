export type Tendency = "idealism" | "love" | "survival";
export type EndingKey = Tendency | "mixed";
export type Scores = Record<Tendency, number>;
export type AnswerRecord = {
  choiceId: string;
  optionId: string;
  label: string;
  tendency: Tendency;
  memory: string;
  motif: string;
};

export const emptyScores = (): Scores => ({ idealism: 0, love: 0, survival: 0 });

export function scoreAnswers(answers: Record<string, AnswerRecord>): Scores {
  return Object.values(answers).reduce((scores, answer) => {
    scores[answer.tendency] += 1;
    return scores;
  }, emptyScores());
}

export function determineEnding(scores: Scores): EndingKey {
  const entries = Object.entries(scores) as [Tendency, number][];
  const highest = Math.max(...entries.map(([, value]) => value));
  const leaders = entries.filter(([, value]) => value === highest);
  return leaders.length === 1 ? leaders[0][0] : "mixed";
}

export function memoryStrength(value: number): "尚未显现" | "微弱" | "清晰" | "强烈" {
  if (value <= 0) return "尚未显现";
  if (value === 1) return "微弱";
  if (value === 2) return "清晰";
  return "强烈";
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
  }));
}
