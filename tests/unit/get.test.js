// tests/unit/get.test.js

const request = require('supertest');

const app = require('../../src/app');
const { Fragment } = require('../../src/model/fragment');

describe('GET /v1/fragments', () => {
  // If the request is missing the Authorization header, it should be forbidden
  test('unauthenticated requests are denied', () => request(app).get('/v1/fragments').expect(401));

  // If the wrong username/password pair are used (no such user), it should be forbidden
  test('incorrect credentials are denied', () =>
    request(app).get('/v1/fragments').auth('invalid@email.com', 'incorrect_password').expect(401));

  // Using a valid username/password pair should give a success result with a .fragments array
  test('authenticated users get a fragments array', async () => {
    const res = await request(app).get('/v1/fragments').auth('user1@email.com', 'password1');
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(Array.isArray(res.body.fragments)).toBe(true);
  });
});

describe('GET /v1/fragments/:id', () => {
  // If the request is missing the Authorization header, it should be forbidden
  test('unauthenticated requests are denied', () => 
    request(app).get('/v1/fragments/123').expect(401));

  // If the wrong username/password pair are used (no such user), it should be forbidden
  test('incorrect credentials are denied', () =>
    request(app).get('/v1/fragments/123').auth('invalid@email.com', 'incorrect_password').expect(401));

  // Non-existent fragment should return 404
  test('non-existent fragment returns 404', async () => {
    const res = await request(app)
      .get('/v1/fragments/non-existent-id')
      .auth('user1@email.com', 'password1');
    expect(res.statusCode).toBe(404);
  });

  // Valid fragment should return 200 with correct data
  test('valid fragment returns 200 with correct data', async () => {
    // First create a fragment
    const testData = 'Hello World';
    const fragment = new Fragment({
      ownerId: '11d4c22e42c8f61feaba154683dea407b101cfd90987dda9e342843263ca420a', // hashed user1@email.com
      type: 'text/plain',
    });
    await fragment.save();
    await fragment.setData(Buffer.from(testData));

    // Now try to get it back
    const res = await request(app)
      .get(`/v1/fragments/${fragment.id}`)
      .auth('user1@email.com', 'password1');
    
    expect(res.statusCode).toBe(200);
    expect(res.headers['content-type']).toMatch(/text\/plain/);
    expect(res.text).toEqual(testData);
  });
});
