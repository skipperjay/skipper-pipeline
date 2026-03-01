import React, { useState } from 'react'
import { PILLARS } from '../lib/constants'

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'build_the_person', label: 'Build the Person' },
  { id: 'understand_the_economy', label: 'Understand the Economy' },
  { id: 'build_the_asset', label: 'Build the Asset' },
]

export default function Performance({ content = [] }) {
  const [filter, setFilter] = useState('all')

  const published = content.filter(c => c.status === 'published')
  const filtered = filter === 'all' ? published : published.filter(c => c.pillar === filter)

  return (
    <div>
      <div style={{ display: 'flex', gap: 5, marginBottom: 16 }}>
        {FILTERS.map(f => (
          <button key={f.id} onClick={() => setFilter(f.id)} style={{
            fontFamily: 'var(--font-mono)', fontSize: 9,
            letterSpacing: 1, textTransform: 'uppercase',
            padding: '5px 12px', borderRadius: 20,
            border: `1px solid ${filter === f.id ? 'rgba(201,160,48,.25)' : 'rgba(255,255,255,.08)'}`,
            background: filter === f.id ? 'rgba(201,160,48,.1)' : 'none',
            color: filter === f.id ? 'var(--gold-400)' : 'var(--muted)',
            cursor: 'pointer',
          }}>{f.label}</button>
        ))}
      </div>

      <div style={{ background: 'var(--navy-900)', border: '1px solid rgba(255,255,255,.05)', borderRadius: 'var(--r)', overflow: 'hidden' }}>
        <div style={{ padding: '14px 18px', borderBottom: '1px solid rgba(255,255,255,.04)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontFamily: 'var(--font-disp)', fontSize: 14, fontWeight: 700, color: 'var(--cream)' }}>Top Performing Content</div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--muted)', letterSpacing: 1 }}>YouTube · All time</div>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              {['#','Title','Pillar','Views','Likes','CTR'].map(h => (
                <th key={h} style={{
                  fontFamily: 'var(--font-mono)', fontSize: 8, letterSpacing: 1.5,
                  textTransform: 'uppercase', color: 'var(--muted)',
                  textAlign: 'left', padding: '9px 12px',
                  borderBottom: '1px solid rgba(255,255,255,.05)',
                }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={6} style={{ padding: 0 }}>
                <div style={{ textAlign: 'center', padding: '36px 20px', color: 'var(--muted)' }}>
                  <div style={{ fontSize: 28, opacity: .3, marginBottom: 10 }}>▲</div>
                  <div style={{ fontSize: 12 }}>Performance data appears after your first video is published and synced.</div>
                </div>
              </td></tr>
            ) : filtered.map((c, i) => {
              const pillar = PILLARS[c.pillar] || { label: c.pillar, color: 'var(--muted)' }
              return (
                <tr key={c.id} style={{ borderBottom: '1px solid rgba(255,255,255,.03)' }}>
                  <td style={{ padding: '11px 12px', fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--muted)' }}>{i + 1}</td>
                  <td style={{ padding: '11px 12px', fontWeight: 500, color: 'var(--cream)', fontSize: 12, maxWidth: 260 }}>{c.title}</td>
                  <td style={{ padding: '11px 12px' }}>
                    <span style={{
                      fontFamily: 'var(--font-mono)', fontSize: 8,
                      padding: '2px 7px', borderRadius: 8,
                      background: pillar.color + '1a', color: pillar.color,
                    }}>{pillar.label}</span>
                  </td>
                  <td style={{ padding: '11px 12px', fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--gold-400)', fontWeight: 500 }}>
                    {c.metrics?.views?.toLocaleString() || '—'}
                  </td>
                  <td style={{ padding: '11px 12px', fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--gold-400)', fontWeight: 500 }}>
                    {c.metrics?.likes?.toLocaleString() || '—'}
                  </td>
                  <td style={{ padding: '11px 12px', fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--gold-400)', fontWeight: 500 }}>
                    {c.metrics?.ctr ? `${c.metrics.ctr}%` : '—'}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
