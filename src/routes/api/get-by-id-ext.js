// src/routes/api/get-by-id-ext.js

const { Fragment } = require('../../model/fragment');
const logger = require('../../logger');
const MarkdownIt = require('markdown-it');
const md = new MarkdownIt();

/**
 * Get a fragment by ID with format conversion
 */
module.exports = async (req, res) => {
  try {
    // Extract the id and extension from the URL
    const { id, ext } = req.params;

    const fragment = await Fragment.byId(req.user, id);
    const data = await fragment.getData();

    // Handle format conversions
    if (fragment.type.includes('text/markdown') && ext === 'html') {
      // Convert Markdown to HTML
      const htmlContent = md.render(data.toString());
      res.setHeader('Content-Type', 'text/html');
      return res.status(200).send(htmlContent);
    }

    // If no conversion is needed or possible, return original format
    res.setHeader('Content-Type', fragment.type);
    res.status(200).send(data);
  } catch (err) {
    logger.error({ err }, 'Error processing fragment conversion');
    res.status(404).json({
      status: 'error',
      error: {
        message: 'Fragment not found or conversion not supported',
        code: 404
      }
    });
  }
};
