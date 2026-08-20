const cache = require('../src/services/cache');

describe('In-Memory TTL Cache Service', () => {
  beforeEach(() => {
    cache.clear();
  });

  test('set and get item before expiry', () => {
    cache.set('test:key', { message: 'hello' }, 1000);
    const val = cache.get('test:key');
    expect(val).toEqual({ message: 'hello' });
    expect(cache.size()).toBe(1);
  });

  test('returns null for non-existent or expired key', async () => {
    expect(cache.get('nonexistent')).toBeNull();

    cache.set('short:lived', 'data', 10);
    await new Promise(r => setTimeout(r, 25));
    expect(cache.get('short:lived')).toBeNull();
  });

  test('delete specific key', () => {
    cache.set('item1', 'val1', 5000);
    cache.set('item2', 'val2', 5000);
    expect(cache.get('item1')).toBe('val1');
    cache.del('item1');
    expect(cache.get('item1')).toBeNull();
    expect(cache.get('item2')).toBe('val2');
  });

  test('delByPrefix removes all matching keys', () => {
    cache.set('tasks:list:1', [1, 2], 5000);
    cache.set('tasks:list:2', [3, 4], 5000);
    cache.set('leads:list', [5], 5000);

    cache.delByPrefix('tasks:list');
    expect(cache.get('tasks:list:1')).toBeNull();
    expect(cache.get('tasks:list:2')).toBeNull();
    expect(cache.get('leads:list')).toEqual([5]);
  });
});
