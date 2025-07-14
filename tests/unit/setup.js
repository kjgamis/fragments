const path = require('path');
const fs = require('fs');
const os = require('os');
const htpasswd = require('htpasswd-auth');

// Create a temporary htpasswd file for testing
async function setup() {
  const tmpDir = os.tmpdir();
  const htpasswdFile = path.join(tmpDir, 'test.htpasswd');
  
  // Create test users
  const users = [
    { username: 'user1@email.com', password: 'password1' },
    { username: 'user@email.com', password: 'password' }
  ];

  // Generate htpasswd file content
  const content = await users.reduce(async (promise, user) => {
    const acc = await promise;
    const hash = await htpasswd.hashPassword(user.password);
    return acc + `${user.username}:${hash}\n`;
  }, Promise.resolve(''));

  // Write to file
  fs.writeFileSync(htpasswdFile, content);
  
  // Set environment variables for testing
  process.env.HTPASSWD_FILE = htpasswdFile;
  process.env.LOG_LEVEL = 'silent';
}

module.exports = setup;
