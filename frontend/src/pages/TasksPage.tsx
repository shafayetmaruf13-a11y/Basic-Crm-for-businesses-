import { type FormEvent, useEffect, useState } from 'react';
import { api } from '../api/client';
import { Modal } from '../components/Modal';
import type { Contact, Task } from '../api/types';

type FormState = {
  title: string;
  description: string;
  due_date: string;
  contact_id: string;
};

const emptyForm: FormState = { title: '', description: '', due_date: '', contact_id: '' };

export function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState<'open' | 'completed' | 'all'>('open');

  function load() {
    setLoading(true);
    Promise.all([api.get<Task[]>('/tasks'), api.get<Contact[]>('/contacts')])
      .then(([tasksRes, contactsRes]) => {
        setTasks(tasksRes.data);
        setContacts(contactsRes.data);
      })
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  function contactName(id?: number | null) {
    if (!id) return '—';
    const c = contacts.find((c) => c.id === id);
    return c ? `${c.first_name} ${c.last_name}` : '—';
  }

  function openCreate() {
    setForm(emptyForm);
    setShowForm(true);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    const payload = {
      title: form.title,
      description: form.description || null,
      due_date: form.due_date ? new Date(form.due_date).toISOString() : null,
      contact_id: form.contact_id ? Number(form.contact_id) : null,
    };
    try {
      await api.post('/tasks', payload);
      setShowForm(false);
      load();
    } finally {
      setSaving(false);
    }
  }

  async function toggleCompleted(task: Task) {
    setTasks((prev) =>
      prev.map((t) => (t.id === task.id ? { ...t, completed: !t.completed } : t))
    );
    await api.put(`/tasks/${task.id}`, { completed: !task.completed });
  }

  async function handleDelete(task: Task) {
    if (!confirm(`Delete task "${task.title}"?`)) return;
    await api.delete(`/tasks/${task.id}`);
    load();
  }

  const filtered = tasks.filter((t) => {
    if (filter === 'open') return !t.completed;
    if (filter === 'completed') return t.completed;
    return true;
  });

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title" style={{ marginBottom: 0 }}>
          Tasks
        </h1>
        <button className="btn btn-primary" onClick={openCreate}>
          + Add task
        </button>
      </div>

      <div style={{ marginBottom: 16, display: 'flex', gap: 8 }}>
        {(['open', 'completed', 'all'] as const).map((f) => (
          <button
            key={f}
            className={filter === f ? 'btn btn-primary btn-sm' : 'btn btn-secondary btn-sm'}
            onClick={() => setFilter(f)}
          >
            {f[0].toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : filtered.length === 0 ? (
        <p className="empty-hint">No tasks here.</p>
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th></th>
              <th>Title</th>
              <th>Contact</th>
              <th>Due</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((t) => (
              <tr key={t.id}>
                <td>
                  <input
                    type="checkbox"
                    checked={t.completed}
                    onChange={() => toggleCompleted(t)}
                    style={{ width: 'auto' }}
                  />
                </td>
                <td style={{ textDecoration: t.completed ? 'line-through' : 'none' }}>
                  {t.title}
                </td>
                <td>{contactName(t.contact_id)}</td>
                <td>{t.due_date ? new Date(t.due_date).toLocaleDateString() : '—'}</td>
                <td className="actions">
                  <button className="btn btn-danger btn-sm" onClick={() => handleDelete(t)}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {showForm && (
        <Modal title="Add task" onClose={() => setShowForm(false)}>
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
              Description
              <textarea
                rows={3}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </label>
            <label>
              Due date
              <input
                type="date"
                value={form.due_date}
                onChange={(e) => setForm({ ...form, due_date: e.target.value })}
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
