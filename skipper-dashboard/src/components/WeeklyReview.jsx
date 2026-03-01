import React, { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'
import { getMonday, fmtDate } from '../lib/constants'

function Field({ label, children }) {
  return (
    <div>
      <label style={{ fontFamily: 'var(--font-mono)', fontSize: 8, letterSpacing: 1.5, textTransform: 'uppercase', color: 'var(--muted)', display: 'block', marginBottom: 5 }}>
        {label}
      </label>
      {children}
    </div>
  )
}

const inputStyle = {
  background: 'var(--navy-800)', border: '1px solid rgba(255,255,255,.07)',
  borderRadius: 'var(--rs)', padding: '8px 11px',
  color: 'var(--cream)', fontFamily: 'var(--font-body)',
  fontSize: 12, outline: 'none', width: '100%',
}

export default function WeeklyReview({ reviews = [], onToast }) {
  const qc = useQueryClient()
  const [form, setForm] = useState({ planned: '', published: '', yt_subs: '', ig_followers: '', nl_subs: '', hours: '', biggest_win: '', biggest_blocker: '', lesson_this_week: '', next_week_priority: '' })

  const mut = useMutation({
    mutationFn: api.saveReview,
    onSuccess: () => {
      qc.invalidateQueries(['reviews'])
      qc.invalidateQueries(['dashboard'])
      setForm({ planned: '', published: '', yt_subs: '', ig_followers: '', nl_subs: '', hours: '', biggest_win: '', biggest_blocker: '', lesson_this_week: '', next_week_priority: '' })
      onToast('Review saved — database updated ↑', '◻')
    },
    onError: () => onToast('Failed to save review', '✖'),
  })

  function set(k, v) { setForm(f => ({ ...f, [k]: v })) }

  function save() {
    mut.mutate({
      week_start: getMonday().toISOString().split('T')[0],
      planned: parseInt(form.planned) || 0,
      published: parseInt(form.published) || 0,
      yt_subs: parseInt(form.yt_subs) || 0,
      ig_followers: parseInt(form.ig_followers) || 0,
      nl_subs: parseInt(form.nl_subs) || 0,
      hours_on_content: parseInt(form.hours) || 0,
      biggest_win: form.biggest_win,
      biggest_blocker: form.biggest_blocker,
      lesson_this_week: form.lesson_this_week,
      next_week_priority: form.next_week_priority,
    })
  }

  const panel = {
    background: 'var(--navy-900)', border: '1px solid rgba(255,255,255,.05)',
    borderRadius: 'var(--r)', overflow: 'hidden',
  }
  const head = { padding: '14px 18px', borderBottom: '1px solid rgba(255,255,255,.04)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }
  const title = { fontFamily: 'var(--font-disp)', fontSize: 14, fontWeight: 700, color: 'var(--cream)' }
  const meta = { fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--muted)', letterSpacing: 1 }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 18 }}>
      <div style={panel}>
        <div style={head}>
          <div style={title}>Log This Week</div>
          <div style={meta}>Week of {fmtDate(getMonday())}</div>
        </div>
        <div style={{ padding: 18 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <Field label="Pieces Planned">
              <input type="number" value={form.planned} onChange={e => set('planned', e.target.value)} placeholder="0" style={inputStyle} />
            </Field>
            <Field label="Pieces Published">
              <input type="number" value={form.published} onChange={e => set('published', e.target.value)} placeholder="0" style={inputStyle} />
            </Field>
            <Field label="YT Subscribers">
              <input type="number" value={form.yt_subs} onChange={e => set('yt_subs', e.target.value)} placeholder="0" style={inputStyle} />
            </Field>
            <Field label="IG Followers">
              <input type="number" value={form.ig_followers} onChange={e => set('ig_followers', e.target.value)} placeholder="0" style={inputStyle} />
            </Field>
            <Field label="Newsletter Subs">
              <input type="number" value={form.nl_subs} onChange={e => set('nl_subs', e.target.value)} placeholder="0" style={inputStyle} />
            </Field>
            <Field label="Hours on Content">
              <input type="number" value={form.hours} onChange={e => set('hours', e.target.value)} placeholder="0" style={inputStyle} />
            </Field>
            <div style={{ gridColumn: '1/-1' }}>
              <Field label="Biggest Win">
                <input value={form.biggest_win} onChange={e => set('biggest_win', e.target.value)} placeholder="What went right?" style={inputStyle} />
              </Field>
            </div>
            <div style={{ gridColumn: '1/-1' }}>
              <Field label="Biggest Blocker">
                <input value={form.biggest_blocker} onChange={e => set('biggest_blocker', e.target.value)} placeholder="What slowed you down?" style={inputStyle} />
              </Field>
            </div>
            <div style={{ gridColumn: '1/-1' }}>
              <Field label="Lesson Learned">
                <textarea value={form.lesson_this_week} onChange={e => set('lesson_this_week', e.target.value)} placeholder="What did the data teach you?" style={{ ...inputStyle, resize: 'vertical', minHeight: 70 }} />
              </Field>
            </div>
            <div style={{ gridColumn: '1/-1' }}>
              <Field label="Next Week Priority">
                <input value={form.next_week_priority} onChange={e => set('next_week_priority', e.target.value)} placeholder="Top focus" style={inputStyle} />
              </Field>
            </div>
          </div>
          <button onClick={save} disabled={mut.isPending} style={{
            marginTop: 14, padding: '10px 22px',
            background: 'var(--gold-400)', color: 'var(--navy-900)',
            border: 'none', borderRadius: 'var(--rs)',
            fontSize: 12, fontWeight: 600, cursor: 'pointer',
          }}>
            {mut.isPending ? 'Saving...' : 'Save Review →'}
          </button>
        </div>
      </div>

      <div style={panel}>
        <div style={head}>
          <div style={title}>Review History</div>
          <div style={meta}>Last 12 weeks</div>
        </div>
        <div style={{ padding: 18 }}>
          {reviews.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '36px 20px', color: 'var(--muted)' }}>
              <div style={{ fontSize: 28, opacity: .3, marginBottom: 10 }}>◻</div>
              <div style={{ fontSize: 12 }}>No reviews yet.<br />Log your first weekly check-in.</div>
            </div>
          ) : reviews.slice(0, 10).map((r, i) => {
            const execRate = r.planned > 0 ? Math.round((r.published / r.planned) * 100) : 0
            return (
              <div key={i} style={{ padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,.04)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--gold-400)' }}>
                    {fmtDate(r.week_start, { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--muted)' }}>
                    {r.published||0}/{r.planned||0} published · {execRate}% exec
                  </span>
                </div>
                {r.biggest_win && <div style={{ fontSize: 11, color: 'var(--cream)', marginBottom: 3 }}>✓ {r.biggest_win}</div>}
                {r.lesson_this_week && <div style={{ fontSize: 10, color: 'var(--muted)', fontStyle: 'italic' }}>"{r.lesson_this_week}"</div>}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
