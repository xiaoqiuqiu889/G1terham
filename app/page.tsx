"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AudioEngine } from "./audio-engine";
import {
  AnswerRecord, Axis, choiceDiff, composeCinematicEpilogue, composeEndingFragments, determineEnding, EndingKey,
  ResonanceRecord, resolveFutureEchoes, scoreAnswers, selectUnchosenFragments,
} from "./game-logic";
import {
  axisExplanations, axisNames, choiceIds, endings, futureEchoRoutes, resonanceIds,
  ResonanceOption, revisitScenes, Scene, scenes, unchosenFragments,
} from "./story";

const SAVE_KEY="revolution-street-save-v5";
const LAST_RUN_KEY="revolution-street-last-run-v5";
const SOUND_KEY="revolution-street-sound-v2";

type Mode="full"|"revisit-quick"|"revisit-full";
type HistoryEntry={
  sceneIndex:number;beatIndex:number;
  answers:Record<string,AnswerRecord>;resonances:Record<string,ResonanceRecord>;
};
type SaveData={
  version:5;mode:Mode;sceneIndex:number;beatIndex:number;
  answers:Record<string,AnswerRecord>;resonances:Record<string,ResonanceRecord>;
  history:HistoryEntry[];savedAt:number;
};
type CompletedRun={
  ending:EndingKey;answers:Record<string,AnswerRecord>;
  resonances:Record<string,ResonanceRecord>;completedAt:number;
};

const echoChoiceByScene:Record<string,string>={
  "echo-one":"choice-one","echo-two":"choice-two","echo-three":"choice-three",
};
const sceneTextures:Record<string,"projector"|"fluorescent"|"keyboard"|"airport"|"tea"|"rain">={campus:"projector",publication:"fluorescent",email:"keyboard","echo-three":"airport",gaze:"tea",crossroads:"rain"};

const isRevisitMode=(mode:Mode)=>mode!=="full";

function Backdrop({src,focus}:{src?:string;focus?:string}){
  const imageSrc=src||"/art-v2/street-rain.png";
  const mobileSrc=imageSrc==="/art-v5/istanbul-reunion-aged.png"?"/art-v5/istanbul-reunion-aged-mobile.png":imageSrc==="/art-v5/istanbul-crossroads-aged.png"?"/art-v5/istanbul-crossroads-aged-mobile.png":imageSrc==="/art-v5/san-jose-arrival-2011.png"?"/art-v5/san-jose-arrival-2011-mobile.png":null;
  return <div className={`artwork ${focus?`focus-${focus}`:""}`} aria-hidden="true">
    <picture key={imageSrc}>{mobileSrc&&<source media="(max-width: 760px)" srcSet={mobileSrc}/>}<img src={imageSrc} alt="" draggable={false}/></picture>
    <div className="film-grain"/><div className="vignette"/>
  </div>;
}

function ObjectShot({type}:{type?:string}){
  if(!type)return null;
  return <div className={`object-shot object-${type}`} aria-hidden="true">
    <i/><span>{({photo:"毕业照",ticket:"电影票 / 车票",poem:"折诗",list:"名单 / 灰烬",email:"未发送",book:"诗集"} as Record<string,string>)[type]||type}</span>
  </div>;
}

function formatSavedTime(timestamp:number){
  return new Intl.DateTimeFormat("zh-CN",{month:"short",day:"numeric",hour:"2-digit",minute:"2-digit"}).format(timestamp);
}

