import type { Axis, EndingKey } from "./game-logic";

export type MainOption = {
  id: string; label: string; detail: string; axis: Axis; motif: string; sound: string;
  /** 当场发生的动作。旧场景副本可能缺省，渲染时可回退到 memory。 */
  action?: string; memory: string; confirmation: string; nearEcho: string; farEcho: string;
  endingFragment: string; revisitEcho: string;
};

export type ResonanceOption = {
  id: string; label: string; detail: string; motif: string; sound: string;
  /** 共鸣动作把操作、感官确认、远期回响与结尾镜头分开保存。 */
  action?: string; confirmation: string; echo: string; farEcho?: string; endingFragment: string;
};

export type ChapterId = "chapter1" | "chapter2" | "chapter3" | "chapter4" | "chapter5";

export type Scene = {
  id: string; kind: "chapter" | "narrative" | "montage" | "choice" | "echo" | "resonance" | "revisitEcho";
  chapter: string; chapterLabel: string; place: string; year?: string; speaker?: string;
  body?: string[]; beats?: string[]; art?: string; arts?: string[]; artFocus?: string; object?: string; canonicalPhoto?: string;
  progressive?: boolean; choiceId?: string; resonanceId?: string;
  choices?: MainOption[]; resonances?: ResonanceOption[];
  /** 可在场景中完成的探索、操作或抉择；ID 与 progression catalog 保持一致。 */
  interactionIds?: string[];
  /** 本场景可选的本地模拟付费对话。 */
  paidDialogueId?: string;
  /** 章节结算与故事内奖励均挂在章节最后一个可玩场景。 */
  chapterEnd?: ChapterId;
  rewardId?: ChapterId;
  /** 记忆剪辑室重访本幕时使用的短上下文。 */
  revisitBody?: string[];
};

