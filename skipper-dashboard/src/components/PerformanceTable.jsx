import React, { useState } from 'react'
import { PILLARS } from '../constants'

const PILLAR_TAG_STYLES = {
  build_the_person:       { bg: 'rgba(99,179,237,.12)',  color: '#63b3ed' },
  understand_the_economy: { bg: 'rgba(201,160,48,.12)',  color: '#c9a030' },
  build_the_asset:        { bg: 'rgba(46,200,128,.12)',  color: '#2ec880' },
}

export default function PerformanceTable({ content = [] }) {
  const [filter, setFilter] = useState('all')

  const published = content.filter(c => c.status === 'published' || c.status === 'done')
  const filtered = filter === 'all' ? published : published.filter(c => c.pillar === filter)

  const tabs = [
    { key: 'all', label: 'All' },
    { key: 'build_the_person', label: 'Build the Person' },
    { key: 'understand_the_economy', label: 'Understand the Economy' },
    { key: 'build_the_asset', label: 'Build the Asset' },
  ]

  return (
    <div>
      {/* Pillar filter tabs */}
      <div style={{ display: 'flex', gap: 5, marginBottom: 16 }}>
        {tabs.map(tab => (
          <button key={tab.key} onClick={() => setFilter(tab.key)} style={{
            fontFamily: 'var(--font-mono)', fontSize: 9,
            letterSpacing: 1, textTransform: 'uppercase',
            padding: '5px 12px', borderRadius: 20,
            border: `1px solid ${filter === tab.key ? 'rgba(201,160,48,.25)' : 'rgba(255,255,255,.08)'}`,
            background: filter === tab.key ? 'rgba(201,160,48,.1)' : 'none',
            color: filter === tab.key ? 'var(--gold-400)' : 'var(--muted)',
            cursor: 'pointer', transition: 'all var(--t)',
          }}>
            {tab.label}
          </button>
        ))}
      </div>

      <div style={{
        background: 'var(--navy-900)',
        border: '1px solid rgba(255,255,255,.05)',
        borderRadius: 'var(--r)', overflow: 'hidden',
      }}>
        <div style={{ padding: '14px 18px', borderBottom: '1px solid rgba(255,255,255,.04)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontFamily: 'var(--font-disp)', fontSize: 14, fontWeight: 700, color: 'var(--cream)' }}>Top Performing Content</div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--muted)', letterSpacing: 1 }}>YouTube · All time</div>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              {['#', 'Title', 'Pillar', 'Views', 'Likes', 'CTR'].map(h => (
                <th key={h} style={{
                  fontFamily: 'var(--font-mono)', fontSize: 8, letterSpacing: 1.5,
                  textTransform: 'uppercase', color: 'var(--muted)',
                  textAlign: 'left', padding: '9px 12px',
                  borderBottom: '1px solid rgba(255,255,255,.05)',
                }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6}>
                  <div style={{ textAlign: 'center', padding: '36px 20px', color: 'var(--muted)' }}>
                    <div style={{ fontSize: 28, opacity: .3, marginBottom: 10 }}>▲</div>
                    <div style={{ fontSize: 12, lineHeight: 1.6 }}>
                      Performance data appears after your first video is published and synced.
                    </div>
                  </div>
                </td>
              </tr>
            ) : (
              filtered.map((item, i) => {
                const tag = PILLAR_TAG_STYLES[item.pillar]
                const pillarLabel = PILLARS[item.pillar]?.label || item.pillar
                return (
                  <tr key={item.id}
                    onMouseEnter={e => Array.from(e.currentTarget.cells).forEach(c => c.style.background = 'rgba(255,255,255,.02)')}
                    onMouseLeave={e => Array.from(e.currentTarget.cells).forEach(c => c.style.background = 'none')}
                  >
                    <td style={{ padding: '11px 12px', borderBottom: '1px solid rgba(255,255,255,.03)', fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--muted)' }}>
                      {i + 1}
                    </td>
                    <td style={{ padding: '11px 12px', borderBottom: '1px solid rgba(255,255,255,.03)', fontWeight: 500, color: 'var(--cream)', fontSize: 12, maxWidth: 260 }}>
                      {item.title}
                    </td>
                    <td style={{ padding: '11px 12px', borderBottom: '1px solid rgba(255,255,255,.03)' }}>
                      {tag && (
                        <span style={{
                          fontFamily: 'var(--font-mono)', fontSize: 8,
                          padding: '2px 7px', borderRadius: 8, whiteSpace: 'nowrap',
                          background: tag.bg, color: tag.color,
                        }}>
                          {pillarLabel}
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '11px 12px', borderBottom: '1px solid rgba(255,255,255,.03)', fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--gold-400)', fontWeight: 500 }}>
                      {(item.view_count || 0).toLocaleString()}
                    </td>
                    <td style={{ padding: '11px 12px', borderBottom: '1px solid rgba(255,255,255,.03)', fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--gold-400)', fontWeight: 500 }}>
                      {(item.like_count || 0).toLocaleString()}
                    </td>
                    <td style={{ padding: '11px 12px', borderBottom: '1px solid rgba(255,255,255,.03)', fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--gold-400)', fontWeight: 500 }}>
                      {item.ctr ? `${(item.ctr * 100).toFixed(1)}%` : '—'}
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
