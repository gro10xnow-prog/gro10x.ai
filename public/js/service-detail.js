// 🔮 PURPLEBOT DIGITAL — SERVICE DETAIL PAGE CONTROLLER (v0.7.5.1)

const SERVICE_DATABASE = {
  'digital-marketing': {
    title: 'Digital Marketing',
    category: 'PERFORMANCE & GROWTH',
    subtitle: 'Strategic social media management, targeted paid ads, content creation, SEO, and community management built to drive high-converting ROI.',
    pills: [
      '📱 Social Media Marketing',
      '📈 Meta & Google Paid Ads',
      '🔍 Search Engine Optimization (SEO)',
      '✍️ Content Strategy & Copywriting',
      '💬 Community & Page Management',
      '📊 Performance Analytics & ROI Reports'
    ],
    features: [
      { icon: '📱', title: 'Social Media Strategy & Retainers', desc: 'Monthly content plans, creative graphic posts, captions, and publishing calendar.' },
      { icon: '🎯', title: 'Meta & Google Ads Engine', desc: 'Precision audience targeting, retargeting pixels, and conversion funnel optimization.' },
      { icon: '💬', title: 'Community Response SLA < 15m', desc: 'Dedicated page moderators ensuring customer inquiries are handled rapidly.' }
    ]
  },
  'video-editing': {
    title: 'Video Editing & Animation',
    category: 'AV PRODUCTION & ANIMATION',
    subtitle: 'From viral short-form reels to 2D/3D animated explainers, motion graphics, sound design, color grading, and commercial TVCs.',
    pills: [
      '🎬 Scriptwriting & Storyboarding',
      '🎥 2D/3D Explainer Video',
      '📢 2D/3D Infomercial Video',
      '✨ Motion Graphics',
      '🕶️ Innovative AR Video',
      '🔊 Sound Design',
      '🎨 Color Grading',
      '🖌️ Color Correction',
      '💥 VFX / SFX'
    ],
    features: [
      { icon: '🎬', title: 'Animated AV & Explainers', desc: 'Infographics, storyboarding, and 2D/3D character animation for complex stories.' },
      { icon: '✂️', title: 'Commercial Video Editing', desc: 'Multi-cam edits, licensed audio mix, color correction, and special effects.' },
      { icon: '📱', title: 'Viral Short-Form Reels', desc: 'High-retention vertical cut reels optimized for TikTok, Instagram, and Shorts.' }
    ]
  },
  'branding-graphics': {
    title: 'Branding & Graphics Design',
    category: 'BRAND IDENTITY & CREATIVE',
    subtitle: 'Cut through the clutter with unique logo design, complete brand books, packaging, and high-impact marketing collaterals.',
    pills: [
      '🎨 Logo and Brand Identity',
      '📦 Packaging & Label Design',
      '📐 Brand Guidelines & Toolkits',
      '🖼️ Graphic Design & POSM',
      '👕 Merchandise & Print Design'
    ],
    features: [
      { icon: '🎨', title: '360° Brand Identity System', desc: 'Logos, color schemes, typography, vector assets, and brand books.' },
      { icon: '📦', title: 'Product & Packaging Design', desc: 'Retail packaging, label layout, and 3D mockup visualizations.' },
      { icon: '📐', title: 'POSM & Marketing Graphics', desc: 'Banners, flyers, social post templates, and billboard designs.' }
    ]
  },
  'website-development': {
    title: 'Website Development',
    category: 'WEB ENGINE & DESIGN',
    subtitle: 'Sleek corporate portfolio sites, dynamic e-commerce platforms, custom-coded web apps, fast loading speed, and mobile optimization.',
    pills: [
      '🌐 WordPress Website',
      '💻 Custom-coded Website',
      '🏢 Corporate / Portfolio Website',
      '🛒 E-Commerce Website',
      '🛠️ Ongoing Maintenance & Support',
      '☁️ Domain & Hosting Solutions',
      '📱 Mobile / Device Optimization',
      '🧪 User Research & UX Analysis'
    ],
    features: [
      { icon: '🌐', title: 'WordPress & Custom Web Sites', desc: 'High-speed, responsive websites tailored to your brand identity.' },
      { icon: '🛒', title: 'E-Commerce Platforms', desc: 'Payment gateway integration, inventory sync, and seamless checkout experience.' },
      { icon: '⚡', title: 'Mobile & Device Optimization', desc: 'Frictionless UX across all smartphones, tablets, and desktop resolutions.' }
    ]
  },
  'custom-tech': {
    title: 'Custom Tech Solutions',
    category: 'ENTERPRISE TECH & SYSTEMS',
    subtitle: 'Innovative technology solutions designed to streamline business operations, automate workflows, and empower teams.',
    pills: [
      '🛒 E-commerce & Inventory Management System',
      '👥 Customer Relationship Management (CRM) System',
      '💻 Tech Resource / Personnel Deployment',
      '🍔 Restaurant & Order Delivery Management System',
      '📋 Operation & HR Management System',
      '⚙️ Customized ERP System'
    ],
    features: [
      { icon: '👥', title: 'Custom CRM & ERP Systems', desc: 'Tailor-made portals for sales funnels, inventory, task pipelines, and client data.' },
      { icon: '🍔', title: 'Industry-Specific Management Apps', desc: 'Restaurant ordering, delivery dispatch, clinic booking, and retail operations.' },
      { icon: '💻', title: 'Tech Resource Deployment', desc: 'Dedicated senior full-stack developers and QA engineers integrated into your team.' }
    ]
  }
};

