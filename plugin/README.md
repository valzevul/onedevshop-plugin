# One Dev Shop plugin

Tools and skills for building and releasing iOS apps with an agent, for Claude Code and Codex.

- **Pitlane**: build, run and stop Xcode projects, read parsed errors and warnings, and free simulator memory.
- **Docket**: read the backlog, pick the next task, attach commits and track releases.
- **Release skills**: check a version against the eight release steps, plan a phased release and draft a featuring nomination. They work without either app.

## Install

Claude Code:

```
/plugin install onedevshop --marketplace valzevul/onedevshop-plugin
```

Codex CLI or Codex in the ChatGPT desktop app:

```sh
codex plugin marketplace add valzevul/onedevshop-plugin
codex plugin add onedevshop@onedevshop
```

## Requirements

- [Pitlane](https://onedevshop.com/pitlane/) running, with Settings > Agents switched on.
- [Docket](https://onedevshop.com/docket/) with its command-line tool installed and the MCP server switched on in Docket's settings. The plugin looks for the tool in `~/.local/bin`, `/opt/homebrew/bin` and `/usr/local/bin`; set `DOCKET_BIN` if it lives elsewhere.
- Node.js 18 or later.

Either app works without the other. A missing app shows as a server that fails to connect.

## Skills

| Skill | Use it for |
|---|---|
| `pitlane-build` | Building, running and fixing a project through Pitlane |
| `docket-backlog` | Picking the next task and recording releases in Docket |
| `release-checklist` | Checking a version before it goes to App Review |
| `phased-release` | Planning a staged rollout of an update |
| `featuring-nomination` | Drafting an App Store featuring nomination |

## Development

The plugin itself is the `plugin/` folder: manifests, skills and two small servers in plain JavaScript with no dependencies. The repository root holds the marketplaces and the tests.

```sh
npm install
npm test
```

`plugin/.claude-plugin/` is the Claude Code manifest; `plugin/plugin.json` and `plugin/mcp.json` are the Agent Plugins files Codex reads.

## Privacy

Both servers run on your Mac. The Pitlane server talks only to Pitlane's local API on `127.0.0.1:4747`, and the Docket server is Docket's own tool. Nothing is sent to us. Terms and privacy for the apps: [onedevshop.com/terms](https://onedevshop.com/terms/).

## License

MIT
