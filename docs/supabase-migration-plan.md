# Supabase migration plan

Status: approved 2026-09-23. This plan supersedes earlier drafts. Each step below ships as its own PR. Any step that touches the schema, auth or RLS still gets a review before its files are edited, per the working rules in `CLAUDE.md`.

## Goals and constraints

- Move the backend from Firebase to Supabase, mainly for Postgres full-text search.
- COLLECTed is a community for sharing collections, not a marketplace. There are no listings, prices, trades or sales.
- The MVP ships **books only**, but the schema is category-generic. Vinyl, trading cards, antiques, art and more will follow, and adding a category is a data change, not a new table.
- **Signed-in only.** There is no guest browsing. All read access uses the `authenticated` role, never `anon`.
- **A web app is planned later.** No choice in this plan should only work on mobile (see "Designing for web").
- There are no real users yet, so we **start fresh** on Supabase Auth. No Firebase users are migrated.

## Environments

| | Dev project | Prod project |
|---|---|---|
| Purpose | Day-to-day development, migration testing | Real users |
| Email confirmation | **Off** | **On**, with the link back into the app |
| App config | `.env.local` (git-ignored) | Build-time env vars (EAS) when we ship |

- The app reads `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. The publishable key replaces the legacy anon key and is safe to ship.
- The secret key (formerly the service-role key) never appears in app code. It is used only by server-side Edge Functions, such as account deletion.
- Docker isn't installed, so migrations are tested against the dev project with `supabase db push`, not a local stack. If Docker is added later, `supabase start` and `supabase db reset` work the same way.

## Schema

All tables live in `public` with RLS enabled. Primary keys are `uuid`, and every table has `created_at timestamptz not null default now()`. Helper functions that must not be callable through the API live in a `private` schema, which the API doesn't expose.

### Accounts

**`profiles`**: one row per Supabase Auth user.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | FK → `auth.users(id)` on delete cascade |
| `username` | citext unique not null | 3–30 chars, `[a-z0-9_]` |
| `display_name` | text | |
| `avatar_url` | text | |

A trigger on `auth.users` insert creates the `profiles`, `profile_contacts` and `subscriptions` rows. It takes `username` and `display_name` from the sign-up metadata. A taken username fails sign-up with a clear error.

**`profile_contacts`**: the email used for "contact by email".

| Column | Type | Notes |
|---|---|---|
| `user_id` | uuid PK | FK → `profiles(id)` cascade |
| `email` | text not null | Copied from `auth.users`, and kept in sync by a trigger when the auth email changes |
| `share_email` | boolean not null default false | **Opt-in.** The contact button only shows when this is true. |

This is a separate table because RLS works on rows, not columns. That keeps `profiles` broadly readable while email stays restricted.

**`plans`**: subscription tiers.

| Column | Type | Notes |
|---|---|---|
| `slug` | text PK | `free`, `paid` |
| `name` | text | |
| `max_photos_per_item` | smallint not null | free = **2** (front and back), paid = **10** |

**`subscriptions`**

| Column | Type | Notes |
|---|---|---|
| `user_id` | uuid PK | FK → `profiles(id)` cascade |
| `plan` | text not null default 'free' | FK → `plans(slug)` |
| `status` | text not null default 'active' | |
| `current_period_end` | timestamptz | null for free |

Only the server writes here (later, the payment provider's webhook via an Edge Function). `private.current_plan(user_id)` returns `free` unless the user has an active, unexpired paid row.

### Collections

**`categories`**

| Column | Type | Notes |
|---|---|---|
| `slug` | text PK | seeded: `books` (active), `vinyl`, `trading_cards`, `antiques`, `art` (inactive) |
| `name` | text | |
| `uses_catalog` | boolean | true for mass-produced items (books, vinyl, cards); false for one-of-a-kind items (antiques, art) |
| `is_active` | boolean | MVP: only `books` |

**`catalog_entries`**: shared, community-built catalog of mass-produced items.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `category` | text not null | FK → `categories(slug)` |
| `title` | text not null | |
| `creators` | text[] not null default '{}' | Authors, artists, manufacturers |
| `year` | smallint | |
| `image_url` | text | Stock or cover image |
| `attributes` | jsonb not null default '{}' | Per-category details, e.g. publisher and format for books |
| `created_by` | uuid | FK → `profiles(id)` on delete **set null**. The catalog is shared, so it outlives its contributor. |
| `search_vector` | tsvector | Maintained by a trigger. Used for the "is this already in the catalog?" lookup when adding an item. |

**`catalog_identifiers`**

| Column | Type | Notes |
|---|---|---|
| `entry_id` | uuid | FK → `catalog_entries(id)` cascade |
| `scheme` | text | `isbn_13`, `isbn_10`, later `upc`, `discogs_release`, … |
| `value` | text | |

Primary key is `(scheme, value)`, so each identifier maps to one entry. There's also an index on `entry_id`.

**`collections`**

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `owner_id` | uuid not null | FK → `profiles(id)` cascade |
| `category` | text not null | FK → `categories(slug)` |
| `name` | text not null | |

- Unique on `(owner_id, name)` and on `(id, owner_id)`, so items can reference both.
- For the MVP, the app creates one "Books" collection per user the first time they add a book.
- There is no visibility column in the MVP; see "Future: visibility and share links".

**`collection_items`**: owned copies.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `collection_id` | uuid not null | |
| `owner_id` | uuid not null | FK `(collection_id, owner_id)` → `collections(id, owner_id)` cascade, so the owner always matches the collection |
| `catalog_entry_id` | uuid | FK → `catalog_entries(id)` restrict. Null for one-of-a-kind items. |
| `title`, `creators`, `year` | | For one-of-a-kind items. A check requires a catalog entry or a title. |
| `condition` | text | |
| `notes` | text | |
| `attributes` | jsonb not null default '{}' | Copy-specific details, e.g. a card's grade or an artwork's medium |
| `search_vector` | tsvector | See "Search" |

- **Multiple copies of the same catalog entry are allowed.** There is no uniqueness constraint.
- Indexes: `(owner_id, created_at desc)`, `catalog_entry_id`, `collection_id`, and GIN on `search_vector`.
- Per-category attribute shapes are validated in the app with a TypeScript type per category, not in the database.

**`item_photos`**

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `item_id` | uuid not null | FK → `collection_items(id)` cascade |
| `owner_id` | uuid not null | FK → `profiles(id)` cascade |
| `position` | smallint not null | 0 = front/cover, 1 = back, … |
| `storage_path` | text unique not null | `{owner_id}/{item_id}/{id}.jpg` |
| `thumb_path` | text unique not null | `{owner_id}/{item_id}/{id}_thumb.jpg` |
| `width`, `height` | smallint | Lets the UI lay out images before they load |

Unique on `(item_id, position)`. Index on `item_id`.

### Social

**`favorites`**: `(user_id, favorite_user_id)` primary key, both FK → `profiles(id)` cascade. A check forbids favoriting yourself. Index on `favorite_user_id`.

**`friendships`**

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `requester_id` | uuid not null | FK → `profiles(id)` cascade |
| `addressee_id` | uuid not null | FK → `profiles(id)` cascade |
| `status` | enum `friendship_status` (`pending`, `accepted`) | default `pending` |
| `responded_at` | timestamptz | |

- A check forbids friending yourself.
- A unique index on `(least(requester_id, addressee_id), greatest(...))` allows one row per pair, whoever sent it.
- Index on `addressee_id`.
- Declining deletes the row.

**Friendships and favorites don't control access to anything.** They are relationships to display, not permissions.

### Safety

**`blocks`**: `(blocker_id, blocked_id)` primary key, both FK → `profiles(id)` cascade. A check forbids blocking yourself.

- An insert trigger (security definer) deletes any friendship and favorites between the two users, in both directions.
- `private.is_blocked_with(other uuid) returns boolean` is true if either user has blocked the other. It uses `auth.uid()` internally and takes only the other user's ID, so it can't be used to probe blocks between third parties. It's security definer so it can check blocks the caller can't read directly. It lives in `private` so it can't be called through the API.

**`reports`**

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `reporter_id` | uuid not null | FK → `profiles(id)` cascade (reports a user made are deleted with their account) |
| `reported_user_id` | uuid | FK → `profiles(id)` set null (the report survives the reported user's deletion) |
| `target_type` | text | `profile`, `collection_item`, `item_photo` (later `message`) |
| `target_id` | uuid | |
| `reason` | text not null | fixed list in the app: spam, harassment, inappropriate content, other |
| `details` | text | |
| `status` | text not null default 'open' | For your moderation workflow |

Reports are readable only by you, through the Supabase dashboard or SQL. No user can read reports, including their own.

## RLS policies

Rules common to every table:
- RLS is on for every table.
- All policies are granted to the `authenticated` role only.
- Every migration also runs `revoke all on <table> from anon`, since Supabase grants `anon` table privileges by default. RLS alone would already block anon, but this is a second layer of protection.
- Policies use `(select auth.uid())` so Postgres evaluates it once per query instead of once per row.

"Not blocked" below means `not private.is_blocked_with(<other user>)`.

| Table | Read | Insert | Update | Delete |
|---|---|---|---|---|
| `profiles` | Signed-in users, if not blocked. Exception: you can still see profiles you have blocked, so the unblock list works. | Trigger only | Own row | Via account deletion only |
| `profile_contacts` | Own row always; others' rows only where `share_email` is true and not blocked | Trigger only | Own row, and only `share_email` | Cascades |
| `plans` | Signed-in users | None | None | None |
| `subscriptions` | Own row | Trigger or server only | Server only | Cascades |
| `categories` | Signed-in users | None | None | None |
| `catalog_entries` | Signed-in users | Signed-in users, with `created_by` = self | None from the app | None from the app |
| `catalog_identifiers` | Signed-in users | Signed-in users, for entries they created | None | None |
| `collections` | Signed-in users, if the owner isn't blocked (see visibility below) | Own, with `owner_id` = self | Own | Own |
| `collection_items` | Readable if the parent collection is readable | Own, into own collections | Own | Own |
| `item_photos` | Readable if the parent item is readable | Own, into own items, within the plan limit | Own (reorder) | Own |
| `favorites` | Own rows | Own, if not blocked | None | Own |
| `friendships` | Rows where you're requester or addressee | As requester, `pending`, not blocked | Addressee only, `pending` → `accepted` | Either party |
| `blocks` | Own rows as blocker (you can't see who blocked you) | As blocker | None | Own (unblock) |
| `reports` | **Nobody** | As reporter | None | Cascades with reporter |

For `friendships`, column privileges let the app update only `status` and `responded_at`.

## Photos

**Limits:** free = 2 per item (front and back), paid = 10. The limit comes from `plans`, so changing a tier is a data change.

**Database enforcement:** a `before insert` trigger on `item_photos` does the following:
1. Locks the parent `collection_items` row with `select … for update`. Two uploads running at the same moment can't both slip under the limit.
2. Counts the item's existing photos.
3. Raises an error if the count would exceed `max_photos_per_item` for `private.current_plan(owner_id)`.

**Upload flow:**
1. The app creates the `item_photos` row. This reserves a slot, and the trigger enforces the limit here.
2. The app uploads the full image to `storage_path` and the thumbnail to `thumb_path`.
3. If an upload fails, the app deletes the row. A periodic cleanup of rows whose files are missing can come later.

**Processing in the app, before upload:**
- Resize to about **1500px on the longest side** and compress to JPEG (around 0.8 quality).
- Generate a ~400px thumbnail.
- **Strip EXIF** (including GPS location) by re-encoding the image. Step 4 must verify that the chosen Expo image module actually drops EXIF on iOS and Android, and must include a test for it.

**Storage bucket `item-photos` (private):** its policies on `storage.objects` match the table rules.
- **View:** signed-in users, if not blocked with the owner. The owner is identified by the first folder in the path.
- **Upload:** only into your own `{user_id}/` folder, and only to a path that matches an `item_photos` row you own. Uploading straight to storage therefore can't get around the photo limit.
- **Update:** none. Photos are replaced by deleting and re-adding them.
- **Delete:** only the owner, only in their own folder.

**URLs:** the database stores storage *paths*, never URLs.
- The data layer turns paths into short-lived signed URLs in batches with `createSignedUrls`.
- The image cache is keyed by storage path, not by the signed URL, so a refreshed URL doesn't re-download the image.
- This works the same on native and web.

## Search

`search_collections(q text, category text default null, lim int default 20, off int default 0)`

- It is a `language sql stable` function, **`security invoker`**, with `set search_path = ''` and fully qualified table names.
- Execute permission is revoked from `public` and `anon` and granted only to `authenticated`.

**What it searches:**
- `collection_items.search_vector`, maintained by a trigger. For a catalog item it combines the catalog entry's title (weight A), creators (B) and attributes such as publisher (C). For a one-of-a-kind item it uses the item's own title and creators. It also includes the item's notes (D).
- Title uses the `english` text config, so "collecting" matches "collector". Names and identifiers use `simple`, so they aren't stemmed.
- The query supports prefix matching, so search-as-you-type works: the last typed word gets `:*`.

**Results** are ordered by `ts_rank`. Items that share a catalog entry are grouped, with an owner count and the first few owners.

**How it guarantees signed-out and blocked users see nothing they shouldn't:**

1. **Security invoker, not definer.** The function runs with the caller's own permissions, so every table it reads applies that caller's RLS policies. A security definer function would bypass RLS and have to re-implement every access rule by hand, and any drift between the two would leak data. Invoker makes that impossible, because the same policies protect direct reads and search.
2. **Signed-out users can't call it at all.** Execute isn't granted to `anon`. Even if it were, `anon` has no table privileges and no RLS policies, so it would read zero rows.
3. **Blocked users' content never reaches the function.** The read policies on `collections`, `collection_items`, `item_photos` and `profiles` exclude rows where `private.is_blocked_with(owner)` is true. Search reads through those policies, so blocked content is filtered before ranking, in both directions.
4. **Tests prove it.** pgTAP tests in `supabase/tests/` run the search as a signed-out user (expect a permission error) and as a blocked user (expect zero results).

**Indexes:** GIN on `collection_items.search_vector` and on `catalog_entries.search_vector`. Trigram fuzzy matching (`pg_trgm`) and username search can come later.

## Account deletion

Apple requires in-app account deletion. It needs admin rights over `auth.users`, so it runs in a **Supabase Edge Function, `delete-account`**, which holds the secret key server-side. The function:

1. Verifies the caller's session from the `Authorization` header and acts only on that user.
2. Deletes all Storage objects under `item-photos/{user_id}/`. Storage files aren't removed by database cascades.
3. Deletes the auth user with `auth.admin.deleteUser`. The foreign-key cascades then remove the profile, contact, subscription, collections, items, photo rows, friendships, favorites, blocks, and reports the user made.
4. Leaves behind only catalog entries they contributed (with `created_by` set to null) and reports others made about them (with `reported_user_id` set to null).

The app offers this in settings behind a confirmation, then signs out locally.

## Auth

- **Sign-up:** `supabase.auth.signUp({ email, password, options: { data: { username, display_name }, emailRedirectTo } })`.
- **Sign-in:** `signInWithPassword`.
- **Auth state:** `onAuthStateChange`, plus an initial `getSession`, feeds `authStore`.
- **Email confirmation** (prod only):
  - The confirmation email links back into the app. Native uses the app scheme (`collected://auth/confirm`, which adds `scheme` to `app.json`); web will use an https URL on the web domain. Both go on the prod project's redirect allow-list.
  - The link carries a `token_hash` that the app passes to `supabase.auth.verifyOtp`. This works whichever device or browser opens the link, unlike PKCE, which needs the original device.
  - Step 2 must confirm this against the current Supabase docs before building it.
