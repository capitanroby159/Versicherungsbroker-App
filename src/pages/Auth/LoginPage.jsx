import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import './LoginPage.css'

const LoginPage = () => {
  const [email, setEmail] = useState('')
  const [passwort, setPasswort] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!email || !passwort) {
      setError('Bitte Email und Passwort eingeben')
      return
    }

    setIsLoading(true)
    const result = await login(email, passwort)

    if (result.success) {
      navigate('/')
    } else {
      setError(result.error)
    }

    setIsLoading(false)
  }

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-card">
          <div className="login-header">
            <h1>Versicherungsbroker</h1>
            <p>Anmeldung</p>
          </div>

          {error && <div className="alert alert-error">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>E-Mail</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="deine.email@example.com"
                required
              />
            </div>

            <div className="form-group">
              <label>Passwort</label>
              <input
                type="password"
                value={passwort}
                onChange={(e) => setPasswort(e.target.value)}
                placeholder="Dein Passwort"
                required
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={isLoading}
              style={{ width: '100%' }}
            >
              {isLoading ? 'Anmelden...' : 'Anmelden'}
            </button>
          </form>

          <div className="login-footer">
            <p>Test-Benutzer: admin@broker.ch / password123</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LoginPage