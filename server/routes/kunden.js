import express from 'express'
import { getConnection } from '../database.js'

const router = express.Router()

// GET all kunden
router.get('/', async (req, res) => {
  const connection = await getConnection()
  try {
    const [rows] = await connection.execute('SELECT * FROM kunden')
    res.json(rows)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Error fetching kunden', error: error.message })
  } finally {
    connection.release()
  }
})

// GET single kunde
router.get('/:id', async (req, res) => {
  const connection = await getConnection()
  try {
    const [rows] = await connection.execute('SELECT * FROM kunden WHERE id = ?', [req.params.id])
    if (rows.length === 0) return res.status(404).json({ message: 'Kunde not found' })
    res.json(rows[0])
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Error fetching kunde', error: error.message })
  } finally {
    connection.release()
  }
})

// POST new kunde
router.post('/', async (req, res) => {
  const connection = await getConnection()
  try {
    const { vorname, nachname, geburtsdatum, ahv_nummer, email, telefon, status, adresse, plz, ort, verhaeltnis, ehepartner_name, hochzeitsdatum, beruf, ausbildung, erwerbsstatus, arbeitgeber_name, position, angestellt_seit, arbeitspensum_prozent, kanton, besonderheiten } = req.body

    const [result] = await connection.execute(
      'INSERT INTO kunden (vorname, nachname, geburtsdatum, ahv_nummer, email, telefon, status, adresse, plz, ort, verhaeltnis, ehepartner_name, hochzeitsdatum, beruf, ausbildung, erwerbsstatus, arbeitgeber_name, position, angestellt_seit, arbeitspensum_prozent, kanton, besonderheiten) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [vorname, nachname, geburtsdatum, ahv_nummer, email, telefon, status, adresse, plz, ort, verhaeltnis, ehepartner_name, hochzeitsdatum, beruf, ausbildung, erwerbsstatus, arbeitgeber_name, position, angestellt_seit, arbeitspensum_prozent, kanton, besonderheiten]
    )
    res.json({ id: result.insertId, message: 'Kunde created' })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Error creating kunde', error: error.message })
  } finally {
    connection.release()
  }
})

// PUT update kunde
router.put('/:id', async (req, res) => {
  const connection = await getConnection()
  try {
    const { vorname, nachname, geburtsdatum, ahv_nummer, email, telefon, status, adresse, plz, ort, verhaeltnis, ehepartner_name, hochzeitsdatum, beruf, ausbildung, erwerbsstatus, arbeitgeber_name, position, angestellt_seit, arbeitspensum_prozent, kanton, besonderheiten } = req.body

    const [result] = await connection.execute(
      'UPDATE kunden SET vorname=?, nachname=?, geburtsdatum=?, ahv_nummer=?, email=?, telefon=?, status=?, adresse=?, plz=?, ort=?, verhaeltnis=?, ehepartner_name=?, hochzeitsdatum=?, beruf=?, ausbildung=?, erwerbsstatus=?, arbeitgeber_name=?, position=?, angestellt_seit=?, arbeitspensum_prozent=?, kanton=?, besonderheiten=? WHERE id=?',
      [vorname, nachname, geburtsdatum, ahv_nummer, email, telefon, status, adresse, plz, ort, verhaeltnis, ehepartner_name, hochzeitsdatum, beruf, ausbildung, erwerbsstatus, arbeitgeber_name, position, angestellt_seit, arbeitspensum_prozent, kanton, besonderheiten, req.params.id]
    )
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Kunde not found' })
    res.json({ message: 'Kunde updated' })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Error updating kunde', error: error.message })
  } finally {
    connection.release()
  }
})

// DELETE kunde
router.delete('/:id', async (req, res) => {
  const connection = await getConnection()
  try {
    const [result] = await connection.execute('DELETE FROM kunden WHERE id = ?', [req.params.id])
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Kunde not found' })
    res.json({ message: 'Kunde deleted' })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Error deleting kunde', error: error.message })
  } finally {
    connection.release()
  }
})

export default router
