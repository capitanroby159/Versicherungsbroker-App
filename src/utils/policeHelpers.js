// ========================================================
// utils/policeHelpers.js - Hilfsfunktionen für Policen
// ========================================================

/**
 * Berechne Tage bis Ablaufdatum
 * @param {string} enddatum - ISO-Datum (YYYY-MM-DD)
 * @returns {number|null} Tage bis Ablauf, null wenn kein Datum
 */
export const getDaysUntilExpiry = (enddatum) => {
  if (!enddatum) return null;
  const today = new Date();
  const end = new Date(enddatum);
  return Math.ceil((end - today) / (1000 * 60 * 60 * 24));
};

/**
 * Prüfe ob Police bald abläuft (< 90 Tage)
 * @param {string} enddatum - ISO-Datum
 * @returns {boolean}
 */
export const isExpiringSoon = (enddatum) => {
  const daysLeft = getDaysUntilExpiry(enddatum);
  return daysLeft !== null && daysLeft < 90 && daysLeft > 0;
};

/**
 * Prüfe ob Police abgelaufen ist
 * @param {string} enddatum - ISO-Datum
 * @returns {boolean}
 */
export const isExpired = (enddatum) => {
  const daysLeft = getDaysUntilExpiry(enddatum);
  return daysLeft !== null && daysLeft < 0;
};

/**
 * Bestimme Status einer Police basierend auf Ablaufdatum
 * @param {string} enddatum - ISO-Datum
 * @returns {string} 'Aktiv', 'Ablauf_bald', 'Abgelaufen'
 */
export const determinePoliceStatus = (enddatum) => {
  if (!enddatum) return 'Aktiv';
  const daysLeft = getDaysUntilExpiry(enddatum);
  if (daysLeft < 0) return 'Abgelaufen';
  if (daysLeft < 90) return 'Ablauf_bald';
  return 'Aktiv';
};

/**
 * Berechne Gesamtprämie (Prämie + Gebühren)
 * @param {number} praemie - Prämie
 * @param {number} gebuehren - Gebühren
 * @returns {number} Total
 */
export const calculateTotal = (praemie, gebuehren) => {
  return (parseFloat(praemie) || 0) + (parseFloat(gebuehren) || 0);
};

/**
 * Validiere UVG-Police
 * @param {object} police - Police-Daten
 * @param {string} kundentyp - 'Privatperson' oder 'Firma'
 * @returns {object} { isValid: boolean, error: string|null }
 */
export const validateUVGPolice = (police, kundentyp) => {
  // UVG ist nur für Firmen
  if (police.sparte_id === 5 && kundentyp === 'Privatperson') {
    return {
      isValid: false,
      error: 'UVG ist nur für Firmen verfügbar!'
    };
  }

  // Wenn UVG, dann benötigte Felder prüfen
  if (police.sparte_id === 5) {
    if (!police.uvg_art_betrieb) {
      return {
        isValid: false,
        error: 'UVG: Art des Betriebs/Berufs ist erforderlich'
      };
    }
  }

  return { isValid: true, error: null };
};

/**
 * Formatiere UVG-Daten für Anzeige
 * @param {object} police - Police-Daten
 * @returns {object} Formatierte UVG-Daten
 */
export const formatUVGData = (police) => {
  if (!police || police.sparte_id !== 5) return null;

  return {
    risikoNr: police.uvg_risiko_nr || '-',
    artBetrieb: police.uvg_art_betrieb || '-',
    personenkreis: police.uvg_versicherter_personenkreis || '-',
    bu: {
      gefahrenklasse: police.uvg_bu_gefahrenklasse || '-',
      gefahrenstufe: police.uvg_bu_gefahrenstufe || '-',
      praemiensatz: police.uvg_bu_praemiensatz ? `${police.uvg_bu_praemiensatz}‰` : '-'
    },
    nbu: {
      gefahrenklasse: police.uvg_nbu_gefahrenklasse || '-',
      unterklasse: police.uvg_nbu_unterklasse || '-',
      praemiensatz: police.uvg_nbu_praemiensatz ? `${police.uvg_nbu_praemiensatz}‰` : '-'
    },
    versicherterStatus: police.uvg_versicherter_status === 'aktiv' ? '✓ Aktiv' : '⚪ Inaktiv'
  };
};

/**
 * Gruppiere Policen nach Status
 * @param {array} policen - Array von Policen
 * @returns {object} Gruppierte Policen
 */
export const groupPoliceByStatus = (policen) => {
  const grouped = {
    aktiv: [],
    ablauf_bald: [],
    abgelaufen: [],
    inaktiv: [],
    archiv: []
  };

  policen.forEach(police => {
    const status = police.status_detail?.toLowerCase() || 'aktiv';
    if (grouped[status]) {
      grouped[status].push(police);
    }
  });

  return grouped;
};

/**
 * Sortiere Policen nach Priorität (absteigend)
 * @param {array} policen - Array von Policen
 * @returns {array} Sortierte Policen
 */
