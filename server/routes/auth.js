import express from 'express'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import nodemailer from 'nodemailer'
import crypto from 'crypto'
import { getConnection } from '../database.js'
import { authenticateToken } from '../middleware/auth.js'
import { 
  requireRole, 
  requirePermission,
  rateLimit
} from '../middleware/authorize.js'

const router = express.Router()
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this'

// ================================================================
// EMAIL CONFIG
// ================================================================
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT || 587,
  secure: process.env.SMTP_PORT === '465',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  }
})

// ================================================================
// 1. LOGIN
// ================================================================
router.post('/login', rateLimit(10, 60000), async (req, res) => {
  const connection = await getConnection()

  try {
    const { email, passwort } = req.body

    if (!email || !passwort) {
      return res.status(400).json({ message: 'Email und Passwort erforderlich' })
    }

    // Benutzer suchen
    const [users] = await connection.execute(
      `SELECT b.*, r.name as rolle_name 
       FROM benutzer b
       LEFT JOIN rollen r ON b.rolle_id = r.id
       WHERE b.email = ?`,
      [email]
    )

    if (users.length === 0) {
      return res.status(401).json({ message: 'Benutzer nicht gefunden' })
    }

    const user = users[0]

    // Passwort vergleichen
    const isValid = await bcrypt.compare(passwort, user.passwort)

    if (!isValid) {
      return res.status(401).json({ message: 'Passwort falsch' })
    }

    // Nur aktive Benutzer
    if (!user.ist_aktiv) {
      return res.status(401).json({ message: 'Benutzer ist deaktiviert' })
    }

    // JWT Token erstellen
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        rolle_id: user.rolle_id,
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    )

    // Letzter Login aktualisieren
    await connection.execute(
      'UPDATE benutzer SET letzter_login = NOW() WHERE id = ?',
      [user.id]
    )

    // Audit Log
    await connection.execute(
      'INSERT INTO audit_log (benutzer_id, aktion) VALUES (?, ?)',
      [user.id, 'login']
    )

    console.log(`✅ [LOGIN] ${email} - Rolle: ${user.rolle_name}`)

    res.json({
      token,
      benutzer: {
        id: user.id,
        email: user.email,
        vorname: user.vorname,
        nachname: user.nachname,
        rolle_id: user.rolle_id,
        rolle_name: user.rolle_name,
      }
    })
  } catch (error) {
    console.error('❌ Login error:', error)
    res.status(500).json({ message: 'Fehler beim Login', error: error.message })
  } finally {
    connection.release()
  }
})

// ================================================================
// 2. LOGOUT
// ================================================================
router.post('/logout', authenticateToken, async (req, res) => {
  const connection = await getConnection()

  try {
    // Audit Log
    await connection.execute(
      'INSERT INTO audit_log (benutzer_id, aktion) VALUES (?, ?)',
      [req.user.id, 'logout']
    )

    console.log(`✅ [LOGOUT] ${req.user.email}`)
    res.json({ message: 'Logout erfolgreich' })
  } catch (error) {
    console.error('❌ Logout error:', error)
    res.status(500).json({ message: 'Fehler beim Logout' })
  } finally {
    connection.release()
  }
})

// ================================================================
// 3. GET CURRENT USER
// ================================================================
router.get('/me', authenticateToken, async (req, res) => {
  const connection = await getConnection()

  try {
    const [users] = await connection.execute(
      `SELECT b.id, b.email, b.vorname, b.nachname, b.rolle_id, 
              b.ist_aktiv, b.letzter_login, r.name as rolle_name
       FROM benutzer b
       LEFT JOIN rollen r ON b.rolle_id = r.id
       WHERE b.id = ?`,
      [req.user.id]
    )

    if (users.length === 0) {
      return res.status(404).json({ message: 'Benutzer nicht gefunden' })
    }

    res.json(users[0])
  } catch (error) {
    console.error('❌ Get user error:', error)
    res.status(500).json({ message: 'Fehler beim Abrufen des Benutzers' })
  } finally {
    connection.release()
  }
})

// ================================================================
// 4. GET ALL USERS (Admin only)
// ================================================================
router.get('/users', 
  authenticateToken, 
  requireRole(1),
  async (req, res) => {
    const connection = await getConnection()

    try {
      const [users] = await connection.execute(
        `SELECT b.id, b.email, b.vorname, b.nachname, b.rolle_id, 
                b.ist_aktiv, b.letzter_login, b.created_at, r.name as rolle_name
         FROM benutzer b
         LEFT JOIN rollen r ON b.rolle_id = r.id
         ORDER BY b.created_at DESC`
      )

      // Audit Log
      await connection.execute(
        'INSERT INTO audit_log (benutzer_id, aktion) VALUES (?, ?)',
        [req.user.id, 'users.list']
      )

      console.log(`✅ [GET USERS] Admin ${req.user.email} - ${users.length} Benutzer`)
      res.json(users)
    } catch (error) {
      console.error('❌ Get users error:', error)
      res.status(500).json({ message: 'Fehler beim Abrufen der Benutzer' })
    } finally {
      connection.release()
    }
  }
)

