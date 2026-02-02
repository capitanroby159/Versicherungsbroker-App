// src/utils/todoExport.js - Hilfsfunktionen für Todo-Exporte

/**
 * Export-Utilities für verschiedene Todo-Services
 * Für echte Integration brauchst du OAuth-Tokens
 */

// ===== MICROSOFT TODO =====
export const exportToMicrosoftTodo = async (aktivitaet, accessToken) => {
  /**
   * Erfordert Microsoft Graph API
   * https://docs.microsoft.com/en-us/graph/api/todotask-post
   */
  try {
    const todoItem = {
      title: aktivitaet.titel,
      bodyContent: aktivitaet.beschreibung || '',
      dueDateTime: {
        dateTime: aktivitaet.datum_fällig,
        timeZone: 'Europe/Zurich'
      },
      importance: mapPriorityToMicrosoft(aktivitaet.prioritaet),
      categories: [aktivitaet.typ, 'Broker-App']
    };

    const response = await fetch(
      'https://graph.microsoft.com/v1.0/me/todo/lists/tasks/tasks',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(todoItem)
      }
    );

    if (!response.ok) throw new Error('Microsoft Todo export failed');
    
    return await response.json();
  } catch (error) {
    console.error('Microsoft Todo export error:', error);
    throw error;
  }
};

const mapPriorityToMicrosoft = (priority) => {
  const map = {
    'Kritisch': 'high',
    'Hoch': 'high',
    'Normal': 'normal',
    'Niedrig': 'low'
  };
  return map[priority] || 'normal';
};


// ===== GOOGLE TASKS =====
export const exportToGoogleTasks = async (aktivitaet, accessToken) => {
  /**
   * Erfordert Google Tasks API
   * https://developers.google.com/tasks/rest/v1/tasks/insert
   */
  try {
    const task = {
      title: aktivitaet.titel,
      notes: aktivitaet.beschreibung || '',
      due: aktivitaet.datum_fällig,
    };

    const response = await fetch(
      'https://www.googleapis.com/tasks/v1/lists/@default/tasks',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(task)
      }
    );

    if (!response.ok) throw new Error('Google Tasks export failed');
    
    return await response.json();
  } catch (error) {
    console.error('Google Tasks export error:', error);
    throw error;
  }
};


// ===== TODOIST =====
export const exportToTodoist = async (aktivitaet, apiToken) => {
  /**
   * Erfordert Todoist API Token
   * https://developer.todoist.com/rest/v2/#tasks
   */
  try {
    const task = {
      content: aktivitaet.titel,
      description: aktivitaet.beschreibung || '',
      due_date: aktivitaet.datum_fällig,
      priority: mapPriorityToTodoist(aktivitaet.prioritaet),
      labels: [aktivitaet.typ, 'Broker']
    };

    const response = await fetch('https://api.todoist.com/rest/v2/tasks', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(task)
    });

    if (!response.ok) throw new Error('Todoist export failed');
    
    return await response.json();
  } catch (error) {
    console.error('Todoist export error:', error);
    throw error;
  }
};

const mapPriorityToTodoist = (priority) => {
  const map = {
    'Kritisch': 4,
    'Hoch': 3,
    'Normal': 2,
    'Niedrig': 1
  };
  return map[priority] || 2;
};


// ===== LOCAL STORAGE EXPORT =====
export const exportToLocalTodos = (aktivitaet) => {
  /**
   * Speichert in localStorage (Browser-Session)
   * Für spätere Synchronisation
   */
  try {
    let todos = JSON.parse(localStorage.getItem('aktivitaeten_todos') || '[]');
    
    const todo = {
      id: Date.now(),
      aktivitaet_id: aktivitaet.id,
      titel: aktivitaet.titel,
      beschreibung: aktivitaet.beschreibung,
      datum_fällig: aktivitaet.datum_fällig,
      prioritaet: aktivitaet.prioritaet,
      erledigt: false,
      erstellt: new Date().toISOString()
    };

    todos.push(todo);
    localStorage.setItem('aktivitaeten_todos', JSON.stringify(todos));
    
    return todo;
  } catch (error) {
    console.error('Local storage export error:', error);
    throw error;
  }
};