export default function Home(){
  const [started,setStarted]=useState(false);
  const [mode,setMode]=useState<Mode>("full");
  const [sceneIndex,setSceneIndex]=useState(0);
  const [beatIndex,setBeatIndex]=useState(0);
  const [answers,setAnswers]=useState<Record<string,AnswerRecord>>({});
  const [resonances,setResonances]=useState<Record<string,ResonanceRecord>>({});
  const [history,setHistory]=useState<HistoryEntry[]>([]);
  const [selectedOption,setSelectedOption]=useState<string|null>(null);
  const [confirmationReady,setConfirmationReady]=useState(false);
  const [echoReady,setEchoReady]=useState(false);
  const [journalOpen,setJournalOpen]=useState(false);
  const [soundOn,setSoundOn]=useState(false);
  const [soundPreferred,setSoundPreferred]=useState(false);
  const [savedGame,setSavedGame]=useState<SaveData|null>(null);
  const [lastRun,setLastRun]=useState<CompletedRun|null>(null);
  const [comparisonBase,setComparisonBase]=useState<CompletedRun|null>(null);
  const [endingRevealed,setEndingRevealed]=useState(false);
  const [gazeFocus,setGazeFocus]=useState<string|null>(null);
  const [projectorStep,setProjectorStep]=useState(0);
  const audioRef=useRef<AudioEngine|null>(null);
  const timerRef=useRef<number|null>(null);
  const journalTriggerRef=useRef<HTMLButtonElement|null>(null);
  const journalCloseRef=useRef<HTMLButtonElement|null>(null);
  const recordedRef=useRef("");

  const activeScenes=mode==="revisit-quick"?revisitScenes:scenes;
  const finished=sceneIndex>=activeScenes.length;
  const scene=activeScenes[Math.min(sceneIndex,activeScenes.length-1)];
  const scores=useMemo(()=>scoreAnswers(answers),[answers]);
  const endingKey=useMemo(()=>determineEnding(scores),[scores]);
  const progress=finished?100:Math.round(((sceneIndex+1)/activeScenes.length)*100);
  const unlocked=Boolean(lastRun)||isRevisitMode(mode)||finished;
  const echoRecord=scene?answers[echoChoiceByScene[scene.id]||""]:undefined;
  const sceneArt=scene?.arts?.length?scene.arts[Math.min(beatIndex,scene.arts.length-1)]:scene?.art;

  const sceneBody=useMemo(()=>{
    if(!scene)return [];
    const result=[...(scene.body||[])];
    const echoChoice=echoChoiceByScene[scene.id];
    if(echoChoice&&answers[echoChoice])result.push(answers[echoChoice].nearEcho);
    result.push(...resolveFutureEchoes(futureEchoRoutes[scene.id],answers,resonances));
    return result;
  },[scene,answers,resonances]);

  const visibleBody=scene?.progressive?sceneBody.slice(0,Math.min(beatIndex+1,sceneBody.length)):sceneBody;
  const montageBeats=useMemo(()=>scene?.beats||[],[scene]);
  const montageComplete=scene?.kind==="montage"&&beatIndex>=montageBeats.length-1;
  const snapshot=():HistoryEntry=>({sceneIndex,beatIndex,answers,resonances});

  useEffect(()=>{
    queueMicrotask(()=>{try{
      const saved=localStorage.getItem(SAVE_KEY);const completed=localStorage.getItem(LAST_RUN_KEY);
      if(saved)setSavedGame(JSON.parse(saved));if(completed)setLastRun(JSON.parse(completed));
      setSoundPreferred(localStorage.getItem(SOUND_KEY)==="on");
    }catch{}});
  },[]);

  useEffect(()=>{
    if(!started||finished||selectedOption)return;
    const data:SaveData={version:5,mode,sceneIndex,beatIndex,answers,resonances,history,savedAt:Date.now()};
    localStorage.setItem(SAVE_KEY,JSON.stringify(data));
  },[started,mode,sceneIndex,beatIndex,answers,resonances,history,finished,selectedOption]);

  useEffect(()=>{
    if(!started||!finished||Object.keys(answers).length!==3)return;
    const signature=mode+":"+choiceIds.map(id=>answers[id]?.optionId).join("|")+":"+resonanceIds.map(id=>resonances[id]?.optionId).join("|");
    if(recordedRef.current===signature)return;
    recordedRef.current=signature;
    const completed:CompletedRun={ending:endingKey,answers,resonances,completedAt:Date.now()};
    localStorage.setItem(LAST_RUN_KEY,JSON.stringify(completed));
    localStorage.removeItem(SAVE_KEY);
    setSavedGame(null);setLastRun(completed);
    audioRef.current?.setChapter("ending");audioRef.current?.cue("ending");
  },[started,finished,answers,resonances,endingKey,mode]);

  useEffect(()=>{
    if(!started||finished)return;
    const upcoming=activeScenes.slice(sceneIndex,sceneIndex+3)
      .flatMap(item=>item.arts?.length?item.arts:[item.art])
      .filter((src):src is string=>Boolean(src));
    for(const src of new Set(upcoming)){const image=new Image();image.src=src}
  },[started,finished,activeScenes,sceneIndex]);

  useEffect(()=>{
    if(scene?.kind!=="montage"||montageComplete||journalOpen)return;
    const current=montageBeats[beatIndex]||"";
    const delay=Math.max(2400,Math.min(3500,current.length*75));
    const timer=window.setTimeout(()=>setBeatIndex(value=>Math.min(value+1,montageBeats.length-1)),delay);
    return()=>window.clearTimeout(timer);
  },[scene?.id,scene?.kind,beatIndex,montageComplete,journalOpen,montageBeats]);

  useEffect(()=>{
    if(scene?.kind!=="revisitEcho")return;
    const timer=window.setTimeout(()=>setEchoReady(true),5500);
    return()=>window.clearTimeout(timer);
  },[scene?.id,scene?.kind]);

  useEffect(()=>{
    if(soundOn&&scene){audioRef.current?.setChapter(scene.chapter);const texture=sceneTextures[scene.id];if(texture)audioRef.current?.texture(texture)}
    if(soundOn&&scene?.kind==="echo"){
      const choiceId=echoChoiceByScene[scene.id];
      if(choiceId&&answers[choiceId])audioRef.current?.motif(answers[choiceId].sound);
    }
  },[scene,soundOn,answers]);

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

  useEffect(()=>()=>{if(timerRef.current)window.clearTimeout(timerRef.current);audioRef.current?.stop()},[]);

  const startSound=async()=>{
    if(!audioRef.current)audioRef.current=new AudioEngine();
    await audioRef.current.start(scene?.chapter||"prologue");
    setSoundOn(true);setSoundPreferred(true);localStorage.setItem(SOUND_KEY,"on");
  };
  const toggleSound=()=>{
    if(soundOn){audioRef.current?.stop();audioRef.current=null;setSoundOn(false);setSoundPreferred(false);localStorage.setItem(SOUND_KEY,"off")}
    else void startSound();
  };

  const resetRun=(nextMode:Mode,enableSound=soundOn)=>{
    const base=nextMode==="full"?null:lastRun;
    setStarted(true);setMode(nextMode);setSceneIndex(0);setBeatIndex(0);
    setAnswers({});setHistory([]);setSelectedOption(null);setConfirmationReady(false);
    setEndingRevealed(false);setGazeFocus(null);setProjectorStep(0);recordedRef.current="";setComparisonBase(base);
    setResonances(nextMode==="revisit-quick"?(base?.resonances||{}):{});
    localStorage.removeItem(SAVE_KEY);
    if(enableSound)void startSound();
  };
  const startFresh=(enableSound=false)=>resetRun("full",enableSound);
  const startRevisit=(kind:"quick"|"full")=>{
    if(!lastRun)return;
    resetRun(kind==="quick"?"revisit-quick":"revisit-full",soundOn);
  };
  const continueSaved=()=>{
    if(!savedGame)return;
    setMode(savedGame.mode);setSceneIndex(savedGame.sceneIndex);setBeatIndex(savedGame.beatIndex);
    setAnswers(savedGame.answers);setResonances(savedGame.resonances||{});setHistory(savedGame.history||[]);
    setStarted(true);setEndingRevealed(false);setComparisonBase(isRevisitMode(savedGame.mode)?lastRun:null);
    if(soundPreferred)void startSound();
  };

  const moveNext=(withHistory=true)=>{
    if(withHistory)setHistory(value=>[...value,snapshot()]);
    const next=sceneIndex+1;
    if(activeScenes[next]?.kind==="chapter")audioRef.current?.cue("transition");
    setSceneIndex(next);setBeatIndex(0);setEchoReady(false);setGazeFocus(null);
  };

  const advance=()=>{
    if(selectedOption||journalOpen||finished)return;
    if(scene.kind==="choice"||scene.kind==="resonance")return;
    if(scene.id==="campus"&&projectorStep<2)return;
    if(scene.kind==="revisitEcho"&&!echoReady)return;
    if(scene.kind==="montage"){
      if(!montageComplete){setBeatIndex(Math.max(0,montageBeats.length-1));return}
      moveNext();return;
    }
    if(scene.progressive&&beatIndex<sceneBody.length-1){setBeatIndex(value=>value+1);return}
    moveNext();
  };

  const selectOption=(optionId:string)=>{
    if(selectedOption)return;
    setSelectedOption(optionId);setConfirmationReady(false);
    const main=scene.choices?.find(option=>option.id===optionId);
    const resonance=scene.resonances?.find(option=>option.id===optionId);
    audioRef.current?.motif(main?.sound||resonance?.sound||"paper");
    const reduced=window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    timerRef.current=window.setTimeout(()=>{setConfirmationReady(true);timerRef.current=null},reduced?80:700);
  };

  const commitSelection=()=>{
    if(!selectedOption||!confirmationReady)return;
    setHistory(value=>[...value,snapshot()]);
    if(scene.kind==="choice"&&scene.choiceId){
      const option=scene.choices?.find(item=>item.id===selectedOption);
      if(option){
        const record:AnswerRecord={...option,choiceId:scene.choiceId,optionId:option.id};
        setAnswers(value=>({...value,[scene.choiceId!]:record}));
      }
    }
    if(scene.kind==="resonance"&&scene.resonanceId){
      const option=scene.resonances?.find(item=>item.id===selectedOption);
      if(option){
        const record:ResonanceRecord={...option,resonanceId:scene.resonanceId,optionId:option.id};
        setResonances(value=>({...value,[scene.resonanceId!]:record}));
      }
    }
    setSelectedOption(null);setConfirmationReady(false);setGazeFocus(null);
    moveNext(false);
  };

  const goBack=()=>{
    if(selectedOption||!history.length)return;
    const previous=history[history.length-1];
    setSceneIndex(previous.sceneIndex);setBeatIndex(previous.beatIndex);
    setAnswers(previous.answers);setResonances(previous.resonances);
    setHistory(value=>value.slice(0,-1));setEndingRevealed(false);
  };

  const openJournal=(event:React.MouseEvent<HTMLButtonElement>)=>{
    journalTriggerRef.current=event.currentTarget;setJournalOpen(true);
  };

  const handleSceneClick=(event:React.MouseEvent<HTMLElement>)=>{
    if((event.target as HTMLElement).closest("button,a,[role=dialog]"))return;
    advance();
  };

  useEffect(()=>{
    const onKey=(event:KeyboardEvent)=>{
      if(journalOpen&&event.key==="Escape"){setJournalOpen(false);return}
      if(journalOpen||selectedOption)return;
      if(event.key.toLowerCase()==="j"&&started&&!finished){
        journalTriggerRef.current=document.querySelector(".journal-trigger");setJournalOpen(true);return;
      }
      if((event.key===" "||event.key==="Enter")&&started&&scene?.kind!=="choice"&&scene?.kind!=="resonance"){
        event.preventDefault();advance();
      }
      if(event.key==="ArrowLeft")goBack();
    };
    window.addEventListener("keydown",onKey);return()=>window.removeEventListener("keydown",onKey);
  });

  return <main className="game-shell">
    <div className="cinema-frame">
      {!started?<TitleScreen savedGame={savedGame} soundPreferred={soundPreferred} onContinue={continueSaved} onFresh={startFresh}/>
      :finished&&!endingRevealed?<section className="ending-ritual">
        <Backdrop src="/art-v5/istanbul-crossroads-aged.png"/>
        <div className="ritual-content"><span className="archive-mark">记忆归档</span><div className="ritual-line"/>
          <p>他们最终还是走散了。</p><h2>你能留下的，<br/>是这段往事的形状。</h2>
          <button className="start-button" onClick={()=>{setEndingRevealed(true);audioRef.current?.cue("ending")}}>翻开最后一页 <span>→</span></button>
        </div>
      </section>
      :finished?<EndingScreen endingKey={endingKey} answers={answers} resonances={resonances} mode={mode} comparisonBase={comparisonBase} onFresh={startFresh} onRevisit={startRevisit} onJournal={openJournal}/>
      :scene.kind==="chapter"?<section className="chapter-screen" key={scene.id} onClick={handleSceneClick}>
        <Backdrop src={scene.art}/><div className="chapter-card"><p>{scene.year}</p><span>{scene.chapterLabel}</span><h2>{scene.place}</h2><div className="chapter-rule"/><blockquote>{scene.body?.[0]}</blockquote><button className="continue-button" onClick={advance}>进入本章 <span>→</span></button></div>
      </section>
      :<section className={`scene ${scene.kind} ${scene.resonanceId?`physical-${scene.resonanceId}`:""}`} data-canonical-photo={scene.canonicalPhoto} key={scene.id} onClick={handleSceneClick}>
        <Backdrop src={sceneArt} focus={scene.resonanceId==="gaze"&&gazeFocus?`gaze-${gazeFocus}`:scene.artFocus}/><ObjectShot type={scene.object}/>
        {scene.resonanceId==="gaze"&&<GazeVisualLayer options={scene.resonances||[]} selected={selectedOption} focus={gazeFocus} onFocus={setGazeFocus} onSelect={selectOption}/>}
        <GameHeader progress={progress} sceneNumber={sceneIndex+1} totalScenes={activeScenes.length} chapter={scene.chapterLabel} soundOn={soundOn} onSound={toggleSound} onBack={goBack} canBack={history.length>0&&!selectedOption} onJournal={openJournal}/>
        <div className="scene-copy">
          <div className="location-row"><span>{scene.chapterLabel}</span><span className="location">{scene.place}</span></div>
          {scene.kind==="echo"&&echoRecord&&<div className="echo-signature"><span>回声抵达</span><strong>{echoRecord.motif}</strong></div>}
          {scene.speaker&&<p className="speaker">{scene.speaker}</p>}
          {scene.kind==="montage"?<Montage beats={montageBeats} index={beatIndex}/>
          :scene.kind==="revisitEcho"?<RevisitEcho current={answers[scene.choiceId||""]} previous={comparisonBase?.answers[scene.choiceId||""]} ready={echoReady}/>
          :<div className="dialogue-stack">{visibleBody.map((paragraph,index)=><p className="dialogue" key={index}>{paragraph}</p>)}</div>}
          {scene.kind==="choice"?
            <SelectionPanel scene={scene} selected={selectedOption} ready={confirmationReady} previous={comparisonBase?.answers[scene.choiceId||""]} mode={mode} onSelect={selectOption} onCommit={commitSelection}/>
          :scene.kind==="resonance"&&scene.resonanceId==="photo"?<PhotoInteraction options={scene.resonances||[]} selected={selectedOption} ready={confirmationReady} previous={comparisonBase?.resonances.photo} mode={mode} onSelect={selectOption} onCommit={commitSelection}/>
          :scene.kind==="resonance"&&scene.resonanceId==="email"?<EmailInteraction options={scene.resonances||[]} selected={selectedOption} ready={confirmationReady} previous={comparisonBase?.resonances.email} mode={mode} onSelect={selectOption} onCommit={commitSelection}/>
          :scene.kind==="resonance"&&scene.resonanceId==="gaze"?<GazeInteraction options={scene.resonances||[]} selected={selectedOption} ready={confirmationReady} previous={comparisonBase?.resonances.gaze} mode={mode} onFocus={setGazeFocus} onSelect={selectOption} onCommit={commitSelection}/>
          :scene.id==="campus"?<><ProjectorRepair step={projectorStep} onStep={()=>{setProjectorStep(value=>Math.min(2,value+1));audioRef.current?.texture("projector");audioRef.current?.motif(projectorStep===1?"photo":"paper")}}/>{projectorStep>=2&&<button className="continue-button" onClick={advance}>让画面继续 <span>→</span></button>}</>
          :<button className="continue-button" disabled={scene.kind==="revisitEcho"&&!echoReady} onClick={advance}>
            {scene.kind==="montage"&&!montageComplete?"显示全部":scene.kind==="revisitEcho"&&!echoReady?"让回声停留片刻":"继续"} <span>→</span>
          </button>}
        </div>
        <div className="progress-track" role="progressbar" aria-label="故事进度" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress}><div style={{width:`${progress}%`}}/></div>
      </section>}
      {journalOpen&&<Journal answers={answers} resonances={resonances} unlocked={unlocked} onClose={()=>setJournalOpen(false)} closeRef={journalCloseRef}/>}
    </div>
    <p className="outside-hint">点击画面 / 空格继续 · ← 返回上一幕 · 触屏可完成全部操作</p>
  </main>;
}

