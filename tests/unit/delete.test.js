const request = require('supertest');
const { Fragment } = require('../../src/model/fragment');
const app = require('../../src/app');
const hash = require('../../src/hash');

// Set environment to use memory storage for testing
process.env.LOG_LEVEL = 'silent';

describe('DELETE /v1/fragments/:id', () => {
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
    await fragment.setData(Buffer.from('test content'));
  });

  afterEach(async () => {
    // Clean up - try to delete the fragment if it still exists
    try {
      await Fragment.delete(userId, fragment.id);
    } catch {
      // Fragment might already be deleted, which is fine
      // We can ignore the error in this case
    }
  });

  describe('Successful deletion', () => {
    test('should delete an existing fragment and return 200', async () => {
      const res = await request(app)
        .delete(`/v1/fragments/${fragment.id}`)
        .auth('user1@email.com', 'password1');

      expect(res.statusCode).toBe(200);
      expect(res.body.status).toBe('ok');

      // Verify the fragment is actually deleted
      const deletedFragment = await Fragment.byId(userId, fragment.id);
      expect(deletedFragment).toBeNull();
    });

    test('should return proper success response structure', async () => {
      const res = await request(app)
        .delete(`/v1/fragments/${fragment.id}`)
        .auth('user1@email.com', 'password1');

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('status', 'ok');
      // The response should have the status from createSuccessResponse spread into it
      expect(res.body.status).toBe('ok');
    });
  });

  describe('Error handling', () => {
    test('should return 404 for non-existent fragment', async () => {
      const res = await request(app)
        .delete('/v1/fragments/nonexistent-id')
        .auth('user1@email.com', 'password1');

      expect(res.statusCode).toBe(404);
      expect(res.body.status).toBe('error');
      expect(res.body.error.message).toBe('Fragment not found');
      expect(res.body.error.code).toBe(404);
    });

    test('should return 401 for unauthenticated requests', async () => {
      const res = await request(app)
        .delete(`/v1/fragments/${fragment.id}`);

      expect(res.statusCode).toBe(401);
    });

    test('should return 401 for invalid credentials', async () => {
      const res = await request(app)
        .delete(`/v1/fragments/${fragment.id}`)
        .auth('wrong@email.com', 'wrongpassword');

      expect(res.statusCode).toBe(401);
    });

    test('should return 401 for missing password', async () => {
      const res = await request(app)
        .delete(`/v1/fragments/${fragment.id}`)
        .auth('user1@email.com', '');

      expect(res.statusCode).toBe(401);
    });

    test('should return 401 for missing username', async () => {
      const res = await request(app)
        .delete(`/v1/fragments/${fragment.id}`)
        .auth('', 'password1');

      expect(res.statusCode).toBe(401);
    });
  });

  describe('Fragment ownership', () => {
    test('should not allow user to delete another user\'s fragment', async () => {
      // Create a fragment for user1
      const user1Fragment = new Fragment({
        ownerId: userId,
        type: 'text/plain',
        size: 0
      });
      await user1Fragment.save();
      await user1Fragment.setData(Buffer.from('user1 content'));

      // Try to delete it as user2
      const res = await request(app)
        .delete(`/v1/fragments/${user1Fragment.id}`)
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
        .delete(`/v1/fragments/${fragment.id}`)
        .auth('user1@email.com', 'password1');

      expect(res.statusCode).toBe(500);
      expect(res.body.status).toBe('error');
      expect(res.body.error.message).toBe('Unable to delete fragment');
      expect(res.body.error.code).toBe(500);

      // Restore original method
      Fragment.byId = originalById;
    });

    test('should handle delete operation errors', async () => {
      // Mock Fragment.delete to throw an error
      const originalDelete = Fragment.delete;
      Fragment.delete = jest.fn().mockRejectedValue(new Error('Delete operation failed'));

      const res = await request(app)
        .delete(`/v1/fragments/${fragment.id}`)
        .auth('user1@email.com', 'password1');

      expect(res.statusCode).toBe(500);
      expect(res.body.status).toBe('error');
      expect(res.body.error.message).toBe('Unable to delete fragment');
      expect(res.body.error.code).toBe(500);

      // Restore original method
      Fragment.delete = originalDelete;
    });
  });

  describe('Edge cases', () => {
    test('should handle malformed fragment ID', async () => {
      const res = await request(app)
        .delete('/v1/fragments/malformed-id-123')
        .auth('user1@email.com', 'password1');

      expect(res.statusCode).toBe(404);
      expect(res.body.status).toBe('error');
    });

    test('should handle empty fragment ID', async () => {
      const res = await request(app)
        .delete('/v1/fragments/')
        .auth('user1@email.com', 'password1');

      // This should result in a 404 since the route won't match
      expect(res.statusCode).toBe(404);
    });
  });
});
