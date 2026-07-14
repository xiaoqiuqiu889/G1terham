export type HeartbeatId = "hands" | "arrival" | "pomegranate";

export interface HeartbeatMoment {
  id: HeartbeatId;
  label: string;
  action: string;
  response: string;
  nearEcho: string;
  endingFragment: string;
  motif: "机油" | "时间" | "石榴";
  sound: "paper" | "ticket" | "photo";
}

export const heartbeatMoments: readonly HeartbeatMoment[] = [
  {
    id: "hands",
    label: "替他擦掉机油",
    action: "女生用电影票背面，擦去男生手上的机油。",
    response: "他折好脏掉的一角，放回她掌心。",
    nearEcho: "后来修完机器，他总先擦净手再递伞。",
    endingFragment: "她记得那双手：曾沾机油，也扶着旧书。",
    motif: "机油",
    sound: "paper",
  },
  {
    id: "arrival",
    label: "记住他准时到达",
    action: "她在电影票的“20:03”旁写：你到了。",
    response: "他把表拨快三分钟：下次我先到。",
    nearEcho: "此后他每次迟到都先报时间；她仍会等。",
    endingFragment: "十三年后，他又发来“我到了”。",
    motif: "时间",
    sound: "ticket",
  },
  {
    id: "pomegranate",
    label: "分给他半颗石榴",
    action: "她掰开石榴，把更甜的一半塞进工具盒。",
    response: "他递回一粒：维修费，当面验收。",
    nearEcho: "屋顶夜里，他们总把最后一粒留给对方。",
    endingFragment: "茶碟上的红糖，让她想起那粒甜。",
    motif: "石榴",
    sound: "photo",
  },
] as const;

export interface DailyRouteOption { id: string; label: string; line: string; }
export interface DailyRouteStep { id: "approach" | "keep" | "echo"; eyebrow: string; prompt: string; options: readonly DailyRouteOption[]; }
export interface DailyMemoryRotation {
  id: string;
  title: string;
  weather: string;
  subtitle: string;
  art: string;
  steps: readonly DailyRouteStep[];
  rewardFragment: string;
}

const approachOptions: readonly DailyRouteOption[] = [
  { id: "hands", label: "靠近他的手", line: "她先认出机油味，再认出那双手。" },
  { id: "voice", label: "靠近他的声音", line: "停电后，声音比面孔先回到她身边。" },
  { id: "time", label: "靠近他的时间", line: "他曾把表拨快三分钟，后来迟到十三年。" },
];
const keepOptions: readonly DailyRouteOption[] = [
  { id: "poem", label: "留下折诗", line: "旧折痕合上，像一句仍有去处的话。" },
  { id: "photo", label: "留下照片", line: "同版照片隔着城市，各自变旧。" },
  { id: "ticket", label: "留下车票", line: "目的地作废，纸上时间仍清楚。" },
];
const echoOptions: readonly DailyRouteOption[] = [
  { id: "rain", label: "让雨声回来", line: "伞沿一响，两人同时想起“别松手”。" },
  { id: "projector", label: "让放映机回来", line: "齿轮咬合，银幕留住一秒靠近。" },
  { id: "airport", label: "让机场广播回来", line: "航班起飞，没说完的话留在候机厅。" },
];

const rotationSeeds = [
  ["雨夜显影", "雨水让触觉停得更久", "雨声让手先于语言想起彼此。", "/art-v3/tehran-rooftop.png", "后来买伞，他总先检查伞柄。"],
  ["停电显影", "看不见时，声音会靠近", "关一次灯，重剪黑暗里的相认。", "/art-v4/underground-projector-close.png", "机器停转时，她仍会等半秒再开灯。"],
  ["纸页显影", "折痕与未寄出的句子", "今天只看纸留下的证词。", "/art-v5/poetry-book-photo-close.png", "他换过工具盒，旧纸片从未换位置。"],
  ["到达显影", "每次“我到了”都不同", "从地下室到咖啡馆，重剪一次抵达。", "/art-v5/istanbul-reunion-aged.png", "关手机前，她仍确认消息是否送达。"],
  ["石榴显影", "甜味比解释更久", "让一件食物承担当下的记忆。", "/art-v3/tehran-rooftop.png", "后来他们都会剥石榴，不再留最后一粒。"],
  ["两城显影", "同一时间，两种清晨", "在两座城市间剪出一条暗线。", "/art-v5/san-jose-arrival-2011.png", "两地时钟不同，有些习惯却同时发生。"],
  ["回程显影", "出口、时钟与现在", "不问如果，只重剪他们怎样回家。", "/art-v5/istanbul-crossroads-aged.png", "过街后，他们先给等自己的人发消息。"],
] as const;