- **Session storage:**
  - The app entry point (`index.ts`) imports `expo-sqlite/localStorage/install`. That gives native a `localStorage`, and it does nothing on web, which has its own. The client then uses `globalThis.localStorage` on both.
  - Auto-refresh follows `AppState` on native only.

## Designing for web

- **One shared data layer, in `src/data/`:**
  - It holds the Supabase client, config, per-domain modules (`auth`, `collections`, `photos`, `search`, `social`, `safety`, `account`) and generated database types.
  - **It has no `react-native` or Expo imports.** A web client can import it unchanged.
  - Screens and Zustand stores call it and never call `supabase` directly.
  - Native-only wiring (the localStorage polyfill, `AppState` refresh, image picking and resizing) lives outside `src/data/`.
- **No mobile-only choices:**
  - Auth confirmation uses `token_hash` links that work in any browser or app.
  - Photos use storage paths and signed URLs, not device file URIs.
  - Search is a plain Postgres function reachable over HTTP.
- **Future visibility and share links:**
  - Every read policy for collections, items and photos goes through one function, `private.can_view_collection(collection_id)`. Today it returns true for signed-in users unless the owner is blocked.
  - Adding visibility later means adding a column (for example `visibility text not null default 'members'`, plus an optional `share_token`) and updating that one function. No policy or table has to be rewritten.
  - A public share page on web would read through a narrow security-definer function that checks the share token and returns only that collection. The `anon` role still gets no table access.

