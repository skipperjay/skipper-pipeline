export const PILLARS = {
  build_the_person: { label: 'Build the Person', color: '#63b3ed' },
  understand_the_economy: { label: 'Understand the Economy', color: '#c9a030' },
  build_the_asset: { label: 'Build the Asset', color: '#2ec880' },
}

export const PIPELINE_STAGES = ['backlog','in_progress','review','approved','done']
export const PIPELINE_LABELS = {
  backlog: 'Backlog',
  in_progress: 'In Progress',
  review: 'Review',
  approved: 'Approved',
  done: 'Done',
}

export function guessPillar(title = '') {
  const t = title.toLowerCase()
  if (t.includes('gdp')||t.includes('econom')||t.includes('market')||t.includes('inflation')||t.includes('federal')) return 'understand_the_economy'
  if (t.includes('asset')||t.includes('skill')||t.includes('wealth')||t.includes('w-2')) return 'build_the_asset'
  return 'build_the_person'
}

export function getMonday(d = new Date()) {
  const dt = new Date(d)
  const day = dt.getDay()
  dt.setDate(dt.getDate() - day + (day === 0 ? -6 : 1))
  return dt
}

export function fmtDate(iso, opts = { month: 'short', day: 'numeric' }) {
  return new Date(iso).toLocaleDateString('en-US', opts)
}
