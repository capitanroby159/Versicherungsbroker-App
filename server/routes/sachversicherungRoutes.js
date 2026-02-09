import express from 'express'
import pool from '../database.js'
import { authenticateToken } from '../middleware/auth.js'

const router = express.Router()

// ========================================
// VERSICHERUNGSORTE
// ========================================

// GET alle Versicherungsorte für eine Police
router.get('/:policeId/versicherungsorte', authenticateToken, async (req, res) => {
  try {
    const { policeId } = req.params
    const [orte] = await pool.query(
      'SELECT * FROM police_versicherungsorte WHERE police_id = ? ORDER BY id ASC',
      [policeId]
    )
    res.json(orte)
  } catch (error) {
    console.error('❌ Fehler beim Abrufen der Versicherungsorte:', error)
    res.status(500).json({ error: error.message })
  }
})

// POST neuer Versicherungsort
router.post('/:policeId/versicherungsorte', authenticateToken, async (req, res) => {
  try {
    const { policeId } = req.params
    const { strasse, hausnummer, plz, ort, land, bemerkung } = req.body
    
    const [result] = await pool.query(
      `INSERT INTO police_versicherungsorte (police_id, strasse, hausnummer, plz, ort, land, bemerkung)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [policeId, strasse, hausnummer, plz, ort, land || 'Schweiz', bemerkung]
    )
    
    const [newOrt] = await pool.query(
      'SELECT * FROM police_versicherungsorte WHERE id = ?',
      [result.insertId]
    )
    
    res.status(201).json(newOrt[0])
  } catch (error) {
    console.error('❌ Fehler beim Erstellen des Versicherungsortes:', error)
    res.status(500).json({ error: error.message })
  }
})

// PUT Versicherungsort aktualisieren
router.put('/:policeId/versicherungsorte/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params
    const { strasse, hausnummer, plz, ort, land, bemerkung } = req.body
    
    await pool.query(
      `UPDATE police_versicherungsorte 
       SET strasse = ?, hausnummer = ?, plz = ?, ort = ?, land = ?, bemerkung = ?
       WHERE id = ?`,
      [strasse, hausnummer, plz, ort, land || 'Schweiz', bemerkung, id]
    )
    
    const [updated] = await pool.query(
      'SELECT * FROM police_versicherungsorte WHERE id = ?',
      [id]
    )
    
    res.json(updated[0])
  } catch (error) {
    console.error('❌ Fehler beim Aktualisieren des Versicherungsortes:', error)
    res.status(500).json({ error: error.message })
  }
})

// DELETE Versicherungsort löschen
router.delete('/:policeId/versicherungsorte/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params
    await pool.query('DELETE FROM police_versicherungsorte WHERE id = ?', [id])
    res.json({ success: true })
  } catch (error) {
    console.error('❌ Fehler beim Löschen des Versicherungsortes:', error)
    res.status(500).json({ error: error.message })
  }
})

// ========================================
// GRUNDVERSICHERUNG
// ========================================

// GET alle Grundversicherungen für eine Police
router.get('/:policeId/grundversicherung', authenticateToken, async (req, res) => {
  try {
    const { policeId } = req.params
    const [items] = await pool.query(
      'SELECT * FROM police_grundversicherung WHERE police_id = ? ORDER BY id ASC',
      [policeId]
    )
    res.json(items)
  } catch (error) {
    console.error('❌ Fehler beim Abrufen der Grundversicherung:', error)
    res.status(500).json({ error: error.message })
  }
})

// POST neue Grundversicherung
router.post('/:policeId/grundversicherung', authenticateToken, async (req, res) => {
  try {
    const { policeId } = req.params
    const { risiko, art, versicherungssumme, selbstbehalt, glasbruch_typ } = req.body
    
    const [result] = await pool.query(
      `INSERT INTO police_grundversicherung (police_id, risiko, art, versicherungssumme, selbstbehalt, glasbruch_typ)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [policeId, risiko, art || 'VW', versicherungssumme, selbstbehalt, glasbruch_typ]
    )
    
    const [newItem] = await pool.query(
      'SELECT * FROM police_grundversicherung WHERE id = ?',
      [result.insertId]
    )
    
    res.status(201).json(newItem[0])
  } catch (error) {
    console.error('❌ Fehler beim Erstellen der Grundversicherung:', error)
    res.status(500).json({ error: error.message })
  }
})

