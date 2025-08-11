// src/routes/api/put.js

/**
 * PUT /v1/fragments/:id
 * Update an existing fragment
 */
const { Fragment } = require('../../model/fragment');
const { createSuccessResponse, createErrorResponse } = require('../../response');

/**
 * Handle PUT /fragments/:id
 */
module.exports = async (req, res) => {
  try {
    const fragmentId = req.params.id;
    const ownerId = req.user; // From auth middleware

    // Check if fragment exists and belongs to user
    const existingFragment = await Fragment.byId(ownerId, fragmentId);
    if (!existingFragment) {
      return res.status(404).json(createErrorResponse(404, 'Fragment not found'));
    }

    // Get content type from headers
    const contentType = req.get('Content-Type');
    if (!contentType) {
      return res.status(400).json(createErrorResponse(400, 'Content-Type header is required'));
    }

    // Validate content type
    if (!Fragment.isSupportedType(contentType)) {
      return res.status(400).json(createErrorResponse(400, 'Unsupported content type'));
    }

    // Check if body is a Buffer (raw body parser)
    if (!Buffer.isBuffer(req.body)) {
      return res.status(400).json(createErrorResponse(400, 'Invalid request body'));
    }

    // Update the fragment
    const updatedFragment = new Fragment({
      id: fragmentId,
      ownerId: ownerId,
      type: contentType,
      size: req.body.length
    });

    // Save the updated fragment metadata
    await updatedFragment.save();

    // Save the fragment data (pass the buffer directly)
    await updatedFragment.setData(req.body);

    // Return the updated fragment info
    res.status(200).json(createSuccessResponse({ fragment: updatedFragment }));
  } catch {
    res.status(500).json(createErrorResponse(500, 'Internal server error'));
  }
};
