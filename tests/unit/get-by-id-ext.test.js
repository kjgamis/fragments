const request = require('supertest');
const { Fragment } = require('../../src/model/fragment');
const app = require('../../src/app');
const hash = require('../../src/hash');
const sharp = require('sharp');

// Set environment to use memory storage for testing
process.env.LOG_LEVEL = 'silent';

// Helper function to create a minimal valid PNG
async function createMinimalPNG() {
  return await sharp({
    create: {
      width: 1,
      height: 1,
      channels: 4,
      background: { r: 255, g: 0, b: 0, alpha: 1 }
    }
  }).png().toBuffer();
}

describe('GET /v1/fragments/:id.ext', () => {
  let fragment;
  const userId = hash('user1@email.com');

  beforeEach(async () => {
    // Create a test fragment
    fragment = new Fragment({
      ownerId: userId,
      type: 'text/markdown',
      size: 0
    });
    await fragment.save();
    await fragment.setData(Buffer.from('# Hello World\n\nThis is **markdown** content.'));
  });

  afterEach(async () => {
    // Clean up
    await Fragment.delete(userId, fragment.id);
  });

  describe('Text conversions', () => {
    beforeEach(async () => {
      // Create a markdown fragment
      fragment = new Fragment({
        ownerId: userId,
        type: 'text/markdown',
        size: 0
      });
      await fragment.save();
      await fragment.setData(Buffer.from('# Hello World\n\nThis is **markdown** content.'));
    });

    test('should convert markdown to HTML when .html extension is requested', async () => {
      const res = await request(app)
        .get(`/v1/fragments/${fragment.id}.html`)
        .auth('user1@email.com', 'password1');

      expect(res.statusCode).toBe(200);
      expect(res.headers['content-type']).toContain('text/html');
      expect(res.text).toContain('<h1>Hello World</h1>');
      expect(res.text).toContain('<strong>markdown</strong>');
    });

    test('should convert markdown to plain text when .txt extension is requested', async () => {
      const res = await request(app)
        .get(`/v1/fragments/${fragment.id}.txt`)
        .auth('user1@email.com', 'password1');

      expect(res.statusCode).toBe(200);
      expect(res.headers['content-type']).toContain('text/plain');
      expect(res.text).toContain('Hello World');
      expect(res.text).toContain('markdown content');
    });

    test('should convert markdown to markdown when .md extension is requested', async () => {
      const res = await request(app)
        .get(`/v1/fragments/${fragment.id}.md`)
        .auth('user1@email.com', 'password1');

      expect(res.statusCode).toBe(200);
      expect(res.headers['content-type']).toContain('text/markdown');
      expect(res.text).toContain('# Hello World');
    });
  });

  describe('JSON conversions', () => {
    beforeEach(async () => {
      // Create a JSON fragment
      fragment = new Fragment({
        ownerId: userId,
        type: 'application/json',
        size: 0
      });
      await fragment.save();
      await fragment.setData(Buffer.from('{"name": "John", "age": 30}'));
    });

    test('should convert JSON to YAML when .yaml extension is requested', async () => {
      const res = await request(app)
        .get(`/v1/fragments/${fragment.id}.yaml`)
        .auth('user1@email.com', 'password1');

      expect(res.statusCode).toBe(200);
      expect(res.headers['content-type']).toContain('application/yaml');
      expect(res.text).toContain('name: John');
      expect(res.text).toContain('age: 30');
    });

    test('should convert JSON to plain text when .txt extension is requested', async () => {
      const res = await request(app)
        .get(`/v1/fragments/${fragment.id}.txt`)
        .auth('user1@email.com', 'password1');

      expect(res.statusCode).toBe(200);
      expect(res.headers['content-type']).toContain('text/plain');
      expect(res.text).toContain('"name": "John"');
    });
  });

  describe('CSV conversions', () => {
    beforeEach(async () => {
      // Create a CSV fragment
      fragment = new Fragment({
        ownerId: userId,
        type: 'text/csv',
        size: 0
      });
      await fragment.save();
      await fragment.setData(Buffer.from('name,age\nJohn,30\nJane,25'));
    });

    test('should convert CSV to JSON when .json extension is requested', async () => {
      const res = await request(app)
        .get(`/v1/fragments/${fragment.id}.json`)
        .auth('user1@email.com', 'password1');

      expect(res.statusCode).toBe(200);
      expect(res.headers['content-type']).toContain('application/json');
      const data = JSON.parse(res.text);
      expect(Array.isArray(data)).toBe(true);
      expect(data[0]).toHaveProperty('name', 'John');
    });

    test('should convert CSV to plain text when .txt extension is requested', async () => {
      const res = await request(app)
        .get(`/v1/fragments/${fragment.id}.txt`)
        .auth('user1@email.com', 'password1');

      expect(res.statusCode).toBe(200);
      expect(res.headers['content-type']).toContain('text/plain');
      expect(res.text).toContain('name,age');
      expect(res.text).toContain('John,30');
    });
  });

  describe('Image conversions', () => {
    beforeEach(async () => {
      // Create a PNG image fragment
      fragment = new Fragment({
        ownerId: userId,
        type: 'image/png',
        size: 0
      });
      await fragment.save();
      
      // Create a minimal valid PNG using sharp
      const pngData = await createMinimalPNG();
      await fragment.setData(pngData);
    });

    test('should convert PNG to JPEG when .jpg extension is requested', async () => {
      const res = await request(app)
        .get(`/v1/fragments/${fragment.id}.jpg`)
        .auth('user1@email.com', 'password1');

      expect(res.statusCode).toBe(200);
      expect(res.headers['content-type']).toContain('image/jpeg');
      expect(Buffer.isBuffer(res.body)).toBe(true);
    });

    test('should convert PNG to WebP when .webp extension is requested', async () => {
      const res = await request(app)
        .get(`/v1/fragments/${fragment.id}.webp`)
        .auth('user1@email.com', 'password1');

      expect(res.statusCode).toBe(200);
      expect(res.headers['content-type']).toContain('image/webp');
      expect(Buffer.isBuffer(res.body)).toBe(true);
    });

    test('should convert PNG to AVIF when .avif extension is requested', async () => {
      const res = await request(app)
        .get(`/v1/fragments/${fragment.id}.avif`)
        .auth('user1@email.com', 'password1');

      expect(res.statusCode).toBe(200);
      expect(res.headers['content-type']).toContain('image/avif');
      expect(Buffer.isBuffer(res.body)).toBe(true);
    });
  });

  describe('Error handling', () => {
    test('should return 400 for unsupported conversion format', async () => {
      const res = await request(app)
        .get(`/v1/fragments/${fragment.id}.xyz`)
        .auth('user1@email.com', 'password1');

      expect(res.statusCode).toBe(400);
      expect(res.body.status).toBe('error');
      expect(res.body.error.message).toBe('Unsupported conversion format');
    });

    test('should return 400 for unsupported conversion path', async () => {
      const res = await request(app)
        .get(`/v1/fragments/${fragment.id}.png`)
        .auth('user1@email.com', 'password1');

      expect(res.statusCode).toBe(400);
      expect(res.body.status).toBe('error');
      expect(res.body.error.message).toContain('Conversion from text/markdown to image/png is not supported');
    });

    test('should return 404 for non-existent fragment', async () => {
      const res = await request(app)
        .get('/v1/fragments/nonexistent.html')
        .auth('user1@email.com', 'password1');

      expect(res.statusCode).toBe(404);
      expect(res.body.status).toBe('error');
    });

    test('should return 401 for unauthenticated requests', async () => {
      const res = await request(app)
        .get(`/v1/fragments/${fragment.id}.html`);

      expect(res.statusCode).toBe(401);
    });
  });
});
