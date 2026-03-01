import { useState, useCallback, useRef } from 'react'

let _showToast = null

export function useToast() {
  return useCallback((msg, icon = '✓') => {
    if (_showToast) _showToast(msg, icon)
  }, [])
}

export function Toast() {
  const [state, setState] = useState({ visible: false, msg: '', icon: '✓' })
  const timer = useRef(null)

  _showToast = (msg, icon) => {
    if (timer.current) clearTimeout(timer.current)
    setState({ visible: true, msg, icon })
    timer.current = setTimeout(() => setState(s => ({ ...s, visible: false })), 3200)
  }

  return (
    <div style={{
      position: 'fixed', bottom: 22, right: 22,
      background: 'var(--navy-700)',
      border: '1px solid rgba(201,160,48,.2)',
      borderRadius: 'var(--r)',
      padding: '12px 18px',
      fontSize: 12, color: 'var(--cream)', zIndex: 999,
      display: 'flex', alignItems: 'center', gap: 8,
      maxWidth: 300,
      transform: state.visible ? 'translateY(0)' : 'translateY(70px)',
      opacity: state.visible ? 1 : 0,
      transition: 'all .3s cubic-bezier(.34,1.56,.64,1)',
      pointerEvents: 'none',
    }}>
      <span style={{ color: 'var(--gold-400)' }}>{state.icon}</span>
      {state.msg}
    </div>
  )
}
