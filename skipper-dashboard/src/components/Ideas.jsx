import React, { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { PILLARS } from '../lib/constants'
import { api } from '../lib/api'

const P_COLORS = { 1: 'var(--danger)', 2: 'var(--warn)', 3: 'var(--gold-400)', 4: 'var(--muted)' }
const P_BG     = { 1: 'rgba(224,90,90,.15)', 2: 'rgba(232,148,58,.15)', 3: 'rgba(201,160,48,.15)', 4: 'rgba(255,255,255,.05)' }

export default function Ideas({ ideas = [], onToast }) {
  const qc = useQueryClient()
  const [title, setTitle] = useState('')
  const [pillar, setPillar] = useState('build_the_person')
  const [priority, setPriority] = useState(3)

  const active = ideas.filter(i => i.status === 'backlog' || !i.promoted)
    .sort((a, b) => (a.priority || 3) - (b.priority || 3))

  const addMut = useMutation({
    mutationFn: api.addIdea,
    onSuccess: () => { qc.invalidateQueries(['ideas']); setTitle(''); onToast('Idea added', '✦') },
    onError: () => onToast('Failed to add idea', '✖'),
  })

  const promoteMut = useMutation({
    mutationFn: api.promoteIdea,
    onSuccess: () => { qc.invalidateQueries(['ideas']); qc.invalidateQueries(['dashboard']); onToast('Promoted to pipeline', '⬡') },
    onError: () => onToast('Failed to promote idea', '✖'),
  })

  function handleAdd() {
    if (!title.trim()) { onToast('Enter a title first', '⚠'); return }
    addMut.mutate({ title: title.trim(), pillar, priority: parseInt(priority) })
  }

  return (
    <div style={{ background: 'var(--navy-900)', border: '1px solid rgba(255,255,255,.05)', borderRadius: 'var(--r)', overflow: 'hidden' }}>
      <div style={{
        padding: '14px 18px', borderBottom: '1px solid rgba(255,255,255,.04)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ fontFamily: 'var(--font-disp)', fontSize: 14, fontWeight: 700, color: 'var(--cream)' }}>Ideas Backlog</div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--muted)', letterSpacing: 1 }}>
          {active.length} idea{active.length !== 1 ? 's' : ''}
        </div>
      </div>

      <div style={{ padding: 18 }}>
        {active.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '36px 20px', color: 'var(--muted)' }}>
            <div style={{ fontSize: 28, opacity: .3, marginBottom: 10 }}>✦</div>
            <div style={{ fontSize: 12 }}>No ideas yet. Add one below.</div>
          </div>
        ) : active.map(idea => {
          const p = PILLARS[idea.pillar] || { label: idea.pillar, color: 'var(--muted)' }
          const pri = idea.priority || 3
          return (
            <div key={idea.id} style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '11px 0', borderBottom: '1px solid rgba(255,255,255,.03)',
              cursor: 'pointer',
            }}
              className="idea-row"
            >
              <div style={{
                width: 22, height: 22, borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 500, flexShrink: 0,
                background: P_BG[pri], color: P_COLORS[pri],
              }}>{pri}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--cream)', marginBottom: 2 }}>{idea.title}</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: p.color }}>{p.label}</div>
              </div>
              <button
                onClick={() => promoteMut.mutate(idea.id)}
                disabled={promoteMut.isPending}
                style={{
                  fontFamily: 'var(--font-mono)', fontSize: 9,
                  padding: '3px 9px',
                  background: 'rgba(201,160,48,.08)',
                  color: 'var(--gold-400)',
                  border: '1px solid rgba(201,160,48,.18)',
                  borderRadius: 'var(--rs)', cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}>→ Promote</button>
            </div>
          )
        })}

        <div style={{
          display: 'grid', gridTemplateColumns: '1fr auto auto auto',
          gap: 8, paddingTop: 14,
          borderTop: '1px solid rgba(255,255,255,.04)', marginTop: 6,
        }}>
          <input
            value={title} onChange={e => setTitle(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAdd()}
            placeholder="New idea..."
            style={{
              background: 'var(--navy-800)', border: '1px solid rgba(255,255,255,.07)',
              borderRadius: 'var(--rs)', padding: '8px 11px',
              color: 'var(--cream)', fontSize: 12, outline: 'none',
            }}
          />
          <select value={pillar} onChange={e => setPillar(e.target.value)} style={{
            background: 'var(--navy-800)', border: '1px solid rgba(255,255,255,.07)',
            borderRadius: 'var(--rs)', padding: '8px 11px',
            color: 'var(--cream)', fontSize: 12, outline: 'none', width: 160,
          }}>
            {Object.entries(PILLARS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
          <select value={priority} onChange={e => setPriority(e.target.value)} style={{
            background: 'var(--navy-800)', border: '1px solid rgba(255,255,255,.07)',
            borderRadius: 'var(--rs)', padding: '8px 11px',
            color: 'var(--cream)', fontSize: 12, outline: 'none', width: 70,
          }}>
            <option value={1}>P1</option><option value={2}>P2</option>
            <option value={3}>P3</option><option value={4}>P4</option>
          </select>
          <button onClick={handleAdd} disabled={addMut.isPending} style={{
            padding: '8px 14px', background: 'var(--gold-400)',
            color: 'var(--navy-900)', border: 'none', borderRadius: 'var(--rs)',
            fontSize: 12, fontWeight: 600, cursor: 'pointer',
          }}>+ Add</button>
        </div>
      </div>
    </div>
  )
}
