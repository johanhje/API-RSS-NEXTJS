/**
 * TypeScript interfaces for the API
 */

/**
 * RSS Feed Item from Polisen's RSS Feed
 */
export interface RssItem {
  guid: {
    _: string;
    $: {
      isPermaLink: string;
    }
  } | string;
  title: string;
  description: string;
  pubDate: string;
  link: string;
}

/**
 * Event from the database
 */
export interface Event {
  id: string;
  name: string;
  summary: string;
  location_name: string;
  datetime: string;
  type: string;
  location_gps: string | null;
  lat: number;
  lng: number;
  url: string;
  timestamp: number;
  created_at: number;
  translated: number; // 0 = false, 1 = true
}

/**
 * Translation from the database
 */
export interface Translation {
  id: number;
  event_id: string;
  language: string;
  name: string;
  summary: string;
  created_at: number;
}

/**
 * Language content for API response
 */
export interface LanguageContent {
  name: string;
  summary: string;
}

/**
 * Event for API response
 */
export interface ApiEvent {
  id: string;
  name: string;
  summary: string;
  location_name: string;
  datetime: string;
  type: string;
  location_gps: string | null;
  timestamp: number;
  url: string;
  lat: number;
  lng: number;
  category?: string | null;
  translations?: Record<string, LanguageContent> | null;
}

/**
 * API Response for multiple events
 */
export interface ApiResponse {
  status: string;
  count: number;
  events: ApiEvent[];
  total?: number | null;
  offset?: number | null;
  limit?: number | null;
  language?: string | null;
  full_sync?: boolean;
}

/**
 * API Response for a single event
 */
export interface SingleEventResponse {
  status: string;
  event: ApiEvent | null;
}

/**
 * Geocoding result from Nominatim
 */
export interface GeocodingResult {
  place_id: number;
  licence: string;
  osm_type: string;
  osm_id: number;
  lat: string;
  lon: string;
  class: string;
  type: string;
  place_rank: number;
  importance: number;
  addresstype: string;
  name: string;
  display_name: string;
  boundingbox: string[];
} 