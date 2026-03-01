// pipeline/instagram.js
// Pulls Instagram account + post metrics via Graph API
// Run manually: npm run pipeline:instagram

const axios = require('axios');
const { sql } = require('../db/client');
require('dotenv').config();

const ACCESS_TOKEN = process.env.INSTAGRAM_ACCESS_TOKEN;
const ACCOUNT_ID  = process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID;
const BASE_URL    = 'https://graph.facebook.com/v19.0';

// ─────────────────────────────────────────
// ACCOUNT SNAPSHOT
// ─────────────────────────────────────────

async function fetchAccountSnapshot() {
  console.log('📡 Fetching Instagram account stats...');

  const res = await axios.get(`${BASE_URL}/${ACCOUNT_ID}`, {
    params: {
      fields: 'followers_count,follows_count,media_count',
      access_token: ACCESS_TOKEN
    }
  });

  const data = res.data;
  const today = new Date().toISOString().split('T')[0];

  await sql`
    INSERT INTO instagram_account_snapshots
      (snapshot_date, followers, following, total_posts)
    VALUES
      (${today}, ${data.followers_count}, ${data.follows_count}, ${data.media_count})
    ON CONFLICT (snapshot_date)
    DO UPDATE SET
      followers   = EXCLUDED.followers,
      following   = EXCLUDED.following,
      total_posts = EXCLUDED.total_posts
  `;

  console.log(`✅ Account snapshot saved — ${data.followers_count} followers`);
}

// ─────────────────────────────────────────
// POST METRICS
// ─────────────────────────────────────────

async function fetchPostMetrics() {
  console.log('📡 Fetching Instagram post metrics...');

  const platforms = await sql`
    SELECT cp.id, cp.platform_content_id, c.title, c.format
    FROM content_platform cp
    JOIN content c ON c.id = cp.content_id
    WHERE cp.platform = 'instagram'
      AND cp.platform_content_id IS NOT NULL
  `;

  if (platforms.length === 0) {
    console.log('ℹ️  No Instagram post IDs found yet. Add them via the dashboard.');
    return;
  }

  const today = new Date().toISOString().split('T')[0];
  let saved = 0;

  for (const row of platforms) {
    try {
      // Fetch insights — metrics vary by media type
      const isReel = row.format === 'reel';

      const metrics = isReel
        ? 'reach,plays,likes,comments,shares,saved,total_interactions'
        : 'reach,impressions,likes,comments,shares,saved,total_interactions';

      const res = await axios.get(`${BASE_URL}/${row.platform_content_id}/insights`, {
        params: {
          metric: metrics,
          access_token: ACCESS_TOKEN
        }
      });

      // Parse the insights array into a flat object
      const insights = {};
      res.data.data.forEach(item => {
        insights[item.name] = item.values?.[0]?.value ?? item.value ?? 0;
      });

      const reach              = insights.reach || 0;
      const total_interactions = insights.total_interactions || 0;
      const engagement_rate    = reach > 0
        ? ((total_interactions / reach) * 100).toFixed(2)
        : 0;

      await sql`
        INSERT INTO instagram_metrics (
          content_platform_id,
          snapshot_date,
          impressions,
          reach,
          likes,
          comments,
          shares,
          saves,
          total_interactions,
          plays,
          engagement_rate
        ) VALUES (
          ${row.id},
          ${today},
          ${insights.impressions || 0},
          ${reach},
          ${insights.likes || 0},
          ${insights.comments || 0},
          ${insights.shares || 0},
          ${insights.saved || 0},
          ${total_interactions},
          ${insights.plays || 0},
          ${engagement_rate}
        )
        ON CONFLICT (content_platform_id, snapshot_date)
        DO UPDATE SET
          impressions        = EXCLUDED.impressions,
          reach              = EXCLUDED.reach,
          likes              = EXCLUDED.likes,
          comments           = EXCLUDED.comments,
          shares             = EXCLUDED.shares,
          saves              = EXCLUDED.saves,
          total_interactions = EXCLUDED.total_interactions,
          plays              = EXCLUDED.plays,
          engagement_rate    = EXCLUDED.engagement_rate
      `;

      saved++;
      console.log(`  ✅ ${row.title} — reach: ${reach}, engagement: ${engagement_rate}%`);
    } catch (err) {
      console.error(`  ❌ Failed for ${row.title}:`, err.message);
    }
  }

  console.log(`📊 Instagram metrics saved for ${saved} posts`);
}

// ─────────────────────────────────────────
// MAIN RUNNER
// ─────────────────────────────────────────

async function run() {
  try {
    await fetchAccountSnapshot();
    await fetchPostMetrics();
    console.log('🎯 Instagram pipeline complete\n');
  } catch (err) {
    console.error('❌ Instagram pipeline error:', err.message);
    process.exit(1);
  }
}

run();
