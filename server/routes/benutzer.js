import express from 'express'
import { getConnection } from '../database.js'
import bcrypt from 'bcrypt'

const router = express.Router()

// ============================================================
// GET: ALLE BENUTZER (für Dropdowns und Admin)
// ============================================================
router.get('/', async (req, res) => {
  const connection = await getConnection()
  try {
    const { alle } = req.query

    let query = `
      SELECT 
        u.id,
        u.username,
        u.vorname,
        u.nachname,
        u.email,
        u.funktion,
        u.stundenansatz,
        u.ist_aktiv,
        u.rolle_id,
        r.name AS rolle_name,
        u.letzter_login,
        u.created_at,
        CONCAT(COALESCE(u.vorname, ''), ' ', COALESCE(u.nachname, '')) AS vollname
      FROM users u
      LEFT JOIN rollen r ON u.rolle_id = r.id
    `
    if (!alle) query += ' WHERE u.ist_aktiv = 1'
    query += ' ORDER BY u.nachname ASC, u.vorname ASC'

    const [rows] = await connection.execute(query)
    res.json(rows)
  } catch (error) {
    console.error('❌ Fehler:', error)
    res.status(500).json({ message: 'Fehler beim Laden', error: error.message })
  } finally {
    connection.release()
  }
})

// ============================================================
// GET: ROLLEN (für Dropdowns) — MUSS VOR /:id stehen!
// ============================================================
router.get('/meta/rollen', async (req, res) => {
  const connection = await getConnection()
  try {
    const [rows] = await connection.execute('SELECT id, name FROM rollen ORDER BY id')
    res.json(rows)
  } catch (error) {
    res.status(500).json({ message: 'Fehler', error: error.message })
  } finally {
    connection.release()
  }
})

// ============================================================
// GET: EINZELNER BENUTZER
// ============================================================
router.get('/:id', async (req, res) => {
  const connection = await getConnection()
  try {
    const { id } = req.params
    const [rows] = await connection.execute(
      `SELECT u.id, u.username, u.vorname, u.nachname, u.email, u.funktion, u.stundenansatz,
              u.ist_aktiv, u.rolle_id, r.name AS rolle_name, u.letzter_login, u.created_at
       FROM users u LEFT JOIN rollen r ON u.rolle_id = r.id WHERE u.id = ?`,
      [id]
    )
    if (rows.length === 0) return res.status(404).json({ message: 'Benutzer nicht gefunden' })
    res.json(rows[0])
  } catch (error) {
    console.error('❌ Fehler:', error)
    res.status(500).json({ message: 'Fehler beim Laden', error: error.message })
  } finally {
    connection.release()
  }
})

// ============================================================
// POST: NEUER BENUTZER
// ============================================================
router.post('/', async (req, res) => {
  const connection = await getConnection()
  try {
    const { vorname, nachname, username, email, passwort, funktion, stundenansatz, rolle_id } = req.body

    if (!email || !passwort) {
      return res.status(400).json({ message: 'Email und Passwort sind erforderlich' })
    }

    // Email-Check
    const [existing] = await connection.execute('SELECT id FROM users WHERE email = ?', [email])
    if (existing.length > 0) {
      return res.status(409).json({ message: 'Diese E-Mail-Adresse wird bereits verwendet' })
    }

    const hashedPassword = await bcrypt.hash(passwort, 10)

    // username aus vorname+nachname generieren falls nicht angegeben
    const usernameValue = username || `${vorname || ''}.${nachname || ''}`.toLowerCase().replace(/\s/g, '')

    const [result] = await connection.execute(
      `INSERT INTO users (username, vorname, nachname, email, password, funktion, stundenansatz, rolle_id, ist_aktiv)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)`,
      [
        usernameValue,
        vorname || null,
        nachname || null,
        email,
        hashedPassword,
        funktion || null,
        parseFloat(stundenansatz) || 0,
        rolle_id || 2
      ]
    )

    console.log(`✅ Benutzer erstellt: ${vorname} ${nachname} (ID ${result.insertId})`)
    res.json({ id: result.insertId, message: 'Benutzer erstellt' })
  } catch (error) {
    console.error('❌ Fehler:', error)
    res.status(500).json({ message: 'Fehler beim Erstellen', error: error.message })
  } finally {
    connection.release()
  }
})

// ============================================================
// PUT: BENUTZER BEARBEITEN
// ============================================================
router.put('/:id', async (req, res) => {
  const connection = await getConnection()
  try {
    const { id } = req.params
    const { vorname, nachname, email, funktion, stundenansatz, rolle_id, ist_aktiv, passwort } = req.body

    if (!email) {
      return res.status(400).json({ message: 'Email ist erforderlich' })
    }

    // Email-Check (andere User)
    const [existing] = await connection.execute(
      'SELECT id FROM users WHERE email = ? AND id != ?',
      [email, id]
    )
    if (existing.length > 0) {
      return res.status(409).json({ message: 'Diese E-Mail-Adresse wird bereits verwendet' })
    }

    if (passwort && passwort.trim() !== '') {
      const hashedPassword = await bcrypt.hash(passwort, 10)
      await connection.execute(
        `UPDATE users SET vorname=?, nachname=?, email=?, password=?, funktion=?, 
         stundenansatz=?, rolle_id=?, ist_aktiv=? WHERE id=?`,
        [vorname || null, nachname || null, email, hashedPassword,
         funktion || null, parseFloat(stundenansatz) || 0, rolle_id || 2, ist_aktiv ? 1 : 0, id]
      )
    } else {
      await connection.execute(
        `UPDATE users SET vorname=?, nachname=?, email=?, funktion=?, 
         stundenansatz=?, rolle_id=?, ist_aktiv=? WHERE id=?`,
        [vorname || null, nachname || null, email,
         funktion || null, parseFloat(stundenansatz) || 0, rolle_id || 2, ist_aktiv ? 1 : 0, id]
      )
    }

    console.log(`✅ Benutzer aktualisiert: ID ${id}`)
    res.json({ id, message: 'Benutzer aktualisiert' })
  } catch (error) {
    console.error('❌ Fehler:', error)
    res.status(500).json({ message: 'Fehler beim Aktualisieren', error: error.message })
  } finally {
    connection.release()
  }
})

// ============================================================
// DELETE: BENUTZER DEAKTIVIEREN (Soft Delete)
// ============================================================
router.delete('/:id', async (req, res) => {
  const connection = await getConnection()
  try {
    const { id } = req.params
    const [result] = await connection.execute(
      'UPDATE users SET ist_aktiv = 0 WHERE id = ?',
      [id]
    )

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Benutzer nicht gefunden' })
    }

    console.log(`✅ Benutzer deaktiviert: ID ${id}`)
    res.json({ message: 'Benutzer deaktiviert' })
  } catch (error) {
    console.error('❌ Fehler:', error)
    res.status(500).json({ message: 'Fehler beim Deaktivieren', error: error.message })
  } finally {
    connection.release()
  }
})

export default router