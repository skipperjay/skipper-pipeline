import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '../lib/api'
import WorkoutInsight from './WorkoutInsight'

function VolumeBar({ name, volume, maxVolume }) {
  const pct = maxVolume > 0 ? Math.min(100, (volume / maxVolume) * 100) : 0
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--cream)', textTransform: 'uppercase', letterSpacing: 1 }}>{name}</span>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--gold-400)' }}>{volume.toLocaleString()} lbs</span>
      </div>
      <div style={{ height: 6, borderRadius: 3, background: 'rgba(255,255,255,.06)', overflow: 'hidden' }}>
        <div style={{ height: '100%', borderRadius: 3, width: `${pct}%`, background: 'var(--gold-400)', transition: 'width 0.8s ease' }} />
      </div>
    </div>
  )
}

function ChangeIndicator({ pctChange }) {
  if (pctChange > 5) return <span style={{ color: 'var(--success)', fontFamily: 'var(--font-mono)', fontSize: 11 }}>↑ +{pctChange}%</span>
  if (pctChange < -5) return <span style={{ color: 'var(--danger)', fontFamily: 'var(--font-mono)', fontSize: 11 }}>↓ {pctChange}%</span>
  return <span style={{ color: 'var(--muted)', fontFamily: 'var(--font-mono)', fontSize: 11 }}>→ flat</span>
}

