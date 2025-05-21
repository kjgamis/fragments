// test/unit/app.test.js

const request = require('supertest');

const app = require('../../src/app');

describe('/ undefined route', () => {
  test('should return HTTP 404 response', async () => {
    const res = await request(app).get('/undefined-route');
    expect(res.statusCode).toBe(404);
  });

  test('should return error message in response', async () => {
    const res = await request(app).get('/undefined-route');
    expect(res.body.error.message).toEqual('not found');
  });
});
