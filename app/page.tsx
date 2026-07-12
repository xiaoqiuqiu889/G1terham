"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AudioEngine } from "./audio-engine";
import { AnswerRecord, choiceDiff, determineEnding, EndingKey, memoryStrength, scoreAnswers, Tendency } from "./game-logic";
import { choiceEchoes, choiceIds, endings, reunionObservations, revisitScenes, Scene, scenes, tendencyNames } from "./story";

const SAVE_KEY = "revolution-street-save-v3";
const LAST_RUN_KEY = "revolution-street-last-run-v3";
const SOUND_KEY = "revolution-street-sound-v1";

type Mode = "full" | "revisit";
type HistoryEntry = { sceneIndex:number; beatIndex:number; answers:Record<string,AnswerRecord> };
type SaveData = {
  version:3; mode:Mode; sceneIndex:number; beatIndex:number;
  answers:Record<string,AnswerRecord>; history:HistoryEntry[]; savedAt:number;
};
type CompletedRun = { ending:EndingKey; answers:Record<string,AnswerRecord>; completedAt:number };

function Backdrop({ src }: { src?:string }) {
  return <div className="artwork" aria-hidden="true">
    <img src={src || "/art-v2/street-rain.png"} alt="" draggable={false}/>
    <div className="film-grain"/><div className="vignette"/>
  </div>;
}

function formatSavedTime(timestamp:number) {
  return new Intl.DateTimeFormat("zh-CN",{month:"short",day:"numeric",hour:"2-digit",minute:"2-digit"}).format(timestamp);
}

