# CLAUDE.md

This file provides guidance to Claude Code when working with code in this repository.

## Package boundary (hard rule)

`@yarkivaev/wms` is a **generic** stock book: item, holder tree, claim, journal.

**Do not** put factory/Sokol melting domain here: moulds, diameters, casting sections, caster desks, or plant-specific attribute keys. Those belong in a plant package.

Allowed: opaque `kind` strings and domain-agnostic commands such as `register`, `revise`, `retire`, `include`, and `accept`.

If a change needs mould or shop semantics, implement it in the plant package and call these commands from there.

## Commands

```bash
npm test              # Run all tests with node:test
npm run coverage      # Run tests with coverage report
npm run lint          # Run ESLint
npm run lint:fix      # Run ESLint with auto-fix
```

## CI/CD

GitHub repository `yarkivaev/wms`. PR CI: `npm-workflows` ci.yml (version check, lint, test). Push to `main`: release.yml (re-check, tag `v*`, publish `@yarkivaev/wms` to npm).

## Layout

```
wms/
  src/domain/         book, item, claim, tree, journal entry
  test/domain/        unit tests
  test/e2e/           contracts, scenes, matchers, kit factories
  index.js            public API facade
```

## Domain

Every mutation is a claim. The book records the claim and a journal line, then changes the snapshot or the tree only when the verdict is `confirmed`. A mismatch stays in history and leaves the book as it was.

## Elegant Objects Principles

Factory functions returning frozen objects. No classes, no inheritance, no setters.
