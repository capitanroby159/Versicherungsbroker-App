import { getConnection } from '../database.js'

/**
 * RBAC - Role Based Access Control
 * Flexible Autorisierung basierend auf Rollen und Berechtigungen
 */

// ================================================================
// 1. ROLLEN-HIERARCHIE CHECK
// ================================================================

/**
 * Überprüfe ob Benutzer eine bestimmte Rolle oder höher hat
 * Rollen-Hierarchie: Admin (1) > Broker (2) > Sachbearbeiter (3) > Gast (4)
 * 
 * @example
 * router.delete('/users/:id', authenticateToken, requireRole(1), deleteUser)
 */
export const requireRole = (minRoleId) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Nicht authentifiziert' })
    }

    if (req.user.rolle_id > minRoleId) {
      return res.status(403).json({ 
        message: `Mindestens Rolle ${minRoleId} erforderlich` 
      })
    }

    next()
  }
}

/**
 * Überprüfe ob Benutzer eine EXAKTE Rolle hat
 * 
 * @example
 * router.get('/admin/dashboard', authenticateToken, requireExactRole(1), adminDashboard)
 */
export const requireExactRole = (roleId) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Nicht authentifiziert' })
    }

    if (req.user.rolle_id !== roleId) {
      return res.status(403).json({ 
        message: `Nur Rolle ${roleId} erlaubt` 
      })
    }

    next()
  }
}

/**
 * Überprüfe ob Benutzer eine von mehreren Rollen hat
 * 
 * @example
 * router.get('/users', authenticateToken, requireAnyRole([1, 2]), getUsers)
 */
export const requireAnyRole = (roleIds) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Nicht authentifiziert' })
    }

    if (!roleIds.includes(req.user.rolle_id)) {
      return res.status(403).json({ 
        message: `Eine der Rollen ${roleIds.join(', ')} erforderlich` 
      })
    }

    next()
  }
}

// ================================================================
// 2. SPEZIFISCHE BERECHTIGUNGEN AUS DB
// ================================================================

/**
 * Überprüfe ob Benutzer eine spezifische Berechtigung hat
 * Liest aus berechtigungen-Tabelle
 * 
 * @example
 * router.post('/kunden', authenticateToken, requirePermission('kunden.create'), createKunde)
 */
export const requirePermission = (action) => {
  return async (req, res, next) => {
    const connection = await getConnection()

    try {
      if (!req.user) {
        return res.status(401).json({ message: 'Nicht authentifiziert' })
      }

      // Überprüfe Berechtigung in DB
      const [permissions] = await connection.execute(
        `SELECT b.aktion 
         FROM berechtigungen b
         WHERE b.rolle_id = ? AND b.aktion = ?`,
        [req.user.rolle_id, action]
      )

      if (permissions.length === 0) {
        return res.status(403).json({ 
          message: `Berechtigung '${action}' erforderlich` 
        })
      }

      next()
    } catch (error) {
      console.error('Permission check error:', error)
      res.status(500).json({ message: 'Fehler beim Berechtigungs-Check' })
    } finally {
      connection.release()
    }
  }
}

/**
 * Überprüfe ob Benutzer mehrere Berechtigungen hat (AND-Logik)
 * 
 * @example
 * router.put('/kunden/:id', authenticateToken, requireAllPermissions(['kunden.read', 'kunden.update']), updateKunde)
 */
export const requireAllPermissions = (actions) => {
  return async (req, res, next) => {
    const connection = await getConnection()

    try {
      if (!req.user) {
        return res.status(401).json({ message: 'Nicht authentifiziert' })
      }

      for (const action of actions) {
        const [permissions] = await connection.execute(
          `SELECT b.aktion 
           FROM berechtigungen b
           WHERE b.rolle_id = ? AND b.aktion = ?`,
          [req.user.rolle_id, action]
        )

        if (permissions.length === 0) {
          return res.status(403).json({ 
            message: `Berechtigung '${action}' erforderlich` 
          })
        }
      }

      next()
    } catch (error) {
      console.error('Permission check error:', error)
      res.status(500).json({ message: 'Fehler beim Berechtigungs-Check' })
    } finally {
      connection.release()
    }
  }
}

/**
 * Überprüfe ob Benutzer mindestens eine Berechtigung hat (OR-Logik)
 * 
 * @example
 * router.get('/reports', authenticateToken, requireAnyPermission(['reports.read', 'admin.access']), getReports)
 */
export const requireAnyPermission = (actions) => {
  return async (req, res, next) => {
    const connection = await getConnection()

    try {
      if (!req.user) {
        return res.status(401).json({ message: 'Nicht authentifiziert' })
      }

      const [permissions] = await connection.execute(
        `SELECT b.aktion 
         FROM berechtigungen b
         WHERE b.rolle_id = ? AND b.aktion IN (${actions.map(() => '?').join(',')})`,
        [req.user.rolle_id, ...actions]
      )

      if (permissions.length === 0) {
        return res.status(403).json({ 
          message: `Eine der Berechtigungen erforderlich: ${actions.join(', ')}` 
        })
      }

      next()
    } catch (error) {
      console.error('Permission check error:', error)
      res.status(500).json({ message: 'Fehler beim Berechtigungs-Check' })
    } finally {
      connection.release()
    }
  }
}

