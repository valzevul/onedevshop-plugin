---
name: docket-backlog
description: Work from the user's Docket backlog of apps, tasks, releases and ideas. Use at the start of a coding session to pick the next task, when finishing work that closes a task, when preparing or publishing a release, or when the user mentions Docket.
---

# Work from the Docket backlog

Docket is the user's release tracker for their apps. The user plans in the app. You read the plan, do the work and record what happened, through the `docket` tools.

## Start of a session

1. Call `dashboard` for the summary of projects, tasks and releases.
2. Find the project for the repository you are in with `list_projects`. Match on its name or repository path.
3. Call `list_tasks` for that project. Tasks marked up next or in progress come first.
4. Read the task's note with `get_task` before starting. Notes carry decisions and constraints.

## While you work

- Set the task to in progress with `update_task` when you start.
- Keep the note current with facts a later session needs: what was decided, what was ruled out, what is left.
- New work you discover becomes its own task with `create_task`. Do not fold it into the current one.

## Finishing

1. After the commit, call `attach_commit` so the task links to the change.
2. Call `complete_task`. Complete a task only when the work is done and checked.
3. If the work goes into a release, check `list_releases` and add it to the planned version, or create one with `create_release`.

## Releases

- `release_dossier` gathers a release's tasks and commits into one document. Use it to write release notes.
- Move a release from planned to shipped with `update_release` only after the user confirms it is live.
- `list_nominations` and `featuring_checks` cover App Store featuring nominations.

## Rules

- The server may be read-only. If a write fails for that reason, tell the user what you would have recorded and carry on.
- Never delete a release or change a project's settings unless the user asks.
- The backlog is the user's plan. Do not reorder or reword their tasks.
