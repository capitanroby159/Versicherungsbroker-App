import express from 'express'
import pool from '../database.js'
import { authenticateToken } from '../middleware/auth.js'

const router = express.Router()

// ========================================
// KATALOG: GET alle verfügbaren Deckungen
// ========================================
router.get('/zusatzdeckungen-katalog', authenticateToken, async (req, res) => {
  try {
    const { versicherer_id, sparte_id } = req.query
    
    let query = `
      SELECT k.*, 
             v.name as versicherer_name,
             s.name as sparte_name
      FROM zusatzdeckungen_katalog k
      LEFT JOIN versicherer v ON k.versicherer_id = v.id
      LEFT JOIN sparten s ON k.sparte_id = s.id
      WHERE k.aktiv = 1
    `
    const params = []
    
    // Filter nach Versicherer (wenn angegeben)
    if (versicherer_id) {
      query += ` AND (k.versicherer_id = ? OR k.versicherer_id IS NULL)`
      params.push(versicherer_id)
    }
    
    // Filter nach Sparte (wenn angegeben)
    if (sparte_id) {
      query += ` AND (k.sparte_id = ? OR k.sparte_id IS NULL)`
      params.push(sparte_id)
    }
    
    query += ` ORDER BY k.kategorie, k.deckung_name`
    
    const [katalog] = await pool.query(query, params)
    res.json(katalog)
  } catch (error) {
    console.error('❌ Fehler beim Abrufen des Katalogs:', error)
    res.status(500).json({ error: error.message })
  }
})

