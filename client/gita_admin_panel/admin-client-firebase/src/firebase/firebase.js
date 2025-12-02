// Re-export the canonical Firebase app and services from the main initializer
// at `client/src/firebase.js` to avoid duplicate initialization.

import app, { auth, db } from '../../../../src/firebase';

export { app, auth, db };

export default app;
