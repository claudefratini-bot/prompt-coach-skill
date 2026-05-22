# ⚔️ Habit Arena

A competitive habit tracker for you and your friends. Add habits, snap a photo to mark them done, stack XP, level up, and challenge friends 1v1 with XP on the line.

Built with **Next.js 14 (App Router)** + **Supabase** (Auth, Postgres, Storage). Self-hostable. Distributable. Free tier friendly.

## What's inside

- 📸 **Photo proof** — every completion uploads a snap that lands in your feed
- ⚡ **XP & levels** — Easy / Medium / Hard habits award 5 / 12 / 25 XP plus streak bonuses
- 🏆 **Friends leaderboard** — weekly & all-time rankings, just you and your crew
- ⚔️ **1v1 battles** — pick a friend, stake XP, whoever logs more wins takes the pot
- 🎯 **Goals** — longer-term targets with bigger XP payouts
- 🔥 **Streaks** — daily streaks with milestone bonuses (+3 / +10 / +30 / +100 XP at 3 / 7 / 30 / 100 days)
- 👥 **Reactions** — fire-emoji your friends' completions

## Quick start

### 1. Create a Supabase project

Go to [supabase.com](https://supabase.com), create a free project, then grab from **Project Settings → API**:
- `Project URL`
- `anon` public key

### 2. Run the schema

Open the SQL editor in your Supabase project, paste the entire contents of `supabase/schema.sql`, and run it. This creates all tables, RLS policies, the XP helper functions, and a public `habit-photos` storage bucket.

### 3. Configure auth

In **Authentication → URL Configuration**, add your local + deployed URLs to the allow-list:
- `http://localhost:3000`
- `https://your-deploy.vercel.app`

Email magic-link auth is enabled by default — no extra config needed.

### 4. Run locally

```bash
cp .env.example .env.local
# fill in your NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### 5. Deploy

Push to GitHub, import into [Vercel](https://vercel.com), set the same two env vars, ship it. Send the URL to your friends.

## How XP works

- **Levels**: cumulative XP for level L = `50 × L × (L − 1)`
  - L2 = 100, L3 = 300, L5 = 1000, L10 = 4500
- **Titles**: Spark → Apprentice → Disciplined → Sharpened → Relentless → Beast → Unstoppable → Mythic → Legend → God-Tier
- **Streak bonuses** added on top of base XP at 3 / 7 / 30 / 100 day streaks

## How battles work

1. Open ⚔️ Battles → New, pick a friend, a habit title, duration (1–60 days), and an XP stake.
2. Opponent accepts → battle goes live, dates lock.
3. During the window, every habit completion counts as 1 point.
4. When time's up, hit **Settle battle**. Winner takes the stake, loser loses it.

## Stack

```
app/             Next.js App Router routes + server actions
components/      Client UI (HabitCard, CompleteModal, Reactions, BottomNav)
lib/             Supabase clients, types, XP & streak math, utils
supabase/        SQL schema, RLS policies, storage bucket setup
```

## Security notes

- All tables have **Row Level Security** policies. Users only see their own data + their friends' habit completions / goals.
- Photos are uploaded to a **public** Supabase Storage bucket under `{user_id}/...`. URLs are random UUID paths but technically anyone with a link can view — fine for a "friends only" feel; switch to signed URLs if you need stricter privacy.
- XP awards run through a `security definer` Postgres function (`award_xp`) so users can't grant themselves XP from the client.
