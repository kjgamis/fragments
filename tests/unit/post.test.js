const request = require('supertest');
const app = require('../../src/app');
const { Fragment } = require('../../src/model/fragment');

describe('POST /v1/fragments', () => {
  // Mock Fragment.prototype.setData
  beforeEach(() => {
    Fragment.prototype.setData = jest.fn().mockResolvedValue();
  });

  // Test successful creation with text/plain
  test('creates a plain text fragment', async () => {
    const res = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'text/plain')
      .send('Hello World');

    expect(res.statusCode).toBe(201);
    expect(res.body.status).toBe('ok');
    expect(res.body.fragment).toHaveProperty('id');
    expect(res.body.fragment.type).toBe('text/plain');
    expect(res.body.fragment.size).toBeDefined();
    expect(res.headers.location).toMatch(/^http:\/\/127.0.0.1:\d+\/v1\/fragments\/[A-Za-z0-9-_]+$/);
  });

  // Test successful creation with application/json
  test('creates a JSON fragment', async () => {
    const data = { message: 'Hello World' };
    const res = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'application/json')
      .send(data);

    expect(res.statusCode).toBe(201);
    expect(res.body.status).toBe('ok');
    expect(res.body.fragment).toHaveProperty('id');
    expect(res.body.fragment.type).toBe('application/json');
  });

  // Test successful creation with text/markdown
  test('creates a markdown fragment', async () => {
    const res = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'text/markdown')
      .send('# Hello World');

    expect(res.statusCode).toBe(201);
    expect(res.body.status).toBe('ok');
    expect(res.body.fragment).toHaveProperty('id');
    expect(res.body.fragment.type).toBe('text/markdown');
  });

  // Test successful creation with text/html
  test('creates an HTML fragment', async () => {
    const res = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'text/html')
      .send('<h1>Hello World</h1>');

    expect(res.statusCode).toBe(201);
    expect(res.body.status).toBe('ok');
    expect(res.body.fragment).toHaveProperty('id');
    expect(res.body.fragment.type).toBe('text/html');
  });

  // Test successful creation with text/csv
  test('creates a CSV fragment', async () => {
    const res = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'text/csv')
      .send('id,name\n1,test');

    expect(res.statusCode).toBe(201);
    expect(res.body.status).toBe('ok');
    expect(res.body.fragment).toHaveProperty('id');
    expect(res.body.fragment.type).toBe('text/csv');
  });

  // Test successful creation with charset in Content-Type
  test('handles Content-Type with charset', async () => {
    const res = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'text/plain; charset=utf-8')
      .send('Hello World');

    expect(res.statusCode).toBe(201);
    expect(res.body.status).toBe('ok');
    expect(res.body.fragment).toHaveProperty('id');
    expect(res.body.fragment.type).toBe('text/plain; charset=utf-8');
  });

  // Test error cases
  test('returns 415 for unsupported media type', async () => {
    const res = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'application/pdf')
      .send('PDF data');

    expect(res.statusCode).toBe(415);
    expect(res.body.status).toBe('error');
    expect(res.body.error.code).toBe(415);
  });

  test('returns 401 if not authenticated', async () => {
    const res = await request(app)
      .post('/v1/fragments')
      .set('Content-Type', 'text/plain')
      .send('Hello World');

    expect(res.statusCode).toBe(401);
  });

  test('returns 401 if invalid credentials', async () => {
    const res = await request(app)
      .post('/v1/fragments')
      .auth('invalid@email.com', 'wrong-password')
      .set('Content-Type', 'text/plain')
      .send('Hello World');

    expect(res.statusCode).toBe(401);
  });

  test('returns 500 if fragment creation fails', async () => {
    // Mock setData to throw an error
    Fragment.prototype.setData.mockRejectedValue(new Error('Database error'));

    const res = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'text/plain')
      .send('Hello World');

    expect(res.statusCode).toBe(500);
    expect(res.body.status).toBe('error');
    expect(res.body.error.code).toBe(500);
  });

  test('returns 415 if Content-Type header is missing', async () => {
    const res = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .send('Hello World');

    expect(res.statusCode).toBe(415);
    expect(res.body.status).toBe('error');
    expect(res.body.error.code).toBe(415);
  });
});
