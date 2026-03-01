import React, { useEffect, useRef, useState } from 'react'
import { execStatus, gaugeColor } from '../constants'

const ARC_LENGTH = 251.2

export default function ExecutionGauge({ published = 0, planned = 0, label = 'Execution Rate' }) {
  const pct = planned > 0 ? Math.min(100, (published / planned) * 100) : 0
  const [animPct, setAnimPct] = useState(0)
  const status = execStatus(animPct)
  const color = gaugeColor(animPct)

  useEffect(() => {
    const timer = setTimeout(() => setAnimPct(pct), 200)
    return () => clearTimeout(timer)
  }, [pct])

  const offset = ARC_LENGTH - (animPct / 100) * ARC_LENGTH

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
      {/* gold line at top */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 2,
        background: 'linear-gradient(90deg, transparent, var(--gold-400), transparent)',
      }} />

      <div style={{
        fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: 2.5,
        textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 20,
      }}>
        {label}
      </div>

      {/* SVG Arc */}
      <div style={{ position: 'relative', width: 200, height: 120, marginBottom: 16 }}>
        <svg viewBox="0 0 200 120" width="200" height="120">
          {/* Track */}
          <path
            d="M 20 110 A 80 80 0 0 1 180 110"
            fill="none"
            stroke="rgba(255,255,255,.05)"
            strokeWidth="14"
            strokeLinecap="round"
          />
          {/* Fill */}
          <path
            d="M 20 110 A 80 80 0 0 1 180 110"
            fill="none"
            stroke={color}
            strokeWidth="14"
            strokeLinecap="round"
            strokeDasharray={ARC_LENGTH}
            strokeDashoffset={offset}
            style={{
              transition: 'stroke-dashoffset 1.2s cubic-bezier(.34,1.56,.64,1), stroke .6s ease',
              filter: `drop-shadow(0 0 8px ${color}80)`,
            }}
          />
        </svg>

        {/* Center number */}
        <div style={{
          position: 'absolute', bottom: 8, left: '50%', transform: 'translateX(-50%)',
          textAlign: 'center',
        }}>
          <div style={{
            fontFamily: 'var(--font-disp)', fontSize: 42, fontWeight: 900,
            color, lineHeight: 1,
            transition: 'color .6s ease',
          }}>
            {Math.round(animPct)}%
          </div>
        </div>
      </div>

      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--muted)', marginTop: 4 }}>
        {published} of {planned} planned pieces published
      </div>

      <div style={{
        fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: 1,
        padding: '4px 14px', borderRadius: 20, marginTop: 10,
        background: `${color}18`, color,
      }}>
        {status.label}
      </div>
    </div>
  )
}
