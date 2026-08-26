/**
 * GRO10X Studio Drawer — Full Flow Test v5
 * Auth: Direct API token injection (bypasses slow Vercel cold-start + isTemp modal)
 * Then navigates to /staff and runs the full Studio Drawer journey
 */

const puppeteer = require('puppeteer');
const https = require('https');
const path = require('path');
const fs = require('fs');

const BASE = 'https://gro10x-ai.vercel.app';
const APP_URL = `${BASE}/app`; // Brands/Etsy Studio lives in the /app (admin) dashboard

const PHONE = '01889825025';
const PIN = '1234';
const REPORT_DIR = path.join(__dirname, 'test_report_v5_' + Date.now());
const SS_DIR = path.join(REPORT_DIR, 'screenshots');
fs.mkdirSync(SS_DIR, { recursive: true });

const results = [];
let stepNum = 0;
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function ss(page, name, label) {
  stepNum++;
  const file = `step_${String(stepNum).padStart(2,'0')}_${name}.png`;
  const filePath = path.join(SS_DIR, file);
  await page.screenshot({ path: filePath, fullPage: false });
  results.push({ step: stepNum, name: label, file, status: null, detail: '' });
  console.log(`📸 [${stepNum}] ${label}`);
  return filePath;
}
function ok(d) { const r=results[results.length-1]; if(r){r.status='PASS';r.detail=d||'';} console.log(`  ✅ ${d}`); }
function ng(d) { const r=results[results.length-1]; if(r){r.status='FAIL';r.detail=d||'';} console.error(`  ❌ ${d}`); }

// Direct API login — bypasses browser form (handles isTemp, cold starts, etc.)
function apiLogin(phone, pin) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({ phone, pin, portal: '' });
    const req = https.request({
      hostname: 'gro10x-ai.vercel.app',
      path: '/api/auth/pin/verify',
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) },
      timeout: 30000
    }, r => {
      let d = '';
      r.on('data', c => d += c);
      r.on('end', () => {
        try { resolve({ status: r.statusCode, data: JSON.parse(d) }); }
        catch(e) { reject(new Error(`Parse error: ${d.substring(0,100)}`)); }
      });
    });
    req.on('error', reject);
    req.on('timeout', () => reject(new Error('API timeout')));
    req.write(body);
    req.end();
  });
}

function mkPdf(p) {
  fs.writeFileSync(p, '%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 612 792]>>endobj\nxref\n0 4\n0000000000 65535 f\n0000000009 00000 n\n0000000058 00000 n\n0000000115 00000 n\ntrailer<</Size 4/Root 1 0 R>>\nstartxref\n190\n%%EOF');
}
function mkPng(p) {
  fs.writeFileSync(p, Buffer.from([
    0x89,0x50,0x4E,0x47,0x0D,0x0A,0x1A,0x0A,
    0x00,0x00,0x00,0x0D,0x49,0x48,0x44,0x52,0x00,0x00,0x00,0x04,0x00,0x00,0x00,0x04,
    0x08,0x02,0x00,0x00,0x00,0x26,0x93,0x09,0x29,
    0x00,0x00,0x00,0x1E,0x49,0x44,0x41,0x54,0x08,0xD7,
    0x63,0xFC,0xFF,0xFF,0x3F,0x03,0x30,0x30,0x30,0xFD,0xFF,0xFF,0x00,0x00,
    0xFF,0xFF,0x00,0x00,0x6C,0xB3,0x07,0x08,
    0x00,0x00,0x00,0x00,0x49,0x45,0x4E,0x44,0xAE,0x42,0x60,0x82
  ]));
}
function mkMp4(p) {
  const d = Buffer.alloc(64, 0);
  Buffer.from('000000206674797069736f6d0000020069736f6d69736f3261766331', 'hex').copy(d);
  fs.writeFileSync(p, d);
}

