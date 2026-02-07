import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this'

/**
 * Middleware: Token validieren
 */
export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1]

  if (!token) {
    return res.status(401).json({ message: 'Token erforderlich' })
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Token ungültig oder abgelaufen' })
    }
    req.user = user
    next()
  })
}

/**
 * Middleware: Admin-Check
 */
export const checkAdmin = (req, res, next) => {
  if (req.user.rolle_id !== 1) {
    return res.status(403).json({ message: 'Nur Admin kann diese Aktion durchführen' })
  }
  next()
}

/**
 * Middleware: Optional - Spezifische Rollen-Check
 */
export const checkRole = (requiredRole) => {
  return (req, res, next) => {
    if (req.user.rolle_id > requiredRole) {
      return res.status(403).json({ message: 'Unzureichende Berechtigungen' })
    }
    next()
  }
}

export default authenticateToken