export default function Home() {
  const [started,setStarted]=useState(false);
  const [mode,setMode]=useState<Mode>("full");
  const [sceneIndex,setSceneIndex]=useState(0);
  const [beatIndex,setBeatIndex]=useState(0);
  const [answers,setAnswers]=useState<Record<string,AnswerRecord>>({});
  const [history,setHistory]=useState<HistoryEntry[]>([]);
  const [selectedOption,setSelectedOption]=useState<string|null>(null);
  const [journalOpen,setJournalOpen]=useState(false);
  const [soundOn,setSoundOn]=useState(false);
  const [soundPreferred,setSoundPreferred]=useState(false);
  const [savedGame,setSavedGame]=useState<SaveData|null>(null);
  const [lastRun,setLastRun]=useState<CompletedRun|null>(null);
  const [comparisonBase,setComparisonBase]=useState<CompletedRun|null>(null);
  const [saveNotice,setSaveNotice]=useState("");
  const [endingRevealed,setEndingRevealed]=useState(false);
  const [hydrated,setHydrated]=useState(true);
  const audioRef=useRef<AudioEngine|null>(null);
  const choiceTimerRef=useRef<number|null>(null);
  const journalTriggerRef=useRef<HTMLButtonElement|null>(null);
  const journalCloseRef=useRef<HTMLButtonElement|null>(null);
  const recordedRef=useRef("");

  const activeScenes=mode==="revisit"?revisitScenes:scenes;
  const finished=sceneIndex>=activeScenes.length;
  const scene=activeScenes[Math.min(sceneIndex,activeScenes.length-1)];
  const scores=useMemo(()=>scoreAnswers(answers),[answers]);
  const endingKey=useMemo(()=>determineEnding(scores),[scores]);
  const progress=finished?100:Math.round(((sceneIndex+1)/activeScenes.length)*100);

  const echo=scene?.echoFrom&&answers[scene.echoFrom]
    ? choiceEchoes[scene.echoFrom]?.[answers[scene.echoFrom].optionId] : "";
  const personalized=(scene?.id==="reunion"||scene?.id==="crossroads")?reunionObservations[endingKey]:"";
  const body=[...(scene?.body||[]),...(echo?[echo]:[]),...(personalized?[personalized]:[])];
  const currentBody=body.slice(0,Math.min(beatIndex+1,body.length));
  const montageBeats=scene?.beats||[];
  const montageComplete=scene?.kind==="montage"&&beatIndex>=montageBeats.length-1;

  const snapshot=():HistoryEntry=>({sceneIndex,beatIndex,answers});
  const currentSave=():SaveData=>({version:3,mode,sceneIndex,beatIndex,answers,history,savedAt:Date.now()});

  useEffect(()=>{
    try {
      const saved=localStorage.getItem(SAVE_KEY);
      const completed=localStorage.getItem(LAST_RUN_KEY);
      const sound=localStorage.getItem(SOUND_KEY)==="on";
      if(saved)setSavedGame(JSON.parse(saved));
      if(completed)setLastRun(JSON.parse(completed));
      setSoundPreferred(sound);
    } catch {}
    setHydrated(true);
  },[]);

  useEffect(()=>{
    if(!hydrated||!started||finished||selectedOption)return;
    const data=currentSave();
    localStorage.setItem(SAVE_KEY,JSON.stringify(data));
    setSavedGame(data);
  },[hydrated,started,mode,sceneIndex,beatIndex,answers,history,finished,selectedOption]);

  useEffect(()=>{
    if(!started||!finished||Object.keys(answers).length!==3)return;
    const signature=mode+":"+choiceIds.map(id=>answers[id]?.optionId).join("|");
    if(recordedRef.current===signature)return;
    recordedRef.current=signature;
    const completed:CompletedRun={ending:endingKey,answers,completedAt:Date.now()};
    localStorage.setItem(LAST_RUN_KEY,JSON.stringify(completed));
    localStorage.removeItem(SAVE_KEY);
    setSavedGame(null);
    setLastRun(completed);
    audioRef.current?.setChapter("ending");
    audioRef.current?.cue("ending");
  },[started,finished,answers,endingKey,mode]);

  useEffect(()=>{
    if(scene?.kind!=="montage"||montageComplete||journalOpen)return;
    const timer=window.setTimeout(()=>setBeatIndex(value=>Math.min(value+1,montageBeats.length-1)),1250);
    return()=>window.clearTimeout(timer);
  },[scene?.id,scene?.kind,beatIndex,montageComplete,journalOpen,montageBeats.length]);

  useEffect(()=>{
    if(soundOn&&scene)audioRef.current?.setChapter(scene.chapter);
  },[scene?.chapter,soundOn]);

  useEffect(()=>{
    if(!journalOpen)return;
    const previous=document.body.style.overflow;
    document.body.style.overflow="hidden";
    window.setTimeout(()=>journalCloseRef.current?.focus(),0);
    return()=>{
      document.body.style.overflow=previous;
      window.setTimeout(()=>journalTriggerRef.current?.focus(),0);
    };
  },[journalOpen]);

  useEffect(()=>()=>{
    if(choiceTimerRef.current)window.clearTimeout(choiceTimerRef.current);
    audioRef.current?.stop();
  },[]);

  const startSound=async()=>{
    if(!audioRef.current)audioRef.current=new AudioEngine();
    await audioRef.current.start(scene?.chapter||"prologue");
    setSoundOn(true);setSoundPreferred(true);localStorage.setItem(SOUND_KEY,"on");
  };
  const toggleSound=()=>{
    if(soundOn){audioRef.current?.stop();audioRef.current=null;setSoundOn(false);setSoundPreferred(false);localStorage.setItem(SOUND_KEY,"off")}
    else void startSound();
  };

  const startFresh=()=>{
    setStarted(true);setMode("full");setSceneIndex(0);setBeatIndex(0);setAnswers({});setHistory([]);
    setComparisonBase(null);setEndingRevealed(false);setSelectedOption(null);recordedRef.current="";
    localStorage.removeItem(SAVE_KEY);
    if(soundPreferred)void startSound();
  };

  const continueSaved=()=>{
    if(!savedGame)return;
    setMode(savedGame.mode);setSceneIndex(savedGame.sceneIndex);setBeatIndex(savedGame.beatIndex);
    setAnswers(savedGame.answers);setHistory(savedGame.history||[]);setStarted(true);setEndingRevealed(false);
    if(soundPreferred)void startSound();
  };

  const enterNextScene=()=>{
    if(selectedOption||finished)return;
    setHistory(value=>[...value,snapshot()]);
    const next=sceneIndex+1;
    if(activeScenes[next]?.kind==="chapter")audioRef.current?.cue("transition");
    setSceneIndex(next);setBeatIndex(0);
  };

  const advance=()=>{
    if(selectedOption||journalOpen||finished)return;
    if(scene.kind==="montage"){
      if(!montageComplete){setBeatIndex(Math.max(0,montageBeats.length-1));return}
      enterNextScene();return;
    }
    if(beatIndex<body.length-1){setBeatIndex(value=>value+1);return}
    if(scene.kind!=="choice")enterNextScene();
  };

  const choose=(choiceId:string,optionId:string)=>{
    if(selectedOption)return;
    const option=scene.choices?.find(item=>item.id===optionId);
    if(!option)return;
    setSelectedOption(optionId);
    audioRef.current?.cue("choice");
    const reduced=window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    choiceTimerRef.current=window.setTimeout(()=>{
      const record:AnswerRecord={choiceId,optionId,label:option.label,tendency:option.tendency,memory:option.memory,motif:option.motif};
      setHistory(value=>[...value,snapshot()]);
      setAnswers(value=>({...value,[choiceId]:record}));
      setSceneIndex(value=>value+1);setBeatIndex(0);setSelectedOption(null);
      choiceTimerRef.current=null;
    },reduced?140:760);
  };

  const goBack=()=>{
    if(selectedOption||!history.length)return;
    const previous=history[history.length-1];
    setSceneIndex(previous.sceneIndex);setBeatIndex(previous.beatIndex);setAnswers(previous.answers);
    setHistory(value=>value.slice(0,-1));setEndingRevealed(false);
  };

  const saveNow=()=>{
    if(!started||finished)return;
    const data=currentSave();
    localStorage.setItem(SAVE_KEY,JSON.stringify(data));setSavedGame(data);
    setSaveNotice("进度已保存到本设备");audioRef.current?.cue("save");
    window.setTimeout(()=>setSaveNotice(""),1600);
  };

  const openJournal=(event:React.MouseEvent<HTMLButtonElement>)=>{
    journalTriggerRef.current=event.currentTarget;setJournalOpen(true);
  };

  const startRevisit=()=>{
    if(!lastRun)return;
    setComparisonBase(lastRun);setMode("revisit");setSceneIndex(0);setBeatIndex(0);setAnswers({});setHistory([]);
    setStarted(true);setEndingRevealed(false);setSelectedOption(null);recordedRef.current="";
    if(soundPreferred)void startSound();
  };

  useEffect(()=>{
    const onKey=(event:KeyboardEvent)=>{
      if(journalOpen&&event.key==="Escape"){setJournalOpen(false);return}
      if(journalOpen||selectedOption)return;
      if(event.key.toLowerCase()==="j"&&started&&!finished){journalTriggerRef.current=document.querySelector(".journal-trigger");setJournalOpen(true);return}
      if((event.key===" "||event.key==="Enter")&&started&&!scene?.choices){event.preventDefault();advance()}
      if(event.key==="ArrowLeft")goBack();
    };
    window.addEventListener("keydown",onKey);return()=>window.removeEventListener("keydown",onKey);
  });

  if(!hydrated)return <main className="game-shell loading-screen">正在整理记忆……</main>;

  return <main className="game-shell">
    <div className="cinema-frame">
      {!started?<section className="title-screen">
        <Backdrop src="/art-v2/street-rain.png"/>
        <div className="title-content">
          <p className="kicker">一部关于选择与记忆的互动电影</p>
          <h1>革命街<br/>没有尽头</h1>
          <p className="farsi" lang="fa" dir="rtl">خیابان انقلاب پایانی ندارد</p>
          <p className="logline">他们失去的不是爱情，而是共同生活的可能。</p>
          <div className="title-actions">
            {savedGame&&<button className="start-button" onClick={continueSaved}><span>继续上次记忆</span><span>→</span><small>{formatSavedTime(savedGame.savedAt)} · {Math.round(((savedGame.sceneIndex+1)/(savedGame.mode==="revisit"?revisitScenes.length:scenes.length))*100)}%</small></button>}
            <button className={savedGame?"ghost-button large":"start-button"} onClick={startFresh}>{savedGame?"从头开始":"进入故事"}</button>
          </div>
          <div className="title-meta"><span>完整体验 6–8 分钟</span><span>3 次记忆选择</span><span>自动保存</span></div>
        </div>
      </section>:finished&&!endingRevealed?<section className="ending-ritual">
        <Backdrop src="/art-v2/istanbul-crossroad.png"/>
        <div className="ritual-content"><span className="archive-mark">记忆归档 · 03</span><div className="ritual-line"/><p>绿灯亮起，他们走向不同方向。</p><h2>历史已经发生。<br/>现在，看看你如何记住它。</h2><button className="start-button" onClick={()=>{setEndingRevealed(true);audioRef.current?.cue("ending")}}>翻开最后一页 <span>→</span></button></div>
      </section>:finished?<EndingScreen endingKey={endingKey} answers={answers} mode={mode} comparisonBase={comparisonBase} onFresh={startFresh} onRevisit={startRevisit} onJournal={openJournal}/>:scene.kind==="chapter"?<section className="chapter-screen" key={scene.id}>
        <Backdrop src={scene.art}/><div className="chapter-card"><p>{scene.year}</p><span>{scene.chapterLabel}</span><h2>{scene.place}</h2><div className="chapter-rule"/><blockquote>{scene.body?.[0]}</blockquote><button className="continue-button" onClick={enterNextScene}>进入本章 <span>→</span></button></div>
      </section>:<section className={`scene ${scene.kind}`} key={scene.id}>
        <Backdrop src={scene.art}/>
        <GameHeader progress={progress} soundOn={soundOn} onSound={toggleSound} onBack={goBack} canBack={history.length>0&&!selectedOption} onSave={saveNow} onJournal={openJournal}/>
        <div className="scene-copy">
          <div className="location-row"><span>{scene.chapterLabel}</span><span className="location">{scene.place}</span></div>
          {scene.speaker&&<p className="speaker">{scene.speaker}</p>}
          {scene.kind==="montage"?<div className="montage-lines">{montageBeats.map((beat,index)=><p key={beat} className={index<=beatIndex?"visible":""}><span>0{index+1}</span>{beat}</p>)}</div>
          :<div className="dialogue-stack">{currentBody.map((paragraph,index)=><p className="dialogue" key={index}>{paragraph}</p>)}</div>}
          {scene.kind==="choice"?<div className={`choices ${selectedOption?"confirming":""}`} aria-label="选择莱拉将如何记住这一刻">
            {scene.choices?.map((option,index)=>{const selected=selectedOption===option.id;const previous=comparisonBase?.answers[scene.choiceId||""]?.optionId===option.id;return <button key={option.id} disabled={Boolean(selectedOption)} className={selected?"selected":selectedOption?"faded":""} onClick={()=>choose(scene.choiceId!,option.id)}>
              <span className="choice-number">0{index+1}</span><span><strong>{option.label}</strong><small>{option.detail}</small>{previous&&mode==="revisit"&&<em>上轮选择</em>}</span><span className="choice-arrow">↗</span>
            </button>})}
            {selectedOption&&<div className="choice-memory" role="status"><span>记忆留下</span><strong>{scene.choices?.find(option=>option.id===selectedOption)?.memory}</strong><small>{scene.choices?.find(option=>option.id===selectedOption)?.confirmation}</small></div>}
          </div>:<button className="continue-button" onClick={advance}>{scene.kind==="montage"&&!montageComplete?"显示全部":"继续"} <span>→</span></button>}
        </div>
        <div className="progress-track"><div style={{width:`${progress}%`}}/></div>
      </section>}

      {saveNotice&&<div className="save-toast" role="status">{saveNotice}</div>}
      {journalOpen&&<Journal answers={answers} onClose={()=>setJournalOpen(false)} closeRef={journalCloseRef}/>}
    </div>
    <p className="outside-hint">← 返回上一幕 · 空格继续 · J 记忆册</p>
  </main>;
}