// ================================================================
// 3. RESOURCE-BASIERTE ZUGRIFFSKONTROLLE
// ================================================================

/**
 * Überprüfe ob Benutzer seine eigenen Daten oder Admin ist
 * 
 * @example
 * router.put('/profile/:id', authenticateToken, isOwnerOrAdmin, updateProfile)
 */
export const isOwnerOrAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Nicht authentifiziert' })
  }

  const resourceId = parseInt(req.params.id)
  const userId = req.user.id
  const isAdmin = req.user.rolle_id === 1

  if (userId !== resourceId && !isAdmin) {
    return res.status(403).json({ 
      message: 'Du darfst nur deine eigenen Daten bearbeiten' 
    })
  }

  next()
}

/**
 * Überprüfe ob Benutzer auf bestimmten Versicherer Zugriff hat
 * (Multi-Tenant-Unterstützung)
 * 
 * @example
 * router.get('/versicherer/:id', authenticateToken, checkVersichererAccess, getVersicherer)
 */
export const checkVersichererAccess = async (req, res, next) => {
  const connection = await getConnection()

  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Nicht authentifiziert' })
    }

    const versichererId = parseInt(req.params.id)

    // Admin hat Zugriff auf alles
    if (req.user.rolle_id === 1) {
      return next()
    }

    // Überprüfe ob Benutzer diesem Versicherer zugewiesen ist
    const [access] = await connection.execute(
      `SELECT bv.id FROM benutzer_versicherer bv
       WHERE bv.benutzer_id = ? AND bv.versicherer_id = ?`,
      [req.user.id, versichererId]
    )

    if (access.length === 0) {
      return res.status(403).json({ 
        message: 'Kein Zugriff auf diesen Versicherer' 
      })
    }

    next()
  } catch (error) {
    console.error('Versicherer access check error:', error)
    res.status(500).json({ message: 'Fehler beim Zugriffs-Check' })
  } finally {
    connection.release()
  }
}

/**
 * Überprüfe ob Benutzer Bearbeitungsrechte für Versicherer hat
 * 
 * @example
 * router.put('/versicherer/:id', authenticateToken, canEditVersicherer, updateVersicherer)
 */
export const canEditVersicherer = async (req, res, next) => {
  const connection = await getConnection()

  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Nicht authentifiziert' })
    }

    const versichererId = parseInt(req.params.id)

    // Admin hat immer Zugriff
    if (req.user.rolle_id === 1) {
      return next()
    }

    // Überprüfe ob Benutzer Bearbeitungsrechte hat
    const [access] = await connection.execute(
      `SELECT bv.kann_bearbeiten FROM benutzer_versicherer bv
       WHERE bv.benutzer_id = ? AND bv.versicherer_id = ?`,
      [req.user.id, versichererId]
    )

    if (access.length === 0 || !access[0].kann_bearbeiten) {
      return res.status(403).json({ 
        message: 'Du darfst diesen Versicherer nicht bearbeiten' 
      })
    }

    next()
  } catch (error) {
    console.error('Edit versicherer check error:', error)
    res.status(500).json({ message: 'Fehler beim Zugriffs-Check' })
  } finally {
    connection.release()
  }
}

// ================================================================
// 4. CUSTOM AUTHORIZATION
// ================================================================

/**
 * Erstelle eine Custom Authorization Middleware
 * 
 * @example
 * const customAuth = customAuthorize(async (req) => {
 *   return req.user.role === 'admin' && req.user.department === 'IT'
 * })
 * router.delete('/sensitive', authenticateToken, customAuth, deleteSensitive)
 */
export const customAuthorize = (checkFn) => {
  return async (req, res, next) => {
    try {
      const isAuthorized = await checkFn(req)

      if (!isAuthorized) {
        return res.status(403).json({ 
          message: 'Nicht berechtigt für diese Aktion' 
        })
      }

      next()
    } catch (error) {
      console.error('Custom authorization error:', error)
      res.status(500).json({ message: 'Fehler bei der Autorisierung' })
    }
  }
}

// ================================================================
// 5. RATE LIMITING (Bonus)
// ================================================================

/**
 * Rate limiting pro Benutzer
 * Verhindert zu viele Requests in kurzer Zeit
 */
const userRequestCounts = new Map()

export const rateLimit = (maxRequests = 100, windowMs = 60000) => {
  return (req, res, next) => {
    if (!req.user) {
      return next()
    }

    const userId = req.user.id
    const now = Date.now()

    if (!userRequestCounts.has(userId)) {
      userRequestCounts.set(userId, [])
    }

    const userRequests = userRequestCounts.get(userId)
    const recentRequests = userRequests.filter(time => now - time < windowMs)

    if (recentRequests.length >= maxRequests) {
      return res.status(429).json({ 
        message: 'Zu viele Requests. Bitte später versuchen.' 
      })
    }

    recentRequests.push(now)
    userRequestCounts.set(userId, recentRequests)

    next()
  }
}

export default {
  requireRole,
  requireExactRole,
  requireAnyRole,
  requirePermission,
  requireAllPermissions,
  requireAnyPermission,
  isOwnerOrAdmin,
  checkVersichererAccess,
  canEditVersicherer,
  customAuthorize,
  rateLimit
}