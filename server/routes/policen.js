import express from 'express'
import { authenticateToken } from '../middleware/auth.js'
import { logMutations } from '../utils/mutations.js'

const router = express.Router()

/**
 * GET /api/policen
 */
router.get('/', async (req, res) => {
  try {
    const { kunde_id } = req.query
    const connection = await req.pool.getConnection()

    let query = `
      SELECT 
        p.*,
        s.name as sparten_name,
        v.name as versicherer_name
      FROM policen p
      LEFT JOIN sparten s ON p.sparte_id = s.id
      LEFT JOIN versicherer v ON p.versicherer_id = v.id
    `
    let params = []

    if (kunde_id) {
      query += ' WHERE p.kunde_id = ?'
      params.push(kunde_id)
    }

    query += ' ORDER BY p.created_at DESC'

    const [rows] = await connection.query(query, params)
    connection.release()

    res.json(rows || [])
  } catch (err) {
    console.error('Fehler beim Abrufen der Policen:', err)
    res.status(500).json({ error: 'Fehler beim Abrufen der Policen' })
  }
})

/**
 * GET /api/policen/:id
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const connection = await req.pool.getConnection()

    const [rows] = await connection.query(
      `
      SELECT 
        p.*,
        s.name as sparten_name,
        v.name as versicherer_name
      FROM policen p
      LEFT JOIN sparten s ON p.sparte_id = s.id
      LEFT JOIN versicherer v ON p.versicherer_id = v.id
      WHERE p.id = ?
      `,
      [id]
    )

    connection.release()

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Police nicht gefunden' })
    }

    res.json(rows[0])
  } catch (err) {
    console.error('Fehler beim Abrufen der Police:', err)
    res.status(500).json({ error: 'Fehler beim Abrufen der Police' })
  }
})

/**
 * POST /api/policen
 */
router.post('/', authenticateToken, async (req, res) => {
  try {
    const data = req.body
    const userId = req.user?.id || null
    const userName = req.user?.name || 'System'

    if (!data.kunde_id || !data.policennummer) {
      return res.status(400).json({ error: 'Pflichtfelder: kunde_id, policennummer' })
    }

    const invalidColumns = [
      'kundentyp', 'zahlungsart', 'branche_id', 'status', 
      'jkr', 'waehrung', 'total', 'sparten_name', 'versicherer_name',
      'created_at', 'updated_at'
    ]

    const connection = await req.pool.getConnection()

    const columns = Object.keys(data)
      .filter(key => key !== 'id' && !invalidColumns.includes(key))
    
    // NICHT konvertieren - DATE Spalten brauchen nur YYYY-MM-DD!
    const placeholders = columns.map(() => '?').join(',')
    const values = columns.map(col => data[col])

    await connection.query(
      `INSERT INTO policen (${columns.join(',')}) VALUES (${placeholders})`,
      values
    )

    const [result] = await connection.query('SELECT LAST_INSERT_ID() as id')
    const policeId = result[0].id

    // ========================================
    // NEU: Erstelle automatisch Risiken für Sach-Policen
    // ========================================
    if (parseInt(data.sparte_id) === 8) {
      console.log('🔧 Erstelle Standard-Risiken für Sach-Police:', policeId)
      
      try {
        // Grundversicherung (8 Risiken)
        await connection.query('CALL create_default_grundversicherung(?)', [policeId])
        console.log('✅ Grundversicherung-Risiken erstellt (8 Risiken)')
        
        // Betriebsunterbruch (5 Risiken)
        await connection.query('CALL create_default_betriebsunterbruch(?)', [policeId])
        console.log('✅ Betriebsunterbruch-Risiken erstellt (5 Risiken)')
      } catch (procError) {
        console.error('⚠️ Fehler beim Erstellen der Standard-Risiken:', procError.message)
        // Nicht kritisch - Police wurde bereits erstellt
      }
    }

    try {
      await logMutations(req.pool, policeId, {}, data, userId, userName)
    } catch (mutationErr) {
      console.warn('Mutation-Logging fehlgeschlagen:', mutationErr)
    }

    connection.release()

    res.status(201).json({
      success: true,
      message: 'Police erstellt',
      police: { id: policeId, ...data }
    })
  } catch (err) {
    console.error('Fehler beim Erstellen der Police:', err)
    res.status(500).json({ error: 'Fehler beim Erstellen der Police' })
  }
})

