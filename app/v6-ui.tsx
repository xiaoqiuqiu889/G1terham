"use client";

import { useEffect, useRef, useState } from "react";

export type MemoryUnlockView = { threshold: number; remaining: number; label: string } | null;
export type InteractionView = {
  id: string; title: string; prompt: string; kind: string; actionLabel?: string; reveal: string; steps?: string[];
  optional?: boolean;
  reward: { memory: number; clueId?: string; collectibleId?: string };
};
export type PaidDialogueView = { id: string; title: string; previewLine: string; lockedLines: string[]; archiveTitle?: string; chapterLabel?: string };
export type PaidDialogueOffer = { productId?: string; label: string; description?: string; price: string; creditText?: string; recommended?: boolean };
export type ChapterRewardView = { code: string; prop: string; nextHint: string; disclaimer: string };

export function MemoryHUD({memory,chapterGain,nextUnlock,collectibles,unlockedDialogues,rewards}:{memory:number;chapterGain:number;nextUnlock:MemoryUnlockView;collectibles:number;unlockedDialogues:number;rewards:number}) {
  return <aside className="memory-hud" aria-label="记忆显影进度">
    <div className="memory-hud-main"><span>记忆显影度</span><strong>{memory}</strong><i>/100</i></div>
    <div className="memory-hud-track" role="progressbar" aria-label="记忆显影度" aria-valuemin={0} aria-valuemax={100} aria-valuenow={memory}><b style={{width:`${Math.max(0,Math.min(memory,100))}%`}}/></div>
    <div className="memory-hud-meta"><span>本章 +{chapterGain}</span><span>{nextUnlock?`距「${nextUnlock.label}」还差 ${nextUnlock.remaining}`:"完整卷宗已显影"}</span></div>
    <div className="memory-hud-counts" aria-label="收集进度"><span>纪念物 {collectibles}</span><span>对白 {unlockedDialogues}/5</span><span>礼包 {rewards}/5</span></div>
  </aside>;
}

function kindLabel(kind:string){
  return ({explore:"场景探索",photo:"照片整理",projector:"投影修复",choice:"记忆选择",email:"邮件编辑",gaze:"目光与沉默",combine:"纪念物组合",hold:"握住与松开",silence:"握住与松开"} as Record<string,string>)[kind]||"记忆互动";
}

export function DiscoveryInteraction({interaction,completed,onStart,onComplete}:{interaction:InteractionView;completed:boolean;onStart:(id:string)=>void;onComplete:(id:string)=>void}) {
  const steps=interaction.steps?.length?interaction.steps:[interaction.actionLabel||"查看这件物品"];
  const [active,setActive]=useState(false);
  const [step,setStep]=useState(completed?steps.length:0);
  const [pieces,setPieces]=useState<boolean[]>(steps.map(()=>false));
  const [holdArmed,setHoldArmed]=useState(false);
  const holdArmedRef=useRef(false);
  const holdTimer=useRef<number|null>(null);
  const clearHold=()=>{if(holdTimer.current!==null){window.clearTimeout(holdTimer.current);holdTimer.current=null}};

  useEffect(()=>()=>clearHold(),[]);
  const begin=()=>{if(!active){setActive(true);onStart(interaction.id)}};
  const finish=()=>{begin();setStep(steps.length);onComplete(interaction.id)};
  const advance=()=>{begin();const next=Math.min(steps.length,step+1);setStep(next);if(next>=steps.length)onComplete(interaction.id)};
  const togglePiece=(index:number)=>{begin();const next=pieces.map((value,pieceIndex)=>pieceIndex===index?true:value);setPieces(next);if(next.every(Boolean))finish()};
  const armHold=()=>{
    begin();clearHold();holdArmedRef.current=false;setHoldArmed(false);
    const arm=()=>{holdTimer.current=null;holdArmedRef.current=true;setHoldArmed(true)};
    if(window.matchMedia("(prefers-reduced-motion: reduce)").matches){arm();return}
    holdTimer.current=window.setTimeout(arm,720);
  };
  const releaseHold=()=>{
    clearHold();if(!holdArmedRef.current)return;
    holdArmedRef.current=false;setHoldArmed(false);
    const next=Math.min(steps.length,step+1);setStep(next);if(next>=steps.length)onComplete(interaction.id);
  };
  const cancelHold=()=>{clearHold();holdArmedRef.current=false;setHoldArmed(false)};
  const done=completed||step>=steps.length;
  const currentStep=steps[Math.min(step,steps.length-1)];
  return <section className={"discovery-interaction kind-"+interaction.kind+(done?" is-complete":"")} aria-labelledby={"interaction-"+interaction.id}>
    <div className="discovery-heading"><span>{kindLabel(interaction.kind)}</span><strong id={"interaction-"+interaction.id}>{interaction.title}</strong>{!done&&<small>{interaction.optional?"可错过 · 重访可补":"关键记忆"}</small>}</div>
    <p>{interaction.prompt}</p>
    {interaction.kind==="combine"&&!done?<div className="combine-pieces" aria-label="选择并组合两件纪念物">{steps.map((label,index)=><button key={label} className={pieces[index]?"selected":""} aria-pressed={pieces[index]} onClick={()=>togglePiece(index)}><i aria-hidden="true"/><span>{label}</span></button>)}</div>
    :(interaction.kind==="hold"||interaction.kind==="silence")&&!done?<button className={"hold-memory "+(holdArmed?"is-armed":"")} aria-label={(holdArmed?"松手确认：":"按住：")+currentStep} onPointerDown={event=>{event.currentTarget.setPointerCapture(event.pointerId);armHold()}} onPointerUp={event=>{releaseHold();if(event.currentTarget.hasPointerCapture(event.pointerId))event.currentTarget.releasePointerCapture(event.pointerId)}} onPointerCancel={cancelHold} onKeyDown={event=>{if((event.key===" "||event.key==="Enter")&&!event.repeat){event.preventDefault();armHold()}}} onKeyUp={event=>{if(event.key===" "||event.key==="Enter"){event.preventDefault();releaseHold()}}}><strong>{holdArmed?"松手确认":currentStep}</strong><b>{String(step+1).padStart(2,"0")}/{String(steps.length).padStart(2,"0")}</b><span aria-hidden="true"/></button>
    :!done?<div className="interaction-steps"><button onClick={advance}><span>{currentStep}</span><b>{String(step+1).padStart(2,"0")}/{String(steps.length).padStart(2,"0")}</b></button></div>:null}
    {done&&<div className="discovery-result" role="status" aria-live="polite"><span>记忆显影 +{interaction.reward.memory}</span><p>{interaction.reveal}</p>{interaction.reward.collectibleId&&<small>纪念物已收入卷宗</small>}</div>}
  </section>;
}