// ================================================================
// 5. CREATE USER (Admin only)
// ================================================================
router.post('/users', 
  authenticateToken, 
  requireRole(1),
  rateLimit(5, 60000),
  async (req, res) => {
    const connection = await getConnection()

    try {
      const { email, vorname, nachname, rolle_id } = req.body

      if (!email || !vorname || !nachname) {
        return res.status(400).json({ message: 'Email, Vorname und Nachname erforderlich' })
      }

      // Überprüfe ob Email schon existiert
      const [existing] = await connection.execute(
        'SELECT id FROM benutzer WHERE email = ?',
        [email]
      )

      if (existing.length > 0) {
        return res.status(400).json({ message: 'Email existiert bereits' })
      }

      // Temporäres Passwort generieren
      const tempPassword = crypto.randomBytes(8).toString('hex')
      const hashedPassword = await bcrypt.hash(tempPassword, 10)

      // Benutzer erstellen
      const [result] = await connection.execute(
        `INSERT INTO benutzer (email, passwort, vorname, nachname, rolle_id, ist_aktiv)
         VALUES (?, ?, ?, ?, ?, true)`,
        [email, hashedPassword, vorname, nachname, rolle_id || 2]
      )

      // Audit Log
      await connection.execute(
        'INSERT INTO audit_log (benutzer_id, aktion, tabelle, datensatz_id) VALUES (?, ?, ?, ?)',
        [req.user.id, 'benutzer.created', 'benutzer', result.insertId]
      )

      // E-Mail mit temporärem Passwort senden
      try {
        await transporter.sendMail({
          from: process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER,
          to: email,
          subject: 'Willkommen - Versicherungsbroker Benutzer erstellt',
          html: `
            <h2>Willkommen!</h2>
            <p>Dein Benutzerkonto wurde erstellt.</p>
            <p><strong>E-Mail:</strong> ${email}</p>
            <p><strong>Temporäres Passwort:</strong> <code style="background: #f0f0f0; padding: 5px 10px; border-radius: 4px;">${tempPassword}</code></p>
            <p>Bitte ändere dein Passwort nach dem ersten Login.</p>
            <p><a href="http://localhost:3000/login" style="background: #1e40af; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; display: inline-block;">Zum Login</a></p>
          `
        })
        console.log(`✅ [EMAIL] Willkommens-E-Mail an ${email} versendet`)
      } catch (emailError) {
        console.error('❌ Email senden fehlgeschlagen:', emailError.message)
      }

      console.log(`✅ [CREATE USER] ${vorname} ${nachname} (${email}) erstellt`)

      res.status(201).json({
        message: 'Benutzer erstellt. E-Mail mit Passwort versendet.',
        userId: result.insertId,
        email: email
      })
    } catch (error) {
      console.error('❌ Create user error:', error)
      res.status(500).json({ message: 'Fehler beim Erstellen des Benutzers' })
    } finally {
      connection.release()
    }
  }
)

// ================================================================
// 6. UPDATE USER (Admin only)
// ================================================================
router.put('/users/:id', 
  authenticateToken, 
  requireRole(1),
  async (req, res) => {
    const connection = await getConnection()

    try {
      const { id } = req.params
      const { vorname, nachname, rolle_id, ist_aktiv } = req.body

      if (!vorname || !nachname) {
        return res.status(400).json({ message: 'Vorname und Nachname erforderlich' })
      }

      // Admin kann sich selbst nicht deaktivieren
      if (id == req.user.id && !ist_aktiv) {
        return res.status(400).json({ message: 'Du kannst dich nicht selbst deaktivieren' })
      }

      await connection.execute(
        `UPDATE benutzer SET vorname = ?, nachname = ?, rolle_id = ?, ist_aktiv = ?
         WHERE id = ?`,
        [vorname, nachname, rolle_id, ist_aktiv, id]
      )

      // Audit Log
      await connection.execute(
        'INSERT INTO audit_log (benutzer_id, aktion, tabelle, datensatz_id) VALUES (?, ?, ?, ?)',
        [req.user.id, 'benutzer.updated', 'benutzer', id]
      )

      console.log(`✅ [UPDATE USER] Benutzer ${id} aktualisiert`)
      res.json({ message: 'Benutzer aktualisiert' })
    } catch (error) {
      console.error('❌ Update user error:', error)
      res.status(500).json({ message: 'Fehler beim Aktualisieren des Benutzers' })
    } finally {
      connection.release()
    }
  }
)