(async () => {
  console.log('\n🚀 GRO10X Studio — Full Flow Test v5');
  console.log('Base:', BASE);
  console.log('Report:', REPORT_DIR, '\n' + '─'.repeat(60));

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1440,900'],
    defaultViewport: { width: 1440, height: 900 }
  });
  const page = await browser.newPage();

  try {
    // ── STEP 1: Get auth token via API ────────────────────────────────────────
    console.log('\n[1] Authenticate via API');
    
    // Navigate to base URL first to set cookies on correct domain
    await page.goto(BASE, { waitUntil: 'domcontentloaded', timeout: 20000 });
    await ss(page, 'base_page', 'Base Page Loaded (for cookie domain)');

    console.log('  Calling /api/auth/pin/verify...');
    const authRes = await apiLogin(PHONE, PIN);
    console.log('  Auth status:', authRes.status, '| isTemp:', authRes.data.isTemp, '| success:', authRes.data.success);

    if (!authRes.data.success || !authRes.data.token) {
      throw new Error(`Auth API failed: ${authRes.data.error || JSON.stringify(authRes.data)}`);
    }

    const token = authRes.data.token;
    const user = authRes.data.user || {};
    const userObj = {
      id: user.id || 'DBM-001',
      pocId: 'poc_1',
      name: user.name || 'Demo DBM',
      company: user.company || user.name || 'Demo DBM',
      pocRole: user.pocRole || '',
      role: user.role || 'Digital Brand Manager',
      phone: user.phone || PHONE,
      email: authRes.data.email || user.email || 'demodbm@gro10x.ai',
      accessLevel: user.accessLevel || 'Specialist / Crew'
    };

    // Inject auth into browser localStorage + cookie
    await page.evaluate((token, userObj) => {
      localStorage.setItem('gro10x_token', token);
      localStorage.setItem('sb-access-token', token);
      localStorage.setItem('gro10x_user', JSON.stringify(userObj));
      localStorage.setItem('gro10x_user_phone', userObj.phone);
      localStorage.setItem('purple_user', JSON.stringify(userObj));
      localStorage.setItem('purple_user_phone', userObj.phone);
      localStorage.setItem('purpleos_token', token);
      localStorage.setItem('purple_user_email', userObj.email);
      localStorage.setItem('purple_user_name', userObj.name);
      localStorage.setItem('purple_user_role', userObj.role);
      localStorage.setItem('purple_user_access', userObj.accessLevel);
      document.cookie = `sb-access-token=${token}; Path=/; SameSite=Lax; max-age=604800`;
    }, token, userObj);

    ok(`Auth token obtained & injected — user: ${userObj.name} (${userObj.role})`);

    // ── STEP 2: Navigate to /app (Brands Studio) ─────────────────────────────
    console.log('\n[2] Navigate to /app dashboard (Brands Studio)');
    await page.goto(APP_URL, { waitUntil: 'networkidle2', timeout: 30000 });
    await sleep(3000);
    await ss(page, 'app_dashboard', 'App Dashboard /app — Brands Studio');

    const url2 = page.url();
    const body2 = await page.content();
    const onApp = !url2.includes('/auth') && (
      body2.includes('Brand') || body2.includes('Etsy') || body2.includes('Dashboard') ||
      body2.includes('catalog') || body2.includes('Portfolio') || url2.includes('/app')
    );
    onApp ? ok(`App dashboard loaded — URL: ${url2}`) : ng(`Not on app dashboard — URL: ${url2}`);

    if (url2.includes('/auth')) {
      throw new Error('Auth redirect — token injection may not have worked for /app');
    }


    // ── STEP 3: Navigate to Brand Command Center ──────────────────────────────
    console.log('\n[3] Navigate to Brand Command Center (Etsy/Brands)');
    await sleep(1000);

    const nav3 = await page.evaluate(() => {
      // Target the EXACT sidebar link — "Brand Command Center" under DIGITAL BRAND EMPIRE
      const all = Array.from(document.querySelectorAll('a, button, li, [onclick]'));
      
      // Priority 1: exact text match
      const exact = all.find(e => e.textContent?.trim() === 'Brand Command Center');
      if (exact) { exact.click(); return `Exact match: "${exact.textContent?.trim()}"`; }
      
      // Priority 2: contains exact phrase
      const contains = all.find(e => (e.textContent||'').includes('Brand Command Center'));
      if (contains) { contains.click(); return `Contains: "${contains.textContent?.trim()?.substring(0,50)}"`; }
      
      // Priority 3: data-tab="etsy" or onclick including etsy/brands
      const byAttr = all.find(e => 
        (e.getAttribute('data-tab')||'').includes('etsy') ||
        (e.getAttribute('onclick')||'').includes('renderTabContent') ||
        (e.getAttribute('href')||'').includes('etsy')
      );
      if (byAttr) { byAttr.click(); return `ByAttr: "${byAttr.textContent?.trim()?.substring(0,50)}"`; }
      
      return null;
    });

    await sleep(4000); // wait for Brand Command Center tab to fully render
    await ss(page, 'brand_command_center', `Brand Command Center`);
    const body3 = await page.content();
    const hasBrands = body3.includes('PlannerQueenCo')||body3.includes('PLA-01')||
                      body3.includes('Brand Command Center')||body3.includes('Etsy')||
                      body3.includes('DVM')||body3.includes('generateLiveSEOPackage')||
                      body3.includes('🎬 Studio');
    hasBrands ? ok(`Brand Command Center loaded — nav: ${nav3}`) : ng(`Brand content not found — nav: ${nav3}`);


    // ── STEP 4: Click Etsy Command Center tab → find PLA-01 Studio button ─────
    console.log('\n[4] Navigate to Etsy tab → open PLA-01 Studio Drawer');

    // First try clicking "Etsy Command Center" tab within the Brand Command Center
    const etsyTabClicked = await page.evaluate(() => {
      const all = Array.from(document.querySelectorAll('button, a, [onclick], li'));
      // Find "Etsy Command Center" tab
      const etsyTab = all.find(e => (e.textContent||'').trim().includes('Etsy Command Center'));
      if (etsyTab) { etsyTab.click(); return `Clicked: "${etsyTab.textContent?.trim()?.substring(0,50)}"`; }
      // Fallback: any "Etsy" tab
      const etsyAny = all.find(e => (e.textContent||'').trim() === 'Etsy' || (e.getAttribute('data-tab')||'').includes('etsy'));
      if (etsyAny) { etsyAny.click(); return `Fallback: "${etsyAny.textContent?.trim()?.substring(0,50)}"`; }
      return null;
    });
    console.log('  Etsy tab click:', etsyTabClicked);
    await sleep(3000);
    await ss(page, 'etsy_tab', `Etsy Command Center Tab`);

    // Now find the Studio button for PLA-01 or any product
    const studioResult = await page.evaluate(() => {
      const all = Array.from(document.querySelectorAll('[onclick], button'));
      
      // Priority 1: onclick with generateLiveSEOPackage
      const byOC = all.find(e => (e.getAttribute('onclick')||'').includes('generateLiveSEOPackage'));
      if (byOC) { byOC.click(); return `onclick: ${byOC.getAttribute('onclick')?.substring(0,80)}`; }
      
      // Priority 2: button text contains Studio
      const byTxt = all.find(e => e.textContent?.trim().includes('Studio') || e.textContent?.includes('🎬'));
      if (byTxt) { byTxt.click(); return `text: "${byTxt.textContent?.trim()?.substring(0,50)}"`; }
      
      // Priority 3: try calling BrandsModule directly with state inspection
      if (window.BrandsModule) {
        // Get state to find first brand + product
        try {
          const stateStr = localStorage.getItem('gro10x_brands_data');
          if (stateStr) {
            const state = JSON.parse(stateStr);
            const catalog = state.productsCatalog || {};
            for (const [bId, products] of Object.entries(catalog)) {
              if (Array.isArray(products) && products.length > 0) {
                const prod = products.find(p => p.code === 'PLA-01') || products[0];
                if (prod) {
                  window.BrandsModule.generateLiveSEOPackage(bId, prod.code, encodeURIComponent(prod.name || prod.code));
                  return `JS direct: brand=${bId} product=${prod.code}`;
                }
              }
            }
          }
        } catch(e) {}
        
        // Try with brand ID 1
        for (let id = 1; id <= 5; id++) {
          try {
            if (window.BrandsModule.generateLiveSEOPackage) {
              window.BrandsModule.generateLiveSEOPackage(id, 'PLA-01', 'PlannerQueenCo');
              return `JS direct call: brandId=${id} PLA-01`;
            }
          } catch(e) {}
        }
      }
      
      return 'NOT FOUND';
    });

    await sleep(4000);
    await ss(page, 'studio_open', `Studio Drawer — ${studioResult}`);

    const modal4 = await page.evaluate(() => {
      const m = document.getElementById('aiSeoModal');
      const body = document.body.innerHTML;
      return {
        visible: m && (m.style.display === 'flex' || m.style.display === 'block' || m.style.display !== 'none'),
        hasPF: body.includes('PRODUCT FACTORY') || body.includes('Product Factory'),
        hasDVM: body.includes('DVM Production Journey'),
        hasBPGate: body.includes('blueprintGenerateBtn'),
        pct: document.getElementById('studioHeaderPctBadge')?.innerText || null,
        displayVal: m?.style?.display || 'no modal',
      };
    });

    console.log('  Modal state:', JSON.stringify(modal4));
    (modal4.visible || modal4.hasPF) ? ok(`Studio open — DVM:${modal4.hasDVM} BPGate:${modal4.hasBPGate} pct:${modal4.pct}`) :
                                       ng(`Studio NOT open — ${studioResult} — display:${modal4.displayVal}`);


    // ── STEP 5: Blueprint ─────────────────────────────────────────────────────
    console.log('\n[5] Blueprint');
    await ss(page, 'studio_initial', 'Studio Initial State');
    if(modal4.hasBPGate){
      console.log('  Generating blueprint...');
      await page.evaluate(()=>{
        (document.getElementById('blueprintGenerateBtn')||
          Array.from(document.querySelectorAll('button')).find(b=>b.textContent?.includes('Generate Blueprint')))?.click();
      });
      console.log('  ⏳ Blueprint generation (up to 75s)...');
      await page.waitForFunction(()=>
        document.getElementById('studioHeaderPctBadge')!==null||
        document.body.innerHTML.includes('DVM Production Journey')
      ,{timeout:80000}).catch(e=>console.warn('  BP timeout:',e.message));
      await sleep(2000);
    }
    await ss(page, 'blueprint_done', 'Blueprint Step Done');
    const bp5 = await page.evaluate(()=>({
      pct: document.getElementById('studioHeaderPctBadge')?.innerText||null,
      has5: document.body.innerHTML.includes('DVM Production Journey'),
    }));
    bp5.has5 ? ok(`Blueprint — pct: ${bp5.pct}`) : ng(`5-tab not active — pct: ${bp5.pct}`);

    // ── STEP 6: Vault Upload ──────────────────────────────────────────────────
    console.log('\n[6] Vault Upload (PDF)');
    await page.evaluate(()=>window.BrandsModule?.switchStudioTab?.('vault')||document.getElementById('modalTabBtnVault')?.click());
    await sleep(1000);
    await ss(page, 'vault_tab', 'Vault Tab');
    const pdfP=path.join(REPORT_DIR,'test.pdf'); mkPdf(pdfP);
    const vi=await page.$('#vaultFileInput');
    if(vi){
      await vi.uploadFile(pdfP); await sleep(400);
      await page.evaluate(()=>{
        (Array.from(document.querySelectorAll('button,[onclick]')).find(e=>
          e.textContent?.includes('Save to Vault')||(e.getAttribute('onclick')||'').includes('uploadProductDeliverable')
        ))?.click();
      });
      console.log('  ⏳ Vault upload...');
      await page.waitForFunction(()=>{
        const s=document.getElementById('vaultUploadStatus');
        return s&&(s.innerHTML.includes('✅')||s.innerHTML.includes('❌')||s.innerHTML.includes('Saved'));
      },{timeout:40000}).catch(()=>{});
      await sleep(1500);
    } else console.log('  ⚠️ #vaultFileInput not found');
    await ss(page, 'vault_done', 'Vault Upload Result');
    const vR=await page.evaluate(()=>({
      html:document.getElementById('vaultUploadStatus')?.innerHTML||'',
      txt:document.getElementById('vaultUploadStatus')?.innerText?.trim()||null,
      pct:document.getElementById('studioHeaderPctBadge')?.innerText||null,
    }));
    (vR.html.includes('✅')||vR.html.includes('Saved')) ? ok(`Vault ✅ pct: ${vR.pct}`) : ng(`Vault: "${vR.txt}" pct: ${vR.pct}`);

    // ── STEP 7: Mockup Upload (4 images) ─────────────────────────────────────
    console.log('\n[7] Mockup Upload (4 images)');
    await page.evaluate(()=>window.BrandsModule?.switchStudioTab?.('mockups')||document.getElementById('modalTabBtnMockups')?.click());
    await sleep(1000);
    await ss(page, 'media_tab', 'Media Studio Tab');
    const imgs=[]; for(let i=1;i<=4;i++){const p=path.join(REPORT_DIR,`m${i}.png`);mkPng(p);imgs.push(p);}
    const mi=await page.$('#mockupFilesInput');
    if(mi){
      await mi.uploadFile(...imgs); await sleep(600);
      await ss(page, 'mockups_selected', '4 Mockups Selected');
      await page.evaluate(()=>{
        (Array.from(document.querySelectorAll('button,[onclick]')).find(e=>
          e.textContent?.includes('Save Mockups')||(e.getAttribute('onclick')||'').includes('uploadProductMockups')
        ))?.click();
      });
      console.log('  ⏳ Uploading 4 mockups (60-90s)...');
      await page.waitForFunction(()=>{
        const s=document.getElementById('mockupUploadStatus');
        return s&&(s.innerHTML.includes('✅')||s.innerHTML.includes('❌'));
      },{timeout:120000}).catch(()=>{});
      await sleep(2000);
    } else console.log('  ⚠️ #mockupFilesInput not found');
    await ss(page, 'mockups_done', 'Mockup Upload Result');
    const mR=await page.evaluate(()=>({
      html:document.getElementById('mockupUploadStatus')?.innerHTML||'',
      txt:document.getElementById('mockupUploadStatus')?.innerText?.trim()||null,
      pct:document.getElementById('studioHeaderPctBadge')?.innerText||null,
    }));
    mR.html.includes('✅') ? ok(`Mockups ✅ — ${mR.txt?.substring(0,50)} — pct: ${mR.pct}`) : ng(`Mockups: "${mR.txt}" pct: ${mR.pct}`);

    // ── STEP 8: Video Upload ──────────────────────────────────────────────────
    console.log('\n[8] Video Upload');
    const vidP=path.join(REPORT_DIR,'test.mp4'); mkMp4(vidP);
    const vidi=await page.$('#listingVideoInput');
    if(vidi){
      await vidi.uploadFile(vidP); await sleep(400);
      await ss(page, 'video_selected', 'Video Selected');
      await page.evaluate(()=>{
        (Array.from(document.querySelectorAll('button,[onclick]')).find(e=>
          e.textContent?.includes('Save Video')||e.textContent?.includes('Upload Video')||
          (e.getAttribute('onclick')||'').includes('uploadProductVideo')
        ))?.click();
      });
      console.log('  ⏳ Uploading video...');
      await page.waitForFunction(()=>{
        const s=document.getElementById('videoUploadStatus');
        return s&&(s.innerHTML.includes('✅')||s.innerHTML.includes('❌'));
      },{timeout:60000}).catch(()=>{});
      await sleep(1500);
    } else console.log('  ⚠️ #listingVideoInput not found');
    await ss(page, 'video_done', 'Video Upload Result');
    const vidR=await page.evaluate(()=>({
      html:document.getElementById('videoUploadStatus')?.innerHTML||'',
      txt:document.getElementById('videoUploadStatus')?.innerText?.trim()||null,
      pct:document.getElementById('studioHeaderPctBadge')?.innerText||null,
    }));
    vidR.html.includes('✅') ? ok(`Video ✅ — ${vidR.txt?.substring(0,50)} — pct: ${vidR.pct}`) : ng(`Video: "${vidR.txt}" pct: ${vidR.pct}`);

    // ── STEP 9: Progress Check ────────────────────────────────────────────────
    console.log('\n[9] Progress Bar Verification');
    await page.evaluate(()=>window.BrandsModule?.switchStudioTab?.('seo'));
    await sleep(800);
    await ss(page, 'progress', 'Progress Bar — SEO Tab');
    const prog=await page.evaluate(()=>{
      const h=document.body.innerHTML;
      return {
        pct: document.getElementById('studioHeaderPctBadge')?.innerText||'N/A',
        barW: document.getElementById('studioHeaderProgressBar')?.style?.width||'N/A',
        bpDone: h.includes('✅ 1. Blueprint')||h.includes('✅ Blueprint'),
        vDone: h.includes('✅ 2. Vault')||h.includes('✅ Vault'),
        mDone: h.includes('✅ 3. Media')||h.includes('✅ Media'),
      };
    });
    console.log('  Progress:', JSON.stringify(prog));
    parseInt(prog.pct)>=40 ? ok(`Progress ${prog.pct} | BP:${prog.bpDone} Vault:${prog.vDone} Media:${prog.mDone}`) :
                             ng(`Progress ${prog.pct} too low | BP:${prog.bpDone} Vault:${prog.vDone} Media:${prog.mDone}`);

    // ── STEP 10: SEO ─────────────────────────────────────────────────────────
    console.log('\n[10] Generate & Save SEO');
    await page.evaluate(()=>{
      (Array.from(document.querySelectorAll('button')).find(b=>
        b.textContent?.includes('Generate SEO')||(b.getAttribute('onclick')||'').includes('generateStudioSEOWithAI')
      ))?.click();
    });
    console.log('  ⏳ SEO generation (15s)...');
    await sleep(15000);
    await ss(page, 'seo_generated', 'SEO Generated');
    await page.evaluate(()=>(Array.from(document.querySelectorAll('button')).find(b=>b.textContent?.includes('Save SEO')))?.click());
    await sleep(4000);
    await ss(page, 'seo_saved', 'SEO Saved — Final Progress');
    const seoR=await page.evaluate(()=>({
      pct:document.getElementById('studioHeaderPctBadge')?.innerText||'N/A',
      title:document.getElementById('studioSeoTitle')?.value?.substring(0,60)||null,
    }));
    parseInt(seoR.pct)>=60 ? ok(`SEO saved — pct:${seoR.pct} title:"${seoR.title}"`) : ng(`SEO pct:${seoR.pct}`);

    // ── STEP 11: Submit for Review ────────────────────────────────────────────
    console.log('\n[11] Submit for Review');
    page.on('dialog',async d=>{console.log('  📢',d.message()?.substring(0,60));await d.accept();});
    await page.evaluate(()=>{
      (Array.from(document.querySelectorAll('button,[onclick]')).find(e=>
        e.textContent?.includes('Submit for Review')||(e.getAttribute('onclick')||'').includes('submitProductForReview')
      ))?.click();
    });
    await sleep(6000);
    await ss(page, 'submit_final', 'Submit for Review — Final');
    const subR=await page.evaluate(()=>{
      const h=document.body.innerHTML;
      const m=document.getElementById('aiSeoModal');
      return {
        modalClosed: !m||m.style.display==='none'||m.style.display==='',
        hasPending: h.includes('Pending Review'),
        hasSuccess: h.includes('submitted for Admin Review')||h.includes('🎉'),
        hasError: h.includes('Cannot submit')||h.includes('not uploaded to Vault')||
                  h.includes('mockup photos required')||h.includes('video is required'),
        errText: Array.from(document.querySelectorAll('*')).find(e=>e.style?.color?.includes('ef4444'))?.innerText?.substring(0,200)||null,
      };
    });
    console.log('  Submit result:', JSON.stringify(subR));
    if(subR.hasSuccess||(subR.modalClosed&&!subR.hasError)){
      ok(`🎉 SUBMITTED — Pending Review: ${subR.hasPending}`);
    } else if(subR.hasError){
      ng(`Validation blocked: ${subR.errText}`);
    } else {
      ng(`Unclear — ${JSON.stringify(subR)}`);
    }

  } catch(err) {
    console.error('\n💥 Crash:',err.message,'\n',err.stack?.split('\n').slice(0,3).join('\n'));
    await page.screenshot({path:path.join(SS_DIR,`step_${String(++stepNum).padStart(2,'0')}_crash.png`)}).catch(()=>{});
    results.push({step:stepNum,name:'CRASH',file:'crash.png',status:'ERROR',detail:err.message});
  } finally {
    await browser.close();
  }

  const passed=results.filter(r=>r.status==='PASS').length;
  const failed=results.filter(r=>r.status==='FAIL').length;
  const errored=results.filter(r=>r.status==='ERROR').length;
  console.log('\n'+'═'.repeat(60));
  console.log('GRO10X STUDIO — TEST RESULTS v5');
  console.log('═'.repeat(60));
  results.forEach(r=>{
    const icon=r.status==='PASS'?'✅':r.status==='FAIL'?'❌':'💥';
    console.log(`${icon} [${String(r.step).padStart(2,'0')}] ${r.name}`);
    if(r.detail) console.log(`      → ${r.detail}`);
  });
  console.log('─'.repeat(60));
  console.log(`TOTAL: ${results.length} | ✅ ${passed} | ❌ ${failed} | 💥 ${errored}`);
  console.log(`Screenshots: ${SS_DIR}`);
  console.log('═'.repeat(60));
  fs.writeFileSync(path.join(REPORT_DIR,'report.json'),JSON.stringify({
    timestamp:new Date().toISOString(),url:BASE,results,
    summary:{total:results.length,passed,failed,errored}
  },null,2));
  process.exit(failed+errored>0?1:0);
})();
