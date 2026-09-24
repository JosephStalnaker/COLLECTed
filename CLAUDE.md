# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Project

COLLECTed: a React Native / Expo (SDK 56) community app for sharing collections, starting with books and music. It is at the early scaffold stage: auth, navigation and a placeholder Home screen exist; collections, items and the social features do not yet. The backend currently runs on Firebase and is being migrated to Supabase (see Current migration).

## Commands

```bash
npm start                  # expo start (Metro dev server)
npm run ios                # expo run:ios — native dev build (needs Xcode)
npm run android            # expo run:android — native dev build
npm run typecheck          # tsc --noEmit (strict)
npm run lint               # expo lint (ESLint flat config, eslint-config-expo)
npm test                   # jest (jest-expo preset), single run
npm run test:watch         # jest --watch
npx jest __tests__/home-screen-test.tsx   # one file
npx jest -t "greets the signed-in user"   # one test by name
npx expo install <pkg>     # add deps at versions compatible with SDK 56
```

Supabase CLI (a dev dependency, so always run it through `npx`):

```bash
npx supabase login                               # once per machine
npx supabase link --project-ref <dev-ref>        # point the CLI at the dev project
npx supabase migration new <name>                # new file in supabase/migrations/
npx supabase db push                             # apply pending migrations to the linked project
npx supabase gen types typescript --linked > src/data/database.types.ts
npx supabase test db                             # pgTAP tests in supabase/tests/
```

Docker isn't installed, so `supabase start` and a local stack aren't used; migrations are tested against the dev project, then pushed to prod. `supabase/config.toml` only configures the local stack; hosted auth settings (email confirmation, redirect URLs) are set per project in the dashboard. To run the app against Supabase, copy `.env.example` to `.env.local` and fill in the dev project's URL and publishable key.

Tests live in `__tests__/` at the repo root and are named `*-test.tsx` (the Expo convention). Component tests use React Native Testing Library v14, which runs on `test-renderer` instead of the deprecated `react-test-renderer`. In v14, `render` is async, so use `await render(...)`, and matchers like `toBeOnTheScreen` are built in. To keep Firebase out of tests, mock `src/services/*` with `jest.mock`. End-to-end tests are not set up yet; Maestro is planned.

`tsconfig.json` sets `"types": ["jest"]` because TypeScript 6 no longer auto-includes `@types/*`. If you add another global types package, add it to that list too.

`npm run ios` and `npm run android` use `expo run:*`, which does a native prebuild into `ios/` and `android/`, not Expo Go. After changing `app.json` plugins or adding native modules (e.g. `expo-camera`, `expo-image-picker`), rebuild the native app instead of only reloading Metro.

## Architecture

- **Entry**: `index.ts` → `App.tsx` → `src/navigation/RootNavigator.tsx`. There is no Expo Router; navigation is plain React Navigation v7 (native-stack plus bottom-tabs).
- **Auth gating**: `RootNavigator` subscribes to Firebase `onAuthStateChanged` through `services/auth.ts` and writes the result to the Zustand store (`store/authStore.ts`). The stack renders either the auth screens (SignIn/SignUp) or the `Main` tab navigator depending on `isAuthenticated`. It renders `null` while `isLoading`. Screens navigate between the auth and main flows only by changing auth state, never by calling `navigate`.
- **User model**: Firebase Auth creates the account, and the app profile is a Firestore document at `users/{uid}`, which `signUp` writes. `subscribeToAuthChanges` and `signIn` return that Firestore doc rather than the Firebase `User`. A signed-in user with no `users/{uid}` doc is therefore treated as signed out.
- **Data layer (Supabase)**: `src/data/` holds the Supabase client (`client.ts`), config and, as the migration proceeds, one module per domain. It must not import `react-native` or Expo modules so a future web app can reuse it; native-only wiring (the `expo-sqlite/localStorage/install` session-storage polyfill, `AppState` token refresh) belongs outside it. Screens and stores call `src/data/*`, never `supabase` directly. In Jest, stub `globalThis.WebSocket` before importing the client (Node 20 has none).
- **Layers**: `src/config/firebase.ts` exports the `auth`, `db` and `storage` singletons. `src/services/` holds the Firebase calls. `src/store/` holds the Zustand stores. `src/screens/{auth,main}/` holds the UI. `src/types/` holds the shared domain types (`User`, `Collection`, `Item`, where `Item.fields` is a free-form per-category attribute map).
- **Styling**: each screen defines its own `StyleSheet.create`. There is no shared theme or design system yet. `app.json` sets `userInterfaceStyle: "light"`.

## MVP scope

COLLECTed is a community for sharing collections. The app isn't built as a marketplace (no listings, prices, checkout or payments), but collectors are free to buy, sell or trade with each other on their own terms through their own communication. The MVP launches with two categories, books and music (records, CDs, cassettes), but the data model is category-generic because clothing, art, furniture and more will follow.

- Email sign up and sign in (signed-in only; no guest browsing)
- Add and delete books and music items in your collection, including multiple copies of the same item
- Photos on each item: 2 per item on the free plan (front and back), 10 on paid, enforced in the database
- Every collection is visible to every signed-in user
- Favorite other users
- Friend other users (send, accept, decline)
- Search across all users' collections
- Contact any signed-in user by email, only if they have opted in (`share_email`, off by default)
- Block and report users
- In-app account deletion

Chat is post-MVP. A web app is planned later.

## Current migration

We are moving the backend from Firebase to Supabase, mainly for Postgres full-text search. **The approved plan is [docs/supabase-migration-plan.md](docs/supabase-migration-plan.md)**. Follow its schema, RLS rules, step order and data-layer design. Do not add new Firebase code or dependencies. The Supabase URL and publishable key (the replacement for the anon key) go in `EXPO_PUBLIC_*` env vars. The secret key (formerly the service-role key) must never appear in app code; only server-side Edge Functions use it.

## Definition of done

- Type check passes (`npm run typecheck`)
- Tests pass (`npm test`)
- Lint passes (`npm run lint`)
- No secrets committed

## Working rules

- For anything touching the database schema, auth or RLS, write a plan and wait for approval before editing files.
- Keep changes small and focused on one task.
