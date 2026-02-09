import dotenv from 'dotenv'
import express from 'express'
import cors from 'cors'
import pool from './database.js'

dotenv.config()

const app = express()

// Middleware
app.use(cors())
app.use(express.json())
app.use((req, res, next) => {
  req.pool = pool
  next()
})

// Routes
import kundenRoutes from './routes/kunden.js'
import spartenRoutes from './routes/sparten.js'
import versichererRoutes from './routes/versicherer.js'
import policenRoutes from './routes/policen.js'
import policeDateienRoutes from './routes/policeDateien.js'
import policenMutationsRoutes from './routes/policenMutations.js'
import authRoutes from './routes/auth.js'
import vertragsklauselnRoutes from './routes/vertragsklauselnRoutes.js'
import zusatzdeckungenRoutes from './routes/zusatzdeckungenRoutes.js'  // ← NEU!
import sachversicherungRoutes from './routes/sachversicherungRoutes.js'

// Route Registration
app.use('/api/kunden', kundenRoutes)
app.use('/api/sparten', spartenRoutes)
app.use('/api/versicherer', versichererRoutes)
app.use('/api/policen', policenRoutes)
app.use('/api/policen', policeDateienRoutes)
app.use('/api/policen', policenMutationsRoutes)
app.use('/api/policen', zusatzdeckungenRoutes)  // ← NEU!
app.use('/api/auth', authRoutes)
app.use('/api/vertragsklauseln', vertragsklauselnRoutes)
app.use('/api/policen', sachversicherungRoutes)


// Health Check
app.get('/health', (req, res) => {
  res.json({ status: '✅ Server läuft' })
})

// Error Handling
app.use((err, req, res, next) => {
  console.error('❌ Server Error:', err)
  res.status(500).json({ error: 'Interner Server-Fehler' })
})

// Server Start
const PORT = process.env.SERVER_PORT || 5000
app.listen(PORT, () => {
  console.log(`✅ Server läuft auf http://localhost:${PORT}`)
})