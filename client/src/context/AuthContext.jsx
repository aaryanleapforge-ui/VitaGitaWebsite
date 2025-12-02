import React, { createContext, useContext, useEffect, useState } from 'react';
import { signInWithEmailAndPassword, onAuthStateChanged, signOut, getIdTokenResult } from 'firebase/auth';
import { auth, db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';

const AuthContext = createContext({ admin: null, loading: true, login: async ()=>({success:false}), logout: async ()=>{} });

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children, requireAdmin = true }) {
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) {
        setAdmin(null);
        setLoading(false);
        return;
      }
      try {
        const tokenResult = await getIdTokenResult(u, true);
        const hasAdminClaim = tokenResult?.claims?.role === 'admin' || tokenResult?.claims?.admin === true;
        if (hasAdminClaim) {
          setAdmin({ uid: u.uid, email: u.email, name: u.displayName, role: 'admin' });
        } else {
          // fallback: check admins collection for a doc matching the user's email
          try {
            const tryAdminDoc = async (id) => {
              try {
                const d = await getDoc(doc(db, 'admins', id));
                return d.exists() ? d : null;
              } catch (e) {
                return null;
              }
            };

            let adminDoc = null;
            if (u.email) adminDoc = await tryAdminDoc(u.email);
            if (!adminDoc && u.email) {
              const id = u.email.replaceAll('.', ',').replaceAll('@', '_at_');
              adminDoc = await tryAdminDoc(id);
            }

            if (adminDoc && adminDoc.exists() && (adminDoc.data().role === 'admin' || adminDoc.data().role === 'super_admin')) {
              setAdmin({ uid: u.uid, email: u.email, name: u.displayName, ...adminDoc.data() });
            } else {
              // fallback: query users collection by email for role
              try {
                const q = await db.collection('users').where('email', '==', u.email).limit(1).get();
                if (!q.empty) {
                  const d = q.docs[0];
                  const data = d.data();
                  if (data.role === 'admin' || data.role === 'super_admin') {
                    setAdmin({ uid: u.uid, email: u.email, name: u.displayName, ...data });
                  } else {
                    if (requireAdmin) {
                      await signOut(auth);
                      setAdmin(null);
                    } else {
                      setAdmin({ uid: u.uid, email: u.email, name: u.displayName });
                    }
                  }
                } else {
                  if (requireAdmin) {
                    await signOut(auth);
                    setAdmin(null);
                  } else {
                    setAdmin({ uid: u.uid, email: u.email, name: u.displayName });
                  }
                }
              } catch (e) {
                console.warn('Users lookup failed', e);
                if (requireAdmin) {
                  await signOut(auth);
                  setAdmin(null);
                } else {
                  setAdmin({ uid: u.uid, email: u.email, name: u.displayName });
                }
              }
            }
          } catch (e) {
            console.warn('Admin doc lookup failed', e);
            if (requireAdmin) {
              await signOut(auth);
              setAdmin(null);
            } else {
              setAdmin({ uid: u.uid, email: u.email, name: u.displayName });
            }
          }
        }
      } catch (err) {
        console.error('Auth token error', err);
        setAdmin(null);
      }
      setLoading(false);
    });
    return () => unsub();
  }, [requireAdmin]);

  async function login(email, password) {
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      const tokenResult = await getIdTokenResult(cred.user, true);
      const hasAdminClaim = tokenResult?.claims?.role === 'admin' || tokenResult?.claims?.admin === true;
      if (requireAdmin && hasAdminClaim) {
        return { success: true };
      }

      // Fallback checks: admins collection raw id, sanitized id, then users collection role field
      try {
        const tryAdminDoc = async (id) => {
          try {
            const d = await getDoc(doc(db, 'admins', id));
            return d.exists() ? d : null;
          } catch (e) {
            return null;
          }
        };

        let adminDoc = null;
        adminDoc = await tryAdminDoc(email);
        if (!adminDoc) {
          const id = email.replaceAll('.', ',').replaceAll('@', '_at_');
          adminDoc = await tryAdminDoc(id);
        }

        if (adminDoc && adminDoc.exists() && (adminDoc.data().role === 'admin' || adminDoc.data().role === 'super_admin')) {
          return { success: true, warning: 'Admin found in admins collection; consider setting custom claim for best UX.' };
        }

        // Last fallback: query users collection by email
        try {
          const q = await db.collection('users').where('email', '==', email).limit(1).get();
          if (!q.empty) {
            const data = q.docs[0].data();
            if (data.role === 'admin' || data.role === 'super_admin') {
              return { success: true };
            }
          }
        } catch (e) {
          console.warn('Users lookup failed', e);
        }
      } catch (e) {
        console.warn('Admin fallback checks failed', e);
      }

      // Not an admin
      await signOut(auth);
      return { success: false, error: 'Account is not an admin' };
    } catch (err) {
      console.error('Login error', err);
      return { success: false, error: err.message || 'Login failed' };
    }
  }

  async function logout() {
    try {
      await signOut(auth);
    } catch (err) {
      console.error('Logout error', err);
    }
  }

  return (
    <AuthContext.Provider value={{ admin, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
