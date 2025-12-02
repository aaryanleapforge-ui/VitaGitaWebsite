/**
 * Authentication Routes
 * 
 * Handles admin login, logout, and token refresh
 */

const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { db } = require('../config/database');
const { authenticateAdmin } = require('../middleware/auth');

const router = express.Router();

/**
 * POST /api/auth/login
 * Admin login
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email and password are required'
      });
    }
    
    // Get admin from database (with development fallback)
    let admin = null;
    try {
      const admins = await db.admins.getAll();
      admin = admins.find(a => a.email === email);
    } catch (err) {
      console.warn('Could not read admins from DB:', err && err.message);
    }

    // Development fallback: allow default credentials when no admin exists and not production
    if (!admin && process.env.NODE_ENV !== 'production') {
      const devEmail = process.env.DEFAULT_ADMIN_EMAIL || 'admin@gitagita.com';
      const devPassword = process.env.DEFAULT_ADMIN_PASSWORD || 'Admin@123456';
      if (email === devEmail && password === devPassword) {
        admin = { id: 'dev-admin', email: devEmail, password: devPassword, role: 'admin', name: 'Dev Admin' };
      }
    }

    if (!admin) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }
    
    // Verify password (support bcrypt-hashed and plaintext fallback in dev)
    let isPasswordValid = false;
    try {
      if (admin.password && typeof admin.password === 'string' && admin.password.startsWith && admin.password.startsWith('$2')) {
        isPasswordValid = await bcrypt.compare(password, admin.password);
      } else {
        isPasswordValid = password === admin.password;
      }
    } catch (pwErr) {
      console.warn('Password verify error:', pwErr && pwErr.message);
      isPasswordValid = false;
    }

    if (!isPasswordValid) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    // Update last login if possible
    try {
      const adminsAll = await db.admins.getAll();
      const idx = adminsAll.findIndex(a => a.email === admin.email);
      if (idx !== -1) {
        adminsAll[idx].lastLogin = new Date().toISOString();
        await db.admins.save(adminsAll);
      }
    } catch (e) {
      console.warn('Could not update admin lastLogin:', e && e.message);
    }
    
    // Generate JWT token
    const token = jwt.sign(
      {
        id: admin.id,
        email: admin.email,
        role: admin.role
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    // Return admin data (without password) and token
    const { password: _, ...adminData } = admin;
    
    res.json({
      success: true,
      data: {
        admin: adminData,
        token
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: 'Login failed'
    });
  }
});

/**
 * GET /api/auth/me
 * Get current admin info
 */
router.get('/me', authenticateAdmin, async (req, res) => {
  try {
    const admins = await db.admins.getAll();
    const admin = admins.find(a => a.id === req.admin.id);
    
    if (!admin) {
      return res.status(404).json({
        success: false,
        error: 'Admin not found'
      });
    }
    
    const { password, ...adminData } = admin;
    
    res.json({
      success: true,
      data: adminData
    });
  } catch (error) {
    console.error('Get admin error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get admin info'
    });
  }
});

/**
 * POST /api/auth/change-password
 * Change admin password
 */
router.post('/change-password', authenticateAdmin, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        error: 'Current and new passwords are required'
      });
    }
    
    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        error: 'New password must be at least 8 characters'
      });
    }
    
    const admins = await db.admins.getAll();
    const adminIndex = admins.findIndex(a => a.id === req.admin.id);
    
    if (adminIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Admin not found'
      });
    }
    
    // Verify current password
    const isPasswordValid = await bcrypt.compare(
      currentPassword,
      admins[adminIndex].password
    );
    
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        error: 'Current password is incorrect'
      });
    }
    
    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    admins[adminIndex].password = hashedPassword;
    
    await db.admins.save(admins);
    
    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to change password'
    });
  }
});

module.exports = router;
