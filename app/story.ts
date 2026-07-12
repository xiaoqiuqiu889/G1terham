import type { EndingKey, Tendency } from "./game-logic";

export type ChoiceOption = {
  id: string;
  label: string;
  detail: string;
  tendency: Tendency;
  memory: string;
  motif: string;
  confirmation: string;
};

export type Scene = {
  id: string;
  kind: "chapter" | "narrative" | "montage" | "choice";
  chapter: string;
  chapterLabel: string;
  place: string;
  year?: string;
  speaker?: string;
  body?: string[];
  beats?: string[];
  art?: string;
  choiceId?: string;
  choices?: ChoiceOption[];
  echoFrom?: string;
};

export const tendencyNames: Record<Tendency, string> = {
  idealism: "理想",
  love: "爱情",
  survival: "生存",
};

const choiceOne: ChoiceOption[] = [
  { id:"kiss", label:"主动吻他", detail:"让这个夜晚不再需要语言", tendency:"love", motif:"照片", memory:"停电的夜里，她先吻了他。", confirmation:"她没有等电影重新亮起。" },
  { id:"poem", label:"送他一首诗", detail:"把说不出口的话留在纸上", tendency:"idealism", motif:"诗页", memory:"她把诗留给他，相信文字比黑暗长久。", confirmation:"那张纸后来被折了四次。" },
  { id:"leave", label:"假装若无其事地离开", detail:"把心动收进一个安全的秘密", tendency:"survival", motif:"车票", memory:"她先走下楼梯，却整夜没有睡着。", confirmation:"脚步很稳，心跳不是。" },
];

const choiceTwo: ChoiceOption[] = [
  { id:"burn", label:"烧毁名单", detail:"先保护自己和仍在校园的人", tendency:"survival", motif:"灰烬", memory:"她看着名字变成灰，记住了每一笔。", confirmation:"火只用了二十秒。" },
  { id:"reporter", label:"交给外国记者", detail:"让世界知道谁被带走了", tendency:"idealism", motif:"铅字", memory:"她把名单递出墙外，也把危险留给了朋友。", confirmation:"纸离开她的手时，比想象中更轻。" },
  { id:"book", label:"藏进诗集", detail:"让诗替他们保存名字", tendency:"love", motif:"诗页", memory:"她把名单藏进他们一起读过的诗集。", confirmation:"书脊合上，名字仍在里面呼吸。" },
];

const choiceThree: ChoiceOption[] = [
  { id:"truth", label:"告诉他全部真相", detail:"包括婚姻，包括害怕，也包括爱", tendency:"love", motif:"照片", memory:"她把最难听的真话留给了最爱的人。", confirmation:"真话没有使夜晚更轻。" },
  { id:"conceal", label:"只说自己要离开", detail:"不让婚姻成为最后的伤口", tendency:"survival", motif:"车票", memory:"她省略了婚姻，保住最后一点体面。", confirmation:"她把最锋利的那部分留给自己。" },
  { id:"escape", label:"请求他带自己逃走", detail:"再给共同未来最后一次机会", tendency:"idealism", motif:"地图", memory:"她最后问了一次，而他的沉默就是回答。", confirmation:"城市很大，却没有一条他们共同的出口。" },
];

