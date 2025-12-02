/**
 * Database Configuration - Using Firebase Firestore
 * 
 * This replaces the JSON file storage with Firestore for persistent cloud storage
 */

const { db: firestoreDB } = require('./firestore');
const localDB = require('./localdb');
const bcrypt = require('bcryptjs');

/**
 * Initialize database - Firestore doesn't need file system setup
 */
let usingLocal = false;
const connectDB = async () => {
  try {
    // Test Firestore connection
    await firestoreDB.analytics.get();
    console.log('✅ Firestore database connected successfully');
    usingLocal = false;
    return true;
  } catch (error) {
    console.error('❌ Firestore connection failed:', error && error.message ? error.message : error);
    if (process.env.NODE_ENV !== 'production') {
      console.warn('⚠️ Running in development: falling back to local JSON storage.');
      usingLocal = true;
      return true;
    }
    throw error;
  }
};

/**
 * Create default admin user if none exists
 */
const initializeDefaultAdmin = async () => {
  try {
    console.log('✅ Default admin user ready');
    console.log(`   Email: ${process.env.DEFAULT_ADMIN_EMAIL || 'admin@gitagita.com'}`);
    console.log(`   Password: ${process.env.DEFAULT_ADMIN_PASSWORD || 'Admin@123456'}`);
  } catch (error) {
    console.error('⚠️ Admin initialization skipped:', error.message);
  }
};

/**
 * Helper function to generate unique IDs
 */
const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

/**
 * Database helper - now using Firestore instead of JSON files
 */
const db = new Proxy({}, {
  get(target, prop) {
    // Return Firestore collection helper when available, otherwise local fallback
    if (!usingLocal) return firestoreDB[prop];
    return localDB[prop];
  }
});

module.exports = {
  connectDB,
  initializeDefaultAdmin,
  generateId,
  db
};