/**
 * PUT /api/policen/:id
 */
router.put('/:id', authenticateToken, async (req, res) => {
  const connection = await req.pool.getConnection()
  
  try {
    const { id } = req.params
    const updates = req.body
    const userId = req.user?.id || null
    const userName = req.user?.name || 'System'

    console.log(`[PUT] Starte Update für Police ${id}`)

    const invalidColumns = [
      'kundentyp', 'zahlungsart', 'branche_id', 'status', 
      'jkr', 'waehrung', 'total', 'sparten_name', 'versicherer_name',
      'created_at', 'updated_at'
    ]

    const [oldPoliceRows] = await connection.query(
      'SELECT * FROM policen WHERE id = ?',
      [id]
    )

    if (oldPoliceRows.length === 0) {
      connection.release()
      return res.status(404).json({ error: 'Police nicht gefunden' })
    }

    const oldPolice = oldPoliceRows[0]
    console.log(`[PUT] Alte Daten geladen`)

    const columns = Object.keys(updates)
      .filter(key => key !== 'id' && !invalidColumns.includes(key))
    
    if (columns.length === 0) {
      connection.release()
      return res.status(400).json({ error: 'Keine gültigen Felder zum Aktualisieren' })
    }

    // NICHT konvertieren - DATE Spalten brauchen nur YYYY-MM-DD!
    const setClause = columns.map(col => `${col} = ?`).join(', ')
    const values = columns.map(col => updates[col])
    values.push(id)

    console.log(`[PUT] Führe UPDATE aus mit ${columns.length} Feldern`)
    const updateQuery = `UPDATE policen SET ${setClause}, updated_at = NOW() WHERE id = ?`
    await connection.query(updateQuery, values)
    console.log(`[PUT] UPDATE erfolgreich`)

    try {
      console.log(`[PUT] Starte Mutation Logging...`)
      await logMutations(req.pool, id, oldPolice, updates, userId, userName)
      console.log(`[PUT] Mutation Logging erfolgreich`)
    } catch (mutationErr) {
      console.warn(`[PUT] ⚠️ Mutation Logging fehlgeschlagen:`, mutationErr.message)
    }

    console.log(`[PUT] Lade aktualisierte Daten...`)
    const [updatedRows] = await connection.query(
      `
      SELECT 
        p.*,
        s.name as sparten_name,
        v.name as versicherer_name
      FROM policen p
      LEFT JOIN sparten s ON p.sparte_id = s.id
      LEFT JOIN versicherer v ON p.versicherer_id = v.id
      WHERE p.id = ?
      `,
      [id]
    )

    connection.release()

    console.log(`✅ [PUT] Police ${id} erfolgreich aktualisiert`)
    res.status(200).json({
      success: true,
      message: 'Police aktualisiert',
      police: updatedRows[0]
    })
  } catch (err) {
    connection.release()
    console.error(`❌ [PUT] Fehler beim Aktualisieren:`, err.message)
    res.status(500).json({ error: 'Fehler beim Aktualisieren der Police: ' + err.message })
  }
})

/**
 * DELETE /api/policen/:id
 */
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params
    const connection = await req.pool.getConnection()

    const [result] = await connection.query(
      'DELETE FROM policen WHERE id = ?',
      [id]
    )

    connection.release()

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Police nicht gefunden' })
    }

    res.json({
      success: true,
      message: 'Police gelöscht'
    })
  } catch (err) {
    console.error('Fehler beim Löschen der Police:', err)
    res.status(500).json({ error: 'Fehler beim Löschen der Police' })
  }
})

export default router