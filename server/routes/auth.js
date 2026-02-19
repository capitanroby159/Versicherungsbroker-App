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

    // ✅ FIX: Tabelle 'users', Spalte 'password', 'is_active' → 'ist_aktiv'
    const [users] = await connection.execute(
      `SELECT u.*, r.name as rolle_name 
       FROM users u
       LEFT JOIN rollen r ON u.rolle_id = r.id
       WHERE u.email = ?`,
      [email]
    )

    if (users.length === 0) {
      return res.status(401).json({ message: 'Benutzer nicht gefunden' })
    }

    const user = users[0]

    // ✅ FIX: Spalte 'password'
    const isValid = await bcrypt.compare(passwort, user.password)

    if (!isValid) {
      return res.status(401).json({ message: 'Passwort falsch' })
    }

    // ✅ FIX: Spalte 'ist_aktiv'
    if (!user.ist_aktiv) {
      return res.status(401).json({ message: 'Benutzer ist deaktiviert' })
    }

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        rolle_id: user.rolle_id,
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    )

    // ✅ FIX: Tabelle 'users'
    await connection.execute(
      'UPDATE users SET letzter_login = NOW() WHERE id = ?',
      [user.id]
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
  try {
    console.log(`✅ [LOGOUT] ${req.user.email}`)
    res.json({ message: 'Logout erfolgreich' })
  } catch (error) {
    console.error('❌ Logout error:', error)
    res.status(500).json({ message: 'Fehler beim Logout' })
  }
})

// ================================================================
// 3. GET CURRENT USER
// ================================================================
router.get('/me', authenticateToken, async (req, res) => {
  const connection = await getConnection()

  try {
    // ✅ FIX: Tabelle 'users'
    const [users] = await connection.execute(
      `SELECT u.id, u.email, u.vorname, u.nachname, u.username, u.rolle_id, 
              u.ist_aktiv, u.letzter_login, r.name as rolle_name
       FROM users u
       LEFT JOIN rollen r ON u.rolle_id = r.id
       WHERE u.id = ?`,
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
      // ✅ FIX: Tabelle 'users'
      const [users] = await connection.execute(
        `SELECT u.id, u.email, u.vorname, u.nachname, u.rolle_id, 
                u.ist_aktiv, u.letzter_login, u.created_at, r.name as rolle_name
         FROM users u
         LEFT JOIN rollen r ON u.rolle_id = r.id
         ORDER BY u.created_at DESC`
      )

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

      // ✅ FIX: Tabelle 'users'
      const [existing] = await connection.execute(
        'SELECT id FROM users WHERE email = ?',
        [email]
      )

      if (existing.length > 0) {
        return res.status(400).json({ message: 'Email existiert bereits' })
      }

      const tempPassword = crypto.randomBytes(8).toString('hex')
      const hashedPassword = await bcrypt.hash(tempPassword, 10)
      const usernameValue = `${vorname}.${nachname}`.toLowerCase().replace(/\s/g, '')

      // ✅ FIX: Tabelle 'users', Spalte 'password'
      const [result] = await connection.execute(
        `INSERT INTO users (username, email, password, vorname, nachname, rolle_id, ist_aktiv)
         VALUES (?, ?, ?, ?, ?, ?, 1)`,
        [usernameValue, email, hashedPassword, vorname, nachname, rolle_id || 2]
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
          `
        })
      } catch (emailError) {
        console.error('❌ Email senden fehlgeschlagen:', emailError.message)
      }

      console.log(`✅ [CREATE USER] ${vorname} ${nachname} (${email}) erstellt`)
      res.status(201).json({
        message: 'Benutzer erstellt.',
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

      if (id == req.user.id && !ist_aktiv) {
        return res.status(400).json({ message: 'Du kannst dich nicht selbst deaktivieren' })
      }

      // ✅ FIX: Tabelle 'users'
      await connection.execute(
        `UPDATE users SET vorname = ?, nachname = ?, rolle_id = ?, ist_aktiv = ?
         WHERE id = ?`,
        [vorname, nachname, rolle_id, ist_aktiv, id]
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

      // ✅ FIX: Tabelle 'users'
      const [users] = await connection.execute(
        'SELECT email, vorname, nachname FROM users WHERE id = ?',
        [id]
      )

      if (users.length === 0) {
        return res.status(404).json({ message: 'Benutzer nicht gefunden' })
      }

      // Soft delete statt löschen
      await connection.execute('UPDATE users SET ist_aktiv = 0 WHERE id = ?', [id])

      console.log(`✅ [DELETE USER] ${users[0].email} deaktiviert`)
      res.json({ message: 'Benutzer deaktiviert' })
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

      // ✅ FIX: Tabelle 'users', Spalte 'password'
      const [users] = await connection.execute(
        'SELECT password FROM users WHERE id = ?',
        [req.user.id]
      )

      if (users.length === 0) {
        return res.status(404).json({ message: 'Benutzer nicht gefunden' })
      }

      const isPasswordValid = await bcrypt.compare(oldPassword, users[0].password)

      if (!isPasswordValid) {
        return res.status(401).json({ message: 'Altes Passwort falsch' })
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10)

      // ✅ FIX: Tabelle 'users', Spalte 'password'
      await connection.execute(
        'UPDATE users SET password = ? WHERE id = ?',
        [hashedPassword, req.user.id]
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
// 9. GET ROLES
// ================================================================
router.get('/roles', authenticateToken, async (req, res) => {
  const connection = await getConnection()

  try {
    const [roles] = await connection.execute(
      'SELECT id, name FROM rollen ORDER BY id ASC'
    )
    res.json(roles)
  } catch (error) {
    console.error('❌ Get roles error:', error)
    res.status(500).json({ message: 'Fehler beim Abrufen der Rollen' })
  } finally {
    connection.release()
  }
})

export default router