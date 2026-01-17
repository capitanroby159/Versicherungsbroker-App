import express from 'express'
import { getConnection } from '../database.js'

const router = express.Router()

// GET all immobilien
router.get('/', async (req, res) => {
  const connection = await getConnection()
  try {
    // Hypotheken kommen jetzt von der separaten hypotheken-API!
    const [rows] = await connection.execute('SELECT * FROM immobilien')
    res.json(rows)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Error fetching immobilien', error: error.message })
  } finally {
    connection.release()
  }
})

// GET single immobilie
router.get('/:id', async (req, res) => {
  const connection = await getConnection()
  try {
    const [rows] = await connection.execute('SELECT * FROM immobilien WHERE id = ?', [req.params.id])
    if (rows.length === 0) return res.status(404).json({ message: 'Immobilie not found' })
    res.json(rows[0])
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Error fetching immobilie', error: error.message })
  } finally {
    connection.release()
  }
})

// POST new immobilie
router.post('/', async (req, res) => {
  const connection = await getConnection()
  try {
    const { kunde_id, strasse, hausnummer, plz, ort, immobilienart, wohnort_status, baujahr, renoviert, renovationsjahr, renovationsnotizen, kaufpreis, kaufjahr, gebaeudeversicherungswert, versicherungssumme, mietertrag_jaehrlich, beschreibung } = req.body

    const [result] = await connection.execute(
      'INSERT INTO immobilien (kunde_id, strasse, hausnummer, plz, ort, immobilienart, wohnort_status, baujahr, renoviert, renovationsjahr, renovationsnotizen, kaufpreis, kaufjahr, gebaeudeversicherungswert, versicherungssumme, mietertrag_jaehrlich, beschreibung) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [kunde_id, strasse, hausnummer, plz, ort, immobilienart, wohnort_status, baujahr, renoviert, renovationsjahr, renovationsnotizen, kaufpreis, kaufjahr, gebaeudeversicherungswert, versicherungssumme, mietertrag_jaehrlich, beschreibung]
    )
    res.json({ id: result.insertId, message: 'Immobilie created' })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Error creating immobilie', error: error.message })
  } finally {
    connection.release()
  }
})

// PUT update immobilie
router.put('/:id', async (req, res) => {
  const connection = await getConnection()
  try {
    const { strasse, hausnummer, plz, ort, immobilienart, wohnort_status, baujahr, renoviert, renovationsjahr, renovationsnotizen, kaufpreis, kaufjahr, gebaeudeversicherungswert, versicherungssumme, mietertrag_jaehrlich, beschreibung } = req.body

    const [result] = await connection.execute(
      'UPDATE immobilien SET strasse=?, hausnummer=?, plz=?, ort=?, immobilienart=?, wohnort_status=?, baujahr=?, renoviert=?, renovationsjahr=?, renovationsnotizen=?, kaufpreis=?, kaufjahr=?, gebaeudeversicherungswert=?, versicherungssumme=?, mietertrag_jaehrlich=?, beschreibung=? WHERE id=?',
      [strasse, hausnummer, plz, ort, immobilienart, wohnort_status, baujahr, renoviert, renovationsjahr, renovationsnotizen, kaufpreis, kaufjahr, gebaeudeversicherungswert, versicherungssumme, mietertrag_jaehrlich, beschreibung, req.params.id]
    )
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Immobilie not found' })
    res.json({ message: 'Immobilie updated' })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Error updating immobilie', error: error.message })
  } finally {
    connection.release()
  }
})

// DELETE immobilie
router.delete('/:id', async (req, res) => {
  const connection = await getConnection()
  try {
    const [result] = await connection.execute('DELETE FROM immobilien WHERE id = ?', [req.params.id])
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Immobilie not found' })
    res.json({ message: 'Immobilie deleted' })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Error deleting immobilie', error: error.message })
  } finally {
    connection.release()
  }
})

export default router