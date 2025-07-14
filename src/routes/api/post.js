const { Fragment } = require('../../model/fragment');
const logger = require('../../logger');
const { createSuccessResponse } = require('../../response');

/**
 * Handle POST /fragments
 */
module.exports = async (req, res) => {
  logger.debug({ body: req.body }, 'POST /fragments request body');

  // Check if we got a Buffer vs. raw data
  if (!Buffer.isBuffer(req.body)) {
    logger.warn('POST /fragments request body is not a Buffer');
    return res.status(415).json({
      status: 'error',
      error: {
        message: 'Unsupported Media Type',
        code: 415
      }
    });
  }

  try {
    // Get the content type of the request
    const contentTypeHeader = req.get('Content-Type');

    // Create a new fragment
    const fragment = new Fragment({
      ownerId: req.user,
      type: contentTypeHeader
    });

    // Set the fragment's data
    await fragment.setData(req.body);

    // Get the API URL from environment or construct from request
    const apiUrl = process.env.API_URL || `${req.protocol}://${req.get('host')}`;

    // Create the Location header
    const location = `${apiUrl}/v1/fragments/${fragment.id}`;

    // Send a 201 response with the fragment and Location header
    res.location(location).status(201).json(
      createSuccessResponse({
        fragment: {
          id: fragment.id,
          ownerId: fragment.ownerId,
          created: fragment.created,
          updated: fragment.updated,
          type: fragment.type,
          size: fragment.size
        }
      })
    );
  } catch (err) {
    logger.error({ err }, 'Error processing POST /fragments request');
    res.status(500).json({
      status: 'error',
      error: {
        message: err.message,
        code: 500
      }
    });
  }
}; 