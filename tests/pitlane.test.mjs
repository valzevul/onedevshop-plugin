import test from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

const SERVER = fileURLToPath(new URL("../plugin/servers/pitlane.mjs", import.meta.url));

const seen = [];
const fake = http.createServer((req, res) => {
  let body = "";
  req.on("data", (chunk) => { body += chunk; });
  req.on("end", () => {
    seen.push({ method: req.method, url: req.url, body, type: req.headers["content-type"] });
    if (req.url === "/status") { res.writeHead(200, { "content-type": "application/json" }).end('{"canBuild":true,"projects":[{"name":"My App"}]}'); return; }
    if (req.url.startsWith("/projects/Locked")) { res.writeHead(402).end("Building needs a Pitlane license or trial: Trial ended."); return; }
    if (req.url.endsWith("/log")) { res.writeHead(200, { "content-type": "text/plain" }).end("error: boom\n"); return; }
    if (req.method === "POST" && !req.url.includes("wait=true") && /\/(build|run)/.test(req.url)) { res.writeHead(202, { "content-type": "application/json" }).end('{"phase":"building"}'); return; }
    res.writeHead(200, { "content-type": "application/json" }).end(req.method === "POST" && /stop|reduce|restore/.test(req.url) ? "" : '{"phase":"succeeded","errors":0,"warnings":2}');
  });
});
await new Promise((ready) => fake.listen(0, "127.0.0.1", ready));
const base = "http://127.0.0.1:" + fake.address().port;

const clients = [];
const connect = async (url) => {
  const client = new Client({ name: "test", version: "1" });
  await client.connect(new StdioClientTransport({ command: process.execPath, args: [SERVER], env: { ...process.env, PITLANE_URL: url } }));
  clients.push(client);
  return client;
};
const client = await connect(base);
const call = async (name, args = {}) => { seen.length = 0; return client.callTool({ name, arguments: args }); };

test("eight tools, each with a title and annotations", async () => {
  const { tools } = await client.listTools();
  assert.deepEqual(tools.map((tool) => tool.name).sort(), ["pitlane_build", "pitlane_log", "pitlane_project", "pitlane_reduce_memory", "pitlane_restore_services", "pitlane_run", "pitlane_status", "pitlane_stop"]);
  tools.forEach((tool) => { assert.ok(tool.title, tool.name); assert.equal(typeof tool.annotations.readOnlyHint, "boolean", tool.name); });
  assert.deepEqual(tools.filter((tool) => tool.annotations.readOnlyHint).map((tool) => tool.name).sort(), ["pitlane_log", "pitlane_project", "pitlane_status"]);
});

test("status, project and log read from the local API", async () => {
  const status = await call("pitlane_status");
  assert.deepEqual(seen.map((r) => [r.method, r.url]), [["GET", "/status"]]);
  assert.match(status.content[0].text, /"canBuild":true/);
  await call("pitlane_project", { project: "My App" });
  assert.deepEqual(seen.map((r) => [r.method, r.url]), [["GET", "/projects/My%20App"]]);
  const log = await call("pitlane_log", { project: "My App" });
  assert.equal(seen[0].url, "/projects/My%20App/log");
  assert.equal(log.content[0].text, "error: boom");
});

test("build and run wait by default and pass the destination", async () => {
  const built = await call("pitlane_build", { project: "Murmur", destination: "iPhone 17 Pro" });
  assert.deepEqual([seen[0].method, seen[0].url, seen[0].body, seen[0].type], ["POST", "/projects/Murmur/build?wait=true", '{"destination":"iPhone 17 Pro"}', "application/json"]);
  assert.match(built.content[0].text, /"errors":0/);
  await call("pitlane_run", { project: "Murmur" });
  assert.deepEqual([seen[0].url, seen[0].body], ["/projects/Murmur/run?wait=true", ""]);
  const started = await call("pitlane_build", { project: "Murmur", wait: false });
  assert.equal(seen[0].url, "/projects/Murmur/build");
  assert.match(started.content[0].text, /building/);
});

test("stop and the memory tools post to their routes", async () => {
  const stopped = await call("pitlane_stop", { project: "Murmur" });
  assert.deepEqual([seen[0].method, seen[0].url], ["POST", "/projects/Murmur/stop"]);
  assert.equal(stopped.content[0].text, "Done.");
  await call("pitlane_reduce_memory", { project: "Murmur" });
  assert.equal(seen[0].url, "/projects/Murmur/reduce-memory");
  await call("pitlane_restore_services", { project: "Murmur" });
  assert.equal(seen[0].url, "/projects/Murmur/restore-services");
});

test("a refused build comes back as an error with Pitlane's reason", async () => {
  const refused = await call("pitlane_build", { project: "Locked" });
  assert.equal(refused.isError, true);
  assert.match(refused.content[0].text, /^Pitlane answered 402: Building needs a Pitlane license or trial/);
});

test("bad arguments and unknown tools are refused before Pitlane is called", async () => {
  const missing = await call("pitlane_project", {});
  assert.equal(missing.isError, true);
  assert.equal(missing.content[0].text, "Missing argument: project.");
  assert.equal(seen.length, 0);
  const extra = await call("pitlane_stop", { project: "Murmur", force: true });
  assert.equal(extra.content[0].text, "Unknown argument: force.");
  const wrong = await call("pitlane_build", { project: "Murmur", wait: "yes" });
  assert.equal(wrong.content[0].text, "wait must be true or false.");
  await assert.rejects(client.callTool({ name: "pitlane_delete", arguments: {} }), /Unknown tool/);
});

test("a closed Pitlane is reported plainly", async () => {
  const closed = await connect("http://127.0.0.1:1");
  const result = await closed.callTool({ name: "pitlane_status", arguments: {} });
  assert.equal(result.isError, true);
  assert.match(result.content[0].text, /Pitlane did not answer/);
});

test("the server file speaks MCP over stdio with no dependencies installed beside it", async () => {
  const child = spawn(process.execPath, [SERVER], { env: { ...process.env, PITLANE_URL: base }, stdio: ["pipe", "pipe", "inherit"] });
  let out = "";
  child.stdout.on("data", (chunk) => { out += chunk; });
  child.stdin.write(JSON.stringify({ jsonrpc: "2.0", id: 1, method: "initialize", params: { protocolVersion: "2025-06-18", capabilities: {}, clientInfo: { name: "t", version: "1" } } }) + "\n");
  child.stdin.write(JSON.stringify({ jsonrpc: "2.0", method: "notifications/initialized" }) + "\n");
  child.stdin.write(JSON.stringify({ jsonrpc: "2.0", id: 2, method: "tools/call", params: { name: "pitlane_status", arguments: {} } }) + "\n");
  await new Promise((resolve, reject) => { const timer = setTimeout(() => reject(new Error("timeout: " + out)), 8000); const poll = setInterval(() => { if (out.split("\n").filter(Boolean).length >= 2) { clearTimeout(timer); clearInterval(poll); resolve(); } }, 50); });
  child.kill();
  const [init, status] = out.split("\n").filter(Boolean).map((line) => JSON.parse(line));
  assert.equal(init.result.serverInfo.name, "pitlane");
  assert.match(status.result.content[0].text, /canBuild/);
});

test("the server is plain source under the directory's size limit", async () => {
  const { statSync, readFileSync } = await import("node:fs");
  assert.ok(statSync(SERVER).size < 256 * 1024);
  assert.equal(/^import .* from "(?!node:)/m.test(readFileSync(SERVER, "utf8")), false);
});

test.after(async () => { await Promise.all(clients.map((client) => client.close())); fake.close(); });
