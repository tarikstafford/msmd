import { Link, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Layout() {
  const { user, signOut } = useAuth()
  const location = useLocation()

  return (
    <div className="app-layout">
      <nav className="app-nav">
        <div className="nav-brand">
          <Link to="/dashboard">🐒 Monkey See, Monkey Do</Link>
        </div>
        <div className="nav-links">
          <Link
            to="/dashboard"
            className={location.pathname === '/dashboard' ? 'active' : ''}
          >
            Dashboard
          </Link>
          <Link
            to="/profile"
            className={location.pathname === '/profile' ? 'active' : ''}
          >
            Profile
          </Link>
        </div>
        <div className="nav-user">
          <img
            src={user?.user_metadata?.avatar_url || `https://ui-avatars.com/api/?name=${user?.email}`}
            alt="Avatar"
            className="avatar"
          />
          <span>{user?.user_metadata?.full_name || user?.email}</span>
          <button onClick={signOut} className="secondary small">
            Sign Out
          </button>
        </div>
      </nav>
      <main className="app-main">
        <Outlet />
      </main>
    </div>
  )
}
