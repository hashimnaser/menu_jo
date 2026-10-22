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
   The schema enables public read-only access for the menu tables; inserts and
   updates remain restricted to trusted server-side credentials.

- `/` loads restaurants and menus from Supabase and offers Arabic-normalized search.
- `/r/<slug>` loads that restaurant's categories and available menu items.
- `lib/supabase/client.ts` and `lib/supabase/server.ts` provide typed clients.
- `types/supabase.ts` contains the database types. `lib/data.ts` remains as the
  UI-facing shape used by the menu components.