export function PaidDialogueOverlay({dialogue,unlockedLineCount,fullAccess,hasAccess=false,offers,offer,offerLabel,offerPrice,creditText,onUnlock,onSkip,onContinue}:{dialogue:PaidDialogueView;unlockedLineCount?:number;fullAccess?:boolean;hasAccess?:boolean;offers?:PaidDialogueOffer[];offer?:PaidDialogueOffer;offerLabel?:string;offerPrice?:string;creditText?:string;onUnlock?:(productId?:string)=>void;onSkip?:()=>void;onContinue:()=>void}) {
  const dialogRef=useRef<HTMLElement|null>(null);
  const primaryRef=useRef<HTMLButtonElement|null>(null);
  const fullyUnlocked=fullAccess??hasAccess;
  const visibleCount=fullyUnlocked?dialogue.lockedLines.length:Math.max(0,Math.min(dialogue.lockedLines.length,Math.floor(unlockedLineCount||0)));
  const remaining=Math.max(0,dialogue.lockedLines.length-visibleCount);
  const visibleLines=dialogue.lockedLines.slice(0,visibleCount);
  const lockedLines=dialogue.lockedLines.slice(visibleCount);
  const activeOffer=offer||(onUnlock&&offerLabel?{label:offerLabel,price:offerPrice||"",creditText}:undefined);
  const activeOffers=offers?.length?offers:(activeOffer?[activeOffer]:[]);
  const exitAction=visibleCount>0||fullyUnlocked?onContinue:(onSkip||onContinue);
  const exitRef=useRef(exitAction);
  useEffect(()=>{exitRef.current=exitAction},[exitAction]);
  useEffect(()=>{
    const previous=document.activeElement as HTMLElement|null;
    const oldOverflow=document.body.style.overflow;
    document.body.style.overflow="hidden";
    window.setTimeout(()=>primaryRef.current?.focus(),0);
    const onKeyDown=(event:KeyboardEvent)=>{
      if(event.key==="Escape"){event.preventDefault();exitRef.current();return}
      if(event.key!=="Tab"||!dialogRef.current)return;
      const focusable=Array.from(dialogRef.current.querySelectorAll<HTMLElement>('button,[href],[tabindex]:not([tabindex="-1"])')).filter(element=>!element.hasAttribute("disabled"));
      if(!focusable.length)return;const first=focusable[0];const last=focusable[focusable.length-1];
      if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus()}
      else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus()}
    };
    window.addEventListener("keydown",onKeyDown);
    return()=>{window.removeEventListener("keydown",onKeyDown);document.body.style.overflow=oldOverflow;previous?.focus()};
  },[dialogue.id]);
  return <div className="story-modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="paid-dialogue-title"><section ref={dialogRef} className="paid-dialogue-card">
    <p className="kicker">他们没有说出口的话</p><h2 id="paid-dialogue-title">{dialogue.title}</h2><blockquote>{dialogue.previewLine}</blockquote>
    {visibleLines.length>0&&<div className="locked-dialogue-lines unlocked" aria-label={"已显影 "+visibleLines.length+" 句"}>{visibleLines.map((line,index)=><p key={"visible-"+index}>{line}</p>)}</div>}
    {lockedLines.length>0&&<div className="locked-dialogue-lines" aria-label={"仍有 "+lockedLines.length+" 句未解锁"}>{lockedLines.map((_,index)=><p key={"locked-"+index}><span aria-label={"第 "+(visibleCount+index+1)+" 句尚未解锁"}>这句话仍留在沉默里</span></p>)}</div>}
    {!fullyUnlocked?<><strong className="locked-count">{visibleCount>0?`已显影 ${visibleCount} 句，剩余 ${remaining} 句未解锁`:`剩余 ${remaining} 句未解锁`}</strong><p className="commerce-note">主线与结局已经完整。以下只是不同范围的本地对白显影演示，不会发起真实交易。</p>{activeOffers.length>0&&onUnlock&&<div className="commerce-offers" aria-label="选择对白显影范围">{activeOffers.map(item=><button key={item.productId||item.label} className={`purchase-button ${item.recommended?"recommended":""}`} onClick={()=>onUnlock(item.productId)}><span>{item.recommended&&<em>推荐</em>}<b>{item.label}</b>{item.description&&<small>{item.description}</small>}</span><strong>{item.price}{item.creditText&&<small>{item.creditText}</small>}</strong></button>)}</div>}<div className="modal-actions"><button ref={primaryRef} className="ghost-button" onClick={exitAction}>{visibleCount>0?"带着已显影对白继续":"继续免费主线"}</button></div></>
    :<><p className="commerce-note">全部对白已永久收入记忆卷宗。</p><button ref={primaryRef} className="start-button compact" onClick={onContinue}>带着这段话继续</button></>}
  </section></div>;
}

