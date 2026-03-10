const BASE = '/api'

async function req(path, opts = {}) {
  const res = await fetch(BASE + path, {
    headers: { 'Content-Type': 'application/json' },
    ...opts,
  })
  if (!res.ok) throw new Error(`API error ${res.status}`)
  return res.json()
}

export const api = {
  dashboard:   ()           => req('/dashboard'),
  content:     ()           => req('/content'),
  ideas:       ()           => req('/ideas'),
  reviews:     ()           => req('/reviews'),
  growth:      (days = 84)  => req(`/analytics/growth?days=${days}`),
  pillar:      ()           => req('/analytics/pillar'),
  pipeline:    ()           => req('/content/pipeline/status'),

  addIdea: (body) => req('/ideas', { method: 'POST', body: JSON.stringify(body) }),
  promoteIdea: (id) => req(`/ideas/${id}/promote`, { method: 'POST' }),
  saveReview: (body) => req('/reviews', { method: 'POST', body: JSON.stringify(body) }),
  syncYoutube: () => req('/pipeline/youtube', { method: 'POST' }),

  sessionAnalysis:  (id) => req(`/waypoint/workouts/session-analysis/${id}`),
  weeklyAnalysis:   (week) => req(`/waypoint/workouts/weekly-analysis${week ? `?week=${week}` : ''}`),
}