## App changes

| Area | Change |
|---|---|
| `src/config/firebase.ts`, `src/services/auth.ts` | Replaced by `src/data/client.ts`, `src/data/config.ts` and `src/data/auth.ts`. Deleted in the final step. |
| `src/types/` | `User` becomes the profile type (`uid` → `id`, adds `username`). `Collection` and `Item` are replaced by types generated from the schema (`src/data/database.types.ts`) plus per-category attribute types. |
| `src/store/authStore.ts` | Same shape; holds the session and profile. |
| `src/navigation/RootNavigator.tsx` | Auth gating unchanged. New tabs arrive as features land: Collection, Search, People, Settings. |
| Screens | SignUp gets a username field. New: collection, add or edit book with photos, search, profile (favorite, friend, contact, block, report), friend requests, settings (share email, blocked users, delete account). |
| Tests | Data-layer modules are tested with a mocked Supabase client. Screens are tested by mocking `src/data/*`, the same way `__tests__/home-screen-test.tsx` does. |

## Migration order

Each step is one PR and must pass typecheck, tests and lint.

1. **Tooling.** Supabase CLI as a dev dependency, `supabase init`, and the client and config in `src/data/`. Add `.env.example` and document the commands in `CLAUDE.md`. No schema changes, and nothing in the app uses the client yet.
2. **Profiles and auth.** Migration: `profiles`, `profile_contacts`, `plans`, `subscriptions`, the sign-up trigger, and their RLS. Switch sign-up and sign-in to Supabase; add the username field, the app scheme, and the confirmation link handling.
3. **Catalog and collections.** Migration: `categories` (seeded), `catalog_entries`, `catalog_identifiers`, `collections`, `collection_items`, `private.can_view_collection`, and their RLS. UI to add and delete books.
4. **Photos.** Migration: `item_photos`, the limit trigger, the bucket and storage policies. Photo picking, resizing, EXIF stripping and upload.
5. **Search.** Search-vector triggers, GIN indexes, `search_collections`, pgTAP tests, and the search screen.
6. **Social.** `favorites`, `friendships`, their RLS and the UI.
7. **Safety.** `blocks`, `reports`, `private.is_blocked_with` (and adding the block check to earlier policies), their RLS, pgTAP tests and the UI.
8. **Contact.** The `share_email` setting and the email button on profiles.
9. **Account deletion.** The `delete-account` Edge Function and the settings UI.
10. **Remove Firebase.** Delete the Firebase code and dependency, update `CLAUDE.md`, and delete the Firebase project, which also retires the config in git history.

