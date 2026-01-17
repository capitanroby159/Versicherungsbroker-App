import express from 'express'
import { getConnection } from '../database.js'

const router = express.Router()

// GET all versicherer
router.get('/', async (req, res) => {
  const connection = await getConnection()
  try {
    const [rows] = await connection.execute('SELECT * FROM versicherer')
    res.json(rows)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Error fetching versicherer', error: error.message })
  } finally {
    connection.release()
  }
})

// POST new versicherer
router.post('/', async (req, res) => {
  const connection = await getConnection()
  try {
    const { name, typ } = req.body
    const [result] = await connection.execute(
      'INSERT INTO versicherer (name, typ) VALUES (?, ?)',
      [name, typ]
    )
    res.json({ id: result.insertId, message: 'Versicherer created' })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Error creating versicherer', error: error.message })
  } finally {
    connection.release()
  }
})

export default router
