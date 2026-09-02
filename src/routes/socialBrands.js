/**
 * src/routes/socialBrands.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Social Brand Hub & Multi-Channel Content OS Router
 * v2.0 — Primary Language Profiles, Deep Analytics Command Deck & Fixed YouTube Dual-Tier Cadence
 * ─────────────────────────────────────────────────────────────────────────────
 */

const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { requireAuth } = require('../middleware/auth');
const { isSupabaseConfigured, supabase } = require('../services/supabase');
const aiRoutes = require('./ai');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }
});

const DATA_FILE = path.join(__dirname, '../../data/social_brands_state.json');

// Default Seed Brands with Multi-Channel, Community & Language configuration
const SEED_DATA = {
  brands: [
    {
      id: 'brand-grow-bangla',
      slug: 'grow-bangla',
      name: 'Grow Bangla',
      primaryLanguage: 'Bangla + English (Banglish / Spoken)',
      tagline: 'Bridging Career, Language & Professional Growth for Bangladesh',
      niche: 'Spoken English, Career Preparation, Job Circulars, Visa & Global Skills',
      palette: ['#10b981', '#059669', '#047857', '#1e293b', '#0f172a'],
      fonts: 'Hind Siliguri + Inter',
      tone: 'Encouraging, practical, clear, aspirational, highly educational',
      mission: 'Empowering young professionals in Bangladesh with actionable job interview English, global career roadmaps, and high-income skills.',
      standardHashtags: '#GrowBangla #LearnEnglish #JobPreparation #CareerGrowth #SpokenEnglish',
      standardCta: 'Subscribe to Grow Bangla for weekly job interview mastery & spoken English breakdowns! Link in bio.',
      logoUrl: '',
      assets: [],
      channels: [
        {
          id: 'gb-youtube',
          slug: 'youtube',
          name: 'YouTube Channel',
          platform: 'YouTube',
          type: 'video',
          isAnchor: true,
          primaryLanguage: 'Bangla + English (Banglish / Spoken)',
          handle: '@GrowBangla',
          url: 'https://youtube.com/@GrowBangla',
          defaultContentType: 'Short-form Video',
          targetCadencePerWeek: 9, // 2 Long-form + 7 Shorts per week
          audienceCount: 427,
          audienceLabel: '28.6K Views · 427 Subscribers',
          analyticsKnowledgeBase: {
            source: 'YouTube Studio Lifetime Export',
            lastUpdated: new Date().toISOString(),
            totalVideosIndexed: 114,
            totalViews: 28612,
            totalWatchTimeHours: 1144.9,
            totalSubscribers: 427,
            impressions: 201198,
            avgCtr: 5.18,
            avgViewDuration: '2:24',
            bestPostingDays: ['Friday 18:00', 'Tuesday 19:00', 'Monday 20:00'],
            primaryLanguage: 'Bangla + English (Banglish / Spoken)',
            topPerformers: [
              { rank: 1, title: "McDonald’s Service Crew Interview Guide | Answer Common Questions in English", views: 14013, watchHours: 757.4, subs: 178, ctr: 8.07, avgDuration: '3:15', format: 'Long-form' },
              { rank: 2, title: "Shomvob Presents Campus to Career 2024 I First Round Instructions", views: 6349, watchHours: 317.9, subs: 180, ctr: 8.32, avgDuration: '3:01', format: 'Long-form' },
              { rank: 3, title: "Donald Trump on Bangladesh #shorts", views: 1090, watchHours: 4.5, subs: 0, ctr: 1.02, avgDuration: '0:25', format: 'Short' },
              { rank: 4, title: "SteadFast Courier Business Development Executive Job #shorts", views: 649, watchHours: 2.6, subs: 3, ctr: 1.34, avgDuration: '0:24', format: 'Short' },
              { rank: 5, title: "২৫ বছরের হোম লোন মাত্র ১০ বছরে পরিশোধের গোপন কৌশল! (Save Lakhs in Interest)", views: 434, watchHours: 11.3, subs: 3, ctr: 5.29, avgDuration: '1:34', format: 'Long-form' }
            ],
            topCategories: ['Job Interview English Guides', 'Career Tracks & Competitions', 'Financial & Salary Strategies', 'Skill Development Shorts'],
            recommendations: [
              "Long-form interview English guides (like McDonald's Crew) deliver over 60% of all watch time and subscriber conversion.",
              "Career preparation competitions and official job walkthroughs convert viewers at an exceptional 8.3% CTR.",
              "Fixed YouTube Strategy: 2 Long-form tutorials every week on Friday & Tuesday + 1 Daily Short for maximum discovery."
            ]
          },
          calendars: {}
        },
        {
          id: 'gb-facebook',
          slug: 'facebook',
          name: 'Facebook Page',
          platform: 'Facebook',
          type: 'social',
          isAnchor: false,
          primaryLanguage: 'Bangla + English (Banglish / Spoken)',
          handle: 'Grow Bangla Official',
          url: 'https://facebook.com/growbangla',
          defaultContentType: 'Short-form Video',
          targetCadencePerWeek: 5,
          audienceCount: 5200,
          audienceLabel: '5.2K Followers',
          analyticsKnowledgeBase: {
            source: 'Meta Business Suite Baseline',
            lastUpdated: new Date().toISOString(),
            totalVideosIndexed: 45,
            totalViews: 12500,
            impressions: 48000,
            avgCtr: 4.6,
            bestPostingDays: ['Friday 19:00', 'Monday 20:00'],
            primaryLanguage: 'Bangla + English (Banglish / Spoken)',
            topCategories: ['Reels Spoken English Hacks', 'Job Circular Posters', 'Daily Word Challenge'],
            recommendations: ['Reels under 40 seconds with Bengali captions achieve highest shares.']
          },
          calendars: {}
        },
        {
          id: 'gb-whatsapp',
          slug: 'whatsapp',
          name: 'WhatsApp Job Alert Community',
          platform: 'WhatsApp',
          type: 'community',
          isAnchor: false,
          primaryLanguage: 'Bangla + English (Banglish / Spoken)',
          handle: 'Grow Bangla Career Alerts',
          url: 'https://chat.whatsapp.com/growbangla',
          defaultContentType: 'Text-only',
          targetCadencePerWeek: 7,
          audienceCount: 1200,
          audienceLabel: '1,200 Active Members',
          analyticsKnowledgeBase: {
            source: 'Community Metrics Snapshot',
            lastUpdated: new Date().toISOString(),
            totalVideosIndexed: 0,
            totalViews: 0,
            memberCount: 1200,
            primaryLanguage: 'Bangla + English (Banglish / Spoken)',
            topCategories: ['Daily Job Circulars', 'Interview Question of the Day', 'PDF Resource Drops'],
            recommendations: ['Morning 9:00 AM job drops receive 85%+ open and click rates.']
          },
          calendars: {}
        },
        {
          id: 'gb-tiktok',
          slug: 'tiktok',
          name: 'TikTok Channel',
          platform: 'TikTok',
          type: 'video',
          isAnchor: false,
          primaryLanguage: 'Bangla + English (Banglish / Spoken)',
          handle: '@growbangla',
          url: 'https://tiktok.com/@growbangla',
          defaultContentType: 'Short-form Video',
          targetCadencePerWeek: 7,
          audienceCount: 2400,
          audienceLabel: '2.4K Followers',
          analyticsKnowledgeBase: null,
          calendars: {}
        },
        {
          id: 'gb-linkedin',
          slug: 'linkedin',
          name: 'LinkedIn Page',
          platform: 'LinkedIn',
          type: 'social',
          isAnchor: false,
          primaryLanguage: 'English (Professional / B2B)',
          handle: 'company/growbangla',
          url: 'https://linkedin.com/company/growbangla',
          defaultContentType: 'PDF / Document',
          targetCadencePerWeek: 3,
          audienceCount: 1800,
          audienceLabel: '1.8K Followers',
          analyticsKnowledgeBase: null,
          calendars: {}
        }
      ]
    },
    {
      id: 'brand-pilutics',
      slug: 'pilutics',
      name: 'PILUTICS',
      primaryLanguage: 'Bangla / Bengali (Documentary & Analysis)',
      tagline: 'Geopolitics, Country Analysis, Travel Intel & National Strategy',
      niche: 'Geopolitical Documentaries, Country Comparisons, Economic Analysis',
      palette: ['#059669', '#10b981', '#34d399', '#1e293b', '#0f172a'],
      fonts: 'Outfit + Bangla',
      tone: 'Analytical, authoritative, investigative, storytelling, high-retention',
      mission: 'Unpacking global geopolitics, economic corridors, and strategic foreign policy through documentary-grade Bengali videos.',
      standardHashtags: '#PILUTICS #Geopolitics #Bangladesh #WorldAffairs #EconomyAnalysis',
      standardCta: 'Subscribe to PILUTICS for weekly deep-dive geopolitical documentaries! Link in bio.',
      logoUrl: '',
      assets: [],
      channels: [
        {
          id: 'pilutics-youtube',
          slug: 'youtube',
          name: 'YouTube Channel',
          platform: 'YouTube',
          type: 'video',
          isAnchor: true,
          primaryLanguage: 'Bangla / Bengali (Documentary & Analysis)',
          handle: '@PILUTICS',
          url: 'https://youtube.com/@PILUTICS',
          defaultContentType: 'Long-form Video',
          targetCadencePerWeek: 9,
          audienceCount: 620,
          audienceLabel: '18.4K Views · 620 Subscribers',
          analyticsKnowledgeBase: {
            source: 'YouTube Studio Lifetime Export',
            lastUpdated: new Date().toISOString(),
            totalVideosIndexed: 28,
            totalViews: 18400,
            totalWatchTimeHours: 920.5,
            totalSubscribers: 620,
            impressions: 140000,
            avgCtr: 6.4,
            avgViewDuration: '4:10',
            bestPostingDays: ['Sunday 19:00', 'Wednesday 20:00'],
            primaryLanguage: 'Bangla / Bengali (Documentary & Analysis)',
            topPerformers: [
              { rank: 1, title: 'Why Bangladesh Matters in the Bay of Bengal Geopolitics', views: 8200, watchHours: 410, subs: 290, ctr: 7.8, format: 'Long-form' },
              { rank: 2, title: 'India-China Tug of War in South Asia Explained', views: 5100, watchHours: 255, subs: 170, ctr: 6.5, format: 'Long-form' }
            ],
            topCategories: ['Geopolitical Documentaries', 'Country Intelligence', 'Defense & Foreign Policy'],
            recommendations: ['Long-form maps & animated motion graphics achieve over 55% viewer retention past 4 minutes.']
          },
          calendars: {}
        },
        {
          id: 'pilutics-facebook',
          slug: 'facebook',
          name: 'Facebook Page',
          platform: 'Facebook',
          type: 'social',
          isAnchor: false,
          primaryLanguage: 'Bangla / Bengali (Documentary & Analysis)',
          handle: 'PILUTICS Official',
          url: 'https://facebook.com/pilutics',
          defaultContentType: 'Short-form Video',
          targetCadencePerWeek: 4,
          audienceCount: 3800,
          audienceLabel: '3.8K Followers',
          analyticsKnowledgeBase: null,
          calendars: {}
        }
      ]
    },
    {
      id: 'brand-bong-hits',
      slug: 'bong-hits',
      name: 'Bong Hits',
      primaryLanguage: 'Bengali (Music, Skits & Pop Culture)',
      tagline: 'Pure Bengali Entertainment, Skits, Music & Youth Pop Culture',
      niche: 'Viral Skits, Bengali Music Videos, Pop Culture, Relatable Humor',
      palette: ['#ec4899', '#db2777', '#9d174d', '#18181b', '#fafafa'],
      fonts: 'Montserrat + Bangla',
      tone: 'High-energy, witty, rhythmic, viral, culturally relatable',
      mission: 'Creating electrifying Bengali music, viral comedy skits, and youth pop culture moments.',
      standardHashtags: '#BongHits #BengaliMusic #ViralSkits #BengaliComedy #BengaliBeats',
      standardCta: 'Stream Bong Hits music on all platforms and subscribe for weekly drops!',
      logoUrl: '',
      assets: [],
      channels: [
        {
          id: 'bh-youtube',
          slug: 'youtube',
          name: 'YouTube Channel',
          platform: 'YouTube',
          type: 'video',
          isAnchor: true,
          primaryLanguage: 'Bengali (Music, Skits & Pop Culture)',
          handle: '@BongHitsOfficial',
          url: 'https://youtube.com/@BongHitsOfficial',
          defaultContentType: 'Music Video',
          targetCadencePerWeek: 9,
          audienceCount: 1200,
          audienceLabel: '45K Views · 1.2K Subscribers',
          analyticsKnowledgeBase: {
            source: 'YouTube Studio Lifetime Export',
            lastUpdated: new Date().toISOString(),
            totalVideosIndexed: 35,
            totalViews: 45000,
            impressions: 280000,
            avgCtr: 7.2,
            avgViewDuration: '1:45',
            bestPostingDays: ['Thursday 18:00', 'Friday 20:00'],
            primaryLanguage: 'Bengali (Music, Skits & Pop Culture)',
            topCategories: ['Bengali Rock & Folk Fusion', 'Relatable College Skits', 'Behind The Mic'],
            recommendations: ['Music video teaser drops 48 hours prior to full song increase premiere attendance by 3.2x.']
          },
          calendars: {}
        },
        {
          id: 'bh-tiktok',
          slug: 'tiktok',
          name: 'TikTok Channel',
          platform: 'TikTok',
          type: 'video',
          isAnchor: false,
          primaryLanguage: 'Bengali (Music, Skits & Pop Culture)',
          handle: '@bonghits_viral',
          url: 'https://tiktok.com/@bonghits_viral',
          defaultContentType: 'Short-form Video',
          targetCadencePerWeek: 7,
          audienceCount: 8500,
          audienceLabel: '8.5K Followers',
          analyticsKnowledgeBase: null,
          calendars: {}
        }
      ]
    },
    {
      id: 'brand-gro10x',
      slug: 'gro10x',
      name: 'GRO10X Brand',
      primaryLanguage: 'English (Global B2B & Tech)',
      tagline: 'PurpleOS Agency & Digital Operating Systems at Global Scale',
      niche: 'AI Automation, SaaS Infrastructure, Agency Systems, DigiVault Digital Commerce',
      palette: ['#a855f7', '#6366f1', '#3b82f6', '#0f172a', '#ffffff'],
      fonts: 'Plus Jakarta Sans',
      tone: 'Executive, visionary, authoritative, metrics-driven, crisp B2B',
      mission: 'Engineering enterprise AI operating systems, multi-channel commerce engines, and scalable automation pipelines.',
      standardHashtags: '#GRO10X #PurpleOS #Automation #DigitalEmpire #B2BGrowth',
      standardCta: 'Visit gro10x.ai to scale your agency and digital product operations.',
      logoUrl: '',
      assets: [],
      channels: [
        {
          id: 'gro10x-youtube',
          slug: 'youtube',
          name: 'YouTube Channel',
          platform: 'YouTube',
          type: 'video',
          isAnchor: true,
          primaryLanguage: 'English (Global B2B & Tech)',
          handle: '@GRO10X',
          url: 'https://youtube.com/@GRO10X',
          defaultContentType: 'Long-form Video',
          targetCadencePerWeek: 9,
          audienceCount: 3400,
          audienceLabel: '3.4K Subscribers',
          analyticsKnowledgeBase: {
            source: 'YouTube Studio Global',
            lastUpdated: new Date().toISOString(),
            totalVideosIndexed: 20,
            totalViews: 32000,
            impressions: 190000,
            avgCtr: 5.8,
            avgViewDuration: '3:50',
            bestPostingDays: ['Tuesday 17:00', 'Thursday 18:00'],
            primaryLanguage: 'English (Global B2B & Tech)',
            topCategories: ['Agency Operating Systems', 'AI Automation Workflows', 'DigiVault Case Studies'],
            recommendations: ['Executive slide decks and code walkthroughs convert high-ticket B2B consulting leads.']
          },
          calendars: {}
        },
        {
          id: 'gro10x-linkedin',
          slug: 'linkedin',
          name: 'LinkedIn Official',
          platform: 'LinkedIn',
          type: 'social',
          isAnchor: false,
          primaryLanguage: 'English (Global B2B & Tech)',
          handle: 'company/gro10x',
          url: 'https://linkedin.com/company/gro10x',
          defaultContentType: 'PDF / Document',
          targetCadencePerWeek: 4,
          audienceCount: 4200,
          audienceLabel: '4.2K Followers',
          analyticsKnowledgeBase: null,
          calendars: {}
        }
      ]
    }
  ]
};

