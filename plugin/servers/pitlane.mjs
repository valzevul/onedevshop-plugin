import { createInterface } from "node:readline";
import { pathToFileURL } from "node:url";

export const PROTOCOLS = ["2025-11-25", "2025-06-18", "2025-03-26", "2024-11-05"];
const INFO = { name: "pitlane", title: "Pitlane", version: "0.2.0", websiteUrl: "https://onedevshop.com/pitlane/" };
const READ = { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false };
const ACT = { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false };
const DOWN = "Pitlane did not answer. Open Pitlane and check that Settings > Agents is on, then try again.";
const PROJECT = { type: "string", minLength: 1, description: "Project name as Pitlane shows it (case-insensitive), or its id" };
const DESTINATION = { type: "string", minLength: 1, description: "Where to build: a simulator name such as iPhone 17 Pro, a device id, or mac. Leave out to use the project's current destination." };
const WAIT = (what) => ({ type: "boolean", description: what + " Defaults to true." });
const schema = (properties, required = []) => ({ type: "object", properties, required, additionalProperties: false });
const at = (name, rest = "") => "/projects/" + encodeURIComponent(name) + rest;
const target = (destination) => (destination ? { destination } : undefined);

export const TOOLS = [
  { name: "pitlane_status", title: "Pitlane status", description: "Read what Pitlane shows: host memory, every simulator with its memory use, every project with its build state, and whether the license allows building. Start here to learn the project names.", inputSchema: schema({}), annotations: { ...READ, title: "Pitlane status" }, route: () => ["GET", "/status"] },
  { name: "pitlane_project", title: "Project state and issues", description: "Read one project: its build phase, destination, elapsed time, and every parsed error and warning with file and line. Use it after a build to see what to fix.", inputSchema: schema({ project: PROJECT }, ["project"]), annotations: { ...READ, title: "Project state and issues" }, route: (a) => ["GET", at(a.project)] },
  { name: "pitlane_log", title: "Build or run log", description: "Read the tail of the project's last build or run log as plain text. Use it when the parsed issues do not explain a failure.", inputSchema: schema({ project: PROJECT }, ["project"]), annotations: { ...READ, title: "Build or run log" }, route: (a) => ["GET", at(a.project, "/log")] },
  { name: "pitlane_build", title: "Build a project", description: "Build a project in Pitlane. By default it waits and returns the final state with error and warning counts. Needs a Pitlane license or trial. A project that is already building answers 409: stop it first.", inputSchema: schema({ project: PROJECT, destination: DESTINATION, wait: WAIT("Wait for the build to finish.") }, ["project"]), annotations: { ...ACT, title: "Build a project" }, route: (a) => ["POST", at(a.project, "/build" + (a.wait === false ? "" : "?wait=true")), target(a.destination)] },
  { name: "pitlane_run", title: "Build and run a project", description: "Build a project and run it on its simulator or device. By default it waits and returns once the app is running or the build has failed. Needs a Pitlane license or trial.", inputSchema: schema({ project: PROJECT, destination: DESTINATION, wait: WAIT("Wait until the app is running or has failed.") }, ["project"]), annotations: { ...ACT, title: "Build and run a project" }, route: (a) => ["POST", at(a.project, "/run" + (a.wait === false ? "" : "?wait=true")), target(a.destination)] },
  { name: "pitlane_stop", title: "Stop a build or a running app", description: "Stop the project's build, or its running app.", inputSchema: schema({ project: PROJECT }, ["project"]), annotations: { ...ACT, idempotentHint: true, title: "Stop a build or a running app" }, route: (a) => ["POST", at(a.project, "/stop")] },
  { name: "pitlane_reduce_memory", title: "Reduce simulator memory", description: "Switch off the background services the apps on the project's simulator do not need, to free memory on the Mac. Reverse it with pitlane_restore_services.", inputSchema: schema({ project: PROJECT }, ["project"]), annotations: { ...ACT, idempotentHint: true, title: "Reduce simulator memory" }, route: (a) => ["POST", at(a.project, "/reduce-memory")] },
  { name: "pitlane_restore_services", title: "Restore simulator services", description: "Switch the simulator's background services back on after pitlane_reduce_memory.", inputSchema: schema({ project: PROJECT }, ["project"]), annotations: { ...ACT, idempotentHint: true, title: "Restore simulator services" }, route: (a) => ["POST", at(a.project, "/restore-services")] },
];