// PUT Grundversicherung aktualisieren
router.put('/:policeId/grundversicherung/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params
    const { risiko, art, versicherungssumme, selbstbehalt, glasbruch_typ } = req.body
    
    await pool.query(
      `UPDATE police_grundversicherung 
       SET risiko = ?, art = ?, versicherungssumme = ?, selbstbehalt = ?, glasbruch_typ = ?
       WHERE id = ?`,
      [risiko, art || 'VW', versicherungssumme, selbstbehalt, glasbruch_typ, id]
    )
    
    const [updated] = await pool.query(
      'SELECT * FROM police_grundversicherung WHERE id = ?',
      [id]
    )
    
    res.json(updated[0])
  } catch (error) {
    console.error('❌ Fehler beim Aktualisieren der Grundversicherung:', error)
    res.status(500).json({ error: error.message })
  }
})

// DELETE Grundversicherung löschen
router.delete('/:policeId/grundversicherung/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params
    await pool.query('DELETE FROM police_grundversicherung WHERE id = ?', [id])
    res.json({ success: true })
  } catch (error) {
    console.error('❌ Fehler beim Löschen der Grundversicherung:', error)
    res.status(500).json({ error: error.message })
  }
})

// ========================================
// BETRIEBSUNTERBRUCH
// ========================================

// GET alle Betriebsunterbrechungen für eine Police
router.get('/:policeId/betriebsunterbruch', authenticateToken, async (req, res) => {
  try {
    const { policeId } = req.params
    const [items] = await pool.query(
      'SELECT * FROM police_betriebsunterbruch WHERE police_id = ? ORDER BY id ASC',
      [policeId]
    )
    res.json(items)
  } catch (error) {
    console.error('❌ Fehler beim Abrufen des Betriebsunterbruchs:', error)
    res.status(500).json({ error: error.message })
  }
})

// POST neuer Betriebsunterbruch
router.post('/:policeId/betriebsunterbruch', authenticateToken, async (req, res) => {
  try {
    const { policeId } = req.params
    const { art_betrieb, risiko, art, versicherungssumme, selbstbehalt } = req.body
    
    const [result] = await pool.query(
      `INSERT INTO police_betriebsunterbruch (police_id, art_betrieb, risiko, art, versicherungssumme, selbstbehalt)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [policeId, art_betrieb || 'Umsatz', risiko, art || 'VW', versicherungssumme, selbstbehalt]
    )
    
    const [newItem] = await pool.query(
      'SELECT * FROM police_betriebsunterbruch WHERE id = ?',
      [result.insertId]
    )
    
    res.status(201).json(newItem[0])
  } catch (error) {
    console.error('❌ Fehler beim Erstellen des Betriebsunterbruchs:', error)
    res.status(500).json({ error: error.message })
  }
})

// PUT Betriebsunterbruch aktualisieren
router.put('/:policeId/betriebsunterbruch/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params
    const { art_betrieb, risiko, art, versicherungssumme, selbstbehalt } = req.body
    
    await pool.query(
      `UPDATE police_betriebsunterbruch 
       SET art_betrieb = ?, risiko = ?, art = ?, versicherungssumme = ?, selbstbehalt = ?
       WHERE id = ?`,
      [art_betrieb || 'Umsatz', risiko, art || 'VW', versicherungssumme, selbstbehalt, id]
    )
    
    const [updated] = await pool.query(
      'SELECT * FROM police_betriebsunterbruch WHERE id = ?',
      [id]
    )
    
    res.json(updated[0])
  } catch (error) {
    console.error('❌ Fehler beim Aktualisieren des Betriebsunterbruchs:', error)
    res.status(500).json({ error: error.message })
  }
})

// DELETE Betriebsunterbruch löschen
router.delete('/:policeId/betriebsunterbruch/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params
    await pool.query('DELETE FROM police_betriebsunterbruch WHERE id = ?', [id])
    res.json({ success: true })
  } catch (error) {
    console.error('❌ Fehler beim Löschen des Betriebsunterbruchs:', error)
    res.status(500).json({ error: error.message })
  }
})

export default router