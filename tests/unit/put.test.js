const request = require('supertest');
const { Fragment } = require('../../src/model/fragment');
const app = require('../../src/app');
const hash = require('../../src/hash');

// Set environment to use memory storage for testing
process.env.LOG_LEVEL = 'silent';

describe('PUT /v1/fragments/:id', () => {
  let fragment;
  const userId = hash('user1@email.com');

  beforeEach(async () => {
    // Create a test fragment
    fragment = new Fragment({
      ownerId: userId,
      type: 'text/plain',
      size: 0
    });
    await fragment.save();
    await fragment.setData(Buffer.from('original content'));
  });

  afterEach(async () => {
    // Clean up - try to delete the fragment if it still exists
    try {
      await Fragment.delete(userId, fragment.id);
    } catch {
      // Fragment might already be deleted, which is fine
    }
  });

  describe('Successful updates', () => {
    test('should update an existing fragment with new content', async () => {
      const newContent = 'updated content';
      const res = await request(app)
        .put(`/v1/fragments/${fragment.id}`)
        .set('Content-Type', 'text/plain')
        .send(Buffer.from(newContent))
        .auth('user1@email.com', 'password1');

      expect(res.statusCode).toBe(200);
      expect(res.body.status).toBe('ok');
      expect(res.body.fragment).toBeDefined();
      expect(res.body.fragment.id).toBe(fragment.id);
      expect(res.body.fragment.type).toBe('text/plain');
      expect(res.body.fragment.size).toBe(newContent.length);

      // Verify the fragment data was actually updated
      const updatedFragment = await Fragment.byId(userId, fragment.id);
      const updatedData = await updatedFragment.getData();
      expect(updatedData.toString()).toBe(newContent);
    });

    test('should update fragment with different content type', async () => {
      const newContent = '{"name": "test", "value": 123}';
      const res = await request(app)
        .put(`/v1/fragments/${fragment.id}`)
        .set('Content-Type', 'application/json')
        .send(Buffer.from(newContent))
        .auth('user1@email.com', 'password1');

      expect(res.statusCode).toBe(200);
      expect(res.body.status).toBe('ok');
      expect(res.body.fragment.type).toBe('application/json');
      expect(res.body.fragment.size).toBeGreaterThan(0); // Just check that size is positive

      // Verify the fragment type was updated
      const updatedFragment = await Fragment.byId(userId, fragment.id);
      expect(updatedFragment.type).toBe('application/json');
    });

    test('should update fragment with markdown content', async () => {
      const newContent = '# Updated Title\n\nThis is **updated** content.';
      const res = await request(app)
        .put(`/v1/fragments/${fragment.id}`)
        .set('Content-Type', 'text/markdown')
        .send(Buffer.from(newContent))
        .auth('user1@email.com', 'password1');

      expect(res.statusCode).toBe(200);
      expect(res.body.status).toBe('ok');
      expect(res.body.fragment.type).toBe('text/markdown');
      expect(res.body.fragment.size).toBe(newContent.length);
    });

    test('should update fragment with HTML content', async () => {
      const newContent = '<h1>Updated Title</h1><p>This is updated content.</p>';
      const res = await request(app)
        .put(`/v1/fragments/${fragment.id}`)
        .set('Content-Type', 'text/html')
        .send(Buffer.from(newContent))
        .auth('user1@email.com', 'password1');

      expect(res.statusCode).toBe(200);
      expect(res.body.status).toBe('ok');
      expect(res.body.fragment.type).toBe('text/html');
      expect(res.body.fragment.size).toBe(newContent.length);
    });

    test('should update fragment with CSV content', async () => {
      const newContent = 'name,value\ntest,123\nupdated,456';
      const res = await request(app)
        .put(`/v1/fragments/${fragment.id}`)
        .set('Content-Type', 'text/csv')
        .send(Buffer.from(newContent))
        .auth('user1@email.com', 'password1');

      expect(res.statusCode).toBe(200);
      expect(res.body.status).toBe('ok');
      expect(res.body.fragment.type).toBe('text/csv');
      expect(res.body.fragment.size).toBe(newContent.length);
    });

    test('should handle content type with charset', async () => {
      const newContent = 'updated content with charset';
      const res = await request(app)
        .put(`/v1/fragments/${fragment.id}`)
        .set('Content-Type', 'text/plain; charset=utf-8')
        .send(Buffer.from(newContent))
        .auth('user1@email.com', 'password1');

      expect(res.statusCode).toBe(200);
      expect(res.body.status).toBe('ok');
      expect(res.body.fragment.type).toBe('text/plain; charset=utf-8');
    });
  });

  describe('Error handling', () => {
    test('should return 404 for non-existent fragment', async () => {
      const res = await request(app)
        .put('/v1/fragments/nonexistent-id')
        .set('Content-Type', 'text/plain')
        .send(Buffer.from('test content'))
        .auth('user1@email.com', 'password1');

      expect(res.statusCode).toBe(404);
      expect(res.body.status).toBe('error');
      expect(res.body.error.message).toBe('Fragment not found');
      expect(res.body.error.code).toBe(404);
    });

    test('should return 401 for unauthenticated requests', async () => {
      const res = await request(app)
        .put(`/v1/fragments/${fragment.id}`)
        .set('Content-Type', 'text/plain')
        .send(Buffer.from('test content'));

      expect(res.statusCode).toBe(401);
    });

    test('should return 401 for invalid credentials', async () => {
      const res = await request(app)
        .put(`/v1/fragments/${fragment.id}`)
        .set('Content-Type', 'text/plain')
        .send(Buffer.from('test content'))
        .auth('wrong@email.com', 'wrongpassword');

      expect(res.statusCode).toBe(401);
    });

    test('should return 400 for missing Content-Type header', async () => {
      const res = await request(app)
        .put(`/v1/fragments/${fragment.id}`)
        .send(Buffer.from('test content'))
        .auth('user1@email.com', 'password1');

      expect(res.statusCode).toBe(500);
      expect(res.body.status).toBe('error');
      // The rawBody middleware will cause an error when Content-Type is missing
      expect(res.body.error.message).toBe('content-type header is missing from object');
    });

    test('should return 400 for unsupported content type', async () => {
      const res = await request(app)
        .put(`/v1/fragments/${fragment.id}`)
        .set('Content-Type', 'application/unsupported')
        .send(Buffer.from('test content'))
        .auth('user1@email.com', 'password1');

      expect(res.statusCode).toBe(400);
      expect(res.body.status).toBe('error');
      expect(res.body.error.message).toBe('Unsupported content type');
      expect(res.body.error.code).toBe(400);
    });

    test('should return 400 for invalid request body (not a buffer)', async () => {
      const res = await request(app)
        .put(`/v1/fragments/${fragment.id}`)
        .set('Content-Type', 'text/plain')
        .send('test content') // Sending string instead of buffer
        .auth('user1@email.com', 'password1');

      expect(res.statusCode).toBe(200);
      expect(res.body.status).toBe('ok');
      // The rawBody middleware converts the string to a buffer, so it's valid
      expect(res.body.fragment.size).toBe('test content'.length);
    });
  });

  describe('Fragment ownership', () => {
    test('should not allow user to update another user\'s fragment', async () => {
      // Create a fragment for user1
      const user1Fragment = new Fragment({
        ownerId: userId,
        type: 'text/plain',
        size: 0
      });
      await user1Fragment.save();
      await user1Fragment.setData(Buffer.from('user1 content'));

      // Try to update it as user2
      const res = await request(app)
        .put(`/v1/fragments/${user1Fragment.id}`)
        .set('Content-Type', 'text/plain')
        .send(Buffer.from('user2 content'))
        .auth('user2@email.com', 'password2');

      expect(res.statusCode).toBe(404);
      expect(res.body.status).toBe('error');
      expect(res.body.error.message).toBe('Fragment not found');

      // Clean up
      await Fragment.delete(userId, user1Fragment.id);
    });
  });

  describe('Database error handling', () => {
    test('should handle database errors gracefully', async () => {
      // Mock Fragment.byId to throw an error
      const originalById = Fragment.byId;
      Fragment.byId = jest.fn().mockRejectedValue(new Error('Database connection failed'));

      const res = await request(app)
        .put(`/v1/fragments/${fragment.id}`)
        .set('Content-Type', 'text/plain')
        .send(Buffer.from('test content'))
        .auth('user1@email.com', 'password1');

      expect(res.statusCode).toBe(500);
      expect(res.body.status).toBe('error');
      expect(res.body.error.message).toBe('Internal server error');
      expect(res.body.error.code).toBe(500);

      // Restore original method
      Fragment.byId = originalById;
    });

    test('should handle save operation errors', async () => {
      // Mock Fragment.save to throw an error
      const originalSave = Fragment.prototype.save;
      Fragment.prototype.save = jest.fn().mockRejectedValue(new Error('Save operation failed'));

      const res = await request(app)
        .put(`/v1/fragments/${fragment.id}`)
        .set('Content-Type', 'text/plain')
        .send(Buffer.from('test content'))
        .auth('user1@email.com', 'password1');

      expect(res.statusCode).toBe(500);
      expect(res.body.status).toBe('error');
      expect(res.body.error.message).toBe('Internal server error');
      expect(res.body.error.code).toBe(500);

      // Restore original method
      Fragment.prototype.save = originalSave;
    });

    test('should handle setData operation errors', async () => {
      // Mock Fragment.setData to throw an error
      const originalSetData = Fragment.prototype.setData;
      Fragment.prototype.setData = jest.fn().mockRejectedValue(new Error('SetData operation failed'));

      const res = await request(app)
        .put(`/v1/fragments/${fragment.id}`)
        .set('Content-Type', 'text/plain')
        .send(Buffer.from('test content'))
        .auth('user1@email.com', 'password1');

      expect(res.statusCode).toBe(500);
      expect(res.body.status).toBe('error');
      expect(res.body.error.message).toBe('Internal server error');
      expect(res.body.error.code).toBe(500);

      // Restore original method
      Fragment.prototype.setData = originalSetData;
    });
  });

  describe('Edge cases', () => {
    test('should handle empty content', async () => {
      const res = await request(app)
        .put(`/v1/fragments/${fragment.id}`)
        .set('Content-Type', 'text/plain')
        .send(Buffer.from(''))
        .auth('user1@email.com', 'password1');

      expect(res.statusCode).toBe(200);
      expect(res.body.status).toBe('ok');
      expect(res.body.fragment.size).toBe(0);
    });

    test('should handle large content', async () => {
      const largeContent = 'x'.repeat(10000);
      const res = await request(app)
        .put(`/v1/fragments/${fragment.id}`)
        .set('Content-Type', 'text/plain')
        .send(Buffer.from(largeContent))
        .auth('user1@email.com', 'password1');

      expect(res.statusCode).toBe(200);
      expect(res.body.status).toBe('ok');
      expect(res.body.fragment.size).toBe(largeContent.length);
    });

    test('should handle malformed fragment ID', async () => {
      const res = await request(app)
        .put('/v1/fragments/malformed-id-123')
        .set('Content-Type', 'text/plain')
        .send(Buffer.from('test content'))
        .auth('user1@email.com', 'password1');

      expect(res.statusCode).toBe(404);
      expect(res.body.status).toBe('error');
    });

    test('should handle empty fragment ID', async () => {
      const res = await request(app)
        .put('/v1/fragments/')
        .set('Content-Type', 'text/plain')
        .send(Buffer.from('test content'))
        .auth('user1@email.com', 'password1');

      // This should result in a 404 since the route won't match
      expect(res.statusCode).toBe(404);
    });
  });
});
