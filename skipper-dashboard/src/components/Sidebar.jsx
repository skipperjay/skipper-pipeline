import React from 'react'

const NAV = [
  { group: 'Overview', items: [{ id: 'overview', icon: '◈', label: 'Dashboard' }] },
  { group: 'Process', items: [
    { id: 'health',  icon: '◎', label: 'Process Health' },
    { id: 'review',  icon: '◻', label: 'Weekly Review' },
  ]},
  { group: 'Content', items: [
    { id: 'pipeline',    icon: '⬡', label: 'Pipeline' },
    { id: 'performance', icon: '▲', label: 'Performance' },
    { id: 'ideas',       icon: '✦', label: 'Ideas' },
  ]},
  { group: 'Waypoint', items: [
    { id: 'workouts', icon: '◆', label: 'Workouts' },
  ]},
]

export default function Sidebar({ page, setPage }) {
  return (
    <aside style={{
      width: 210, minHeight: '100vh',
      background: 'var(--navy-900)',
      borderRight: '1px solid rgba(201,160,48,.1)',
      display: 'flex', flexDirection: 'column',
      position: 'fixed', top: 0, left: 0, bottom: 0,
      zIndex: 100,
    }}>
      <div style={{
        padding: '24px 20px 18px',
        borderBottom: '1px solid rgba(201,160,48,.08)',
      }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: 3, color: 'var(--gold-400)', marginBottom: 2 }}>
          ⚓ SKIPPER
        </div>
        <div style={{ fontFamily: 'var(--font-disp)', fontSize: 16, fontWeight: 900, color: 'var(--cream)', lineHeight: 1.2 }}>
          Focus on the Process
        </div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, letterSpacing: 2, color: 'var(--muted)', marginTop: 4 }}>
          COMMAND CENTER v2.0
        </div>
      </div>

      <nav style={{ padding: '14px 10px', flex: 1 }}>
        {NAV.map(({ group, items }) => (
          <div key={group} style={{ marginBottom: 6 }}>
            <div style={{
              fontFamily: 'var(--font-mono)', fontSize: 8, letterSpacing: 2,
              color: 'var(--muted)', textTransform: 'uppercase',
              padding: '8px 10px 4px',
            }}>{group}</div>
            {items.map(({ id, icon, label }) => (
              <button key={id} onClick={() => setPage(id)} style={{
                display: 'flex', alignItems: 'center', gap: 9,
                padding: '8px 10px', borderRadius: 'var(--rs)',
                cursor: 'pointer', border: 'none', width: '100%',
                textAlign: 'left', fontSize: 12, fontWeight: 500,
                transition: 'all var(--t)',
                background: page === id ? 'rgba(201,160,48,.08)' : 'none',
                color: page === id ? 'var(--gold-400)' : 'var(--muted)',
                position: 'relative',
              }}>
                {page === id && (
                  <span style={{
                    position: 'absolute', left: 0, top: '20%', bottom: '20%',
                    width: 2, borderRadius: 2, background: 'var(--gold-400)',
                  }} />
                )}
                <span style={{ width: 16, textAlign: 'center', fontSize: 13, opacity: .8 }}>{icon}</span>
                {label}
              </button>
            ))}
          </div>
        ))}
      </nav>

      <div style={{ padding: '14px 20px', borderTop: '1px solid rgba(201,160,48,.08)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 6, height: 6, borderRadius: '50%',
            background: 'var(--success)',
            animation: 'pulseAnim 2.5s ease-in-out infinite',
          }} />
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--success)', letterSpacing: 1 }}>
            PIPELINE ACTIVE
          </span>
        </div>
      </div>
    </aside>
  )
}