// ========================================
// KATALOG: POST neue Deckung zum Katalog hinzufügen
// ========================================
router.post('/zusatzdeckungen-katalog', authenticateToken, async (req, res) => {
  try {
    const { versicherer_id, sparte_id, deckung_name, kategorie, standard_garantiesumme, standard_selbstbehalt, beschreibung } = req.body
    
    if (!deckung_name) {
      return res.status(400).json({ error: 'Deckungsname ist ein Pflichtfeld' })
    }
    
    const [result] = await pool.query(
      `INSERT INTO zusatzdeckungen_katalog 
       (versicherer_id, sparte_id, deckung_name, kategorie, standard_garantiesumme, standard_selbstbehalt, beschreibung)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        versicherer_id || null,
        sparte_id || null,
        deckung_name,
        kategorie || 'Allgemein',
        standard_garantiesumme || null,
        standard_selbstbehalt || 'Grundselbstbehalt',
        beschreibung || null
      ]
    )
    
    const [newItem] = await pool.query(
      `SELECT k.*, 
              v.name as versicherer_name,
              s.name as sparte_name
       FROM zusatzdeckungen_katalog k
       LEFT JOIN versicherer v ON k.versicherer_id = v.id
       LEFT JOIN sparten s ON k.sparte_id = s.id
       WHERE k.id = ?`,
      [result.insertId]
    )
    
    res.status(201).json(newItem[0])
  } catch (error) {
    console.error('❌ Fehler beim Erstellen der Katalog-Deckung:', error)
    res.status(500).json({ error: error.message })
  }
})

// ========================================
// KATALOG: PUT Katalog-Deckung bearbeiten
// ========================================
router.put('/zusatzdeckungen-katalog/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params
    const { versicherer_id, sparte_id, deckung_name, kategorie, standard_garantiesumme, standard_selbstbehalt, beschreibung } = req.body
    
    await pool.query(
      `UPDATE zusatzdeckungen_katalog 
       SET versicherer_id = ?, 
           sparte_id = ?, 
           deckung_name = ?, 
           kategorie = ?, 
           standard_garantiesumme = ?, 
           standard_selbstbehalt = ?,
           beschreibung = ?
       WHERE id = ?`,
      [
        versicherer_id || null,
        sparte_id || null,
        deckung_name,
        kategorie || 'Allgemein',
        standard_garantiesumme || null,
        standard_selbstbehalt || 'Grundselbstbehalt',
        beschreibung || null,
        id
      ]
    )
    
    const [updated] = await pool.query(
      `SELECT k.*, 
              v.name as versicherer_name,
              s.name as sparte_name
       FROM zusatzdeckungen_katalog k
       LEFT JOIN versicherer v ON k.versicherer_id = v.id
       LEFT JOIN sparten s ON k.sparte_id = s.id
       WHERE k.id = ?`,
      [id]
    )
    
    res.json(updated[0])
  } catch (error) {
    console.error('❌ Fehler beim Aktualisieren der Katalog-Deckung:', error)
    res.status(500).json({ error: error.message })
  }
})

// ========================================
// KATALOG: DELETE Katalog-Deckung löschen
// ========================================
router.delete('/zusatzdeckungen-katalog/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params
    
    // Soft delete - setze auf inaktiv
    await pool.query(
      'UPDATE zusatzdeckungen_katalog SET aktiv = 0 WHERE id = ?',
      [id]
    )
    
    res.json({ success: true })
  } catch (error) {
    console.error('❌ Fehler beim Löschen der Katalog-Deckung:', error)
    res.status(500).json({ error: error.message })
  }
})

// ========================================
// GET alle Zusatzdeckungen für eine Police
// ========================================
router.get('/:policeId/zusatzdeckungen', authenticateToken, async (req, res) => {
  try {
    const { policeId } = req.params
    
    const [deckungen] = await pool.query(
      'SELECT * FROM police_zusatzdeckungen WHERE police_id = ? ORDER BY id ASC',
      [policeId]
    )
    
    res.json(deckungen)
  } catch (error) {
    console.error('❌ Fehler beim Abrufen der Zusatzdeckungen:', error)
    res.status(500).json({ error: error.message })
  }
})

// ========================================
// POST neue Zusatzdeckung hinzufügen
// ========================================
router.post('/:policeId/zusatzdeckungen', authenticateToken, async (req, res) => {
  try {
    const { policeId } = req.params
    const { deckung, garantiesumme, selbstbehalt } = req.body
    
    if (!deckung) {
      return res.status(400).json({ error: 'Deckung ist ein Pflichtfeld' })
    }
    
    const [result] = await pool.query(
      `INSERT INTO police_zusatzdeckungen (police_id, deckung, garantiesumme, selbstbehalt)
       VALUES (?, ?, ?, ?)`,
      [
        policeId, 
        deckung, 
        garantiesumme || null, 
        selbstbehalt || 'Grundselbstbehalt'
      ]
    )
    
    const [newDeckung] = await pool.query(
      'SELECT * FROM police_zusatzdeckungen WHERE id = ?',
      [result.insertId]
    )
    
    res.status(201).json(newDeckung[0])
  } catch (error) {
    console.error('❌ Fehler beim Erstellen der Zusatzdeckung:', error)
    res.status(500).json({ error: error.message })
  }
})

// ========================================
// PUT Zusatzdeckung aktualisieren
// ========================================
router.put('/:policeId/zusatzdeckungen/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params
    const { deckung, garantiesumme, selbstbehalt } = req.body
    
    await pool.query(
      `UPDATE police_zusatzdeckungen 
       SET deckung = ?, garantiesumme = ?, selbstbehalt = ?
       WHERE id = ?`,
      [deckung, garantiesumme || null, selbstbehalt || 'Grundselbstbehalt', id]
    )
    
    const [updated] = await pool.query(
      'SELECT * FROM police_zusatzdeckungen WHERE id = ?',
      [id]
    )
    
    res.json(updated[0])
  } catch (error) {
    console.error('❌ Fehler beim Aktualisieren der Zusatzdeckung:', error)
    res.status(500).json({ error: error.message })
  }
})

// ========================================
// DELETE Zusatzdeckung löschen
// ========================================
router.delete('/:policeId/zusatzdeckungen/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params
    
    await pool.query('DELETE FROM police_zusatzdeckungen WHERE id = ?', [id])
    
    res.json({ success: true })
  } catch (error) {
    console.error('❌ Fehler beim Löschen der Zusatzdeckung:', error)
    res.status(500).json({ error: error.message })
  }
})

export default router