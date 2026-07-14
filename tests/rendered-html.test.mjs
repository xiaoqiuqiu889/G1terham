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

test("server renders the current memory-editing title screen", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);
  assert.equal(response.headers.get("cache-control"), "no-store, no-cache, must-revalidate");
  const html = await response.text();
  assert.match(html, /<title>革命街没有尽头/);
  assert.match(html, /互动叙事 · 记忆剪辑/);
  assert.match(html, /她被处分、离开、结婚、重逢/);
  assert.match(html, /有声进入/);
  assert.match(html, /静音进入/);
  assert.match(html, /自动保存/);
  assert.doesNotMatch(html, /记忆剪辑 V[0-9]|选择不能改变历史/);
});

test("ships Chinese accessibility metadata and no starter content", async () => {
  const response = await render();
  const html = await response.text();
  assert.match(html, /lang="zh-CN"/);
  assert.match(html, /<meta name="viewport" content="width=device-width, initial-scale=1"\/>/);
  assert.doesNotMatch(html, /codex-preview|Your site is taking shape|react-loading-skeleton/i);
});
