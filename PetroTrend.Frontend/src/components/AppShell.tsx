import { NavLink, Outlet } from 'react-router'
import './AppShell.css'

export function AppShell() {
  return (
    <div className="shell">
      <div className="hazard" />

      <header className="shell__bar">
        <NavLink to="/" className="shell__brand" aria-label="PetroTrend — pulpit">
          <svg width="22" height="22" viewBox="0 0 32 32" aria-hidden="true" focusable="false">
            <path
              d="M16 3c5 5.6 8 9.9 8 13.9A8 8 0 0 1 8 16.9C8 12.9 11 8.6 16 3Z"
              fill="none"
              stroke="#FFB020"
              strokeWidth="2.4"
            />
            <path d="M16 12.5c2 2.4 3.1 4.2 3.1 5.6a3.1 3.1 0 1 1-6.2 0c0-1.4 1.1-3.2 3.1-5.6Z" fill="#FFB020" />
          </svg>
          <span className="shell__wordmark">
            Petro<em>Trend</em>
          </span>
        </NavLink>

        <nav className="shell__nav">
          <NavLink to="/" end className={({ isActive }) => `shell__link${isActive ? ' shell__link--on' : ''}`}>
            Pulpit
          </NavLink>
          <NavLink to="/notowania" className={({ isActive }) => `shell__link${isActive ? ' shell__link--on' : ''}`}>
            Notowania
          </NavLink>
        </nav>
      </header>

      <main className="shell__main">
        <Outlet />
      </main>

      <footer className="shell__foot">
        <span>PetroTrend — ewidencja cen paliw</span>
        <span className="num">ON · PB95 · PB98 · LPG</span>
      </footer>

      <div className="hazard" />
    </div>
  )
}
