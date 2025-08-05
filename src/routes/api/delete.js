// src/routes/api/delete.js

const { Fragment } = require('../../model/fragment');
const { createSuccessResponse } = require('../../response');
const logger = require('../../logger');

/**
 * Delete a fragment by ID for the current user
 */
module.exports = async (req, res) => {
  try {
    const fragment = await Fragment.byId(req.user, req.params.id);
    
    if (!fragment) {
      return res.status(404).json({
        status: 'error',
        error: {
          message: 'Fragment not found',
          code: 404
        }
      });
    }

    // Delete the fragment
    await Fragment.delete(req.user, req.params.id);

    // Send success response
    res.status(200).json(
      createSuccessResponse({
        status: 'ok'
      })
    );
  } catch (err) {
    logger.error({ err }, 'Error in DELETE /v1/fragments/:id');
    res.status(500).json({
      status: 'error',
      error: {
        message: 'Unable to delete fragment',
        code: 500
      }
    });
  }
};
