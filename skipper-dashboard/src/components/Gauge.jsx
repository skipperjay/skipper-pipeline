import React, { useEffect, useState } from 'react'

const ARC_LENGTH = 251.2

function getClass(pct) {
  if (pct >= 80) return 'great'
  if (pct >= 60) return 'good'
  if (pct >= 40) return 'warn'
  return 'critical'
}

const COLORS = {
  great: 'var(--gold-400)',
  good: 'var(--success)',
  warn: 'var(--warn)',
  critical: 'var(--danger)',
}

const SHADOWS = {
  great: 'drop-shadow(0 0 8px rgba(201,160,48,.5))',
  good: 'drop-shadow(0 0 8px rgba(46,200,128,.5))',
  warn: 'drop-shadow(0 0 8px rgba(232,148,58,.5))',
  critical: 'drop-shadow(0 0 8px rgba(224,90,90,.5))',
}

const STATUS = {
  great: '⚓ STRONG EXECUTION',
  good: '✓ ON TRACK',
  warn: '⚠ NEEDS ATTENTION',
  critical: '✖ OFF COURSE',
}

const STATUS_BG = {
  great: 'rgba(201,160,48,.12)',
  good: 'rgba(46,200,128,.12)',
  warn: 'rgba(232,148,58,.12)',
  critical: 'rgba(224,90,90,.12)',
}

export default function Gauge({ pct = 0, published = 0, planned = 0, label = 'Execution Rate' }) {
  const [animated, setAnimated] = useState(false)
  useEffect(() => { const t = setTimeout(() => setAnimated(true), 200); return () => clearTimeout(t) }, [pct])

  const cls = getClass(pct)
  const offset = animated ? ARC_LENGTH - (pct / 100) * ARC_LENGTH : ARC_LENGTH

  return (
    <div style={{
      background: 'var(--navy-900)',
      border: '1px solid rgba(201,160,48,.15)',
      borderRadius: 'var(--r)',
      padding: '28px 24px',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center',
      position: 'relative', overflow: 'hidden',
      animation: 'riseIn .5s ease both',
    }}>
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 2,
        background: 'linear-gradient(90deg, transparent, var(--gold-400), transparent)',
      }} />

      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: 2.5, textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 20 }}>
        {label}
      </div>

      <div style={{ position: 'relative', width: 200, height: 120, marginBottom: 16 }}>
        <svg width="200" height="120" viewBox="0 0 200 120">
          <path
            d="M 20 110 A 80 80 0 0 1 180 110"
            fill="none" stroke="rgba(255,255,255,.05)"
            strokeWidth="14" strokeLinecap="round"
          />
          <path
            d="M 20 110 A 80 80 0 0 1 180 110"
            fill="none"
            stroke={COLORS[cls]}
            strokeWidth="14" strokeLinecap="round"
            strokeDasharray={ARC_LENGTH}
            strokeDashoffset={offset}
            style={{
              transition: 'stroke-dashoffset 1.2s cubic-bezier(.34,1.56,.64,1), stroke .6s ease',
              filter: SHADOWS[cls],
            }}
          />
        </svg>
        <div style={{
          position: 'absolute', bottom: 8, left: '50%',
          transform: 'translateX(-50%)', textAlign: 'center',
        }}>
          <div style={{
            fontFamily: 'var(--font-disp)', fontSize: 42, fontWeight: 900,
            color: COLORS[cls], lineHeight: 1,
            transition: 'color .6s ease',
          }}>
            {Math.round(pct)}%
          </div>
        </div>
      </div>

      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--muted)', marginTop: 4 }}>
        {published} of {planned} planned pieces published
      </div>

      <div style={{
        fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: 1,
        padding: '4px 14px', borderRadius: 20, marginTop: 10,
        background: STATUS_BG[cls], color: COLORS[cls],
      }}>
        {pct >= 100 ? '⚓ PERFECT EXECUTION' : STATUS[cls]}
      </div>
    </div>
  )
}