function loadState() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, 'utf8');
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.brands) && parsed.brands.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('[SocialBrands] Failed to read state file, fallback to SEED_DATA:', e.message);
  }
  return JSON.parse(JSON.stringify(SEED_DATA));
}

function saveState(state) {
  try {
    const dir = path.dirname(DATA_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(DATA_FILE, JSON.stringify(state || loadState(), null, 2), 'utf8');
  } catch (e) {
    console.error('[SocialBrands] Save state error:', e.message);
  }
}

// 1. GET ALL BRANDS
router.get('/', requireAuth, (req, res) => {
  const state = loadState();
  res.json({ success: true, brands: state.brands || [] });
});

// 2. GET SINGLE BRAND DETAILS
router.get('/:brandSlug', requireAuth, (req, res) => {
  const state = loadState();
  const brand = (state.brands || []).find(b => b.slug === req.params.brandSlug || b.id === req.params.brandSlug);

  if (!brand) {
    return res.status(404).json({ success: false, error: 'Brand not found' });
  }

  res.json({ success: true, brand });
});

// 3. CREATE / UPDATE BRAND PROFILE
router.post('/', requireAuth, (req, res) => {
  const current = loadState();
  const { name, tagline, niche, palette, fonts, tone, mission, standardHashtags, standardCta, primaryLanguage } = req.body;

  if (!name) return res.status(400).json({ success: false, error: 'Brand name is required' });

  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  const existing = (current.brands || []).find(b => b.slug === slug);
  if (existing) {
    return res.status(400).json({ success: false, error: 'A brand with this name/slug already exists' });
  }

  const newBrand = {
    id: 'brand-' + slug + '-' + Date.now(),
    slug,
    name,
    primaryLanguage: primaryLanguage || 'Bangla + English (Banglish / Spoken)',
    tagline: tagline || '',
    niche: niche || '',
    palette: palette || ['#a855f7', '#6366f1', '#1e293b', '#0f172a', '#ffffff'],
    fonts: fonts || 'Plus Jakarta Sans + Inter',
    tone: tone || 'Professional, informative, aspirational',
    mission: mission || '',
    standardHashtags: standardHashtags || ('#' + name.replace(/\s+/g, '')),
    standardCta: standardCta || '',
    logoUrl: '',
    assets: [],
    channels: [
      {
        id: slug + '-youtube',
        slug: 'youtube',
        name: 'YouTube Channel',
        platform: 'YouTube',
        type: 'video',
        isAnchor: true,
        primaryLanguage: primaryLanguage || 'Bangla + English (Banglish / Spoken)',
        handle: '@' + slug,
        url: '',
        defaultContentType: 'Short-form Video',
        targetCadencePerWeek: 9,
        audienceCount: 0,
        audienceLabel: '0 Subscribers',
        analyticsKnowledgeBase: null,
        calendars: {}
      }
    ]
  };

  current.brands.push(newBrand);
  saveState(current);
  res.status(201).json({ success: true, brand: newBrand });
});

router.put('/:brandSlug', requireAuth, (req, res) => {
  const current = loadState();
  const brand = (current.brands || []).find(b => b.slug === req.params.brandSlug || b.id === req.params.brandSlug);

  if (!brand) {
    return res.status(404).json({ success: false, error: 'Brand not found' });
  }

  const { name, tagline, niche, palette, fonts, tone, mission, standardHashtags, standardCta, logoUrl, assets, primaryLanguage } = req.body;

  if (name !== undefined) brand.name = name;
  if (primaryLanguage !== undefined) brand.primaryLanguage = primaryLanguage;
  if (tagline !== undefined) brand.tagline = tagline;
  if (niche !== undefined) brand.niche = niche;
  if (palette !== undefined) brand.palette = palette;
  if (fonts !== undefined) brand.fonts = fonts;
  if (tone !== undefined) brand.tone = tone;
  if (mission !== undefined) brand.mission = mission;
  if (standardHashtags !== undefined) brand.standardHashtags = standardHashtags;
  if (standardCta !== undefined) brand.standardCta = standardCta;
  if (logoUrl !== undefined) brand.logoUrl = logoUrl;
  if (assets !== undefined) brand.assets = assets;

  saveState(current);
  res.json({ success: true, brand });
});

// 4. ADD / EDIT CHANNEL
router.post('/:brandSlug/channels', requireAuth, (req, res) => {
  const current = loadState();
  const brand = (current.brands || []).find(b => b.slug === req.params.brandSlug || b.id === req.params.brandSlug);
  if (!brand) return res.status(404).json({ success: false, error: 'Brand not found' });

  const { name, platform, handle, url, defaultContentType, targetCadencePerWeek, isAnchor, primaryLanguage } = req.body;
  if (!name || !platform) return res.status(400).json({ success: false, error: 'Channel name and platform required' });

  const channelSlug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  const channelId = brand.slug + '-' + channelSlug + '-' + Date.now();

  const isVideoPlat = platform === 'YouTube' || platform === 'TikTok';
  const defaultCadence = platform === 'YouTube' ? 9 : (Number(targetCadencePerWeek) || 3);

  const newChannel = {
    id: channelId,
    slug: channelSlug,
    name,
    platform,
    type: isVideoPlat ? 'video' : (platform === 'WhatsApp' || platform === 'Telegram' || platform === 'Discord' ? 'community' : 'social'),
    isAnchor: Boolean(isAnchor),
    primaryLanguage: primaryLanguage || brand.primaryLanguage || 'Bangla + English (Banglish / Spoken)',
    handle: handle || ('@' + channelSlug),
    url: url || '',
    defaultContentType: defaultContentType || (isVideoPlat ? 'Short-form Video' : (platform === 'LinkedIn' ? 'PDF / Document' : 'Static Graphic / Image')),
    targetCadencePerWeek: defaultCadence,
    audienceCount: 0,
    audienceLabel: '0 Audience',
    analyticsKnowledgeBase: null,
    calendars: {}
  };

  brand.channels = brand.channels || [];
  brand.channels.push(newChannel);
  saveState(current);

  res.status(201).json({ success: true, channel: newChannel, brand });
});

router.put('/:brandSlug/channels/:channelId', requireAuth, (req, res) => {
  const current = loadState();
  const brand = (current.brands || []).find(b => b.slug === req.params.brandSlug || b.id === req.params.brandSlug);
  if (!brand) return res.status(404).json({ success: false, error: 'Brand not found' });

  const channel = (brand.channels || []).find(c => c.id === req.params.channelId || c.slug === req.params.channelId);
  if (!channel) return res.status(404).json({ success: false, error: 'Channel not found' });

  const { name, handle, url, defaultContentType, targetCadencePerWeek, isAnchor, audienceCount, audienceLabel, primaryLanguage } = req.body;

  if (name !== undefined) channel.name = name;
  if (primaryLanguage !== undefined) channel.primaryLanguage = primaryLanguage;
  if (handle !== undefined) channel.handle = handle;
  if (url !== undefined) channel.url = url;
  if (defaultContentType !== undefined) channel.defaultContentType = defaultContentType;
  if (targetCadencePerWeek !== undefined) channel.targetCadencePerWeek = Number(targetCadencePerWeek);
  if (isAnchor !== undefined) channel.isAnchor = Boolean(isAnchor);
  if (audienceCount !== undefined) channel.audienceCount = Number(audienceCount);
  if (audienceLabel !== undefined) channel.audienceLabel = audienceLabel;

  saveState(current);
  res.json({ success: true, channel, brand });
});

// 5. INGEST / UPDATE CHANNEL ANALYTICS
router.post('/:brandSlug/channels/:channelId/analytics', requireAuth, upload.single('csvFile'), async (req, res) => {
  const current = loadState();
  const brand = (current.brands || []).find(b => b.slug === req.params.brandSlug || b.id === req.params.brandSlug);
  if (!brand) return res.status(404).json({ success: false, error: 'Brand not found' });

  const channel = (brand.channels || []).find(c => c.id === req.params.channelId || c.slug === req.params.channelId);
  if (!channel) return res.status(404).json({ success: false, error: 'Channel not found' });

  const { snapshotSource, memberCount, topTopics, notes, csvText: bodyCsvText } = req.body;

  let csvContent = '';
  if (req.file) {
    csvContent = req.file.buffer.toString('utf8');
  } else if (bodyCsvText) {
    csvContent = bodyCsvText;
  }

  // Case A: CSV Ingestion
  if (csvContent && csvContent.trim().length > 0) {
    try {
      const lines = csvContent.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
      let parsedVideos = [];
      let totalViews = 0;
      let totalWatchHours = 0;
      let totalSubs = 0;
      let totalCtrSum = 0;
      let validCtrCount = 0;
      let totalImpressions = 0;
      let banglaCharCount = 0;

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        if (line.startsWith('Total')) continue;

        const match = line.match(/(?:^|,)("(?:[^"]|"")*"|[^,]*)/g);
        if (!match) continue;
        const cols = match.map(c => c.replace(/^,/, '').replace(/^"|"$/g, '').trim());

        const title = cols[1] || cols[0];
        const views = Number(cols[4]) || Number(cols[1]) || 0;
        const watchHours = Number(cols[5]) || 0;
        const subs = Number(cols[6]) || 0;
        const impressions = Number(cols[7]) || 0;
        const ctr = Number(cols[8]) || Number(cols[cols.length - 1]) || 0;

        if (title && title.length > 2 && views >= 0) {
          if (/[\u0980-\u09FF]/.test(title)) banglaCharCount++;
          const isShort = title.toLowerCase().includes('#shorts') || title.toLowerCase().includes('shorts');

          parsedVideos.push({
            title,
            views,
            watchHours,
            subs,
            ctr,
            impressions,
            format: isShort ? 'Short' : 'Long-form',
            avgDuration: isShort ? '0:35' : '3:10'
          });

          totalViews += views;
          totalWatchHours += watchHours;
          totalSubs += subs;
          totalImpressions += impressions;
          if (ctr > 0) { totalCtrSum += ctr; validCtrCount++; }
        }
      }

      parsedVideos.sort((a, b) => b.views - a.views);
      const topPerformers = parsedVideos.slice(0, 8).map((p, idx) => ({ rank: idx + 1, ...p }));
      const avgCtr = validCtrCount > 0 ? Number((totalCtrSum / validCtrCount).toFixed(2)) : 5.18;

      const topTitles = topPerformers.map(p => p.title).join(' ');
      const categories = [];
      if (/english|spoken|interview|pronunciation/i.test(topTitles)) categories.push('Spoken English & Interview Guides');
      if (/job|recruitment|circular|hsc|ssc/i.test(topTitles)) categories.push('Verified Job Circulars & Career Tracks');
      if (/loan|salary|wealth|money|finance/i.test(topTitles)) categories.push('Salary & Financial Growth Hacks');
      if (/visa|travel|immigrat|country/i.test(topTitles)) categories.push('International Visa & Immigration Roadmaps');
      if (/music|song|beat|lyrics/i.test(topTitles)) categories.push('Original Bengali Music & Beats');
      if (/skit|comedy|humor|viral/i.test(topTitles)) categories.push('Relatable Bengali Comedy Skits');
      if (/ai|automation|b2b|business/i.test(topTitles)) categories.push('AI Operating Systems & Agency Frameworks');
      if (categories.length === 0) categories.push('Core Educational Pillars', 'High-Retention Discovery Shorts');

      const detectedLang = banglaCharCount > 2 ? 'Bangla + English (Banglish / Spoken)' : (brand.primaryLanguage || 'English (Global)');
      channel.primaryLanguage = detectedLang;

      const recommendations = [
        topPerformers[0] ? 'Format anchored around "' + topPerformers[0].title.slice(0, 50) + '..." delivered top velocity (' + topPerformers[0].views.toLocaleString() + ' views).' : 'Prioritize high-engagement video tutorials.',
        'Average CTR across channel is ' + avgCtr + '% — optimize thumbnail contrast and bold benefit text.',
        'Fixed YouTube Production Rule: 2 Weekly Long-form Pillar Deep Dives (Friday & Tuesday) + 1 Daily Short for high discovery.'
      ];

      channel.analyticsKnowledgeBase = {
        source: req.file ? req.file.originalname : 'CSV Analytics Report',
        lastUpdated: new Date().toISOString(),
        totalVideosIndexed: parsedVideos.length || lines.length - 1,
        totalViews: totalViews || channel.analyticsKnowledgeBase?.totalViews || 28612,
        totalWatchTimeHours: Number(totalWatchHours.toFixed(1)) || 1144.9,
        totalSubscribers: totalSubs || channel.audienceCount || 427,
        impressions: totalImpressions || 201198,
        avgCtr,
        avgViewDuration: '2:45',
        bestPostingDays: ['Friday 18:00', 'Tuesday 19:00', 'Monday 20:00'],
        primaryLanguage: detectedLang,
        topPerformers,
        topCategories: categories,
        recommendations
      };

      channel.audienceCount = totalSubs || channel.audienceCount || 427;
      channel.audienceLabel = (totalViews || 28612).toLocaleString() + ' Views · ' + channel.audienceCount + ' Subscribers';

      saveState(current);

      return res.json({
        success: true,
        type: 'csv',
        insights: channel.analyticsKnowledgeBase,
        knowledgeBase: channel.analyticsKnowledgeBase,
        channel,
        brand
      });
    } catch (err) {
      console.error('[Analytics Ingestion] CSV parse error:', err);
      return res.status(500).json({ success: false, error: 'Failed to parse CSV: ' + err.message });
    }
  }

  // Case B: Community Snapshot
  if (memberCount !== undefined || topTopics !== undefined) {
    const topicsArr = Array.isArray(topTopics) ? topTopics : (typeof topTopics === 'string' ? topTopics.split(',').map(s => s.trim()).filter(Boolean) : []);
    const count = Number(memberCount) || channel.audienceCount || 100;

    channel.audienceCount = count;
    channel.audienceLabel = count.toLocaleString() + ' Active Members';
    channel.analyticsKnowledgeBase = {
      source: snapshotSource || 'Community Metrics Snapshot',
      lastUpdated: new Date().toISOString(),
      totalVideosIndexed: 0,
      totalViews: 0,
      memberCount: count,
      primaryLanguage: channel.primaryLanguage || brand.primaryLanguage || 'Bangla + English (Banglish / Spoken)',
      topCategories: topicsArr.length > 0 ? topicsArr : ['Direct Resource Drops', 'Daily Actionable Q&A', 'Exclusive Priority Announcements'],
      recommendations: [
        notes || 'Maintain consistent daily morning drops to sustain high read rate and active member responses.',
        'Include direct actionable links and clean bullet formatting for mobile reading.'
      ]
    };

    saveState(current);
    return res.json({
      success: true,
      type: 'community_snapshot',
      insights: channel.analyticsKnowledgeBase,
      knowledgeBase: channel.analyticsKnowledgeBase,
      channel,
      brand
    });
  }

  return res.status(400).json({ success: false, error: 'No CSV file or snapshot metrics provided' });
});

