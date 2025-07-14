// src/routes/api/get-by-id-info.js

const { Fragment } = require('../../model/fragment');
const { createSuccessResponse } = require('../../response');
const logger = require('../../logger');

/**
 * Get a fragment's metadata by ID for the current user
 */
module.exports = async (req, res) => {
  try {
    const fragment = await Fragment.byId(req.user, req.params.id);
    
    // Return only the fragment's metadata
    res.status(200).json(
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
    logger.error({ err }, 'Error getting fragment metadata');
    res.status(404).json({
      status: 'error',
      error: {
        message: 'Fragment not found',
        code: 404
      }
    });
  }
};
