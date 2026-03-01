import React, { useState } from 'react'
import { PILLARS } from '../constants'
import { useAddIdea, usePromoteIdea } from '../hooks/api'
import { useToast } from './Toast'

export default function IdeasBacklog({ ideas = [] }) {
  const [title, setTitle] = useState('')
  const [pillar, setPillar] = useState('build_the_person')
  const [priority, setPriority] = useState(3)
  const addIdea = useAddIdea()
  const promote = usePromoteIdea()
  const toast = useToast()

  const active = ideas.filter(i => !i.promoted).sort((a, b) => a.priority - b.priority)

  const pNumStyle = (p) => {
    const styles = {
      1: { bg: 'rgba(224,90,90,.15)',  color: 'var(--danger)' },
      2: { bg: 'rgba(232,148,58,.15)', color: 'var(--warn)' },
      3: { bg: 'rgba(201,160,48,.15)', color: 'var(--gold-400)' },
      4: { bg: 'rgba(255,255,255,.05)', color: 'var(--muted)' },
    }
    return styles[p] || styles[4]
  }

  async function handleAdd() {
    if (!title.trim()) { toast('Enter a title first', '⚠'); return }
    await addIdea.mutateAsync({ title: title.trim(), pillar, priority: parseInt(priority) })
    setTitle('')
    toast(`"${title.substring(0, 35)}..." added`, '✦')
  }

  async function handlePromote(id, ideaTitle) {
    await promote.mutateAsync(id)
    toast('Promoted to pipeline', '⬡')
  }

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
          Ideas Backlog
        </div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--muted)', letterSpacing: 1 }}>
          {active.length} idea{active.length !== 1 ? 's' : ''}
        </div>
      </div>

      <div style={{ padding: 18 }}>
        {active.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '36px 20px', color: 'var(--muted)' }}>
            <div style={{ fontSize: 28, opacity: .3, marginBottom: 10 }}>✦</div>
            <div style={{ fontSize: 12, lineHeight: 1.6 }}>No ideas yet. Add one below.</div>
          </div>
        ) : (
          <div>
            {active.map(idea => {
              const p = PILLARS[idea.pillar] || { label: idea.pillar, color: '#fff' }
              const ps = pNumStyle(idea.priority)
              return (
                <div key={idea.id} style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '11px 0',
                  borderBottom: '1px solid rgba(255,255,255,.03)',
                  cursor: 'pointer', transition: 'padding var(--t)',
                  position: 'relative',
                }}
                  className="idea-row"
                  onMouseEnter={e => {
                    e.currentTarget.style.paddingLeft = '5px'
                    e.currentTarget.querySelector('.promote-btn').style.opacity = '1'
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.paddingLeft = '0'
                    e.currentTarget.querySelector('.promote-btn').style.opacity = '0'
                  }}
                >
                  <div style={{
                    width: 22, height: 22, borderRadius: '50%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 500,
                    flexShrink: 0,
                    background: ps.bg, color: ps.color,
                  }}>
                    {idea.priority}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--cream)', marginBottom: 2 }}>
                      {idea.title}
                    </div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: p.color }}>
                      {p.label}
                    </div>
                  </div>
                  <button
                    className="promote-btn"
                    onClick={() => handlePromote(idea.id, idea.title)}
                    style={{
                      fontFamily: 'var(--font-mono)', fontSize: 9,
                      padding: '3px 9px',
                      background: 'rgba(201,160,48,.08)',
                      color: 'var(--gold-400)',
                      border: '1px solid rgba(201,160,48,.18)',
                      borderRadius: 'var(--rs)', cursor: 'pointer',
                      transition: 'all var(--t)', whiteSpace: 'nowrap',
                      opacity: 0,
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(201,160,48,.18)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'rgba(201,160,48,.08)'}
                  >
                    → Promote
                  </button>
                </div>
              )
            })}
          </div>
        )}

        {/* Add row */}
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr auto auto auto',
          gap: 8, paddingTop: 14,
          borderTop: '1px solid rgba(255,255,255,.04)', marginTop: 6,
        }}>
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAdd()}
            placeholder="New idea..."
            style={{
              background: 'var(--navy-800)',
              border: '1px solid rgba(255,255,255,.07)',
              borderRadius: 'var(--rs)', padding: '8px 11px',
              color: 'var(--cream)', fontFamily: 'var(--font-body)',
              fontSize: 12, outline: 'none',
            }}
            onFocus={e => e.target.style.borderColor = 'rgba(201,160,48,.35)'}
            onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,.07)'}
          />
          <select value={pillar} onChange={e => setPillar(e.target.value)} style={{
            width: 160,
            background: 'var(--navy-800)', border: '1px solid rgba(255,255,255,.07)',
            borderRadius: 'var(--rs)', padding: '8px 11px',
            color: 'var(--cream)', fontFamily: 'var(--font-body)', fontSize: 12,
            outline: 'none', cursor: 'pointer',
          }}>
            <option value="build_the_person">Build the Person</option>
            <option value="understand_the_economy">Understand the Economy</option>
            <option value="build_the_asset">Build the Asset</option>
          </select>
          <select value={priority} onChange={e => setPriority(e.target.value)} style={{
            width: 90,
            background: 'var(--navy-800)', border: '1px solid rgba(255,255,255,.07)',
            borderRadius: 'var(--rs)', padding: '8px 11px',
            color: 'var(--cream)', fontFamily: 'var(--font-body)', fontSize: 12,
            outline: 'none', cursor: 'pointer',
          }}>
            <option value={1}>P1</option>
            <option value={2}>P2</option>
            <option value={3}>P3</option>
            <option value={4}>P4</option>
          </select>
          <button
            onClick={handleAdd}
            disabled={addIdea.isPending}
            style={{
              padding: '8px 14px', background: 'var(--gold-400)',
              color: 'var(--navy-900)', border: 'none',
              borderRadius: 'var(--rs)', fontFamily: 'var(--font-body)',
              fontSize: 12, fontWeight: 600, cursor: 'pointer',
              transition: 'all var(--t)',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--gold-300)'}
            onMouseLeave={e => e.currentTarget.style.background = 'var(--gold-400)'}
          >
            + Add
          </button>
        </div>
      </div>
    </div>
  )
}
