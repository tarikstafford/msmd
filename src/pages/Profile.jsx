import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

export default function Profile() {
  const { user } = useAuth()
  const [stats, setStats] = useState({
    totalHang: 0,
    totalMed: 0,
    currentStreak: 0,
    bestStreak: 0,
    activeDays: 0,
    troops: []
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadProfileStats()
  }, [user])

  async function loadProfileStats() {
    try {
      // Get all player records for this user
      const { data: players, error: playersError } = await supabase
        .from('players')
        .select('*, groups(name)')
        .eq('user_id', user.id)

      if (playersError) throw playersError

      // Get all entries for this user's players
      const playerIds = players.map(p => p.id)
      const { data: entries, error: entriesError } = await supabase
        .from('entries')
        .select('*')
        .in('player_id', playerIds)

      if (entriesError) throw entriesError

      // Calculate aggregate stats
      const totalHang = entries.reduce((sum, e) => sum + e.hang_seconds, 0)
      const totalMed = entries.reduce((sum, e) => sum + e.med_seconds, 0)

      // Get unique dates where both hang and med >= 1
      const activeDates = [...new Set(
        entries
          .filter(e => e.hang_seconds >= 1 && e.med_seconds >= 1)
          .map(e => e.date)
      )].sort()

      // Calculate streaks
      let currentStreak = 0
      let bestStreak = 0

      if (activeDates.length > 0) {
        // Best streak
        let run = 1
        let best = 1
        for (let i = 1; i < activeDates.length; i++) {
          const diff = dateDiff(activeDates[i - 1], activeDates[i])
          if (diff === 1) {
            run++
            best = Math.max(best, run)
          } else {
            run = 1
          }
        }
        bestStreak = best

        // Current streak
        run = 1
        for (let i = activeDates.length - 2; i >= 0; i--) {
          const diff = dateDiff(activeDates[i], activeDates[i + 1])
          if (diff === 1) {
            run++
          } else {
            break
          }
        }
        currentStreak = run
      }

      setStats({
        totalHang,
        totalMed,
        currentStreak,
        bestStreak,
        activeDays: activeDates.length,
        troops: players.map(p => ({
          name: p.groups.name,
          playerName: p.name
        }))
      })
    } catch (error) {
      console.error('Error loading profile stats:', error)
    } finally {
      setLoading(false)
    }
  }

  function dateDiff(date1, date2) {
    const d1 = new Date(date1)
    const d2 = new Date(date2)
    return Math.round((d2 - d1) / (1000 * 60 * 60 * 24))
  }

  function formatDuration(seconds) {
    if (seconds < 60) return `${seconds}s`
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`
  }

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-content">
          <h2>Loading...</h2>
        </div>
      </div>
    )
  }

  return (
    <div className="profile-page">
      <div className="profile-header">
        <img
          src={user?.user_metadata?.avatar_url || `https://ui-avatars.com/api/?name=${user?.email}&size=128`}
          alt="Profile"
          className="profile-avatar"
        />
        <div>
          <h1>{user?.user_metadata?.full_name || 'Your Profile'}</h1>
          <p className="profile-email">{user?.email}</p>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">🔥</div>
          <div className="stat-value">{stats.currentStreak}</div>
          <div className="stat-label">Current Streak (days)</div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">🏆</div>
          <div className="stat-value">{stats.bestStreak}</div>
          <div className="stat-label">Best Streak (days)</div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">💪</div>
          <div className="stat-value">{formatDuration(stats.totalHang)}</div>
          <div className="stat-label">Total Hang Time</div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">🧘</div>
          <div className="stat-value">{formatDuration(stats.totalMed)}</div>
          <div className="stat-label">Total Meditation</div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">📅</div>
          <div className="stat-value">{stats.activeDays}</div>
          <div className="stat-label">Active Days</div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">🐵</div>
          <div className="stat-value">{stats.troops.length}</div>
          <div className="stat-label">Troops Joined</div>
        </div>
      </div>

      {stats.troops.length > 0 && (
        <div className="troops-list-section">
          <h2>Your Troops</h2>
          <ul className="troops-list">
            {stats.troops.map((troop, index) => (
              <li key={index}>
                <span className="troop-name">{troop.name}</span>
                <span className="player-name">as {troop.playerName}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
