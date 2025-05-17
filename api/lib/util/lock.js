/**
 * Lock Utility
 * 
 * Provides a simple locking mechanism for preventing concurrent operations
 * Uses file system for lock persistence in development environments
 * For production, consider using Redis or another distributed lock system
 */

import fs from 'fs';
import path from 'path';
import { promisify } from 'util';

// In-memory locks for single-instance environments
const memoryLocks = new Map();

// Convert callback-based fs functions to Promise-based
const writeFile = promisify(fs.writeFile);
const readFile = promisify(fs.readFile);
const unlink = promisify(fs.unlink);
const mkdir = promisify(fs.mkdir);

// Lock file directory
const LOCK_DIR = path.join(process.cwd(), 'data', 'locks');

/**
 * Ensure the lock directory exists
 */
async function ensureLockDirExists() {
  try {
    if (!fs.existsSync(LOCK_DIR)) {
      await mkdir(LOCK_DIR, { recursive: true });
    }
  } catch (error) {
    console.error('Error creating lock directory:', error);
  }
}

/**
 * Acquire a lock for the given ID
 * 
 * @param {string} id - Lock identifier
 * @param {number} ttl - Time-to-live in milliseconds
 * @returns {Promise<boolean>} - Whether the lock was acquired
 */
export async function acquireLock(id, ttl = 60000) {
  if (!id) {
    throw new Error('Lock ID is required');
  }
  
  // Create normalize lock ID for file system
  const lockId = id.replace(/[^a-zA-Z0-9_-]/g, '_');
  const now = Date.now();
  const expiry = now + ttl;
  
  // Check in-memory locks first (faster)
  if (memoryLocks.has(lockId)) {
    const existingLock = memoryLocks.get(lockId);
    if (existingLock.expiry > now) {
      // Lock still valid
      return false;
    }
    // Lock expired, remove it
    memoryLocks.delete(lockId);
  }
  
  try {
    // Ensure lock directory exists
    await ensureLockDirExists();
    
    // Lock file path
    const lockFile = path.join(LOCK_DIR, `${lockId}.lock`);
    
    // Check if lock file exists and is valid
    if (fs.existsSync(lockFile)) {
      try {
        const lockData = JSON.parse(await readFile(lockFile, 'utf8'));
        if (lockData.expiry > now) {
          // Lock still valid
          return false;
        }
        // Lock expired, remove it
        await unlink(lockFile);
      } catch (error) {
        // Error reading lock file, assume it's corrupted and remove it
        try {
          await unlink(lockFile);
        } catch {
          // Ignore error if file doesn't exist
        }
      }
    }
    
    // Create new lock
    const lockData = {
      id: lockId,
      timestamp: now,
      expiry: expiry,
      ttl: ttl
    };
    
    // Store in memory
    memoryLocks.set(lockId, lockData);
    
    // Store in file system
    await writeFile(lockFile, JSON.stringify(lockData), 'utf8');
    
    return true;
  } catch (error) {
    console.error(`Error acquiring lock for ${id}:`, error);
    return false;
  }
}

/**
 * Release a lock
 * 
 * @param {string} id - Lock identifier
 * @returns {Promise<boolean>} - Whether the lock was released
 */
export async function releaseLock(id) {
  if (!id) {
    throw new Error('Lock ID is required');
  }
  
  // Create normalize lock ID for file system
  const lockId = id.replace(/[^a-zA-Z0-9_-]/g, '_');
  
  try {
    // Remove from memory
    memoryLocks.delete(lockId);
    
    // Remove from file system
    const lockFile = path.join(LOCK_DIR, `${lockId}.lock`);
    if (fs.existsSync(lockFile)) {
      await unlink(lockFile);
    }
    
    return true;
  } catch (error) {
    console.error(`Error releasing lock for ${id}:`, error);
    return false;
  }
}

/**
 * Check if a lock exists and is valid
 * 
 * @param {string} id - Lock identifier
 * @returns {Promise<boolean>} - Whether the lock exists and is valid
 */
export async function checkLock(id) {
  if (!id) {
    throw new Error('Lock ID is required');
  }
  
  // Create normalize lock ID for file system
  const lockId = id.replace(/[^a-zA-Z0-9_-]/g, '_');
  const now = Date.now();
  
  // Check in-memory locks first (faster)
  if (memoryLocks.has(lockId)) {
    const existingLock = memoryLocks.get(lockId);
    if (existingLock.expiry > now) {
      // Lock still valid
      return true;
    }
    // Lock expired, remove it
    memoryLocks.delete(lockId);
  }
  
  try {
    // Check file system
    const lockFile = path.join(LOCK_DIR, `${lockId}.lock`);
    if (fs.existsSync(lockFile)) {
      try {
        const lockData = JSON.parse(await readFile(lockFile, 'utf8'));
        if (lockData.expiry > now) {
          // Lock still valid
          // Update memory cache
          memoryLocks.set(lockId, lockData);
          return true;
        }
        // Lock expired, remove it
        await unlink(lockFile);
      } catch (error) {
        // Error reading lock file, assume it's corrupted and remove it
        try {
          await unlink(lockFile);
        } catch {
          // Ignore error if file doesn't exist
        }
      }
    }
    
    return false;
  } catch (error) {
    console.error(`Error checking lock for ${id}:`, error);
    return false;
  }
} 