export function ChapterSettlementOverlay({chapterLabel,memoryEarned,collectibleCount,missedDialogueCount,reward,chapterIndex,collectedRewardCount,claimed,nextTeaser,onClaim,onCopy,onContinue}:{chapterLabel:string;memoryEarned:number;collectibleCount:number;missedDialogueCount:number;reward:ChapterRewardView;chapterIndex:number;collectedRewardCount:number;claimed:boolean;nextTeaser:string;onClaim:()=>void;onCopy:()=>void;onContinue:()=>void}) {
  const dialogRef=useRef<HTMLElement|null>(null);
  const primaryRef=useRef<HTMLButtonElement|null>(null);
  const continueRef=useRef(onContinue);
  useEffect(()=>{continueRef.current=onContinue},[onContinue]);
  useEffect(()=>{
    const previous=document.activeElement as HTMLElement|null;
    const oldOverflow=document.body.style.overflow;
    document.body.style.overflow="hidden";
    window.setTimeout(()=>primaryRef.current?.focus(),0);
    const onKeyDown=(event:KeyboardEvent)=>{
      if(event.key==="Escape"){event.preventDefault();continueRef.current();return}
      if(event.key!=="Tab"||!dialogRef.current)return;
      const focusable=Array.from(dialogRef.current.querySelectorAll<HTMLElement>('button,[href],[tabindex]:not([tabindex="-1"])')).filter(element=>!element.hasAttribute("disabled"));
      if(!focusable.length)return;const first=focusable[0];const last=focusable[focusable.length-1];
      if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus()}
      else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus()}
    };
    window.addEventListener("keydown",onKeyDown);
    return()=>{window.removeEventListener("keydown",onKeyDown);document.body.style.overflow=oldOverflow;previous?.focus()};
  },[]);
  return <div className="story-modal-backdrop reward-backdrop" role="dialog" aria-modal="true" aria-labelledby="chapter-reward-title"><section ref={dialogRef} className="chapter-settlement">
    <div className="reward-prop" aria-hidden="true"><span>{reward.prop}</span><i/></div><p className="kicker">{chapterLabel} · 章节完成</p><h2 id="chapter-reward-title">章节纪念彩蛋已显影</h2>
    <p className="reward-copy">有些东西，他们没能带到后来。你替他们留住了。</p><div className="reward-code"><span>章节纪念演示码</span><strong>{reward.code}</strong></div>
    <p className="reward-disclaimer">{reward.disclaimer} 本演示不代表任何品牌合作或真实权益。</p><div className="settlement-stats"><span>本章显影 +{memoryEarned}</span><span>纪念物 {collectibleCount}</span><span>未完整对白 {missedDialogueCount}</span><span>本章 {chapterIndex}/5 · 卷宗 {collectedRewardCount}/5</span></div>
    <p className="next-teaser"><span>下一章线索</span>{nextTeaser}</p><div className="modal-actions"><button ref={primaryRef} className="start-button compact" onClick={claimed?onContinue:onClaim}>{claimed?"继续下一章":"收入记忆卷宗"}</button><button className="ghost-button" onClick={onCopy}>复制演示码</button>{!claimed&&<button className="ghost-button" onClick={onContinue}>暂不领取，继续</button>}</div>
  </section></div>;
}

