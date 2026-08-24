/**
 * src/constants/services.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Canonical Agency Services & Pricing Catalog for Purplebot Digital.
 * Single source of truth for Landing Page, CMS, and REST APIs.
 * ─────────────────────────────────────────────────────────────────────────────
 */

const DEFAULT_SERVICES = [
  {
    id: "SVC-001",
    icon: "📢",
    title: "Digital Marketing & Growth",
    category: "Growth & Ads",
    price: "৳75,000 / month",
    description: "Data-driven social media management, paid advertising, and conversion rate optimization.",
    features: [
      "Paid Meta & Google Ads",
      "Social Media Strategy",
      "Audience Retargeting",
      "Monthly Growth Analytics"
    ],
    includedFeatures: [
      "Paid Meta & Google Ads",
      "Social Media Strategy",
      "Audience Retargeting",
      "Monthly Growth Analytics"
    ],
    public: true
  },
  {
    id: "SVC-002",
    icon: "🎥",
    title: "Video Production & Editing",
    category: "Content & Film",
    price: "৳45,000 / 10 Reels",
    description: "High-impact commercial TVCs, viral Reels/TikToks, and full post-production color grading.",
    features: [
      "Commercial TVC Shoots",
      "Short-Form Reels & TikToks",
      "Color Grading & Sound FX",
      "Frame.io Review Workflows"
    ],
    includedFeatures: [
      "Commercial TVC Shoots",
      "Short-Form Reels & TikToks",
      "Color Grading & Sound FX",
      "Frame.io Review Workflows"
    ],
    public: true
  },
  {
    id: "SVC-003",
    icon: "🎨",
    title: "Branding & Motion Design",
    category: "Design & Brand",
    price: "৳65,000 / project",
    description: "Brand identity systems, 3D motion graphics, packaging, and high-converting ad creative.",
    features: [
      "Brand Guidelines & Logos",
      "3D & 2D Motion Graphics",
      "Social Media Creative Kits",
      "Packaging & Print Design"
    ],
    includedFeatures: [
      "Brand Guidelines & Logos",
      "3D & 2D Motion Graphics",
      "Social Media Creative Kits",
      "Packaging & Print Design"
    ],
    public: true
  },
  {
    id: "SVC-004",
    icon: "💻",
    title: "Website & Tech Development",
    category: "Development",
    price: "৳120,000 / project",
    description: "Custom web applications, responsive landing pages, e-commerce, and bot integrations.",
    features: [
      "Custom React / Next.js Apps",
      "High-Converting Landing Pages",
      "Telegram & WhatsApp Bots",
      "API & CRM Integration"
    ],
    includedFeatures: [
      "Custom React / Next.js Apps",
      "High-Converting Landing Pages",
      "Telegram & WhatsApp Bots",
      "API & CRM Integration"
    ],
    public: true
  }
];

module.exports = {
  DEFAULT_SERVICES
};
