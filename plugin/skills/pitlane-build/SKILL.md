---
name: pitlane-build
description: Build, run and debug an iOS, macOS or visionOS project through Pitlane. Use when the user asks to build or run an Xcode project, fix compiler errors, check simulator memory, or when Pitlane is installed and a build is needed.
---

# Build and run with Pitlane

Pitlane builds and runs Xcode projects from one window. Its tools give you the same data the window shows, so you can build, read the errors, fix the code and build again without the user pasting compiler output.

## The loop

1. Call `pitlane_status`. It lists the projects by name, their build state, the simulators and whether building is allowed (`canBuild`).
2. Call `pitlane_build` with the project name, or `pitlane_run` to build and launch it. Both wait for the result by default.
3. If the build failed, call `pitlane_project`. It returns every error and warning with its file and line.
4. Fix the code, then build again. Repeat until the error count is zero.
5. If the parsed issues do not explain a failure, read `pitlane_log`.

Pass `destination` to build somewhere other than the project's current choice: a simulator name such as `iPhone 17 Pro`, a device id, or `mac`.

## When a call fails

- **Pitlane did not answer**: the app is closed or its agent API is off. Ask the user to open Pitlane and switch on Settings > Agents.
- **402**: the trial or license has lapsed. Tell the user. Do not fall back to `xcodebuild` without asking.
- **409**: the project is already building or running. Call `pitlane_stop`, then try again.
- **503**: Pitlane is still reading its license. Wait a moment and retry once.

## Memory

`pitlane_status` reports host memory and each simulator's footprint. When the Mac is short of memory, call `pitlane_reduce_memory` for the project. It switches off simulator background services the app does not need. `pitlane_restore_services` turns them back on, which matters when testing push notifications, widgets or anything that depends on those services.

## Rules

- Use the project names from `pitlane_status`. Do not guess them.
- Build through Pitlane when it is running. Starting `xcodebuild` beside it compiles the same project twice.
- Report the final error and warning counts to the user after each build.
