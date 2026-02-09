# Exec Plan: Angular 21 + Zoneless Migration

## Goals
- Migrate the app runtime and tests to Angular 21.
- Run without Zone.js (no Zone polyfills in build/test; explicit change detection only).
- Upgrade all libraries used within the application to their latest versions (e.g., ngx-color-picker, PrimeNG), compatible with Angular 21.
- Do not edit any component or template files.

## Constraints
- No edits inside `src/app/**/*.component.*` or other component/template files.
- Must remove Zone.js from dependencies and from Angular build/test polyfills.
- Tests and runtime must boot on Angular 21.

## Inventory (current key files)
- `package.json` (Angular 17.x, zone.js present)
- `angular.json` (build/test polyfills include `zone.js` and `zone.js/testing`)
- `src/main.ts` (bootstrapApplication)
- `src/app/app.config.ts` (ApplicationConfig providers)
- `tsconfig*.json` (may need updates for Angular 21/TS requirements)

## Execution Steps
1. **Baseline check (read-only)**
   - Review `package.json`, `angular.json`, `tsconfig.json`, `tsconfig.app.json`, `tsconfig.spec.json`.
   - Confirm current Angular standalone setup and entrypoints.

2. **Upgrade framework + tooling to Angular 21**
   - Update `package.json` Angular packages to `^21.x`:
     - `@angular/*`, `@angular-devkit/build-angular`, `@angular/cli`, `@angular/compiler-cli`.
   - Update other deps to latest compatible versions:
     - `rxjs`, `tslib`, `typescript`, `karma`, `jasmine` + related launchers/reporters, `@types/*`, and any UI libs (e.g., `ng-click-outside2`, `ngx-color-picker`, PrimeNG if present).
   - If `ng update` is preferred, run `npx ng update @angular/core @angular/cli` and align resulting versions.
   - Regenerate lockfile (`package-lock.json`) after version updates.

3. **Remove Zone.js from runtime + tests**
   - Remove `zone.js` from `dependencies`.
   - Update `angular.json`:
     - Build `polyfills`: remove `zone.js` entry.
     - Test `polyfills`: remove `zone.js` and `zone.js/testing` entries.

4. **Enable zoneless change detection**
   - Update `src/app/app.config.ts` to include Angular’s zoneless provider for Angular 21.
     - Likely `provideZonelessChangeDetection()` (verify exact API name for v21).
   - Ensure bootstrap remains in `src/main.ts` and uses the updated `appConfig`.

5. **Adjust test setup (if required by Angular 21)**
   - If Angular 21’s test setup changes (e.g., new test environment init), apply those changes in test configuration files only (no component edits).
   - Confirm `karma` config (if present in repo root) remains valid for the new Angular CLI version.

6. **Run and verify**
   - Install deps.
   - `npm run build` and `npm run test` to confirm Angular 21 runtime and tests pass without Zone.js.
   - If any failures trace to missing explicit change detection, address in app-level configuration only (no component edits).

## Files Expected to Change
- `package.json`
- `package-lock.json`
- `angular.json`
- `src/app/app.config.ts`
- Potentially `tsconfig.json`, `tsconfig.app.json`, `tsconfig.spec.json`
- Any CLI-generated config files required by Angular 21 (e.g., updated test setup)

## Risks / Watchouts
- Third-party libs (`ng-click-outside2`, `ngx-color-picker`, PrimeNG if present) may not support Angular 21 and could require replacement or major updates.
- Zoneless mode may require explicit change detection triggers; limited to app-level configuration due to no component edits.
- Angular 21 may require a newer TypeScript version and updated test toolchain.

## Verification Checklist
- `package.json` reflects Angular 21 and latest deps.
- No `zone.js` in `dependencies`.
- `angular.json` has no `zone.js` in build/test polyfills.
- App boots with zoneless change detection provider.
- `npm run build` and `npm run test` succeed.

## Open Questions
- Prefer `ng update` flow or manual version pinning?
- If a third-party dependency is incompatible with Angular 21, is replacing it acceptable?
