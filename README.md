# Menu Starter (Next.js + TypeScript + Tailwind + Supabase)

```bash
npm install
npm run dev     # http://localhost:3000
```

## Supabase setup

1. Create a Supabase project and copy its project URL and anon/public key into
   `.env.local`:

   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   ```

2. Run [`supabase/schema.sql`](./supabase/schema.sql) and then
   [`supabase/seed.sql`](./supabase/seed.sql) in the Supabase SQL Editor.
   The schema enables public read-only access for the menu tables; review
   inserts and updates remain restricted to signed-in Google users. Restaurant
   analytics accepts anonymous event inserts but does not permit public reads.
3. In Supabase Authentication, enable Google and add
   `http://localhost:3000/auth/callback` (and your deployed site's
   `/auth/callback` URL) to the allowed redirect URLs.
4. For an existing project, run
   [`supabase/update_restaurant_locations.sql`](./supabase/update_restaurant_locations.sql)
   in the SQL Editor to update the restaurant locations, contact details, and
   Google Maps links. If `google_maps_url` does not exist yet, run
   `supabase/schema.sql` first.

5. For an existing project, rerun `supabase/schema.sql` to create the reviews
   table and its row-level security policies. This also adds the optional
   Google profile name and avatar fields to existing review tables.
   To update profile details on existing reviews in an already-configured
   project, run [`supabase/update_review_profiles.sql`](./supabase/update_review_profiles.sql)
   in the Supabase SQL Editor. It also keeps review profiles in sync when
   Supabase updates a user's Google profile metadata.
6. To enable the English interface and restaurant/menu content, run
   [`supabase/update_english_content.sql`](./supabase/update_english_content.sql)
   in the Supabase SQL Editor after `schema.sql` and `seed.sql`. It adds English
   fields and populates translations for the restaurants and menu items included
   with this starter. For new content, fill the matching `*_en` fields in
   Supabase; the English UI falls back to Arabic when a translation is missing.
   - `/` loads restaurants and menus from Supabase and offers Arabic-normalized search.
   - `/<slug>` loads that restaurant's categories and available menu items.
   - The language switch remembers the visitor's choice. Interface labels and
     translated restaurant/menu fields switch to English; review comments remain
     in their original Arabic text.
   - Restaurant cards display a live average rating and review count. The full
     review list and rating form appear on the restaurant details page; Google
     sign-in is requested only when a visitor chooses to add a review.
   - Selecting a reviewer's name or photo opens `/customer/<user-id>`, a public
     profile with their review history, dates, rating average, and 15 points per review.
   - `lib/supabase/client.ts` and `lib/supabase/server.ts` provide typed clients.
   - `types/supabase.ts` contains the database types. `lib/data.ts` remains as the
     UI-facing shape used by the menu components.
   - To enable nearby sorting, set each restaurant's `latitude` and `longitude`
     columns to its actual map coordinates in Supabase. The browser only shares
     the visitor's location after they choose **اعرض الأقرب إليّ**; distances are
     calculated locally and restaurants without coordinates appear last.
     For an existing project, run `supabase/schema.sql` again to add the columns
     before entering the coordinates.
7. For an existing project, run
   [`supabase/restaurant_analytics.sql`](./supabase/restaurant_analytics.sql)
   in the SQL Editor to enable page-view, call, WhatsApp, and share event
   tracking. The public role can insert only the supported event types and
   cannot read or modify recorded analytics.
8. To configure the protected restaurant editor at `/admin/add-restaurant`,
   run the current `supabase/schema.sql` to add restaurant contact, cuisine,
   price, working-hours, and menu-tag fields. Add these server-only variables
   to `.env.local` (never use a `NEXT_PUBLIC_` prefix for either secret):

   ```env
   ADMIN_PASSWORD="choose-a-strong-admin-password"
   ADMIN_SESSION_SECRET="at-least-32-random-characters"
   SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
   ```

   The password is exchanged for a signed, HTTP-only admin cookie. The service
   role key is used only by the protected server API to publish restaurant
   data; it is never sent to the browser. Do not expose or commit these values.