export const scenes: Scene[] = [
  {
    id:"prologue", kind:"narrative", chapter:"prologue", chapterLabel:"序章 · 没有寄出的照片", place:"伊斯坦布尔 · 卡拉柯伊", year:"十三年后",
    art:"/art-v2/istanbul-cafe.png",
    body:[
      "莱拉提前二十分钟到了。她把德黑兰大学的毕业照压在糖罐下面，照片里的她和阿拉什站在人群两端，却都没有看镜头。",
      "门铃响了一声。阿拉什走进咖啡馆，先看见她，又看见桌上的照片。十三年里预演过的句子忽然全部失效。",
      "他们最后只说了一句：你好。"
    ]
  },
  {
    id:"chapter-one", kind:"chapter", chapter:"chapter1", chapterLabel:"第一章", place:"革命街上的恋人", year:"德黑兰 · 2008", art:"/art-v2/street-rain.png",
    body:["有些故事开始时，并不知道自己将成为回忆。"]
  },
  {
    id:"campus", kind:"narrative", chapter:"chapter1", chapterLabel:"第一章 · 革命街上的恋人", place:"德黑兰大学 · 文学课",
    art:"/art-v2/street-rain.png", speaker:"莱拉",
    body:[
      "教授说，那首诗里的门象征服从。莱拉举起手：如果门只能这样解释，诗人为什么还要写一把钥匙？",
      "教室安静下来。最后一排的男生低头笑了一下。他叫阿拉什，电子工程系，来旁听只是为了躲一节电路实验。",
      "下课时，他追到走廊，把一张没有地址的电影票夹进她的书里。"
    ]
  },
  {
    id:"ticket", kind:"narrative", chapter:"chapter1", chapterLabel:"第一章 · 革命街上的恋人", place:"文学系走廊", art:"/art-v2/basement-cinema.png", speaker:"阿拉什",
    body:[
      "“今晚八点，革命街旧书店地下室。别告诉不爱电影的人。”",
      "“如果我也不爱呢？”",
      "“那你可以来看一群人如何假装自己不害怕。”"
    ]
  },
  {
    id:"screening", kind:"narrative", chapter:"chapter1", chapterLabel:"第一章 · 革命街上的恋人", place:"旧书店地下室", art:"/art-v2/basement-cinema.png",
    body:[
      "莱拉负责翻译字幕，阿拉什负责让一台比他们年纪更大的放映机继续工作。银幕上，一个女人正在离开故乡，波斯语字幕却慢了整整三秒。",
      "观众笑起来。莱拉俯身改时间轴，阿拉什用螺丝刀敲了敲机器。就在他们肩膀碰到一起时，整条街停了电。",
      "黑暗里，电影的声音还在继续。"
    ]
  },
  {
    id:"choice-one", kind:"choice", chapter:"chapter1", chapterLabel:"记忆选择 I", place:"停电后的地下室", art:"/art-v2/basement-cinema.png", choiceId:"choice-one", speaker:"阿拉什",
    body:["“看不见画面，故事也不会消失。”他站得很近。多年以后，你希望莱拉怎样记住这一刻？"],
    choices:choiceOne
  },
  {
    id:"love-montage", kind:"montage", chapter:"chapter1", chapterLabel:"蒙太奇 · 很多个夜晚", place:"德黑兰", art:"/art-v2/street-rain.png", echoFrom:"choice-one",
    beats:[
      "他们在屋顶分一只石榴，争论一首诗究竟写的是爱情还是恐惧。",
      "莱拉翻译被删去的对白，阿拉什把收音机改到能听见远方的频率。",
      "雨下得很小时，他们故意只带一把伞。",
      "他们开始把“以后”说得很具体：一间有两扇窗的房子，一张能放下两台电脑的桌子，还有一个不用压低声音说话的地方。"
    ]
  },
  {
    id:"promise", kind:"narrative", chapter:"chapter1", chapterLabel:"第一章 · 革命街上的恋人", place:"德黑兰大学 · 毕业照那天", art:"/art-v2/street-rain.png", speaker:"莱拉与阿拉什",
    body:[
      "摄影师让所有人看镜头，他们却隔着人群看向彼此。",
      "“谁先离开，就等另一个人。”",
      "那时他们以为，离开只是买两张票的问题。"
    ]
  },
  {
    id:"chapter-two", kind:"chapter", chapter:"chapter2", chapterLabel:"第二章", place:"知识变成证据", year:"德黑兰 · 2009", art:"/art-v2/poetry-list.png",
    body:["他们曾用知识寻找出口。后来，知识先替权力找到了他们。"]
  },
  {
    id:"publication", kind:"narrative", chapter:"chapter2", chapterLabel:"第二章 · 知识变成证据", place:"学生宿舍 · 深夜", art:"/art-v2/poetry-list.png",
    body:[
      "刊物最初只写诗、电影和女性如何独自乘夜班车。每一期印四十份，纸张来自不同文印店，避免有人记住他们。",
      "后来，空白越来越难以绕开。玛兹雅写了一篇关于失踪学生的文章，莱拉改完最后一个句号，房间里谁也没有说话。",
      "阿拉什把窗帘拉紧：文字一旦印出来，就不再只属于写下它的人。"
    ]
  },
  {
    id:"protest", kind:"narrative", chapter:"chapter2", chapterLabel:"第二章 · 知识变成证据", place:"德黑兰大学广场", art:"/art-v2/poetry-list.png",
    body:[
      "集会只持续了十七分钟。口号还没有喊整齐，校园的门便从里面锁上。",
      "第二天，三张座位空着。有人说他们回了家，有人说他们被带去问话。玛兹雅把一份参与者名单塞给莱拉，只说：如果我不回来，别让他们像没存在过。",
      "走廊尽头传来宿舍搜查的脚步。"
    ]
  },
  {
    id:"choice-two", kind:"choice", chapter:"chapter2", chapterLabel:"记忆选择 II", place:"宿舍搜查前夜", art:"/art-v2/poetry-list.png", choiceId:"choice-two", speaker:"阿拉什",
    body:["“烧掉它，你才能安全。”莱拉看着纸上的名字。要保护活着的人，还是留下他们存在过的证据？"],
    choices:choiceTwo
  },
  {
    id:"investigation", kind:"narrative", chapter:"chapter2", chapterLabel:"第二章 · 知识变成证据", place:"大学纪律委员会", art:"/art-v2/poetry-list.png", echoFrom:"choice-two",
    body:[
      "调查的人没有提高声音。他只是把莱拉翻译过的电影、改过的文章和参加过的读书会依次推到桌上。",
      "“你一直说这些只是文学。为什么文学总把你带到同一群人身边？”",
      "她失去继续深造的资格。出版社撤回工作邀请，护照申请也从此没有回音。选择没有改变处分，却改变了她后来如何看待那张名单。"
    ]
  },
  {
    id:"after-gate", kind:"narrative", chapter:"chapter2", chapterLabel:"第二章 · 知识变成证据", place:"大学铁门外", art:"/art-v2/poetry-list.png", speaker:"莱拉",
    body:[
      "阿拉什隔着铁门说，他们还可以写，还可以等。",
      "莱拉第一次发现，“我们”这个词并不总能平均分担后果。阿拉什仍能回实验室，而她连一份校对工作都找不到。",
      "世界没有在那天结束。它只是变窄了。"
    ]
  },
  {
    id:"chapter-three", kind:"chapter", chapter:"chapter3", chapterLabel:"第三章", place:"只有一个人能够离开", year:"德黑兰 · 2010", art:"/art-v2/departure-station.png",
    body:["爱可以让两个人共同忍耐，却不能替他们回答：为什么而忍耐。"]
  },
  {
    id:"small-room", kind:"narrative", chapter:"chapter3", chapterLabel:"第三章 · 只有一个人能够离开", place:"德黑兰 · 出租屋", art:"/art-v2/departure-station.png",
    body:[
      "他们搬进一间临街的出租屋。白天，莱拉翻译软件说明书；夜里，她给盗版电影配字幕。阿拉什替邻居修电脑，把报酬塞进装茶叶的铁盒。",
      "停电时，他们仍会点蜡烛读诗。只是蜡烛旁边多了房租、药费和一封又一封没有回音的护照申请。",
      "共同生活不再是屋顶上的想象，而是一张每天都要重新计算的账单。"
    ]
  },
  {
    id:"one-year", kind:"narrative", chapter:"chapter3", chapterLabel:"第三章 · 只有一个人能够离开", place:"出租屋 · 凌晨", art:"/art-v2/departure-station.png", speaker:"莱拉与阿拉什",
    body:[
      "“如果一年以后什么也没有改变呢？”",
      "阿拉什很久才说：“那就再等一年。总要有人留下，证明这里不只剩沉默。”",
      "“你把留下当作理想。可我已经快要在这里变成另一个人。”"
    ]
  },
  {
    id:"kamran", kind:"narrative", chapter:"chapter3", chapterLabel:"第三章 · 只有一个人能够离开", place:"圣何塞 / 德黑兰 · 视频通话", art:"/art-v2/san-jose.png", speaker:"卡姆兰",
    body:[
      "姨妈介绍的男人叫卡姆兰，在圣何塞一家软件外包公司工作。他没有展示汽车或泳池，只把摄像头转向堆着纸箱的客厅。",
      "“我写代码、堵车、还贷款。美国没有你想象的那么像电影。”",
      "他停了一下：“我知道你不是为了爱找我。但如果你愿意认真对待这段婚姻，我可以帮你离开。”"
    ]
  },
  {
    id:"choice-three", kind:"choice", chapter:"chapter3", chapterLabel:"记忆选择 III", place:"德黑兰屋顶 · 最后一夜", art:"/art-v2/departure-station.png", choiceId:"choice-three", speaker:"莱拉",
    body:["离开前，她最后一次来到屋顶。城市仍是他们熟悉的样子。她要怎样把这场离开告诉阿拉什？"],
    choices:choiceThree
  },
  {
    id:"departure", kind:"narrative", chapter:"chapter3", chapterLabel:"第三章 · 只有一个人能够离开", place:"德黑兰火车站", art:"/art-v2/departure-station.png",
    body:[
      "天亮以前，莱拉拖着一只旧箱子走向站台。她每经过一根柱子，都以为下一根后面会出现阿拉什。",
      "列车鸣笛时，他确实来了，却只站在时钟下面。两个人隔着人群，没有挥手。",
      "从列车开动的那天起，他们仍然相爱，却不再拥有同一个未来。"
    ]
  },
  {
    id:"chapter-four", kind:"chapter", chapter:"chapter4", chapterLabel:"第四章", place:"两个城市", year:"圣何塞 / 德黑兰 · 2011—2021", art:"/art-v2/san-jose.png",
    body:["离开不是抵达。留下也不是停止。"]
  },
  {
    id:"america-montage", kind:"montage", chapter:"chapter4", chapterLabel:"蒙太奇 · 圣何塞", place:"一段普通的美国生活", art:"/art-v2/san-jose.png",
    beats:[
      "莱拉的学历不被完全承认。她在软件公司检查别人写好的波斯语句子，找出标点和方向错误。",
      "卡姆兰替她改简历，在她半夜想家时开车去二十四小时营业的伊朗超市。",
      "他们没有突然相爱。只是账单有人分担，生病时有人记得买药，沉默也不再总需要解释。",
      "有一天，莱拉发现自己已经会在下班路上顺手买卡姆兰喜欢的石榴。"
    ]
  },
  {
    id:"two-cities", kind:"montage", chapter:"chapter4", chapterLabel:"蒙太奇 · 两个城市", place:"圣何塞 / 德黑兰", art:"/art-v2/san-jose.png",
    beats:[
      "阿拉什留在大学实验室，后来在家人的安排下认识玛丽亚姆。她不懂他年轻时谈论的电影，却记得给他父亲按时送药。",
      "他们都结了婚，都学会了如何对一个没有参与旧日爱情的人负责。",
      "曾经讨论革命的年轻人，开始讨论孩子的学费、堵车和漏水的管道。",
      "邮件从一页变成一段，从一段变成节日问候，最后只剩一句：革命街上的旧书店关门了。"
    ]
  },
  {
    id:"last-email", kind:"narrative", chapter:"chapter4", chapterLabel:"第四章 · 两个城市", place:"一封没有回复的邮件", art:"/art-v2/san-jose.png", speaker:"阿拉什",
    body:[
      "莱拉读完那句话，打开回复框。她写：我记得地下室的味道。删掉。又写：那本诗集还在吗？再次删掉。",
      "卡姆兰在卧室叫她早点睡。她合上电脑，没有回复。",
      "沉默终于不再是一场争吵，而是一种已经形成的生活。"
    ]
  },
  {
    id:"chapter-five", kind:"chapter", chapter:"chapter5", chapterLabel:"第五章", place:"伊斯坦布尔重逢", year:"十三年后", art:"/art-v2/istanbul-cafe.png",
    body:["他们不是来重新选择，只是想确认那段过去确实存在。"]
  },
  {
    id:"reunion", kind:"narrative", chapter:"chapter5", chapterLabel:"第五章 · 伊斯坦布尔重逢", place:"卡拉柯伊 · 老咖啡馆", art:"/art-v2/istanbul-cafe.png", echoFrom:"choice-three", speaker:"阿拉什与莱拉",
    body:[
      "“你过得好吗？”——“还可以。你呢？”——“也还可以。”十三年被两句礼貌的话轻轻盖住。",
      "他们谈起教授、放映机、已经关门的旧书店，也谈各自的伴侣和孩子。没有人要求另一个人证明谁爱得更多。",
      "有些细节却比语言更诚实。"
    ]
  },
  {
    id:"book", kind:"narrative", chapter:"chapter5", chapterLabel:"第五章 · 伊斯坦布尔重逢", place:"诗集与照片", art:"/art-v2/istanbul-cafe.png",
    body:[
      "阿拉什从包里拿出那本诗集。书页已经发黄，年轻时的合照仍夹在原来的位置。",
      "莱拉用手指抚平照片翘起的一角。她没有带走它，只把照片放回书里，把书推还给阿拉什。",
      "不是所有被保存的东西，都必须被带走。"
    ]
  },
  {
    id:"crossroads", kind:"narrative", chapter:"chapter5", chapterLabel:"终章 · 另一个故事", place:"伊斯坦布尔街头", art:"/art-v2/istanbul-crossroad.png", speaker:"阿拉什与莱拉",
    body:[
      "绿灯亮起。莱拉要去机场，阿拉什要回酒店。他们站在路口，没有拥抱，也没有接吻。",
      "“如果当年我跟你走了呢？”",
      "莱拉看着他：“那我们会有另一个故事。”人群涌来，他们向不同方向走去。"
    ]
  }
];