export function ArchiveProgress({memory,nextUnlock,completedChapters,collectibles,rewards,unlockedDialogues,encounteredDialogues,paidItems,paidLineVisibility,previewVisible,specialEpilogueAvailable,onSpecialEpilogue}:{memory:number;nextUnlock:MemoryUnlockView;completedChapters:string[];collectibles:string[];rewards:string[];unlockedDialogues:string[];encounteredDialogues?:string[];paidItems:PaidDialogueView[];paidLineVisibility?:Record<string,number>;previewVisible?:boolean;specialEpilogueAvailable:boolean;onSpecialEpilogue?:()=>void}) {
  const canPreview=previewVisible??memory>=61;
  const visibleCountFor=(item:PaidDialogueView)=>{
    const hasExplicit=Boolean(paidLineVisibility&&Object.prototype.hasOwnProperty.call(paidLineVisibility,item.id));
    const requested=hasExplicit?(paidLineVisibility?.[item.id]||0):(unlockedDialogues.includes(item.id)?item.lockedLines.length:0);
    return Math.max(0,Math.min(item.lockedLines.length,Math.floor(requested)));
  };
  return <section className="archive-progress" aria-labelledby="archive-progress-title"><div className="archive-progress-head"><span>持续档案</span><h3 id="archive-progress-title">记忆显影度 {memory}/100</h3><p>{nextUnlock?`再显影 ${nextUnlock.remaining} 点，开放「${nextUnlock.label}」。`:"完整记忆卷宗已经开放。"}</p></div>
    <div className="archive-progress-grid"><article><span>完成章节</span><strong>{completedChapters.length}/5</strong></article><article><span>纪念物</span><strong>{collectibles.length}</strong></article><article><span>演示礼包</span><strong>{rewards.length}/5</strong></article><article><span>隐藏对白</span><strong>{unlockedDialogues.length}/5</strong></article></div>
    <div className="archive-collections"><div><span>已收藏物件</span><p>{collectibles.length?collectibles.join(" · "):"照片、车票和旧书仍等着被发现。"}</p></div><div><span>未说出口的话</span>{paidItems.map(item=>{
      const encountered=encounteredDialogues?.includes(item.id)??true;if(!encountered)return <article key={item.id} aria-label={`${item.chapterLabel||"未来章节"}对白尚未抵达`}><strong>{item.chapterLabel||"未来章节"} · 尚未抵达</strong><p className="blurred">{unlockedDialogues.includes(item.id)?"已拥有 · 随剧情显影":"随剧情抵达后开放"}</p></article>;
      const visibleCount=visibleCountFor(item);const remaining=item.lockedLines.length-visibleCount;
      return <article key={item.id} aria-label={item.archiveTitle||item.title}><strong>{item.archiveTitle||item.title}</strong><p className={canPreview?"unlocked":"blurred"}>{canPreview?item.previewLine:"轮廓尚未显影"}</p>{visibleCount>0&&<div>{item.lockedLines.slice(0,visibleCount).map((line,index)=><p className="unlocked" key={index}>{line}</p>)}</div>}{remaining>0&&<p className="blurred">{canPreview?`剩余 ${remaining} 句仍未解锁`:"对白轮廓仍在暗处"}</p>}</article>;
    })}</div></div>
    {onSpecialEpilogue&&<button className="ghost-button archive-epilogue-button" disabled={!specialEpilogueAvailable} onClick={onSpecialEpilogue}>{specialEpilogueAvailable?"打开特别尾声":"特别尾声 · 显影度达到 81 后开放"}</button>}
  </section>;
}
