// ========================================================
// routes/policeDateien.js - Dateien-Verwaltung
// ========================================================

import express from 'express'
import db from '../database.js'
import { authenticateToken } from '../middleware/auth.js'

const router = express.Router()

// ========================================================
// 1. GET /api/policen/:id/dateien - Alle Dateien - OHNE Auth
// ========================================================
router.get('/:id/dateien', async (req, res) => {
  try {
    const { id: policeId } = req.params
    const { page = 1 } = req.query
    const itemsPerPage = 5
    const offset = (page - 1) * itemsPerPage

    // Zähle Gesamtanzahl
    const [countResult] = await db.query(
      'SELECT COUNT(*) as total FROM police_dateien WHERE police_id = ?',
      [policeId]
    )
    const total = countResult[0].total
    const totalPages = Math.ceil(total / itemsPerPage)

    // Hole Dateien mit Pagination
    const [dateien] = await db.query(
      `SELECT * FROM police_dateien 
       WHERE police_id = ? 
       ORDER BY created_at DESC 
       LIMIT ? OFFSET ?`,
      [policeId, itemsPerPage, offset]
    )

    res.json({
      data: dateien,
      pagination: {
        page: parseInt(page),
        itemsPerPage,
        total,
        totalPages
      }
    })
  } catch (error) {
    console.error('❌ GET /api/policen/:id/dateien:', error.message)
    res.status(500).json({ error: error.message })
  }
})

// ========================================================
// 2. POST /api/policen/:id/dateien - Datei hinzufügen - MIT Auth
// ========================================================
router.post('/:id/dateien', authenticateToken, async (req, res) => {
  try {
    const { id: policeId } = req.params
    const { kategorie, beschreibung, url } = req.body

    // Validierung
    if (!kategorie || !url) {
      return res.status(400).json({
        error: 'Pflichtfelder: kategorie, url'
      })
    }

    if (kategorie === 'Sonstige' && !beschreibung) {
      return res.status(400).json({
        error: 'Bei "Sonstige" ist die Beschreibung erforderlich'
      })
    }

    // Police existiert?
    const [policeCheck] = await db.query(
      'SELECT id FROM policen WHERE id = ?',
      [policeId]
    )
    if (!policeCheck[0]) {
      return res.status(404).json({ error: 'Police nicht gefunden' })
    }

    // Datei hinzufügen
    const sql = `
      INSERT INTO police_dateien (police_id, kategorie, beschreibung, url)
      VALUES (?, ?, ?, ?)
    `
    const result = await db.query(sql, [
      policeId,
      kategorie,
      beschreibung || null,
      url
    ])

    // Neue Datei zurückgeben
    const [newDatei] = await db.query(
      'SELECT * FROM police_dateien WHERE id = ?',
      [result.insertId]
    )

    res.status(201).json(newDatei[0])
  } catch (error) {
    console.error('❌ POST /api/policen/:id/dateien:', error.message)
    res.status(500).json({ error: error.message })
  }
})

// ========================================================
// 3. DELETE /api/policen/:id/dateien/:dateiId - MIT Auth
// ========================================================
router.delete('/:id/dateien/:dateiId', authenticateToken, async (req, res) => {
  try {
    const { id: policeId, dateiId } = req.params

    // Prüfe ob Datei existiert und zur Police gehört
    const [dateiCheck] = await db.query(
      'SELECT id FROM police_dateien WHERE id = ? AND police_id = ?',
      [dateiId, policeId]
    )
    if (!dateiCheck[0]) {
      return res.status(404).json({ error: 'Datei nicht gefunden' })
    }

    // Lösche Datei
    await db.query('DELETE FROM police_dateien WHERE id = ?', [dateiId])

    res.json({ message: 'Datei gelöscht', id: dateiId })
  } catch (error) {
    console.error('❌ DELETE /api/policen/:id/dateien/:dateiId:', error.message)
    res.status(500).json({ error: error.message })
  }
})

// ========================================================
// 4. PUT /api/policen/:id/archiv - MIT Auth
// ========================================================
router.put('/:id/archiv', authenticateToken, async (req, res) => {
  try {
    const { id: policeId } = req.params
    const { archiv_url } = req.body

    // Police existiert?
    const [policeCheck] = await db.query(
      'SELECT id FROM policen WHERE id = ?',
      [policeId]
    )
    if (!policeCheck[0]) {
      return res.status(404).json({ error: 'Police nicht gefunden' })
    }

    // Update archiv_url
    await db.query(
      'UPDATE policen SET archiv_url = ?, updated_at = NOW() WHERE id = ?',
      [archiv_url || null, policeId]
    )

    // Gebe aktualisierte Police zurück
    const [updatedPolice] = await db.query(
      'SELECT * FROM policen WHERE id = ?',
      [policeId]
    )

    res.json(updatedPolice[0])
  } catch (error) {
    console.error('❌ PUT /api/policen/:id/archiv:', error.message)
    res.status(500).json({ error: error.message })
  }
})

export default router