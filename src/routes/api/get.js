// src/routes/api/get.js

const { Fragment } = require('../../model/fragment');
const { createSuccessResponse } = require('../../response');
const logger = require('../../logger');

/**
 * Get a list of fragments for the current user
 */
module.exports = async (req, res) => {
  try {
    // Check if expand parameter is present
    const expand = req.query.expand === '1';
    logger.debug({ expand, user: req.user }, 'GET /fragments request');
    
    // Get the authenticated user's fragments
    const fragments = await Fragment.byUser(req.user, expand);
    logger.debug({ fragments }, 'Fragments retrieved');

    const response = createSuccessResponse({
      fragments
    });
    logger.debug({ response }, 'Sending response');

    res.status(200).json(response);
  } catch (err) {
    logger.error({ err }, 'Error processing GET /fragments request');
    res.status(500).json({
      status: 'error',
      error: {
        message: err.message,
        code: 500
      }
    });
  }
};