export const axisNames: Record<Axis, string> = {
  "speak": "说出",
  "keep": "留住",
  "survive": "活下去"
};
export const axisExplanations: Record<Axis, string> = {
  "speak": "把爱、责任和真相说出口——它后来被称作理想。",
  "keep": "让一个吻、一本书和共同未来留在手里——它后来被称作爱情。",
  "survive": "先保护自己，再承担离开后的生活——它后来被称作生存。"
};
export const memoryContracts: Record<string, MainOption[]> = {
  "choice-one": [
    {
      "id": "poem",
      "label": "送他一首诗",
      "detail": "让诗替她说出心动",
      "axis": "speak",
      "motif": "折诗",
      "sound": "paper",
      "action": "她把诗页折了四次，放进男生的工具盒。",
      "memory": "她把诗留给他，让文字穿过黑暗。",
      "confirmation": "四道折痕，刚好藏进工具盒。",
      "nearEcho": "男生每次修机器，都会先收好那张诗。",
      "farEcho": "十三年后，他仍记得纸页折过的方向。",
      "endingFragment": "那首诗没有找到出口，却抵达了他。",
      "revisitEcho": "旧工具盒里，诗页的折痕已经发白。"
    },
    {
      "id": "kiss",
      "label": "主动吻他",
      "detail": "趁黑暗先靠近一步",
      "axis": "keep",
      "motif": "照片",
      "sound": "photo",
      "action": "放映机停下，她向前一步吻了男生。",
      "memory": "停电的夜里，她先吻了他。",
      "confirmation": "电影未亮，他们先有了画面。",
      "nearEcho": "以后停电，两只手总会先找到彼此。",
      "farEcho": "咖啡馆灯光一闪，他们没有再靠近。",
      "endingFragment": "那个吻只证明：他们曾毫不犹豫地靠近。",
      "revisitEcho": "黑暗里，两只手又先于语言相遇。"
    },
    {
      "id": "leave",
      "label": "先行离开",
      "detail": "把心动留到明天",
      "axis": "survive",
      "motif": "电影票",
      "sound": "ticket",
      "action": "她收好电影票，先走回街上。",
      "memory": "她先走下楼梯，脚步很稳，心跳不是。",
      "confirmation": "第二天，她仍早到了十分钟。",
      "nearEcho": "此后她总先确认出口，再走回来。",
      "farEcho": "重逢时，她先看后门，才认真看他。",
      "endingFragment": "她学会先找退路，也仍会回来。",
      "revisitEcho": "她记住出口，也记住自己回来过。"
    }
  ],
  "choice-two": [
    {
      "id": "reporter",
      "label": "只承认自己",
      "detail": "承认自己，不提供同伴姓名",
      "axis": "speak",
      "motif": "供词",
      "sound": "paper",
      "action": "她承认自己参与，把责任写在自己名下。",
      "memory": "她只说自己的事，不替任何人作证。",
      "confirmation": "追问三次，她只重复同一句。",
      "nearEcho": "她只承认自己的文章，处分仍然落下。",
      "farEcho": "处分通知里，每句供词都以“我”开头。",
      "endingFragment": "她没有替同伴作证，也没逃过处分。",
      "revisitEcho": "问题换了三次，她只用“我”回答。"
    },
    {
      "id": "book",
      "label": "拒绝告发",
      "detail": "一个名字也不说",
      "axis": "keep",
      "motif": "诗集",
      "sound": "paper",
      "action": "她合上记录，拒绝说出同伴名字。",
      "memory": "她拒绝告发，把沉默留在记录里。",
      "confirmation": "房间里只剩钟表声。",
      "nearEcho": "记录写着“拒绝回答”。沉默也成了证据。",
      "farEcho": "诗集里，“拒绝回答”已经发黄。",
      "endingFragment": "沉默没撤销处分，却护住了同伴姓名。",
      "revisitEcho": "记录停在空白处，通知夹进诗集。"
    },
    {
      "id": "burn",
      "label": "说出名字",
      "detail": "说出姓名，换取减轻处理",
      "axis": "survive",
      "motif": "笔迹",
      "sound": "ash",
      "action": "她说出三个姓名，希望处理减轻。",
      "memory": "她说出三个姓名，希望处理减轻。",
      "confirmation": "笔尖停下时，她没有抬头。",
      "nearEcho": "处理没有减轻。妥协什么也没换来。",
      "farEcho": "处分通知上，三个姓名仍被划过。",
      "endingFragment": "她说出了姓名，处理却没有减轻。",
      "revisitEcho": "三个姓名落纸，处理没有改变。"
    }
  ],
  "choice-three": [
    {
      "id": "truth",
      "label": "把一切一次说完",
      "detail": "把卡姆兰、婚姻和爱一次说完",
      "axis": "speak",
      "motif": "未寄出的信",
      "sound": "paper",
      "action": "她说出卡姆兰、婚姻、害怕和仍然爱他。",
      "memory": "她把最难听的真话留给了最爱的人。",
      "confirmation": "真话没有变轻，却不再留下猜测。",
      "nearEcho": "国际出发大厅里，男生扣好行李箱，没有追问卡姆兰。",
      "farEcho": "绿灯前，卡姆兰的名字不再需要解释。",
      "endingFragment": "真相没留住谁，却结束了猜测。",
      "revisitEcho": "出发大厅里，不再藏着那个名字。"
    },
    {
      "id": "escape",
      "label": "再问一条共同的路",
      "detail": "说清卡姆兰，再问另一条路",
      "axis": "keep",
      "motif": "两张车票",
      "sound": "ticket",
      "action": "她说清卡姆兰，再问男生愿否走另一条路。",
      "memory": "她最后问了一次，而他的沉默就是回答。",
      "confirmation": "城市很大，却没有一条他们共同的出口。",
      "nearEcho": "男生赶到机场，口袋里仍有两张旧车票。",
      "farEcho": "绿灯前，两张旧车票仍夹在诗集末页。",
      "endingFragment": "他没有接住，却再不能把分离说成误会。",
      "revisitEcho": "两张旧车票，没能通向同一个出口。"
    },
    {
      "id": "conceal",
      "label": "只说航班已经确定",
      "detail": "只说航班，把卡姆兰留在信封里",
      "axis": "survive",
      "motif": "行李牌",
      "sound": "ticket",
      "action": "她只说航班，把卡姆兰的名字留在信封里。",
      "memory": "她省略了婚姻，把最锋利的部分留给自己。",
      "confirmation": "她先确认了航班和登机口，才允许自己哭。",
      "nearEcho": "安检口前，她握紧行李牌，只说没有别的事。",
      "farEcho": "路口，她终于说卡姆兰正在等她。",
      "endingFragment": "隐瞒留下伤口，也保住她离开的力气。",
      "revisitEcho": "目的地清楚，告别原因仍是空白。"
    }
  ]
};
export const resonanceContracts: Record<string, ResonanceOption[]> = {
  "photo": [
    {
      "id": "front",
      "label": "正面朝上",
      "detail": "让照片里的他们对视",
      "motif": "照片正面",
      "sound": "photo",
      "action": "她把毕业照正面朝上，放在糖罐旁。",
      "echo": "她把毕业照正面朝上，压在糖罐旁。",
      "farEcho": "诗集里的同版照片，也正面朝上。",
      "endingFragment": "照片正面朝上，替他们完成最后一次对视。",
      "confirmation": "糖罐旁，刚好容下一张照片。"
    },
    {
      "id": "back",
      "label": "反面朝上",
      "detail": "只留下日期和地点",
      "motif": "照片背面",
      "sound": "photo",
      "action": "她翻过照片，让日期朝向灯光。",
      "echo": "照片背面，只剩日期和褪色的地点。",
      "farEcho": "诗集露出正面，桌上照片只露日期。",
      "endingFragment": "照片始终反扣，只有日期证明那天发生过。",
      "confirmation": "纸面擦过桌布，日期朝向灯光。"
    },
    {
      "id": "bag",
      "label": "暂时收回包里",
      "detail": "先不让过去开口",
      "motif": "帆布包",
      "sound": "photo",
      "action": "她把照片滑回帆布包，拉上拉链。",
      "echo": "她收回照片，决定先看现在的他。",
      "farEcho": "诗集摊开，她只隔着包摸到照片硬边。",
      "endingFragment": "她摸到包里的照片：没有展示，也没有丢弃。",
      "confirmation": "拉链合上，照片留在最近的暗处。"
    }
  ],
  "email": [
    {
      "id": "basement",
      "label": "“我记得地下室的味道。”",
      "detail": "写下那一晚",
      "motif": "删除键",
      "sound": "email",
      "action": "她写下地下室的味道，又逐字删除。",
      "echo": "光标停住。她删除整句，输入框变空。",
      "farEcho": "门推开时，雨水和热灯泡的气味进来。",
      "endingFragment": "删掉的气味，在重逢时先于对白回来。",
      "confirmation": "删除前，光标又闪了两次。"
    },
    {
      "id": "book",
      "label": "“那本诗集还在吗？”",
      "detail": "问一个害怕答案的问题",
      "motif": "邮件草稿",
      "sound": "email",
      "action": "她问诗集是否还在，停了一分钟再删除。",
      "echo": "她没有发送。她问的是书，也是书里的人。",
      "farEcho": "男生抱着旧诗集推门，带来了答案。",
      "endingFragment": "她删掉问题；十三年后，他把答案放上桌。",
      "confirmation": "她在问号后停了一分钟。"
    },
    {
      "id": "well",
      "label": "“我现在过得很好。”",
      "detail": "写下一句不完整的真话",
      "motif": "未发送",
      "sound": "email",
      "action": "她写下“过得很好”，看完后删除。",
      "echo": "她看着“很好”，然后删掉整句。",
      "farEcho": "他站在时钟下；“很好”装不下十三年。",
      "endingFragment": "“很好”是真的，却装不下她的生活。",
      "confirmation": "这句话是真的，只是不完整。"
    }
  ],
  "gaze": [
    {
      "id": "hands",
      "label": "先看他的白发与手",
      "detail": "看时间留下的痕迹",
      "motif": "手与白发",
      "sound": "photo",
      "action": "她看向他端茶的手和鬓角白发。",
      "echo": "他仍摩挲杯沿，手背却多了细纹。",
      "farEcho": "焦点停在他的手上，人群才重新清晰。",
      "endingFragment": "镜头停在他的手上。亲密已无处安放。",
      "confirmation": "十三年落在指节和鬓角。"
    },
    {
      "id": "book",
      "label": "先看发黄的诗集",
      "detail": "确认被保存的纸页",
      "motif": "发黄书页",
      "sound": "paper",
      "action": "她看向开裂的书脊和发黄纸页。",
      "echo": "她先看见书脊裂口，才抬头看男生。",
      "farEcho": "焦点越过人群，落在旧诗集上。",
      "endingFragment": "镜头停在旧诗集上。保存不等于回去。",
      "confirmation": "书页的颜色比记忆更诚实。"
    },
    {
      "id": "clock",
      "label": "先看时钟与机场方向",
      "detail": "记住现实仍在等待",
      "motif": "站钟",
      "sound": "ticket",
      "action": "她看向站钟和机场路牌。",
      "echo": "机场还有四十分钟，他也有家人来电。",
      "farEcho": "焦点停在绿灯和机场方向牌上。",
      "endingFragment": "镜头停在机场方向牌。现实仍有人等待。",
      "confirmation": "四十分钟后，机场班车不会等她。"
    }
  ]
};
export const scenes: Scene[] = [
  {
    "id": "photo",
    "kind": "resonance",
    "chapter": "prologue",
    "chapterLabel": "序章 · 一张照片",
    "place": "伊斯坦布尔 · 十三年后",
    "year": "十三年后",
    "art": "/art-v5/istanbul-cafe-photo-close.png",
    "canonicalPhoto": "/art-v5/canonical-graduation-photo.png",
    "artFocus": "table",
    "object": "photo",
    "resonanceId": "photo",
    "interactionIds": ["photo-placement"],
    "revisitBody": [
      "门还没响。重新决定照片怎样落桌。"
    ],
    "resonances": [
      {
        "id": "front",
        "label": "正面朝上",
        "detail": "让照片里的他们对视",
        "motif": "照片正面",
        "sound": "photo",
        "echo": "她把毕业照正面朝上，压在糖罐旁。",
        "endingFragment": "照片正面朝上，替他们完成最后一次对视。",
        "confirmation": "糖罐旁，刚好容下一张照片。"
      },
      {
        "id": "back",
        "label": "反面朝上",
        "detail": "只留下日期和地点",
        "motif": "照片背面",
        "sound": "photo",
        "echo": "照片背面，只剩日期和褪色的地点。",
        "endingFragment": "照片始终反扣，只有日期证明那天发生过。",
        "confirmation": "纸面擦过桌布，日期朝向灯光。"
      },
      {
        "id": "bag",
        "label": "暂时收回包里",
        "detail": "先不让过去开口",
        "motif": "帆布包",
        "sound": "photo",
        "echo": "她收回照片，决定先看现在的他。",
        "endingFragment": "她摸到包里的照片：没有展示，也没有丢弃。",
        "confirmation": "拉链合上，照片留在最近的暗处。"
      }
    ],
    "body": [
      "十三年后，女生先到咖啡馆。门还没响，她要把毕业照放在哪里？"
    ]
  },
  {
    "id": "chapter-one",
    "kind": "chapter",
    "chapter": "chapter1",
    "chapterLabel": "第一章",
    "place": "革命街上的恋人",
    "year": "德黑兰 · 2008",
    "art": "/art-v4/university-gate-autumn.png",
    "body": [
      "有些故事开始时，并不知道自己将成为回忆。"
    ]
  },
  {
    "id": "campus",
    "kind": "narrative",
    "chapter": "chapter1",
    "chapterLabel": "第一章 · 革命街上的恋人",
    "place": "德黑兰大学 / 革命街",
    "art": "/art-v3/tehran-literature-class.png",
    "object": "ticket",
    "interactionIds": ["projector-repair"],
    "body": [
      "下课后，男生把地下电影票夹进她的书。",
      "停电时，他递来胶片：“别松手。”黑暗里只剩呼吸。"
    ]
  },
  {
    "id": "choice-one",
    "kind": "choice",
    "chapter": "chapter1",
    "chapterLabel": "第一次保存",
    "place": "停电后的地下室",
    "art": "/art-v4/underground-projector-close.png",
    "body": [
      "字幕倒了。女生踩椅念反字，男生扶住椅背。",
      "他在电影票背面写“20:03”。她用半颗石榴付维修费。",
      "“看不见画面，故事也不会消失。”女生先做什么？"
    ],
    "choiceId": "choice-one",
    "interactionIds": ["first-memory-action"],
    "revisitBody": [
      "旧胶片停在这里。沿用，或重新选择。"
    ],
    "choices": [
      {
        "id": "poem",
        "label": "送他一首诗",
        "detail": "让诗替她说出心动",
        "axis": "speak",
        "motif": "折诗",
        "sound": "paper",
        "memory": "她把诗留给他，让文字穿过黑暗。",
        "confirmation": "四道折痕，刚好藏进工具盒。",
        "nearEcho": "男生每次修机器，都会先收好那张诗。",
        "farEcho": "十三年后，他仍记得纸页折过的方向。",
        "endingFragment": "那首诗没有找到出口，却抵达了他。",
        "revisitEcho": "旧工具盒里，诗页的折痕已经发白。"
      },
      {
        "id": "kiss",
        "label": "主动吻他",
        "detail": "趁黑暗先靠近一步",
        "axis": "keep",
        "motif": "照片",
        "sound": "photo",
        "memory": "停电的夜里，她先吻了他。",
        "confirmation": "电影未亮，他们先有了画面。",
        "nearEcho": "以后停电，两只手总会先找到彼此。",
        "farEcho": "咖啡馆灯光一闪，他们没有再靠近。",
        "endingFragment": "那个吻只证明：他们曾毫不犹豫地靠近。",
        "revisitEcho": "黑暗里，两只手又先于语言相遇。"
      },
      {
        "id": "leave",
        "label": "先行离开",
        "detail": "把心动留到明天",
        "axis": "survive",
        "motif": "电影票",
        "sound": "ticket",
        "memory": "她先走下楼梯，脚步很稳，心跳不是。",
        "confirmation": "第二天，她仍早到了十分钟。",
        "nearEcho": "此后她总先确认出口，再走回来。",
        "farEcho": "重逢时，她先看后门，才认真看他。",
        "endingFragment": "她学会先找退路，也仍会回来。",
        "revisitEcho": "她记住出口，也记住自己回来过。"
      }
    ]
  },
  {
    "id": "echo-one",
    "kind": "echo",
    "chapter": "chapter1",
    "chapterLabel": "后来 · 德黑兰的夜晚",
    "place": "雨、屋顶与一台旧放映机",
    "art": "/art-v3/tehran-rooftop.png",
    "artFocus": "close",
    "object": "poem",
    "body": [
      "屋顶上他们分石榴。雨里，他带她绕开漏水的屋檐。"
    ]
  },
  {
    "id": "promise",
    "kind": "narrative",
    "chapter": "chapter1",
    "chapterLabel": "第一章 · 革命街上的恋人",
    "place": "毕业照那天",
    "art": "/art-v5/graduation-photo-day.png",
    "canonicalPhoto": "/art-v5/canonical-graduation-photo.png",
    "object": "photo",
    "paidDialogueId": "paid-photo-developing",
    "chapterEnd": "chapter1",
    "rewardId": "chapter1",
    "body": [
      "他们冲洗了两张同版照片：女生带走一张，男生把另一张夹进诗集。",
      "父亲中风后，维修铺、药单和账本都等着男生。"
    ]
  },
  {
    "id": "chapter-two",
    "kind": "chapter",
    "chapter": "chapter2",
    "chapterLabel": "第二章",
    "place": "知识变成证据",
    "year": "德黑兰 · 2009",
    "art": "/art-v4/student-publication-room.png",
    "body": [
      "他们用文字找出口，文字却先暴露了他们。"
    ]
  },
  {
    "id": "publication",
    "kind": "narrative",
    "chapter": "chapter2",
    "chapterLabel": "第二章 · 知识变成证据",
    "place": "学生宿舍 / 大学广场",
    "art": "/art-v4/student-publication-room.png",
    "object": "list",
    "progressive": true,
    "interactionIds": ["publication-clues"],
    "body": [
      "刊物写电影与女性生活。玛兹雅总用蓝铅笔画一颗小太阳。",
      "她当夜被带走。第二天，学校追问：谁和你一起做刊物？"
    ]
  },
  {
    "id": "choice-two",
    "kind": "choice",
    "chapter": "chapter2",
    "chapterLabel": "第二次保存",
    "place": "大学纪律委员会",
    "art": "/art-v4/dorm-search-night.png",
    "body": [
      "调查者推来刊物：“谁和你一起做的？”她要决定是否告发。"
    ],
    "choiceId": "choice-two",
    "interactionIds": ["names-decision"],
    "revisitBody": [
      "调查者仍在追问。重新决定是否告发。"
    ],
    "choices": [
      {
        "id": "reporter",
        "label": "只承认自己",
        "detail": "承认自己，不提供同伴姓名",
        "axis": "speak",
        "motif": "供词",
        "sound": "paper",
        "memory": "她只说自己的事，不替任何人作证。",
        "confirmation": "追问三次，她只重复同一句。",
        "nearEcho": "她只承认自己的文章，处分仍然落下。",
        "farEcho": "处分通知里，每句供词都以“我”开头。",
        "endingFragment": "她没有替同伴作证，也没逃过处分。",
        "revisitEcho": "问题换了三次，她只用“我”回答。"
      },
      {
        "id": "book",
        "label": "拒绝告发",
        "detail": "一个名字也不说",
        "axis": "keep",
        "motif": "诗集",
        "sound": "paper",
        "memory": "她拒绝告发，把沉默留在记录里。",
        "confirmation": "房间里只剩钟表声。",
        "nearEcho": "记录写着“拒绝回答”。沉默也成了证据。",
        "farEcho": "诗集里，“拒绝回答”已经发黄。",
        "endingFragment": "沉默没撤销处分，却护住了同伴姓名。",
        "revisitEcho": "记录停在空白处，通知夹进诗集。"
      },
      {
        "id": "burn",
        "label": "说出名字",
        "detail": "说出姓名，换取减轻处理",
        "axis": "survive",
        "motif": "笔迹",
        "sound": "ash",
        "memory": "她说出三个姓名，希望处理减轻。",
        "confirmation": "笔尖停下时，她没有抬头。",
        "nearEcho": "处理没有减轻。妥协什么也没换来。",
        "farEcho": "处分通知上，三个姓名仍被划过。",
        "endingFragment": "她说出了姓名，处理却没有减轻。",
        "revisitEcho": "三个姓名落纸，处理没有改变。"
      }
    ]
  },
  {
    "id": "echo-two",
    "kind": "echo",
    "chapter": "chapter2",
    "chapterLabel": "后来 · 纪律委员会",
    "place": "没有提高声音的问话",
    "art": "/art-v3/discipline-committee.png",
    "artFocus": "desk",
    "object": "list",
    "interactionIds": ["discipline-record"],
    "body": [
      "玛兹雅六个月后获释。她在儿童图书馆工作，卡上仍有蓝铅笔画的小太阳。"
    ]
  },
  {
    "id": "after-gate",
    "kind": "narrative",
    "chapter": "chapter2",
    "chapterLabel": "第二章 · 知识变成证据",
    "place": "大学铁门外",
    "art": "/art-v4/university-gate-expulsion.png",
    "paidDialogueId": "paid-lab-door",
    "chapterEnd": "chapter2",
    "rewardId": "chapter2",
    "body": [
      "女生被处分，出版社也撤回邀请。男生往前半步，又停住。",
      "她的名字从系统消失。世界没有结束，只是变窄了。"
    ]
  },
  {
    "id": "chapter-three",
    "kind": "chapter",
    "chapter": "chapter3",
    "chapterLabel": "第三章",
    "place": "只有一个人能够离开",
    "year": "德黑兰 · 2010",
    "art": "/art-v3/tehran-airport-departure.png",
    "body": [
      "桌上放着钥匙和护照申请。他们伸手拿了不同的东西。"
    ]
  },
  {
    "id": "small-room",
    "kind": "montage",
    "chapter": "chapter3",
    "chapterLabel": "蒙太奇 · 出租屋",
    "place": "一段越来越具体的共同生活",
    "art": "/art-v3/tehran-rental-room.png",
    "object": "ticket",
    "interactionIds": ["departure-packing"],
    "beats": [
      "女生白天翻译说明书，夜里配电影字幕。",
      "男生修电脑，晚上去父亲的维修铺对账。",
      "烛光里有诗，也有房租、药费和护照申请。"
    ]
  },
  {
    "id": "one-year",
    "kind": "narrative",
    "chapter": "chapter3",
    "chapterLabel": "第三章 · 只有一个人能够离开",
    "place": "出租屋 · 凌晨",
    "art": "/art-v3/tehran-rental-room.png",
    "progressive": true,
    "speaker": "女生与男生",
    "body": [
      "“再等一年。”男生看着复健单：“母亲不能独自守店。”",
      "女生收起护照：“我留下，只会越来越不像自己。”"
    ]
  },
  {
    "id": "kamran",
    "kind": "narrative",
    "chapter": "chapter3",
    "chapterLabel": "第三章 · 只有一个人能够离开",
    "place": "圣何塞 / 德黑兰",
    "art": "/art-v4/video-call-kamran.png",
    "object": "email",
    "paidDialogueId": "paid-marriage-truth",
    "body": [
      "卡姆兰住在圣何塞，周末拍空荡的停车场。他愿帮女生离开。",
      "他举起接触印样，请她替摄影投稿选一格；她选中后，他当场划掉那张。",
      "女生要求婚后继续工作。三周后，她寄出第一份表格。"
    ]
  },
  {
    "id": "choice-three",
    "kind": "choice",
    "chapter": "chapter3",
    "chapterLabel": "第三次保存",
    "place": "德黑兰屋顶 · 最后一夜",
    "art": "/art-v4/final-rooftop-night.png",
    "body": [
      "手续和机票已经确定。她要决定怎样告诉男生。"
    ],
    "choiceId": "choice-three",
    "interactionIds": ["last-night-truth"],
    "revisitBody": [
      "离开已定。重新决定最后一夜说什么。"
    ],
    "choices": [
      {
        "id": "truth",
        "label": "把一切一次说完",
        "detail": "把卡姆兰、婚姻和爱一次说完",
        "axis": "speak",
        "motif": "未寄出的信",
        "sound": "paper",
        "memory": "她把最难听的真话留给了最爱的人。",
        "confirmation": "真话没有变轻，却不再留下猜测。",
        "nearEcho": "国际出发大厅里，男生扣好行李箱，没有追问卡姆兰。",
        "farEcho": "绿灯前，卡姆兰的名字不再需要解释。",
        "endingFragment": "真相没留住谁，却结束了猜测。",
        "revisitEcho": "出发大厅里，不再藏着那个名字。"
      },
      {
        "id": "escape",
        "label": "再问一条共同的路",
        "detail": "说清卡姆兰，再问另一条路",
        "axis": "keep",
        "motif": "两张车票",
        "sound": "ticket",
        "memory": "她最后问了一次，而他的沉默就是回答。",
        "confirmation": "城市很大，却没有一条他们共同的出口。",
        "nearEcho": "男生赶到机场，口袋里仍有两张旧车票。",
        "farEcho": "绿灯前，两张旧车票仍夹在诗集末页。",
        "endingFragment": "他没有接住，却再不能把分离说成误会。",
        "revisitEcho": "两张旧车票，没能通向同一个出口。"
      },
      {
        "id": "conceal",
        "label": "只说航班已经确定",
        "detail": "只说航班，把卡姆兰留在信封里",
        "axis": "survive",
        "motif": "行李牌",
        "sound": "ticket",
        "memory": "她省略了婚姻，把最锋利的部分留给自己。",
        "confirmation": "她先确认了航班和登机口，才允许自己哭。",
        "nearEcho": "安检口前，她握紧行李牌，只说没有别的事。",
        "farEcho": "路口，她终于说卡姆兰正在等她。",
        "endingFragment": "隐瞒留下伤口，也保住她离开的力气。",
        "revisitEcho": "目的地清楚，告别原因仍是空白。"
      }
    ]
  },
  {
    "id": "echo-three",
    "kind": "echo",
    "chapter": "chapter3",
    "chapterLabel": "后来 · 德黑兰国际机场",
    "place": "国际出发 · 天亮以前",
    "art": "/art-v4/airport-clock-goodbye.png",
    "artFocus": "airport",
    "object": "ticket",
    "interactionIds": ["airport-goodbye"],
    "chapterEnd": "chapter3",
    "rewardId": "chapter3",
    "body": [
      "男生发来一条迟到的信息：“我到了。”他站在大厅时钟下。",
      "他扣紧行李箱，没有请她留下。广播开始念她的航班。"
    ]
  },
  {
    "id": "chapter-four",
    "kind": "chapter",
    "chapter": "chapter4",
    "chapterLabel": "第四章",
    "place": "两个城市",
    "year": "圣何塞 / 德黑兰 · 2011—2021",
    "art": "/art-v5/san-jose-arrival-2011.png",
    "body": [
      "飞机落地时，德黑兰的维修铺关门了。两只钟走向不同早晨。"
    ]
  },
  {
    "id": "two-cities",
    "kind": "montage",
    "chapter": "chapter4",
    "chapterLabel": "蒙太奇 · 两个城市",
    "place": "各自成立的生活",
    "art": "/art-v4/localization-office.png",
    "arts": [
      "/art-v4/localization-office.png",
      "/art-v4/maryam-telescope-rooftop.png",
      "/art-v3/san-jose-apartment.png"
    ],
    "interactionIds": ["dual-city-objects"],
    "paidDialogueId": "paid-two-cities-choice",
    "beats": [
      "女生给卡姆兰发：“航班落地了。我在取行李。”",
      "她校对波斯语界面，也替他的黑白底片选光。",
      "玛丽亚姆用误差范围帮男生找出坏传感器。",
      "男生修好望远镜跟踪架，她拍下流星轨迹。",
      "邮件最后只剩：革命街上的旧书店关门了。"
    ]
  },
  {
    "id": "email",
    "kind": "resonance",
    "chapter": "chapter4",
    "chapterLabel": "第四章 · 没有回复的邮件",
    "place": "圣何塞 · 凌晨",
    "art": "/art-v4/email-delete-night.png",
    "artFocus": "screen",
    "object": "email",
    "resonanceId": "email",
    "interactionIds": ["email-draft"],
    "revisitBody": [
      "光标仍在闪。重新写下，再亲手删去。"
    ],
    "resonances": [
      {
        "id": "basement",
        "label": "“我记得地下室的味道。”",
        "detail": "写下那一晚",
        "motif": "删除键",
        "sound": "email",
        "echo": "光标停住。她删除整句，输入框变空。",
        "endingFragment": "删掉的气味，在重逢时先于对白回来。",
        "confirmation": "删除前，光标又闪了两次。"
      },
      {
        "id": "book",
        "label": "“那本诗集还在吗？”",
        "detail": "问一个害怕答案的问题",
        "motif": "邮件草稿",
        "sound": "email",
        "echo": "她没有发送。她问的是书，也是书里的人。",
        "endingFragment": "她删掉问题；十三年后，他把答案放上桌。",
        "confirmation": "她在问号后停了一分钟。"
      },
      {
        "id": "well",
        "label": "“我现在过得很好。”",
        "detail": "写下一句不完整的真话",
        "motif": "未发送",
        "sound": "email",
        "echo": "她看着“很好”，然后删掉整句。",
        "endingFragment": "“很好”是真的，却装不下她的生活。",
        "confirmation": "这句话是真的，只是不完整。"
      }
    ],
    "body": [
      "卡姆兰在客厅整理照片。女生写下一句话，又亲手删掉。"
    ]
  },
  {
    "id": "last-email",
    "kind": "narrative",
    "chapter": "chapter4",
    "chapterLabel": "第四章 · 没有回复的邮件",
    "place": "删除以后",
    "art": "/art-v4/email-delete-night.png",
    "object": "email",
    "interactionIds": ["receipt-memory-combination"],
    "chapterEnd": "chapter4",
    "rewardId": "chapter4",
    "body": [
      "屏幕空了。卡姆兰递来一张雾中公路，她把它贴在冰箱上。"
    ]
  },
  {
    "id": "chapter-five",
    "kind": "chapter",
    "chapter": "chapter5",
    "chapterLabel": "第五章",
    "place": "伊斯坦布尔重逢",
    "year": "十三年后",
    "art": "/art-v2/istanbul-cafe.png",
    "body": [
      "门外下着雨。她放好照片，他抱着诗集推门。"
    ]
  },
  {
    "id": "gaze",
    "kind": "resonance",
    "chapter": "chapter5",
    "chapterLabel": "第五章 · 重逢",
    "place": "卡拉柯伊 · 老咖啡馆",
    "art": "/art-v5/istanbul-reunion-aged.png",
    "artFocus": "table",
    "object": "book",
    "resonanceId": "gaze",
    "interactionIds": ["reunion-gaze"],
    "revisitBody": [
      "门已推开。重新决定先看哪里。"
    ],
    "resonances": [
      {
        "id": "hands",
        "label": "先看他的白发与手",
        "detail": "看时间留下的痕迹",
        "motif": "手与白发",
        "sound": "photo",
        "echo": "他仍摩挲杯沿，手背却多了细纹。",
        "endingFragment": "镜头停在他的手上。亲密已无处安放。",
        "confirmation": "十三年落在指节和鬓角。"
      },
      {
        "id": "book",
        "label": "先看发黄的诗集",
        "detail": "确认被保存的纸页",
        "motif": "发黄书页",
        "sound": "paper",
        "echo": "她先看见书脊裂口，才抬头看男生。",
        "endingFragment": "镜头停在旧诗集上。保存不等于回去。",
        "confirmation": "书页的颜色比记忆更诚实。"
      },
      {
        "id": "clock",
        "label": "先看时钟与机场方向",
        "detail": "记住现实仍在等待",
        "motif": "站钟",
        "sound": "ticket",
        "echo": "机场还有四十分钟，他也有家人来电。",
        "endingFragment": "镜头停在机场方向牌。现实仍有人等待。",
        "confirmation": "四十分钟后，机场班车不会等她。"
      }
    ],
    "body": [
      "门被推开，雨水和热灯泡的气味进来。男生先说你好。",
      "“还好吗？”“还可以。”他放下诗集。女生先看哪里？"
    ]
  },
  {
    "id": "book",
    "kind": "narrative",
    "chapter": "chapter5",
    "chapterLabel": "第五章 · 两张相同的照片",
    "place": "诗集与桌面",
    "art": "/art-v5/poetry-book-photo-close.png",
    "canonicalPhoto": "/art-v5/canonical-graduation-photo.png",
    "artFocus": "book",
    "object": "photo",
    "interactionIds": ["photo-pairing"],
    "paidDialogueId": "paid-reunion-hypothesis",
    "body": [
      "诗集里是他的毕业照；桌上或包里，是她的同版照片。",
      "两处磨损之间，留着十三年前那句：“别松手。”"
    ]
  },
  {
    "id": "crossroads",
    "kind": "narrative",
    "chapter": "chapter5",
    "chapterLabel": "终章 · 另一个故事",
    "place": "伊斯坦布尔街头",
    "art": "/art-v5/istanbul-crossroads-aged.png",
    "progressive": true,
    "speaker": "男生与女生",
    "interactionIds": ["final-crossroad"],
    "chapterEnd": "chapter5",
    "rewardId": "chapter5",
    "body": [
      "绿灯亮起。她去机场，他回酒店。他们没有拥抱。",
      "“如果当年我跟你走了呢？”“那会是另一个故事。”",
      "他们走向两边，又在同一刻回头。"
    ]
  }
];
export const revisitScenes: Scene[] = [
  {
    "id": "cut-one",
    "kind": "narrative",
    "chapter": "chapter1",
    "chapterLabel": "记忆剪辑 01",
    "place": "地下室停电以后",
    "art": "/art-v4/underground-projector-close.png",
    "body": [
      "旧胶片停住。沿用上轮，或重剪这一格。"
    ]
  },
  {
    "id": "choice-one",
    "kind": "choice",
    "chapter": "chapter1",
    "chapterLabel": "第一次保存",
    "place": "停电后的地下室",
    "art": "/art-v4/underground-projector-close.png",
    "body": [
      "“看不见画面，故事也不会消失。”女生先做什么？"
    ],
    "choiceId": "choice-one",
    "choices": [
      {
        "id": "poem",
        "label": "送他一首诗",
        "detail": "让诗替她说出心动",
        "axis": "speak",
        "motif": "折诗",
        "sound": "paper",
        "memory": "她把诗留给他，让文字穿过黑暗。",
        "confirmation": "四道折痕，刚好藏进工具盒。",
        "nearEcho": "男生每次修机器，都会先收好那张诗。",
        "farEcho": "十三年后，他仍记得纸页折过的方向。",
        "endingFragment": "那首诗没有找到出口，却抵达了他。",
        "revisitEcho": "旧工具盒里，诗页的折痕已经发白。"
      },
      {
        "id": "kiss",
        "label": "主动吻他",
        "detail": "趁黑暗先靠近一步",
        "axis": "keep",
        "motif": "照片",
        "sound": "photo",
        "memory": "停电的夜里，她先吻了他。",
        "confirmation": "电影未亮，他们先有了画面。",
        "nearEcho": "以后停电，两只手总会先找到彼此。",
        "farEcho": "咖啡馆灯光一闪，他们没有再靠近。",
        "endingFragment": "那个吻只证明：他们曾毫不犹豫地靠近。",
        "revisitEcho": "黑暗里，两只手又先于语言相遇。"
      },
      {
        "id": "leave",
        "label": "先行离开",
        "detail": "把心动留到明天",
        "axis": "survive",
        "motif": "电影票",
        "sound": "ticket",
        "memory": "她先走下楼梯，脚步很稳，心跳不是。",
        "confirmation": "第二天，她仍早到了十分钟。",
        "nearEcho": "此后她总先确认出口，再走回来。",
        "farEcho": "重逢时，她先看后门，才认真看他。",
        "endingFragment": "她学会先找退路，也仍会回来。",
        "revisitEcho": "她记住出口，也记住自己回来过。"
      }
    ]
  },
  {
    "id": "revisit-echo-one",
    "kind": "revisitEcho",
    "chapter": "chapter1",
    "chapterLabel": "后来",
    "place": "这次改动如何抵达未来",
    "art": "/art-v4/graduation-photo-day.png",
    "choiceId": "choice-one",
    "choices": [
      {
        "id": "poem",
        "label": "送他一首诗",
        "detail": "让诗替她说出心动",
        "axis": "speak",
        "motif": "折诗",
        "sound": "paper",
        "memory": "她把诗留给他，让文字穿过黑暗。",
        "confirmation": "四道折痕，刚好藏进工具盒。",
        "nearEcho": "男生每次修机器，都会先收好那张诗。",
        "farEcho": "十三年后，他仍记得纸页折过的方向。",
        "endingFragment": "那首诗没有找到出口，却抵达了他。",
        "revisitEcho": "旧工具盒里，诗页的折痕已经发白。"
      },
      {
        "id": "kiss",
        "label": "主动吻他",
        "detail": "趁黑暗先靠近一步",
        "axis": "keep",
        "motif": "照片",
        "sound": "photo",
        "memory": "停电的夜里，她先吻了他。",
        "confirmation": "电影未亮，他们先有了画面。",
        "nearEcho": "以后停电，两只手总会先找到彼此。",
        "farEcho": "咖啡馆灯光一闪，他们没有再靠近。",
        "endingFragment": "那个吻只证明：他们曾毫不犹豫地靠近。",
        "revisitEcho": "黑暗里，两只手又先于语言相遇。"
      },
      {
        "id": "leave",
        "label": "先行离开",
        "detail": "把心动留到明天",
        "axis": "survive",
        "motif": "电影票",
        "sound": "ticket",
        "memory": "她先走下楼梯，脚步很稳，心跳不是。",
        "confirmation": "第二天，她仍早到了十分钟。",
        "nearEcho": "此后她总先确认出口，再走回来。",
        "farEcho": "重逢时，她先看后门，才认真看他。",
        "endingFragment": "她学会先找退路，也仍会回来。",
        "revisitEcho": "她记住出口，也记住自己回来过。"
      }
    ]
  },
  {
    "id": "cut-two",
    "kind": "narrative",
    "chapter": "chapter2",
    "chapterLabel": "记忆剪辑 02",
    "place": "问话还没有结束",
    "art": "/art-v4/dorm-search-night.png",
    "body": [
      "玛兹雅被带走。委员会要女生说出同伴。"
    ]
  },
  {
    "id": "choice-two",
    "kind": "choice",
    "chapter": "chapter2",
    "chapterLabel": "第二次保存",
    "place": "大学纪律委员会",
    "art": "/art-v4/dorm-search-night.png",
    "body": [
      "调查者推来刊物：“谁和你一起做的？”她要决定是否告发。"
    ],
    "choiceId": "choice-two",
    "choices": [
      {
        "id": "reporter",
        "label": "只承认自己",
        "detail": "承认自己，不提供同伴姓名",
        "axis": "speak",
        "motif": "供词",
        "sound": "paper",
        "memory": "她只说自己的事，不替任何人作证。",
        "confirmation": "追问三次，她只重复同一句。",
        "nearEcho": "她只承认自己的文章，处分仍然落下。",
        "farEcho": "处分通知里，每句供词都以“我”开头。",
        "endingFragment": "她没有替同伴作证，也没逃过处分。",
        "revisitEcho": "问题换了三次，她只用“我”回答。"
      },
      {
        "id": "book",
        "label": "拒绝告发",
        "detail": "一个名字也不说",
        "axis": "keep",
        "motif": "诗集",
        "sound": "paper",
        "memory": "她拒绝告发，把沉默留在记录里。",
        "confirmation": "房间里只剩钟表声。",
        "nearEcho": "记录写着“拒绝回答”。沉默也成了证据。",
        "farEcho": "诗集里，“拒绝回答”已经发黄。",
        "endingFragment": "沉默没撤销处分，却护住了同伴姓名。",
        "revisitEcho": "记录停在空白处，通知夹进诗集。"
      },
      {
        "id": "burn",
        "label": "说出名字",
        "detail": "说出姓名，换取减轻处理",
        "axis": "survive",
        "motif": "笔迹",
        "sound": "ash",
        "memory": "她说出三个姓名，希望处理减轻。",
        "confirmation": "笔尖停下时，她没有抬头。",
        "nearEcho": "处理没有减轻。妥协什么也没换来。",
        "farEcho": "处分通知上，三个姓名仍被划过。",
        "endingFragment": "她说出了姓名，处理却没有减轻。",
        "revisitEcho": "三个姓名落纸，处理没有改变。"
      }
    ]
  },
  {
    "id": "revisit-echo-two",
    "kind": "revisitEcho",
    "chapter": "chapter2",
    "chapterLabel": "后来",
    "place": "这次改动如何抵达未来",
    "art": "/art-v4/university-gate-expulsion.png",
    "choiceId": "choice-two",
    "choices": [
      {
        "id": "reporter",
        "label": "只承认自己",
        "detail": "承认自己，不提供同伴姓名",
        "axis": "speak",
        "motif": "供词",
        "sound": "paper",
        "memory": "她只说自己的事，不替任何人作证。",
        "confirmation": "追问三次，她只重复同一句。",
        "nearEcho": "她只承认自己的文章，处分仍然落下。",
        "farEcho": "处分通知里，每句供词都以“我”开头。",
        "endingFragment": "她没有替同伴作证，也没逃过处分。",
        "revisitEcho": "问题换了三次，她只用“我”回答。"
      },
      {
        "id": "book",
        "label": "拒绝告发",
        "detail": "一个名字也不说",
        "axis": "keep",
        "motif": "诗集",
        "sound": "paper",
        "memory": "她拒绝告发，把沉默留在记录里。",
        "confirmation": "房间里只剩钟表声。",
        "nearEcho": "记录写着“拒绝回答”。沉默也成了证据。",
        "farEcho": "诗集里，“拒绝回答”已经发黄。",
        "endingFragment": "沉默没撤销处分，却护住了同伴姓名。",
        "revisitEcho": "记录停在空白处，通知夹进诗集。"
      },
      {
        "id": "burn",
        "label": "说出名字",
        "detail": "说出姓名，换取减轻处理",
        "axis": "survive",
        "motif": "笔迹",
        "sound": "ash",
        "memory": "她说出三个姓名，希望处理减轻。",
        "confirmation": "笔尖停下时，她没有抬头。",
        "nearEcho": "处理没有减轻。妥协什么也没换来。",
        "farEcho": "处分通知上，三个姓名仍被划过。",
        "endingFragment": "她说出了姓名，处理却没有减轻。",
        "revisitEcho": "三个姓名落纸，处理没有改变。"
      }
    ]
  },
  {
    "id": "cut-three",
    "kind": "narrative",
    "chapter": "chapter3",
    "chapterLabel": "记忆剪辑 03",
    "place": "离开已经决定",
    "art": "/art-v4/airport-clock-goodbye.png",
    "body": [
      "手续和机票不变。重剪最后一夜的话。"
    ]
  },
  {
    "id": "choice-three",
    "kind": "choice",
    "chapter": "chapter3",
    "chapterLabel": "第三次保存",
    "place": "德黑兰屋顶 · 最后一夜",
    "art": "/art-v4/final-rooftop-night.png",
    "body": [
      "手续和机票已经确定。她要决定怎样告诉男生。"
    ],
    "choiceId": "choice-three",
    "choices": [
      {
        "id": "truth",
        "label": "把一切一次说完",
        "detail": "把卡姆兰、婚姻和爱一次说完",
        "axis": "speak",
        "motif": "未寄出的信",
        "sound": "paper",
        "memory": "她把最难听的真话留给了最爱的人。",
        "confirmation": "真话没有变轻，却不再留下猜测。",
        "nearEcho": "国际出发大厅里，男生扣好行李箱，没有追问卡姆兰。",
        "farEcho": "绿灯前，卡姆兰的名字不再需要解释。",
        "endingFragment": "真相没留住谁，却结束了猜测。",
        "revisitEcho": "出发大厅里，不再藏着那个名字。"
      },
      {
        "id": "escape",
        "label": "再问一条共同的路",
        "detail": "说清卡姆兰，再问另一条路",
        "axis": "keep",
        "motif": "两张车票",
        "sound": "ticket",
        "memory": "她最后问了一次，而他的沉默就是回答。",
        "confirmation": "城市很大，却没有一条他们共同的出口。",
        "nearEcho": "男生赶到机场，口袋里仍有两张旧车票。",
        "farEcho": "绿灯前，两张旧车票仍夹在诗集末页。",
        "endingFragment": "他没有接住，却再不能把分离说成误会。",
        "revisitEcho": "两张旧车票，没能通向同一个出口。"
      },
      {
        "id": "conceal",
        "label": "只说航班已经确定",
        "detail": "只说航班，把卡姆兰留在信封里",
        "axis": "survive",
        "motif": "行李牌",
        "sound": "ticket",
        "memory": "她省略了婚姻，把最锋利的部分留给自己。",
        "confirmation": "她先确认了航班和登机口，才允许自己哭。",
        "nearEcho": "安检口前，她握紧行李牌，只说没有别的事。",
        "farEcho": "路口，她终于说卡姆兰正在等她。",
        "endingFragment": "隐瞒留下伤口，也保住她离开的力气。",
        "revisitEcho": "目的地清楚，告别原因仍是空白。"
      }
    ]
  },
  {
    "id": "revisit-echo-three",
    "kind": "revisitEcho",
    "chapter": "chapter3",
    "chapterLabel": "后来",
    "place": "这次改动如何抵达未来",
    "art": "/art-v4/airport-clock-goodbye.png",
    "choiceId": "choice-three",
    "choices": [
      {
        "id": "truth",
        "label": "把一切一次说完",
        "detail": "把卡姆兰、婚姻和爱一次说完",
        "axis": "speak",
        "motif": "未寄出的信",
        "sound": "paper",
        "memory": "她把最难听的真话留给了最爱的人。",
        "confirmation": "真话没有变轻，却不再留下猜测。",
        "nearEcho": "国际出发大厅里，男生扣好行李箱，没有追问卡姆兰。",
        "farEcho": "绿灯前，卡姆兰的名字不再需要解释。",
        "endingFragment": "真相没留住谁，却结束了猜测。",
        "revisitEcho": "出发大厅里，不再藏着那个名字。"
      },
      {
        "id": "escape",
        "label": "再问一条共同的路",
        "detail": "说清卡姆兰，再问另一条路",
        "axis": "keep",
        "motif": "两张车票",
        "sound": "ticket",
        "memory": "她最后问了一次，而他的沉默就是回答。",
        "confirmation": "城市很大，却没有一条他们共同的出口。",
        "nearEcho": "男生赶到机场，口袋里仍有两张旧车票。",
        "farEcho": "绿灯前，两张旧车票仍夹在诗集末页。",
        "endingFragment": "他没有接住，却再不能把分离说成误会。",
        "revisitEcho": "两张旧车票，没能通向同一个出口。"
      },
      {
        "id": "conceal",
        "label": "只说航班已经确定",
        "detail": "只说航班，把卡姆兰留在信封里",
        "axis": "survive",
        "motif": "行李牌",
        "sound": "ticket",
        "memory": "她省略了婚姻，把最锋利的部分留给自己。",
        "confirmation": "她先确认了航班和登机口，才允许自己哭。",
        "nearEcho": "安检口前，她握紧行李牌，只说没有别的事。",
        "farEcho": "路口，她终于说卡姆兰正在等她。",
        "endingFragment": "隐瞒留下伤口，也保住她离开的力气。",
        "revisitEcho": "目的地清楚，告别原因仍是空白。"
      }
    ]
  }
];

