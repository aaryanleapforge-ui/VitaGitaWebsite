// import_local_users.js
// Usage: node import_local_users.js ./path/to/local_users.json

const path = require('path');
const fs = require('fs');

async function main() {
  const arg = process.argv[2];
  if (!arg) {
    console.error('Usage: node import_local_users.js <path-to-local-json>');
    process.exit(1);
  }
  const filePath = path.resolve(arg);
  if (!fs.existsSync(filePath)) {
    console.error('File not found:', filePath);
    process.exit(1);
  }

  // Require existing Firestore helper from your server
  const { db } = require('./config/firestore'); // uses existing service account
  let raw = fs.readFileSync(filePath, 'utf8');
  let content;
  try {
    content = JSON.parse(raw);
  } catch (err) {
    console.error('Failed to parse JSON:', err.message);
    process.exit(1);
  }

  // Normalize users array
  let users = [];
  if (Array.isArray(content)) users = content;
  else if (Array.isArray(content.users)) users = content.users;
  else if (Array.isArray(content.data?.users)) users = content.data.users;
  else {
    console.error('Could not find users array in JSON. Provide an array or { users: [...] }');
    process.exit(1);
  }

  console.log(`Found ${users.length} users. Importing...`);

  for (let u of users) {
    if (!u.email) {
      console.warn('Skipping user without email:', u);
      continue;
    }
    try {
      // If a user already exists, update otherwise create
      const existing = await db.users.findByEmail(u.email);
      if (existing) {
        await db.users.update(u.email, { ...u });
        console.log('Updated user:', u.email);
      } else {
        await db.users.create(u);
        console.log('Created user:', u.email);
      }
    } catch (err) {
      console.error('Error importing user', u.email, err && err.message ? err.message : err);
    }
  }

  console.log('Import complete.');
  process.exit(0);
}

main();
