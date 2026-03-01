// server.js
// Skipper Media Pipeline — Express API
// Powers the dashboard with all data endpoints

const express = require('express');
const cors    = require('cors');
const { sql } = require('./db/client');
const { neon } = require('@neondatabase/serverless');
const waypointDb = neon(process.env.WAYPOINT_DATABASE_URL);
const { startScheduler } = require('./pipeline/scheduler');
require('dotenv').config();

const app  = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// ─────────────────────────────────────────
// HEALTH CHECK
// ─────────────────────────────────────────

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ─────────────────────────────────────────
// DASHBOARD — OVERVIEW
// Single endpoint for the main dashboard stats
// ─────────────────────────────────────────

app.get('/api/dashboard', async (req, res) => {
  try {
    const [
      ytSnapshot,
      igSnapshot,
      pipeline,
      recentContent,
      newsletterLatest
    ] = await Promise.all([
      // Latest YouTube channel stats
      sql`
        SELECT * FROM youtube_channel_snapshots
        ORDER BY snapshot_date DESC LIMIT 1
      `,
      // Latest Instagram account stats
      sql`
        SELECT * FROM instagram_account_snapshots
        ORDER BY snapshot_date DESC LIMIT 1
      `,
      // Production pipeline status
      sql`SELECT * FROM vw_pipeline_status`,
      // 5 most recently published pieces
      sql`
        SELECT id, title, pillar, format, published_at
        FROM content
        WHERE status = 'published'
        ORDER BY published_at DESC
        LIMIT 5
      `,
      // Latest newsletter issue
      sql`
        SELECT * FROM newsletter_issues
        ORDER BY published_at DESC LIMIT 1
      `
    ]);

    res.json({
      youtube:     ytSnapshot[0] || null,
      instagram:   igSnapshot[0] || null,
      pipeline:    pipeline,
      recent:      recentContent,
      newsletter:  newsletterLatest[0] || null
    });
  } catch (err) {
    console.error('FULL ERROR /api/dashboard:', err.message, err.stack);
    res.status(500).json({ error: err.message, detail: err.stack });
  }
});

// ─────────────────────────────────────────
// CONTENT — CRUD
// ─────────────────────────────────────────

