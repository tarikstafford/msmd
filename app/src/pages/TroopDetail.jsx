import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

export default function TroopDetail() {
  const { troopId } = useParams()
  const { user } = useAuth()
  const [troop, setTroop] = useState(null)
  const [player, setPlayer] = useState(null)
  const [todayEntry, setTodayEntry] = useState({ hang: 0, med: 0 })
  const [leaderboard, setLeaderboard] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadTroopData()
  }, [troopId, user])

  async function loadTroopData() {
    try {
      // Load troop
      const { data: troopData, error: troopError } = await supabase
        .from('groups')
        .select('*')
        .eq('id', troopId)
        .single()

      if (troopError) throw troopError
      setTroop(troopData)

      // Load or create player for this user
      let { data: playerData, error: playerError } = await supabase
        .from('players')
        .select('*')
        .eq('group_id', troopId)
        .eq('user_id', user.id)
        .single()

      if (playerError && playerError.code !== 'PGRST116') {
        throw playerError
      }

      // If no player exists, create one
      if (!playerData) {
        const { data: newPlayer, error: createError } = await supabase
          .from('players')
          .insert({
            group_id: troopId,
            user_id: user.id,
            name: user.user_metadata.full_name || user.email.split('@')[0]
          })
          .select()
          .single()

        if (createError) throw createError
        playerData = newPlayer
      }

      setPlayer(playerData)

      // Load today's entry for this player
      const today = new Date().toISOString().split('T')[0]
      const { data: entryData } = await supabase
        .from('entries')
        .select('*')
        .eq('group_id', troopId)
        .eq('player_id', playerData.id)
        .eq('date', today)
        .single()

      if (entryData) {
        setTodayEntry({
          hang: entryData.hang_seconds,
          med: entryData.med_seconds
        })
      }

      // Load leaderboard
      await loadLeaderboard()
    } catch (error) {
      console.error('Error loading troop:', error)
    } finally {
      setLoading(false)
    }
  }

  async function loadLeaderboard() {
    try {
      const { data: players, error: playersError } = await supabase
        .from('players')
        .select('*')
        .eq('group_id', troopId)

      if (playersError) throw playersError

      const { data: entries, error: entriesError } = await supabase
        .from('entries')
        .select('*')
        .eq('group_id', troopId)

      if (entriesError) throw entriesError

      const stats = players.map(p => calculateStats(p, entries))
      const sorted = stats.sort((a, b) => {
        if (b.currentStreak !== a.currentStreak) {
          return b.currentStreak - a.currentStreak
        }
        return b.totalHang - a.totalHang
      })

      setLeaderboard(sorted)
    } catch (error) {
      console.error('Error loading leaderboard:', error)
    }
  }

  function calculateStats(player, entries) {
    const playerEntries = entries.filter(e => e.player_id === player.id)
    const dates = playerEntries
      .filter(e => e.hang_seconds >= 1 && e.med_seconds >= 1)
      .map(e => e.date)
      .sort()

    let currentStreak = 0
    let bestStreak = 0

    if (dates.length > 0) {
      // Calculate best streak
      let run = 1
      let best = 1
      for (let i = 1; i < dates.length; i++) {
        const diff = dateDiff(dates[i - 1], dates[i])
        if (diff === 1) {
          run++
          best = Math.max(best, run)
        } else {
          run = 1
        }
      }
      bestStreak = best

      // Calculate current streak (working backwards from last date)
      run = 1
      for (let i = dates.length - 2; i >= 0; i--) {
        const diff = dateDiff(dates[i], dates[i + 1])
        if (diff === 1) {
          run++
        } else {
          break
        }
      }
      currentStreak = run
    }

    return {
      player,
      totalHang: playerEntries.reduce((sum, e) => sum + e.hang_seconds, 0),
      totalMed: playerEntries.reduce((sum, e) => sum + e.med_seconds, 0),
      currentStreak,
      bestStreak,
      activeDays: dates.length
    }
  }

  function dateDiff(date1, date2) {
    const d1 = new Date(date1)
    const d2 = new Date(date2)
    return Math.round((d2 - d1) / (1000 * 60 * 60 * 24))
  }

  async function updateEntry(field, value) {
    if (!player) return

    const numValue = Math.max(0, parseInt(value) || 0)
    const today = new Date().toISOString().split('T')[0]

    const newEntry = {
      ...todayEntry,
      [field]: numValue
    }
    setTodayEntry(newEntry)

    try {
      const { error } = await supabase
        .from('entries')
        .upsert({
          group_id: troopId,
          player_id: player.id,
          date: today,
          hang_seconds: newEntry.hang,
          med_seconds: newEntry.med
        }, {
          onConflict: 'group_id,player_id,date'
        })

      if (error) throw error
      await loadLeaderboard()
    } catch (error) {
      console.error('Error saving entry:', error)
    }
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
    <div className="troop-detail-page">
      <div className="troop-header">
        <Link to="/dashboard" className="back-link">← Back</Link>
        <h1>{troop?.name}</h1>
        <p className="troop-code">Share Code: {troop?.join_code}</p>
      </div>

      <div className="today-log-section">
        <h2>Today's Swings & Stillness</h2>
        <p className="section-subtitle">Log your hang & meditation for today.</p>

        <div className="log-inputs">
          <div className="log-field">
            <label>Hang (seconds)</label>
            <input
              type="number"
              min="0"
              value={todayEntry.hang || ''}
              onChange={e => updateEntry('hang', e.target.value)}
              placeholder="0"
            />
          </div>
          <div className="log-field">
            <label>Meditation (seconds)</label>
            <input
              type="number"
              min="0"
              value={todayEntry.med || ''}
              onChange={e => updateEntry('med', e.target.value)}
              placeholder="0"
            />
          </div>
        </div>

        {todayEntry.hang >= 1 && todayEntry.med >= 1 && (
          <div className="success-badge">✅ Done for the day!</div>
        )}
      </div>

      <div className="leaderboard-section">
        <h2>Troop Leaderboard</h2>
        <p className="section-subtitle">Ranking by streak first, then total hang.</p>

        <div className="leaderboard-table">
          <table>
            <thead>
              <tr>
                <th>Rank</th>
                <th>Monkey</th>
                <th>Current Streak</th>
                <th>Best Streak</th>
                <th>Total Hang</th>
                <th>Active Days</th>
              </tr>
            </thead>
            <tbody>
              {leaderboard.map((stat, index) => (
                <tr key={stat.player.id} className={stat.player.id === player?.id ? 'current-user' : ''}>
                  <td>{index + 1}</td>
                  <td>
                    {stat.player.name}
                    {stat.player.id === player?.id && ' (You)'}
                  </td>
                  <td>{stat.currentStreak > 0 ? `${stat.currentStreak} days 🔥` : '-'}</td>
                  <td>{stat.bestStreak > 0 ? `${stat.bestStreak} days` : '-'}</td>
                  <td>{stat.totalHang > 0 ? `${stat.totalHang}s` : '-'}</td>
                  <td>{stat.activeDays > 0 ? stat.activeDays : '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
