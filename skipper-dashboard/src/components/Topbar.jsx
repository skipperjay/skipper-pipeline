import React, { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'

const PAGE_META = {
  overview:    ['Dashboard',       'SKIPPER MEDIA / OVERVIEW'],
  health:      ['Process Health',  'SKIPPER MEDIA / PROCESS'],
  review:      ['Weekly Review',   'SKIPPER MEDIA / REVIEW'],
  pipeline:    ['Content Pipeline','SKIPPER MEDIA / CONTENT'],
  performance: ['Performance',     'SKIPPER MEDIA / ANALYTICS'],
  ideas:       ['Ideas Backlog',   'SKIPPER MEDIA / IDEAS'],
}

export default function Topbar({ page, onToast }) {
  const [syncing, setSyncing] = useState(false)
  const qc = useQueryClient()
  const [heading, crumb] = PAGE_META[page] || ['Dashboard','']

  async function syncAll() {
    setSyncing(true)
    await qc.invalidateQueries()
    setTimeout(() => {
      setSyncing(false)
      onToast('Pipeline synced', '↻')
    }, 800)
  }

  return (
    <div style={{
      height: 56,
      background: 'rgba(9,21,37,.85)',
      backdropFilter: 'blur(16px)',
      borderBottom: '1px solid rgba(201,160,48,.08)',
      display: 'flex', alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 28px',
      position: 'sticky', top: 0, zIndex: 50,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{ fontFamily: 'var(--font-disp)', fontSize: 17, fontWeight: 700, color: 'var(--cream)' }}>
          {heading}
        </div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--muted)' }}>
          {crumb}
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{
          fontFamily: 'var(--font-mono)', fontSize: 10,
          color: 'var(--muted)', background: 'rgba(255,255,255,.04)',
          padding: '4px 10px', borderRadius: 20,
          border: '1px solid rgba(255,255,255,.05)',
        }}>
          {new Date().toLocaleDateString('en-US',{weekday:'short',month:'short',day:'numeric',year:'numeric'})}
        </div>
        <button onClick={syncAll} style={{
          display: 'flex', alignItems: 'center', gap: 5,
          padding: '6px 14px', background: 'var(--gold-400)',
          color: 'var(--navy-900)', border: 'none',
          borderRadius: 'var(--rs)', fontSize: 11, fontWeight: 600,
          cursor: 'pointer',
        }}>
          <span style={{ display: 'inline-block', animation: syncing ? 'spin .6s linear infinite' : 'none' }}>↻</span>
          {syncing ? ' Syncing...' : ' Sync'}
        </button>
      </div>
    </div>
  )
}
