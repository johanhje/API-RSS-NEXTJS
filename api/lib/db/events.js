/**
 * Events database operations
 */

import { query, queryOne, mutate, transaction } from './database.js';

/**
 * Get all events
 * @param {Object} options - Query options
 * @param {number} options.limit - Limit results
 * @param {number} options.offset - Offset for pagination
 * @param {string} options.language - Language filter
 * @param {boolean} options.includeTranslations - Whether to include translations
 * @returns {Array} - Array of events
 */
export function getAllEvents({ limit = 100, offset = 0, language = null, includeTranslations = false } = {}) {
  const sql = `
    SELECT * FROM events 
    ORDER BY datetime DESC
    LIMIT ? OFFSET ?
  `;
  
  const events = query(sql, [limit, offset]);
  
  if (includeTranslations) {
    return events.map(event => ({
      ...event,
      translations: getTranslationsForEvent(event.id, language)
    }));
  }
  
  return events;
}

/**
 * Get event by ID
 * @param {string} id - Event ID
 * @param {Object} options - Query options
 * @param {string} options.language - Language filter
 * @param {boolean} options.includeTranslations - Whether to include translations
 * @returns {Object|null} - Event or null if not found
 */
export function getEventById(id, { language = null, includeTranslations = false } = {}) {
  const sql = 'SELECT * FROM events WHERE id = ?';
  const event = queryOne(sql, [id]);
  
  if (!event) {
    return null;
  }
  
  if (includeTranslations) {
    return {
      ...event,
      translations: getTranslationsForEvent(id, language)
    };
  }
  
  return event;
}

/**
 * Get event by URL
 * @param {string} url - Event URL
 * @returns {Object|null} - Event or null if not found
 */
export function getEventByUrl(url) {
  const sql = 'SELECT * FROM events WHERE url = ?';
  return queryOne(sql, [url]);
}

/**
 * Insert a new event
 * @param {Object} event - Event data
 * @returns {Object} - Result with changes and lastInsertRowid
 */
export function insertEvent(event) {
  const sql = `
    INSERT INTO events (
      id, name, summary, location_name, datetime, 
      type, url, timestamp, created_at, location_gps, 
      lat, lng, translated
    ) VALUES (
      @id, @name, @summary, @location_name, @datetime,
      @type, @url, @timestamp, @created_at, @location_gps,
      @lat, @lng, @translated
    )
  `;
  
  return mutate(sql, event);
}

/**
 * Update an existing event
 * @param {string} id - Event ID
 * @param {Object} event - Event data
 * @returns {Object} - Result with changes and lastInsertRowid
 */
export function updateEvent(id, event) {
  const sql = `
    UPDATE events SET
      name = @name,
      summary = @summary,
      location_name = @location_name,
      datetime = @datetime,
      type = @type,
      url = @url,
      timestamp = @timestamp,
      location_gps = @location_gps,
      lat = @lat,
      lng = @lng,
      translated = @translated
    WHERE id = @id
  `;
  
  return mutate(sql, { ...event, id });
}

/**
 * Delete an event
 * @param {string} id - Event ID
 * @returns {Object} - Result with changes and lastInsertRowid
 */
export function deleteEvent(id) {
  const sql = 'DELETE FROM events WHERE id = ?';
  return mutate(sql, [id]);
}

/**
 * Get translations for an event
 * @param {string} eventId - Event ID
 * @param {string|null} language - Specific language or null for all
 * @returns {Object} - Object with language codes as keys and translation objects as values
 */
export function getTranslationsForEvent(eventId, language = null) {
  let sql = 'SELECT * FROM translations WHERE event_id = ?';
  const params = [eventId];
  
  if (language) {
    sql += ' AND language = ?';
    params.push(language);
  }
  
  const translations = query(sql, params);
  
  // Format translations as a map of language -> content
  return translations.reduce((acc, translation) => {
    acc[translation.language] = {
      name: translation.name,
      summary: translation.summary
    };
    return acc;
  }, {});
}

/**
 * Insert a translation for an event
 * @param {Object} translation - Translation data
 * @returns {Object} - Result with changes and lastInsertRowid
 */
export function insertTranslation(translation) {
  const sql = `
    INSERT INTO translations (
      event_id, language, name, summary, created_at
    ) VALUES (
      @event_id, @language, @name, @summary, @created_at
    )
  `;
  
  return mutate(sql, translation);
}

/**
 * Update translations for an event (within a transaction)
 * @param {string} eventId - Event ID
 * @param {Array} translations - Array of translation objects
 * @returns {boolean} - Success flag
 */
export function updateTranslationsForEvent(eventId, translations) {
  const updateTranslationsFn = transaction((translations) => {
    // First delete existing translations
    mutate('DELETE FROM translations WHERE event_id = ?', [eventId]);
    
    // Then insert new translations
    for (const translation of translations) {
      insertTranslation({
        ...translation,
        event_id: eventId,
        created_at: Math.floor(Date.now() / 1000)
      });
    }
    
    return true;
  });
  
  return updateTranslationsFn(translations);
}

/**
 * Count total events
 * @returns {number} - Total count
 */
export function countEvents() {
  const result = queryOne('SELECT COUNT(*) as count FROM events');
  return result ? result.count : 0;
}

/**
 * Get the latest event timestamp
 * @returns {number|null} - Latest timestamp or null if no events
 */
export function getLatestEventTimestamp() {
  const result = queryOne('SELECT MAX(timestamp) as latest FROM events');
  return result ? result.latest : null;
} 