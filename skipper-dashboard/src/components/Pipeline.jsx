import React from 'react'
import { PIPELINE_STAGES, PIPELINE_LABELS, PILLARS, guessPillar } from '../lib/constants'

function PillarTag({ title, pillar }) {
  const p = pillar || guessPillar(title)
  const info = PILLARS[p] || { label: p, color: 'var(--muted)' }
  return (
    <span style={{
      fontFamily: 'var(--font-mono)', fontSize: 8,
      padding: '1px 6px', borderRadius: 8, letterSpacing: .3,
      background: info.color + '1a', color: info.color,
    }}>{info.label.split(' ')[0]}</span>
  )
}

export default function Pipeline({ pipeline = [] }) {
  // Build a map from stage → { total, titles }
  const map = {}
  PIPELINE_STAGES.forEach(s => { map[s] = { total: 0, titles: [] } })
  pipeline.forEach(p => {
    if (map[p.stage]) {
      map[p.stage].total = parseInt(p.total) || 0
      map[p.stage].titles = p.content_titles || []
    }
  })

  const total = Object.values(map).reduce((a, p) => a + p.total, 0)

  return (
    <div style={{
      background: 'var(--navy-900)',
      border: '1px solid rgba(255,255,255,.05)',
      borderRadius: 'var(--r)', overflow: 'hidden',
    }}>
      <div style={{
        padding: '14px 18px',
        borderBottom: '1px solid rgba(255,255,255,.04)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ fontFamily: 'var(--font-disp)', fontSize: 14, fontWeight: 700, color: 'var(--cream)' }}>
          Content Pipeline
        </div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--muted)', letterSpacing: 1 }}>
          {total} pieces in progress
        </div>
      </div>

      <div style={{
        display: 'grid', gridTemplateColumns: `repeat(${PIPELINE_STAGES.length}, 1fr)`,
        gap: 10, padding: 16,
      }}>
        {PIPELINE_STAGES.map(stage => {
          const col = map[stage]
          return (
            <div key={stage}>
              <div style={{
                fontFamily: 'var(--font-mono)', fontSize: 8, letterSpacing: 2,
                textTransform: 'uppercase', color: 'var(--muted)',
                padding: '6px 8px', marginBottom: 6,
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              }}>
                {PIPELINE_LABELS[stage]}
                <span style={{
                  background: 'rgba(255,255,255,.06)', color: 'var(--cream)',
                  fontSize: 9, padding: '1px 6px', borderRadius: 8,
                }}>{col.total}</span>
              </div>

              {col.titles.length > 0 ? col.titles.map((title, i) => (
                <div key={i} style={{
                  background: 'var(--navy-800)',
                  border: '1px solid rgba(255,255,255,.05)',
                  borderRadius: 7, padding: 10, marginBottom: 6,
                  cursor: 'pointer',
                  transition: 'all var(--t)',
                }}>
                  <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--cream)', lineHeight: 1.4, marginBottom: 6 }}>
                    {title}
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                    <PillarTag title={title} />
                    <span style={{
                      fontFamily: 'var(--font-mono)', fontSize: 8,
                      padding: '1px 6px', borderRadius: 8,
                      background: 'rgba(255,255,255,.05)', color: 'var(--muted)',
                    }}>{stage.replace('_', ' ')}</span>
                  </div>
                </div>
              )) : (
                <div style={{ color: 'var(--muted)', fontSize: 10, padding: 8, textAlign: 'center', opacity: .4 }}>
                  Empty
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
