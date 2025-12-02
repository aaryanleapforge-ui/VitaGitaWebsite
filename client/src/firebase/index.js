// Re-export the single Firebase app and services from the canonical initializer
// located at `client/src/firebase.js`. This prevents duplicate initialization
// while keeping imports consistent across the codebase.

import app, { auth, db, storage } from '../firebase';

export { app, auth, db, storage };