function TitleScreen({savedGame,soundPreferred,onContinue,onFresh}:{savedGame:SaveData|null;soundPreferred:boolean;onContinue:()=>void;onFresh:(sound:boolean)=>void}){
  return <section className="title-screen"><Backdrop src="/art-v4/university-gate-autumn.png"/>
    <div className="title-content"><p className="kicker">互动叙事 · 记忆剪辑</p><h1>革命街<br/>没有尽头</h1>
      <p className="farsi" lang="fa" dir="rtl">خیابان انقلاب پایانی ندارد</p>
      <p className="logline">她被处分、离开、结婚与重逢已经发生。你不能改写这些端点，但能决定通往它们的三个动作，以及它们最后如何被记住。</p>
      <div className={`title-actions ${savedGame?"has-resume":""}`}>
        {savedGame&&<button className="start-button resume-button" onClick={onContinue}><span>继续上次记忆</span><span>→</span><small>{formatSavedTime(savedGame.savedAt)}</small></button>}
        <button className={savedGame?"ghost-button large":"start-button"} onClick={()=>onFresh(true)}>有声进入 <span>♪</span></button>
        <button className="ghost-button large" onClick={()=>onFresh(false)}>静音进入</button>
      </div>
      <div className="title-meta"><span>完整体验 6–8 分钟</span><span>自动保存</span><span>{soundPreferred?"上次使用有声模式":"建议佩戴耳机"}</span></div>
    </div>
  </section>;
}

