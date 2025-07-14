// tests/unit/response.test.js

const { createSuccessResponse, createErrorResponse } = require('../../src/response');

describe('response', () => {
  describe('createSuccessResponse()', () => {
    test('creates a success response with status:ok', () => {
      const res = createSuccessResponse({});
      expect(res).toEqual({ status: 'ok' });
    });

    test('includes data in success response', () => {
      const data = { a: 1, b: 2 };
      const res = createSuccessResponse(data);
      expect(res).toEqual({
        status: 'ok',
        a: 1,
        b: 2,
      });
    });

    test('handles null data', () => {
      const res = createSuccessResponse(null);
      expect(res).toEqual({ status: 'ok' });
    });
  });

  describe('createErrorResponse()', () => {
    test('creates an error response with status:error', () => {
      const res = createErrorResponse(404, 'not found');
      expect(res.status).toBe('error');
    });

    test('includes error code and message', () => {
      const code = 400;
      const message = 'bad request';
      const res = createErrorResponse(code, message);
      expect(res).toEqual({
        status: 'error',
        error: {
          code,
          message,
        },
      });
    });
  });
});

