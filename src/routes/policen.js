import express from 'express'
import { verifyToken } from '../middleware/auth.js'
import { logMutations } from '../utils/mutations.js'

const router = express.Router()

/**
 * PUT /api/policen/:id
 * Police aktualisieren + Mutations loggen
 */
router.put('/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params
    const updates = req.body
    const userId = req.userId // Aus verifyToken Middleware
    const userName = req.userName || 'System'

    const connection = await req.pool.getConnection()

    // 1. ALTE WERTE LADEN
    const [oldPoliceRows] = await connection.query(
      'SELECT * FROM policen WHERE id = ?',
      [id]
    )

    if (oldPoliceRows.length === 0) {
      connection.release()
      return res.status(404).json({ error: 'Police nicht gefunden' })
    }

    const oldPolice = oldPoliceRows[0]

    // 2. UPDATE MACHEN
    const columns = Object.keys(updates).filter(key => key !== 'id')
    if (columns.length === 0) {
      connection.release()
      return res.status(400).json({ error: 'Keine Felder zum Aktualisieren' })
    }

    const setClause = columns.map(col => `${col} = ?`).join(', ')
    const values = columns.map(col => updates[col])
    values.push(id)

    const updateQuery = `UPDATE policen SET ${setClause} WHERE id = ?`
    await connection.query(updateQuery, values)

    // 3. MUTATIONS LOGGEN
    try {
      await logMutations(
        req.pool,
        id,
        oldPolice,
        updates,
        userId,
        userName
      )
    } catch (mutationErr) {
      console.warn('⚠️ Mutation-Logging fehlgeschlagen, aber Update erfolgreich:', mutationErr)
      // Nicht kritisch - Update war erfolgreich
    }

    // 4. AKTUALISIERTE POLICE ZURÜCKGEBEN
    const [updatedRows] = await connection.query(
      'SELECT * FROM policen WHERE id = ?',
      [id]
    )

    connection.release()

    res.json({
      success: true,
      message: 'Police aktualisiert',
      police: updatedRows[0]
    })
  } catch (err) {
    console.error('❌ Fehler beim Aktualisieren der Police:', err)
    res.status(500).json({ error: 'Fehler beim Aktualisieren der Police' })
  }
})

/**
 * POST /api/policen
 * Neue Police erstellen + Initial-Mutation
 */
router.post('/', verifyToken, async (req, res) => {
  try {
    const data = req.body
    const userId = req.userId
    const userName = req.userName || 'System'

    const connection = await req.pool.getConnection()

    const columns = Object.keys(data)
    const placeholders = columns.map(() => '?').join(',')
    const values = columns.map(col => data[col])

    await connection.query(
      `INSERT INTO policen (${columns.join(',')}) VALUES (${placeholders})`,
      values
    )

    // Neue Police-ID abrufen
    const [result] = await connection.query(
      'SELECT LAST_INSERT_ID() as id'
    )
    const policeId = result[0].id

    // Initial-Mutation loggen
    try {
      await logMutations(
        req.pool,
        policeId,
        {}, // Keine alten Werte
        data,
        userId,
        userName
      )
    } catch (mutationErr) {
      console.warn('⚠️ Mutation-Logging fehlgeschlagen:', mutationErr)
    }

    connection.release()

    res.status(201).json({
      success: true,
      message: 'Police erstellt',
      police: { id: policeId, ...data }
    })
  } catch (err) {
    console.error('❌ Fehler beim Erstellen der Police:', err)
    res.status(500).json({ error: 'Fehler beim Erstellen der Police' })
  }
})

export default router