// ================================================================
// 7. DELETE USER (Admin only)
// ================================================================
router.delete('/users/:id', 
  authenticateToken, 
  requireRole(1),
  rateLimit(5, 60000),
  async (req, res) => {
    const connection = await getConnection()

    try {
      const { id } = req.params

      if (id == req.user.id) {
        return res.status(400).json({ message: 'Du kannst dich nicht selbst löschen' })
      }

      // Benutzer vor dem Löschen holen
      const [users] = await connection.execute(
        'SELECT email, vorname, nachname FROM benutzer WHERE id = ?',
        [id]
      )

      if (users.length === 0) {
        return res.status(404).json({ message: 'Benutzer nicht gefunden' })
      }

      await connection.execute('DELETE FROM benutzer WHERE id = ?', [id])

      // Audit Log
      await connection.execute(
        'INSERT INTO audit_log (benutzer_id, aktion, tabelle, datensatz_id) VALUES (?, ?, ?, ?)',
        [req.user.id, 'benutzer.deleted', 'benutzer', id]
      )

      console.log(`✅ [DELETE USER] ${users[0].email} gelöscht`)
      res.json({ message: 'Benutzer gelöscht' })
    } catch (error) {
      console.error('❌ Delete user error:', error)
      res.status(500).json({ message: 'Fehler beim Löschen des Benutzers' })
    } finally {
      connection.release()
    }
  }
)

// ================================================================
// 8. CHANGE PASSWORD
// ================================================================
router.post('/change-password', 
  authenticateToken, 
  rateLimit(5, 60000),
  async (req, res) => {
    const connection = await getConnection()

    try {
      const { oldPassword, newPassword } = req.body

      if (!oldPassword || !newPassword) {
        return res.status(400).json({ message: 'Alte und neue Passwörter erforderlich' })
      }

      if (newPassword.length < 6) {
        return res.status(400).json({ message: 'Passwort muss mindestens 6 Zeichen lang sein' })
      }

      // Benutzer laden
      const [users] = await connection.execute(
        'SELECT passwort FROM benutzer WHERE id = ?',
        [req.user.id]
      )

      if (users.length === 0) {
        return res.status(404).json({ message: 'Benutzer nicht gefunden' })
      }

      // Altes Passwort überprüfen
      const isPasswordValid = await bcrypt.compare(oldPassword, users[0].passwort)

      if (!isPasswordValid) {
        return res.status(401).json({ message: 'Altes Passwort falsch' })
      }

      // Neues Passwort hashen
      const hashedPassword = await bcrypt.hash(newPassword, 10)

      // Passwort aktualisieren
      await connection.execute(
        'UPDATE benutzer SET passwort = ? WHERE id = ?',
        [hashedPassword, req.user.id]
      )

      // Audit Log
      await connection.execute(
        'INSERT INTO audit_log (benutzer_id, aktion) VALUES (?, ?)',
        [req.user.id, 'password.changed']
      )

      console.log(`✅ [PASSWORD CHANGED] ${req.user.email}`)
      res.json({ message: 'Passwort geändert' })
    } catch (error) {
      console.error('❌ Change password error:', error)
      res.status(500).json({ message: 'Fehler beim Ändern des Passworts' })
    } finally {
      connection.release()
    }
  }
)

// ================================================================
// 9. FORGOT PASSWORD
// ================================================================
router.post('/forgot-password', 
  rateLimit(3, 60000),
  async (req, res) => {
    const connection = await getConnection()

    try {
      const { email } = req.body

      if (!email) {
        return res.status(400).json({ message: 'Email erforderlich' })
      }

      // Benutzer suchen
      const [users] = await connection.execute(
        'SELECT id, email, vorname FROM benutzer WHERE email = ?',
        [email]
      )

      // Sicherheit: Antworte immer gleich
      if (users.length === 0) {
        return res.json({ message: 'Wenn diese Email registriert ist, erhält sie einen Reset-Link' })
      }

      const user = users[0]

      // Reset-Token generieren
      const resetToken = crypto.randomBytes(32).toString('hex')
      const resetTokenHash = await bcrypt.hash(resetToken, 10)
      const resetTokenExpiry = new Date(Date.now() + 1800000) // 30 Minuten

      // Token in DB speichern
      await connection.execute(
        `UPDATE benutzer SET reset_token = ?, reset_token_expires = ? WHERE id = ?`,
        [resetTokenHash, resetTokenExpiry, user.id]
      )

      // Reset-Link generieren
      const resetLink = `http://localhost:3000/reset-password?token=${resetToken}`

      // E-Mail senden
      try {
        await transporter.sendMail({
          from: process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER,
          to: email,
          subject: 'Passwort zurücksetzen - Versicherungsbroker',
          html: `
            <h2>Passwort zurücksetzen</h2>
            <p>Hallo ${user.vorname},</p>
            <p>Du hast eine Anfrage zum Zurücksetzen deines Passworts gestellt.</p>
            <p>Dieser Link ist <strong>30 Minuten</strong> gültig:</p>
            <p><a href="${resetLink}" style="background: #1e40af; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; display: inline-block;">Passwort zurücksetzen</a></p>
            <p><strong>Oder kopiere diesen Link:</strong></p>
            <p><code>${resetLink}</code></p>
            <hr>
            <p>Wenn du diese Anfrage nicht gestellt hast, ignoriere diese E-Mail.</p>
          `
        })
        console.log(`✅ [EMAIL] Password Reset E-Mail an ${email} versendet`)
      } catch (emailError) {
        console.error('❌ Email senden fehlgeschlagen:', emailError.message)
      }

      // Audit Log
      await connection.execute(
        'INSERT INTO audit_log (benutzer_id, aktion) VALUES (?, ?)',
        [user.id, 'password.reset_requested']
      )

      res.json({ message: 'Wenn diese Email registriert ist, erhält sie einen Reset-Link' })
    } catch (error) {
      console.error('❌ Forgot password error:', error)
      res.status(500).json({ message: 'Fehler beim Passwort-Reset' })
    } finally {
      connection.release()
    }
  }
)

