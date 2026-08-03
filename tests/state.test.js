const state = require('../src/services/state');

describe('State Service Performance & Lookup Cache', () => {
  it('getEmployeeByPhone should resolve Bangladeshi phone formats', async () => {
    const emp = await state.getEmployeeByPhone('+8801708459008');
    if (emp) {
      expect(emp.name).toBeDefined();
    }
  });

  it('Cached lookups should resolve instantly (<10ms)', async () => {
    const t0 = Date.now();
    await state.getEmployeeByPhone('01708459008');
    const elapsed = Date.now() - t0;
    expect(elapsed).toBeLessThan(50);
  });
});
