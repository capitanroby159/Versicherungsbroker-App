import React, { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext()

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth muss inside AuthProvider verwendet werden')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Beim laden prüfen ob Token existiert
  useEffect(() => {
    const token = localStorage.getItem('auth_token')
    const userData = localStorage.getItem('user_data')
    
    if (token && userData) {
      try {
        setUser(JSON.parse(userData))
      } catch (err) {
        console.error('Fehler beim Parsen user_data:', err)
        localStorage.removeItem('auth_token')
        localStorage.removeItem('user_data')
      }
    }
    
    setLoading(false)
  }, [])

  const login = async (email, passwort) => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, passwort })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Login fehlgeschlagen')
      }

      // Token speichern
      localStorage.setItem('auth_token', data.token)
      localStorage.setItem('user_data', JSON.stringify(data.benutzer))
      
      setUser(data.benutzer)
      setError(null)
      
      return { success: true }
    } catch (err) {
      const errorMessage = err.message || 'Ein Fehler ist aufgetreten'
      setError(errorMessage)
      return { success: false, error: errorMessage }
    } finally {
      setLoading(false)
    }
  }

  const logout = () => {
    localStorage.removeItem('auth_token')
    localStorage.removeItem('user_data')
    setUser(null)
  }

  const isAuthenticated = !!user

  const value = {
    user,
    loading,
    error,
    login,
    logout,
    isAuthenticated,
    getToken: () => localStorage.getItem('auth_token')
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export default AuthContext