// 6. GENERATE MONTHLY CONTENT CALENDAR (Fixed YouTube Dual-Tier Cadence)
router.post('/:brandSlug/channels/:channelId/generate-calendar', requireAuth, async (req, res) => {
  const current = loadState();
  const brand = (current.brands || []).find(b => b.slug === req.params.brandSlug || b.id === req.params.brandSlug);
  if (!brand) return res.status(404).json({ success: false, error: 'Brand not found' });

  const channel = (brand.channels || []).find(c => c.id === req.params.channelId || c.slug === req.params.channelId);
  if (!channel) return res.status(404).json({ success: false, error: 'Channel not found' });

  const { month, year, alignAnchor, focusNote } = req.body;
  const targetMonth = month || new Date().toLocaleString('default', { month: 'long' });
  const targetYear = Number(year) || new Date().getFullYear();

  let anchorChannel = null;
  if (alignAnchor) {
    anchorChannel = (brand.channels || []).find(c => c.isAnchor && c.id !== channel.id);
  }

  try {
    const kb = channel.analyticsKnowledgeBase;
    const isYouTube = channel.platform === 'YouTube' || channel.type === 'video';
    const lang = channel.primaryLanguage || brand.primaryLanguage || 'Bangla + English (Banglish / Spoken)';

    const systemPrompt = 'You are the Executive Chief Content Strategist for ' + brand.name + ' (' + brand.niche + ').\n' +
'Create an executive production blueprint for "' + channel.name + '" on ' + channel.platform + ' for ' + targetMonth + ' ' + targetYear + '.\n\n' +
'Brand Identity & Production Specs:\n' +
'- Primary Script & Delivery Language: "' + lang + '"\n' +
'- Brand Mission: ' + (brand.mission || brand.tagline) + '\n' +
'- Tone of Voice: ' + brand.tone + '\n' +
'- Channel Format Type: ' + channel.defaultContentType + '\n' +
(isYouTube ? 
'CRITICAL YOUTUBE PRODUCTION STANDARD (MANDATORY RULE):\n' +
'- Every single day of the month has exactly ONE Short-form video (30-60s).\n' +
'- Every single week has exactly TWO Long-form Pillar Deep Dives (5-10 min, on the channel top velocity days, e.g. Friday and Tuesday).\n' +
'- Generate a full schedule containing both Daily Shorts and 2 Weekly Long-form tutorials.\n' : 
'- Target Cadence: ' + channel.targetCadencePerWeek + ' posts per week.\n') +
(kb ? '\nProven Audience Retention & Analytics:\n' +
'- Total Indexed Views: ' + (kb.totalViews?.toLocaleString() || 0) + '\n' +
'- Top Performing Formats: ' + (kb.topCategories || []).join(', ') + '\n' +
'- Top Videos: ' + (kb.topPerformers || []).slice(0, 4).map(p => '"' + p.title + '" (' + p.views + ' views, ' + p.subs + ' subs)').join('; ') + '\n' +
'- Peak Release Windows: ' + (kb.bestPostingDays || ['Friday 18:00', 'Tuesday 19:00']).join(', ') : '') +
(focusNote ? '\nSpecial Monthly Campaign Focus: "' + focusNote + '"' : '') +
'\n\nCRITICAL RULES:\n' +
'1. "strategicSummary": Deep strategic rationale explaining the month core thesis in relation to ' + lang + '.\n' +
'2. "plan": An array of structured items where each item contains: week, dayOfWeek, topicIdea, hook, contentType, targetDuration, strategicRationale, suggestedTime.\n\n' +
'Format response strictly as valid JSON with keys: strategicSummary, theme, plan.';

    let parsed = null;
    try {
      if (aiRoutes.callGeminiPrompt) {
        const rawResponse = await aiRoutes.callGeminiPrompt(systemPrompt, { json: true, maxTokens: 4000 });
        if (rawResponse) {
          parsed = aiRoutes.cleanJSONText ? aiRoutes.cleanJSONText(rawResponse) : null;
          if (!parsed) try { parsed = JSON.parse(rawResponse); } catch(e) {}
        }
      }
    } catch(e) {
      console.warn('[Calendar AI call notice]:', e.message);
    }

    const monthIndex = new Date(targetMonth + ' 1, ' + targetYear).getMonth();
    const monthKey = targetYear + '-' + String(monthIndex + 1).padStart(2, '0');
    
    let generatedCalendar = null;
    if (parsed && Array.isArray(parsed.plan) && parsed.plan.length >= (isYouTube ? 20 : 8)) {
      const planItems = parsed.plan.map((item, idx) => {
        const weekNum = parseInt((item.week || 'Week 1').replace(/[^0-9]/g, '')) || 1;
        const dayOffset = (weekNum - 1) * 7 + (idx % 7) + 1;
        const dateStr = targetYear + '-' + String(monthIndex + 1).padStart(2, '0') + '-' + String(Math.min(28, dayOffset)).padStart(2, '0');

        return {
          id: 'plan-' + brand.slug + '-' + channel.slug + '-' + targetMonth + '-' + (idx + 1),
          week: item.week || ('Week ' + weekNum),
          dayOfWeek: item.dayOfWeek || 'Mon',
          scheduledDate: dateStr,
          suggestedTime: item.suggestedTime || '18:00',
          topicIdea: item.topicIdea || item.title || (brand.name + ' ' + targetMonth + ' Pillar #' + (idx + 1)),
          hook: item.hook || '',
          contentType: item.contentType || channel.defaultContentType || 'Short-form Video',
          targetDuration: item.targetDuration || (item.contentType === 'Long-form Video' ? '8 min' : '60s'),
          strategicRationale: item.strategicRationale || item.reasoning || ('Proven audience signal from ' + brand.name + ' top performing benchmarks.'),
          channel: brand.name,
          channelSlug: channel.slug,
          platform: channel.platform,
          primaryLanguage: lang
        };
      });

      generatedCalendar = {
        monthKey,
        month: targetMonth,
        year: targetYear,
        status: 'Draft',
        primaryLanguage: lang,
        strategicSummary: parsed.strategicSummary || ('4-Week Dual-Tier YouTube Growth Strategy for ' + brand.name + ' (' + channel.name + ') in ' + lang + '.'),
        theme: parsed.theme || focusNote || (targetMonth + ' Audience Velocity Blueprint'),
        generatedAt: new Date().toISOString(),
        planItems
      };
    } else {
      generatedCalendar = generateDeterministicCalendar(brand, channel, targetMonth, targetYear, focusNote, kb);
    }

    channel.calendars = channel.calendars || {};
    channel.calendars[monthKey] = generatedCalendar;
    saveState(current);

    res.json({
      success: true,
      calendar: generatedCalendar,
      channel,
      brand
    });
  } catch (err) {
    console.error('[Calendar Gen] Error:', err);
    const fallback = generateDeterministicCalendar(brand, channel, targetMonth, targetYear, focusNote, channel.analyticsKnowledgeBase);
    const monthIndex = new Date(targetMonth + ' 1, ' + targetYear).getMonth();
    const monthKey = targetYear + '-' + String(monthIndex + 1).padStart(2, '0');
    
    channel.calendars = channel.calendars || {};
    channel.calendars[monthKey] = fallback;
    saveState(current);

    res.json({
      success: true,
      calendar: fallback,
      channel,
      brand,
      notice: 'Fallback strategy generated: ' + err.message
    });
  }
});