**Blocking and App Store review:** blocking (step 7) is required before the first App Store submission. Apple's rules for apps with user content require reporting, blocking and timely moderation, and Google's are similar. It sits after search and social only so it can build on those tables.

Post-MVP: chat. It will use `conversations`, `conversation_members` and `messages`, delivered through Supabase Realtime. The same rules as the MVP apply: any two signed-in users who haven't blocked each other can message; members only can read; there's no anon access.

## Managing schema changes

- Every change is a migration file in `supabase/migrations/`, created with `npx supabase migration new <name>` and committed with the code that uses it.
- **Order:** push to dev (`npx supabase link --project-ref <dev>` then `npx supabase db push`), test, merge, then push to prod.
- **No schema edits in the dashboard.** If one happens, capture it with `npx supabase db diff` into a migration.
- After each migration, regenerate `src/data/database.types.ts` with `npx supabase gen types typescript --linked`.
- RLS and search access tests use pgTAP in `supabase/tests/`, run with `npx supabase test db` against the linked dev project.
- Dev seed data goes in `supabase/seed.sql`, never in migrations.

## Open questions

- **Payment provider** for paid plans (App Store and Play in-app purchases, likely through RevenueCat). This doesn't affect the schema; `subscriptions` is written server-side either way.
- **Moderation response time:** Apple expects timely action on reports. Decide how you'll be notified of new reports, for example with a database webhook to email.
- **Username rules:** can usernames be changed after sign-up?

## Risks

- **RLS mistakes fail silently.** A missing policy shows up as an empty list, not an error. pgTAP tests on the access rules are the safeguard.
- **Shared catalog quality.** Without ISBNs, duplicates like "The Hobbit" and "Hobbit, The" will build up. ISBN lookup or scanning (the app already has `expo-camera`) would mostly fix this later.
- **Scraping by signed-in users.** Every collection is visible to any account. Rate limiting and account-level abuse handling may be needed as the app grows.
- **Free tier pauses** inactive dev projects after about a week.
- **Session storage** in expo-sqlite localStorage isn't encrypted at rest. This is Expo's recommended approach. Moving to SecureStore-backed encryption is possible later without schema changes.