function GameHeader({progress,soundOn,onSound,onBack,canBack,onSave,onJournal}:{progress:number;soundOn:boolean;onSound:()=>void;onBack:()=>void;canBack:boolean;onSave:()=>void;onJournal:(e:React.MouseEvent<HTMLButtonElement>)=>void}) {
  return <header className="topbar"><div className="mini-title"><span>革命街没有尽头</span><small>{progress}%</small></div><div className="top-actions">
    <button onClick={onBack} disabled={!canBack} aria-label="回到上一幕">← <span>上一幕</span></button>
    <button onClick={onSave} aria-label="保存进度">＋ <span>保存</span></button>
    <button className="journal-trigger" onClick={onJournal} aria-label="打开记忆册">▤ <span>记忆册</span></button>
    <button onClick={onSound} aria-label={soundOn?"关闭环境音":"开启环境音"}>{soundOn?"♪":"♩"} <span>{soundOn?"声音开":"声音关"}</span></button>
  </div></header>;
}

function Journal({answers,onClose,closeRef}:{answers:Record<string,AnswerRecord>;onClose:()=>void;closeRef:React.RefObject<HTMLButtonElement|null>}) {
  const scores=scoreAnswers(answers);
  const motifs=Object.values(answers);
  return <div className="journal-backdrop" role="dialog" aria-modal="true" aria-labelledby="journal-title" onMouseDown={event=>{if(event.target===event.currentTarget)onClose()}}>
    <section className="journal"><button ref={closeRef} className="close-button" onClick={onClose} aria-label="关闭记忆册">×</button>
      <p className="kicker">莱拉的记忆册</p><h2 id="journal-title">记忆不是答案，<br/>只是我们带走的东西。</h2>
      <div className="motif-strip">{motifs.length?motifs.map(item=><span key={item.choiceId}>{item.motif}</span>):<span>空白页</span>}</div>
      <div className="memory-notes">{motifs.length?motifs.map((item,index)=><article key={item.choiceId}><span>0{index+1} · {item.motif}</span><p>{item.memory}</p></article>):<p className="empty-memory">故事才刚刚开始。诗页、照片、灰烬与车票还没有显现。</p>}</div>
      <div className="memory-weather">{(["idealism","love","survival"] as Tendency[]).map(key=><div key={key}><span>{tendencyNames[key]}</span><strong>{memoryStrength(scores[key])}</strong><span className="visually-hidden">{tendencyNames[key]}倾向得分为{scores[key]}</span></div>)}</div>
      <button className="start-button compact" onClick={onClose}>回到故事</button>
    </section>
  </div>;
}