// Deterministic Calendar Engine supporting Dual-Tier YouTube Cadence
function generateDeterministicCalendar(brand, channel, month, year, focusNote, kb) {
  const isYouTube = channel.platform === 'YouTube' || channel.type === 'video';
  const monthIndex = new Date(month + ' 1, ' + year).getMonth();
  const monthKey = year + '-' + String(monthIndex + 1).padStart(2, '0');
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const lang = channel.primaryLanguage || brand.primaryLanguage || 'Bangla + English (Banglish / Spoken)';

  const topTopics = kb?.topPerformers?.map(p => p.title) || [
    'Job Interview Spoken English Mastery: Common Questions & Real Answers',
    'Top 5 Mistakes Bangladeshi Freshers Make in Corporate & Bank Interviews',
    'How to Negotiate Salary, Promotions & Corporate Career Growth',
    'International Job Placement, Visa & Work Permit Step-by-Step Roadmap',
    'Corporate Email Writing & Spoken Communication Hacks'
  ];

  const planItems = [];

  if (isYouTube) {
    // 1. Daily Shorts (Days 1 to 28)
    for (let day = 1; day <= Math.min(28, daysInMonth); day++) {
      const weekNum = Math.ceil(day / 7);
      const dateStr = year + '-' + String(monthIndex + 1).padStart(2, '0') + '-' + String(day).padStart(2, '0');
      const dayOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][(day + monthIndex) % 7];
      const baseTopic = topTopics[(day - 1) % topTopics.length];

      planItems.push({
        id: 'plan-' + brand.slug + '-' + channel.slug + '-' + month + '-short-' + day,
        week: 'Week ' + weekNum,
        dayOfWeek,
        scheduledDate: dateStr,
        suggestedTime: '18:00',
        topicIdea: '[Short] ' + baseTopic.slice(0, 42) + ' #shorts',
        hook: 'Bangladeshi job seekers, stop making this one spoken English mistake! Here is the fix in 30 seconds.',
        contentType: 'Short-form Video',
        targetDuration: '60s',
        strategicRationale: 'Daily shorts maximize algorithmic discovery and viewer impressions in ' + lang + '.',
        channel: brand.name,
        channelSlug: channel.slug,
        platform: channel.platform,
        primaryLanguage: lang,
        formatTag: '🎬 Daily Short'
      });
    }

    // 2. 2 Weekly Long-form Pillar Deep Dives (Friday & Tuesday)
    const longFormDays = ['Fri', 'Tue'];
    let longFormCount = 1;
    for (let week = 1; week <= 4; week++) {
      for (const dayName of longFormDays) {
        const dayOffset = (week - 1) * 7 + (dayName === 'Fri' ? 6 : 3);
        const dateStr = year + '-' + String(monthIndex + 1).padStart(2, '0') + '-' + String(Math.min(28, dayOffset)).padStart(2, '0');
        const topic = topTopics[(longFormCount - 1) % topTopics.length];

        planItems.push({
          id: 'plan-' + brand.slug + '-' + channel.slug + '-' + month + '-long-' + longFormCount,
          week: 'Week ' + week,
          dayOfWeek: dayName,
          scheduledDate: dateStr,
          suggestedTime: '19:00',
          topicIdea: '[Full Class] ' + topic + ' (Complete Practical Breakdown)',
          hook: 'Master this complete framework today to ace any corporate interview or salary negotiation with confidence.',
          contentType: 'Long-form Video',
          targetDuration: '8-10 min',
          strategicRationale: 'Long-form pillar videos on peak velocity days (' + dayName + ') generate 60%+ of channel watch hours and high-intent subscriber conversions.',
          channel: brand.name,
          channelSlug: channel.slug,
          platform: channel.platform,
          primaryLanguage: lang,
          formatTag: '📹 Long-form Deep Dive'
        });
        longFormCount++;
      }
    }
  } else {
    const count = (channel.targetCadencePerWeek || 3) * 4;
    for (let i = 0; i < count; i++) {
      const weekNum = Math.floor(i / (channel.targetCadencePerWeek || 3)) + 1;
      const dayOffset = (weekNum - 1) * 7 + (i % 7) + 1;
      const dateStr = year + '-' + String(monthIndex + 1).padStart(2, '0') + '-' + String(Math.min(28, dayOffset)).padStart(2, '0');
      const baseTopic = topTopics[i % topTopics.length];

      planItems.push({
        id: 'plan-' + brand.slug + '-' + channel.slug + '-' + month + '-' + (i + 1),
        week: 'Week ' + weekNum,
        dayOfWeek: ['Mon', 'Wed', 'Fri', 'Sat'][i % 4],
        scheduledDate: dateStr,
        suggestedTime: '18:00',
        topicIdea: baseTopic + ' — Part ' + (Math.floor(i / 2) + 1),
        hook: 'Essential ' + brand.name + ' insight for ' + month + '. Actionable breakdown for ambitious professionals.',
        contentType: channel.defaultContentType || 'Short-form Video',
        targetDuration: channel.type === 'video' ? '60s' : 'N/A',
        strategicRationale: 'Directly leverages proven watch time retention from "' + baseTopic.slice(0, 45) + '...".',
        channel: brand.name,
        channelSlug: channel.slug,
        platform: channel.platform,
        primaryLanguage: lang,
        formatTag: channel.defaultContentType
      });
    }
  }

  planItems.sort((a, b) => (a.scheduledDate || '').localeCompare(b.scheduledDate || ''));

  return {
    monthKey,
    month,
    year,
    status: 'Draft',
    primaryLanguage: lang,
    strategicSummary: isYouTube 
      ? 'Fixed Production Blueprint for ' + brand.name + ' (' + channel.name + '): 28 Daily Shorts (Mon-Sun) + 8 Long-form Pillar Deep Dives (Friday & Tuesday) in ' + lang + '.'
      : 'Targeted 4-week calendar for ' + brand.name + ' (' + channel.name + ') grounded in top lifetime audience conversion formats in ' + lang + '.',
    theme: focusNote || (month + ' High-Velocity Authority Blueprint'),
    generatedAt: new Date().toISOString(),
    planItems
  };
}

