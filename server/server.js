import dotenv from 'dotenv'
import express from 'express'
import cors from 'cors'
import pool from './database.js'

// 🔧 WICHTIG: dotenv.config() MUSS GANZ OBEN sein!
dotenv.config()

const app = express()

// Middleware
app.use(cors())
app.use(express.json())

// Pool an req anhängen
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

// Route Registration
app.use('/api/kunden', kundenRoutes)
app.use('/api/sparten', spartenRoutes)
app.use('/api/versicherer', versichererRoutes)
app.use('/api/policen', policenRoutes)
app.use('/api/policen', policeDateienRoutes)
app.use('/api/policen', policenMutationsRoutes)
app.use('/api/auth', authRoutes)

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
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`)
})