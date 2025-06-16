// src/auth.js

// Configure a JWT token strategy for Passport based on
// Identity Token provided by Cognito. The token will be
// parsed from the Authorization header (i.e., Bearer Token).

const BearerStrategy = require('passport-http-bearer').Strategy;
const authorize = require('./auth-middleware');
const logger = require('../logger');

const { CognitoJwtVerifier } = require('aws-jwt-verify');

// We expect AWS_COGNITO_POOL_ID and AWS_COGNITO_CLIENT_ID to be defined.
if (!(process.env.AWS_COGNITO_POOL_ID && process.env.AWS_COGNITO_CLIENT_ID)) {
  throw new Error('missing expected env vars: AWS_COGNITO_POOL_ID and AWS_COGNITO_CLIENT_ID');
}

// Create a Cognito JWT Verifier, which will confirm that any supplied JWT
// access tokens are valid and issued by our Cognito User Pool.  We've already
// configured this in AWS, and here we're just telling the aws-jwt-verify library
// how to validate any tokens we receive. See:
// https://github.com/awslabs/aws-jwt-verify#cognitojwtverifier
const jwtVerifier = CognitoJwtVerifier.create({
  userPoolId: process.env.AWS_COGNITO_POOL_ID,
  clientId: process.env.AWS_COGNITO_CLIENT_ID,
  tokenUse: 'access',
});

// At startup, download and cache the public keys (JWKS) we need in order to
// verify our tokens. These will be valid for a long time, and will be refreshed
// automatically by the jwt verifier. We want to do it now in order to make sure
// we have them, and that there aren't any configuration problems, before we start
// the server.
jwtVerifier
  .hydrate()
  .then(() => {
    logger.info('Cognito JWKS cached');
  })
  .catch((err) => {
    logger.error({ err }, 'Unable to cache Cognito JWKS');
  });

// Configure the Bearer token strategy for Passport. We're using a JWT token,
// which the aws-jwt-verify library will confirm is valid and issued by our
// Cognito User Pool.  If it's valid, we'll set the email address as the user
// value in the req Object.
module.exports.strategy = () => 
  new BearerStrategy(async (token, done) => {
    try {
      // Verify this JWT
      const user = await jwtVerifier.verify(token);
      logger.debug({ user }, 'verified user token');

      // Create a user, but only bother with their email. We could
      // also do a lookup in a database, but we don't need it.
      done(null, user.email);
    } catch (err) {
      logger.error({ err, token }, 'could not verify token');
      done(null, false);
    }
  });

// Previously we defined `authenticate()` like this:
// module.exports.authenticate = () => passport.authenticate('bearer', { session: false });
//
// Now we'll delegate the authorization to our authorize middleware
module.exports.authenticate = () => authorize('bearer');
