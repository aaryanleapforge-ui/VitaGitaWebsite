/**
 * Authentication Context
 * 
 * Manages admin authentication state globally
 */

import React, { createContext, useState, useContext, useEffect } from 'react';
import { auth, db } from '../firebase';
import { signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

export const AuthProvider = ({ children }) => {
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Monitor auth state
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setAdmin(null);
        setIsAuthenticated(false);
        setLoading(false);
        return;
      }

      try {
        // Prefer checking custom claim on token (fast)
        const token = await user.getIdTokenResult();
        if (token.claims && (token.claims.role === 'admin' || token.claims.admin === true)) {
          setAdmin({ email: user.email, uid: user.uid, role: 'admin' });
          setIsAuthenticated(true);
        } else {
          // Check admins collection (legacy) — try raw email doc id, then sanitized id fallback
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
          if (user.email) adminSnap = await tryAdminDoc(user.email);
          if (!adminSnap && user.email) {
            const id = user.email.replaceAll('.', ',').replaceAll('@', '_at_');
            adminSnap = await tryAdminDoc(id);
          }

          if (adminSnap && adminSnap.exists() && (adminSnap.data().role === 'admin' || adminSnap.data().role === 'super_admin')) {
            setAdmin({ email: user.email, uid: user.uid, ...adminSnap.data() });
            setIsAuthenticated(true);
          } else {
            // Fallback: query users collection by email field
            const q = query(collection(db, 'users'), where('email', '==', user.email));
            const snap = await getDocs(q);
            if (snap.docs.length > 0) {
              const d = snap.docs[0];
              const data = d.data();
              if (data.role === 'admin' || data.role === 'super_admin') {
                setAdmin({ email: user.email, uid: user.uid, ...data });
                setIsAuthenticated(true);
              } else {
                await signOut(auth);
                setAdmin(null);
                setIsAuthenticated(false);
              }
            } else {
              await signOut(auth);
              setAdmin(null);
              setIsAuthenticated(false);
            }
          }
        }
      } catch (e) {
        console.error('Auth check failed', e);
        setAdmin(null);
        setIsAuthenticated(false);
      } finally {
        setLoading(false);
      }
    });

    return () => unsub();
  }, []);

  const login = async (email, password) => {
    try {
      const userCred = await signInWithEmailAndPassword(auth, email, password);
      const user = userCred.user;

      // First: check ID token custom claims
      const token = await user.getIdTokenResult(true);
      if (token.claims && (token.claims.role === 'admin' || token.claims.admin === true)) {
        setAdmin({ email: user.email, uid: user.uid, role: 'admin' });
        setIsAuthenticated(true);
        return { success: true };
      }

      // Second: legacy admins collection lookup (document id is email)
      try {
        // Try raw email id then sanitized id for backwards compatibility
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
        if (user.email) adminSnap = await tryAdminDoc(user.email);
        if (!adminSnap && user.email) {
          const id = user.email.replaceAll('.', ',').replaceAll('@', '_at_');
          adminSnap = await tryAdminDoc(id);
        }

        if (adminSnap && adminSnap.exists() && (adminSnap.data().role === 'admin' || adminSnap.data().role === 'super_admin')) {
          setAdmin({ email: user.email, uid: user.uid, ...adminSnap.data() });
          setIsAuthenticated(true);
          return { success: true, warning: 'Admin found in admins collection; please set custom claim for full access.' };
        }
      } catch (e) {
        console.warn('Admins lookup failed', e);
      }

      // Not an admin
      await signOut(auth);
      return { success: false, error: 'User is not an admin' };
    } catch (error) {
      // Map common Firebase auth errors to friendly messages
      const msg = (error && error.code)
        ? (error.code === 'auth/wrong-password'
            ? 'Wrong password' : (error.code === 'auth/user-not-found' ? 'User not found' : error.message))
        : (error.message || 'Login failed');
      return { success: false, error: msg };
    }
  };

  const logout = async () => {
    await signOut(auth);
    setAdmin(null);
    setIsAuthenticated(false);
  };

  const value = { admin, isAuthenticated, loading, login, logout };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