export const choiceEchoes: Record<string, Record<string, string>> = {
  "choice-one":{
    kiss:"后来每逢停电，她都会想起自己先靠近的那一步；爱在那一刻不是承诺，只是一种不肯退后的本能。",
    poem:"阿拉什把那首诗折成很小的一页，夹在工具盒里。多年后莱拉仍记得他手指沾着机油，却不肯弄脏纸角。",
    leave:"她那晚先离开，第二天却比约定早到十分钟。有些谨慎不是拒绝，只是给勇气多争取一个夜晚。"
  },
  "choice-two":{
    burn:"调查桌上没有那张名单。莱拉因此安全了一点，也因此永远无法确认自己究竟救下了谁。",
    reporter:"名单已经到了墙外。她不知道世界是否听见，却知道有人会因这次传递继续被追问。",
    book:"问话时，她想的不是处分，而是那本诗集是否仍安静地躺在书架上，替所有人保管名字。"
  },
  "choice-three":{
    truth:"莱拉注意到阿拉什听她提起卡姆兰时仍会垂下眼睛，和那晚一样；亲密感没有消失，只是失去了使用它的权利。",
    conceal:"她先看了一眼墙上的时钟和通往机场的路线。现实教会她，告别也有必须赶上的航班。",
    escape:"阿拉什谈起旧书店时，她听见的不是怀旧，而是他们曾相信可以共同改变的世界仍在远处回响。"
  }
};