export const sortByPriority = (policen) => {
  const priorityOrder = { 'VIP': 5, 'Hoch': 4, 'Normal': 3, 'Niedrig': 2, 'Archiv': 1 };
  return [...policen].sort((a, b) => {
    return (priorityOrder[b.prioritaet] || 0) - (priorityOrder[a.prioritaet] || 0);
  });
};

/**
 * Sortiere Policen nach Ablaufdatum (aufsteigend)
 * @param {array} policen - Array von Policen
 * @returns {array} Sortierte Policen
 */
export const sortByExpiry = (policen) => {
  return [...policen].sort((a, b) => {
    if (!a.ende) return 1;
    if (!b.ende) return -1;
    return new Date(a.ende) - new Date(b.ende);
  });
};

/**
 * Filter Policen die in X Tagen ablaufen
 * @param {array} policen - Array von Policen
 * @param {number} days - Anzahl Tage (default: 90)
 * @returns {array} Gefilterte Policen
 */
export const filterExpiringPolicen = (policen, days = 90) => {
  return policen.filter(police => {
    const daysLeft = getDaysUntilExpiry(police.ende);
    return daysLeft !== null && daysLeft >= 0 && daysLeft <= days;
  });
};

/**
 * Filter abgelaufene Policen
 * @param {array} policen - Array von Policen
 * @returns {array} Gefilterte Policen
 */
export const filterExpiredPolicen = (policen) => {
  return policen.filter(police => isExpired(police.ende));
};

/**
 * Filter UVG-Policen
 * @param {array} policen - Array von Policen
 * @returns {array} Gefilterte Policen
 */
export const filterUVGPolicen = (policen) => {
  return policen.filter(police => police.sparte_id === 5);
};

/**
 * Berechne Statistiken für Police-Portfolio
 * @param {array} policen - Array von Policen
 * @returns {object} Statistiken
 */
export const calculatePoliceStats = (policen) => {
  const stats = {
    total: policen.length,
    aktiv: 0,
    ablauf_bald: 0,
    abgelaufen: 0,
    totalPraemie: 0,
    totalGebuehren: 0,
    avgPraemie: 0,
    bySparte: {},
    byPrioritaet: {},
    uvgCount: 0
  };

  policen.forEach(police => {
    // Count by status
    const status = police.status_detail?.toLowerCase() || 'aktiv';
    if (status === 'aktiv') stats.aktiv++;
    if (status === 'ablauf_bald') stats.ablauf_bald++;
    if (status === 'abgelaufen') stats.abgelaufen++;

    // Sum premiums
    stats.totalPraemie += parseFloat(police.praemie_chf) || 0;
    stats.totalGebuehren += parseFloat(police.gebuehren) || 0;

    // Count by sparte
    if (police.sparten_name) {
      stats.bySparte[police.sparten_name] = (stats.bySparte[police.sparten_name] || 0) + 1;
    }

    // Count by priorität
    if (police.prioritaet) {
      stats.byPrioritaet[police.prioritaet] = (stats.byPrioritaet[police.prioritaet] || 0) + 1;
    }

    // Count UVG
    if (police.sparte_id === 5) stats.uvgCount++;
  });

  // Calculate average premium
  if (stats.total > 0) {
    stats.avgPraemie = stats.totalPraemie / stats.total;
  }

  return stats;
};

/**
 * Generiere Warnmeldungen für Policen
 * @param {array} policen - Array von Policen
 * @returns {array} Warnmeldungen
 */
export const generatePoliceAlerts = (policen) => {
  const alerts = [];

  // Abgelaufene Policen
  const expired = filterExpiredPolicen(policen);
  if (expired.length > 0) {
    alerts.push({
      type: 'danger',
      title: '⚠️ Abgelaufene Policen',
      message: `${expired.length} Police(n) sind bereits abgelaufen`,
      count: expired.length
    });
  }

  // Ablauf in < 30 Tagen
  const expiringSoon30 = filterExpiringPolicen(policen, 30);
  if (expiringSoon30.length > 0) {
    alerts.push({
      type: 'warning',
      title: '🔔 Wichtig: Ablauf in < 30 Tagen',
      message: `${expiringSoon30.length} Police(n) laufen bald ab`,
      count: expiringSoon30.length
    });
  }

  // Ablauf in 30-90 Tagen
  const expiringBald = filterExpiringPolicen(policen, 90).filter(
    p => getDaysUntilExpiry(p.ende) > 30
  );
  if (expiringBald.length > 0) {
    alerts.push({
      type: 'info',
      title: '📅 Ablauf in 30-90 Tagen',
      message: `${expiringBald.length} Police(n) sollten bald überprüft werden`,
      count: expiringBald.length
    });
  }

  return alerts;
};

// Export all functions
export default {
  getDaysUntilExpiry,
  isExpiringSoon,
  isExpired,
  determinePoliceStatus,
  calculateTotal,
  validateUVGPolice,
  formatUVGData,
  groupPoliceByStatus,
  sortByPriority,
  sortByExpiry,
  filterExpiringPolicen,
  filterExpiredPolicen,
  filterUVGPolicen,
  calculatePoliceStats,
  generatePoliceAlerts
};