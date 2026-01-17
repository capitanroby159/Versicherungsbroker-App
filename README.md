# 🏢 Broker App

Versicherungsbroker-Verwaltungssystem mit React Frontend und Express Backend.

## Features ✨

- **👥 Kundeninformationen:** Kundenverzeichnis mit Adressen, Kontaktdaten
- **🏠 Immobilien:** Verwaltung von Kundenimmobilien mit Details
- **📋 Policen:** Policenverwaltung mit Ablaufdaten und Status-Tracking

## Technologie Stack

- **Frontend:** React 18 + Vite + React Router
- **Backend:** Express.js + Node.js
- **Datenbank:** MySQL (209.hosttech.eu)
- **Styling:** CSS3

## Installation

### Voraussetzungen

- Node.js 16+ ([https://nodejs.org](https://nodejs.org))
- npm (kommt mit Node.js)
- Git ([https://git-scm.com](https://git-scm.com))

### 1. Projekt lokal clonen

```bash
git clone https://github.com/YOUR_USERNAME/broker-app.git
cd broker-app
```

### 2. Dependencies installieren

```bash
npm install
```

### 3. Environment-Variablen konfigurieren

Kopiere `.env` und fülle deine Datenbank-Credentials ein:

```bash
cp .env .env.local
```

Öffne `.env.local` und aktualisiere:

```env
DB_HOST=209.hosttech.eu
DB_USER=your_username
DB_PASS=your_password
DB_NAME=your_database
PORT=5000
VITE_API_URL=http://localhost:5000
```

### 4. App starten

**Option A: Beide Server zusammen (empfohlen)**

```bash
npm run dev
```

Das öffnet automatisch:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

**Option B: Server einzeln starten**

Terminal 1 - Backend:
```bash
npm run server
```

Terminal 2 - Frontend:
```bash
npm run client
```

## Projektstruktur

```
broker-app/
├── server/
│   └── server.js          # Express Backend
├── src/
│   ├── App.jsx            # Main React App mit Router
│   ├── App.css
│   ├── main.jsx           # React Entry Point
│   └── components/
│       ├── KundenTab.jsx   # Kundenmanagement
│       ├── ImmobilienTab.jsx  # Immobilienmanagement
│       └── PoliceTab.jsx   # Policenmanagement
├── index.html             # HTML Template
├── vite.config.js         # Vite Configuration
├── package.json
├── .env                   # Environment Vorlage
└── .gitignore
```

## API Endpoints

### Kunden
- `GET /api/kunden` - Alle Kunden
- `GET /api/kunden/:id` - Einzelner Kunde
- `POST /api/kunden` - Neuer Kunde
- `PUT /api/kunden/:id` - Kunde aktualisieren

### Immobilien
- `GET /api/immobilien` - Alle Immobilien
- `GET /api/immobilien/:id` - Einzelne Immobilie
- `POST /api/immobilien` - Neue Immobilie
- `PUT /api/immobilien/:id` - Immobilie aktualisieren

### Policen
- `GET /api/policen` - Alle Policen
- `GET /api/policen/:id` - Einzelne Police
- `POST /api/policen` - Neue Police
- `PUT /api/policen/:id` - Police aktualisieren

## Auf GitHub hochladen

### 1. GitHub Repository erstellen

1. Gehe zu [https://github.com/new](https://github.com/new)
2. Name: `broker-app`
3. Beschreibung: `Insurance Broker Management System`
4. Privat oder Public? (deine Wahl)
5. **Nicht** "Initialize with README" auswählen (wir haben schon einen)
6. Klicke "Create repository"

### 2. Lokales Git Repository initialisieren

```bash
cd broker-app
git init
git add .
git commit -m "Initial commit: Broker App mit Kunden, Immobilien, Policen"
```

### 3. Mit GitHub Remote verbinden

```bash
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/broker-app.git
git push -u origin main
```

(Ersetze `YOUR_USERNAME` mit deinem GitHub-Benutzernamen)

### 4. Zukünftige Updates hochladen

```bash
git add .
git commit -m "Beschreibung der Änderungen"
git push
```

## Datenbank-Setup

Die folgenden Tabellen müssen auf deiner MySQL-Datenbank existieren:

```sql
CREATE TABLE IF NOT EXISTS kunden (
  id INT AUTO_INCREMENT PRIMARY KEY,
  vorname VARCHAR(100) NOT NULL,
  nachname VARCHAR(100) NOT NULL,
  email VARCHAR(100),
  telefon VARCHAR(20),
  adresse VARCHAR(200),
  plz VARCHAR(10),
  ort VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS immobilien (
  id INT AUTO_INCREMENT PRIMARY KEY,
  kunde_id INT NOT NULL,
  strasse VARCHAR(100),
  hausnummer VARCHAR(10),
  plz VARCHAR(10),
  ort VARCHAR(100),
  objekttyp VARCHAR(50),
  baujahr INT,
  quadratmeter DECIMAL(10,2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (kunde_id) REFERENCES kunden(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS policen (
  id INT AUTO_INCREMENT PRIMARY KEY,
  kunde_id INT NOT NULL,
  versicherer_id INT,
  branche_id INT,
  police_nummer VARCHAR(50) UNIQUE NOT NULL,
  praedie DECIMAL(10,2),
  startdatum DATE,
  enddatum DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (kunde_id) REFERENCES kunden(id) ON DELETE CASCADE
);
```

## Troubleshooting

### "Missing script: start"
Stelle sicher, dass du `npm install` ausgeführt hast.

### "Cannot find module 'express'"
```bash
npm install
```

### "Connection refused" (Datenbank)
- Prüfe deine `.env`-Datei
- Prüfe, dass der DB-Server erreichbar ist
- Prüfe Benutzername und Passwort

### Port 3000 oder 5000 belegt?
```bash
# Port freigeben oder anderen Port in vite.config.js setzen
```

## Nächste Schritte

- [ ] Datenbank-Tabellen erstellen (SQL oben)
- [ ] `.env.local` mit Credentials konfigurieren
- [ ] `npm install` ausführen
- [ ] `npm run dev` starten
- [ ] Auf GitHub hochladen
- [ ] Weitere Features hinzufügen (Kommunikation, Vorsorge-Rechner, etc.)

## Kontakt & Support

Bei Fragen: Schreib eine Issue im GitHub Repository!

---

**Version:** 1.0.0  
**Last Updated:** Januar 2026  
**Status:** Production Ready 🚀
