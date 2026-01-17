import express from 'express'
import { getConnection } from '../database.js'

const router = express.Router()

// GET all hypotheken für eine immobilie
router.get('/immobilie/:immobilie_id', async (req, res) => {
  const connection = await getConnection()
  try {
    const [rows] = await connection.execute(
      'SELECT * FROM hypotheken WHERE immobilie_id = ? ORDER BY id',
      [req.params.immobilie_id]
    )
    res.json(rows)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Error fetching hypotheken', error: error.message })
  } finally {
    connection.release()
  }
})

// GET single hypotheke
router.get('/:id', async (req, res) => {
  const connection = await getConnection()
  try {
    const [rows] = await connection.execute(
      'SELECT * FROM hypotheken WHERE id = ?',
      [req.params.id]
    )
    if (rows.length === 0) return res.status(404).json({ message: 'Hypotheke not found' })
    res.json(rows[0])
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Error fetching hypotheke', error: error.message })
  } finally {
    connection.release()
  }
})

// POST new hypotheke
router.post('/', async (req, res) => {
  const connection = await getConnection()
  try {
    const { immobilie_id, institut, art, betrag, zinssatz, beginn, ablauf, notizen } = req.body

    if (!immobilie_id) {
      return res.status(400).json({ message: 'immobilie_id is required' })
    }

    const [result] = await connection.execute(
      'INSERT INTO hypotheken (immobilie_id, institut, art, betrag, zinssatz, beginn, ablauf, notizen) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [immobilie_id, institut, art, betrag, zinssatz, beginn || null, ablauf || null, notizen || null]
    )
    res.json({ id: result.insertId, message: 'Hypotheke created' })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Error creating hypotheke', error: error.message })
  } finally {
    connection.release()
  }
})

// PUT update hypotheke
router.put('/:id', async (req, res) => {
  const connection = await getConnection()
  try {
    const { institut, art, betrag, zinssatz, beginn, ablauf, notizen } = req.body

    const [result] = await connection.execute(
      'UPDATE hypotheken SET institut=?, art=?, betrag=?, zinssatz=?, beginn=?, ablauf=?, notizen=? WHERE id=?',
      [institut, art, betrag, zinssatz, beginn, ablauf, notizen, req.params.id]
    )
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Hypotheke not found' })
    res.json({ message: 'Hypotheke updated' })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Error updating hypotheke', error: error.message })
  } finally {
    connection.release()
  }
})

// DELETE hypotheke
router.delete('/:id', async (req, res) => {
  const connection = await getConnection()
  try {
    const [result] = await connection.execute('DELETE FROM hypotheken WHERE id = ?', [req.params.id])
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Hypotheke not found' })
    res.json({ message: 'Hypotheke deleted' })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Error deleting hypotheke', error: error.message })
  } finally {
    connection.release()
  }
})

export default router
