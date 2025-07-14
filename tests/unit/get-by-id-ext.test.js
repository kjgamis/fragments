const request = require('supertest');
const app = require('../../src/app');
const { Fragment } = require('../../src/model/fragment');

describe('GET /v1/fragments/:id.ext', () => {
  const mockMarkdownContent = '# Hello\nThis is a test';
  const mockFragment = {
    id: 'mock-id',
    ownerId: 'mock-owner',
    type: 'text/markdown',
    size: mockMarkdownContent.length,
    getData: jest.fn().mockResolvedValue(Buffer.from(mockMarkdownContent))
  };

  beforeEach(() => {
    Fragment.byId = jest.fn().mockImplementation((ownerId, id) => {
      if (id === 'mock-id') {
        return Promise.resolve({
          ...mockFragment,
          ownerId,
          getData: jest.fn().mockResolvedValue(Buffer.from(mockMarkdownContent))
        });
      }
      return Promise.resolve(null);
    });
  });

  test('should convert markdown to HTML when .html extension is requested', async () => {
    const res = await request(app)
      .get('/v1/fragments/mock-id.html')
      .auth('user1@email.com', 'password1');

    expect(res.statusCode).toBe(200);
    expect(res.headers['content-type']).toContain('text/html');
    expect(res.text).toContain('<h1>Hello</h1>');
    expect(res.text).toContain('<p>This is a test</p>');
  });

  test('should return original content when no conversion is needed', async () => {
    const res = await request(app)
      .get('/v1/fragments/mock-id.md')
      .auth('user1@email.com', 'password1');

    expect(res.statusCode).toBe(200);
    expect(res.headers['content-type']).toContain('text/markdown');
    expect(res.text).toBe(mockMarkdownContent);
  });

  test('should return 404 for non-existent fragment', async () => {
    Fragment.byId = jest.fn().mockRejectedValue(new Error('not found'));

    const res = await request(app)
      .get('/v1/fragments/non-existent.html')
      .auth('user1@email.com', 'password1');

    expect(res.statusCode).toBe(404);
    expect(res.body.status).toBe('error');
  });
});
