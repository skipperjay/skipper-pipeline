# 🚢 Skipper Media — Data Pipeline

A production-grade content analytics pipeline built on Neon (serverless Postgres),
Node.js, and Express. Tracks YouTube and Instagram metrics automatically, manages
your content production pipeline, and powers a React dashboard.

---

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                  SKIPPER MEDIA PIPELINE              │
├──────────────┬──────────────┬───────────────────────┤
│   INGESTION  │   DATABASE   │      DASHBOARD API     │
│              │              │                        │
│  YouTube API │              │  GET /api/dashboard    │
│      ↓       │  Neon        │  GET /api/content      │
│  pipeline/   │  Postgres    │  GET /api/analytics/*  │
│  youtube.js  │              │  GET /api/growth       │
│              │  ┌─────────┐ │  POST /api/content     │
│  Instagram   │  │ content │ │  POST /api/ideas       │
│  Graph API   │  │ metrics │ │  POST /api/reviews     │
│      ↓       │  │ reviews │ │                        │
│  pipeline/   │  │ ideas   │ │       ↑                │
│  instagram.js│  └─────────┘ │  React Dashboard       │
│              │              │  (build separately)    │
│  node-cron   │              │                        │
│  (daily 7am) │              │                        │
└──────────────┴──────────────┴───────────────────────┘
```

---

## Quick Start

### 1. Clone and install
```bash
git clone <your-repo>
cd skipper-pipeline
npm install
```

### 2. Set up Neon database
1. Go to [neon.tech](https://neon.tech) and create a free account
2. Create a new project called `skipper-media`
3. Copy your connection string from the dashboard
4. In the Neon SQL editor, paste and run the entire contents of `db/schema.sql`

### 3. Configure environment
```bash
cp .env.example .env
# Edit .env with your actual values
```

### 4. Get your API keys

**YouTube Data API:**
1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Create a project → Enable "YouTube Data API v3"
3. Create credentials → API Key
4. Add to `.env` as `YOUTUBE_API_KEY`
5. Your Channel ID is in YouTube Studio → Settings → Channel → Advanced

**Instagram Graph API:**
1. Go to [developers.facebook.com](https://developers.facebook.com)
2. Create an app → Add Instagram Graph API product
3. Connect your Instagram Business account
4. Generate a long-lived access token
5. Add token and Business Account ID to `.env`

### 5. Start the server
```bash
npm run dev        # Development with auto-reload
npm start          # Production
```

### 6. Run pipelines manually (first time)
```bash
npm run pipeline:youtube     # Pull YouTube data now
npm run pipeline:instagram   # Pull Instagram data now
```

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Server health check |
| GET | `/api/dashboard` | Full dashboard overview |
| GET | `/api/content` | All content (filterable) |
| GET | `/api/content/:id` | Single piece with metrics |
| POST | `/api/content` | Create new content |
| PATCH | `/api/content/:id` | Update content |
| GET | `/api/analytics/youtube/top` | Top YouTube videos |
| GET | `/api/analytics/pillars` | Performance by content pillar |
| GET | `/api/analytics/instagram/formats` | IG performance by format |
| GET | `/api/analytics/growth?days=90` | Audience growth over time |
| GET | `/api/ideas` | Ideas backlog |
| POST | `/api/ideas` | Add new idea |
| POST | `/api/ideas/:id/promote` | Promote idea → content |
| GET | `/api/reviews` | Weekly review history |
| POST | `/api/reviews` | Log weekly review |
| GET | `/api/newsletter` | Newsletter issues |
| POST | `/api/newsletter` | Log newsletter issue |

---

## Database Schema Overview

```
content                    — Every piece of content (one row = one piece)
content_platform           — Maps content to platform post IDs
youtube_metrics            — Daily YT metrics per video
instagram_metrics          — Daily IG metrics per post
youtube_channel_snapshots  — Daily channel-level YT stats
instagram_account_snapshots— Daily account-level IG stats
newsletter_issues          — Substack issue tracking (manual entry)
ideas                      — Content idea backlog
weekly_reviews             — Weekly operator check-ins
```

### Key Views (pre-built intelligence)
```sql
vw_youtube_top_content          -- Best performing videos
vw_pillar_performance           -- Which pillar drives growth
vw_instagram_format_performance -- Reels vs carousels vs images
vw_pipeline_status              -- Production pipeline kanban
vw_audience_growth              -- YT + IG growth over time
```

---

## Pipeline Schedule (Automatic)

| Pipeline | Schedule | Purpose |
|----------|----------|---------|
| YouTube | Daily 7:00 AM ET | Channel + video metrics |
| Instagram | Daily 7:15 AM ET | Account + post metrics |
| Full run | Sundays 8:00 AM ET | Weekly review data prep |

---

## Content Pillars

| Pillar | Description |
|--------|-------------|
| `build_the_person` | Self-leadership, character, discipline |
| `understand_the_economy` | Economic education, market explainers |
| `build_the_asset` | Skills, entrepreneurship, wealth building |

---

## Adding Your First Video (After Publishing)

1. Create the content row via API or direct SQL:
```sql
-- Update status after publishing
UPDATE content
SET status = 'published', published_at = NOW()
WHERE id = 1;
```

2. Add the YouTube video ID:
```sql
INSERT INTO content_platform (content_id, platform, platform_content_id, platform_url)
VALUES (1, 'youtube', 'dQw4w9WgXcQ', 'https://youtube.com/watch?v=dQw4w9WgXcQ');
```

3. Run the pipeline:
```bash
npm run pipeline:youtube
```

The metrics will be in your database within seconds.

---

## Next Steps — React Dashboard

The dashboard is a separate React app that consumes this API.
Recommended stack:
- **Vite** — fast dev environment
- **Recharts** — analytics charts
- **TanStack Query** — API data fetching
- **Tailwind CSS** — styling

Start it with:
```bash
npm create vite@latest dashboard -- --template react
cd dashboard && npm install recharts @tanstack/react-query axios tailwindcss
```

---

## Future Additions

- [ ] React dashboard frontend
- [ ] Substack API when available (currently manual)
- [ ] Content approval workflow
- [ ] Client management tables (extend for agency use)
- [ ] Automated monthly PDF reports
- [ ] Thumbnail A/B testing tracker

---

*Built by Skipper Media — Charting a course toward financial independence.*
