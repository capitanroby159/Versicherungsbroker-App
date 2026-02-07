import bcrypt from 'bcrypt'
import mysql from 'mysql2/promise'

async function createUser() {
  let connection
  try {
    const password = 'password123'
    const hashedPassword = await bcrypt.hash(password, 10)
    
    console.log('Hash für password123:', hashedPassword)
    console.log('\nDB-Verbindung wird hergestellt...')
    
    connection = await mysql.createConnection({
      host: '209.hosttech.eu',
      user: 'broker_user',
      password: '^4QGj9pj@Hewspl0',
      database: 'broker_app',
      port: 3306
    })

    console.log('✅ Verbunden!\n')

    // Löschen
    console.log('Lösche alten Benutzer...')
    await connection.execute('DELETE FROM benutzer WHERE email = ?', ['admin@broker.ch'])
    console.log('✅ Gelöscht\n')

    // Neu erstellen
    console.log('Erstelle neuen Benutzer...')
    await connection.execute(
      'INSERT INTO benutzer (email, passwort, vorname, nachname, rolle_id, ist_aktiv) VALUES (?, ?, ?, ?, ?, ?)',
      ['admin@broker.ch', hashedPassword, 'Admin', 'Benutzer', 1, 1]
    )

    console.log('✅ Benutzer erstellt!')
    console.log('\nNEUER HASH:', hashedPassword)
    console.log('\nLogin testen mit:')
    console.log('Email: admin@broker.ch')
    console.log('Passwort: password123')
    
  } catch (error) {
    console.error('❌ FEHLER:', error.message)
    console.error('Code:', error.code)
  } finally {
    if (connection) connection.end()
  }
}

createUser()