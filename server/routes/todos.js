import express from 'express'
import { getConnection } from '../database.js'

const router = express.Router()

router.get('/', async (req, res) => {
  const connection = await getConnection()
  try {
    const { status, zugewiesen_zu, kunde_id } = req.query
    
    let query = `
      SELECT t.*, k.vorname, k.nachname, v.name as versicherer_name, u.username as zugewiesen_user
      FROM todos t
      LEFT JOIN kunden k ON t.kunde_id = k.id
      LEFT JOIN versicherer v ON t.versicherer_id = v.id
      LEFT JOIN users u ON t.zugewiesen_zu = u.id
      WHERE 1=1
    `
    const params = []
    
    if (status) {
      query += ' AND t.status = ?'
      params.push(status)
    }
    if (zugewiesen_zu) {
      query += ' AND t.zugewiesen_zu = ?'
      params.push(zugewiesen_zu)
    }
    if (kunde_id) {
      query += ' AND t.kunde_id = ?'
      params.push(kunde_id)
    }
    
    query += ' ORDER BY t.faellig_am ASC, t.prioritaet DESC'
    
    const [rows] = await connection.execute(query, params)
    res.json(rows)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Error fetching todos', error: error.message })
  } finally {
    connection.release()
  }
})

router.post('/', async (req, res) => {
  const connection = await getConnection()
  try {
    const { beschreibung, faellig_am, prioritaet, status, tracking_activity_id, kunde_id, versicherer_id, zugewiesen_zu, erstellt_von } = req.body
    
    if (!beschreibung) {
      return res.status(400).json({ message: 'Beschreibung ist erforderlich' })
    }
    
    const [result] = await connection.execute(
      `INSERT INTO todos 
       (beschreibung, faellig_am, prioritaet, status, tracking_activity_id, kunde_id, versicherer_id, zugewiesen_zu, erstellt_von)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [beschreibung, faellig_am || null, prioritaet || 'Normal', status || 'Offen', tracking_activity_id || null, kunde_id || null, versicherer_id || null, zugewiesen_zu || null, erstellt_von || 1]
    )
    
    res.json({ id: result.insertId, message: 'Todo erstellt' })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Fehler beim Erstellen des Todos', error: error.message })
  } finally {
    connection.release()
  }
})

router.get('/:id', async (req, res) => {
  const connection = await getConnection()
  try {
    const { id } = req.params
    const [rows] = await connection.execute(
      `SELECT t.*, k.vorname, k.nachname, v.name as versicherer_name, u.username as zugewiesen_user
       FROM todos t
       LEFT JOIN kunden k ON t.kunde_id = k.id
       LEFT JOIN versicherer v ON t.versicherer_id = v.id
       LEFT JOIN users u ON t.zugewiesen_zu = u.id
       WHERE t.id = ?`,
      [id]
    )
    
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Todo nicht gefunden' })
    }
    
    res.json(rows[0])
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Error fetching todo', error: error.message })
  } finally {
    connection.release()
  }
})

router.put('/:id', async (req, res) => {
  const connection = await getConnection()
  try {
    const { id } = req.params
    const { beschreibung, faellig_am, prioritaet, status, zugewiesen_zu } = req.body
    
    if (!beschreibung) {
      return res.status(400).json({ message: 'Beschreibung ist erforderlich' })
    }
    
    let erledigt_am = null
    if (status === 'Erledigt') {
      erledigt_am = new Date()
    }
    
    const [result] = await connection.execute(
      `UPDATE todos SET 
       beschreibung = ?, faellig_am = ?, prioritaet = ?, status = ?, zugewiesen_zu = ?, erledigt_am = ?
       WHERE id = ?`,
      [beschreibung, faellig_am || null, prioritaet || 'Normal', status || 'Offen', zugewiesen_zu || null, erledigt_am, id]
    )
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Todo nicht gefunden' })
    }
    
    res.json({ id, message: 'Todo aktualisiert' })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Fehler beim Aktualisieren des Todos', error: error.message })
  } finally {
    connection.release()
  }
})

router.delete('/:id', async (req, res) => {
  const connection = await getConnection()
  try {
    const { id } = req.params
    const [result] = await connection.execute(
      'DELETE FROM todos WHERE id = ?',
      [id]
    )
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Todo nicht gefunden' })
    }
    
    res.json({ message: 'Todo gelöscht' })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Fehler beim Löschen des Todos', error: error.message })
  } finally {
    connection.release()
  }
})

router.get('/kunde/:kundeId', async (req, res) => {
  const connection = await getConnection()
  try {
    const { kundeId } = req.params
    const [rows] = await connection.execute(
      `SELECT t.*, v.name as versicherer_name, u.username as zugewiesen_user
       FROM todos t
       LEFT JOIN versicherer v ON t.versicherer_id = v.id
       LEFT JOIN users u ON t.zugewiesen_zu = u.id
       WHERE t.kunde_id = ? AND t.status != 'Erledigt'
       ORDER BY t.faellig_am ASC`,
      [kundeId]
    )
    res.json(rows)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Error fetching todos', error: error.message })
  } finally {
    connection.release()
  }
})

router.get('/stats/dashboard', async (req, res) => {
  const connection = await getConnection()
  try {
    const [stats] = await connection.execute(`
      SELECT 
        COUNT(CASE WHEN status = 'Offen' THEN 1 END) as offen,
        COUNT(CASE WHEN status = 'In Bearbeitung' THEN 1 END) as in_bearbeitung,
        COUNT(CASE WHEN status = 'Erledigt' THEN 1 END) as erledigt,
        COUNT(CASE WHEN prioritaet = 'Dringend' AND status != 'Erledigt' THEN 1 END) as dringend,
        COUNT(CASE WHEN faellig_am <= CURDATE() AND status != 'Erledigt' THEN 1 END) as ueberfaellig
      FROM todos
    `)
    res.json(stats[0])
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Error fetching stats', error: error.message })
  } finally {
    connection.release()
  }
})

export default router