function GameHeader({progress,sceneNumber,totalScenes,chapter,soundOn,onSound,onBack,canBack,onJournal}:{progress:number;sceneNumber:number;totalScenes:number;chapter:string;soundOn:boolean;onSound:()=>void;onBack:()=>void;canBack:boolean;onJournal:(e:React.MouseEvent<HTMLButtonElement>)=>void}){
  return <header className="topbar"><div className="mini-title"><span>{chapter}</span><small className="visually-hidden">第 {sceneNumber} 幕，共 {totalScenes} 幕</small><i className="visually-hidden">故事进度 {progress}%</i></div><div className="top-actions">
    <button onClick={onBack} disabled={!canBack} aria-label="回到上一幕">← <span>上一幕</span></button>
    <button className="journal-trigger" onClick={onJournal} aria-label="打开记忆册">▤ <span>记忆册</span></button>
    <button onClick={onSound} aria-label={soundOn?"关闭环境音与音乐":"开启环境音与音乐"}>{soundOn?"♪":"♩"} <span>{soundOn?"音乐开":"音乐关"}</span></button>
  </div></header>;
}

function SelectionPanel({scene,selected,ready,previous,mode,onSelect,onCommit}:{scene:Scene;selected:string|null;ready:boolean;previous?:AnswerRecord;mode:Mode;onSelect:(id:string)=>void;onCommit:()=>void}){
  const options=scene.choices||[];
  const selectedData=options.find(option=>option.id===selected);
  return <div className={`selection-wrap ${selected?"confirming":""}`}>
    {!selected&&<p className="interaction-guide"><span>保存这一格</span>留下一个动作</p>}
    {isRevisitMode(mode)&&previous&&!selected&&<button className="reuse-button" onClick={()=>onSelect(previous.optionId)}>沿用上轮：{previous.label}</button>}
    <div className="choices">
      {options.map((option,index)=>{
        const isSelected=selected===option.id;const wasPrevious=previous?.optionId===option.id;
        return <button key={option.id} data-option={option.id} disabled={Boolean(selected)} className={isSelected?"selected":selected?"faded":""} onClick={()=>onSelect(option.id)}>
          <span className="choice-number">0{index+1}</span><span><strong>{option.label}</strong><small>{option.detail}</small>{wasPrevious&&isRevisitMode(mode)&&<em>上轮选择</em>}</span><span className="choice-arrow">↗</span>
        </button>;
      })}
    </div>
    {selected&&selectedData&&<ConfirmationCard label="记忆留下" action={selectedData.action||selectedData.memory} confirmation={selectedData.confirmation} ready={ready} onCommit={onCommit}/>}
  </div>;
}