// 7. LOCK MONTHLY CONTENT CALENDAR & PUSH TO KANBAN PIPELINE
router.post('/:brandSlug/channels/:channelId/calendars/:monthKey/lock', requireAuth, async (req, res) => {
  const current = loadState();
  const brand = (current.brands || []).find(b => b.slug === req.params.brandSlug || b.id === req.params.brandSlug);
  if (!brand) return res.status(404).json({ success: false, error: 'Brand not found' });

  const channel = (brand.channels || []).find(c => c.id === req.params.channelId || c.slug === req.params.channelId);
  if (!channel) return res.status(404).json({ success: false, error: 'Channel not found' });

  const monthKey = req.params.monthKey;
  const calendar = channel.calendars && channel.calendars[monthKey];

  if (!calendar) {
    return res.status(404).json({ success: false, error: 'No calendar plan found for this month' });
  }

  calendar.status = 'Locked';
  calendar.lockedAt = new Date().toISOString();
  calendar.lockedBy = req.user?.name || 'Firoz (Super Admin)';

  try {
    const postsToInsert = (calendar.planItems || []).map(item => ({
      title: item.topicIdea || item.title,
      caption: item.hook ? (item.hook + '\n\n' + (brand.standardCta || '') + '\n\n' + (brand.standardHashtags || '')) : '',
      channel: brand.name,
      platform: channel.platform,
      contentType: item.contentType || channel.defaultContentType || 'Short-form Video',
      targetDuration: item.targetDuration || '60s',
      scheduledDate: item.scheduledDate,
      scheduledTime: item.suggestedTime || '18:00',
      status: 'Draft',
      assignedPublisher: 'Firoz',
      mediaUrls: []
    }));

    if (postsToInsert.length > 0 && isSupabaseConfigured()) {
      await supabase.from('posts').insert(postsToInsert.map(p => ({
        title: p.title,
        caption: p.caption,
        channel: p.channel,
        platform: p.platform,
        content_type: p.contentType,
        target_duration: p.targetDuration,
        scheduled_date: p.scheduledDate,
        scheduled_time: p.scheduledTime,
        status: p.status,
        assigned_publisher: p.assignedPublisher,
        media_urls: p.mediaUrls
      })));
    }

    saveState(current);

    res.json({
      success: true,
      message: '🎉 Successfully locked ' + calendar.month + ' calendar and created ' + postsToInsert.length + ' draft posts in pipeline!',
      calendar,
      createdDraftsCount: postsToInsert.length,
      channel,
      brand
    });
  } catch (err) {
    console.error('[Lock Calendar] Pipeline push error:', err);
    saveState(current);
    res.json({
      success: true,
      message: 'Calendar marked as locked. Pipeline notice: ' + err.message,
      calendar,
      channel,
      brand
    });
  }
});

module.exports = router;