/**
 * 场景里保留的旧副本仅用于历史存档兼容；运行时始终挂接中央契约，
 * 避免正文、剪辑室与结局各维护一份会漂移的选择文案。
 */
for (const scene of [...scenes, ...revisitScenes]) {
  if (scene.choiceId && memoryContracts[scene.choiceId]) {
    scene.choices = memoryContracts[scene.choiceId];
  }
  if (scene.resonanceId && resonanceContracts[scene.resonanceId]) {
    scene.resonances = resonanceContracts[scene.resonanceId];
  }
}

export type FutureEchoRoute = {
  source: "choice" | "resonance";
  /** kind mirrors source for page-level compatibility with V4 saves/components. */
  kind?: "choice" | "resonance";
  id: string;
  field: "farEcho";
};

/** 每个场景最多兑现两条回响；视线本身只进入最终镜头，不在下一幕复述。 */
export const futureEchoRoutes: Record<string, FutureEchoRoute[]> = {
  "gaze": [
    { source: "choice", kind: "choice", id: "choice-one", field: "farEcho" },
    { source: "resonance", kind: "resonance", id: "email", field: "farEcho" },
  ],
  "book": [
    { source: "resonance", kind: "resonance", id: "photo", field: "farEcho" },
    { source: "choice", kind: "choice", id: "choice-two", field: "farEcho" },
  ],
  "crossroads": [
    { source: "choice", kind: "choice", id: "choice-three", field: "farEcho" },
  ],
};