function ConfirmationCard({label,action,confirmation,ready,onCommit}:{label:string;action:string;confirmation:string;ready:boolean;onCommit:()=>void}){
  return <div className={`choice-memory ${ready?"ready":""}`} role="status" aria-live="polite">
    <span>{label}</span><strong>{action}</strong><small>{confirmation}</small>
    {ready&&<button onClick={onCommit}>带着这段记忆继续 <b>→</b></button>}
  </div>;
}

function resonanceAction(option?:ResonanceOption){
  if(!option)return "";
  const value=option as ResonanceOption&{action?:string;echo?:string};
  return value.action||value.echo||option.label;
}

function PhotoInteraction({options,selected,ready,previous,mode,onSelect,onCommit}:{options:ResonanceOption[];selected:string|null;ready:boolean;previous?:ResonanceRecord;mode:Mode;onSelect:(id:string)=>void;onCommit:()=>void}){
  const [armed,setArmed]=useState(false);
  const selectedData=options.find(option=>option.id===selected);
  const choose=(id:string)=>{if(!selected&&armed)onSelect(id)};
  return <div className={`photo-interaction ${selected?`result-${selected}`:""}`}>
    {!selected&&<p className="interaction-guide"><span>放置照片</span>拖到一个区域；触屏可先点照片，再点位置</p>}
    {isRevisitMode(mode)&&previous&&!selected&&<p className="previous-anchor">上轮镜头：{previous.label}</p>}
    <div className="photo-worktable" aria-describedby="photo-instructions">
      <p id="photo-instructions" className="visually-hidden">先选择照片，再选择正面朝上、反面朝上或收回包里。也可以拖动照片到目标区域。</p>
      <button className={`movable-photo ${armed?"armed":""}`} type="button" draggable={!selected} disabled={Boolean(selected)} aria-pressed={armed} onClick={()=>setArmed(true)} onDragStart={event=>{setArmed(true);event.dataTransfer.setData("text/plain","photo")}}>
        <img src="/art-v5/canonical-graduation-photo.png" alt="德黑兰大学毕业合影，莱拉与阿拉什隔着同学望向彼此" draggable={false}/><span>{armed?"照片已拿起":"拿起照片"}</span>
      </button>
      <div className="photo-dropzones">
        {options.map(option=><button key={option.id} type="button" className={`dropzone drop-${option.id}`} disabled={Boolean(selected)} aria-label={`${option.label}：${option.detail}`} onDragOver={event=>event.preventDefault()} onDrop={event=>{event.preventDefault();if(event.dataTransfer.getData("text/plain")==="photo")onSelect(option.id)}} onClick={()=>choose(option.id)}>
          <strong>{option.label}</strong><small>{option.detail}</small>
        </button>)}
      </div>
    </div>
    {selected&&selectedData&&<ConfirmationCard label="照片落下" action={resonanceAction(selectedData)} confirmation={selectedData.confirmation} ready={ready} onCommit={onCommit}/>}
  </div>;
}

