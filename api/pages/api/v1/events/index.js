/**
 * API Endpoint for listing events
 */

import { getAllEvents, countEvents } from '../../../../lib/db/events.js';
import { SUPPORTED_LANGUAGES } from '../../../../lib/config.js';
import { createApiRoute, parseQueryParams } from '../../../../lib/api/wrapper.js';
import { ValidationError } from '../../../../lib/errors/index.js';
import { createLogger } from '../../../../lib/logging/index.js';

// Create logger
const logger = createLogger({ module: 'eventsApi' });

// Define query parameter schema
const querySchema = {
  limit: { 
    type: 'number', 
    defaultValue: 100,
    validator: (val) => val > 0 && val <= 1000 ? true : 'Must be between 1 and 1000'
  },
  offset: { 
    type: 'number', 
    defaultValue: 0,
    validator: (val) => val >= 0 ? true : 'Must be a positive number'
  },
  language: { 
    type: 'string',
    validator: (val) => SUPPORTED_LANGUAGES[val] ? true : `Unsupported language. Supported: ${Object.keys(SUPPORTED_LANGUAGES).join(', ')}`
  },
  full_sync: {
    type: 'boolean',
    defaultValue: false
  }
};

// Define handlers for different HTTP methods
const handlers = {
  /**
   * GET handler for events
   * 
   * @param {Object} req - Next.js request object
   * @param {Object} res - Next.js response object
   */
  async GET(req, res) {
    try {
      // Validate and parse query parameters
      const params = parseQueryParams(req, querySchema);
      
      // Log the request parameters
      logger.debug('Fetching events with params', params);
      
      // Get total count for pagination
      const total = await countEvents(params);
      
      // Get events with pagination
      const events = await getAllEvents(params);
      
      // Respond with events
      res.status(200).json({
        status: 'ok',
        data: {
          events,
          pagination: {
            total,
            limit: params.limit,
            offset: params.offset,
            hasMore: total > (params.offset + params.limit)
          }
        }
      });
    } catch (err) {
      // Error is automatically handled by the middleware
      throw err;
    }
  }
};

// Export with API middleware
export default createApiRoute(handlers, {
  // Use standard rate limiting for this public endpoint
  rateLimit: true,
  restricted: false
}); 