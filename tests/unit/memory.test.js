const memory = require('../../src/model/data/memory');

describe('Memory Storage Tests', () => {
  // Test data setup
  const createTestFragment = (id = 'test-id') => ({
    id,
    ownerId: 'owner-id',
    type: 'text/plain',
    created: new Date().toISOString(),
    updated: new Date().toISOString(),
    size: 0
  });

  const createTestData = () => Buffer.from('Test data content');

  // Helper function to clean up test data
  const cleanupFragment = async (fragment) => {
    try {
      // Check if fragment exists before attempting to delete
      const exists = await memory.readFragment(fragment.ownerId, fragment.id);
      if (exists) {
        await memory.deleteFragment(fragment.ownerId, fragment.id);
      }
    } catch (err) {
      // Only warn about unexpected errors
      if (!err.message.includes('missing entry')) {
        console.warn(`Cleanup warning for fragment ${fragment.id}:`, err.message);
      }
    }
  };

  // Run cleanup before each test to ensure a clean state
  beforeEach(async () => {
    const fragment = createTestFragment();
    await cleanupFragment(fragment);
  });

  test('write() and read() operations work correctly', async () => {
    const fragment = createTestFragment();
    
    await memory.writeFragment(fragment);
    const retrieved = await memory.readFragment(fragment.ownerId, fragment.id);
    expect(retrieved).toEqual(fragment);
    
    await cleanupFragment(fragment);
  });

  test('data operations handle buffers correctly', async () => {
    const fragment = createTestFragment();
    const testData = createTestData();
    
    await memory.writeFragment(fragment);
    await memory.writeFragmentData(fragment.ownerId, fragment.id, testData);
    
    const retrievedData = await memory.readFragmentData(fragment.ownerId, fragment.id);
    expect(Buffer.compare(retrievedData, testData)).toBe(0);
    
    await cleanupFragment(fragment);
  });

  test('List fragments returns correct formats based on expand parameter', async () => {
    const fragments = [
      createTestFragment('id1'),
      createTestFragment('id2')
    ];
    
    await Promise.all(fragments.map(fragment => memory.writeFragment(fragment)));
    
    const idList = await memory.listFragments(fragments[0].ownerId);
    expect(idList).toEqual(expect.arrayContaining(['id1', 'id2']));
    
    const expandedList = await memory.listFragments(fragments[0].ownerId, true);
    expect(expandedList).toEqual(expect.arrayContaining(fragments));
    
    await Promise.all(fragments.map(cleanupFragment));
  });

  test('Non-existent fragments return empty array', async () => {
    const nonExistentId = 'non-existent';
    const nonExistentOwner = 'unknown-owner';

    expect(await memory.readFragment(nonExistentOwner, nonExistentId)).toBeUndefined();
    expect(await memory.readFragmentData(nonExistentOwner, nonExistentId)).toBeUndefined();
    expect(await memory.listFragments(nonExistentOwner)).toEqual([]);
  });

  test('Delete operation removes the fragment', async () => {
    const fragment = createTestFragment();
    const testData = createTestData();
    
    await memory.writeFragment(fragment);
    await memory.writeFragmentData(fragment.ownerId, fragment.id, testData);
    
    await memory.deleteFragment(fragment.ownerId, fragment.id);
    
    const [metadata, data] = await Promise.all([
      memory.readFragment(fragment.ownerId, fragment.id),
      memory.readFragmentData(fragment.ownerId, fragment.id)
    ]);
    
    expect(metadata).toBeUndefined();
    expect(data).toBeUndefined();
  });
});
