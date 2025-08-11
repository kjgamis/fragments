// src/routes/api/index.js

/**
 * The main entry-point for the v1 version of the fragments API.
 */
const express = require('express');
const contentType = require('content-type');
const { Fragment } = require('../../model/fragment');

// Create a router on which to mount our API endpoints
const router = express.Router();

const rawBody = () =>
  express.raw({
    inflate: true,
    limit: '5mb',
    type: (req) => {
      // See if we can parse this content type. If we can, `req.body` will be
      // a Buffer (e.g., `Buffer.isBuffer(req.body) === true`). If not, `req.body`
      // will be equal to an empty Object `{}` and `Buffer.isBuffer(req.body) === false`
      const { type } = contentType.parse(req);
      return Fragment.isSupportedType(type);
    },
  });

// Use a raw body parser for POST, which will give a `Buffer` Object or `{}` at `req.body`
// You can use Buffer.isBuffer(req.body) to test if it was parsed by the raw body parser.
router.post('/fragments', rawBody(), require('./post'));

// PUT /v1/fragments/:id (must come before GET routes with :id)
router.put('/fragments/:id', rawBody(), require('./put'));

// Define our first route, which will be: GET /v1/fragments
router.get('/fragments', require('./get'));

// GET /v1/fragments/:id/info must come before other /fragments/:id routes
router.get('/fragments/:id/info', require('./get-by-id-info'));

// GET /fragments/:id.ext (e.g., .html, .txt)
router.get('/fragments/:id.:ext', require('./get-by-id-ext'));

// GET /fragments/:id
router.get('/fragments/:id', require('./get-by-id'));

// DELETE /fragments/:id
router.delete('/fragments/:id', require('./delete'));

module.exports = router;
