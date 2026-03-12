import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import Sidebar from './components/Sidebar'
import Topbar from './components/Topbar'
import Gauge from './components/Gauge'
import Pipeline from './components/Pipeline'
import Ideas from './components/Ideas'
import WeeklyReview from './components/WeeklyReview'
import Performance from './components/Performance'
import { GrowthChart, PillarChart, ExecChart } from './components/Charts'
import Workouts from './components/Workouts'
import { api } from './lib/api'

// Larger gauge for the overview hero
function GaugeLarge({ pct = 0, published = 0, planned = 0 }) {
  const [animated, setAnimated] = React.useState(false)
  React.useEffect(() => { const t = setTimeout(() => setAnimated(true), 200); return () => clearTimeout(t) }, [pct])
  const ARC = 314
  const offset = animated ? ARC - (pct / 100) * ARC : ARC
  const cls = pct >= 80 ? 'great' : pct >= 60 ? 'good' : pct >= 40 ? 'warn' : 'critical'
  const colors = { great: 'var(--gold-400)', good: 'var(--success)', warn: 'var(--warn)', critical: 'var(--danger)' }
  const shadows = { great: 'drop-shadow(0 0 12px rgba(201,160,48,.6))', good: 'drop-shadow(0 0 12px rgba(46,200,128,.6))', warn: 'drop-shadow(0 0 12px rgba(232,148,58,.6))', critical: 'drop-shadow(0 0 12px rgba(224,90,90,.6))' }
  const statusText = { great: '\u2693 STRONG EXECUTION', good: '\u2713 ON TRACK', warn: '\u26a0 NEEDS ATTENTION', critical: '\u2716 OFF COURSE' }
  const statusBg = { great: 'rgba(201,160,48,.12)', good: 'rgba(46,200,128,.12)', warn: 'rgba(232,148,58,.12)', critical: 'rgba(224,90,90,.12)' }
  return (
    <div style={{ background: 'var(--navy-900)', border: '1px solid rgba(201,160,48,.15)', borderRadius: 'var(--r)', padding: '36px 48px', display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', overflow: 'hidden', animation: 'riseIn .5s ease both', width: '100%' }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg, transparent, var(--gold-400), transparent)' }} />
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: 2.5, textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 24 }}>Execution Rate</div>
      <div style={{ position: 'relative', width: 280, height: 160, marginBottom: 20 }}>
        <svg width="280" height="160" viewBox="0 0 280 160">
          <path d="M 28 148 A 112 112 0 0 1 252 148" fill="none" stroke="rgba(255,255,255,.05)" strokeWidth="16" strokeLinecap="round" />
          <path d="M 28 148 A 112 112 0 0 1 252 148" fill="none" stroke={colors[cls]} strokeWidth="16" strokeLinecap="round" strokeDasharray={ARC} strokeDashoffset={offset} style={{ transition: 'stroke-dashoffset 1.4s cubic-bezier(.34,1.56,.64,1), stroke .6s ease', filter: shadows[cls] }} />
        </svg>
        <div style={{ position: 'absolute', bottom: 4, left: '50%', transform: 'translateX(-50%)', textAlign: 'center', whiteSpace: 'nowrap' }}>
          <div style={{ fontFamily: 'var(--font-disp)', fontSize: 72, fontWeight: 900, color: colors[cls], lineHeight: 1, transition: 'color .6s ease' }}>{Math.round(pct)}%</div>
        </div>
      </div>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--muted)', marginBottom: 12 }}>{published} of {planned} planned pieces published</div>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: 1, padding: '5px 18px', borderRadius: 20, background: statusBg[cls], color: colors[cls] }}>{pct >= 100 ? '\u2693 PERFECT EXECUTION' : statusText[cls]}</div>
    </div>
  )
}

function Toast({ msg, icon }) {
  return (
    <div style={{
      position: 'fixed', bottom: 22, right: 22,
      background: 'var(--navy-700)',
      border: '1px solid rgba(201,160,48,.2)',
      borderRadius: 'var(--r)', padding: '12px 18px',
      fontSize: 12, color: 'var(--cream)', zIndex: 999,
      display: 'flex', alignItems: 'center', gap: 8,
      maxWidth: 300, boxShadow: '0 8px 32px rgba(0,0,0,.4)',
      animation: 'riseIn .3s cubic-bezier(.34,1.56,.64,1)',
    }}>
      <span style={{ color: 'var(--gold-400)' }}>{icon}</span> {msg}
    </div>
  )
}

