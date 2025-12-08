import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

export default function Dashboard() {
  const { user } = useAuth()
  const [troops, setTroops] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showJoinModal, setShowJoinModal] = useState(false)
  const [troopName, setTroopName] = useState('')
  const [joinCode, setJoinCode] = useState('')

  useEffect(() => {
    loadTroops()
  }, [user])

  async function loadTroops() {
    try {
      const { data, error } = await supabase
        .from('group_members')
        .select('groups(*)')
        .eq('user_id', user.id)

      if (error) throw error
      setTroops(data.map(gm => gm.groups))
    } catch (error) {
      console.error('Error loading troops:', error)
      setTroops([])
    } finally {
      setLoading(false)
    }
  }

  async function createTroop() {
    if (!troopName.trim()) return

    try {
      const joinCode = generateJoinCode()

      const { data: group, error: groupError } = await supabase
        .from('groups')
        .insert({
          name: troopName,
          owner_id: user.id,
          join_code: joinCode
        })
        .select()
        .single()

      if (groupError) throw groupError

      const { error: memberError } = await supabase
        .from('group_members')
        .insert({
          group_id: group.id,
          user_id: user.id
        })

      if (memberError) throw memberError

      await loadTroops()
      setShowCreateModal(false)
      setTroopName('')
    } catch (error) {
      console.error('Error creating troop:', error)
      alert('Failed to create troop: ' + error.message)
    }
  }

  async function joinTroop() {
    if (!joinCode.trim()) return

    try {
      console.log('[JOIN] Looking for troop with code:', joinCode.toUpperCase())

      const { data: group, error: groupError } = await supabase
        .from('groups')
        .select('*')
        .eq('join_code', joinCode.toUpperCase())
        .single()

      console.log('[JOIN] Group query result:', { group, error: groupError })

      if (groupError) {
        if (groupError.code === 'PGRST116') {
          throw new Error('Troop not found. Check the code and try again.')
        }
        throw new Error(`Database error: ${groupError.message}`)
      }

      if (!group) {
        throw new Error('Troop not found. Check the code and try again.')
      }

      console.log('[JOIN] Found group:', group.name, '- Attempting to join...')

      const { error: memberError } = await supabase
        .from('group_members')
        .insert({
          group_id: group.id,
          user_id: user.id
        })

      console.log('[JOIN] Member insert result:', { error: memberError })

      if (memberError) {
        if (memberError.code === '23505') {
          throw new Error('You are already a member of this troop.')
        }
        throw new Error(`Failed to join: ${memberError.message}`)
      }

      console.log('[JOIN] ✓ Successfully joined troop!')
      await loadTroops()
      setShowJoinModal(false)
      setJoinCode('')
      alert(`Successfully joined "${group.name}"!`)
    } catch (error) {
      console.error('[JOIN] ❌ Error:', error)
      alert(error.message)
    }
  }

  function generateJoinCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
    let result = ''
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return result
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
    <div className="dashboard-page">
      <div className="dashboard-header">
        <h1>🐒 Your Troops</h1>
        <div className="dashboard-actions">
          <button onClick={() => setShowCreateModal(true)} className="primary">
            + New Troop
          </button>
          <button onClick={() => setShowJoinModal(true)} className="secondary">
            Join Troop
          </button>
        </div>
      </div>

      {troops.length === 0 ? (
        <div className="empty-state">
          <p>No troops yet. Create your first troop to start! 🌳</p>
        </div>
      ) : (
        <div className="troops-grid">
          {troops.map(troop => (
            <Link key={troop.id} to={`/troop/${troop.id}`} className="troop-card">
              <h3>{troop.name}</h3>
              <p className="troop-code">Code: {troop.join_code}</p>
            </Link>
          ))}
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h2>Create New Troop</h2>
            <input
              type="text"
              placeholder="Troop name"
              value={troopName}
              onChange={e => setTroopName(e.target.value)}
              onKeyPress={e => e.key === 'Enter' && createTroop()}
              autoFocus
            />
            <div className="modal-actions">
              <button onClick={() => setShowCreateModal(false)} className="secondary">
                Cancel
              </button>
              <button onClick={createTroop} className="primary">
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Join Modal */}
      {showJoinModal && (
        <div className="modal-overlay" onClick={() => setShowJoinModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h2>Join Troop</h2>
            <input
              type="text"
              placeholder="Enter troop code"
              value={joinCode}
              onChange={e => setJoinCode(e.target.value.toUpperCase())}
              onKeyPress={e => e.key === 'Enter' && joinTroop()}
              autoFocus
            />
            <div className="modal-actions">
              <button onClick={() => setShowJoinModal(false)} className="secondary">
                Cancel
              </button>
              <button onClick={joinTroop} className="primary">
                Join
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