// ================================================================
// 10. RESET PASSWORD
// ================================================================
router.post('/reset-password', 
  rateLimit(5, 60000),
  async (req, res) => {
    const connection = await getConnection()

    try {
      const { token, newPassword } = req.body

      if (!token || !newPassword) {
        return res.status(400).json({ message: 'Token und neues Passwort erforderlich' })
      }

      if (newPassword.length < 6) {
        return res.status(400).json({ message: 'Passwort muss mindestens 6 Zeichen lang sein' })
      }

      // Alle Benutzer mit gültigen Reset-Token suchen
      const [users] = await connection.execute(
        'SELECT id, reset_token FROM benutzer WHERE reset_token_expires > NOW()'
      )

      let foundUser = null
      for (const user of users) {
        const isValid = await bcrypt.compare(token, user.reset_token)
        if (isValid) {
          foundUser = user
          break
        }
      }

      if (!foundUser) {
        return res.status(400).json({ message: 'Reset-Token ungültig oder abgelaufen' })
      }

      // Neues Passwort hashen
      const hashedPassword = await bcrypt.hash(newPassword, 10)

      // Passwort aktualisieren und Token löschen
      await connection.execute(
        `UPDATE benutzer SET passwort = ?, reset_token = NULL, reset_token_expires = NULL
         WHERE id = ?`,
        [hashedPassword, foundUser.id]
      )

      // Audit Log
      await connection.execute(
        'INSERT INTO audit_log (benutzer_id, aktion) VALUES (?, ?)',
        [foundUser.id, 'password.reset_completed']
      )

      console.log(`✅ [PASSWORD RESET] Erfolgreich für Benutzer ${foundUser.id}`)
      res.json({ message: 'Passwort erfolgreich zurückgesetzt' })
    } catch (error) {
      console.error('❌ Reset password error:', error)
      res.status(500).json({ message: 'Fehler beim Zurücksetzen des Passworts' })
    } finally {
      connection.release()
    }
  }
)

// ================================================================
// 11. GET ROLES
// ================================================================
router.get('/roles', authenticateToken, async (req, res) => {
  const connection = await getConnection()

  try {
    const [roles] = await connection.execute(
      'SELECT id, name, beschreibung, prioritaet FROM rollen ORDER BY prioritaet ASC'
    )

    res.json(roles)
  } catch (error) {
    console.error('❌ Get roles error:', error)
    res.status(500).json({ message: 'Fehler beim Abrufen der Rollen' })
  } finally {
    connection.release()
  }
})

// ================================================================
// 12. AUDIT LOG (Admin only)
// ================================================================
router.get('/audit-log', 
  authenticateToken, 
  requireRole(1),
  async (req, res) => {
    const connection = await getConnection()

    try {
      const limit = req.query.limit || 100
      const offset = req.query.offset || 0

      const [logs] = await connection.execute(
        `SELECT al.*, b.email as benutzer_email
         FROM audit_log al
         LEFT JOIN benutzer b ON al.benutzer_id = b.id
         ORDER BY al.created_at DESC
         LIMIT ? OFFSET ?`,
        [parseInt(limit), parseInt(offset)]
      )

      const [total] = await connection.execute(
        'SELECT COUNT(*) as count FROM audit_log'
      )

      res.json({
        logs,
        total: total[0].count,
        limit: parseInt(limit),
        offset: parseInt(offset)
      })
    } catch (error) {
      console.error('❌ Get audit log error:', error)
      res.status(500).json({ message: 'Fehler beim Abrufen des Audit-Logs' })
    } finally {
      connection.release()
    }
  }
)

export default router