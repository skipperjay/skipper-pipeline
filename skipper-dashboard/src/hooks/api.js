import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

const BASE = ''  // uses vite proxy to localhost:3001

async function fetcher(path) {
  const res = await fetch(BASE + path)
  if (!res.ok) throw new Error(`API error ${res.status}`)
  return res.json()
}

export function useDashboard() {
  return useQuery({
    queryKey: ['dashboard'],
    queryFn: () => fetcher('/api/dashboard'),
    refetchInterval: 5 * 60_000,
  })
}

export function useIdeas() {
  return useQuery({
    queryKey: ['ideas'],
    queryFn: () => fetcher('/api/ideas'),
  })
}

export function useReviews() {
  return useQuery({
    queryKey: ['reviews'],
    queryFn: () => fetcher('/api/reviews'),
  })
}

export function useGrowth(days = 84) {
  return useQuery({
    queryKey: ['growth', days],
    queryFn: () => fetcher(`/api/analytics/growth?days=${days}`),
  })
}

export function useContent() {
  return useQuery({
    queryKey: ['content'],
    queryFn: () => fetcher('/api/content'),
  })
}

export function useAddIdea() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body) =>
      fetch('/api/ideas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }).then(r => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['ideas'] }),
  })
}

export function usePromoteIdea() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id) =>
      fetch(`/api/ideas/${id}/promote`, { method: 'POST' }).then(r => r.json()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ideas'] })
      qc.invalidateQueries({ queryKey: ['dashboard'] })
      qc.invalidateQueries({ queryKey: ['content'] })
    },
  })
}

export function useSaveReview() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body) =>
      fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }).then(r => r.json()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['reviews'] })
      qc.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })
}

export function useRefreshAll() {
  const qc = useQueryClient()
  return () => qc.invalidateQueries()
}