// ===== ICAL/ICALENDAR EXPORT =====
export const exportToICalendar = (aktivitaet) => {
  /**
   * Erzeugt iCal-Format für Outlook, Apple Calendar, etc.
   */
  const icalContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Broker App//EN
CALSCALE:GREGORIAN
METHOD:PUBLISH
BEGIN:VEVENT
UID:aktivitaet-${aktivitaet.id}@broker-app.local
DTSTAMP:${formatToISO8601(new Date())}
DTSTART:${formatToISO8601(new Date(aktivitaet.datum_fällig))}
SUMMARY:${sanitizeICalText(aktivitaet.titel)}
DESCRIPTION:${sanitizeICalText(aktivitaet.beschreibung)}
PRIORITY:${mapPriorityToICalendar(aktivitaet.prioritaet)}
CATEGORIES:${aktivitaet.typ}
STATUS:${aktivitaet.status === 'Abgeschlossen' ? 'COMPLETED' : 'NEEDS-ACTION'}
END:VEVENT
END:VCALENDAR`;

  return icalContent;
};

const formatToISO8601 = (date) => {
  return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
};

const sanitizeICalText = (text) => {
  return (text || '').replace(/\r?\n/g, '\\n').replace(/,/g, '\\,');
};

const mapPriorityToICalendar = (priority) => {
  const map = {
    'Kritisch': 1,
    'Hoch': 3,
    'Normal': 5,
    'Niedrig': 9
  };
  return map[priority] || 5;
};


// ===== CSV EXPORT =====
export const exportToCSV = (aktivitaeten) => {
  /**
   * Exportiert mehrere Aktivitäten als CSV
   */
  const headers = [
    'ID',
    'Titel',
    'Beschreibung',
    'Typ',
    'Richtung',
    'Priorität',
    'Status',
    'Fällig',
    'Kunde',
    'Versicherer',
    'Erstellt'
  ];

  const rows = aktivitaeten.map(a => [
    a.id,
    `"${a.titel}"`,
    `"${(a.beschreibung || '').replace(/"/g, '""')}"`,
    a.typ,
    a.richtung,
    a.prioritaet,
    a.status,
    a.datum_fällig,
    a.kunde_name || '',
    a.versicherer_name || '',
    a.datum_erstellt
  ]);

  const csv = [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n');

  return csv;
};

// Helper: Download CSV
export const downloadCSV = (aktivitaeten, filename = 'aktivitaeten.csv') => {
  const csv = exportToCSV(aktivitaeten);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
};


// ===== JSON EXPORT (BACKUP) =====
export const exportToJSON = (aktivitaeten) => {
  return JSON.stringify(aktivitaeten, null, 2);
};

export const downloadJSON = (aktivitaeten, filename = 'aktivitaeten-backup.json') => {
  const json = exportToJSON(aktivitaeten);
  const blob = new Blob([json], { type: 'application/json' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
};


// ===== BATCH EXPORT =====
export const exportMultiple = async (aktivitaeten, exportType, token) => {
  /**
   * Exportiert mehrere Aktivitäten zu einem Service
   */
  const results = [];

  for (const akt of aktivitaeten) {
    try {
      let result;
      
      switch (exportType) {
        case 'Microsoft':
          result = await exportToMicrosoftTodo(akt, token);
          break;
        case 'Google':
          result = await exportToGoogleTasks(akt, token);
          break;
        case 'Todoist':
          result = await exportToTodoist(akt, token);
          break;
        case 'Local':
          result = exportToLocalTodos(akt);
          break;
        default:
          result = { error: 'Unknown export type' };
      }
      
      results.push({
        aktivitaet_id: akt.id,
        success: !result.error,
        result
      });
    } catch (error) {
      results.push({
        aktivitaet_id: akt.id,
        success: false,
        error: error.message
      });
    }
  }

  return results;
};