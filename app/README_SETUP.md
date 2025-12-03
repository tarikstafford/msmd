# 🐒 Monkey See, Monkey Do - Setup Instructions

## 1. Database Migration

Run this SQL in your Supabase SQL Editor to add user tracking to players:

```sql
-- See MIGRATION.sql file for complete migration
```

Or just run the `MIGRATION.sql` file in Supabase.

## 2. Environment Variables

Create a `.env` file in the `/app` directory:

```bash
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## 3. Install & Run

```bash
cd app
npm install
npm run dev
```

The app will be available at `http://localhost:5173`

## 4. Deploy to Vercel

### Option A: Vercel CLI

```bash
cd app
vercel
```

### Option B: Vercel Dashboard

1. Import the `/app` directory as a new project
2. Add environment variables in Vercel dashboard:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
3. Deploy!

## App Structure

```
app/
├── src/
│   ├── components/      # Layout, shared components
│   ├── context/         # Auth context
│   ├── hooks/           # Custom hooks (future)
│   ├── lib/             # Supabase client
│   ├── pages/           # Dashboard, TroopDetail, Profile, SignIn
│   ├── styles/          # Brand CSS
│   └── App.jsx          # Router setup
├── .env                 # Environment variables (create this!)
└── MIGRATION.sql        # Database migration
```

## Key Changes from Old App

### Old (Single Page):
- Manually add players for everyone
- Manage all players' data
- Single page with everything
- "Board" terminology

### New (Multi-Page React):
- Auto-create your player record per troop
- Log only YOUR data
- Dashboard → Troop Detail → Profile navigation
- "Troop" terminology (more fun!)
- Personal profile with aggregate stats

## Features

- **Dashboard**: See all your troops, create/join new ones
- **Troop Detail**: Log today's hang & meditation, see leaderboard
- **Profile**: Your personal stats across all troops
- **Auto Player Management**: When you join a troop, a player record is auto-created
- **Streak Tracking**: Current streak, best streak, active days
- **Leaderboard**: Ranked by streak first, then total hang time
