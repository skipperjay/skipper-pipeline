import React from 'react'

function Bar({ pct, className }) {
  const colors = { streak: 'var(--success)', reviews: '#7c8ef0', days: 'var(--warn)', default: 'var(--gold-400)' }
  return (
    <div style={{ height: 3, borderRadius: 3, background: 'rgba(255,255,255,.06)', marginTop: 10, overflow: 'hidden' }}>
      <div style={{
        height: '100%', borderRadius: 3,
        background: colors[className] || colors.default,
        width: `${Math.max(0, Math.min(100, pct))}%`,
        transition: 'width 1s cubic-bezier(.34,1.56,.64,1)',
      }} />
    </div>
  )
}

function Metric({ label, value, unit, barPct, barType, delta, deltaClass }) {
  return (
    <div style={{
      padding: 20,
      display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
    }}>
      <div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, letterSpacing: 2, textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 10 }}>
          {label}
        </div>
        <div style={{ fontFamily: 'var(--font-disp)', fontSize: 28, fontWeight: 700, color: 'var(--cream)', lineHeight: 1, display: 'flex', alignItems: 'baseline', gap: 4 }}>
          {value}
          {unit && <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 400, color: 'var(--muted)' }}>{unit}</span>}
        </div>
      </div>
      <div>
        <Bar pct={barPct} className={barType} />
        <div style={{
          fontFamily: 'var(--font-mono)', fontSize: 9, marginTop: 6,
          color: deltaClass === 'up' ? 'var(--success)' : deltaClass === 'warn' ? 'var(--warn)' : 'var(--muted)',
        }}>
          {delta}
        </div>
      </div>
    </div>
  )
}

export default function ProcessMetrics({ data }) {
  const {
    streak = 0, converted = 0, totalIdeas = 0,
    reviews = 0, daysSince = null, published = 0, inPipeline = 0,
  } = data

  const streakTarget = 12

  return (
    <div style={{
      background: 'var(--navy-900)',
      border: '1px solid rgba(201,160,48,.1)',
      borderRadius: 'var(--r)',
      display: 'grid',
      gridTemplateColumns: 'repeat(3, 1fr)',
      gridTemplateRows: '1fr 1fr',
      overflow: 'hidden',
      animation: 'riseIn .5s .1s ease both',
    }}>
      {[0,1,2,3,4,5].map(i => (
        <div key={i} style={{
          borderRight: i % 3 !== 2 ? '1px solid rgba(255,255,255,.04)' : 'none',
          borderBottom: i < 3 ? '1px solid rgba(255,255,255,.04)' : 'none',
        }}>
          {i === 0 && (
            <Metric
              label="Publishing Streak"
              value={<span style={{ display:'flex', alignItems:'baseline', gap: 6 }}>
                {streak}
                {streak >= 2 && <span style={{ fontSize: 18, animation: 'flickerFire 1.5s ease-in-out infinite alternate' }}>🔥</span>}
              </span>}
              unit=" wks"
              barPct={(streak / streakTarget) * 100}
              barType="streak"
              delta={streak > 0 ? `↑ ${streak} consecutive week${streak !== 1 ? 's' : ''}` : '— Publish your first video'}
              deltaClass={streak > 0 ? 'up' : ''}
            />
          )}
          {i === 1 && (
            <Metric
              label="Ideas → Content"
              value={converted}
              unit=" promoted"
              barPct={Math.min(100, (converted / Math.max(1, totalIdeas)) * 100)}
              delta={`— ${totalIdeas - converted} ideas in backlog`}
            />
          )}
          {i === 2 && (
            <Metric
              label="Weekly Reviews"
              value={reviews}
              unit=" logged"
              barPct={Math.min(100, (reviews / 12) * 100)}
              barType="reviews"
              delta={reviews > 0 ? `↑ ${reviews} review${reviews !== 1 ? 's' : ''} logged` : '— Log your first review'}
              deltaClass={reviews > 0 ? 'up' : ''}
            />
          )}
          {i === 3 && (
            <Metric
              label="Days Since Publish"
              value={daysSince !== null ? daysSince : '—'}
              unit=" days"
              barPct={daysSince !== null ? Math.max(0, 100 - (daysSince / 14) * 100) : 0}
              barType="days"
              delta={daysSince === null ? '— No content published yet' : daysSince === 0 ? '↑ Published today!' : `— ${daysSince} day${daysSince !== 1 ? 's' : ''} ago`}
              deltaClass={daysSince === 0 ? 'up' : daysSince > 14 ? 'warn' : ''}
            />
          )}
          {i === 4 && (
            <Metric
              label="Content Published"
              value={published}
              unit=" rows"
              barPct={Math.min(100, (published / 52) * 100)}
              delta="↑ Database growing"
              deltaClass="up"
            />
          )}
          {i === 5 && (
            <Metric
              label="In Pipeline"
              value={inPipeline}
              unit=" pieces"
              barPct={Math.min(100, (inPipeline / 20) * 100)}
              delta="↑ Content in progress"
              deltaClass="up"
            />
          )}
        </div>
      ))}
    </div>
  )
}
