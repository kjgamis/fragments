// src/routes/api/get-by-id-ext.js

const { Fragment } = require('../../model/fragment');
const logger = require('../../logger');
const MarkdownIt = require('markdown-it');
const sharp = require('sharp');
const md = new MarkdownIt();

/**
 * Get a fragment by ID with format conversion
 */
module.exports = async (req, res) => {
  try {
    // Extract the id and extension from the URL
    const { id, ext } = req.params;

    const fragment = await Fragment.byId(req.user, id);
    
    if (!fragment) {
      return res.status(404).json({
        status: 'error',
        error: {
          message: 'Fragment not found',
          code: 404
        }
      });
    }
    
    const data = await fragment.getData();

    // Get the target format based on extension
    const targetFormat = getTargetFormat(ext);
    
    if (!targetFormat) {
      return res.status(400).json({
        status: 'error',
        error: {
          message: 'Unsupported conversion format',
          code: 400
        }
      });
    }

    // Check if conversion is supported
    if (!fragment.formats.includes(targetFormat)) {
      return res.status(400).json({
        status: 'error',
        error: {
          message: `Conversion from ${fragment.type} to ${targetFormat} is not supported`,
          code: 400
        }
      });
    }

    // Perform the conversion
    const convertedData = await convertFragment(data, fragment.type, targetFormat);
    
    // Set the appropriate content type
    res.setHeader('Content-Type', targetFormat);
    res.status(200).send(convertedData);
  } catch (err) {
    logger.error({ err }, 'Error processing fragment conversion');
    res.status(404).json({
      status: 'error',
      error: {
        message: 'Fragment not found or conversion failed',
        code: 404
      }
    });
  }
};

/**
 * Get target format based on file extension
 */
function getTargetFormat(ext) {
  const formatMap = {
    'txt': 'text/plain',
    'md': 'text/markdown',
    'html': 'text/html',
    'csv': 'text/csv',
    'json': 'application/json',
    'yaml': 'application/yaml',
    'yml': 'application/yaml',
    'png': 'image/png',
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'webp': 'image/webp',
    'avif': 'image/avif',
    'gif': 'image/gif'
  };
  
  return formatMap[ext.toLowerCase()];
}

/**
 * Convert fragment data from one format to another
 */
async function convertFragment(data, sourceType, targetType) {
  const { type } = require('content-type').parse(sourceType);
  
  // Text-based conversions
  if (type.startsWith('text/') || type === 'application/json') {
    return convertTextContent(data, sourceType, targetType);
  }
  
  // Image-based conversions
  if (type.startsWith('image/')) {
    return convertImageContent(data, targetType);
  }
  
  throw new Error(`Unsupported conversion from ${sourceType} to ${targetType}`);
}

/**
 * Convert text content between formats
 */
