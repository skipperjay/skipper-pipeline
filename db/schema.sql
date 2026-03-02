-- ============================================================
-- SKIPPER MEDIA — DATA PIPELINE SCHEMA
-- Database: Neon (Serverless Postgres)
-- Purpose: Content tracking, platform analytics, audience growth
-- Version: 1.0
-- ============================================================

-- ─────────────────────────────────────────
-- ENUMS
-- ─────────────────────────────────────────

CREATE TYPE content_pillar AS ENUM (
  'build_the_person',
  'understand_the_economy',
  'build_the_asset'
);

CREATE TYPE content_format AS ENUM (
  'long_form_video',
  'short_form_video',
  'newsletter',
  'carousel',
  'image_post',
  'reel'
);

CREATE TYPE platform AS ENUM (
  'youtube',
  'instagram',
  'tiktok',
  'substack'
);

CREATE TYPE content_status AS ENUM (
  'idea',
  'scripted',
  'recorded',
  'edited',
  'scheduled',
  'published'
);

CREATE TYPE production_stage AS ENUM (
  'backlog',
  'in_progress',
  'review',
  'approved',
  'done'
);

-- ─────────────────────────────────────────
-- CORE CONTENT TABLE
-- Every piece of content is one row
-- ─────────────────────────────────────────

