export const PILLARS = {
  build_the_person:       { label: 'Build the Person',       color: '#63b3ed' },
  understand_the_economy: { label: 'Understand the Economy', color: '#c9a030' },
  build_the_asset:        { label: 'Build the Asset',        color: '#2ec880' },
}

export const PIPELINE_STAGES = [
  { key: 'backlog',     label: 'Backlog' },
  { key: 'in_progress', label: 'In Progress' },
  { key: 'review',      label: 'Review' },
  { key: 'approved',    label: 'Approved' },
  { key: 'done',        label: 'Done' },
  { key: 'published',   label: 'Published' },
]

export function getMonday(d = new Date()) {
  const dt = new Date(d)
  const day = dt.getDay()
  dt.setDate(dt.getDate() - day + (day === 0 ? -6 : 1))
  return dt
}

export function daysSince(dateStr) {
  if (!dateStr) return null
  const fmt = d => new Date(d).toLocaleDateString('en-CA', { timeZone: 'America/New_York' })
  const today = fmt(new Date())
  const then = fmt(new Date(dateStr))
  return Math.floor((new Date(today) - new Date(then)) / 86400000)
}

export function execStatus(pct) {
  if (pct >= 80) return { cls: 'great', label: pct >= 100 ? '⚓ PERFECT EXECUTION' : '⚓ STRONG EXECUTION', color: 'var(--gold-400)' }
  if (pct >= 60) return { cls: 'good',  label: '✓ ON TRACK',        color: 'var(--success)' }
  if (pct >= 40) return { cls: 'warn',  label: '⚠ NEEDS ATTENTION', color: 'var(--warn)' }
  return             { cls: 'critical', label: '✖ OFF COURSE',       color: 'var(--danger)' }
}

export function gaugeColor(pct) {
  if (pct >= 80) return 'var(--gold-400)'
  if (pct >= 60) return 'var(--success)'
  if (pct >= 40) return 'var(--warn)'
  return 'var(--danger)'
}
