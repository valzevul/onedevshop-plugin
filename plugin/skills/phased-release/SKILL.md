---
name: phased-release
description: Explain and plan an App Store phased release for an app update - the seven-day schedule, who gets the update, pausing, releasing to everyone early and what ends a phased release. Use when the user asks about phased release, a staged or gradual rollout on the App Store, pausing an update, or how to release an approved version.
---

# App Store phased release

Facts follow Apple's help pages "Release a version update in phases" and "Select an App Store version release option", read on 11 November 2026. If the user reports different behaviour in App Store Connect, trust what they see and say the page may have changed.

## What it is

A phased release sends a version update in stages over seven days to people with automatic updates on. They are a random sample and are not told. It applies to updates on iOS, macOS and tvOS, not to a first release. Anyone can still download the update by hand from the App Store at any time.

| Day | Share of users with automatic updates |
|---|---|
| 1 | 1% |
| 2 | 2% |
| 3 | 5% |
| 4 | 10% |
| 5 | 20% |
| 6 | 50% |
| 7 | 100% |

## Turning it on

It needs the Account Holder, Admin or App Manager role. In App Store Connect: Apps, the app, the version about to be submitted, Phased Release for Automatic Updates, "Release update over a 7-day period using phased release", Save. After approval the version shows Ready for Distribution with Phased Release beside it.

## Pausing and ending

- Pause from the same section with Pause Phased Release. Pauses add up to 30 days in total, with no limit on their number. A resumed release picks up on the day it stopped.
- Release to All Users, at the top right of a Ready for Distribution version, ends the phases and gives the version to everyone with automatic updates.
- Removing the app from sale stops the phased release for good for that version. Apple counts a lapsed Apple Developer Program membership as removal. When the app returns, the version goes to everyone at once.

## Release timing is a separate choice

Apple offers three: release by hand, release automatically after approval, or release automatically no earlier than a set date and time. A version released by hand may take up to 24 hours to appear on the App Store.

## Advising the user

- Recommend a phased release when the update touches data migration, sign-in, purchases or anything that is hard to undo, so a crash shows up at 1 to 5% instead of 100%.
- During the first days, watch crash reports and reviews. Pause on a crash that affects many users, release a fix as a normal update.
- A phased release does not hold back manual downloads, so it is no substitute for a feature flag.
- Never pause, resume or release a version yourself. Tell the user which button to press.
