const request = require('supertest');
const app = require('../../src/app');
const { Fragment } = require('../../src/model/fragment');

describe('GET /v1/fragments/:id/info', () => {
  // Mock Fragment.byId() to control what data we get back
  const mockFragment = {
    id: 'mock-id',
    ownerId: '11d4c22e42c8f61feaba154683dea407b101cfd90987dda9e342843263ca420a', // hashed user1@email.com
    created: '2023-01-01',
    updated: '2023-01-01',
    type: 'text/plain',
    size: 123
  };

  beforeEach(() => {
    Fragment.byId = jest.fn().mockImplementation((ownerId, id) => {
      if (id === 'mock-id') {
        return Promise.resolve(new Fragment({
          ...mockFragment,
          ownerId
        }));
      }
      return Promise.resolve(null);
    });
  });

  test('should return fragment metadata for valid id', async () => {
    const res = await request(app)
      .get('/v1/fragments/mock-id/info')
      .auth('user1@email.com', 'password1');

    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.fragment).toEqual(mockFragment);
  });

  test('should return 404 for non-existent fragment', async () => {
    Fragment.byId = jest.fn().mockRejectedValue(new Error('not found'));

    const res = await request(app)
      .get('/v1/fragments/non-existent/info')
      .auth('user1@email.com', 'password1');

    expect(res.statusCode).toBe(404);
    expect(res.body.status).toBe('error');
  });
});
