/**
 * API Endpoint: /api/v1/types
 * 
 * Returns unique event types from the database
 */

import { getDatabase } from '../../../lib/db/database.js';

export default async function handler(req, res) {
  try {
    // Get database connection
    const db = getDatabase();
    
    // Get all unique event types with counts
    const typesQuery = `
      SELECT 
        type, 
        COUNT(*) as count 
      FROM events 
      WHERE type IS NOT NULL 
      GROUP BY type 
      ORDER BY count DESC
    `;
    
    const types = db.prepare(typesQuery).all();
    
    // Format the types
    const formattedTypes = types.map(type => ({
      name: type.type,
      count: type.count
    }));
    
    // Return formatted response
    return res.status(200).json({
      success: true,
      data: formattedTypes,
      total: formattedTypes.length
    });
  } catch (error) {
    console.error('API error:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Internal server error',
      message: error.message 
    });
  }
} 