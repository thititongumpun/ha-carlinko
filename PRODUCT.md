# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Astro (static output) in `/site`, deployed to GitHub Pages by GitHub Actions. English + Thai with a language toggle. The Lovelace card keeps its own Vite build in `/src`.

## Users

Home Assistant users who own an Omoda, Jaecoo, Lepas or Chery car managed by the CarLinko app, mostly in Thailand and Southeast Asia. They want to know whether it works with their car, install it via HACS, sign in, and build dashboards and automations on top.

## Product Purpose

ha-carlinko is an unofficial Home Assistant custom integration that signs in with a CarLinko account and exposes the car as HA entities: telemetry, charging, tyres, body state, location, remote controls, plus a Lovelace card. Success: a visitor installs it and their car shows up in HA.

## Positioning

The only integration that brings CarLinko cars into Home Assistant with encrypted remote commands for the Nov 2026 T-Box firmware, per-model capability gating, decoded tyre data, and a ready-made Thai dashboard. Open source, no extra Python dependencies.

## Operating Context

Install through HACS custom repository or manual copy; configure via Settings → Devices & services → Add integration → CarLinko (account, password, region). One session per account; shared accounts may need re-sharing to send commands. Debug via HA logging and `tools/cli.py`.

## Capabilities and Constraints

See README.md (source of truth for features, entities, caveats). Only the Omoda C5 EV (Thailand) is verified by the author; Jaecoo J5 partially confirmed upstream. Requires Home Assistant 2025.1+.

## Brand Commitments

Must state it is unofficial and not affiliated with CarLinko, Chery, Omoda, Jaecoo or Lepas. Do not use those brands' logos or trade dress. Credits to GodrezJr2/j5-ev-dashboard, elad-bar/ha-carlinko and openlinko.

## Evidence on Hand

Screenshots in `docs/screenshots/` (card.png, dashboard.png, charging.png, 12vandspeed.png). No testimonials, user counts or benchmarks exist; do not invent them.

## Product Principles

- Honest about what is verified and what is not.
- Get the visitor from "will it work?" to a working install fast.
- Show real entities and real automations, not marketing abstractions.
