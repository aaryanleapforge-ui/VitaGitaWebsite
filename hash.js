const bcrypt = require('bcryptjs');

const password = 'VitaGita@123';
const saltRounds = 10;

bcrypt.hash(password, saltRounds)
  .then(hash => {
    console.log(hash);
  })
  .catch(err => {
    console.error('Hash error:', err);
    process.exit(1);
  });
