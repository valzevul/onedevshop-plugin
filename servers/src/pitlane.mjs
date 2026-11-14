import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { pathToFileURL } from "node:url";

const READ = { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false };
const ACT = { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false };
const DOWN = "Pitlane did not answer. Open Pitlane and check that Settings > Agents is on, then try again.";
const project = z.string().min(1).describe("Project name as Pitlane shows it (case-insensitive), or its id");
const destination = z.string().min(1).optional().describe("Where to build: a simulator name such as iPhone 17 Pro, a device id, or mac. Leave out to use the project's current destination.");

export function buildServer(base = process.env.PITLANE_URL || "http://127.0.0.1:4747") {
  const call = async (method, path, body) => {
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
  const at = (name, rest = "") => "/projects/" + encodeURIComponent(name) + rest;
  const body = (target) => (target ? { destination: target } : undefined);
  const server = new McpServer({ name: "pitlane", title: "Pitlane", version: "0.1.0", websiteUrl: "https://onedevshop.com" });

  server.registerTool("pitlane_status", { title: "Pitlane status", description: "Read what Pitlane shows: host memory, every simulator with its memory use, every project with its build state, and whether the license allows building. Start here to learn the project names.", inputSchema: {}, annotations: READ }, () => call("GET", "/status"));
  server.registerTool("pitlane_project", { title: "Project state and issues", description: "Read one project: its build phase, destination, elapsed time, and every parsed error and warning with file and line. Use it after a build to see what to fix.", inputSchema: { project }, annotations: READ }, ({ project: name }) => call("GET", at(name)));
  server.registerTool("pitlane_log", { title: "Build or run log", description: "Read the tail of the project's last build or run log as plain text. Use it when the parsed issues do not explain a failure.", inputSchema: { project }, annotations: READ }, ({ project: name }) => call("GET", at(name, "/log")));
  server.registerTool("pitlane_build", { title: "Build a project", description: "Build a project in Pitlane. By default it waits and returns the final state with error and warning counts. Needs a Pitlane license or trial. A project that is already building answers 409: stop it first.", inputSchema: { project, destination, wait: z.boolean().optional().describe("Wait for the build to finish. Defaults to true.") }, annotations: ACT }, ({ project: name, destination: target, wait }) => call("POST", at(name, "/build" + (wait === false ? "" : "?wait=true")), body(target)));
  server.registerTool("pitlane_run", { title: "Build and run a project", description: "Build a project and run it on its simulator or device. By default it waits and returns once the app is running or the build has failed. Needs a Pitlane license or trial.", inputSchema: { project, destination, wait: z.boolean().optional().describe("Wait until the app is running or has failed. Defaults to true.") }, annotations: ACT }, ({ project: name, destination: target, wait }) => call("POST", at(name, "/run" + (wait === false ? "" : "?wait=true")), body(target)));
  server.registerTool("pitlane_stop", { title: "Stop a build or a running app", description: "Stop the project's build, or its running app.", inputSchema: { project }, annotations: { ...ACT, idempotentHint: true } }, ({ project: name }) => call("POST", at(name, "/stop")));
  server.registerTool("pitlane_reduce_memory", { title: "Reduce simulator memory", description: "Switch off the background services the apps on the project's simulator do not need, to free memory on the Mac. Reverse it with pitlane_restore_services.", inputSchema: { project }, annotations: { ...ACT, idempotentHint: true } }, ({ project: name }) => call("POST", at(name, "/reduce-memory")));
  server.registerTool("pitlane_restore_services", { title: "Restore simulator services", description: "Switch the simulator's background services back on after pitlane_reduce_memory.", inputSchema: { project }, annotations: { ...ACT, idempotentHint: true } }, ({ project: name }) => call("POST", at(name, "/restore-services")));
  return server;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await buildServer().connect(new StdioServerTransport());
}
