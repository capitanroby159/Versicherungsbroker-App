import express from 'express'
import { getConnection } from '../database.js'

const router = express.Router()

// ✅ NEU: GET alle gültigen Versicherer (für Dropdowns)
router.get('/valid-versicherer', async (req, res) => {
  const connection = await getConnection()
  try {
    const [rows] = await connection.execute(
      'SELECT id, name FROM versicherer ORDER BY name'
    )
    res.json(rows)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Error fetching versicherer', error: error.message })
  } finally {
    connection.release()
  }
})

// ✅ NEU: GET alle gültigen Branchen (für Dropdowns)
router.get('/valid-branchen', async (req, res) => {
  const connection = await getConnection()
  try {
    const [rows] = await connection.execute(
      'SELECT id, name FROM branchen ORDER BY name'
    )
    res.json(rows)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Error fetching branchen', error: error.message })
  } finally {
    connection.release()
  }
})

// GET all policen
router.get('/', async (req, res) => {
  const connection = await getConnection()
  try {
    const [rows] = await connection.execute(
      'SELECT p.*, k.vorname, k.nachname, v.name as versicherer_name FROM policen p LEFT JOIN kunden k ON p.kunde_id = k.id LEFT JOIN versicherer v ON p.versicherer_id = v.id ORDER BY p.kunde_id'
    )
    res.json(rows)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Error fetching policen', error: error.message })
  } finally {
    connection.release()
  }
})

// GET single police
router.get('/:id', async (req, res) => {
  const connection = await getConnection()
  try {
    const [rows] = await connection.execute(
      'SELECT p.*, k.vorname, k.nachname, v.name as versicherer_name FROM policen p LEFT JOIN kunden k ON p.kunde_id = k.id LEFT JOIN versicherer v ON p.versicherer_id = v.id WHERE p.id = ?',
      [req.params.id]
    )
    if (rows.length === 0) return res.status(404).json({ message: 'Police not found' })
    res.json(rows[0])
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Error fetching police', error: error.message })
  } finally {
    connection.release()
  }
})

// POST new police
router.post('/', async (req, res) => {
  const connection = await getConnection()
  try {
    let { kunde_id, versicherer_id, branche_id, policennummer, praemie_chf, gebuehren, beginn, ende, jkr, waehrung, bemerkungen } = req.body

    // ✅ Validierung
    if (!kunde_id) {
      return res.status(400).json({ message: 'kunde_id ist erforderlich!' })
    }

    // ✅ Validiere versicherer_id wenn vorhanden
    if (versicherer_id) {
      const [versicherer] = await connection.execute(
        'SELECT id FROM versicherer WHERE id = ?',
        [versicherer_id]
      )
      if (versicherer.length === 0) {
        console.warn(`⚠️ Ungültige versicherer_id: ${versicherer_id} - setze auf NULL`)
        versicherer_id = null
      }
    } else {
      versicherer_id = null
    }

    // ✅ Validiere branche_id wenn vorhanden
    if (branche_id) {
      const [branche] = await connection.execute(
        'SELECT id FROM branchen WHERE id = ?',
        [branche_id]
      )
      if (branche.length === 0) {
        console.warn(`⚠️ Ungültige branche_id: ${branche_id} - setze auf NULL`)
        branche_id = null
      }
    } else {
      branche_id = null
    }

    // ✅ Konvertiere ISO-Dates zu YYYY-MM-DD Format
    if (beginn) beginn = beginn.split('T')[0]
    if (ende) ende = ende.split('T')[0]

    // ✅ Stelle sicher, dass keine undefined Werte übergeben werden
    versicherer_id = versicherer_id === undefined ? null : versicherer_id
    branche_id = branche_id === undefined ? null : branche_id
    praemie_chf = praemie_chf === undefined ? null : praemie_chf
    gebuehren = gebuehren === undefined ? null : gebuehren
    jkr = jkr === undefined ? null : jkr
    waehrung = waehrung === undefined ? 'CHF' : waehrung
    bemerkungen = bemerkungen === undefined ? null : bemerkungen

    const [result] = await connection.execute(
      'INSERT INTO policen (kunde_id, versicherer_id, branche_id, policennummer, praemie_chf, gebuehren, beginn, ende, jkr, waehrung, bemerkungen) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [kunde_id, versicherer_id, branche_id, policennummer, praemie_chf, gebuehren, beginn, ende, jkr, waehrung, bemerkungen]
    )
    res.json({ id: result.insertId, message: 'Police created' })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Error creating police', error: error.message })
  } finally {
    connection.release()
  }
})

// PUT update police
router.put('/:id', async (req, res) => {
  const connection = await getConnection()
  try {
    let { versicherer_id, branche_id, policennummer, praemie_chf, gebuehren, beginn, ende, jkr, waehrung, bemerkungen } = req.body

    // ✅ Validiere versicherer_id wenn vorhanden
    if (versicherer_id) {
      const [versicherer] = await connection.execute(
        'SELECT id FROM versicherer WHERE id = ?',
        [versicherer_id]
      )
      if (versicherer.length === 0) {
        console.warn(`⚠️ Ungültige versicherer_id: ${versicherer_id} - setze auf NULL`)
        versicherer_id = null
      }
    } else {
      versicherer_id = null
    }

    // ✅ Validiere branche_id wenn vorhanden
    if (branche_id) {
      const [branche] = await connection.execute(
        'SELECT id FROM branchen WHERE id = ?',
        [branche_id]
      )
      if (branche.length === 0) {
        console.warn(`⚠️ Ungültige branche_id: ${branche_id} - setze auf NULL`)
        branche_id = null
      }
    } else {
      branche_id = null
    }

    // ✅ Konvertiere ISO-Dates zu YYYY-MM-DD Format
    if (beginn) beginn = beginn.split('T')[0]
    if (ende) ende = ende.split('T')[0]

    // ✅ Stelle sicher, dass keine undefined Werte übergeben werden
    versicherer_id = versicherer_id === undefined ? null : versicherer_id
    branche_id = branche_id === undefined ? null : branche_id
    praemie_chf = praemie_chf === undefined ? null : praemie_chf
    gebuehren = gebuehren === undefined ? null : gebuehren
    jkr = jkr === undefined ? null : jkr
    waehrung = waehrung === undefined ? 'CHF' : waehrung
    bemerkungen = bemerkungen === undefined ? null : bemerkungen

    const [result] = await connection.execute(
      'UPDATE policen SET versicherer_id=?, branche_id=?, policennummer=?, praemie_chf=?, gebuehren=?, beginn=?, ende=?, jkr=?, waehrung=?, bemerkungen=? WHERE id=?',
      [versicherer_id, branche_id, policennummer, praemie_chf, gebuehren, beginn, ende, jkr, waehrung, bemerkungen, req.params.id]
    )
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Police not found' })
    res.json({ message: 'Police updated' })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Error updating police', error: error.message })
  } finally {
    connection.release()
  }
})

// DELETE police
router.delete('/:id', async (req, res) => {
  const connection = await getConnection()
  try {
    const [result] = await connection.execute('DELETE FROM policen WHERE id = ?', [req.params.id])
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Police not found' })
    res.json({ message: 'Police deleted' })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Error deleting police', error: error.message })
  } finally {
    connection.release()
  }
})

export default router