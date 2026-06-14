# Go Dark

A night-sky planning app for astrophotographers. One promise: open it and
instantly know **whether tonight is worth shooting, and if so when and where to
point** — without reading a single chart.

Built with **Expo (React Native) + TypeScript** so one codebase ships to both
the App Store and Google Play. No subscriptions, no paid weather APIs, no
accounts, no background polling.

## Stack

- Expo SDK 56 · React Native 0.85 · React 19 · TypeScript
- **expo-router** — navigation
- **react-native-reanimated** + **react-native-gesture-handler** — the ribbon
  scrub and the ~0.5s theme transition
- **react-native-svg** — the ribbon hatching/markers and cross-platform icons
- **astronomy-engine** — on-device celestial math (wired in Step 4)
- **zustand** — light state (introduced as needed)

## Run it

```bash
npm install
npm start        # then press i / a, or scan the QR with Expo Go
# or
npm run web
```

## Project structure

```
src/
  app/                 expo-router routes
    _layout.tsx        providers (gesture root, safe area, theme) + Stack
    index.tsx          the "Tonight" screen
  components/
    TopBar / FieldModeToggle / Verdict / NightRibbon /
    Scorecard / NudgeCard / Icon / DevStateSwitcher
  lib/
    theme.tsx          design tokens, the two themes, themed primitives
    types.ts           domain types (NightData, Factor, RibbonSample…)
    verdict.ts         transparent weighted scoring (pure)
    astro.ts           astronomy-engine wiring  (stub → Step 4)
    weather.ts         free weather fetchers    (stub → Step 5)
    mock-data.ts       hardcoded GO / MAYBE / SKIP nights
  config/
    verdict-weights.ts the single tunable config for the verdict
    data-sources.ts    base URLs (swappable for self-hosted mirrors) + core coords
```

## Design system

Two themes, swapped by the moon toggle (top-right), all colors interpolating
over ~0.5s:

- **Night** (default) — deep navy/black, mint **GO** accent, amber **MAYBE**,
  desaturated red **SKIP**.
- **Field mode** — full monochrome night-vision red to protect dark adaptation.

Tokens live in one place: `src/lib/theme.tsx`.

## Build progress

- [x] **Step 1** — Scaffold, two themes + field-mode toggle, static Tonight
      screen (TopBar, hero Verdict, NightRibbon, Why-tonight Scorecard,
      best-night NudgeCard, footer) driven by mock data.
- [x] Ribbon scrubbing (gesture + live readout) and Why-tonight expand/collapse.
- [x] GO / MAYBE / SKIP states + confidence (preview via the dev switcher).
- [ ] **Step 4** — wire `astronomy-engine` (twilight, moon, galactic core).
- [ ] **Step 5** — weather (Open-Meteo first) + end-to-end verdict scoring.
- [ ] **Step 6** — device + saved locations, multi-day best-night finder.
- [ ] **Step 7** — one-time unlock gate (stubbed purchase).

> A temporary **Dev · preview state** switcher at the bottom of the screen flips
> GO / MAYBE / SKIP so all three can be reviewed before the data pipeline lands.
> It's removed once the verdict is computed end-to-end.

## Constraints

No subscriptions. No paid/licensed weather data. No per-call AI APIs. No
background polling, accounts, or phone-home analytics. Restraint is the product.
