const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');

function getBase64Image(filePath) {
  if (!fs.existsSync(filePath)) {
    console.warn('File not found:', filePath);
    return '';
  }
  const ext = path.extname(filePath).replace('.', '') || 'png';
  const data = fs.readFileSync(filePath);
  return `data:image/${ext === 'svg' ? 'svg+xml' : ext};base64,${data.toString('base64')}`;
}

async function generatePDF() {
  console.log('Loading assets for National Housing Finance Board Proposal...');

  // Use the official user-provided National Housing logo & official GRO10X logo
  const nhfLogo = getBase64Image('D:/gro10x.ai/public/nhf_official_logo.png');
  const gro10xLogo = getBase64Image('D:/gro10x.ai/public/images/gro10x-official-logo.png');
  const qrCode = getBase64Image('D:/gro10x.ai/public/nhf_qr.png');

  // Creative assets from Section 2
  const slide1 = getBase64Image('D:/gro10x.ai/public/section2_extracted/slide_1.png');
  const slide2 = getBase64Image('D:/gro10x.ai/public/section2_extracted/slide_2.png');
  const slide3 = getBase64Image('D:/gro10x.ai/public/section2_extracted/slide_3.png');
  const slide4 = getBase64Image('D:/gro10x.ai/public/section2_extracted/slide_4.png');
  const slide5 = getBase64Image('D:/gro10x.ai/public/section2_extracted/slide_5.png');
  const slide6 = getBase64Image('D:/gro10x.ai/public/section2_extracted/slide_6.png');
  const slide7 = getBase64Image('D:/gro10x.ai/public/section2_extracted/slide_7.png');
  const slide8 = getBase64Image('D:/gro10x.ai/public/section2_extracted/slide_8.png');

  console.log('Building 8-Page A4 Master HTML Template aligned with GRO10X Brand Guidelines...');

  const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>National Housing Finance Limited — Board of Directors Proposal</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@600;700;800;900&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Space+Grotesk:wght@500;600;700;800&family=Hind+Siliguri:wght@400;600;700&display=swap" rel="stylesheet">
  <style>
    @page {
      size: A4 portrait;
      margin: 0;
    }
    :root {
      --gro-navy: #070B12;
      --gro-slate: #0F172A;
      --gro-card-bg: #141E2E;
      --gro-emerald: #00DF89;
      --gro-cyan: #00F0FF;
      --gro-white: #FFFFFF;
      --nhf-blue: #0072CE;
      --nhf-red: #E31837;
      --border-dark: rgba(0, 223, 137, 0.25);
    }
    *, *::before, *::after {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    body {
      font-family: 'Plus Jakarta Sans', sans-serif;
      color: #1E293B;
      background: #F1F5F9;
      -webkit-font-smoothing: antialiased;
    }
    .page {
      width: 210mm;
      height: 297mm;
      max-height: 297mm;
      min-height: 297mm;
      overflow: hidden;
      position: relative;
      page-break-after: always;
      page-break-inside: avoid;
      background: #FFFFFF;
      padding: 13mm 16mm 13mm 16mm;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }
    
    /* Executive Page Header (Pages 2-8) */
    .doc-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-bottom: 3mm;
      border-bottom: 1.5px solid #E2E8F0;
      margin-bottom: 3.5mm;
    }
    .doc-header .left-meta {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .doc-header .nhf-logo-header {
      height: 28px;
      object-fit: contain;
    }
    .doc-header .gro-logo-header {
      height: 20px;
      border-radius: 3px;
    }
    .doc-header .divider-h {
      height: 18px;
      width: 1px;
      background: #CBD5E1;
    }
    .doc-header .doc-tag {
      font-size: 8px;
      font-weight: 700;
      color: var(--gro-emerald);
      text-transform: uppercase;
      letter-spacing: 1px;
      background: var(--gro-navy);
      padding: 2px 8px;
      border-radius: 4px;
      border: 1px solid var(--border-dark);
    }
    .doc-header .right-meta {
      font-size: 8.5px;
      font-weight: 600;
      color: #64748B;
      text-align: right;
    }

    /* Executive Page Footer */
    .doc-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-top: 3mm;
      border-top: 1.5px solid #E2E8F0;
      margin-top: 3.5mm;
      font-size: 8px;
      color: #64748B;
    }
    .doc-footer .confidential {
      font-weight: 700;
      color: var(--gro-navy);
      letter-spacing: 0.5px;
    }
    .doc-footer .page-number {
      font-weight: 800;
      color: var(--nhf-blue);
    }

    /* Typography & Core Elements */
    h2.section-title {
      font-family: 'Space Grotesk', sans-serif;
      font-size: 15px;
      font-weight: 800;
      color: var(--gro-navy);
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 2mm;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    h2.section-title::before {
      content: '';
      display: inline-block;
      width: 4px;
      height: 16px;
      background: var(--gro-emerald);
      border-radius: 2px;
    }
    p.lead-text {
      font-size: 9.2px;
      line-height: 1.5;
      color: #334155;
      margin-bottom: 3.5mm;
    }

    /* Cards & Containers */
    .card {
      background: #F8FAFC;
      border: 1px solid #E2E8F0;
      border-radius: 8px;
      padding: 10px 12px;
    }
    .card-navy {
      background: var(--gro-navy);
      color: #FFFFFF;
      border: 1px solid #1E293B;
    }
    .card-emerald {
      background: #F0FDF4;
      border: 1px solid #BBF7D0;
    }

    /* Grid Layouts */
    .grid-2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
    }
    .grid-3 {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 10px;
    }

    /* PAGE 1: COVER PAGE STYLING (GRO10X BRAND GUIDELINE ALIGNED) */
    .page-cover {
      background: radial-gradient(circle at 85% 15%, #0F172A 0%, #070B12 55%, #030508 100%);
      color: #FFFFFF;
      padding: 18mm 18mm 16mm 18mm;
      justify-content: space-between;
    }
    .cover-top-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .co-branding-lockup {
      display: flex;
      align-items: center;
      gap: 16px;
    }
    .nhf-logo-cover {
      height: 48px;
      background: #FFFFFF;
      padding: 6px 14px;
      border-radius: 8px;
      box-shadow: 0 4px 16px rgba(0,0,0,0.3);
    }
    .gro-logo-cover {
      height: 40px;
      border-radius: 6px;
      box-shadow: 0 4px 16px rgba(0,0,0,0.3);
    }
    .co-brand-x {
      font-size: 14px;
      font-weight: 800;
      color: var(--gro-emerald);
    }
    .cover-badge {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 6px 14px;
      border-radius: 6px;
      background: rgba(0, 223, 137, 0.1);
      border: 1px solid var(--border-dark);
      color: var(--gro-emerald);
      font-size: 9px;
      font-weight: 800;
      letter-spacing: 1.5px;
      text-transform: uppercase;
    }
    .cover-badge-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: var(--gro-emerald);
      box-shadow: 0 0 8px var(--gro-emerald);
    }
    .cover-hero {
      margin: auto 0;
    }
    .cover-pre-title {
      color: var(--gro-emerald);
      font-size: 11px;
      font-weight: 800;
      letter-spacing: 2px;
      text-transform: uppercase;
      margin-bottom: 8px;
    }
    .cover-title {
      font-family: 'Space Grotesk', sans-serif;
      font-size: 26px;
      font-weight: 800;
      line-height: 1.25;
      color: #FFFFFF;
      margin-bottom: 14px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .cover-title span {
      color: var(--gro-emerald);
    }
    .cover-desc {
      font-size: 11px;
      line-height: 1.6;
      color: #94A3B8;
      max-width: 580px;
      margin-bottom: 24px;
    }
    .cover-pillars {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 12px;
      margin-bottom: 20px;
    }
    .cover-pillar-item {
      background: rgba(255, 255, 255, 0.04);
      border: 1px solid rgba(0, 223, 137, 0.2);
      border-radius: 8px;
      padding: 10px 12px;
    }
    .cover-pillar-item .num {
      font-family: 'Space Grotesk', sans-serif;
      font-size: 14px;
      font-weight: 800;
      color: var(--gro-emerald);
      margin-bottom: 4px;
    }
    .cover-pillar-item .label {
      font-size: 9px;
      font-weight: 700;
      color: #FFFFFF;
      text-transform: uppercase;
      margin-bottom: 2px;
    }
    .cover-pillar-item .sub {
      font-size: 8px;
      color: #94A3B8;
    }
    .cover-meta-box {
      background: rgba(15, 23, 42, 0.85);
      border: 1px solid rgba(0, 223, 137, 0.25);
      border-radius: 8px;
      padding: 14px 18px;
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
    }
    .meta-field .title {
      font-size: 8px;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: var(--gro-emerald);
      font-weight: 700;
      margin-bottom: 2px;
    }
    .meta-field .val {
      font-size: 9.5px;
      font-weight: 700;
      color: #FFFFFF;
    }
    .meta-field .subval {
      font-size: 8px;
      color: #94A3B8;
    }

    /* IMAGES & CREATIVES */
    .creative-card {
      border: 1px solid #CBD5E1;
      border-radius: 8px;
      overflow: hidden;
      background: #FFFFFF;
      box-shadow: 0 2px 8px rgba(0,0,0,0.04);
    }
    .creative-card img {
      width: 100%;
      display: block;
    }
    .creative-card .caption {
      padding: 8px 10px;
      background: #F8FAFC;
      border-top: 1px solid #E2E8F0;
    }
    .creative-card .caption h4 {
      font-size: 9.5px;
      font-weight: 800;
      color: var(--gro-navy);
      margin-bottom: 2px;
    }
    .creative-card .caption p {
      font-size: 8px;
      color: #64748B;
      line-height: 1.4;
    }

    /* QR CODE PROMINENT BOX */
    .qr-hero-card {
      background: linear-gradient(135deg, #070B12 0%, #0F172A 100%);
      color: #FFFFFF;
      border: 1.5px solid var(--gro-emerald);
      border-radius: 10px;
      padding: 14px 18px;
      display: flex;
      align-items: center;
      gap: 18px;
      box-shadow: 0 6px 20px rgba(7, 11, 18, 0.35);
    }
    .qr-frame {
      background: #FFFFFF;
      padding: 8px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      width: 110px;
      height: 110px;
      flex-shrink: 0;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .qr-frame img {
      width: 100%;
      height: 100%;
      display: block;
    }
    .qr-details h3 {
      font-family: 'Space Grotesk', sans-serif;
      font-size: 13px;
      font-weight: 800;
      color: #FFFFFF;
      margin-bottom: 4px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .qr-details h3 span {
      color: var(--gro-emerald);
    }
    .qr-details p {
      font-size: 8.5px;
      color: #CBD5E1;
      line-height: 1.45;
      margin-bottom: 8px;
    }
    .qr-link-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: rgba(0, 223, 137, 0.15);
      border: 1px solid var(--gro-emerald);
      padding: 4px 10px;
      border-radius: 4px;
      font-size: 8.5px;
      font-weight: 700;
      color: #FFFFFF;
      letter-spacing: 0.5px;
    }

    /* PRICING & COMMERCIAL TABLE */
    table.commercial-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 8.5px;
      margin-bottom: 3mm;
    }
    table.commercial-table th {
      background: var(--gro-navy);
      color: #FFFFFF;
      padding: 6px 10px;
      text-align: left;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      border: 1px solid var(--gro-navy);
    }
    table.commercial-table td {
      padding: 7px 10px;
      border: 1px solid #E2E8F0;
      background: #FFFFFF;
      color: #1E293B;
    }
    table.commercial-table tr:nth-child(even) td {
      background: #F8FAFC;
    }
    table.commercial-table tr.total-row td {
      background: #F0FDF4;
      font-weight: 800;
      color: var(--gro-navy);
      border-top: 2px solid var(--gro-emerald);
    }

    /* SIGNATURE BLOCK */
    .sign-block {
      border: 1px solid #E2E8F0;
      border-radius: 8px;
      padding: 12px 16px;
      background: #F8FAFC;
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 24px;
    }
    .sign-col {
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      height: 130px;
    }
    .sign-col .header-role {
      font-size: 8.5px;
      font-weight: 800;
      color: var(--gro-navy);
      text-transform: uppercase;
      letter-spacing: 0.5px;
      border-bottom: 1px solid #CBD5E1;
      padding-bottom: 4px;
    }
    .sign-col .line {
      border-bottom: 1.5px dashed #94A3B8;
      margin-top: 25px;
      margin-bottom: 6px;
    }
    .sign-col .name {
      font-size: 9px;
      font-weight: 800;
      color: var(--gro-navy);
    }
    .sign-col .title {
      font-size: 8px;
      color: #64748B;
    }
  </style>
</head>
<body>

  <!-- ================= PAGE 1: COVER PAGE ================= -->
  <div class="page page-cover">
    <div class="cover-top-bar">
      <div class="co-branding-lockup">
        <img src="${nhfLogo}" alt="National Housing Finance Limited" class="nhf-logo-cover">
        <span class="co-brand-x">&times;</span>
        <img src="${gro10xLogo}" alt="GRO10X Agency" class="gro-logo-cover">
      </div>
      <div class="cover-badge">
        <span class="cover-badge-dot"></span>
        Formal Board Submission Dossier
      </div>
    </div>

    <div class="cover-hero">
      <div class="cover-pre-title">Strategic Institutional Proposal</div>
      <h1 class="cover-title">
        Omnichannel Brand Transformation<br>
        & Digital Growth <span>Engine</span>
      </h1>
      <p class="cover-desc">
        A strategic proposal to modernize National Housing Finance PLC's public digital presence, unify brand identity across LinkedIn, Facebook, and YouTube, and deploy an automated high-yield lead capture engine for retail home loans and Shariah wealth products.
      </p>

      <div class="cover-pillars">
        <div class="cover-pillar-item">
          <div class="num">01</div>
          <div class="label">Public Portal Overhaul</div>
          <div class="sub">Next.js 15, EMI calculator, online application funnel, CMS.</div>
        </div>
        <div class="cover-pillar-item">
          <div class="num">02</div>
          <div class="label">Omnichannel Consistency</div>
          <div class="sub">Unified brand standards across LinkedIn, FB, YouTube.</div>
        </div>
        <div class="cover-pillar-item">
          <div class="num">03</div>
          <div class="label">Performance Growth</div>
          <div class="sub">Lead generation engine attached directly to branch sales.</div>
        </div>
      </div>
    </div>

    <div class="cover-meta-box">
      <div class="meta-field">
        <div class="title">Submitted To</div>
        <div class="val">The Honorable Board of Directors & Senior Management</div>
        <div class="subval">National Housing Finance Limited (NHFL)</div>
      </div>
      <div class="meta-field">
        <div class="title">Presented By</div>
        <div class="val">GRO10X AI Growth Agency & Advisory</div>
        <div class="subval">Hotline: +880 1711-019550 | corporate@gro10x.ai</div>
      </div>
      <div class="meta-field">
        <div class="title">Dossier Reference</div>
        <div class="val">GRO-NHF-2026-BD01</div>
        <div class="subval">Classification: Confidential Corporate Proposal</div>
      </div>
      <div class="meta-field">
        <div class="title">Pilot Timeline</div>
        <div class="val">3-Month Pilot Cycle (October – December 2026)</div>
        <div class="subval">Includes live prototype access & full omnichannel rollout</div>
      </div>
    </div>
  </div>

  <!-- ================= PAGE 2: EXECUTIVE SUMMARY ================= -->
  <div class="page">
    <div class="doc-header">
      <div class="left-meta">
        <img src="${nhfLogo}" alt="NHF" class="nhf-logo-header">
        <div class="divider-h"></div>
        <img src="${gro10xLogo}" alt="GRO10X" class="gro-logo-header">
        <span class="doc-tag">Strategic Dossier</span>
      </div>
      <div class="right-meta">Dossier Ref: GRO-NHF-2026-BD01</div>
    </div>

    <div>
      <h2 class="section-title">1. Executive Summary & Market Positioning</h2>
      <p class="lead-text">
        National Housing Finance PLC stands as an esteemed financial institution in Bangladesh, backed by over <strong>25 years of institutional stability</strong>, listing on the Dhaka Stock Exchange (DSE: NHFIL), Bangladesh Bank FI-08 license, and premier institutional shareholders including <strong>Sadharan Bima Corporation, National Life Insurance Company, and Reliance Insurance</strong>.
      </p>

      <div class="grid-2" style="margin-bottom: 4mm;">
        <div class="card card-navy">
          <h3 style="font-size: 11px; font-weight: 800; color: var(--gro-emerald); margin-bottom: 4px; text-transform: uppercase;">The Strategic Imperative</h3>
          <p style="font-size: 8.5px; line-height: 1.45; color: #E2E8F0;">
            Today’s high-value home loan applicants and deposit customers make purchasing decisions digitally before stepping into a branch. While National Housing enjoys unquestioned balance sheet strength and regulatory reputation, its digital touchpoints require modernization to compete effectively against aggressive commercial banks and modern NBFIs.
          </p>
        </div>
        <div class="card card-emerald">
          <h3 style="font-size: 11px; font-weight: 800; color: var(--gro-navy); margin-bottom: 4px; text-transform: uppercase;">Heritage Integrity (No Logo Change)</h3>
          <p style="font-size: 8.5px; line-height: 1.45; color: #334155;">
            Our mandate respects and preserves National Housing's established corporate identity. <strong>We do not alter the existing corporate logo or foundational heritage.</strong> Instead, we elevate brand perception through luxury financial color grading, crisp bilingual typography, modern UI design, and rigorous omnichannel uniformity.
          </p>
        </div>
      </div>

      <div class="card" style="margin-bottom: 4mm; border-left: 4px solid var(--gro-emerald);">
        <h3 style="font-size: 10.5px; font-weight: 800; color: var(--gro-navy); margin-bottom: 4px;">Strategic Objectives of the 3-Month Pilot</h3>
        <p style="font-size: 8.5px; color: #475569; line-height: 1.5; margin-bottom: 6px;">
          Rather than committing to an indefinite or unproven marketing retainer, we propose a focused, accountable <strong>3-Month Pilot Program</strong> with clear deliverables and shared commercial incentives:
        </p>
        <div class="grid-3">
          <div style="background: #FFFFFF; padding: 6px 8px; border-radius: 4px; border: 1px solid #E2E8F0;">
            <strong style="font-size: 8.5px; color: var(--gro-navy); display: block;">1. Portal Deployment</strong>
            <span style="font-size: 7.5px; color: #64748B;">Launch modern public website with interactive calculators & CMS.</span>
          </div>
          <div style="background: #FFFFFF; padding: 6px 8px; border-radius: 4px; border: 1px solid #E2E8F0;">
            <strong style="font-size: 8.5px; color: var(--gro-navy); display: block;">2. Omnichannel Sync</strong>
            <span style="font-size: 7.5px; color: #64748B;">Rebrand and actively maintain LinkedIn, Facebook, and YouTube channels.</span>
          </div>
          <div style="background: #FFFFFF; padding: 6px 8px; border-radius: 4px; border: 1px solid #E2E8F0;">
            <strong style="font-size: 8.5px; color: var(--gro-navy); display: block;">3. Lead Generation</strong>
            <span style="font-size: 7.5px; color: #64748B;">Direct digital inquiries into branch sales teams with qualification tracking.</span>
          </div>
        </div>
      </div>

      <div class="card card-navy" style="padding: 10px 14px;">
        <h3 style="font-size: 10px; font-weight: 800; color: var(--gro-emerald); text-transform: uppercase; margin-bottom: 4px;">Why National Housing Wins With GRO10X</h3>
        <p style="font-size: 8px; color: #CBD5E1; line-height: 1.45;">
          Unlike traditional advertising agencies that deliver static graphics without technical integration, GRO10X operates as an integrated AI growth agency. We combine cutting-edge software engineering (Next.js 15, cloud architecture, automated forms) with institutional-grade creative production, ensuring that every marketing taka spent directly fuels loan disbursements and deposit mobilization.
        </p>
      </div>
    </div>

    <div class="doc-footer">
      <span class="confidential">CONFIDENTIAL — FOR BOARD OF DIRECTORS REVIEW ONLY</span>
      <span class="page-number">Page 2 of 8</span>
    </div>
  </div>

  <!-- ================= PAGE 3: SCOPE OF WORK ================= -->
  <div class="page">
    <div class="doc-header">
      <div class="left-meta">
        <img src="${nhfLogo}" alt="NHF" class="nhf-logo-header">
        <div class="divider-h"></div>
        <img src="${gro10xLogo}" alt="GRO10X" class="gro-logo-header">
        <span class="doc-tag">Scope of Work</span>
      </div>
      <div class="right-meta">Dossier Ref: GRO-NHF-2026-BD01</div>
    </div>

    <div>
      <h2 class="section-title">2. Scope of Work & Omnichannel Architecture</h2>
      <p class="lead-text">
        Our engagement covers a complete brand and communication overhaul across three interconnected operational pillars during the 3-month pilot cycle.
      </p>

      <div style="display: flex; flex-direction: column; gap: 3.5mm; margin-bottom: 3.5mm;">
        <!-- PILLAR 1 -->
        <div class="card" style="border-left: 4px solid var(--gro-navy);">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
            <h3 style="font-size: 10.5px; font-weight: 800; color: var(--gro-navy); text-transform: uppercase;">Pillar 1: Corporate Website Overhaul & Interactive Branch</h3>
            <span style="font-size: 7.5px; background: var(--gro-navy); color: var(--gro-emerald); font-weight: 700; padding: 2px 6px; border-radius: 3px;">Full Stack Delivery</span>
          </div>
          <p style="font-size: 8px; color: #475569; line-height: 1.4; margin-bottom: 6px;">
            Complete modernization of the public corporate website into a fast, mobile-first institutional portal built on Next.js 15 and Tailwind CSS.
          </p>
          <div class="grid-2">
            <div style="background: #FFFFFF; padding: 6px 8px; border-radius: 4px; border: 1px solid #E2E8F0;">
              <strong style="font-size: 8px; color: var(--gro-navy);">• Interactive Financial Calculators:</strong>
              <p style="font-size: 7.5px; color: #64748B;">Real-time EMI loan calculator (up to 20-yr tenure) and compound deposit projections.</p>
            </div>
            <div style="background: #FFFFFF; padding: 6px 8px; border-radius: 4px; border: 1px solid #E2E8F0;">
              <strong style="font-size: 8px; color: var(--gro-navy);">• Dedicated Al-Ameen Islamic Portal:</strong>
              <p style="font-size: 7.5px; color: #64748B;">Shariah-supervised HPSM home co-ownership and Mudaraba deposit workflows.</p>
            </div>
            <div style="background: #FFFFFF; padding: 6px 8px; border-radius: 4px; border: 1px solid #E2E8F0;">
              <strong style="font-size: 8px; color: var(--gro-navy);">• Integrated CMS Engine:</strong>
              <p style="font-size: 7.5px; color: #64748B;">Easy management for notice boards, interest rates, citizen charter, and annual reports.</p>
            </div>
            <div style="background: #FFFFFF; padding: 6px 8px; border-radius: 4px; border: 1px solid #E2E8F0;">
              <strong style="font-size: 8px; color: var(--gro-navy);">• Direct Lead Capture Engine:</strong>
              <p style="font-size: 7.5px; color: #64748B;">Online pre-qualification forms routed automatically to branch loan officers.</p>
            </div>
          </div>
        </div>

        <!-- PILLAR 2 -->
        <div class="card" style="border-left: 4px solid var(--gro-emerald);">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
            <h3 style="font-size: 10.5px; font-weight: 800; color: var(--gro-navy); text-transform: uppercase;">Pillar 2: Omnichannel Social Media Management</h3>
            <span style="font-size: 7.5px; background: var(--gro-emerald); color: var(--gro-navy); font-weight: 800; padding: 2px 6px; border-radius: 3px;">Active Governance</span>
          </div>
          <p style="font-size: 8px; color: #475569; line-height: 1.4; margin-bottom: 6px;">
            Unifying and actively managing National Housing's official communication channels to project prestige and institutional trust.
          </p>
          <div class="grid-3">
            <div style="background: #FFFFFF; padding: 6px 8px; border-radius: 4px; border: 1px solid #E2E8F0;">
              <strong style="font-size: 8px; color: var(--gro-navy);">LinkedIn Company Page</strong>
              <p style="font-size: 7.5px; color: #64748B; margin-top: 2px;">Corporate governance, financial disclosures, shareholder highlights, and senior executive thought leadership.</p>
            </div>
            <div style="background: #FFFFFF; padding: 6px 8px; border-radius: 4px; border: 1px solid #E2E8F0;">
              <strong style="font-size: 8px; color: var(--gro-navy);">Facebook Business Page</strong>
              <p style="font-size: 7.5px; color: #64748B; margin-top: 2px;">Retail home loan campaigns, 1-Crore wealth creation promotions, customer queries, and bilingual engagement.</p>
            </div>
            <div style="background: #FFFFFF; padding: 6px 8px; border-radius: 4px; border: 1px solid #E2E8F0;">
              <strong style="font-size: 8px; color: var(--gro-navy);">YouTube Channel</strong>
              <p style="font-size: 7.5px; color: #64748B; margin-top: 2px;">High-definition explainers on home financing, Al-Ameen Islamic features, customer testimonials, and AGM highlights.</p>
            </div>
          </div>
        </div>

        <!-- PILLAR 3 -->
        <div class="card" style="border-left: 4px solid var(--nhf-blue);">
          <h3 style="font-size: 10.5px; font-weight: 800; color: var(--gro-navy); text-transform: uppercase; margin-bottom: 4px;">Pillar 3: Monthly Content Production & Maintenance</h3>
          <p style="font-size: 8px; color: #475569; line-height: 1.4;">
            Delivering <strong>15+ curated creative assets per month</strong> (infographics, carousel guides, video snippets, and festive announcements) maintained under strict brand guideline compliance across all touchpoints.
          </p>
        </div>
      </div>
    </div>

    <div class="doc-footer">
      <span class="confidential">CONFIDENTIAL — FOR BOARD OF DIRECTORS REVIEW ONLY</span>
      <span class="page-number">Page 3 of 8</span>
    </div>
  </div>

  <!-- ================= PAGE 4: INTERACTIVE PROTOTYPE & QR CODE ================= -->
  <div class="page">
    <div class="doc-header">
      <div class="left-meta">
        <img src="${nhfLogo}" alt="NHF" class="nhf-logo-header">
        <div class="divider-h"></div>
        <img src="${gro10xLogo}" alt="GRO10X" class="gro-logo-header">
        <span class="doc-tag">Live Demonstration</span>
      </div>
      <div class="right-meta">Dossier Ref: GRO-NHF-2026-BD01</div>
    </div>

    <div>
      <h2 class="section-title">3. Interactive Live Prototype & Board Experience</h2>
      <p class="lead-text">
        To demonstrate our commitment to tangible execution without delay, GRO10X has already deployed an interactive working prototype of National Housing's modernized public web portal directly on our secure agency cloud infrastructure.
      </p>

      <!-- PROMINENT QR CODE HERO SECTION -->
      <div class="qr-hero-card" style="margin-bottom: 4mm;">
        <div class="qr-frame">
          <img src="${qrCode}" alt="Scan to Launch Live Prototype">
        </div>
        <div class="qr-details">
          <h3>Scan With Smartphone <span>Camera</span></h3>
          <p>
            Point your mobile camera at the QR code on the left to immediately launch the live interactive prototype on your smartphone or tablet. Hosted securely under GRO10X Cloud with zero setup required.
          </p>
          <div style="margin-bottom: 6px;">
            <span class="qr-link-badge">
              <svg width="10" height="10" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/></svg>
              https://gro10x-ai.vercel.app/nhf
            </span>
          </div>
          <span style="font-size: 7.5px; color: #94A3B8;">Direct Agency Hosted Mirror: gro10x.ai/nhf</span>
        </div>
      </div>

      <div class="grid-2" style="margin-bottom: 3.5mm;">
        <div class="card card-emerald">
          <h3 style="font-size: 10px; font-weight: 800; color: var(--gro-navy); margin-bottom: 4px; text-transform: uppercase;">Key Modules Ready for Testing</h3>
          <ul style="font-size: 8px; color: #334155; line-height: 1.5; padding-left: 14px;">
            <li><strong>Dynamic EMI Calculator:</strong> Instant slider calculation with loan tenure up to 20 years, interest breakdown, and amortization schedule.</li>
            <li><strong>Millionaire Deposit Scheme:</strong> Interactive compound wealth growth projection showing journey to BDT 1 Crore.</li>
            <li><strong>Al-Ameen Islamic Finance:</strong> Dedicated Shariah products with Bai-Muazzal and HPSM co-ownership workflows.</li>
            <li><strong>Online Pre-Application Form:</strong> Real-time customer intent submission with instant client confirmation.</li>
          </ul>
        </div>
        <div class="card">
          <h3 style="font-size: 10px; font-weight: 800; color: var(--gro-navy); margin-bottom: 4px; text-transform: uppercase;">Technical Specifications</h3>
          <ul style="font-size: 8px; color: #475569; line-height: 1.5; padding-left: 14px;">
            <li><strong>Infrastructure:</strong> GRO10X High-Performance Cloud Edge Network with global CDN.</li>
            <li><strong>Performance:</strong> Sub-second mobile load speed with 99+ Google Lighthouse score.</li>
            <li><strong>Security:</strong> Full SSL encryption, XSS protection, and Bangladesh Bank regulatory compliance.</li>
            <li><strong>Bilingual Readiness:</strong> Dynamic Bengali (বাংলা) & English instant language switching.</li>
          </ul>
        </div>
      </div>

      <div class="card card-navy" style="padding: 8px 12px; text-align: center;">
        <span style="font-size: 8px; color: #CBD5E1;">
          "The interactive prototype demonstrates our capability to deliver institutional-grade digital experiences rapidly, ensuring National Housing's online presence matches its 25-year market reputation."
        </span>
      </div>
    </div>

    <div class="doc-footer">
      <span class="confidential">CONFIDENTIAL — FOR BOARD OF DIRECTORS REVIEW ONLY</span>
      <span class="page-number">Page 4 of 8</span>
    </div>
  </div>

  <!-- ================= PAGE 5: CREATIVE SHOWCASE 1 ================= -->
  <div class="page">
    <div class="doc-header">
      <div class="left-meta">
        <img src="${nhfLogo}" alt="NHF" class="nhf-logo-header">
        <div class="divider-h"></div>
        <img src="${gro10xLogo}" alt="GRO10X" class="gro-logo-header">
        <span class="doc-tag">Creative Portfolio</span>
      </div>
      <div class="right-meta">Dossier Ref: GRO-NHF-2026-BD01</div>
    </div>

    <div>
      <h2 class="section-title">4. Omnichannel Creative Portfolio: Retail Assets</h2>
      <p class="lead-text">
        Sample creative campaigns developed for National Housing's digital channels, showcasing high-impact visual design, persuasive financial copywriting, and seamless bilingual messaging across Facebook, LinkedIn, and Web.
      </p>

      <div style="display: flex; flex-direction: column; gap: 4mm;">
        <!-- CAMPAIGN 1: HOME LOANS -->
        <div style="border: 1px solid #E2E8F0; border-radius: 8px; padding: 10px; background: #FFFFFF;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
            <div>
              <span style="font-size: 7.5px; font-weight: 800; color: var(--gro-emerald); text-transform: uppercase;">Campaign Concept 01</span>
              <h3 style="font-size: 11px; font-weight: 800; color: var(--gro-navy);">Home Loans Up to 70% with 20-Year Tenure</h3>
            </div>
            <span style="font-size: 7.5px; background: #F1F5F9; color: #475569; padding: 2px 6px; border-radius: 4px; font-weight: 600;">Target: Urban Homebuyers & Families</span>
          </div>

          <div style="display: grid; grid-template-columns: 1.4fr 1fr; gap: 10px; align-items: center;">
            <div class="creative-card">
              <img src="${slide1}" alt="Home Loans 20-Year Tenure Banner">
              <div class="caption">
                <h4>Digital Landscape Banner (16:9)</h4>
                <p>Website Hero & LinkedIn Header with Hotline 16534 and Online Application CTA.</p>
              </div>
            </div>
            <div class="creative-card">
              <img src="${slide5}" alt="Home Loans Bengali Square">
              <div class="caption">
                <h4>Bengali Social Post (1:1 Square)</h4>
                <p>"সহজ শর্তে ২০ বছর মেয়াদে ৭০% পর্যন্ত হোম লোন" — Retail Facebook & Instagram campaign.</p>
              </div>
            </div>
          </div>
        </div>

        <!-- CAMPAIGN 2: WEALTH CREATION -->
        <div style="border: 1px solid #E2E8F0; border-radius: 8px; padding: 10px; background: #FFFFFF;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
            <div>
              <span style="font-size: 7.5px; font-weight: 800; color: var(--gro-emerald); text-transform: uppercase;">Campaign Concept 02</span>
              <h3 style="font-size: 11px; font-weight: 800; color: var(--gro-navy);">Guaranteed Wealth Creation & High Yields — BDT 1 Crore Scheme</h3>
            </div>
            <span style="font-size: 7.5px; background: #F1F5F9; color: #475569; padding: 2px 6px; border-radius: 4px; font-weight: 600;">Target: High-Net-Worth Individuals & Professionals</span>
          </div>

          <div style="display: grid; grid-template-columns: 1.4fr 1fr; gap: 10px; align-items: center;">
            <div class="creative-card">
              <img src="${slide2}" alt="1 Crore Wealth Creation Banner">
              <div class="caption">
                <h4>Digital Landscape Banner (16:9)</h4>
                <p>Deposit mobilization campaign highlighting compound growth and capital security.</p>
              </div>
            </div>
            <div class="creative-card">
              <img src="${slide6}" alt="1 Crore Wealth Bengali Square">
              <div class="caption">
                <h4>Bengali Social Post (1:1 Square)</h4>
                <p>"১ কোটি টাকার সমৃদ্ধি ও নিশ্চিত ভবিষ্যৎ" — High-converting social media creative.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="doc-footer">
      <span class="confidential">CONFIDENTIAL — FOR BOARD OF DIRECTORS REVIEW ONLY</span>
      <span class="page-number">Page 5 of 8</span>
    </div>
  </div>

  <!-- ================= PAGE 6: CREATIVE SHOWCASE 2 ================= -->
  <div class="page">
    <div class="doc-header">
      <div class="left-meta">
        <img src="${nhfLogo}" alt="NHF" class="nhf-logo-header">
        <div class="divider-h"></div>
        <img src="${gro10xLogo}" alt="GRO10X" class="gro-logo-header">
        <span class="doc-tag">Creative Portfolio</span>
      </div>
      <div class="right-meta">Dossier Ref: GRO-NHF-2026-BD01</div>
    </div>

    <div>
      <h2 class="section-title">5. Omnichannel Creative Portfolio: Shariah & Heritage</h2>
      <p class="lead-text">
        Showcasing creative executions for Al-Ameen Islamic Banking and National Housing's 25-Year institutional stability, leveraging shareholder trust to mobilize institutional and retail capital.
      </p>

      <div style="display: flex; flex-direction: column; gap: 4mm;">
        <!-- CAMPAIGN 3: ISLAMIC BANKING -->
        <div style="border: 1px solid #E2E8F0; border-radius: 8px; padding: 10px; background: #FFFFFF;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
            <div>
              <span style="font-size: 7.5px; font-weight: 800; color: var(--gro-emerald); text-transform: uppercase;">Campaign Concept 03</span>
              <h3 style="font-size: 11px; font-weight: 800; color: var(--gro-navy);">Al-Ameen Islamic Banking: Riba-Free HPSM Home Co-Ownership</h3>
            </div>
            <span style="font-size: 7.5px; background: #F1F5F9; color: #475569; padding: 2px 6px; border-radius: 4px; font-weight: 600;">Target: Shariah-Conscious Homeowners & Investors</span>
          </div>

          <div style="display: grid; grid-template-columns: 1.4fr 1fr; gap: 10px; align-items: center;">
            <div class="creative-card">
              <img src="${slide3}" alt="Al-Ameen Islamic Banking Banner">
              <div class="caption">
                <h4>Digital Landscape Banner (16:9)</h4>
                <p>Highlighting 100% Halal Shariah-certified Mudaraba deposits & HPSM co-ownership.</p>
              </div>
            </div>
            <div class="creative-card">
              <img src="${slide7}" alt="Al-Ameen Islamic Bengali Square">
              <div class="caption">
                <h4>Bengali Social Post (1:1 Square)</h4>
                <p>"সুদমুক্ত শরীয়াহ সম্মত হোম ফাইন্যান্সিং - আল-আমীন মুদারাবা ডিপোজিট স্কিম".</p>
              </div>
            </div>
          </div>
        </div>

        <!-- CAMPAIGN 4: INSTITUTIONAL HERITAGE -->
        <div style="border: 1px solid #E2E8F0; border-radius: 8px; padding: 10px; background: #FFFFFF;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
            <div>
              <span style="font-size: 7.5px; font-weight: 800; color: var(--gro-emerald); text-transform: uppercase;">Campaign Concept 04</span>
              <h3 style="font-size: 11px; font-weight: 800; color: var(--gro-navy);">25-Year Heritage & Blue-Chip Institutional Stability</h3>
            </div>
            <span style="font-size: 7.5px; background: #F1F5F9; color: #475569; padding: 2px 6px; border-radius: 4px; font-weight: 600;">Target: Corporate Treasuries & Institutional Depositors</span>
          </div>

          <div style="display: grid; grid-template-columns: 1.4fr 1fr; gap: 10px; align-items: center;">
            <div class="creative-card">
              <img src="${slide4}" alt="25-Year Heritage Banner">
              <div class="caption">
                <h4>Digital Landscape Banner (16:9)</h4>
                <p>Highlighting Sadharan Bima, National Life, Reliance Insurance, and FI-08 license.</p>
              </div>
            </div>
            <div class="creative-card">
              <img src="${slide8}" alt="25-Year Heritage Bengali Square">
              <div class="caption">
                <h4>Bengali Social Post (1:1 Square)</h4>
                <p>"২৫ বছরের গৌরব ও অবিচল আস্থা" — Reinforcing sovereign & corporate investor confidence.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="doc-footer">
      <span class="confidential">CONFIDENTIAL — FOR BOARD OF DIRECTORS REVIEW ONLY</span>
      <span class="page-number">Page 6 of 8</span>
    </div>
  </div>

  <!-- ================= PAGE 7: COMMERCIAL INVESTMENT ================= -->
  <div class="page">
    <div class="doc-header">
      <div class="left-meta">
        <img src="${nhfLogo}" alt="NHF" class="nhf-logo-header">
        <div class="divider-h"></div>
        <img src="${gro10xLogo}" alt="GRO10X" class="gro-logo-header">
        <span class="doc-tag">Commercial Proposal</span>
      </div>
      <div class="right-meta">Dossier Ref: GRO-NHF-2026-BD01</div>
    </div>

    <div>
      <h2 class="section-title">6. Commercial Proposal & 3-Month Pilot Model</h2>
      <p class="lead-text">
        We propose a transparent, risk-mitigated commercial structure featuring an accessible monthly pilot investment combined with a shared performance revenue-share on converted leads.
      </p>

      <div class="card card-emerald" style="margin-bottom: 3.5mm;">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <div>
            <span style="font-size: 7.5px; font-weight: 800; color: var(--gro-navy); text-transform: uppercase;">Pilot Framework</span>
            <h3 style="font-size: 13px; font-weight: 800; color: var(--gro-navy);">Fixed Monthly Pilot Budget: BDT 50,000 / Month</h3>
          </div>
          <span style="background: var(--gro-navy); color: var(--gro-emerald); font-size: 8px; font-weight: 800; padding: 4px 10px; border-radius: 4px; border: 1px solid var(--border-dark);">3-Month Pilot: BDT 150,000 Total</span>
        </div>
      </div>

      <table class="commercial-table">
        <thead>
          <tr>
            <th style="width: 25%;">Pillar / Component</th>
            <th style="width: 50%;">Detailed Deliverables & Scope</th>
            <th style="width: 25%; text-align: right;">Monthly Allocation</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>Pillar 1: Platform & Systems Overhaul</strong></td>
            <td>
              Corporate website modernization (Next.js 15), CMS deployment, interactive loan & deposit calculators, lead intake forms, hosting maintenance, security updates, and technical uptime guarantee.
            </td>
            <td style="text-align: right; font-weight: 700;">BDT 25,000 / mo</td>
          </tr>
          <tr>
            <td><strong>Pillar 2: Omnichannel Content & Management</strong></td>
            <td>
              Active management and visual modernization of LinkedIn Company Page, Facebook Business Page, and YouTube Channel. Production of 15+ curated creative assets/month (infographics, carousels, bilingual copy).
            </td>
            <td style="text-align: right; font-weight: 700;">BDT 25,000 / mo</td>
          </tr>
          <tr class="total-row">
            <td><strong>Total Fixed Monthly Investment</strong></td>
            <td><strong>Full agency scope encompassing software engineering, creative design, and multi-channel maintenance.</strong></td>
            <td style="text-align: right; font-size: 10px; color: var(--gro-navy);"><strong>BDT 50,000 / mo</strong></td>
          </tr>
        </tbody>
      </table>

      <!-- PERFORMANCE REVENUE SHARE MODEL -->
      <div class="card card-navy" style="margin-bottom: 3.5mm; padding: 12px 14px;">
        <h3 style="font-size: 11px; font-weight: 800; color: var(--gro-emerald); text-transform: uppercase; margin-bottom: 4px;">
          Aligned Incentives: Performance Revenue-Share Model
        </h3>
        <p style="font-size: 8px; color: #E2E8F0; line-height: 1.45; margin-bottom: 6px;">
          To prove our confidence in generating measurable commercial value, GRO10X will work on a success-fee structure tied directly to balance-sheet growth:
        </p>
        <div style="background: rgba(255,255,255,0.06); border: 1px solid rgba(0, 223, 137, 0.3); border-radius: 6px; padding: 8px 10px;">
          <p style="font-size: 8px; color: #F8FAFC; line-height: 1.4;">
            <strong>Qualified Converted Leads Incentive:</strong> GRO10X will receive an agreed success bounty for every verified lead generated through the digital system that is successfully converted into a <strong>disbursed home loan</strong> or <strong>term deposit account</strong> by National Housing's branches. The precise conversion bounty will be mutually defined with executive management prior to campaign rollout.
          </p>
        </div>
      </div>

      <div class="card" style="border-left: 3px solid var(--gro-navy);">
        <h4 style="font-size: 9px; font-weight: 800; color: var(--gro-navy); margin-bottom: 2px;">Pilot Duration & Completion Milestone</h4>
        <p style="font-size: 8px; color: #475569; line-height: 1.4;">
          The initial pilot runs for exactly <strong>3 Months (ending December 27, 2026)</strong>. At the conclusion of the pilot, a comprehensive board report will be submitted documenting total web traffic, lead volume, branch conversion rates, and ROI to determine long-term annual extension.
        </p>
      </div>
    </div>

    <div class="doc-footer">
      <span class="confidential">CONFIDENTIAL — FOR BOARD OF DIRECTORS REVIEW ONLY</span>
      <span class="page-number">Page 7 of 8</span>
    </div>
  </div>

  <!-- ================= PAGE 8: IMPLEMENTATION ROADMAP & SIGN-OFF ================= -->
  <div class="page">
    <div class="doc-header">
      <div class="left-meta">
        <img src="${nhfLogo}" alt="NHF" class="nhf-logo-header">
        <div class="divider-h"></div>
        <img src="${gro10xLogo}" alt="GRO10X" class="gro-logo-header">
        <span class="doc-tag">Governance & Sign-Off</span>
      </div>
      <div class="right-meta">Dossier Ref: GRO-NHF-2026-BD01</div>
    </div>

    <div>
      <h2 class="section-title">7. Implementation Roadmap & Board Sign-Off</h2>
      <p class="lead-text">
        Structured implementation timeline ensuring rapid live deployment with zero disruption to daily banking operations, accompanied by formal dual sign-off.
      </p>

      <div class="grid-2" style="margin-bottom: 4mm;">
        <div class="card" style="border-left: 3px solid var(--gro-emerald);">
          <h4 style="font-size: 9px; font-weight: 800; color: var(--gro-navy); margin-bottom: 2px;">Weeks 1–2: Setup & Brand Harmonization</h4>
          <p style="font-size: 7.5px; color: #475569; line-height: 1.35;">
            Finalize brand guidelines, verify website copy and regulatory disclosures, connect CMS data schemas, and deploy staging environment for executive approval.
          </p>
        </div>
        <div class="card" style="border-left: 3px solid var(--gro-navy);">
          <h4 style="font-size: 9px; font-weight: 800; color: var(--gro-navy); margin-bottom: 2px;">Weeks 3–4: Public Portal Live Launch</h4>
          <p style="font-size: 7.5px; color: #475569; line-height: 1.35;">
            Migrate DNS, switch public domain to new Next.js portal, configure SSL certificates, rebrand LinkedIn/Facebook/YouTube channels, and activate analytics tracking.
          </p>
        </div>
        <div class="card" style="border-left: 3px solid var(--nhf-blue);">
          <h4 style="font-size: 9px; font-weight: 800; color: var(--gro-navy); margin-bottom: 2px;">Weeks 5–8: Campaign & Lead Engine Activation</h4>
          <p style="font-size: 7.5px; color: #475569; line-height: 1.35;">
            Roll out retail loan and wealth creation content campaigns, initiate bilingual educational series on YouTube, and automate lead routing to branch managers.
          </p>
        </div>
        <div class="card" style="border-left: 3px solid #10B981;">
          <h4 style="font-size: 9px; font-weight: 800; color: var(--gro-navy); margin-bottom: 2px;">Weeks 9–12: Conversion Optimization & Review</h4>
          <p style="font-size: 7.5px; color: #475569; line-height: 1.35;">
            Audit inquiry-to-disbursement ratios, optimize digital landing pages, finalize lead conversion incentive tally, and present comprehensive Board Pilot Audit.
          </p>
        </div>
      </div>

      <!-- FORMAL DUAL SIGN-OFF BLOCK -->
      <div class="sign-block">
        <!-- CLIENT SIDE -->
        <div class="sign-col">
          <div>
            <div class="header-role">Approved for & on behalf of:</div>
            <img src="${nhfLogo}" alt="National Housing" style="height: 32px; margin-top: 6px; object-fit: contain;">
          </div>
          <div>
            <div class="line"></div>
            <div class="name">Authorized Signatory / Managing Director</div>
            <div class="title">National Housing Finance Limited (NHFL)</div>
            <div style="font-size: 7.5px; color: #94A3B8; margin-top: 2px;">Date: ________________________ / Seal</div>
          </div>
        </div>

        <!-- AGENCY SIDE -->
        <div class="sign-col">
          <div>
            <div class="header-role">Submitted & Guaranteed by:</div>
            <img src="${gro10xLogo}" alt="GRO10X Agency" style="height: 26px; margin-top: 6px; border-radius: 4px;">
          </div>
          <div>
            <div class="line"></div>
            <div class="name">Managing Partner & Principal Strategist</div>
            <div class="title">GRO10X AI Growth Agency (gro10x.ai)</div>
            <div style="font-size: 7.5px; color: #94A3B8; margin-top: 2px;">Hotline: +880 1711-019550 | corporate@gro10x.ai</div>
          </div>
        </div>
      </div>

      <div style="margin-top: 3.5mm; text-align: center;">
        <span style="font-size: 7.5px; color: #64748B;">
          This proposal document constitutes a confidential presentation to the Board of Directors of National Housing Finance Limited. All terms herein are binding upon mutual execution.
        </span>
      </div>
    </div>

    <div class="doc-footer">
      <span class="confidential">CONFIDENTIAL — FOR BOARD OF DIRECTORS REVIEW ONLY</span>
      <span class="page-number">Page 8 of 8</span>
    </div>
  </div>

</body>
</html>`;

  const htmlPath = path.join(__dirname, '../public/nhf_board_proposal.html');
  fs.writeFileSync(htmlPath, htmlContent, 'utf8');
  console.log('Saved updated master HTML to:', htmlPath);

  console.log('Launching Puppeteer with system Chrome...');
  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath: 'C:\\\\Program Files\\\\Google\\\\Chrome\\\\Application\\\\chrome.exe',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1200, height: 1600, deviceScaleFactor: 2 });

  const fileUrl = 'file:///' + htmlPath.replace(/\\/g, '/');
  console.log('Navigating to:', fileUrl);
  await page.goto(fileUrl, { waitUntil: 'load', timeout: 60000 });
  await page.evaluateHandle('document.fonts.ready');
  console.log('Fonts and DOM ready.');

  // Generate screenshots of each page for preview inspection
  const pageElements = await page.$$('.page');
  console.log(`Found ${pageElements.length} pages in DOM.`);
  const previewDir = 'D:/gro10x.ai/public/proposal_previews';
  if (!fs.existsSync(previewDir)) fs.mkdirSync(previewDir, { recursive: true });

  for (let i = 0; i < pageElements.length; i++) {
    const previewFile = path.join(previewDir, `page_${i + 1}.png`);
    await pageElements[i].screenshot({ path: previewFile });
    console.log(`Saved preview: page_${i + 1}.png`);
  }

  const pdfPath = 'D:/gro10x.ai/National_Housing_Finance_Board_Proposal.pdf';
  await page.pdf({
    path: pdfPath,
    format: 'A4',
    printBackground: true,
    preferCSSPageSize: true,
    margin: { top: 0, right: 0, bottom: 0, left: 0 }
  });

  console.log('Compiled final PDF successfully to:', pdfPath);
  await browser.close();
  console.log('Puppeteer browser closed successfully.');
}

generatePDF().catch(err => {
  console.error('Error generating PDF:', err);
  process.exit(1);
});
