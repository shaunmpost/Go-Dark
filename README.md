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
    locations.tsx      manage device + saved locations (gated)
  components/
    TopBar / FieldModeToggle / Verdict / NightRibbon /
    Scorecard / NudgeCard / Icon / DevStateSwitcher
  lib/
    theme.tsx          design tokens, the two themes, themed primitives
    types.ts           domain types (NightData, Factor, RibbonSample…)
    verdict.ts         transparent weighted scoring (pure)
    astro.ts           astronomy-engine: buildRows + assembleNight
    weather.ts         free weather (Open-Meteo / 7Timer! / NWS) + cache
    night.ts           orchestrator: astronomy + weather -> NightData
    best-night.ts      multi-day best-night finder (next ~14 nights)
    location.ts        device location via expo-location
    store.ts           zustand (saved locations, unlock) persisted
    purchases.ts       one-time unlock IAP seam (stubbed)
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
- [x] **Step 4** — `astronomy-engine` wired: real astronomical-dark window,
      moon altitude + illumination, and the galactic core (Sgr A*, defined as a
      custom star) arc/rise/peak for a hardcoded location. Drives the ribbon,
      bands, window, and the astro factors. See the **LIVE** dev option.
- [x] **Step 5** — weather wired and the verdict computed end-to-end. Open-Meteo
      (primary cloud cover) + 7Timer! (seeing/transparency) + NWS (US cross-check
      for source agreement -> confidence). Fetched on open / pull-to-refresh,
      cached per location+day, never polled. Degrades gracefully offline.
- [x] **Step 6** — device location (expo-location), saved locations (zustand +
      AsyncStorage, persisted) via a Locations screen, and the multi-day
      best-night finder that powers the nudge from the next ~14 nights.
- [x] **Step 7** — one-time unlock gate. A single IAP seam (`lib/purchases.ts`,
      non-consumable, no subscriptions) wired through the store + paywall with
      buy / restore / loading / error states and a launch-time entitlement
      check. The store-side `isUnlocked` gates saved locations + the planner.
      The purchase itself is stubbed with clear TODOs for react-native-iap /
      RevenueCat.

### v1 complete

All seven build steps are in. Free tier = tonight's verdict + ribbon + why for
the current location; the one-time unlock adds saved locations and the multi-day
planner. Remaining before store submission: real IAP wiring (the
`lib/purchases.ts` TODOs), app icons/splash art, and on-device QA against the
live weather endpoints.

> A temporary **Dev · preview state** switcher at the bottom of the screen flips
> GO / MAYBE / SKIP (mock-exact reference nights) plus **LIVE** (real on-device
> astronomy for the hardcoded location). It's removed once the verdict is
> computed end-to-end.

## Constraints

No subscriptions. No paid/licensed weather data. No per-call AI APIs. No
background polling, accounts, or phone-home analytics. Restraint is the product.
