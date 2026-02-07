import React from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import './Layout.css'

const Layout = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const isActive = (path) => location.pathname === path

  return (
    <div className="layout">
      <nav className="navbar">
        <div className="navbar-brand">
          <h2>Versicherungsbroker</h2>
        </div>

        <ul className="navbar-menu">
          <li>
            <a
              href="/"
              className={`navbar-link ${isActive('/') ? 'active' : ''}`}
            >
              Kunden
            </a>
          </li>
          <li>
            <a
              href="/immobilien"
              className={`navbar-link ${isActive('/immobilien') ? 'active' : ''}`}
            >
              Immobilien
            </a>
          </li>
          <li>
            <a
              href="/policen"
              className={`navbar-link ${isActive('/policen') ? 'active' : ''}`}
            >
              Policen
            </a>
          </li>
          <li>
            <a
              href="/versicherer"
              className={`navbar-link ${isActive('/versicherer') ? 'active' : ''}`}
            >
              Versicherer
            </a>
          </li>
          <li>
            <a
              href="/tracking"
              className={`navbar-link ${isActive('/tracking') ? 'active' : ''}`}
            >
              Tracking
            </a>
          </li>
        </ul>

        <div className="navbar-user">
          <span>
            {user?.vorname} {user?.nachname}
          </span>
          <button className="btn btn-secondary" onClick={handleLogout}>
            Abmelden
          </button>
        </div>
      </nav>

      <main className="layout-main">
        <Outlet />
      </main>
    </div>
  )
}

export default Layout