document.addEventListener('DOMContentLoaded', () => {
  renderServiceDetailPage();
});

function renderServiceDetailPage() {
  const path = window.location.pathname.toLowerCase();
  let key = 'digital-marketing';

  if (path.includes('video')) key = 'video-editing';
  else if (path.includes('branding')) key = 'branding-graphics';
  else if (path.includes('website')) key = 'website-development';
  else if (path.includes('custom-tech') || path.includes('tech')) key = 'custom-tech';

  const data = SERVICE_DATABASE[key] || SERVICE_DATABASE['digital-marketing'];

  // Update Page Title
  document.title = `${data.title} — Purplebot Digital Agency`;

  // Update Hero Content
  const badge = document.getElementById('svcCategoryBadge');
  if (badge) badge.innerText = data.category;

  const title = document.getElementById('svcTitle');
  if (title) title.innerHTML = `${data.title.split(' & ')[0]} <br><span class="pb-gradient-text">${data.title.split(' & ')[1] || 'Solutions'}</span>`;

  const subtitle = document.getElementById('svcSubtitle');
  if (subtitle) subtitle.innerText = data.subtitle;

  // Render Pills
  const pillsContainer = document.getElementById('svcPillsContainer');
  if (pillsContainer && data.pills) {
    pillsContainer.innerHTML = data.pills.map(p => `
      <div class="pb-client-pill" style="background:#ffffff; border-color:rgba(124,58,237,0.25); color:#7c3aed; font-size:0.88rem; padding:0.6rem 1.25rem;">
        <span>${p}</span>
      </div>
    `).join('');
  }

  // Render Feature Grid
  const grid = document.getElementById('svcFeatureGrid');
  if (grid && data.features) {
    grid.innerHTML = data.features.map(f => `
      <div class="pb-service-card">
        <div>
          <div class="pb-svc-icon">${f.icon}</div>
          <h3>${f.title}</h3>
          <p>${f.desc}</p>
        </div>
        <button onclick="openPurpleBot('${f.title}')" class="pb-btn-svc">
          Inquire For ${f.title.split(' ')[0]} →
        </button>
      </div>
    `).join('');
  }

  // Set global active service for Purple Bot CTA button
  window.activeServiceTitle = data.title;
}

function triggerServiceQuote() {
  const serviceName = window.activeServiceTitle || 'Service Consultation';
  openPurpleBot(serviceName);
}
