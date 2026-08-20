const { test, expect } = require('@playwright/test');

test.describe('Kanban Board Workflows', () => {
  test('API tasks endpoint delivers array for kanban rendering', async ({ request }) => {
    const res = await request.get('/api/tasks');
    expect(res.ok()).toBeTruthy();
    const tasks = await res.json();
    expect(Array.isArray(tasks)).toBe(true);
  });
});