// A single clean metric row item
function MetricRow({ label, value, note, noteColor, border = true }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '14px 0',
      borderBottom: border ? '1px solid rgba(255,255,255,.04)' : 'none',
    }}>
      <div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: 2, textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 3 }}>
          {label}
        </div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: noteColor || 'var(--muted)' }}>
          {note}
        </div>
      </div>
      <div style={{ fontFamily: 'var(--font-disp)', fontSize: 26, fontWeight: 700, color: 'var(--gold-400)' }}>
        {value}
      </div>
    </div>
  )
}

function Panel({ title, meta, children, delay = 0 }) {
  return (
    <div style={{
      background: 'var(--navy-900)',
      border: '1px solid rgba(255,255,255,.05)',
      borderRadius: 'var(--r)', overflow: 'hidden',
      animation: `riseIn .5s ${delay}s ease both`,
    }}>
      <div style={{
        padding: '14px 20px',
        borderBottom: '1px solid rgba(255,255,255,.04)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ fontFamily: 'var(--font-disp)', fontSize: 14, fontWeight: 700, color: 'var(--cream)' }}>{title}</div>
        {meta && <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--muted)', letterSpacing: 1 }}>{meta}</div>}
      </div>
      <div style={{ padding: 20 }}>{children}</div>
    </div>
  )
}

export default function App() {
  const [page, setPage] = useState('overview')
  const [toast, setToast] = useState(null)

  function showToast(msg, icon = '✓') {
    setToast({ msg, icon })
    setTimeout(() => setToast(null), 3200)
  }

  const { data: dash }    = useQuery({ queryKey: ['dashboard'], queryFn: api.dashboard, refetchInterval: 60_000 })
  const { data: content } = useQuery({ queryKey: ['content'],   queryFn: api.content })
  const { data: ideas }   = useQuery({ queryKey: ['ideas'],     queryFn: api.ideas })
  const { data: reviews } = useQuery({ queryKey: ['reviews'],   queryFn: api.reviews })
  const { data: growth }  = useQuery({ queryKey: ['growth'],    queryFn: () => api.growth(84) })
  const { data: workouts } = useQuery({ queryKey: ['workouts'], queryFn: () => fetch('/api/waypoint/workouts').then(r => r.json()) })

  const ytSubs   = dash?.youtube?.subscribers || 0
  const igFollow = dash?.instagram?.followers || 0
  const pipeline = dash?.pipeline || []
  const inPipeline = pipeline.reduce((a, p) => a + (parseInt(p.total) || 0), 0)

  const publishedContent = (content || []).filter(c => c.status === 'published')
  const published = publishedContent.length

  const totalPlanned   = (reviews || []).reduce((a, r) => a + (r.planned   || 0), 0)
  const totalPublished = (reviews || []).reduce((a, r) => a + (r.published || 0), 0)
  const execPct = totalPlanned > 0 ? Math.min(100, (totalPublished / totalPlanned) * 100) : 0

  let streak = 0
  if (reviews) {
    const sorted = [...reviews].sort((a, b) => new Date(b.week_start) - new Date(a.week_start))
    for (const r of sorted) { if ((r.published || 0) >= 1) streak++; else break }
  }

  const lastPub = publishedContent.sort((a, b) => new Date(b.published_at) - new Date(a.published_at))[0]
  const daysSince = (() => {
    if (!lastPub) return null
    const fmt = d => new Date(d).toLocaleDateString('en-CA', { timeZone: 'America/New_York' })
    const today = fmt(new Date())
    const then = fmt(new Date(lastPub.published_at))
    return Math.floor((new Date(today) - new Date(then)) / 86400000)
  })()

  const pillarCounts = {}
  ;(content || []).forEach(c => { if (c.pillar) pillarCounts[c.pillar] = (pillarCounts[c.pillar] || 0) + 1 })

  const execHistory = (reviews || []).slice(-8).map((r, i) => ({
    week: `Wk ${i + 1}`, planned: r.planned || 0, published: r.published || 0,
  }))

  const growthData = growth || (dash?.youtube ? [{
    date: new Date().toISOString().split('T')[0],
    yt: ytSubs, ig: igFollow,
  }] : [])

  const backlogCount = (ideas || []).filter(i => i.status === 'backlog').length

  // Days since message
  const daysSinceNote = daysSince === null
    ? '— No content published yet'
    : daysSince === 0 ? '↑ Published today'
    : daysSince <= 7 ? `↑ ${daysSince}d ago — you're current`
    : daysSince <= 14 ? `— ${daysSince}d ago — publish soon`
    : `⚠ ${daysSince}d ago — time to ship`

  const daysSinceColor = daysSince === null ? 'var(--muted)'
    : daysSince <= 7 ? 'var(--success)'
    : daysSince <= 14 ? 'var(--warn)'
    : 'var(--danger)'

  return (
    <div style={{ display: 'flex', minHeight: '100vh', position: 'relative', zIndex: 1 }}>
      <Sidebar page={page} setPage={setPage} />

      <main style={{ marginLeft: 210, flex: 1, display: 'flex', flexDirection: 'column' }}>
        <Topbar page={page} onToast={showToast} />

        <div style={{ padding: '32px 40px', maxWidth: 860 }}>

          {/* ══ OVERVIEW ══ */}
          {page === 'overview' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

              {/* Hero: Execution Rate — large and centered */}
              <div style={{ display: 'flex', justifyContent: 'center', animation: 'riseIn .5s ease both' }}>
                <GaugeLarge pct={execPct} published={totalPublished} planned={totalPlanned} />
              </div>

              {/* Ideas backlog */}
              <Ideas ideas={ideas || []} onToast={showToast} />

              {/* Process snapshot */}
              <Panel title="Process Snapshot" delay={0.2}>
                <MetricRow
                  label="Publishing Streak"
                  value={streak > 0 ? `${streak} wk${streak !== 1 ? 's' : ''} ${streak >= 2 ? '🔥' : ''}` : '0'}
                  note={streak > 0 ? `${streak} consecutive week${streak !== 1 ? 's' : ''}` : '— Start your streak'}
                  noteColor={streak >= 2 ? 'var(--success)' : undefined}
                />
                <MetricRow
                  label="Days Since Last Publish"
                  value={daysSince !== null ? daysSince : '—'}
                  note={daysSinceNote}
                  noteColor={daysSinceColor}
                />
                <MetricRow
                  label="Content Published"
                  value={published}
                  note={published === 0 ? '— Every row matters' : `— Row ${published} of your dataset`}
                  noteColor={published > 0 ? 'var(--success)' : undefined}
                />
                <MetricRow
                  label="In Pipeline"
                  value={inPipeline}
                  note={inPipeline > 0 ? `— ${inPipeline} piece${inPipeline !== 1 ? 's' : ''} in progress` : '— Nothing in progress'}
                  border={false}
                />
              </Panel>

            </div>
          )}

          {/* ══ PROCESS HEALTH ══ */}
          {page === 'health' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'center', animation: 'riseIn .5s ease both' }}>
                <Gauge pct={execPct} published={totalPublished} planned={totalPlanned} label="Execution Rate — All Time" />
              </div>
              <Panel title="Execution History" meta="Planned vs. Published" delay={0.1}>
                <ExecChart data={execHistory} />
              </Panel>
              <Panel title="Milestones" meta="Dataset progress" delay={0.2}>
                {[10, 50, 100].map(milestone => {
                  const done = published >= milestone
                  const pct = Math.min(100, (published / milestone) * 100)
                  return (
                    <div key={milestone} style={{ padding: '14px 0', borderBottom: '1px solid rgba(255,255,255,.04)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: done ? 'var(--success)' : 'var(--cream)' }}>
                          {done ? '✓ ' : ''}{milestone} rows — {milestone === 10 ? 'First dataset' : milestone === 50 ? 'Meaningful patterns' : 'Competitive advantage'}
                        </span>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--muted)' }}>{published}/{milestone}</span>
                      </div>
                      <div style={{ height: 3, borderRadius: 3, background: 'rgba(255,255,255,.06)', overflow: 'hidden' }}>
                        <div style={{ height: '100%', borderRadius: 3, width: `${pct}%`, background: done ? 'var(--success)' : 'var(--gold-400)', transition: 'width 1s ease' }} />
                      </div>
                    </div>
                  )
                })}
              </Panel>
            </div>
          )}

          {/* ══ PIPELINE ══ */}
          {page === 'pipeline' && (
            <div style={{ maxWidth: '100%' }}>
              <Pipeline pipeline={pipeline} />
            </div>
          )}

          {/* ══ PERFORMANCE ══ */}
          {page === 'performance' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <Performance content={content || []} />
              <Panel title="Audience Growth" meta="Last 12 weeks">
                <GrowthChart data={growthData} />
              </Panel>
            </div>
          )}

          {/* ══ IDEAS ══ */}
          {page === 'ideas' && (
            <Ideas ideas={ideas || []} onToast={showToast} />
          )}

          {/* ══ WEEKLY REVIEW ══ */}
          {page === 'review' && (
            <WeeklyReview reviews={reviews || []} onToast={showToast} />
          )}

          {/* ══ WORKOUTS ══ */}
          {page === 'workouts' && (
            <Workouts sessions={workouts || []} />
          )}

        </div>
      </main>

      {toast && <Toast {...toast} />}
    </div>
  )
}
