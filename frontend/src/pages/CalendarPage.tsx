import { type FormEvent, useEffect, useMemo, useState } from 'react';
import { api } from '../api/client';
import { Modal } from '../components/Modal';
import type { Appointment, Contact } from '../api/types';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

type FormState = {
  title: string;
  description: string;
  date: string;
  start_time: string;
  end_time: string;
  location: string;
  contact_id: string;
};

function toDateKey(d: Date) {
  return d.toISOString().slice(0, 10);
}

export function CalendarPage() {
  const [monthCursor, setMonthCursor] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<FormState | null>(null);
  const [saving, setSaving] = useState(false);

  const rangeStart = useMemo(
    () => new Date(monthCursor.getFullYear(), monthCursor.getMonth(), 1 - 7),
    [monthCursor]
  );
  const rangeEnd = useMemo(
    () => new Date(monthCursor.getFullYear(), monthCursor.getMonth() + 1, 7),
    [monthCursor]
  );

  function load() {
    api
      .get<Appointment[]>('/appointments', {
        params: { start: rangeStart.toISOString(), end: rangeEnd.toISOString() },
      })
      .then((r) => setAppointments(r.data));
    api.get<Contact[]>('/contacts').then((r) => setContacts(r.data));
  }

  useEffect(load, [monthCursor]);

  const appointmentsByDay = useMemo(() => {
    const map = new Map<string, Appointment[]>();
    for (const a of appointments) {
      const key = toDateKey(new Date(a.start_time));
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(a);
    }
    return map;
  }, [appointments]);

  const days = useMemo(() => {
    const firstOfMonth = new Date(monthCursor.getFullYear(), monthCursor.getMonth(), 1);
    const startOffset = firstOfMonth.getDay();
    const gridStart = new Date(firstOfMonth);
    gridStart.setDate(gridStart.getDate() - startOffset);
    return Array.from({ length: 42 }, (_, i) => {
      const d = new Date(gridStart);
      d.setDate(gridStart.getDate() + i);
      return d;
    });
  }, [monthCursor]);

  function openCreate(date: Date) {
    const dateStr = toDateKey(date);
    setForm({
      title: '',
      description: '',
      date: dateStr,
      start_time: '09:00',
      end_time: '10:00',
      location: '',
      contact_id: '',
    });
    setShowForm(true);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!form) return;
    setSaving(true);
    const start = new Date(`${form.date}T${form.start_time}`);
    const end = new Date(`${form.date}T${form.end_time}`);
    const payload = {
      title: form.title,
      description: form.description || null,
      start_time: start.toISOString(),
      end_time: end.toISOString(),
      location: form.location || null,
      contact_id: form.contact_id ? Number(form.contact_id) : null,
    };
    try {
      await api.post('/appointments', payload);
      setShowForm(false);
      load();
    } finally {
      setSaving(false);
    }
  }

  const today = toDateKey(new Date());
  const monthLabel = monthCursor.toLocaleString(undefined, { month: 'long', year: 'numeric' });

  return (
    <div>
      <div className="calendar-header">
        <h1 className="page-title" style={{ marginBottom: 0 }}>
          {monthLabel}
        </h1>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() =>
              setMonthCursor(new Date(monthCursor.getFullYear(), monthCursor.getMonth() - 1, 1))
            }
          >
            ← Prev
          </button>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => {
              const now = new Date();
              setMonthCursor(new Date(now.getFullYear(), now.getMonth(), 1));
            }}
          >
            Today
          </button>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() =>
              setMonthCursor(new Date(monthCursor.getFullYear(), monthCursor.getMonth() + 1, 1))
            }
          >
            Next →
          </button>
        </div>
      </div>

      <div className="calendar-grid">
        {WEEKDAYS.map((d) => (
          <div key={d} className="calendar-weekday">
            {d}
          </div>
        ))}
        {days.map((d) => {
          const key = toDateKey(d);
          const inMonth = d.getMonth() === monthCursor.getMonth();
          const dayAppointments = appointmentsByDay.get(key) ?? [];
          return (
            <div
              key={key}
              className={
                'calendar-cell' + (inMonth ? '' : ' outside') + (key === today ? ' today' : '')
              }
              onClick={() => openCreate(d)}
            >
              <div className="calendar-date">{d.getDate()}</div>
              {dayAppointments.slice(0, 3).map((a) => (
                <div key={a.id} className="calendar-event" title={a.title}>
                  {new Date(a.start_time).toLocaleTimeString(undefined, {
                    hour: 'numeric',
                    minute: '2-digit',
                  })}{' '}
                  {a.title}
                </div>
              ))}
              {dayAppointments.length > 3 && (
                <div className="muted">+{dayAppointments.length - 3} more</div>
              )}
            </div>
          );
        })}
      </div>

      {showForm && form && (
        <Modal title="Add appointment" onClose={() => setShowForm(false)}>
          <form onSubmit={handleSubmit}>
            <label>
              Title
              <input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                required
              />
            </label>
            <label>
              Date
              <input
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                required
              />
            </label>
            <div style={{ display: 'flex', gap: 12 }}>
              <label style={{ flex: 1 }}>
                Start time
                <input
                  type="time"
                  value={form.start_time}
                  onChange={(e) => setForm({ ...form, start_time: e.target.value })}
                  required
                />
              </label>
              <label style={{ flex: 1 }}>
                End time
                <input
                  type="time"
                  value={form.end_time}
                  onChange={(e) => setForm({ ...form, end_time: e.target.value })}
                  required
                />
              </label>
            </div>
            <label>
              Location
              <input
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
              />
            </label>
            <label>
              Related contact
              <select
                value={form.contact_id}
                onChange={(e) => setForm({ ...form, contact_id: e.target.value })}
              >
                <option value="">— None —</option>
                {contacts.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.first_name} {c.last_name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Description
              <textarea
                rows={3}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </label>
            <div className="modal-actions">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setShowForm(false)}
              >
                Cancel
              </button>
              <button className="btn btn-primary" type="submit" disabled={saving}>
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
