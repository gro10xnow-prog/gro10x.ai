/**
 * src/services/campaign-generator.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Engine 2 Outbound Marketing & Campaign Distribution Generator
 * Transforms canonical catalog services into multi-touch B2B outreach packs:
 * 1. 3-Touch B2B Cold Email Sequence (Bottleneck -> Asset Drop -> Sprint Scope)
 * 2. Viral LinkedIn Case Study Post Copy (Hook, Metrics, Architecture, Comment CTA)
 * 3. Twitter / X 5-Tweet Architecture Breakdown Thread
 * 4. Gated Lead Magnet Offer & Deterministic UTM Campaign Tracking Links
 * ─────────────────────────────────────────────────────────────────────────────
 */

const { getServiceByCode } = require('./taxonomy');

const BASE_URL = process.env.PUBLIC_APP_URL || 'https://gro10x-ai.vercel.app';

/**
 * Generate a complete, ready-to-deploy campaign pack for any canonical service
 */
async function generateServiceCampaignPack(productCode) {
  if (!productCode) {
    throw new Error('productCode is required to generate campaign pack.');
  }

  const cleanCode = productCode.trim().toUpperCase();
  const product = await getServiceByCode(cleanCode);

  if (!product) {
    throw new Error(`Service '${cleanCode}' not found in catalog.`);
  }

  const meta = product.metadata || {};
  const proof = meta.proof_pack || {};
  const eng = meta.engineering || {};
  const techStack = eng.tech_stack || ['Node.js', 'Supabase PostgreSQL', 'Vercel Edge'];
  const deliverables = eng.core_deliverables || ['Full Architecture & Codebase', 'Relational Database', 'CI/CD Deployment'];
  const targetIcp = meta.target_icp || ['Funded Startup Founders', 'Corporate Innovation Teams', 'Digital Operators'];
  const primaryIcp = targetIcp[0] || 'Founders and Operators';
  const turnaround = eng.turnaround_days || 14;
  const priceUsd = meta.price_usd || 2500;
  const caseStudyTitle = proof.case_study_title || `How We Engineered ${product.name} in 14 Days`;
  const codeClean = cleanCode.replace(/[^A-Z0-9]/gi, '');

  // ───────────────────────────────────────────────────────────────────────────
  // 1. Deterministic Campaign Codes & UTM Attribution
  // ───────────────────────────────────────────────────────────────────────────
  const campaignCodes = {
    email: `CMP-E2-${codeClean}-EML-01`,
    linkedin: `CMP-E2-${codeClean}-LNK-01`,
    twitter: `CMP-E2-${codeClean}-TWX-01`,
    webPortal: `CMP-E2-${codeClean}-WEB-01`
  };

  const utmLinks = {
    emailLink: `${BASE_URL}/services/${cleanCode}?utm_source=outbound_email&utm_medium=cold_email&utm_campaign=${campaignCodes.email}&service=${cleanCode}`,
    linkedinLink: `${BASE_URL}/services/${cleanCode}?utm_source=linkedin&utm_medium=social_organic&utm_campaign=${campaignCodes.linkedin}&service=${cleanCode}`,
    twitterLink: `${BASE_URL}/services/${cleanCode}?utm_source=twitter&utm_medium=thread&utm_campaign=${campaignCodes.twitter}&service=${cleanCode}`,
    leadMagnetClaimUrl: `${BASE_URL}/leads/claim?service=${cleanCode}&utm_campaign=${campaignCodes.linkedin}`
  };

  // ───────────────────────────────────────────────────────────────────────────
  // 2. 3-Touch B2B Cold Email Sequence
  // ───────────────────────────────────────────────────────────────────────────
  const coldEmailSequence = [
    {
      touchNumber: 1,
      dayOffset: 1,
      purpose: 'The Bottleneck Hook & Real-World Transformation',
      subjectLines: [
        `Quick question regarding {{company}}'s engineering pipeline`,
        `How we cut 70% off ${product.name} build times`,
        `${primaryIcp} bottleneck — case study inside`
      ],
      bodyText: `Hi {{firstName}},\n\nNoticed {{company}} is scaling rapidly and likely tackling complex digital infrastructure this quarter.\n\nMost ${primaryIcp.toLowerCase()} we speak with are frustrated by legacy agency quotes: 3–4 months of billable hours and $15,000+ invoices before ever seeing a production MVP.\n\nWe recently tackled this exact friction: ${caseStudyTitle}.\n\nBy leveraging modern ${techStack.slice(0, 3).join(', ')} cloud architecture, we engineer and deploy production-grade solutions in as fast as ${turnaround} days with 100% full source code ownership.\n\nWould it be useful if I sent over our 10-slide case study breakdown and architecture diagram for your team to review?\n\nBest,\n\nTanvir Rahman\nFounder & Principal Architect, GRO10X AI Agency\nWhatsApp: +880 1708 459008 | Web: ${utmLinks.emailLink}`
    },
    {
      touchNumber: 2,
      dayOffset: 4,
      purpose: 'The High-Value Free Asset Drop (Zero Friction)',
      subjectLines: [
        `Architecture diagram for ${product.name}`,
        `Full system blueprint (+ 10-slide deck)`
      ],
      bodyText: `Hi {{firstName}},\n\nFollowing up on my previous note. Rather than booking a call, I wanted to share the actual technical blueprints so you can evaluate the architecture directly:\n\n📄 10-Slide Case Study Deck: ${proof.slides_pdf_url || '/assets/case-studies/overview.pdf'}\n🛠️ System Architecture Blueprint: ${proof.blueprint_url || '/assets/blueprints/system.pdf'}\n\nCore highlights inside:\n• Clean ${techStack.join(' + ')} stack with zero recurring lock-in fees\n• Complete database schema with row-level security\n• Milestone delivery roadmap (${turnaround} days from kickoff to live deployment)\n\nIf this looks relevant for {{company}}'s upcoming sprint, let me know and I can scope out a tailored milestone proposal.\n\nBest,\nTanvir`
    },
    {
      touchNumber: 3,
      dayOffset: 8,
      purpose: 'The 14-Day Sprint Scope & Handover Offer',
      subjectLines: [
        `14-day sprint scope for {{company}}`,
        `Closing the loop on ${product.name}`
      ],
      bodyText: `Hi {{firstName}},\n\nFinal check-in before I close this thread.\n\nIf you have an upcoming project or internal tool requirement, we package ${product.name} into a dedicated fixed-price sprint ($${priceUsd.toLocaleString()} one-time):\n\nKey Deliverables:\n${deliverables.slice(0, 4).map(d => `• ${d}`).join('\n')}\n• 100% Intellectual Property & GitHub Handover\n• 30 Days Bug-Fix Warranty & Direct Support\n\nIf timing is right to discuss, you can grab 15 minutes on our founder calendar: ${BASE_URL}/book-consultation?service=${cleanCode}\n\nOr feel free to message me directly on WhatsApp at +880 1708 459008.\n\nBest regards,\nTanvir`
    }
  ];

  // ───────────────────────────────────────────────────────────────────────────
  // 3. Viral LinkedIn Case Study Post Copy
  // ───────────────────────────────────────────────────────────────────────────
  const linkedInPost = {
    hook: `Most companies spend 4 months and $20,000 building what modern AI architecture can deploy in ${turnaround} days.`,
    body: `Here is the exact engineering breakdown of how we built ${product.name}:\n\n` +
      `❌ THE CRITICAL BOTTLENECK:\n` +
      `Legacy agency billing, fragmented tech stacks, and bloated boilerplate delay time-to-market. Great products die waiting for their first version.\n\n` +
      `⚡ THE ARCHITECTURAL BREAKTHROUGH:\n` +
      `Instead of custom scaffolding from scratch, we engineer on a high-throughput stack:\n` +
      techStack.map(t => `• ${t}`).join('\n') + `\n\n` +
      `📊 MEASURABLE OUTCOMES:\n` +
      `• Turnaround: Shipped to production in exactly ${turnaround} days\n` +
      `• IP Transfer: 100% full source code ownership in GitHub\n` +
      `• Cost Efficiency: 65%+ reduction vs. traditional agency retainer models\n\n` +
      `Want the full 10-slide case study and system architecture blueprint?\n\n` +
      `👇 Drop a comment with "BLUEPRINT" below and I'll DM you the raw PDF diagram directly.`,
    callToAction: 'Comment "BLUEPRINT" to receive the system architecture PDF in DMs.',
    recommendedMedia: {
      carouselPdf: proof.slides_pdf_url || `/assets/case-studies/${meta.slug || 'service'}-case-study.pdf`,
      videoPoster: proof.video_poster || '/images/video-poster.webp',
      spotifyPodcastUrl: proof.audio_overview_url || 'https://open.spotify.com/show/gro10x-ai-case-studies'
    },
    hashtags: ['#B2BGrowth', '#AIArchitecture', '#SoftwareEngineering', '#Startups', '#TechLeadership']
  };

  // ───────────────────────────────────────────────────────────────────────────
  // 4. Twitter / X 5-Tweet Breakdown Thread
  // ───────────────────────────────────────────────────────────────────────────
  const twitterThread = [
    `1/5 How we built and deployed a production ${product.name} in ${turnaround} days with zero legacy agency overhead: 🧵👇`,
    `2/5 The problem with traditional agency builds:\n- 12+ weeks of hourly billing\n- Bloated, unmaintainable code\n- Zero transparent deployment\n\nHere is how modern AI-native engineering changes the math:`,
    `3/5 The Tech Stack:\n${techStack.map(t => `• ${t}`).join('\n')}\n\nFast edge execution, real-time database sync, and zero recurring platform lock-in.`,
    `4/5 Key Deliverables handed over to the client:\n${deliverables.slice(0, 3).map(d => `✓ ${d}`).join('\n')}\n\nPlus 30 days of bug-fix warranty and full GitHub ownership.`,
    `5/5 We packaged this entire architecture into our standard 14-day sprint.\n\nRead the full case study or grab the system architecture diagram here: ${utmLinks.twitterLink} 🚀`
  ];

  // ───────────────────────────────────────────────────────────────────────────
  // 5. Gated Lead Magnet Offer Brief
  // ───────────────────────────────────────────────────────────────────────────
  const leadMagnet = {
    title: `The 10-Slide Engineering Blueprint: ${product.name}`,
    headline: `Steal the exact ${turnaround}-day production architecture we use for high-growth enterprise clients.`,
    assets: [
      { name: '10-Slide Case Study PDF', url: proof.slides_pdf_url || '/assets/case-studies/case-study.pdf' },
      { name: 'Full System Architecture Blueprint Diagram', url: proof.blueprint_url || '/assets/blueprints/system.pdf' },
      { name: 'Spotify Audio Walkthrough Episode', url: proof.audio_overview_url || 'https://open.spotify.com/show/gro10x-ai-case-studies' }
    ],
    submissionEndpoint: '/api/leads',
    defaultLeadPayload: {
      service: cleanCode,
      service_interest: cleanCode,
      source: 'Lead Magnet / Outbound Campaign',
      utm_campaign: campaignCodes.linkedin,
      utm_source: 'linkedin'
    }
  };

  return {
    ok: true,
    productCode: cleanCode,
    productName: product.name,
    category: product.category_id,
    targetIcp,
    pricing: { usd: priceUsd, bdt: meta.price_bdt || Math.round(priceUsd * 118) },
    campaignCodes,
    utmLinks,
    coldEmailSequence,
    linkedInPost,
    twitterThread,
    leadMagnet
  };
}

module.exports = {
  generateServiceCampaignPack
};
