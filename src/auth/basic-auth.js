// src/auth/basic-auth.js

// Configure HTTP Basic Auth strategy for Passport, see:
// https://github.com/http-auth/http-auth-passport

const auth = require('http-auth');
const authPassport = require('http-auth-passport');
const authorize = require('./auth-middleware');

const logger = require('../logger');

// We expect HTPASSWD_FILE to be defined.
if (!process.env.HTPASSWD_FILE) {
  throw new Error('missing expected env var: HTPASSWD_FILE');
}

// Log that we're using Basic Auth
logger.info('Using HTTP Basic Auth for auth');

module.exports.strategy = () =>
  // For our Passport authentication strategy, we'll look for a
  // username/password pair in the Authorization header.
  authPassport(
    auth.basic({
      file: process.env.HTPASSWD_FILE,
    })
  );

// Previously we defined `authenticate()` like this:
// module.exports.authenticate = () => passport.authenticate('http', { session: false });
//
// Now we'll delegate the authorization to our authorize middleware
module.exports.authenticate = () => authorize('http');
