const fs = require('fs');
const path = require('path');
const { supabase, isSupabaseConfigured } = require('../src/services/supabase');

const DATA_FILE = path.join(__dirname, '..', 'data', 'social_brands_state.json');

async function migrate() {
  console.log('🚀 Starting Content OS JSON -> Supabase Migration...');

  if (!fs.existsSync(DATA_FILE)) {
    console.error('❌ Data file not found at:', DATA_FILE);
    process.exit(1);
  }

  const raw = fs.readFileSync(DATA_FILE, 'utf8');
  const state = JSON.parse(raw);
  const brands = state.brands || [];

  console.log(`📦 Loaded ${brands.length} brands from JSON.`);

  if (!isSupabaseConfigured() || !supabase) {
    console.warn('⚠️ Supabase client not configured or missing keys. Retaining JSON as primary source.');
    return;
  }

  // Verify if social_brands table is accessible
  try {
    const { data: testData, error: testErr } = await supabase.from('social_brands').select('slug').limit(1);
    if (testErr) {
      console.warn('⚠️  Supabase table "social_brands" is not yet available:', testErr.message);
      console.log('📌 To create Content OS tables, execute the migration script in Supabase Dashboard SQL Editor:');
      console.log('   supabase/migrations/20260910_v4.3_content_os_schema.sql');
      return;
    }
  } catch (err) {
    console.warn('⚠️  Could not query social_brands table:', err.message);
    return;
  }

  let brandCount = 0;
  let channelCount = 0;
  let calendarCount = 0;
  let planItemCount = 0;

  for (const b of brands) {
    const brandRecord = {
      slug: b.slug,
      name: b.name,
      tagline: b.tagline || '',
      niche: b.niche || '',
      primary_language: b.primaryLanguage || 'Bangla + English (Banglish / Spoken)',
      standard_cta: b.standardCta || '',
      standard_hashtags: b.standardHashtags || '',
      guidelines: b.guidelines || {},
      monthly_focus: b.monthlyFocus || {},
      assets: b.assets || [],
      updated_at: new Date().toISOString()
    };

    const { error: bErr } = await supabase.from('social_brands').upsert(brandRecord);
    if (bErr) {
      console.error(`❌ Failed to upsert brand ${b.slug}:`, bErr.message);
      continue;
    }
    brandCount++;

    for (const c of (b.channels || [])) {
      const channelRecord = {
        id: c.id,
        brand_slug: b.slug,
        name: c.name,
        platform: c.platform,
        handle: c.handle || '',
        is_anchor: !!c.isAnchor,
        primary_language: c.primaryLanguage || b.primaryLanguage,
        audience_count: c.audienceCount || 0,
        analytics_kb: c.analyticsKnowledgeBase || {},
        onboarding_status: c.analyticsKnowledgeBase ? 'complete' : 'pending',
        updated_at: new Date().toISOString()
      };

      const { error: cErr } = await supabase.from('social_channels').upsert(channelRecord);
      if (cErr) {
        console.error(`❌ Failed to upsert channel ${c.id}:`, cErr.message);
        continue;
      }
      channelCount++;

      // Migrate calendars & plan items
      const calendars = c.calendars || {};
      for (const [monthKey, cal] of Object.entries(calendars)) {
        const calRecord = {
          channel_id: c.id,
          brand_slug: b.slug,
          month_key: monthKey,
          status: cal.status || 'Draft',
          locked_at: cal.lockedAt || null,
          locked_by: cal.lockedBy || null,
          updated_at: new Date().toISOString()
        };

        const { data: insertedCal, error: calErr } = await supabase
          .from('channel_calendars')
          .upsert(calRecord, { onConflict: 'channel_id,month_key' })
          .select('id')
          .single();

        if (calErr) {
          console.warn(`⚠️ Calendar upsert note (${c.id} ${monthKey}):`, calErr.message);
          continue;
        }
        calendarCount++;

        const calId = insertedCal?.id;
        if (calId && Array.isArray(cal.planItems)) {
          for (let i = 0; i < cal.planItems.length; i++) {
            const item = cal.planItems[i];
            const itemRecord = {
              calendar_id: calId,
              channel_id: c.id,
              week: item.week || `Week ${Math.floor(i / 7) + 1}`,
              day_of_week: item.dayOfWeek || '',
              scheduled_date: item.scheduledDate || null,
              content_type: item.contentType || 'Short-form Video',
              topic_idea: item.topicIdea || item.title || 'Untitled Item',
              hook: item.hook || '',
              rationale: item.rationale || '',
              target_duration: item.targetDuration || '60s',
              format_tag: item.formatTag || '',
              drafted: !!item.drafted,
              post_id: item.postId || null,
              sort_order: i
            };

            const { error: itemErr } = await supabase.from('plan_items').insert(itemRecord);
            if (!itemErr) planItemCount++;
          }
        }
      }
    }
  }

  console.log(`✅ Content OS Migration complete:`);
  console.log(`   - Brands migrated: ${brandCount}`);
  console.log(`   - Channels migrated: ${channelCount}`);
  console.log(`   - Calendars migrated: ${calendarCount}`);
  console.log(`   - Plan items migrated: ${planItemCount}`);
}

migrate().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