export default function Workouts({ sessions = [] }) {
  const mostRecent = sessions[0]

  const { data: sessionData } = useQuery({
    queryKey: ['session-analysis', mostRecent?.id],
    queryFn: () => api.sessionAnalysis(mostRecent.id),
    enabled: !!mostRecent?.id,
  })

  const { data: weeklyData } = useQuery({
    queryKey: ['weekly-analysis'],
    queryFn: () => api.weeklyAnalysis(),
  })

  const maxVolume = sessionData?.muscle_groups
    ? Math.max(...sessionData.muscle_groups.map(mg => mg.volume), 1)
    : 1

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* ── SESSION RECAP ── */}
      {mostRecent && (
        <div style={{
          background: 'var(--navy-900)',
          border: '1px solid rgba(255,255,255,.05)',
          borderRadius: 'var(--r)', overflow: 'hidden',
          animation: 'riseIn .5s ease both',
        }}>
          <div style={{
            padding: '14px 20px',
            borderBottom: '1px solid rgba(255,255,255,.04)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <div style={{ fontFamily: 'var(--font-disp)', fontSize: 14, fontWeight: 700, color: 'var(--cream)' }}>Last Session</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--muted)', letterSpacing: 1 }}>
              {mostRecent.session_date ? new Date(mostRecent.session_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : ''}
            </div>
          </div>
          <div style={{ padding: 20 }}>
            <div style={{ display: 'flex', gap: 24, marginBottom: 16 }}>
              <div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, letterSpacing: 2, color: 'var(--muted)', textTransform: 'uppercase', marginBottom: 2 }}>Exercises</div>
                <div style={{ fontFamily: 'var(--font-disp)', fontSize: 22, fontWeight: 700, color: 'var(--gold-400)' }}>{mostRecent.exercises?.length || 0}</div>
              </div>
              <div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, letterSpacing: 2, color: 'var(--muted)', textTransform: 'uppercase', marginBottom: 2 }}>Sets</div>
                <div style={{ fontFamily: 'var(--font-disp)', fontSize: 22, fontWeight: 700, color: 'var(--gold-400)' }}>{mostRecent.total_sets || 0}</div>
              </div>
            </div>

            {/* Volume breakdown bars */}
            {sessionData?.muscle_groups?.length > 0 && (
              <div style={{ marginTop: 8 }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, letterSpacing: 2, color: 'var(--muted)', textTransform: 'uppercase', marginBottom: 12 }}>Volume by Muscle Group</div>
                {sessionData.muscle_groups.map(mg => (
                  <VolumeBar key={mg.name} name={mg.name} volume={mg.volume} maxVolume={maxVolume} />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Session AI Insight */}
      {sessionData && <WorkoutInsight mode="session" data={sessionData} />}

      {/* ── PR BOARD placeholder (existing sessions list) ── */}
      <div style={{
        background: 'var(--navy-900)',
        border: '1px solid rgba(255,255,255,.05)',
        borderRadius: 'var(--r)', overflow: 'hidden',
        animation: 'riseIn .5s .1s ease both',
      }}>
        <div style={{
          padding: '14px 20px',
          borderBottom: '1px solid rgba(255,255,255,.04)',
        }}>
          <div style={{ fontFamily: 'var(--font-disp)', fontSize: 14, fontWeight: 700, color: 'var(--cream)' }}>Recent Sessions</div>
        </div>
        <div style={{ padding: 20 }}>
          {sessions.slice(0, 5).map((s, i) => (
            <div key={s.id} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '10px 0',
              borderBottom: i < 4 ? '1px solid rgba(255,255,255,.04)' : 'none',
            }}>
              <div>
                <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--cream)' }}>
                  {(s.exercises || []).join(', ') || 'No exercises'}
                </div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--muted)', marginTop: 2 }}>
                  {s.session_date ? new Date(s.session_date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) : ''}
                </div>
              </div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--gold-400)' }}>
                {s.total_sets} sets
              </div>
            </div>
          ))}
          {sessions.length === 0 && (
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--muted)' }}>No sessions logged yet</div>
          )}
        </div>
      </div>

      {/* ── THIS WEEK ── */}
      {weeklyData && (
        <div style={{
          background: 'var(--navy-900)',
          border: '1px solid rgba(255,255,255,.05)',
          borderRadius: 'var(--r)', overflow: 'hidden',
          animation: 'riseIn .5s .2s ease both',
        }}>
          <div style={{
            padding: '14px 20px',
            borderBottom: '1px solid rgba(255,255,255,.04)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <div style={{ fontFamily: 'var(--font-disp)', fontSize: 14, fontWeight: 700, color: 'var(--cream)' }}>This Week</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--muted)', letterSpacing: 1 }}>
              WK OF {weeklyData.week_start}
            </div>
          </div>
          <div style={{ padding: 20 }}>
            {/* Consistency score */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, letterSpacing: 2, color: 'var(--muted)', textTransform: 'uppercase', marginBottom: 8 }}>Consistency</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ fontFamily: 'var(--font-disp)', fontSize: 28, fontWeight: 700, color: 'var(--gold-400)' }}>
                  {weeklyData.sessions_completed}/{weeklyData.sessions_target}
                </div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--muted)' }}>sessions</div>
                {/* Progress bar */}
                <div style={{ flex: 1, height: 6, borderRadius: 3, background: 'rgba(255,255,255,.06)', overflow: 'hidden' }}>
                  <div style={{
                    height: '100%', borderRadius: 3,
                    width: `${Math.min(100, (weeklyData.sessions_completed / weeklyData.sessions_target) * 100)}%`,
                    background: weeklyData.sessions_completed >= weeklyData.sessions_target ? 'var(--success)' : 'var(--gold-400)',
                    transition: 'width 0.8s ease',
                  }} />
                </div>
              </div>
            </div>

            {/* Volume change indicators */}
            {weeklyData.muscle_groups?.length > 0 && (
              <div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, letterSpacing: 2, color: 'var(--muted)', textTransform: 'uppercase', marginBottom: 10 }}>Volume vs Last Week</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {weeklyData.muscle_groups.map(mg => (
                    <div key={mg.name} style={{
                      background: 'rgba(255,255,255,.03)',
                      borderRadius: 'var(--rs)',
                      padding: '8px 12px',
                      display: 'flex', alignItems: 'center', gap: 8,
                    }}>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--cream)', textTransform: 'uppercase', letterSpacing: 0.5 }}>{mg.name}</span>
                      <ChangeIndicator pctChange={mg.pct_change} />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Weekly AI Insight */}
      {weeklyData && <WorkoutInsight mode="weekly" data={weeklyData} />}
    </div>
  )
}