function invalid(tool, args) {
  if (!args || typeof args !== "object" || Array.isArray(args)) return "Arguments must be an object.";
  const { properties, required } = tool.inputSchema;
  for (const key of Object.keys(args)) if (!properties[key]) return "Unknown argument: " + key + ".";
  for (const key of required) if (args[key] === undefined) return "Missing argument: " + key + ".";
  for (const [key, value] of Object.entries(args)) {
    const rule = properties[key];
    if (rule.type === "string" && (typeof value !== "string" || value.length < (rule.minLength || 0))) return key + " must be a non-empty string.";
    if (rule.type === "boolean" && typeof value !== "boolean") return key + " must be true or false.";
  }
  return null;
}

export function createServer(base = process.env.PITLANE_URL || "http://127.0.0.1:4747") {
  const request = async (method, path, body) => {
    let response;
    try {
      response = await fetch(base + path, { method, headers: body ? { "Content-Type": "application/json" } : undefined, body: body ? JSON.stringify(body) : undefined });
    } catch {
      return { content: [{ type: "text", text: DOWN }], isError: true };
    }
    const text = (await response.text()).trim();
    if (!response.ok) return { content: [{ type: "text", text: "Pitlane answered " + response.status + (text ? ": " + text : "") }], isError: true };
    return { content: [{ type: "text", text: text || "Done." }] };
  };
  const result = (id, value) => ({ jsonrpc: "2.0", id, result: value });
  const failure = (id, code, message) => ({ jsonrpc: "2.0", id, error: { code, message } });

  return async function handle(message) {
    if (!message || message.jsonrpc !== "2.0" || typeof message.method !== "string") return message && message.id !== undefined ? failure(message.id, -32600, "Invalid request") : null;
    const { id, method, params = {} } = message;
    if (id === undefined || id === null) return null;
    if (method === "initialize") {
      const asked = params.protocolVersion;
      return result(id, { protocolVersion: PROTOCOLS.includes(asked) ? asked : PROTOCOLS[0], capabilities: { tools: { listChanged: false } }, serverInfo: INFO });
    }
    if (method === "ping") return result(id, {});
    if (method === "tools/list") return result(id, { tools: TOOLS.map(({ route, ...tool }) => tool) });
    if (method === "tools/call") {
      const tool = TOOLS.find((entry) => entry.name === params.name);
      if (!tool) return failure(id, -32602, "Unknown tool: " + params.name);
      const args = params.arguments === undefined ? {} : params.arguments;
      const problem = invalid(tool, args);
      if (problem) return result(id, { content: [{ type: "text", text: problem }], isError: true });
      const [verb, path, body] = tool.route(args);
      return result(id, await request(verb, path, body));
    }
    return failure(id, -32601, "Method not found: " + method);
  };
}

export function serve(input = process.stdin, output = process.stdout, handle = createServer()) {
  const lines = createInterface({ input, crlfDelay: Infinity });
  lines.on("line", async (line) => {
    if (!line.trim()) return;
    let message;
    try { message = JSON.parse(line); } catch { output.write(JSON.stringify({ jsonrpc: "2.0", id: null, error: { code: -32700, message: "Parse error" } }) + "\n"); return; }
    const reply = Array.isArray(message) ? (await Promise.all(message.map(handle))).filter(Boolean) : await handle(message);
    if (reply && (!Array.isArray(reply) || reply.length)) output.write(JSON.stringify(reply) + "\n");
  });
  return lines;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) serve();
