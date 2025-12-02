// Firebase helpers - Firestore + Auth + Storage wrappers
import { auth, db, storage } from './index';
import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
} from 'firebase/firestore';
import { query, where, serverTimestamp } from 'firebase/firestore';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { signInWithEmailAndPassword, signOut } from 'firebase/auth';

// Auth helpers
export async function firebaseLogin(email, password) {
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  // refresh token and return idTokenResult too
  const user = userCredential.user;
  return user;
}

export async function firebaseLogout() {
  return signOut(auth);
}

// Admin verification: check 'admins' collection OR users doc with role: 'admin'
export async function isAdminByEmail(email) {
  // Check admins collection by document id = email (legacy). Try raw email id, then sanitized id.
  const tryAdminDoc = async (id) => {
    try {
      const ref = doc(db, 'admins', id);
      const s = await getDoc(ref);
      return s.exists() ? s : null;
    } catch (e) {
      return null;
    }
  };

  let adminSnap = null;
  if (email) adminSnap = await tryAdminDoc(email);
  if (!adminSnap && email) {
    const id = email.replaceAll('.', ',').replaceAll('@', '_at_');
    adminSnap = await tryAdminDoc(id);
  }
  if (adminSnap) {
    const data = adminSnap.data();
    if (data.role === 'admin' || data.role === 'super_admin') return true;
  }

  // Fallback: query users collection by email field
  const q = query(collection(db, 'users'), where('email', '==', email));
  const snap = await getDocs(q);
  for (const d of snap.docs) {
    const data = d.data();
    if (data.role === 'admin' || data.role === 'super_admin') return true;
  }

  return false;
}

// Users
export async function getAllUsers() {
  const q = collection(db, 'users');
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function getUserById(id) {
  const dref = doc(db, 'users', id);
  const snap = await getDoc(dref);
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export async function updateUser(id, updates) {
  const dref = doc(db, 'users', id);
  await updateDoc(dref, updates);
}

export async function deleteUser(id) {
  const dref = doc(db, 'users', id);
  await deleteDoc(dref);
}

// Shloks
export async function getAllShloks() {
  const snap = await getDocs(collection(db, 'shloks'));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function createOrUpdateShlok(id, data) {
  const dref = doc(db, 'shloks', id || String(Date.now()));
  await setDoc(dref, { ...data, updatedAt: serverTimestamp() }, { merge: true });
}

export async function deleteShlok(id) {
  const dref = doc(db, 'shloks', id);
  await deleteDoc(dref);
}

// Videos: upload file to storage and create video doc
export async function uploadVideoFile(file, storagePath) {
  const ref = storageRef(storage, storagePath);
  const snap = await uploadBytes(ref, file);
  const url = await getDownloadURL(snap.ref);
  return url;
}

export async function createVideoDoc(id, docData) {
  const dref = doc(db, 'videos', id || String(Date.now()));
  await setDoc(dref, { ...docData, updatedAt: serverTimestamp() });
}

// Analytics / Dashboard helpers
export async function getCounts() {
  const usersSnap = await getDocs(collection(db, 'users'));
  const shloksSnap = await getDocs(collection(db, 'shloks'));
  const videosSnap = await getDocs(collection(db, 'videos'));

  return {
    totalUsers: usersSnap.size,
    totalShloks: shloksSnap.size,
    totalVideos: videosSnap.size,
  };
}

const firebaseHelpers = {
  firebaseLogin,
  firebaseLogout,
  isAdminByEmail,
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  getAllShloks,
  createOrUpdateShlok,
  deleteShlok,
  uploadVideoFile,
  createVideoDoc,
  getCounts,
};

export default firebaseHelpers;
