# 60-Day Discipline Challenge — v2 Build Brief
### Thiwanka vs Ridmi · 15 Jun 2026 → 13 Aug 2026

> Paste this whole document into Antigravity as the project spec. It is a fresh build — do **not** edit the previous 30-day app.

---

## 1. What we're building
A mobile-first web app for a 60-day head-to-head discipline challenge between two people: **Thiwanka** and **Ridmi**. Every day both players mark off their habits. The app scores each day, tracks streaks, and compares the two players side by side. The challenge runs from **15 June 2026** to **13 August 2026** (60 days inclusive). Players mark within the day; past days lock.

## 2. Tech stack
- **Frontend:** React + Vite, **mobile-first** (designed for a phone held one-handed; desktop is secondary)
- **Backend / DB / Auth / Realtime:** Supabase
- **Hosting:** Netlify
- **PWA:** installable to home screen + an evening reminder notification

## 3. Theme — "Aurora Night"
Dark night-sky base with aurora ribbons and a mountain silhouette along the bottom edge of each screen. Subtle, premium, calm — not busy.

- **Background:** deep navy gradient `#0B1026 → #1A1442`, faint star specks
- **Aurora accents (gradients):** emerald `#34D399`, teal `#22D3EE`, violet `#A78BFA`, magenta `#E879F9`
- **Mountain silhouette:** a darker layer `#070A1C` at the bottom of the viewport
- **Text:** off-white `#E6E9F5`; muted `#8A92B2`
- **Typography:** Inter for everything; headers slightly wider letter-spacing for an "ethereal" feel
- **Heatmap state colours:** Perfect `#34D399` · Good `#22D3EE` · Okay `#F5C453` · Bad `#FB7185` · Future = faint dot on navy

## 4. Users & auth
Two fixed accounts via Supabase email/password (magic link also fine). Each player sees **both** players' data, but can only mark **their own** habits.

## 5. Data model (Supabase)
```sql
-- profiles
create table profiles (
  id uuid primary key references auth.users(id),
  display_name text not null,
  avatar_color text default '#A78BFA',
  freeze_tokens int default 2
);

-- challenges (habits)
create table challenges (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  tier int not null default 1,           -- 1 or 2
  points int not null default 10,
  penalty int not null default 10,        -- subtracted if missed
  scope text not null default 'shared',   -- 'shared' | 'personal'
  owner_id uuid references profiles(id),  -- null for shared
  active boolean default true,
  sort_order int default 0
);

-- daily logs
create table daily_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id),
  challenge_id uuid references challenges(id),
  log_date date not null,
  completed boolean default true,
  unique (user_id, challenge_id, log_date)
);

-- single config row
create table challenge_config (
  id int primary key default 1,
  start_date date default '2026-06-15',
  total_days int default 60,
  stakes_text text
);
```
Enable Row Level Security; allow each authenticated user to read all rows but insert/update `daily_logs` only where `user_id = auth.uid()`.

## 6. Scoring
- **Day raw score** (per player) = Σ points of completed habits − Σ penalty of missed habits (only habits that apply to that player: all shared + their own personal).
- **Day completion %** = completed ÷ applicable habits that day.
- **Headline metric is completion %.** Show points/score as secondary. (This fixes the old all-red, deep-negative problem.)
- **Heatmap colour by completion %:** 100% Perfect · 75–99% Good · 50–74% Okay · <50% Bad · no data + past = Bad · future = faint.

## 7. Streaks + freeze tokens
- A day **counts toward streak** if completion % ≥ **80%**.
- Each player starts with **2 freeze tokens**. A freeze auto-applies to protect the streak when a day would otherwise break it (decrement token, mark day as "frozen"). Show tokens remaining on Progress + Versus.

## 8. Screens (bottom nav: Today · Progress · Versus · Challenges)

### Today
- Header: **Day X of 60**, date, countdown to 13 Aug.
- A **daily progress ring** + "Today: 64% · 45 pts" updating live as boxes are ticked.
- Habit list grouped **Shared first, then Personal**; each row = checkbox, name, description, tier + points badge.
- **Marking allowed only for the current day** (locked after local midnight; past days read-only).
- Ticking writes to Supabase and pushes via realtime so the partner sees it.

### Progress
- Two **60-day heatmaps** (10 × 6 grid) side by side, coloured by completion %.
- Per-player stats: Perfect Days · Avg Completion % · Best Day · Current Streak · Freeze tokens left.
- **Habits Needing Focus:** lowest-completion habits with a % bar.

### Versus
- **Day X of 60** + a **stakes banner** (what's on the line — editable text).
- Each player: current streak (🔥) + total perfect days.
- **Overall leader headline** — who's ahead (by total points or perfect days).
- **Head-to-head bars for shared habits only** (you vs Ridmi count per habit).
- **Nudge button** — tap to ping the partner ("catch up" when ahead).

### Challenges (Manage)
- Add / edit / remove habits.
- Fields: name, description, tier priority, points, penalty, **scope (shared / personal)**, owner.
- Active list with tier + points badges.

### Weekly Recap (new — surfaces every 7 days)
- Each player's week %, **MVP habit**, **most-skipped habit**, and **who won the week**.

### Finish Summary (new — day 60+)
- Final results, overall winner, key stats, and a **download/export** (CSV or shareable image).

## 9. Other requirements
- Realtime sync via Supabase subscriptions on `daily_logs`.
- Day boundary = each user's **local midnight**; store `log_date` as a date.
- PWA: manifest + service worker; **evening reminder** (~8pm) if not all habits are marked.
- Day-1 / empty state should feel encouraging, not all-red.

## 10. Seed habits (final — all shared, both players do the same list)
Seed these 10 as `scope = 'shared'` (owner_id null). Penalty = points (Tier-1 missed = −10, Tier-2 missed = −5). **Max = 85 points/day.**

| # | Habit | Tier | Points | Penalty | Scope |
|---|---|---|---|---|---|
| 1 | Workout routine | 1 | 10 | −10 | Shared |
| 2 | No sugary foods | 1 | 10 | −10 | Shared |
| 3 | No alcohol | 1 | 10 | −10 | Shared |
| 4 | Strict diet plan | 1 | 10 | −10 | Shared |
| 5 | 30 min skill improving | 1 | 10 | −10 | Shared |
| 6 | Skincare / Haircare routine | 1 | 10 | −10 | Shared |
| 7 | 3L water | 1 | 10 | −10 | Shared |
| 8 | Reading / Meditating | 2 | 5 | −5 | Shared |
| 9 | Planning the next day (15 min) | 2 | 5 | −5 | Shared |
| 10 | Face yoga (10 min) | 2 | 5 | −5 | Shared |

## 11. Build order
1. **Supabase** — create project → run the SQL in §5 → enable email auth → create the two user accounts → seed `challenges` + one `challenge_config` row (start_date 2026-06-15).
2. **Antigravity** — paste this brief → let it scaffold the React app → add your Supabase URL + anon key.
3. **Test locally** — log in as both users, mark habits, confirm realtime updates and day-lock.
4. **Netlify** — deploy → add env vars (Supabase URL + anon key) → confirm PWA installs on your phone.