function EndingScreen({endingKey,answers,mode,comparisonBase,onFresh,onRevisit,onJournal}:{endingKey:EndingKey;answers:Record<string,AnswerRecord>;mode:Mode;comparisonBase:CompletedRun|null;onFresh:()=>void;onRevisit:()=>void;onJournal:(e:React.MouseEvent<HTMLButtonElement>)=>void}) {
  const ending=endings[endingKey];
  const diffs=comparisonBase?choiceDiff(comparisonBase.answers,answers,choiceIds):[];
  return <section className="ending-screen"><Backdrop src="/art-v2/istanbul-crossroad.png"/><div className="ending-card">
    <div className="ending-seal"><span>你的主导记忆</span><strong>{endingKey==="mixed"?"混合记忆":tendencyNames[endingKey]}</strong></div>
    <p className="kicker">{mode==="revisit"?"关键记忆重访完成":"故事完成 · 记忆归档"}</p><h2>{ending.title}</h2><blockquote>{ending.quote}</blockquote><p>{ending.body}</p>
    <div className="ending-memories">{choiceIds.map((id,index)=>answers[id]&&<article key={id}><span>0{index+1} · {answers[id].motif}</span><p>{answers[id].memory}</p></article>)}</div>
    {mode==="revisit"&&comparisonBase&&<div className="comparison">
      <div className="comparison-head"><span>上轮：{endings[comparisonBase.ending].title}</span><b>→</b><span>本轮：{ending.title}</span><small>{diffs.filter(item=>item.changed).length} 处记忆发生变化</small></div>
      <div className="choice-comparison">{diffs.map((item,index)=><div key={item.choiceId} className={item.changed?"changed":""}><span>关键记忆 0{index+1}</span><p>{item.before?.label||"—"} <b>→</b> {item.after?.label||"—"}</p></div>)}</div>
    </div>}
    <p className="final-line">{ending.coda}</p><div className="ending-actions"><button className="start-button compact" onClick={onFresh}>从头重新体验</button><button className="ghost-button" onClick={onRevisit}>重访关键记忆</button><button className="ghost-button" onClick={onJournal}>查看记忆册</button></div>
  </div></section>;
}


