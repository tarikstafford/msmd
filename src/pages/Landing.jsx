import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Landing() {
  const { signInWithGoogle } = useAuth()

  return (
    <div className="landing-page">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <h1 className="hero-title">
            🐒 Monkey See, Monkey Do
          </h1>
          <p className="hero-tagline">
            Tiny moves, big momentum.
          </p>
          <p className="hero-subtitle">
            Build unstoppable morning habits through friendly competition and atomic progress.
          </p>
          <button onClick={signInWithGoogle} className="cta-button">
            Get Started Free →
          </button>
        </div>
      </section>

      {/* Concept Section */}
      <section className="concept-section">
        <div className="section-container">
          <h2>The MSMD Concept</h2>
          <p className="concept-intro">
            MSMD is built on proven principles from <em>Atomic Habits</em> to help you build
            healthy morning routines the easy way.
          </p>

          <div className="principles-grid">
            <div className="principle-card">
              <div className="principle-icon">🎯</div>
              <h3>Make It Easy</h3>
              <p>
                Just 1 second of hanging. Just 1 breath of meditation.
                No excuses, no overwhelm. Start so small it's impossible to fail.
              </p>
            </div>

            <div className="principle-card">
              <div className="principle-icon">👀</div>
              <h3>Make It Visible</h3>
              <p>
                See your streak grow every day. Watch your troop's progress.
                Visual feedback creates accountability and motivation.
              </p>
            </div>

            <div className="principle-card">
              <div className="principle-icon">🏆</div>
              <h3>Make It Rewarding</h3>
              <p>
                Friendly competition with your troop. Celebrate streaks and personal bests.
                The leaderboard makes progress fun, not stressful.
              </p>
            </div>

            <div className="principle-card">
              <div className="principle-icon">🔥</div>
              <h3>Build Momentum</h3>
              <p>
                One day becomes two. Two becomes a week. Before you know it,
                you've built a habit that sticks for life.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="how-it-works-section">
        <div className="section-container">
          <h2>How It Works</h2>

          <div className="steps-list">
            <div className="step">
              <div className="step-number">1</div>
              <div className="step-content">
                <h3>Create or Join a Troop</h3>
                <p>
                  Start your own troop or join friends. Your troop is your accountability crew—
                  people who inspire you and keep you motivated.
                </p>
              </div>
            </div>

            <div className="step">
              <div className="step-number">2</div>
              <div className="step-content">
                <h3>Log Your Daily Habits</h3>
                <p>
                  Every morning, log your hang time and meditation. Even 1 second counts!
                  The goal is consistency, not perfection.
                </p>
              </div>
            </div>

            <div className="step">
              <div className="step-number">3</div>
              <div className="step-content">
                <h3>Track Your Progress</h3>
                <p>
                  Watch your streak grow. Climb the leaderboard. See your stats improve.
                  Celebrate every milestone with your troop.
                </p>
              </div>
            </div>

            <div className="step">
              <div className="step-number">4</div>
              <div className="step-content">
                <h3>Build the Habit</h3>
                <p>
                  What starts as 1 second naturally grows. You'll want to do more.
                  But the commitment stays easy: just show up every day.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <div className="section-container">
          <h2>Everything You Need to Succeed</h2>

          <div className="features-grid">
            <div className="feature">
              <div className="feature-icon">📊</div>
              <h3>Personal Dashboard</h3>
              <p>Track all your troops, streaks, and stats in one place</p>
            </div>

            <div className="feature">
              <div className="feature-icon">🎖️</div>
              <h3>Leaderboards</h3>
              <p>Friendly competition ranked by streaks and total time</p>
            </div>

            <div className="feature">
              <div className="feature-icon">📈</div>
              <h3>Streak Tracking</h3>
              <p>See your current and best streaks grow over time</p>
            </div>

            <div className="feature">
              <div className="feature-icon">👥</div>
              <h3>Multiple Troops</h3>
              <p>Join different groups for different accountability circles</p>
            </div>

            <div className="feature">
              <div className="feature-icon">📱</div>
              <h3>Mobile Friendly</h3>
              <p>Log your habits anywhere, anytime on any device</p>
            </div>

            <div className="feature">
              <div className="feature-icon">🔒</div>
              <h3>Private & Secure</h3>
              <p>Your data is safe and only shared within your troops</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="final-cta-section">
        <div className="section-container">
          <h2>Ready to Build Your Morning Habit?</h2>
          <p>Join thousands building unstoppable routines, one tiny move at a time.</p>
          <button onClick={signInWithGoogle} className="cta-button large">
            Start Your Streak Today →
          </button>
          <p className="cta-note">Free forever. No credit card required.</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <p>🐒 Monkey See, Monkey Do</p>
        <p className="footer-tagline">Tiny moves, big momentum.</p>
      </footer>
    </div>
  )
}
