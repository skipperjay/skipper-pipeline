import React from 'react'
import { PILLARS, PIPELINE_STAGES } from '../constants'

function pillarTag(pillar) {
  const p = PILLARS[pillar]
  if (!p) return null
  const bg = pillar === 'build_the_person' ? 'rgba(99,179,237,.1)' :
             pillar === 'understand_the_economy' ? 'rgba(201,160,48,.1)' :
             'rgba(46,200,128,.1)'
  return { label: p.label, color: p.color, bg }
}

function PipeCard({ title, pillar }) {
  const tag = pillarTag(pillar)
  return (
    <div style={{
      background: 'var(--navy-800)',
      border: '1px solid rgba(255,255,255,.05)',
      borderRadius: 7, padding: 10, marginBottom: 6,
      cursor: 'pointer', transition: 'all var(--t)',
    }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(201,160,48,.25)'; e.currentTarget.style.transform = 'translateY(-1px)' }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,.05)'; e.currentTarget.style.transform = 'none' }}
    >
      <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--cream)', lineHeight: 1.4, marginBottom: 6 }}>
        {title}
      </div>
      {tag && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
          <span style={{
            fontFamily: 'var(--font-mono)', fontSize: 8,
            padding: '1px 6px', borderRadius: 8, letterSpacing: .3,
            background: tag.bg, color: tag.color,
          }}>
            {tag.label}
          </span>
        </div>
      )}
    </div>
  )
}

export default function PipelineBoard({ pipeline }) {
  const stageMap = {}
  pipeline.forEach(p => { stageMap[p.stage] = p })

  const total = pipeline.reduce((a, p) => a + (parseInt(p.total) || 0), 0)

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
          {total} piece{total !== 1 ? 's' : ''} in progress
        </div>
      </div>

      <div style={{
        display: 'grid', gridTemplateColumns: `repeat(${PIPELINE_STAGES.length}, 1fr)`,
        gap: 10, padding: 16,
      }}>
        {PIPELINE_STAGES.map(({ key, label }) => {
          const col = stageMap[key]
          const titles = col?.content_titles || []
          const count = parseInt(col?.total) || 0

          return (
            <div key={key}>
              <div style={{
                fontFamily: 'var(--font-mono)', fontSize: 8, letterSpacing: 2,
                textTransform: 'uppercase', color: 'var(--muted)',
                padding: '6px 8px', marginBottom: 6,
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              }}>
                {label}
                <span style={{
                  background: 'rgba(255,255,255,.06)', color: 'var(--cream)',
                  fontSize: 9, padding: '1px 6px', borderRadius: 8,
                }}>
                  {count}
                </span>
              </div>

              {titles.map((title, i) => (
                <PipeCard key={i} title={title} />
              ))}

              {count === 0 && (
                <div style={{
                  padding: '14px 8px', textAlign: 'center',
                  fontFamily: 'var(--font-mono)', fontSize: 9,
                  color: 'rgba(106,125,154,.3)',
                  border: '1px dashed rgba(255,255,255,.05)',
                  borderRadius: 7,
                }}>
                  empty
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