function EmailInteraction({options,selected,ready,previous,mode,onSelect,onCommit}:{options:ResonanceOption[];selected:string|null;ready:boolean;previous?:ResonanceRecord;mode:Mode;onSelect:(id:string)=>void;onCommit:()=>void}){
  const [draft,setDraft]=useState("");
  const [deleted,setDeleted]=useState(false);
  const deleteTimer=useRef<number|null>(null);
  const selectedData=options.find(option=>option.id===selected);
  const choose=(option:ResonanceOption)=>{
    if(selected)return;
    setDraft(option.label.replace(/[“”"]/g,""));setDeleted(false);onSelect(option.id);
  };
  const stopDelete=()=>{if(deleteTimer.current!==null){window.clearInterval(deleteTimer.current);deleteTimer.current=null}};
  const finishDelete=()=>{stopDelete();setDraft("");setDeleted(true)};
  const startDelete=()=>{
    if(!selected||deleted)return;
    if(window.matchMedia("(prefers-reduced-motion: reduce)").matches){window.setTimeout(finishDelete,70);return}
    stopDelete();deleteTimer.current=window.setInterval(()=>setDraft(value=>{
      const next=value.slice(0,-1);if(!next)window.setTimeout(finishDelete,0);return next;
    }),85);
  };
  useEffect(()=>()=>stopDelete(),[]);
  return <div className={`email-interaction ${selected?"is-editing":""} ${deleted?"is-deleted":""}`}>
    {!selected&&<><p className="interaction-guide"><span>写入草稿</span>选择一句作者预设的回复</p>{isRevisitMode(mode)&&previous&&<button className="reuse-button" onClick={()=>{const option=options.find(item=>item.id===previous.optionId);if(option)choose(option)}}>沿用上轮：{previous.label}</button>}
      <div className="email-presets">{options.map(option=><button key={option.id} onClick={()=>choose(option)}><strong>{option.label}</strong><small>{option.detail}</small>{previous?.optionId===option.id&&isRevisitMode(mode)&&<em>上轮</em>}</button>)}</div></>}
    {selected&&<div className="email-editor" role="group" aria-label="删除未发送邮件">
      <div className="email-chrome"><span>回复：革命街上的旧书店关门了</span><i>{deleted?"草稿已清空":"未发送"}</i></div>
      <textarea readOnly value={draft} aria-label="邮件草稿内容"/>
      {!deleted?<button className="hold-delete" onPointerDown={event=>{event.currentTarget.setPointerCapture(event.pointerId);startDelete()}} onPointerUp={stopDelete} onPointerCancel={stopDelete} onPointerLeave={stopDelete} onKeyDown={event=>{if(event.key===" "||event.key==="Enter"){event.preventDefault();startDelete()}}} onKeyUp={event=>{if(event.key===" "||event.key==="Enter")stopDelete()}}>按住删除这句话 <span aria-hidden="true">⌫</span></button>
      :<p className="deleted-state">光标回到空白处。句子没有寄出。</p>}
    </div>}
    {selected&&selectedData&&deleted&&<ConfirmationCard label="草稿删除" action={resonanceAction(selectedData)} confirmation={selectedData.confirmation} ready={ready} onCommit={onCommit}/>}
  </div>;
}

function GazeVisualLayer({options,selected,focus,onFocus,onSelect}:{options:ResonanceOption[];selected:string|null;focus:string|null;onFocus:(id:string|null)=>void;onSelect:(id:string)=>void}){
  return <div className={`gaze-hotspots focus-${focus||"none"}`} aria-label="选择莱拉先看见的画面">
    <p className="visually-hidden">可选择手与白发、诗集、时钟与机场方向。</p>
    {options.map(option=><button key={option.id} className={`gaze-hotspot hotspot-${option.id} ${selected===option.id?"selected":""}`} disabled={Boolean(selected)} onPointerEnter={()=>onFocus(option.id)} onPointerLeave={()=>onFocus(selected)} onFocus={()=>onFocus(option.id)} onBlur={()=>onFocus(selected)} onClick={()=>{onFocus(option.id);onSelect(option.id)}} aria-label={`${option.label}：${option.detail}`}><span>{option.label}</span></button>)}
  </div>;
}

function GazeInteraction({options,selected,ready,previous,mode,onFocus,onSelect,onCommit}:{options:ResonanceOption[];selected:string|null;ready:boolean;previous?:ResonanceRecord;mode:Mode;onFocus:(id:string|null)=>void;onSelect:(id:string)=>void;onCommit:()=>void}){
  const selectedData=options.find(option=>option.id===selected);
  return <div className="gaze-interaction">
    {!selected&&<><p className="interaction-guide"><span>移动视线</span>触碰画面中的三个取景框</p>{isRevisitMode(mode)&&previous&&<p className="previous-anchor">上轮镜头：{previous.label}</p>}
      <details className="a11y-fallback"><summary>使用文字按钮选择</summary><div>{options.map(option=><button key={option.id} onFocus={()=>onFocus(option.id)} onMouseEnter={()=>onFocus(option.id)} onClick={()=>onSelect(option.id)}>{option.label}</button>)}</div></details></>}
    {selected&&selectedData&&<ConfirmationCard label="视线停住" action={resonanceAction(selectedData)} confirmation={selectedData.confirmation} ready={ready} onCommit={onCommit}/>}
  </div>;
}

function ProjectorRepair({step,onStep}:{step:number;onStep:()=>void}){
  const actions=[
    {label:"扶住片门",line:"莱拉用指尖稳住发热的金属框。"},
    {label:"收紧胶片，点亮灯泡",line:"“别拉太快。”阿拉什把她的手移到齿轮外侧。"},
  ];
  return <div className="projector-repair" role="group" aria-label="和阿拉什一起修好放映机">
    <div className="projector-diagram" aria-hidden="true"><i className={step>0?"lit":""}/><b className={step>1?"turning":""}/><span className={step>1?"beam":""}/></div>
    <div><p><span>放映机修理</span>{step===0?"阿拉什腾不出第三只手。":actions[Math.min(step-1,1)].line}</p>{step<2?<button onClick={onStep}>{actions[step].label} <b>0{step+1}/02</b></button>:<small>画面重新出现。莱拉闻到热灯泡、灰尘和阿拉什袖口的机油味。</small>}</div>
  </div>;
}
function Montage({beats,index}:{beats:string[];index:number}){
  return <div className="montage-lines">{beats.map((beat,i)=><p key={beat} className={i<=index?"visible":""}><span>0{i+1}</span>{beat}</p>)}</div>;
}

function RevisitEcho({current,previous,ready}:{current?:AnswerRecord;previous?:AnswerRecord;ready:boolean}){
  return <div className="revisit-echo-card">
    <p className="echo-label">上轮回声</p><blockquote>{previous?.revisitEcho||"这段记忆没有被保存。"}</blockquote>
    <span>↓</span><p className="echo-label">本轮回声</p><blockquote className="current">{current?.revisitEcho||"等待新的选择。"}</blockquote>
    <small>{current?.optionId===previous?.optionId?"你沿用了上轮剪辑；未来的回声保持原样。":"画外仍是同一座城，前景里的物件换了位置。"}</small>
    <div className={`echo-timer ${ready?"done":""}`}/>
  </div>;
}

function Journal({answers,resonances,unlocked,onClose,closeRef}:{answers:Record<string,AnswerRecord>;resonances:Record<string,ResonanceRecord>;unlocked:boolean;onClose:()=>void;closeRef:React.RefObject<HTMLButtonElement|null>}){
  const items=[...Object.values(resonances),...Object.values(answers)];
  const scores=scoreAnswers(answers);
  const journalRef=useRef<HTMLElement|null>(null);
  const motifs=new Set(items.map(item=>item.motif));
  const paperState=motifs.has("灰烬")?"边缘留着烟痕":motifs.has("诗集")||motifs.has("折诗")?"折痕正在变清晰":items.length?"纸面已有重量":"尚未显影";
  const lightState=resonances.gaze?.optionId==="hands"?"光停在手背":resonances.gaze?.optionId==="book"?"光停在书脊":resonances.gaze?.optionId==="clock"?"光指向出口":resonances.photo?"桌面亮起一角":"微弱";
  const distanceState=answers["choice-three"]?.optionId==="truth"?"一句真话抵达站台":answers["choice-three"]?.optionId==="escape"?"两张车票仍在画内":answers["choice-three"]?.optionId==="conceal"?"目的地先变清楚":Object.keys(answers).length?"轮廓正在靠近":"尚未显现";
  const weather=[{label:"纸面",value:paperState},{label:"光线",value:lightState},{label:"远景",value:distanceState}];
  const trapFocus=(event:React.KeyboardEvent<HTMLElement>)=>{
    if(event.key!=="Tab"||!journalRef.current)return;
    const focusable=Array.from(journalRef.current.querySelectorAll<HTMLElement>('button,[href],[tabindex]:not([tabindex="-1"])')).filter(element=>!element.hasAttribute("disabled"));
    if(!focusable.length)return;
    const first=focusable[0];const last=focusable[focusable.length-1];
    if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus()}
    else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus()}
  };
  return <div className="journal-backdrop" role="dialog" aria-modal="true" aria-labelledby="journal-title" onMouseDown={event=>{if(event.target===event.currentTarget)onClose()}}>
    <section ref={journalRef} className="journal" onKeyDown={trapFocus}><button ref={closeRef} className="close-button" onClick={onClose} aria-label="关闭记忆册">×</button>
      <p className="kicker">莱拉的记忆册</p><h2 id="journal-title">不是答案，<br/>是被带走的东西。</h2>
      <p className="visually-hidden">已保存 {Object.keys(answers).length} 条主记忆和 {Object.keys(resonances).length} 条共鸣细节。</p>
      <div className="motif-strip">{items.length?items.map(item=><span key={"choiceId" in item?item.choiceId:item.resonanceId}>{item.motif}</span>):<span>空白页</span>}</div>
      <div className="memory-notes">{items.length?items.map((item,index)=><article key={index}><span>0{index+1} · {item.motif}</span><p>{"memory" in item?item.memory:item.echo}</p></article>):<p className="empty-memory">照片、诗页、灰烬与车票还没有决定自己的位置。</p>}</div>
      {!unlocked?<div className="memory-weather"><p className="weather-title">记忆天气</p>{weather.map(item=><div key={item.label}><span>{item.label}</span><strong>{item.value}</strong></div>)}</div>
      :<div className="axis-reveal"><p>通关后解锁 · 三种动作</p>{(["speak","keep","survive"] as Axis[]).map(axis=><article key={axis}><span>{axisNames[axis]}</span><strong>{axisExplanations[axis]}</strong><i>{scores[axis]===0?"未进入本轮":scores[axis]===1?"留下痕迹":"成为主调"}</i></article>)}</div>}
      <button className="start-button compact" onClick={onClose}>回到故事</button>
    </section>
  </div>;
}
function EndingScreen({endingKey,answers,resonances,mode,comparisonBase,onFresh,onRevisit,onJournal}:{endingKey:EndingKey;answers:Record<string,AnswerRecord>;resonances:Record<string,ResonanceRecord>;mode:Mode;comparisonBase:CompletedRun|null;onFresh:(sound?:boolean)=>void;onRevisit:(kind:"quick"|"full")=>void;onJournal:(e:React.MouseEvent<HTMLButtonElement>)=>void}){
  const ending=endings[endingKey];
  const epilogue=composeCinematicEpilogue(endingKey,answers,resonances);
  const mainFragments=composeEndingFragments(answers,{},choiceIds,[]);
  const resonanceFragments=composeEndingFragments({},resonances,[],resonanceIds);
  const diffs=comparisonBase?choiceDiff(comparisonBase.answers,answers,choiceIds).filter(diff=>diff.changed):[];
  const resonanceDiffs=comparisonBase?resonanceIds.flatMap(id=>comparisonBase.resonances[id]?.optionId!==resonances[id]?.optionId?[{id,before:comparisonBase.resonances[id],after:resonances[id]}]:[]):[];
  const shards=selectUnchosenFragments(unchosenFragments,answers,resonances);
  return <section className="ending-screen"><Backdrop src="/art-v5/istanbul-crossroads-aged.png"/><div className="ending-card">
    <p className="kicker">{isRevisitMode(mode)?"记忆重新剪好":"故事完成"}</p><h2>{ending.title}</h2><p className="cinematic-epilogue">{epilogue}</p>
    <details className="ending-archive"><summary>查看本轮剪辑 / 记忆档案</summary><div className="archive-inside">
      <div className="ending-seal"><span>本轮主调</span><strong>{ending.reveal}</strong></div><p className="archive-interpretation">{ending.body}</p>
      <section className="ending-memory-section" aria-labelledby="main-memory-title"><h3 id="main-memory-title">三个主动作</h3><div className="ending-fragments">{mainFragments.map((fragment,index)=><p key={index}><span>0{index+1}</span>{fragment}</p>)}</div></section>
      <section className="resonance-coda" aria-labelledby="resonance-coda-title"><h3 id="resonance-coda-title">三个镜头锚点</h3>{resonanceFragments.map((fragment,index)=><p key={index}>{fragment}</p>)}</section>
      {isRevisitMode(mode)&&comparisonBase&&<div className="comparison"><div className="comparison-head"><span>上轮：{endings[comparisonBase.ending].title}</span><b>→</b><span>本轮：{ending.title}</span></div>
        {diffs.length||resonanceDiffs.length?<div className="future-comparison">{diffs.map((diff,index)=><article key={diff.choiceId} className="changed"><span>改动 0{index+1} · 未来回声</span><p>{diff.futureBefore}</p><b>↓</b><p>{diff.futureAfter}</p></article>)}{resonanceDiffs.map(diff=><article key={diff.id} className="changed"><span>镜头锚点 · {diff.id}</span><p>{diff.before?.endingFragment}</p><b>↓</b><p>{diff.after?.endingFragment}</p></article>)}</div>:<p className="unchanged-note">本轮沿用了上一轮的全部片段。</p>}
        <div className="memory-shards"><span>未选择的记忆残片</span>{shards.map(shard=><p key={shard.optionId}>{shard.text}</p>)}</div>
      </div>}
      <p className="final-line">{ending.coda}</p>
    </div></details>
    <div className="ending-actions"><button className="start-button compact" onClick={()=>onFresh()}>从头重新体验</button><button className="ghost-button" onClick={()=>onRevisit("quick")}>快速重剪 · 三个动作</button><button className="ghost-button" onClick={()=>onRevisit("full")}>完整重剪 · 六次输入</button><button className="ghost-button" onClick={onJournal}>查看记忆册</button></div>
  </div></section>;
}