CREATE TABLE content (
  id                  SERIAL PRIMARY KEY,
  title               TEXT NOT NULL,
  pillar              content_pillar NOT NULL,
  format              content_format NOT NULL,
  status              content_status NOT NULL DEFAULT 'idea',
  stage               production_stage NOT NULL DEFAULT 'backlog',

  -- Scripting & Production
  hook                TEXT,                        -- Opening line / hook
  description         TEXT,                        -- What this piece covers
  script_url          TEXT,                        -- Link to Google Doc script
  thumbnail_url       TEXT,                        -- Canva or file URL
  video_url           TEXT,                        -- Raw or final file URL

  -- Scheduling
  target_publish_date DATE,
  published_at        TIMESTAMPTZ,

  -- Metadata
  tags                TEXT[],                      -- e.g. ARRAY['gdp','economics']
  notes               TEXT,
  lesson_learned      TEXT,                        -- Post-publish reflection

  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────
-- PLATFORM CONTENT MAP
-- Links one content piece to multiple platforms
-- ─────────────────────────────────────────

CREATE TABLE content_platform (
  id                  SERIAL PRIMARY KEY,
  content_id          INTEGER NOT NULL REFERENCES content(id) ON DELETE CASCADE,
  platform            platform NOT NULL,
  platform_content_id TEXT,                        -- YouTube video ID, IG post ID, etc.
  platform_url        TEXT,
  published_at        TIMESTAMPTZ,
  created_at          TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(content_id, platform)
);

-- ─────────────────────────────────────────
-- YOUTUBE METRICS
-- One row per video per snapshot date
-- ─────────────────────────────────────────

CREATE TABLE youtube_metrics (
  id                  SERIAL PRIMARY KEY,
  content_platform_id INTEGER NOT NULL REFERENCES content_platform(id) ON DELETE CASCADE,
  snapshot_date       DATE NOT NULL,

  -- Core metrics
  views               INTEGER DEFAULT 0,
  watch_time_minutes  NUMERIC(10,2) DEFAULT 0,
  avg_view_duration   INTERVAL,
  avg_view_pct        NUMERIC(5,2),               -- % of video watched on average

  -- Engagement
  likes               INTEGER DEFAULT 0,
  comments            INTEGER DEFAULT 0,
  shares              INTEGER DEFAULT 0,
  saves               INTEGER DEFAULT 0,

  -- Growth
  subscribers_gained  INTEGER DEFAULT 0,
  subscribers_lost    INTEGER DEFAULT 0,

  -- Traffic sources (%)
  traffic_search      NUMERIC(5,2),
  traffic_suggested   NUMERIC(5,2),
  traffic_external    NUMERIC(5,2),
  traffic_direct      NUMERIC(5,2),

  -- Impressions
  impressions         INTEGER DEFAULT 0,
  click_through_rate  NUMERIC(5,2),               -- CTR %

  created_at          TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(content_platform_id, snapshot_date)
);

-- ─────────────────────────────────────────
-- INSTAGRAM METRICS
-- One row per post per snapshot date
-- ─────────────────────────────────────────

CREATE TABLE instagram_metrics (
  id                  SERIAL PRIMARY KEY,
  content_platform_id INTEGER NOT NULL REFERENCES content_platform(id) ON DELETE CASCADE,
  snapshot_date       DATE NOT NULL,

  -- Core metrics
  impressions         INTEGER DEFAULT 0,
  reach               INTEGER DEFAULT 0,

  -- Engagement
  likes               INTEGER DEFAULT 0,
  comments            INTEGER DEFAULT 0,
  shares              INTEGER DEFAULT 0,
  saves               INTEGER DEFAULT 0,
  total_interactions  INTEGER DEFAULT 0,

  -- Reels-specific
  plays               INTEGER DEFAULT 0,
  reel_reach          INTEGER DEFAULT 0,

  -- Computed
  engagement_rate     NUMERIC(5,2),               -- (interactions/reach) * 100

  created_at          TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(content_platform_id, snapshot_date)
);

-- ─────────────────────────────────────────
-- CHANNEL / ACCOUNT SNAPSHOTS
-- Overall account health over time
-- ─────────────────────────────────────────

CREATE TABLE youtube_channel_snapshots (
  id                    SERIAL PRIMARY KEY,
  snapshot_date         DATE NOT NULL UNIQUE,
  subscribers           INTEGER DEFAULT 0,
  total_views           BIGINT DEFAULT 0,
  total_watch_time_hrs  NUMERIC(12,2) DEFAULT 0,
  video_count           INTEGER DEFAULT 0,
  created_at            TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE instagram_account_snapshots (
  id                  SERIAL PRIMARY KEY,
  snapshot_date       DATE NOT NULL UNIQUE,
  followers           INTEGER DEFAULT 0,
  following           INTEGER DEFAULT 0,
  total_posts         INTEGER DEFAULT 0,
  avg_engagement_rate NUMERIC(5,2),
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────
-- NEWSLETTER (SUBSTACK)
-- Manual entry — Substack has no public API
-- ─────────────────────────────────────────

CREATE TABLE newsletter_issues (
  id                  SERIAL PRIMARY KEY,
  content_id          INTEGER REFERENCES content(id) ON DELETE SET NULL,
  issue_number        INTEGER NOT NULL,
  subject_line        TEXT NOT NULL,
  published_at        TIMESTAMPTZ,
  substack_url        TEXT,

  -- Metrics (entered manually or via export)
  subscribers_at_send INTEGER DEFAULT 0,
  emails_sent         INTEGER DEFAULT 0,
  opens               INTEGER DEFAULT 0,
  clicks              INTEGER DEFAULT 0,
  open_rate           NUMERIC(5,2),
  click_rate          NUMERIC(5,2),
  new_subscribers     INTEGER DEFAULT 0,
  unsubscribes        INTEGER DEFAULT 0,

  notes               TEXT,
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────
-- CONTENT IDEAS BACKLOG
-- Raw ideas before they become content rows
-- ─────────────────────────────────────────

CREATE TABLE ideas (
  id                  SERIAL PRIMARY KEY,
  title               TEXT NOT NULL,
  pillar              content_pillar,
  format              content_format,
  source              TEXT,                        -- Where the idea came from
  priority            INTEGER DEFAULT 3,           -- 1 (highest) to 5 (lowest)
  promoted_to_content INTEGER REFERENCES content(id),
  notes               TEXT,
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────
-- WEEKLY REVIEW LOG
-- Your personal operator check-in each week
-- ─────────────────────────────────────────

CREATE TABLE weekly_reviews (
  id                    SERIAL PRIMARY KEY,
  week_start            DATE NOT NULL UNIQUE,

  -- Output this week
  pieces_published      INTEGER DEFAULT 0,
  pieces_planned        INTEGER DEFAULT 0,

  -- Wins and blockers
  top_performing_content INTEGER REFERENCES content(id),
  biggest_win           TEXT,
  biggest_blocker       TEXT,
  lesson_this_week      TEXT,

  -- Next week intentions
  next_week_priority    TEXT,
  content_ids_planned   INTEGER[],               -- Array of content IDs planned

  -- Metrics snapshot
  yt_subscribers        INTEGER,
  ig_followers          INTEGER,
  newsletter_subs       INTEGER,

  created_at            TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────
-- INDEXES — for fast dashboard queries
-- ─────────────────────────────────────────

CREATE INDEX idx_content_pillar      ON content(pillar);
CREATE INDEX idx_content_status      ON content(status);
CREATE INDEX idx_content_published   ON content(published_at);
CREATE INDEX idx_yt_metrics_date     ON youtube_metrics(snapshot_date);
CREATE INDEX idx_ig_metrics_date     ON instagram_metrics(snapshot_date);
CREATE INDEX idx_cp_platform         ON content_platform(platform);

-- ─────────────────────────────────────────
-- VIEWS — pre-built intelligence queries
-- ─────────────────────────────────────────

-- Best performing YouTube videos (all time)
CREATE VIEW vw_youtube_top_content AS
SELECT
  c.id,
  c.title,
  c.pillar,
  c.published_at,
  MAX(ym.views)               AS peak_views,
  MAX(ym.likes)               AS peak_likes,
  MAX(ym.comments)            AS peak_comments,
  MAX(ym.subscribers_gained)  AS total_subs_gained,
  MAX(ym.click_through_rate)  AS best_ctr,
  MAX(ym.avg_view_pct)        AS best_avg_view_pct
FROM content c
JOIN content_platform cp ON cp.content_id = c.id AND cp.platform = 'youtube'
JOIN youtube_metrics ym  ON ym.content_platform_id = cp.id
GROUP BY c.id, c.title, c.pillar, c.published_at
ORDER BY peak_views DESC;

-- Performance by content pillar
CREATE VIEW vw_pillar_performance AS
SELECT
  c.pillar,
  COUNT(DISTINCT c.id)          AS total_pieces,
  AVG(ym.views)                 AS avg_views,
  AVG(ym.likes)                 AS avg_likes,
  AVG(ym.click_through_rate)    AS avg_ctr,
  AVG(ym.avg_view_pct)          AS avg_retention
FROM content c
JOIN content_platform cp ON cp.content_id = c.id AND cp.platform = 'youtube'
JOIN youtube_metrics ym  ON ym.content_platform_id = cp.id
GROUP BY c.pillar;

-- Instagram engagement by format
CREATE VIEW vw_instagram_format_performance AS
SELECT
  c.format,
  COUNT(DISTINCT c.id)          AS total_posts,
  AVG(im.reach)                 AS avg_reach,
  AVG(im.engagement_rate)       AS avg_engagement_rate,
  AVG(im.saves)                 AS avg_saves,
  AVG(im.shares)                AS avg_shares
FROM content c
JOIN content_platform cp ON cp.content_id = c.id AND cp.platform = 'instagram'
JOIN instagram_metrics im ON im.content_platform_id = cp.id
GROUP BY c.format;

-- Content production pipeline status
CREATE VIEW vw_pipeline_status AS
SELECT
  stage,
  COUNT(*)                                          AS total,
  array_agg(id     ORDER BY created_at DESC)        AS content_ids,
  array_agg(title  ORDER BY created_at DESC)        AS content_titles,
  array_agg(pillar ORDER BY created_at DESC)        AS content_pillars,
  array_agg(format ORDER BY created_at DESC)        AS content_formats
FROM content
WHERE status != 'published'
GROUP BY stage
ORDER BY
  CASE stage
    WHEN 'idea'        THEN 1
    WHEN 'backlog'     THEN 2
    WHEN 'in_progress' THEN 3
    WHEN 'review'      THEN 4
    WHEN 'approved'    THEN 5
    WHEN 'done'        THEN 6
  END;

-- Audience growth over time (combined)
CREATE VIEW vw_audience_growth AS
SELECT
  ys.snapshot_date,
  ys.subscribers        AS yt_subscribers,
  ia.followers          AS ig_followers
FROM youtube_channel_snapshots ys
FULL OUTER JOIN instagram_account_snapshots ia
  ON ia.snapshot_date = ys.snapshot_date
ORDER BY snapshot_date ASC;

-- ─────────────────────────────────────────
-- AUTO-UPDATE updated_at TRIGGER
-- ─────────────────────────────────────────

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_content_updated_at
  BEFORE UPDATE ON content
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ─────────────────────────────────────────
-- SEED DATA — Your first content rows
-- ─────────────────────────────────────────

INSERT INTO content (title, pillar, format, status, stage, hook, description, target_publish_date, tags) VALUES
(
  'The Skipper''s Guide to GDP',
  'understand_the_economy',
  'long_form_video',
  'scripted',
  'in_progress',
  'GDP is more than just a number on the news — it''s the report card of the entire economy.',
  'Breaking down Gross Domestic Product in plain language — what it is, how it''s measured, and why it affects your everyday life.',
  CURRENT_DATE + INTERVAL '7 days',
  ARRAY['gdp', 'economics', 'beginner', 'explainer']
),
(
  'The Market Isn''t the Economy — Here''s the Difference',
  'understand_the_economy',
  'long_form_video',
  'scripted',
  'in_progress',
  'The S&P 500 hit an all-time high. So why does everything feel more expensive?',
  'Explaining the disconnect between stock market performance and everyday economic reality for working Americans.',
  CURRENT_DATE + INTERVAL '14 days',
  ARRAY['stock market', 'economy', 'inflation', 'explainer']
),
(
  'Become the Asset: Build Yourself Like a Stock Worth Investing In',
  'build_the_asset',
  'long_form_video',
  'scripted',
  'in_progress',
  'To build wealth in this economy, you first have to become valuable to it.',
  'How to develop marketable skills, soft skills, and systems that make you an appreciating asset in any market.',
  CURRENT_DATE + INTERVAL '21 days',
  ARRAY['skills', 'self-development', 'entrepreneurship', 'wealth']
),
(
  'You Are the Foundation of Everything You Build',
  'build_the_person',
  'long_form_video',
  'scripted',
  'backlog',
  'It wasn''t the market, the timing, or the luck. It was me.',
  'Chapter 1 of the Skipper Media philosophy — why self-leadership is structural, not motivational.',
  CURRENT_DATE + INTERVAL '28 days',
  ARRAY['mindset', 'discipline', 'self-leadership', 'entrepreneurship']
),
(
  'Why Willpower Fails — And What to Use Instead',
  'build_the_person',
  'long_form_video',
  'idea',
  'backlog',
  'Willpower is not a strategy. It''s a resource — and it runs out.',
  'How to replace willpower with structure, habits, and systems that work even when motivation is gone.',
  CURRENT_DATE + INTERVAL '35 days',
  ARRAY['habits', 'discipline', 'systems', 'productivity']
);

-- Seed ideas backlog
INSERT INTO ideas (title, pillar, format, source, priority, notes) VALUES
('What is the Federal Reserve and why should you care?', 'understand_the_economy', 'long_form_video', 'Content pillar planning', 1, 'Natural follow-up to GDP video'),
('How inflation actually works — and who it hurts most', 'understand_the_economy', 'long_form_video', 'Content pillar planning', 1, 'Very high relevance to audience'),
('Character as Infrastructure — Chapter 2', 'build_the_person', 'long_form_video', 'Book content', 2, 'Adapt directly from existing chapter'),
('Trade skills vs tech skills — which builds wealth faster?', 'build_the_asset', 'long_form_video', 'Audience question', 2, 'High engagement potential'),
('What is a W-2 vs 1099 — know the difference', 'build_the_asset', 'short_form_video', 'Content gap', 3, 'Great Reel/Short topic');