function convertTextContent(data, sourceType, targetType) {
  const content = data.toString();
  const { type } = require('content-type').parse(sourceType);
  
  // Markdown to HTML
  if (type === 'text/markdown' && targetType === 'text/html') {
    return md.render(content);
  }
  
  // Markdown to plain text
  if (type === 'text/markdown' && targetType === 'text/plain') {
    // Strip markdown formatting to get plain text
    return content
      .replace(/^#+\s*/gm, '') // Remove headers
      .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold
      .replace(/\*(.*?)\*/g, '$1') // Remove italic
      .replace(/`(.*?)`/g, '$1') // Remove inline code
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Remove links, keep text
      .replace(/^\s*[-*+]\s+/gm, '') // Remove list markers
      .replace(/^\s*\d+\.\s+/gm, '') // Remove numbered list markers
      .replace(/^\s*>/gm, '') // Remove blockquotes
      .replace(/\n\s*\n/g, '\n') // Remove extra blank lines
      .trim();
  }
  
  // Markdown to JSON
  if (type === 'text/markdown' && targetType === 'application/json') {
    return JSON.stringify({ content });
  }
  
  // Markdown to CSV
  if (type === 'text/markdown' && targetType === 'text/csv') {
    return `content\n${content}`;
  }
  
  // HTML to Markdown (simplified - just strip tags)
  if (type === 'text/html' && targetType === 'text/markdown') {
    return content.replace(/<[^>]*>/g, '');
  }
  
  // HTML to CSV
  if (type === 'text/html' && targetType === 'text/csv') {
    return convertHtmlToCsv(content);
  }
  
  // HTML to Plain text
  if (type === 'text/html' && targetType === 'text/plain') {
    return content.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
  }
  
  // JSON to other formats
  if (type === 'application/json') {
    try {
      const jsonData = JSON.parse(content);
      
      if (targetType === 'text/plain') {
        return JSON.stringify(jsonData, null, 2);
      }
      if (targetType === 'text/csv') {
        return convertJsonToCsv(jsonData);
      }
      if (targetType === 'text/html') {
        return `<pre>${JSON.stringify(jsonData, null, 2)}</pre>`;
      }
      if (targetType === 'text/markdown') {
        return `\`\`\`json\n${JSON.stringify(jsonData, null, 2)}\n\`\`\``;
      }
      if (targetType === 'application/yaml') {
        return convertJsonToYaml(jsonData);
      }
    } catch (error) {
      throw new Error(`Invalid JSON content: ${error.message}`);
    }
  }
  
  // YAML to other formats
  if (type === 'application/yaml') {
    try {
      const yaml = require('js-yaml');
      const yamlData = yaml.load(content);
      
      if (targetType === 'text/plain') {
        return yaml.dump(yamlData);
      }
      if (targetType === 'application/json') {
        return JSON.stringify(yamlData, null, 2);
      }
      if (targetType === 'text/html') {
        return `<pre>${yaml.dump(yamlData)}</pre>`;
      }
      if (targetType === 'text/markdown') {
        return `\`\`\`yaml\n${yaml.dump(yamlData)}\n\`\`\``;
      }
    } catch (error) {
      throw new Error(`Invalid YAML content: ${error.message}`);
    }
  }
  
  // CSV to other formats
  if (type === 'text/csv') {
    if (targetType === 'application/json') {
      return convertCsvToJson(content);
    }
    if (targetType === 'text/html') {
      return convertCsvToHtml(content);
    }
  }
  
  // Plain text to other formats
  if (type === 'text/plain') {
    if (targetType === 'text/html') {
      return content.replace(/\n/g, '<br>');
    }
    if (targetType === 'text/markdown') {
      return content;
    }
    if (targetType === 'application/json') {
      return JSON.stringify({ content });
    }
  }
  
  // Default: return as-is
  return content;
}

/**
 * Convert image content using Sharp
 */
async function convertImageContent(data, targetType) {
  const format = targetType.split('/')[1];
  
  try {
    const sharpInstance = sharp(data);
    
    switch (format) {
      case 'png':
        return await sharpInstance.png().toBuffer();
      case 'jpeg':
      case 'jpg':
        return await sharpInstance.jpeg().toBuffer();
      case 'webp':
        return await sharpInstance.webp().toBuffer();
      case 'avif':
        return await sharpInstance.avif().toBuffer();
      case 'gif':
        return await sharpInstance.gif().toBuffer();
      default:
        throw new Error(`Unsupported image format: ${format}`);
    }
  } catch (error) {
    logger.error({ error, targetType }, 'Image conversion failed');
    throw new Error(`Image conversion failed: ${error.message}`);
  }
}

/**
 * Convert JSON to CSV
 */
function convertJsonToCsv(jsonData) {
  if (!Array.isArray(jsonData)) {
    jsonData = [jsonData];
  }
  
  if (jsonData.length === 0) return '';
  
  const headers = Object.keys(jsonData[0]);
  const csvRows = [headers.join(',')];
  
  for (const row of jsonData) {
    const values = headers.map(header => {
      const value = row[header];
      return typeof value === 'string' && value.includes(',') ? `"${value}"` : value;
    });
    csvRows.push(values.join(','));
  }
  
  return csvRows.join('\n');
}

/**
 * Convert CSV to JSON
 */
function convertCsvToJson(csvContent) {
  const lines = csvContent.trim().split('\n');
  if (lines.length < 2) return JSON.stringify([]);
  
  const headers = lines[0].split(',').map(h => h.trim());
  const result = [];
  
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',');
    const obj = {};
    
    headers.forEach((header, index) => {
      obj[header] = values[index] ? values[index].trim() : '';
    });
    
    result.push(obj);
  }
  
  return JSON.stringify(result, null, 2);
}

/**
 * Convert CSV content to HTML table
 */
function convertCsvToHtml(csvContent) {
  const lines = csvContent.trim().split('\n');
  if (lines.length === 0) return '';
  
  const headers = lines[0].split(',');
  let html = '<table border="1">\n<thead>\n<tr>';
  
  // Add headers
  headers.forEach(header => {
    html += `<th>${header.trim()}</th>`;
  });
  html += '</tr>\n</thead>\n<tbody>';
  
  // Add data rows
  for (let i = 1; i < lines.length; i++) {
    const cells = lines[i].split(',');
    html += '\n<tr>';
    cells.forEach(cell => {
      html += `<td>${cell.trim()}</td>`;
    });
    html += '</tr>';
  }
  
  html += '\n</tbody>\n</table>';
  return html;
}

/**
 * Convert HTML content to CSV
 */
function convertHtmlToCsv(htmlContent) {
  // Strip HTML tags and convert to plain text
  const plainText = htmlContent.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
  
  // Split by lines and create CSV
  const lines = plainText.split('\n').filter(line => line.trim());
  
  if (lines.length === 0) return '';
  
  // Create a simple CSV with one column for content
  return 'content\n' + lines.map(line => `"${line.trim()}"`).join('\n');
}

/**
 * Convert JSON data to YAML
 */
function convertJsonToYaml(jsonData) {
  const yaml = require('js-yaml');
  return yaml.dump(jsonData);
}
