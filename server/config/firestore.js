/**
 * Firebase Firestore Configuration
 * Replaces JSON file database for persistent storage
 */

const admin = require('firebase-admin');
const path = require('path');

// Load service account key - supports (1) env JSON, (2) production path, (3) local file
let serviceAccount;
if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
  try {
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
    console.log(' Using Firebase key from FIREBASE_SERVICE_ACCOUNT_JSON env');
  } catch (err) {
    console.error('Invalid JSON in FIREBASE_SERVICE_ACCOUNT_JSON:', err.message);
    throw err;
  }
} else {
  const productionKeyPath = '/etc/secrets/vitagita-firebase-adminsdk.json';
  const localKeyPath = path.join(__dirname, '..', 'vitagita-firebase-adminsdk.json');
  try {
    // Try production path first (Render.com)
    serviceAccount = require(productionKeyPath);
    console.log(' Using production Firebase key from filesystem');
  } catch (error) {
    // Fall back to local path
    serviceAccount = require(localKeyPath);
    console.log(' Using local Firebase key file');
  }
}

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: 'vitagita',
});

const db = admin.firestore();

// Collections
const collections = {
  users: db.collection('users'),
  shloks: db.collection('shloks'),
  videos: db.collection('videos'),
  analytics: db.collection('analytics'),
  admins: db.collection('admins'),  // Admin users collection
};

/**
 * Firestore Database Helper Functions
 */
const firestoreDB = {
  // Users
  users: {
    async getAll() {
      const snapshot = await collections.users.get();
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    },

    async save(users) {
      const batch = db.batch();

      // Delete all existing users
      const snapshot = await collections.users.get();
      snapshot.docs.forEach(doc => batch.delete(doc.ref));

      // Add new users
      users.forEach(user => {
        const id = user.uid || db.collection('users').doc().id;
        const docRef = collections.users.doc(id);
        batch.set(docRef, { ...user, uid: id });
      });

      await batch.commit();
      return true;
    },

    async findByEmail(email) {
      const q = await collections.users.where('email', '==', email).limit(1).get();
      if (q.empty) return null;
      const doc = q.docs[0];
      return { id: doc.id, ...doc.data() };
    },

    async create(userData) {
      const id = userData.uid || db.collection('users').doc().id;
      const docRef = collections.users.doc(id);
      await docRef.set({ ...userData, uid: id });
      return { id: docRef.id, ...userData, uid: id };
    },

    async update(email, updates) {
      const q = await collections.users.where('email', '==', email).limit(1).get();
      if (q.empty) return false;
      const docId = q.docs[0].id;
      await collections.users.doc(docId).update({ ...updates, updatedAt: new Date().toISOString() });
      return true;
    },

    async delete(email) {
      const q = await collections.users.where('email', '==', email).limit(1).get();
      if (q.empty) return false;
      const docId = q.docs[0].id;
      await collections.users.doc(docId).delete();
      return true;
    },
  },

  // Admins Collection
  admins: {
    async getAll() {
      const snapshot = await collections.admins.get();
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    },

    async findByEmail(email) {
      const doc = await collections.admins.doc(email).get();
      return doc.exists ? { id: doc.id, ...doc.data() } : null;
    },

    async create(adminData) {
      const docRef = collections.admins.doc(adminData.email);
      await docRef.set(adminData);
      return { id: docRef.id, ...adminData };
    },

    async update(email, updates) {
      await collections.admins.doc(email).update({
        ...updates,
        updatedAt: new Date().toISOString(),
      });
    },

    async save(admins) {
      const batch = db.batch();

      // Delete all existing admins
      const snapshot = await collections.admins.get();
      snapshot.docs.forEach(doc => batch.delete(doc.ref));

      // Add new admins
      admins.forEach(admin => {
        const docRef = collections.admins.doc(admin.email);
        batch.set(docRef, admin);
      });

      await batch.commit();
      return true;
    },

    async delete(email) {
      await collections.admins.doc(email).delete();
    },
  },

  // Shloks
  shloks: {
    async getAll() {
      const snapshot = await collections.shloks.get();
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    },

    async save(shloks) {
      const batch = db.batch();

      // Delete all existing shloks
      const snapshot = await collections.shloks.get();
      snapshot.docs.forEach(doc => batch.delete(doc.ref));

      // Add new shloks
      shloks.forEach((shlok, index) => {
        const docRef = collections.shloks.doc(`shlok_${index}`);
        batch.set(docRef, shlok);
      });

      await batch.commit();
      return true;
    },
  },

  // Videos
  videos: {
    async getAll() {
      const snapshot = await collections.videos.get();
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    },

    async save(videos) {
      const batch = db.batch();

      // Delete all existing videos
      const snapshot = await collections.videos.get();
      snapshot.docs.forEach(doc => batch.delete(doc.ref));

      // Add new videos
      videos.forEach((video, index) => {
        const docRef = collections.videos.doc(video.key || `video_${index}`);
        batch.set(docRef, video);
      });

      await batch.commit();
      return true;
    },
  },

  // Analytics
  analytics: {
    async get() {
      const doc = await collections.analytics.doc('stats').get();
      if (doc.exists) {
        return doc.data();
      }
      // Return default analytics if not exists
      return {
        totalUsers: 0,
        totalShloks: 0,
        totalVideos: 0,
        newUsersToday: 0,
        lastUpdated: new Date().toISOString(),
      };
    },

    async save(analyticsData) {
      await collections.analytics.doc('stats').set({
        ...analyticsData,
        lastUpdated: new Date().toISOString(),
      });
      return true;
    },
  },
};

module.exports = { db: firestoreDB, firestore: db, admin };
