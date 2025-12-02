const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

const filePath = (name) => path.join(dataDir, `${name}.json`);

function readJSON(name, defaultValue) {
  const p = filePath(name);
  try {
    if (!fs.existsSync(p)) {
      fs.writeFileSync(p, JSON.stringify(defaultValue || [], null, 2));
      return defaultValue || [];
    }
    const raw = fs.readFileSync(p, 'utf8');
    return JSON.parse(raw || '[]');
  } catch (err) {
    console.warn('localdb read error for', name, err.message);
    return defaultValue || [];
  }
}

function writeJSON(name, data) {
  const p = filePath(name);
  fs.writeFileSync(p, JSON.stringify(data, null, 2));
}

const local = {
  users: {
    async getAll() {
      return readJSON('users', []);
    },
    async save(users) {
      writeJSON('users', users);
      return true;
    },
    async findByEmail(email) {
      const users = readJSON('users', []);
      return users.find(u => u.email === email) || null;
    },
    async create(userData) {
      const users = readJSON('users', []);
      users.push(userData);
      writeJSON('users', users);
      return userData;
    },
    async update(email, updates) {
      const users = readJSON('users', []);
      const idx = users.findIndex(u => u.email === email);
      if (idx === -1) throw new Error('User not found');
      users[idx] = { ...users[idx], ...updates, updatedAt: new Date().toISOString() };
      writeJSON('users', users);
      return users[idx];
    },
    async delete(email) {
      let users = readJSON('users', []);
      users = users.filter(u => u.email !== email);
      writeJSON('users', users);
      return true;
    }
  },

  admins: {
    async getAll() {
      return readJSON('admins', []);
    },
    async findByEmail(email) {
      const admins = readJSON('admins', []);
      return admins.find(a => a.email === email) || null;
    },
    async create(adminData) {
      const admins = readJSON('admins', []);
      admins.push(adminData);
      writeJSON('admins', admins);
      return adminData;
    },
    async save(admins) {
      writeJSON('admins', admins);
      return true;
    }
  },

  shloks: {
    async getAll() { return readJSON('shloks', []); },
    async save(shloks) { writeJSON('shloks', shloks); return true; }
  },

  videos: {
    async getAll() { return readJSON('videos', []); },
    async save(videos) { writeJSON('videos', videos); return true; }
  },

  analytics: {
    async get() {
      const data = readJSON('analytics', {});
      if (!data || Object.keys(data).length === 0) return { totalUsers: 0, totalShloks: 0, totalVideos: 0, newUsersToday: 0, lastUpdated: new Date().toISOString() };
      return data;
    },
    async save(analyticsData) {
      writeJSON('analytics', { ...analyticsData, lastUpdated: new Date().toISOString() });
      return true;
    }
  }
};

module.exports = local;
