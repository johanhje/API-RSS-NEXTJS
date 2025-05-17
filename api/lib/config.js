/**
 * Configuration for the API
 * Values can be overridden by environment variables
 */

import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Database configuration
export const DB_PATH = process.env.DB_PATH || path.join(__dirname, '../data/polisapp.sqlite');

// RSS feed configuration
export const RSS_FEED_URL = process.env.RSS_FEED_URL || 'https://polisen.se/aktuellt/rss/hela-landet/handelser-i-hela-landet/';
export const RSS_FETCH_INTERVAL = parseInt(process.env.RSS_FETCH_INTERVAL || '60', 10); // in seconds

// Nominatim Geocoding Service
export const NOMINATIM_BASE_URL = process.env.NOMINATIM_BASE_URL || 'https://nominatim.openstreetmap.org';
export const NOMINATIM_USER_AGENT = process.env.NOMINATIM_USER_AGENT || 'PolisAPI/1.0';

// API settings
export const API_HOST = process.env.API_HOST || '0.0.0.0';
export const API_PORT = parseInt(process.env.API_PORT || '3000', 10);

// Supported languages (copied from original Python API)
export const SUPPORTED_LANGUAGES = {
  "sv": "swedish",
  "en": "english",
  "ar": "arabic",
  "fa": "farsi",
  "de": "german",
  "es": "spanish",
  "fr": "french",
  "pt": "portuguese",
  "ru": "russian",
  "tr": "turkish",
  "fi": "finnish",
  "no": "norwegian",
  "da": "danish",
  "pl": "polish",
};

// Language codes mapping
export const LANGUAGE_CODES = Object.fromEntries(
  Object.entries(SUPPORTED_LANGUAGES).map(([code, language]) => [language, code])
); 