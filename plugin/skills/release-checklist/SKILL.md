---
name: release-checklist
description: Walk an iOS, iPadOS or macOS app update through the eight release steps (build, QA, screenshots, metadata, pricing, release notes, marketing, support) before it goes to App Review. Use when the user is about to submit or release a version, asks whether a release is ready, or asks for a release checklist.
---

# Release checklist

Eight steps, in order. A step is done when its outcome is true, not when its tasks are ticked. Report each step as done, not done or not checked, with the evidence.

| Step | Done when | Check |
|---|---|---|
| Build | The release build is archived and uploaded, and it is the build you tested. | Version and build number bumped. Archive from a clean checkout. Upload and wait for processing. |
| QA | The build has been used the way a new user and an updating user would. | Fresh install. Update over the last version with real data. Smallest and largest device. Offline start. |
| Screenshots | The store shows the app as it looks in this version. | Retake any screen that changed. Check every device size and language listed. |
| Metadata | Name, subtitle, keywords and description match what the build does. | Promotional text updated. New features named. Support and privacy links open. |
| Pricing | Prices, offers and availability are what the user intends on release day. | New in-app purchases attached to the version. Offers and territories checked. |
| Release notes | What's New says what changed, in the user's words. | Lead with the change people will notice. Keep fixes short. Translate if the app is localised. |
| Marketing | The launch has a date, and the posts that go with it are written. | Blog post, social posts, a featuring nomination, an in-app event if it fits. |
| Support | The first questions can be answered without opening Xcode. | FAQ updated. A reply ready for the known rough edge. Review replies planned for week one. |

## How to check

- **Build:** read `CFBundleShortVersionString` and `CFBundleVersion` (or `MARKETING_VERSION` and `CURRENT_PROJECT_VERSION` in the project) and compare them with the last released version. With the `pitlane` tools, run a build and read the errors and warnings it returns; a warning added since the last release is worth a line in the report.
- **QA:** you cannot use the app for the user. List the four QA passes and ask which were done. With `pitlane`, you can install and launch on a simulator to confirm the app starts.
- **Screenshots and metadata:** compare the features in the release notes with the screenshots and description. A feature named in What's New and missing from the product page is a gap.
- **Pricing:** new in-app purchases and subscriptions must be submitted with a version the first time. Ask the user to confirm them in App Store Connect.
- **Release notes:** draft them from the commits since the last tag. With the `docket` tools, `release_dossier` gathers the release's tasks and commits.
- **Marketing:** a featuring nomination needs lead time. See the `featuring-nomination` skill.

## After the checklist

- Ask how the version should go out: released by hand, automatically after approval, or automatically no earlier than a date. For a phased rollout, see the `phased-release` skill.
- With `docket`, record the result on the release. Move it to shipped only after the user confirms it is live.

## Rules

- Never submit for review, release a version or change pricing yourself. Prepare the work and hand the final action to the user.
- Never mark a step done on a guess. "Not checked" is a valid answer.
