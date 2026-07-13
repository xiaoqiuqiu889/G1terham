import assert from "node:assert/strict";
import test from "node:test";

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);
  return worker.fetch(
    new Request("http://localhost/", { headers: { accept: "text/html" } }),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} },
  );
}

test("server renders the V3 memory-editing title screen", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);
  const html = await response.text();
  assert.match(html, /<title>革命街没有尽头/);
  assert.match(html, /记忆剪辑 V3/);
  assert.match(html, /进入故事/);
  assert.match(html, /自动保存/);
  assert.match(html, /哪一种往事先被他们看见/);
  assert.doesNotMatch(html, /选择不能改变历史/);
});

test("ships Chinese accessibility metadata and no starter content", async () => {
  const response = await render();
  const html = await response.text();
  assert.match(html, /lang="zh-CN"/);
  assert.doesNotMatch(html, /codex-preview|Your site is taking shape|react-loading-skeleton/i);
});
