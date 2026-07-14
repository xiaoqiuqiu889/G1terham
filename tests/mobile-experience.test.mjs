import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const layout = await readFile(new URL("../app/layout.tsx", import.meta.url), "utf8");
const page = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
const css = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");

test("reset control clears only Revolution Street data and returns to initial state", () => {
  assert.match(page, /重置游戏数据/);
  assert.match(page, /startsWith\("revolution-street-"\)/);
  assert.match(page, /window\.location\.reload\(\)/);
  assert.match(page, /role="dialog" aria-modal="true" aria-labelledby="reset-dialog-title"/);
  assert.match(page, /当前进度、选择、解锁内容和声音偏好都会清除/);
});

test("reset remains reachable on title and during the story", () => {
  assert.match(page, /className="ghost-button large title-reset-button"/);
  assert.match(page, /className="reset-trigger"/);
  assert.match(page, /onReset=\{\(\)=>setResetConfirmOpen\(true\)\}/);
});

test("mobile document declares a device-width viewport", () => {
  assert.match(layout, /export const viewport: Viewport/);
  assert.match(layout, /width: "device-width"/);
  assert.match(layout, /initialScale: 1/);
});
test("mobile layout neutralizes browser text inflation and protects touch targets", () => {
  assert.match(css, /-webkit-text-size-adjust:100%/);
  assert.match(css, /button\{touch-action:manipulation\}/);
  assert.match(css, /\.reset-dialog-actions button\{width:100%;min-height:48px\}/);
  assert.match(css, /\.top-actions button\{width:44px;height:44px;font-size:16px\}/);
  assert.match(css, /\.cinema-frame\{height:100dvh\}/);
});

test("mobile typography uses a readable hierarchy without oversized headlines", () => {
  assert.match(css, /\.title-content h1\{font-size:clamp\(38px,11\.5vw,48px\)/);
  assert.match(css, /\.title-content \.logline\{margin:14px 0;font-size:15px/);
  assert.match(css, /\.dialogue\{margin:4px 0;font-size:17px/);
  assert.match(css, /\.choices small\{display:-webkit-box;[\s\S]*font-size:12px/);
  assert.match(css, /\.chapter-card h2\{font-size:32px\}/);
});

test("choice scenes keep only the two decisive paragraphs", () => {
  assert.match(page, /scene\?\.kind==="choice"&&visibleBody\.length>2\?visibleBody\.slice\(-2\):visibleBody/);
  assert.match(page, /displayBody\.map/);
});
