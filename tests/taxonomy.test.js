/**
 * tests/taxonomy.test.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Unit Tests for Gro10x Master Taxonomy Service
 * Validates 7-tier relational navigation and deterministic SKU resolution.
 * ─────────────────────────────────────────────────────────────────────────────
 */

const {
  getEngines,
  getVerticals,
  getBrandsByVertical,
  getEngineHierarchy,
  getFullCatalogTree,
  resolveSku,
  FALLBACK_CATALOG
} = require('../src/services/taxonomy');

describe('Master Taxonomy Service Unit Tests', () => {

  test('getEngines should return exactly 5 fundamental growth engines', async () => {
    const engines = await getEngines();
    expect(engines).toBeDefined();
    expect(engines.length).toBe(5);

    const ids = engines.map(e => e.id);
    expect(ids).toContain('engine1');
    expect(ids).toContain('engine2');
    expect(ids).toContain('engine3');
    expect(ids).toContain('engine4');
    expect(ids).toContain('engine5');
  });

  test('getVerticals should return the 5 agreed verticals for Engine 3 (Omnichannel Commerce)', async () => {
    const e3Verticals = await getVerticals('engine3');
    expect(e3Verticals.length).toBe(5);

    const codes = e3Verticals.map(v => v.code);
    expect(codes).toContain('DIG'); // Digital
    expect(codes).toContain('FNB'); // Food and Beverage
    expect(codes).toContain('FAS'); // Fashion and Lifestyle
    expect(codes).toContain('ELC'); // Electronics and IT
    expect(codes).toContain('B2B'); // B2B
  });

  test('getVerticals should return the 4 client-tier verticals for Engine 2 (AI Service Agency)', async () => {
    const e2Verticals = await getVerticals('engine2');
    expect(e2Verticals.length).toBe(4);

    const codes = e2Verticals.map(v => v.code);
    expect(codes).toContain('ENT'); // Enterprise
    expect(codes).toContain('SME'); // SME
    expect(codes).toContain('PER'); // Personal & Creators
    expect(codes).toContain('GOV'); // Government & NGOs
  });

  test('getBrandsByVertical should return the 13 Etsy brands and digital properties under e3-digital', async () => {
    const digitalBrands = await getBrandsByVertical('e3-digital');
    expect(digitalBrands.length).toBeGreaterThanOrEqual(7);

    const codes = digitalBrands.map(b => b.code);
    expect(codes).toContain('PLN'); // PlannerQueenGro
    expect(codes).toContain('PRM'); // PromptVault
    expect(codes).toContain('SPK'); // SparkSVG
    expect(codes).toContain('LLF'); // LetterLab Fonts
    expect(codes).toContain('DGV'); // DigiVault BD
  });

  test('getEngineHierarchy should return full nested tree for Engine 4 (Managed Retainers)', async () => {
    const e4Hierarchy = await getEngineHierarchy('engine4');
    expect(e4Hierarchy).toBeDefined();
    expect(e4Hierarchy.id).toBe('engine4');
    expect(e4Hierarchy.verticals.length).toBe(5);

    // Verify presence of OS brands
    const sysVertical = e4Hierarchy.verticals.find(v => v.code === 'SYS');
    expect(sysVertical).toBeDefined();
    const brandCodes = sysVertical.brands.map(b => b.code);
    expect(brandCodes).toContain('SHM'); // Shams Dental Care
    expect(brandCodes).toContain('BLV'); // BellaVista
    expect(brandCodes).toContain('PRP'); // PurpleOS
    expect(brandCodes).toContain('HRX'); // HRX Staffing
  });

  test('getFullCatalogTree should build complete 5-engine company tree', async () => {
    const tree = await getFullCatalogTree();
    expect(tree.length).toBe(5);
    expect(tree[0].verticals.length).toBeGreaterThan(0);
  });

  test('resolveSku should accurately resolve canonical SKU GRO-E3-DIG-PLN-PLA14-ETSY', async () => {
    const resolved = await resolveSku('GRO-E3-DIG-PLN-PLA14-ETSY');
    expect(resolved).toBeDefined();
    expect(resolved.sku_code).toBe('GRO-E3-DIG-PLN-PLA14-ETSY');
    expect(resolved.channel).toBe('ETSY');
    expect(resolved.price_usd).toBe(14.99);
    expect(resolved.product).toBeDefined();
    expect(resolved.product.product_code).toBe('PLA-14');
    expect(resolved.product.brand.code).toBe('PLN');
  });

  test('resolveSku should accurately resolve canonical SKU GRO-E2-SME-GWT-SPRINT01-UPW', async () => {
    const resolved = await resolveSku('GRO-E2-SME-GWT-SPRINT01-UPW');
    expect(resolved).toBeDefined();
    expect(resolved.sku_code).toBe('GRO-E2-SME-GWT-SPRINT01-UPW');
    expect(resolved.channel).toBe('UPWORK');
    expect(resolved.price_usd).toBe(3500);
  });

  test('resolveSku should deterministically decompose unknown but valid canonical SKU syntax', async () => {
    const resolved = await resolveSku('GRO-E3-FAS-WLD-BAN01-ETSY');
    expect(resolved).toBeDefined();
    expect(resolved.synthetic).toBe(true);
    expect(resolved.decomposed.engineCode).toBe('E3');
    expect(resolved.decomposed.verticalCode).toBe('FAS');
    expect(resolved.decomposed.brandCode).toBe('WLD');
    expect(resolved.decomposed.productCode).toBe('BAN01');
    expect(resolved.decomposed.channel).toBe('ETSY');
  });

  test('resolveSku should return null for invalid SKU format', async () => {
    const resolved = await resolveSku('INVALID-SKU-FORMAT');
    expect(resolved).toBeNull();
  });
});