export const dailyMemoryRotations: readonly DailyMemoryRotation[] = rotationSeeds.map(([title, weather, subtitle, art, rewardFragment], index) => ({
  id: `rotation-${index + 1}`,
  title,
  weather,
  subtitle,
  art,
  steps: [
    { id: "approach", eyebrow: "01 · 靠近", prompt: "今天，你先从哪里靠近男生？", options: approachOptions },
    { id: "keep", eyebrow: "02 · 留下", prompt: "只留一个物件，你留什么？", options: keepOptions },
    { id: "echo", eyebrow: "03 · 回声", prompt: "让哪种声音把记忆送回现在？", options: echoOptions },
  ],
  rewardFragment,
}));

export interface DailyMemoryRecord {
  dateKey: string;
  rotationId: string;
  choices: string[];
  previousChoices?: string[];
  plays: number;
  completedAt: number;
}

function dateOrdinal(dateKey: string): number {
  const [year, month, day] = dateKey.split("-").map(Number);
  const value = Date.UTC(year || 1970, Math.max(0, (month || 1) - 1), day || 1);
  return Math.floor(value / 86_400_000);
}

export function rotationForDate(dateKey: string): DailyMemoryRotation {
  const index = ((dateOrdinal(dateKey) % dailyMemoryRotations.length) + dailyMemoryRotations.length) % dailyMemoryRotations.length;
  return dailyMemoryRotations[index];
}

export function heartbeatState(count: number): "初见" | "熟悉" | "牵挂" | "难忘" {
  if (count <= 0) return "初见";
  if (count === 1) return "熟悉";
  if (count === 2) return "牵挂";
  return "难忘";
}

export function composeDailyRouteLines(rotation: DailyMemoryRotation, choiceIds: readonly string[]): string[] {
  return rotation.steps.map((step, index) => step.options.find(option => option.id === choiceIds[index])?.line).filter((line): line is string => Boolean(line));
}

export function upsertDailyMemoryRecord(records: readonly DailyMemoryRecord[], dateKey: string, choiceIds: readonly string[], completedAt = Date.now()): { records: DailyMemoryRecord[]; firstCompletion: boolean; record: DailyMemoryRecord } {
  const rotation = rotationForDate(dateKey);
  const existing = records.find(record => record.dateKey === dateKey);
  const record: DailyMemoryRecord = existing
    ? { ...existing, rotationId: rotation.id, previousChoices: [...existing.choices], choices: [...choiceIds], plays: existing.plays + 1, completedAt }
    : { dateKey, rotationId: rotation.id, choices: [...choiceIds], plays: 1, completedAt };
  return { records: [...records.filter(item => item.dateKey !== dateKey), record], firstCompletion: !existing, record };
}

export const dailyMemoryMilestones = [
  { days: 1, id: "first-return", label: "第一次回来", fragment: "他记得她扶片门时，先卷起袖口。" },
  { days: 3, id: "three-weather", label: "三种天气", fragment: "她记得他总在机器运转后笑。" },
  { days: 5, id: "five-returns", label: "五次显影", fragment: "结局没变，只多了被爱过的证据。" },
] as const;

export function unlockedDailyMilestones(records: readonly DailyMemoryRecord[]) {
  const days = new Set(records.map(record => record.dateKey)).size;
  return dailyMemoryMilestones.filter(milestone => days >= milestone.days);
}
