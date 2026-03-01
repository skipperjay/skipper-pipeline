// pipeline/youtube.js
// Pulls YouTube channel + video metrics and writes to Neon
// Run manually: npm run pipeline:youtube
// Or runs automatically via scheduler

const axios = require('axios');
const { sql } = require('../db/client');
require('dotenv').config();

const YT_API_KEY = process.env.YOUTUBE_API_KEY;
const CHANNEL_ID = process.env.YOUTUBE_CHANNEL_ID;
const BASE_URL = 'https://www.googleapis.com/youtube/v3';

// ─────────────────────────────────────────
// CHANNEL SNAPSHOT
// Pulls overall subscriber + view counts
// ─────────────────────────────────────────

async function fetchChannelSnapshot() {
  console.log('📡 Fetching YouTube channel stats...');

  const res = await axios.get(`${BASE_URL}/channels`, {
    params: {
      part: 'statistics,contentDetails',
      id: CHANNEL_ID,
      key: YT_API_KEY
    }
  });

  const stats = res.data.items[0]?.statistics;
  if (!stats) throw new Error('No channel stats returned from YouTube API');

  const today = new Date().toISOString().split('T')[0];

  await sql`
    INSERT INTO youtube_channel_snapshots
      (snapshot_date, subscribers, total_views, video_count)
    VALUES
      (${today}, ${parseInt(stats.subscriberCount)}, ${parseInt(stats.viewCount)}, ${parseInt(stats.videoCount)})
    ON CONFLICT (snapshot_date)
    DO UPDATE SET
      subscribers  = EXCLUDED.subscribers,
      total_views  = EXCLUDED.total_views,
      video_count  = EXCLUDED.video_count
  `;

  console.log(`✅ Channel snapshot saved — ${stats.subscriberCount} subscribers`);
  return stats;
}

// ─────────────────────────────────────────
// VIDEO METRICS
// Pulls stats for each published video
// ─────────────────────────────────────────

async function fetchVideoMetrics() {
  console.log('📡 Fetching YouTube video metrics...');

  // Get all content_platform rows for YouTube that have a platform_content_id
  const platforms = await sql`
    SELECT cp.id, cp.platform_content_id, c.title
    FROM content_platform cp
    JOIN content c ON c.id = cp.content_id
    WHERE cp.platform = 'youtube'
      AND cp.platform_content_id IS NOT NULL
  `;

  if (platforms.length === 0) {
    console.log('ℹ️  No YouTube video IDs found in database yet. Add them via the dashboard.');
    return;
  }

  const today = new Date().toISOString().split('T')[0];
  let saved = 0;

  for (const row of platforms) {
    try {
      const res = await axios.get(`${BASE_URL}/videos`, {
        params: {
          part: 'statistics,contentDetails',
          id: row.platform_content_id,
          key: YT_API_KEY
        }
      });

      const video = res.data.items[0];
      if (!video) continue;

      const s = video.statistics;

      await sql`
        INSERT INTO youtube_metrics (
          content_platform_id,
          snapshot_date,
          views,
          likes,
          comments,
          impressions
        ) VALUES (
          ${row.id},
          ${today},
          ${parseInt(s.viewCount || 0)},
          ${parseInt(s.likeCount || 0)},
          ${parseInt(s.commentCount || 0)},
          0
        )
        ON CONFLICT (content_platform_id, snapshot_date)
        DO UPDATE SET
          views    = EXCLUDED.views,
          likes    = EXCLUDED.likes,
          comments = EXCLUDED.comments
      `;

      saved++;
      console.log(`  ✅ ${row.title} — ${s.viewCount} views`);
    } catch (err) {
      console.error(`  ❌ Failed for ${row.title}:`, err.message);
    }
  }

  console.log(`📊 YouTube metrics saved for ${saved} videos`);
}

// ─────────────────────────────────────────
// MAIN RUNNER
// ─────────────────────────────────────────

async function run() {
  try {
    await fetchChannelSnapshot();
    await fetchVideoMetrics();
    console.log('🎯 YouTube pipeline complete\n');
  } catch (err) {
    console.error('❌ YouTube pipeline error:', err.message);
    process.exit(1);
  }
}

run();
