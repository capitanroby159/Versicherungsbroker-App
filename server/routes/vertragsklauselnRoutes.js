import express from 'express'
import pool from '../database.js'
import { authenticateToken } from '../middleware/auth.js'

const router = express.Router()

// ========================================
// GET alle Klauseln (gefiltert nach Versicherer und/oder Sparte)
// ========================================
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { versicherer_id, sparte_id } = req.query
    
    let query = `
      SELECT 
        k.*,
        v.name as versicherer_name,
        s.name as sparte_name
      FROM vertragsklauseln k
      LEFT JOIN versicherer v ON k.versicherer_id = v.id
      LEFT JOIN sparten s ON k.sparte_id = s.id
      WHERE 1=1
    `
    
    const params = []
    
    if (versicherer_id) {
      query += ' AND k.versicherer_id = ?'
      params.push(versicherer_id)
    }
    
    if (sparte_id) {
      query += ' AND (k.sparte_id = ? OR k.sparte_id IS NULL)'
      params.push(sparte_id)
    }
    
    query += ' ORDER BY k.titel ASC'
    
    const [klauseln] = await pool.query(query, params)
    res.json(klauseln)
  } catch (error) {
    console.error('❌ Fehler beim Abrufen der Klauseln:', error)
    res.status(500).json({ error: error.message })
  }
})

// ========================================
// GET Klauseln für eine Police
// ========================================
router.get('/police/:policeId', authenticateToken, async (req, res) => {
  try {
    const { policeId } = req.params
    
    const [klauseln] = await pool.query(`
      SELECT 
        k.*,
        v.name as versicherer_name,
        s.name as sparte_name,
        pk.hinzugefuegt_am
      FROM police_klauseln pk
      JOIN vertragsklauseln k ON pk.klausel_id = k.id
      LEFT JOIN versicherer v ON k.versicherer_id = v.id
      LEFT JOIN sparten s ON k.sparte_id = s.id
      WHERE pk.police_id = ?
      ORDER BY k.titel ASC
    `, [policeId])
    
    res.json(klauseln)
  } catch (error) {
    console.error('❌ Fehler beim Abrufen der Police-Klauseln:', error)
    res.status(500).json({ error: error.message })
  }
})

// ========================================
// POST neue Klausel erstellen
// ========================================
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { versicherer_id, sparte_id, titel, klausel, kategorie } = req.body
    
    if (!versicherer_id || !titel || !klausel) {
      return res.status(400).json({ error: 'Versicherer, Titel und Klausel sind Pflichtfelder' })
    }
    
    const [result] = await pool.query(
      `INSERT INTO vertragsklauseln (versicherer_id, sparte_id, titel, klausel, kategorie)
       VALUES (?, ?, ?, ?, ?)`,
      [versicherer_id, sparte_id || null, titel, klausel, kategorie || 'Allgemein']
    )
    
    const [newKlausel] = await pool.query(
      `SELECT 
        k.*,
        v.name as versicherer_name,
        s.name as sparte_name
      FROM vertragsklauseln k
      LEFT JOIN versicherer v ON k.versicherer_id = v.id
      LEFT JOIN sparten s ON k.sparte_id = s.id
      WHERE k.id = ?`,
      [result.insertId]
    )
    
    res.status(201).json({ klausel: newKlausel[0] })
  } catch (error) {
    console.error('❌ Fehler beim Erstellen der Klausel:', error)
    res.status(500).json({ error: error.message })
  }
})

// ========================================
// PUT Klausel aktualisieren
// ========================================
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params
    const { versicherer_id, sparte_id, titel, klausel, kategorie } = req.body
    
    await pool.query(
      `UPDATE vertragsklauseln 
       SET versicherer_id = ?, sparte_id = ?, titel = ?, klausel = ?, kategorie = ?
       WHERE id = ?`,
      [versicherer_id, sparte_id || null, titel, klausel, kategorie || 'Allgemein', id]
    )
    
    const [updated] = await pool.query(
      `SELECT 
        k.*,
        v.name as versicherer_name,
        s.name as sparte_name
      FROM vertragsklauseln k
      LEFT JOIN versicherer v ON k.versicherer_id = v.id
      LEFT JOIN sparten s ON k.sparte_id = s.id
      WHERE k.id = ?`,
      [id]
    )
    
    res.json({ klausel: updated[0] })
  } catch (error) {
    console.error('❌ Fehler beim Aktualisieren der Klausel:', error)
    res.status(500).json({ error: error.message })
  }
})

// ========================================
// DELETE Klausel löschen
// ========================================
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params
    
    await pool.query('DELETE FROM vertragsklauseln WHERE id = ?', [id])
    
    res.json({ success: true })
  } catch (error) {
    console.error('❌ Fehler beim Löschen der Klausel:', error)
    res.status(500).json({ error: error.message })
  }
})

// ========================================
// POST Klauseln zu Police zuordnen (Mehrfachauswahl)
// ========================================
router.post('/police/:policeId/add', authenticateToken, async (req, res) => {
  try {
    const { policeId } = req.params
    const { klausel_ids } = req.body
    
    if (!Array.isArray(klausel_ids) || klausel_ids.length === 0) {
      return res.status(400).json({ error: 'Mindestens eine Klausel muss ausgewählt werden' })
    }
    
    const values = klausel_ids.map(kid => [policeId, kid])
    
    await pool.query(
      `INSERT IGNORE INTO police_klauseln (police_id, klausel_id) VALUES ?`,
      [values]
    )
    
    res.json({ success: true })
  } catch (error) {
    console.error('❌ Fehler beim Zuordnen der Klauseln:', error)
    res.status(500).json({ error: error.message })
  }
})

// ========================================
// DELETE Klausel von Police entfernen
// ========================================
router.delete('/police/:policeId/:klauselId', authenticateToken, async (req, res) => {
  try {
    const { policeId, klauselId } = req.params
    
    await pool.query(
      'DELETE FROM police_klauseln WHERE police_id = ? AND klausel_id = ?',
      [policeId, klauselId]
    )
    
    res.json({ success: true })
  } catch (error) {
    console.error('❌ Fehler beim Entfernen der Klausel:', error)
    res.status(500).json({ error: error.message })
  }
})

export default router