export const choiceIds = [
  "choice-one",
  "choice-two",
  "choice-three"
];
export const resonanceIds = [
  "photo",
  "email",
  "gaze"
];
export const endings: Record<EndingKey,{title:string;reveal:string;body:string;coda:string}> = {
  "speak": {
    "title": "你让未说出口的事抵达",
    "reveal": "说出 · 理想的前身",
    "body": "你把诗、责任和真相说出，不让沉默成为唯一版本。",
    "coda": "话语不能重合道路，却能说清分岔。"
  },
  "keep": {
    "title": "你让被爱过的证据留下",
    "reveal": "留住 · 爱情的形状",
    "body": "你选择靠近和保存，让亲密不被后来的人生否认。",
    "coda": "保存不是回去，只是承认它存在过。"
  },
  "survive": {
    "title": "你让她有力气走到明天",
    "reveal": "活下去 · 生存的动作",
    "body": "你选择出口和安全，让她有力气承担明天。",
    "coda": "离开不是胜利，却把明天交回她手里。"
  },
  "mixed": {
    "title": "你让三种记忆同时留下",
    "reveal": "说出 · 留住 · 活下去",
    "body": "说出、留住、活下去同时存在，彼此不作裁决。",
    "coda": "她没有让一种记忆替另外两种作证。"
  }
};
export const unchosenFragments = [
  {
    "optionId": "poem",
    "text": "有一版记忆里，电影恢复以前没有人靠近；只有工具盒里多了一道纸的折痕。"
  },
  {
    "optionId": "burn",
    "text": "有一版记忆里，她说出三个调查者早已圈出的名字；处分仍然没有减轻。"
  },
  {
    "optionId": "escape",
    "text": "有一版记忆里，两张公交票一直夹在诗集末页，没有把他们带到同一个出口。"
  },
  {
    "optionId": "well",
    "text": "有一版记忆里，邮件只写了“我很好”，然后整句被删除。"
  }
];
