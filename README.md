# Hang & Breathe

A competitive habit tracker for daily hang and meditation practice. Build consistency, track streaks, and compete with friends!

## Features

- 🔐 **Google Authentication** - Secure sign-in with your Google account
- 📊 **Shared Leaderboards** - Compete with friends across devices
- 🔥 **Streak Tracking** - Current and best streaks for motivation
- 👥 **Multiple Boards** - Create different groups for different circles
- 💪 **Badges** - Earn badges for hang leader, meditation leader, and longest streak
- 📱 **Responsive Design** - Works on desktop and mobile
- ☁️ **Cloud Sync** - Data synced across all your devices

## Setup Instructions

### 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a free account
2. Click **"New Project"**
3. Fill in:
   - **Name**: `hang-and-breathe` (or your choice)
   - **Database Password**: (generate a strong password)
   - **Region**: Choose closest to you
4. Wait for the project to be created (~2 minutes)

### 2. Set Up the Database

1. In your Supabase dashboard, go to **SQL Editor**
2. Click **"New Query"**
3. Copy the entire contents of `supabase-schema.sql` from this repo
4. Paste into the SQL Editor and click **"Run"**
5. You should see "Success. No rows returned"

### 3. Enable Google Authentication

1. In Supabase dashboard, go to **Authentication** → **Providers**
2. Find **Google** in the list
3. Toggle it **ON**
4. You need to set up Google OAuth credentials:

#### Get Google OAuth Credentials:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Go to **APIs & Services** → **Credentials**
4. Click **"Create Credentials"** → **"OAuth client ID"**
5. If prompted, configure OAuth consent screen first:
   - User Type: **External**
   - App name: **Hang & Breathe**
   - User support email: Your email
   - Developer contact: Your email
   - Click **Save and Continue** through the scopes and test users
6. Back to **Create OAuth client ID**:
   - Application type: **Web application**
   - Name: **Hang & Breathe**
   - Authorized JavaScript origins: `https://your-project.supabase.co`
   - Authorized redirect URIs: `https://your-project.supabase.co/auth/v1/callback`
   - Click **Create**
7. Copy your **Client ID** and **Client Secret**

#### Add to Supabase:

1. Back in Supabase **Authentication** → **Providers** → **Google**
2. Paste your **Client ID** and **Client Secret**
3. Click **Save**

### 4. Get Supabase Credentials

1. In Supabase dashboard, go to **Project Settings** (gear icon) → **API**
2. Copy these two values:
   - **Project URL** (looks like: `https://xxxxx.supabase.co`)
   - **anon public** key (long string starting with `eyJ...`)

### 5. Configure the App

1. Open `config.js` in this project
2. Replace the placeholder values:

```javascript
const SUPABASE_CONFIG = {
    url: 'https://your-project.supabase.co',  // Your Project URL
    anonKey: 'eyJhbGc...'                      // Your anon public key
};
```

3. Save the file

### 6. Deploy to Vercel

You can deploy directly from GitHub:

1. Push your code to GitHub (if not already done)
2. Go to [vercel.com](https://vercel.com)
3. Click **"Add New Project"**
4. Import your GitHub repository
5. Click **Deploy**
6. Your app will be live in ~1 minute!

**Important:** After deploying, add your Vercel domain to Google OAuth:

1. Go back to Google Cloud Console → Credentials → Your OAuth Client ID
2. Add to **Authorized JavaScript origins**: `https://your-app.vercel.app`
3. Add to **Authorized redirect URIs**: `https://your-app.vercel.app`
4. Also add these to Supabase → **Authentication** → **URL Configuration**:
   - Site URL: `https://your-app.vercel.app`
   - Redirect URLs: `https://your-app.vercel.app`

### 7. Test It Out!

1. Visit your deployed app
2. Click **"Sign in with Google"**
3. After signing in, you'll automatically get a default board
4. Add players and start tracking!

## How to Use

### Daily Logging

1. Select a date (defaults to today)
2. Enter hang time (seconds) and meditation time (seconds) for each player
3. Data saves automatically as you type

### Streaks & Leaderboard

- A day counts as "active" if both hang ≥ 1s AND meditation ≥ 1 breath
- **Current Streak**: Consecutive active days from your last activity
- **Best Streak**: Longest streak ever achieved
- Leaderboard ranks by current streak, then total hang time

### Managing Boards

- **Create New Board**: For different groups (roommates, coworkers, etc.)
- **Join Board**: Enter a friend's join code to see their board
- **Share Code**: Give your join code to others to invite them
- **Switch Boards**: Use the dropdown to change between your boards

### Sharing with Friends

1. Click **"Share Code"** button
2. Send the 8-character code to your friend
3. They click **"Join Board"** and enter the code
4. Now you share the same leaderboard!

## Local Development

If you want to run locally before deploying:

```bash
# Install a simple HTTP server
npm install -g http-server

# Run in the project directory
http-server

# Visit http://localhost:8080
```

## Migrating from Local Version

If you used the localStorage version before signing in:

1. Sign in with Google
2. The app will automatically detect your old data
3. Click "OK" to import it into your cloud board
4. All your players and history will be preserved!

## Tech Stack

- **Frontend**: Vanilla JavaScript, HTML, CSS
- **Backend**: Supabase (PostgreSQL + Auth + Row Level Security)
- **Hosting**: Vercel
- **Authentication**: Google OAuth via Supabase Auth

## Project Structure

```
msmd/
├── index.html           # Main HTML structure
├── app.js              # All application logic
├── styles.css          # Styling and responsive design
├── config.js           # Supabase credentials (edit this!)
├── supabase-schema.sql # Database schema + RLS policies
├── vercel.json         # Vercel configuration
└── README.md           # This file
```

## Troubleshooting

### "Configuration Error" message

- Make sure you've updated `config.js` with your actual Supabase credentials
- Check that the URL and key don't have quotes or extra spaces

### Google sign-in fails

- Verify your Google OAuth credentials are correct in Supabase
- Make sure your domain is added to authorized origins in Google Console
- Check that redirect URIs match exactly (including https://)

### Data not syncing

- Check browser console for errors (F12 → Console tab)
- Verify you have internet connection
- Try signing out and back in

### Can't see friend's board

- Make sure they gave you the correct 8-character code
- The code is case-insensitive
- You both need to be signed in

## License

MIT - feel free to use and modify!

## Contributing

This is a personal project, but suggestions and improvements are welcome!

---

Built with ❤️ for building daily habits.