// Get all content (filterable)
app.get('/api/content', async (req, res) => {
  try {
    const { pillar, status, format, stage } = req.query;

    let query = sql`SELECT * FROM content WHERE 1=1`;

    // Note: Neon serverless supports template literals for safe parameterization
    // For dynamic filtering, build conditions
    const conditions = [];
    if (pillar)  conditions.push(sql`pillar = ${pillar}`);
    if (status)  conditions.push(sql`status = ${status}`);
    if (format)  conditions.push(sql`format = ${format}`);
    if (stage)   conditions.push(sql`stage  = ${stage}`);

    const rows = await sql`
      SELECT
        c.*,
        array_agg(cp.platform) FILTER (WHERE cp.platform IS NOT NULL) AS platforms
      FROM content c
      LEFT JOIN content_platform cp ON cp.content_id = c.id
      ${pillar ? sql`WHERE c.pillar = ${pillar}` : sql``}
      GROUP BY c.id
      ORDER BY c.created_at DESC
    `;

    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get single content piece with all metrics
app.get('/api/content/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const [content, platforms, ytMetrics, igMetrics] = await Promise.all([
      sql`SELECT * FROM content WHERE id = ${id}`,
      sql`SELECT * FROM content_platform WHERE content_id = ${id}`,
      sql`
        SELECT ym.*, cp.platform_content_id
        FROM youtube_metrics ym
        JOIN content_platform cp ON cp.id = ym.content_platform_id
        WHERE cp.content_id = ${id}
        ORDER BY ym.snapshot_date DESC
        LIMIT 30
      `,
      sql`
        SELECT im.*, cp.platform_content_id
        FROM instagram_metrics im
        JOIN content_platform cp ON cp.id = im.content_platform_id
        WHERE cp.content_id = ${id}
        ORDER BY im.snapshot_date DESC
        LIMIT 30
      `
    ]);

    if (!content[0]) return res.status(404).json({ error: 'Content not found' });

    res.json({
      ...content[0],
      platforms,
      youtube_metrics:   ytMetrics,
      instagram_metrics: igMetrics
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create new content
app.post('/api/content', async (req, res) => {
  try {
    const {
      title, pillar, format, status, stage,
      hook, description, script_url, thumbnail_url,
      target_publish_date, tags, notes
    } = req.body;

    const result = await sql`
      INSERT INTO content (
        title, pillar, format, status, stage,
        hook, description, script_url, thumbnail_url,
        target_publish_date, tags, notes
      ) VALUES (
        ${title}, ${pillar}, ${format},
        ${status || 'idea'}, ${stage || 'backlog'},
        ${hook}, ${description}, ${script_url}, ${thumbnail_url},
        ${target_publish_date}, ${tags}, ${notes}
      )
      RETURNING *
    `;

    res.status(201).json(result[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update content (stage, status, notes, etc.)
app.patch('/api/content/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const fields = req.body;

    // Only allow safe fields to be updated
    const allowed = [
      'title', 'status', 'stage', 'hook', 'description',
      'script_url', 'thumbnail_url', 'video_url',
      'target_publish_date', 'published_at',
      'tags', 'notes', 'lesson_learned'
    ];

    const updates = Object.entries(fields)
      .filter(([key]) => allowed.includes(key));

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    // Build dynamic update — using individual queries for safety
    for (const [key, value] of updates) {
      await sql`
        UPDATE content SET ${sql(key)} = ${value}
        WHERE id = ${id}
      `;
    }

    const updated = await sql`SELECT * FROM content WHERE id = ${id}`;
    res.json(updated[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────
// ANALYTICS — VIEWS
// ─────────────────────────────────────────

// Top performing YouTube content
app.get('/api/analytics/youtube/top', async (req, res) => {
  try {
    const rows = await sql`SELECT * FROM vw_youtube_top_content LIMIT 10`;
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Performance by content pillar
app.get('/api/analytics/pillars', async (req, res) => {
  try {
    const rows = await sql`SELECT * FROM vw_pillar_performance`;
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Instagram performance by format
app.get('/api/analytics/instagram/formats', async (req, res) => {
  try {
    const rows = await sql`SELECT * FROM vw_instagram_format_performance`;
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Audience growth over time
app.get('/api/analytics/growth', async (req, res) => {
  try {
    const { days = 90 } = req.query;
    const rows = await sql`
      SELECT * FROM vw_audience_growth
      WHERE snapshot_date >= CURRENT_DATE - ${parseInt(days)} * INTERVAL '1 day'
      ORDER BY snapshot_date ASC
    `;
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────
// IDEAS BACKLOG
// ─────────────────────────────────────────

app.get('/api/ideas', async (req, res) => {
  try {
    const rows = await sql`
      SELECT * FROM ideas
      WHERE promoted_to_content IS NULL
      ORDER BY priority ASC, created_at DESC
    `;
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/ideas', async (req, res) => {
  try {
    const { title, pillar, format, source, priority, notes } = req.body;
    const result = await sql`
      INSERT INTO ideas (title, pillar, format, source, priority, notes)
      VALUES (${title}, ${pillar}, ${format}, ${source}, ${priority || 3}, ${notes})
      RETURNING *
    `;
    res.status(201).json(result[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Promote idea to content
app.post('/api/ideas/:id/promote', async (req, res) => {
  try {
    const { id } = req.params;
    const idea = await sql`SELECT * FROM ideas WHERE id = ${id}`;
    if (!idea[0]) return res.status(404).json({ error: 'Idea not found' });

    const content = await sql`
      INSERT INTO content (title, pillar, format, status, stage, notes)
      VALUES (
        ${idea[0].title},
        ${idea[0].pillar},
        ${idea[0].format || 'long_form_video'},
        'idea', 'backlog',
        ${idea[0].notes}
      )
      RETURNING *
    `;

    await sql`
      UPDATE ideas SET promoted_to_content = ${content[0].id} WHERE id = ${id}
    `;

    res.status(201).json({ idea: idea[0], content: content[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────
// WEEKLY REVIEW
// ─────────────────────────────────────────

app.get('/api/reviews', async (req, res) => {
  try {
    const rows = await sql`
      SELECT wr.*, c.title AS top_content_title
      FROM weekly_reviews wr
      LEFT JOIN content c ON c.id = wr.top_performing_content
      ORDER BY week_start DESC
      LIMIT 12
    `;
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/reviews', async (req, res) => {
  try {
    const {
      week_start, pieces_published, pieces_planned,
      top_performing_content, biggest_win, biggest_blocker,
      lesson_this_week, next_week_priority,
      yt_subscribers, ig_followers, newsletter_subs
    } = req.body;

    const result = await sql`
      INSERT INTO weekly_reviews (
        week_start, pieces_published, pieces_planned,
        top_performing_content, biggest_win, biggest_blocker,
        lesson_this_week, next_week_priority,
        yt_subscribers, ig_followers, newsletter_subs
      ) VALUES (
        ${week_start}, ${pieces_published}, ${pieces_planned},
        ${top_performing_content}, ${biggest_win}, ${biggest_blocker},
        ${lesson_this_week}, ${next_week_priority},
        ${yt_subscribers}, ${ig_followers}, ${newsletter_subs}
      )
      ON CONFLICT (week_start) DO UPDATE SET
        pieces_published       = EXCLUDED.pieces_published,
        biggest_win            = EXCLUDED.biggest_win,
        biggest_blocker        = EXCLUDED.biggest_blocker,
        lesson_this_week       = EXCLUDED.lesson_this_week,
        next_week_priority     = EXCLUDED.next_week_priority,
        yt_subscribers         = EXCLUDED.yt_subscribers,
        ig_followers           = EXCLUDED.ig_followers,
        newsletter_subs        = EXCLUDED.newsletter_subs
      RETURNING *
    `;
    res.status(201).json(result[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────
// NEWSLETTER
// ─────────────────────────────────────────

app.get('/api/newsletter', async (req, res) => {
  try {
    const rows = await sql`
      SELECT * FROM newsletter_issues ORDER BY published_at DESC LIMIT 20
    `;
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/newsletter', async (req, res) => {
  try {
    const {
      content_id, issue_number, subject_line, published_at,
      substack_url, subscribers_at_send, emails_sent,
      opens, clicks, open_rate, click_rate,
      new_subscribers, unsubscribes, notes
    } = req.body;

    const result = await sql`
      INSERT INTO newsletter_issues (
        content_id, issue_number, subject_line, published_at,
        substack_url, subscribers_at_send, emails_sent,
        opens, clicks, open_rate, click_rate,
        new_subscribers, unsubscribes, notes
      ) VALUES (
        ${content_id}, ${issue_number}, ${subject_line}, ${published_at},
        ${substack_url}, ${subscribers_at_send}, ${emails_sent},
        ${opens}, ${clicks}, ${open_rate}, ${click_rate},
        ${new_subscribers}, ${unsubscribes}, ${notes}
      )
      RETURNING *
    `;
    res.status(201).json(result[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
// ─────────────────────────────────────────
// WAYPOINT — HABITS, TODOS, CAPTURE
// ─────────────────────────────────────────

app.get('/api/waypoint/habits/today', async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const allHabits = await waypointDb`
      SELECT DISTINCT habit_name FROM habit_logs
      WHERE user_id = 1 ORDER BY habit_name
    `;
    const todayLogs = await waypointDb`
      SELECT habit_name FROM habit_logs
      WHERE user_id = 1 AND logged_date = ${today}
    `;
    const loggedToday = new Set(todayLogs.map(l => l.habit_name));
    const result = await Promise.all(allHabits.map(async ({ habit_name }) => {
      const logs = await waypointDb`
        SELECT logged_date FROM habit_logs
        WHERE user_id = 1 AND habit_name = ${habit_name}
        ORDER BY logged_date DESC LIMIT 30
      `;
      let streak = 0;
      const dates = logs.map(l => new Date(l.logged_date).toISOString().split('T')[0]);
      const check = new Date();
      if (!loggedToday.has(habit_name)) check.setDate(check.getDate() - 1);
      for (let i = 0; i < 30; i++) {
        const d = new Date(check);
        d.setDate(d.getDate() - i);
        if (dates.includes(d.toISOString().split('T')[0])) streak++;
        else break;
      }
      return { habit_name, logged_today: loggedToday.has(habit_name), streak };
    }));
    res.json(result);
  } catch (err) {
    console.error('Waypoint habits error:', err);
    res.json([]);
  }
});

app.get('/api/waypoint/todos', async (req, res) => {
  try {
    const todos = await waypointDb`
      SELECT id, task, pillar, due_date, completed, completed_at, created_at
      FROM todos
      WHERE user_id = 1
      ORDER BY completed ASC, due_date ASC NULLS LAST, created_at DESC
      LIMIT 50
    `;
    res.json(todos);
  } catch (err) {
    console.error('Waypoint todos error:', err);
    res.json([]);
  }
});

app.post('/api/waypoint/todos/:id/complete', async (req, res) => {
  try {
    const { id } = req.params;
    await waypointDb`
      UPDATE todos SET completed = true, completed_at = NOW()
      WHERE id = ${id} AND user_id = 1
    `;
    res.json({ success: true });
  } catch (err) {
    console.error('Complete todo error:', err);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/waypoint/capture', async (req, res) => {
  try {
    const { text, type, pillar } = req.body;
    if (type === 'idea') {
      const result = await sql`
        INSERT INTO ideas (title, pillar, source, priority)
        VALUES (${text}, ${pillar || 'build_the_person'}, 'quick_capture', 3)
        RETURNING *
      `;
      res.json({ success: true, type: 'idea', data: result[0] });
    } else {
      await waypointDb`
        INSERT INTO logs (user_id, raw_text, entry_type, summary, logged_at, log_date)
        VALUES (1, ${text}, 'note', ${text}, NOW(), CURRENT_DATE)
      `;
      res.json({ success: true, type: 'note' });
    }
  } catch (err) {
    console.error('Capture error:', err);
    res.status(500).json({ error: err.message });
  }
});
// ─────────────────────────────────────────
// GOOGLE CALENDAR
// ─────────────────────────────────────────

const { google } = require('googleapis');

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

// Step 1 — redirect user to Google login
app.get('/api/calendar/auth', (req, res) => {
  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: ['https://www.googleapis.com/auth/calendar.readonly'],
  });
  res.redirect(url);
});

// Step 2 — Google sends back a code, exchange for tokens
app.get('/api/calendar/callback', async (req, res) => {
  try {
    const { code } = req.query;
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    // Store tokens in .env or log them for now
    console.log('✅ Google Calendar tokens:', JSON.stringify(tokens));
    console.log('Add GOOGLE_REFRESH_TOKEN to your .env:', tokens.refresh_token);

    res.send('Calendar connected! Check your terminal for the refresh token, add it to .env, then close this tab.');
  } catch (err) {
    console.error('Calendar auth error:', err);
    res.status(500).send('Auth failed: ' + err.message);
  }
});

// Get upcoming calendar events as todos
app.get('/api/calendar/events', async (req, res) => {
  try {
    if (!process.env.GOOGLE_REFRESH_TOKEN) {
      return res.json([]);
    }

    oauth2Client.setCredentials({
      refresh_token: process.env.GOOGLE_REFRESH_TOKEN
    });

    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
    const response = await calendar.events.list({
      calendarId: 'primary',
      timeMin: new Date().toISOString(),
      timeMax: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      singleEvents: true,
      orderBy: 'startTime',
      maxResults: 20,
    });

    const events = (response.data.items || []).map(e => ({
      id: e.id,
      task: e.summary,
      due_date: (e.start.dateTime || e.start.date).split('T')[0],
      source: 'google_calendar',
      completed: false,
    }));

    res.json(events);
  } catch (err) {
    console.error('Calendar events error:', err);
    res.json([]);
  }
});
// Delete a Waypoint todo
app.delete('/api/waypoint/todos/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await waypointDb`DELETE FROM todos WHERE id = ${id} AND user_id = 1`;
    res.json({ success: true });
  } catch (err) {
    console.error('Delete todo error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Snooze a todo by 1 day
app.post('/api/waypoint/todos/:id/snooze', async (req, res) => {
  try {
    const { id } = req.params;
    await waypointDb`
      UPDATE todos
      SET due_date = COALESCE(due_date, CURRENT_DATE) + INTERVAL '1 day'
      WHERE id = ${id} AND user_id = 1
    `;
    res.json({ success: true });
  } catch (err) {
    console.error('Snooze todo error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Add a new Waypoint todo
app.post('/api/waypoint/todos', async (req, res) => {
  try {
    const { task, due_date } = req.body;
    const result = await waypointDb`
      INSERT INTO todos (user_id, task, due_date, completed)
      VALUES (1, ${task}, ${due_date || null}, false)
      RETURNING *
    `;
    res.status(201).json(result[0]);
  } catch (err) {
    console.error('Add todo error:', err);
    res.status(500).json({ error: err.message });
  }
});
// ─────────────────────────────────────────
// WORKOUT ENDPOINTS
// ─────────────────────────────────────────

app.get('/api/waypoint/workouts', async (req, res) => {
  try {
    const sessions = await waypointDb`
      SELECT 
        ws.id, ws.session_date, ws.duration_mins, ws.created_at,
        COUNT(wt.id) as total_sets,
        array_agg(DISTINCT wt.exercise) as exercises
      FROM workout_sessions ws
      LEFT JOIN workout_sets wt ON wt.session_id = ws.id
      WHERE ws.user_id = 1
      GROUP BY ws.id
      ORDER BY ws.session_date DESC
      LIMIT 20
    `;
    res.json(sessions);
  } catch (err) {
    console.error('Workouts error:', err);
    res.json([]);
  }
});

app.get('/api/waypoint/workouts/records', async (req, res) => {
  try {
    const rows = await waypointDb`
      SELECT 
        wt.exercise,
        wt.muscle_group,
        MAX(wt.weight_lbs) as max_weight,
        MAX(wt.reps) as max_reps,
        COUNT(*) as total_sets,
        COUNT(DISTINCT ws.id) as total_sessions
      FROM workout_sets wt
      JOIN workout_sessions ws ON ws.id = wt.session_id
      WHERE wt.user_id = 1
      GROUP BY wt.exercise, wt.muscle_group
      ORDER BY wt.muscle_group NULLS LAST, wt.exercise
    `;
    res.json(rows);
  } catch (err) {
    console.error('Records error:', err);
    res.json([]);
  }
});

app.get('/api/waypoint/workouts/progress/:exercise', async (req, res) => {
  try {
    const { exercise } = req.params;
    const rows = await waypointDb`
      SELECT 
        ws.session_date,
        wt.set_number,
        wt.reps,
        wt.weight_lbs
      FROM workout_sets wt
      JOIN workout_sessions ws ON ws.id = wt.session_id
      WHERE wt.user_id = 1 AND LOWER(wt.exercise) = LOWER(${exercise})
      ORDER BY ws.session_date ASC, wt.set_number ASC
      LIMIT 100
    `;
    res.json(rows);
  } catch (err) {
    console.error('Exercise progress error:', err);
    res.json([]);
  }
});
// ─────────────────────────────────────────
// DAILY REVIEWS
// ─────────────────────────────────────────

app.get('/api/daily-reviews', async (req, res) => {
  try {
    const rows = await sql`
      SELECT * FROM daily_reviews
      ORDER BY review_date DESC
      LIMIT 60
    `;
    res.json(rows);
  } catch (err) {
    console.error('FULL ERROR /api/daily-reviews:', err.message, err.stack);
    res.status(500).json({ error: err.message, detail: err.stack });
  }
});

app.post('/api/daily-reviews', async (req, res) => {
  try {
    const { review_date, biggest_win, biggest_blocker, lesson_learned, top_focus } = req.body;
    const result = await sql`
      INSERT INTO daily_reviews (review_date, biggest_win, biggest_blocker, lesson_learned, top_focus)
      VALUES (${review_date}, ${biggest_win}, ${biggest_blocker}, ${lesson_learned}, ${top_focus})
      ON CONFLICT (review_date) DO UPDATE SET
        biggest_win     = EXCLUDED.biggest_win,
        biggest_blocker = EXCLUDED.biggest_blocker,
        lesson_learned  = EXCLUDED.lesson_learned,
        top_focus       = EXCLUDED.top_focus
      RETURNING *
    `;
    res.status(201).json(result[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
// Log a habit from dashboard
app.post('/api/waypoint/habits/log', async (req, res) => {
  try {
    const { habit_name, duration_mins, notes } = req.body;
    const today = new Date().toISOString().split('T')[0];
    await waypointDb`
      INSERT INTO habit_logs (user_id, habit_name, logged_date, duration_mins, notes)
      VALUES (1, ${habit_name}, ${today}, ${duration_mins || null}, ${notes || null})
      ON CONFLICT DO NOTHING
    `;
    await waypointDb`
      INSERT INTO logs (user_id, raw_text, pillar, duration_mins, summary, entry_type, habit_name, log_date)
      VALUES (1, ${`${habit_name} logged from dashboard`}, 'Health', ${duration_mins || null}, ${`Logged ${habit_name}`}, 'habit', ${habit_name}, ${today})
    `;
    res.json({ success: true });
  } catch (err) {
    console.error('Log habit error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Log a workout set from dashboard
app.post('/api/waypoint/workouts/log-set', async (req, res) => {
  try {
    const { exercise, muscle_group, reps, weight_lbs } = req.body;
    const now = new Date();
    const twoHoursAgo = new Date(now - 2 * 60 * 60 * 1000);
    const today = now.toISOString().split('T')[0];

    // Find or create session
    const existing = await waypointDb`
      SELECT id FROM workout_sessions
      WHERE user_id = 1 AND created_at >= ${twoHoursAgo.toISOString()}
      ORDER BY created_at DESC LIMIT 1
    `;

    let sessionId;
    if (existing.length > 0) {
      sessionId = existing[0].id;
    } else {
      const newSession = await waypointDb`
        INSERT INTO workout_sessions (user_id, session_date)
        VALUES (1, ${today}) RETURNING id
      `;
      sessionId = newSession[0].id;
    }

    // Get set number for this exercise
    const setCount = await waypointDb`
      SELECT COUNT(*) as count FROM workout_sets
      WHERE session_id = ${sessionId} AND LOWER(exercise) = LOWER(${exercise})
    `;
    const setNumber = parseInt(setCount[0].count) + 1;

    await waypointDb`
      INSERT INTO workout_sets (session_id, user_id, exercise, muscle_group, reps, weight_lbs, set_number)
      VALUES (${sessionId}, 1, ${exercise}, ${muscle_group || null}, ${reps || null}, ${weight_lbs || null}, ${setNumber})
    `;

    res.json({ success: true, session_id: sessionId, set_number: setNumber });
  } catch (err) {
    console.error('Log set error:', err);
    res.status(500).json({ error: err.message });
  }
});
// ─────────────────────────────────────────
// START SERVER
// ─────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`\n🚢 Skipper Media Pipeline API running on port ${PORT}`);
  console.log(`   Health: http://localhost:${PORT}/health`);
  console.log(`   Dashboard: http://localhost:${PORT}/api/dashboard\n`);

  // Start the automated pipeline scheduler
  startScheduler();
});
