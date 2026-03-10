import React, { useState, useEffect } from 'react'

function buildSessionPrompt(data) {
  const groups = (data.muscle_groups || []).map(mg => {
    const diff = mg.prev_volume > 0
      ? `${mg.volume > mg.prev_volume ? '+' : ''}${Math.round(((mg.volume - mg.prev_volume) / mg.prev_volume) * 100)}% vs previous`
      : 'no previous data'
    return `${mg.name}: ${mg.volume.toLocaleString()} lbs total volume (${diff})`
  }).join('\n')

  return `You are a fitness coach analyzing a workout session for Jay, who is recomping (losing fat while building muscle).
Session date: ${data.session_date}
Muscle groups trained:
${groups}
Goal context: On a recomp, maintaining volume while in a deficit is progress. Volume increases are excellent. Small drops are acceptable if trend is flat.
Give a 2-3 sentence session recap. Be specific about the numbers. Call out wins. Flag anything worth watching. End with one tip for recovery or next session.`
}

function buildWeeklyPrompt(data) {
  const groups = (data.muscle_groups || []).map(mg => {
    const dir = mg.pct_change > 5 ? `+${mg.pct_change}%` : mg.pct_change < -5 ? `${mg.pct_change}%` : 'flat'
    return `${mg.name}: ${mg.volume.toLocaleString()} lbs (${dir} vs last week)`
  }).join('\n')

  return `You are a fitness coach reviewing a full training week for Jay, who is recomping (losing fat while building muscle).
Week of: ${data.week_start}
Sessions completed: ${data.sessions_completed}/${data.sessions_target}
Days elapsed this week: ${data.days_elapsed} of 7
Week complete: ${data.week_complete}
Volume by muscle group this week vs last week:
${groups}
Goal context: On a recomp, maintaining or increasing volume week over week is success. Flag any muscle groups that dropped significantly or weren't trained.
If the week is not complete, do NOT penalize for low volume or missed sessions. Instead evaluate pace — if Jay has completed ${data.sessions_completed} sessions in ${data.days_elapsed} days, project whether he is on track to hit ${data.sessions_target} by end of week. Judge volume trends only against completed days, not the full week. A partial week with good pace is a positive sign.
Write a 3-4 sentence weekly summary. Reference actual numbers. Acknowledge maintenance as progress where relevant. End with one clear focus for next week.`
}

export default function WorkoutInsight({ mode, data }) {
  const [insight, setInsight] = useState(null)
  const [loading, setLoading] = useState(false)
  const [dots, setDots] = useState('')

  const cacheKey = mode === 'session'
    ? `workout-insight-session-${data?.session_date}`
    : `workout-insight-weekly-${data?.week_start}`

  // Loading dots animation
  useEffect(() => {
    if (!loading) return
    const iv = setInterval(() => setDots(d => d.length >= 3 ? '' : d + '.'), 400)
    return () => clearInterval(iv)
  }, [loading])

  useEffect(() => {
    if (!data || (!data.muscle_groups?.length && mode === 'session')) return

    // Check localStorage cache
    const cached = localStorage.getItem(cacheKey)
    if (cached) { setInsight(cached); return }

    generate()
  }, [data, cacheKey])

  async function generate() {
    setLoading(true)
    setInsight(null)
    try {
      const prompt = mode === 'session' ? buildSessionPrompt(data) : buildWeeklyPrompt(data)
      const res = await fetch('/api/ai/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: prompt }],
          system: 'You are a concise, knowledgeable fitness coach. Respond in plain text only, no markdown.',
        }),
      })
      const json = await res.json()
      const text = json.content?.[0]?.text || json.text || 'Unable to generate insight.'
      setInsight(text)
      localStorage.setItem(cacheKey, text)
    } catch (err) {
      console.error('WorkoutInsight error:', err)
      setInsight('Failed to generate insight.')
    } finally {
      setLoading(false)
    }
  }

  if (!data) return null

  return (
    <div style={{
      background: 'var(--navy-900)',
      border: '1px solid rgba(255,255,255,.05)',
      borderRadius: 'var(--r)',
      overflow: 'hidden',
      position: 'relative',
      animation: 'riseIn .5s ease both',
    }}>
      {/* Gold top border accent */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg, transparent, var(--gold-400), transparent)' }} />

      <div style={{
        padding: '14px 20px',
        borderBottom: '1px solid rgba(255,255,255,.04)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: 2.5, textTransform: 'uppercase', color: 'var(--muted)' }}>
          {mode === 'session' ? 'Session Intel' : 'Weekly Intel'}
        </div>
        <button
          onClick={() => { localStorage.removeItem(cacheKey); generate() }}
          disabled={loading}
          style={{
            background: 'none', border: 'none', cursor: loading ? 'default' : 'pointer',
            color: 'var(--muted)', fontSize: 14, padding: '2px 6px', borderRadius: 'var(--rs)',
            transition: 'all var(--t)', opacity: loading ? 0.4 : 0.7,
          }}
          title="Regenerate"
        >↺</button>
      </div>

      <div style={{ padding: 20 }}>
        {loading ? (
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--muted)' }}>
            Analyzing{dots}
          </div>
        ) : insight ? (
          <div style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--cream)', lineHeight: 1.7 }}>
            {insight}
          </div>
        ) : null}
      </div>
    </div>
  )
}
