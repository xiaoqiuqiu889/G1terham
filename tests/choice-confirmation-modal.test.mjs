import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const page = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
const css = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");

function between(source, start, end) {
  const from = source.indexOf(start);
  const to = source.indexOf(end, from + start.length);
  assert.notEqual(from, -1, `missing source marker: ${start}`);
  assert.notEqual(to, -1, `missing source marker: ${end}`);
  return source.slice(from, to);
}

const selectOption = between(page, "const selectOption=", "const commitSelection=");
const commitSelection = between(page, "const commitSelection=", "const goBack=");
const confirmationCard = between(page, "function ConfirmationCard", "function resonanceAction");
const selectionPanel = between(page, "function SelectionPanel", "function ConfirmationCard");

test("main choice confirmation is an accessible portal modal", () => {
  assert.match(page, /import \{ createPortal \} from "react-dom"/);
  assert.match(confirmationCard, /return createPortal\(/);
  assert.match(confirmationCard, /role="dialog"/);
  assert.match(confirmationCard, /aria-modal="true"/);
  assert.match(confirmationCard, /aria-labelledby="choice-confirm-title"/);
  assert.match(confirmationCard, /aria-describedby="choice-confirm-copy"/);
  assert.match(confirmationCard, /document\.body/);
  assert.match(confirmationCard, /continueRef\.current\?\.focus\(\{preventScroll:true\}\)/);
  assert.doesNotMatch(confirmationCard, /`r`n/, "generated source must contain real line breaks, not PowerShell escape text");
});

test("confirmation waits about 700ms in every motion preference", () => {
  assert.match(
    selectOption,
    /window\.setTimeout\(\(\)=>\{setConfirmationReady\(true\);timerRef\.current=null\},\s*700\s*\)/,
  );
  assert.doesNotMatch(selectOption, /matchMedia\(/);
  assert.doesNotMatch(selectOption, /reduced\s*\?\s*80/);
  assert.doesNotMatch(selectOption, /commitSelection|moveNext|requestSceneExit/);
});

test("only the explicit continue button commits a confirmed choice", () => {
  assert.match(confirmationCard, /\{ready&&<button[^>]*onClick=\{onCommit\}/);
  assert.match(commitSelection, /if\(!selectedOption\|\|!confirmationReady\)return/);
  assert.match(selectionPanel, /disabled=\{Boolean\(selected\)\}/);
  assert.match(confirmationCard, /onClick=\{event=>event\.stopPropagation\(\)\}/);
  assert.match(confirmationCard, /onPointerDown=\{event=>event\.stopPropagation\(\)\}/);
});

test("confirmation locks scene and keyboard advancement", () => {
  assert.match(page, /if\(selectedOption\|\|journalOpen[\s\S]*?\|\|finished\)return/);
  assert.match(page, /if\(journalOpen\|\|specialEpilogueOpen\|\|selectedOption\)return/);
  assert.match(page, /event\.key===" "\|\|event\.key==="Enter"/);
});

test("mobile confirmation is centered above HUD and clamps copy to two lines", () => {
  assert.match(css, /\.memory-hud\{position:absolute;z-index:9;/);
  assert.match(
    css,
    /\.choice-confirmation-backdrop\{position:fixed;z-index:130;inset:0;display:grid;place-items:center;/,
  );
  assert.match(css, /\.choice-confirmation-backdrop \.choice-memory\{[\s\S]*?width:min\(440px,100%\)/);
  assert.match(css, /@media\(max-width:760px\)\{[\s\S]*?\.choice-confirmation-backdrop \.choice-memory\{width:100%;min-height:184px/);
  assert.match(css, /\.choice-confirmation-backdrop \.choice-memory strong\{[\s\S]*?-webkit-line-clamp:2/);
  assert.match(css, /\.choice-confirmation-backdrop \.choice-memory small\{[\s\S]*?-webkit-line-clamp:2/);
  assert.match(css, /@media\(prefers-reduced-motion:reduce\)\{\.choice-confirmation-backdrop\{animation:none\}\}/);
});
