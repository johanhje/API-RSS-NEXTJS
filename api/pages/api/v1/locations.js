/**
 * API Endpoint: /api/v1/locations
 * 
 * Returns unique locations from the events database
 */

import { getDatabase } from '../../../lib/db/database.js';

export default async function handler(req, res) {
  try {
    // Extract and validate query parameters
    const { 
      page = '1', 
      limit = '50', 
      search 
    } = req.query;
    
    // Parse pagination parameters
    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 50;
    
    // Ensure reasonable limits to prevent abuse
    if (pageNum < 1 || limitNum < 1 || limitNum > 200) {
      return res.status(400).json({
        success: false,
        error: 'Invalid pagination parameters'
      });
    }
    
    // Calculate offset
    const offset = (pageNum - 1) * limitNum;
    
    // Get database connection
    const db = getDatabase();
    
    // Build query conditions for search
    let whereConditions = ["location_name IS NOT NULL", "lat IS NOT NULL", "lng IS NOT NULL"];
    let queryParams = [];
    
    if (search) {
      whereConditions.push('location_name LIKE ?');
      queryParams.push(`%${search}%`);
    }
    
    // Build the WHERE clause
    const whereClause = `WHERE ${whereConditions.join(' AND ')}`;
    
    // Get count for pagination
    const countQuery = `
      SELECT COUNT(DISTINCT location_name) as total 
      FROM events 
      ${whereClause}
    `;
    const totalCount = db.prepare(countQuery).get(...queryParams).total;
    
    // Get unique locations with coordinates
    const locationsQuery = `
      SELECT 
        location_name as name,
        lat as latitude,
        lng as longitude,
        location_gps as gps,
        COUNT(*) as event_count
      FROM events
      ${whereClause}
      GROUP BY location_name
      ORDER BY event_count DESC, name
      LIMIT ? OFFSET ?
    `;
    
    // Execute the query
    const locations = db.prepare(locationsQuery).all(...queryParams, limitNum, offset);
    
    // Format the locations
    const formattedLocations = locations.map(loc => ({
      name: loc.name,
      latitude: loc.latitude,
      longitude: loc.longitude,
      gps: loc.gps,
      event_count: loc.event_count
    }));
    
    // Return formatted response
    return res.status(200).json({
      success: true,
      data: formattedLocations,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: totalCount,
        pages: Math.ceil(totalCount / limitNum)
      }
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