export const reunionObservations: Record<EndingKey, string> = {
  love:"她先认出他笑起来时眼角新添的纹路，也认出他端茶时仍会用拇指摩挲杯沿。身体记住的亲密，比语言更慢消失。",
  idealism:"她一直看着那本诗集。旧书店关了，刊物散了，可他们当年相信过的事情并没有因此变得可笑。",
  survival:"她注意到离机场还有多久，也注意到阿拉什手机上来自家人的未接来电。两个人都已经有人在现实生活里等待。",
  mixed:"她同时看见他的白发、诗集的折痕和窗外通往机场的车流。任何一种记忆，都不足以解释完整的一生。"
};

export const endings: Record<EndingKey,{title:string;quote:string;body:string;coda:string}> = {
  idealism:{title:"你记住了他们曾相信的事",quote:"“我们没有改变时代，但时代改变了我们。”",body:"你更在意那些被写下、被保存、被问出口的事。勇敢没有带来胜利，却让一些名字没有彻底消失。",coda:"理想没有替他们找到共同的路，却让那条路曾经发过光。"},
  love:{title:"你记住了他们的爱情",quote:"“我没有忘记他，只是学会了不再回去。”",body:"你保留了亲吻、照片与难听的真话。爱没有把他们带到一起，却让年轻时的德黑兰始终真实。",coda:"他们没有重新开始，因为他们从未否认那段爱情发生过。"},
  survival:{title:"你记住了他们如何活下去",quote:"“离开不是胜利，只是另一种活下去。”",body:"你知道保护自己并不等于怯懦。莱拉没有抵达梦想中的自由，只是终于拥有了决定明天的权利。",coda:"活下去并不壮烈，但它让人有机会继续成为自己。"},
  mixed:{title:"你记住了他们完整的矛盾",quote:"“没有一种记忆，足以解释完整的一生。”",body:"他们既相爱，也曾相信理想，最后还必须学会活下去。三种力量彼此冲突，也共同构成了他们。",coda:"完整不是没有矛盾，而是允许矛盾同时为真。"}
};

export const revisitScenes: Scene[] = [
  {id:"revisit-context-one",kind:"narrative",chapter:"chapter1",chapterLabel:"关键记忆 I",place:"旧书店地下室",art:"/art-v2/basement-cinema.png",body:["停电以后，电影只剩下声音。阿拉什站得很近。你会怎样重新记住这一刻？"]},
  scenes.find(scene=>scene.id==="choice-one")!,
  {id:"revisit-context-two",kind:"narrative",chapter:"chapter2",chapterLabel:"关键记忆 II",place:"宿舍搜查前夜",art:"/art-v2/poetry-list.png",body:["脚步正在靠近。名字、风险和那本诗集，再次回到你的手中。"]},
  scenes.find(scene=>scene.id==="choice-two")!,
  {id:"revisit-context-three",kind:"narrative",chapter:"chapter3",chapterLabel:"关键记忆 III",place:"德黑兰屋顶",art:"/art-v2/departure-station.png",body:["离开已经无法改变。你能改变的，只是莱拉如何说出最后的话。"]},
  scenes.find(scene=>scene.id==="choice-three")!,
];

export const choiceIds = ["choice-one","choice-two","choice-three"];
