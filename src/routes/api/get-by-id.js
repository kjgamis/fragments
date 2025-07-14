// src/routes/api/get-by-id.js

const { Fragment } = require('../../model/fragment');

/**
 * Get a fragment by ID for the current user
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

    // Get the fragment's data
    const data = await fragment.getData();

    // Send the response with the correct content type
    res.setHeader('Content-Type', fragment.type);
    res.status(200).send(data);
  } catch (err) {
    console.error('Error in GET /v1/fragments/:id', { err });
    res.status(500).json({
      status: 'error',
      error: {
        message: 'Unable to get fragment',
        code: 500
      }
    });
  }
};
