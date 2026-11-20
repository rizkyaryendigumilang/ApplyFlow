# 7. Google Chrome Modern Web Guidance Integration

We decided to adopt Google Chrome's official Modern Web Guidance standards (from `GoogleChrome/modern-web-guidance`) as our baseline for web platform standards, input accessibility, and modern JavaScript/CSS idioms.

## Context

Web development practices continuously evolve. Modern browser platforms introduce native non-mutating collection APIs (such as `Array.prototype.toSorted`), robust credential management standards (`autoComplete="current-password"` and `autoComplete="new-password"`), IME (Input Method Editor) composition handling, and CSS layout stability features (`scrollbar-gutter: stable`, `text-wrap: balance`). Legacy workarounds (e.g. shallow array copying before sorting, missing IME checks, unannotated password fields) degrade performance, accessibility, and user experience.

## Decision

1. **Automated Audit Script:** Add `"audit:modern-web": "npx modern-web-guidance@latest legacy-scan ."` into `package.json` to allow automated auditing against modern web rules.
2. **Credential Autofill Standards:** Annotate all authentication and credential inputs with semantic `autoComplete` attributes (`current-password`, `new-password`).
3. **IME Safe Keyboard Submission:** Guard all keydown Enter handlers against active IME composition (`event.nativeEvent.isComposing || event.keyCode === 229`) to prevent premature submission during CJK and voice-to-text input.
4. **Modern ECMAScript Idioms:** Upgrade frontend TypeScript compiler target to ES2022 with ES2023 standard libraries, replacing mutating or copied array sorting with native `toSorted()`.
5. **Fluid CSS Standards:** Enforce `scrollbar-gutter: stable` to eliminate layout shifts on scrollbar visibility toggles, and use `text-wrap: balance` / `text-wrap: pretty` for typographic balance.

## Consequences

- Automated verification ensures zero regressions against Google Chrome modern web recommendations.
- Better password manager autofill compatibility across Chrome, Safari, and Firefox.
- Zero premature form triggers for international users typing via Input Method Editors.
- Cleaner, immutability-safe state derivation with modern ES2023 methods.
