import { type FormEvent, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../api/client';
import { Modal } from '../components/Modal';
import { DEAL_STAGES, CALL_OUTCOMES } from '../api/types';
import type { Appointment, Call, Company, Contact, Deal, Task } from '../api/types';

type EditForm = {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  company_id: string;
  notes: string;
};

type CallForm = {
  called_at: string;
  duration_minutes: string;
  outcome: string;
  notes: string;
};

function nowLocalDatetime() {
  const now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  return now.toISOString().slice(0, 16);
}

const emptyCallForm: CallForm = {
  called_at: nowLocalDatetime(),
  duration_minutes: '',
  outcome: CALL_OUTCOMES[0],
  notes: '',
};

export function ContactDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const contactId = Number(id);

  const [contact, setContact] = useState<Contact | null>(null);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [calls, setCalls] = useState<Call[]>([]);
  const [loading, setLoading] = useState(true);

  const [showEdit, setShowEdit] = useState(false);
  const [editForm, setEditForm] = useState<EditForm | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);

  const [showCallForm, setShowCallForm] = useState(false);
  const [callForm, setCallForm] = useState<CallForm>(emptyCallForm);
  const [savingCall, setSavingCall] = useState(false);

  function load() {
    setLoading(true);
    Promise.all([
      api.get<Contact>(`/contacts/${contactId}`),
      api.get<Company[]>('/companies'),
      api.get<Deal[]>('/deals'),
      api.get<Task[]>('/tasks'),
      api.get<Appointment[]>('/appointments'),
      api.get<Call[]>('/calls', { params: { contact_id: contactId } }),
    ])
      .then(([contactRes, companiesRes, dealsRes, tasksRes, appointmentsRes, callsRes]) => {
        setContact(contactRes.data);
        setCompanies(companiesRes.data);
        setDeals(dealsRes.data.filter((d) => d.contact_id === contactId));
        setTasks(tasksRes.data.filter((t) => t.contact_id === contactId));
        setAppointments(appointmentsRes.data.filter((a) => a.contact_id === contactId));
        setCalls(callsRes.data);
      })
      .finally(() => setLoading(false));
  }

  useEffect(load, [contactId]);

  function openEdit() {
    if (!contact) return;
    setEditForm({
      first_name: contact.first_name,
      last_name: contact.last_name,
      email: contact.email ?? '',
      phone: contact.phone ?? '',
      company_id: contact.company_id ? String(contact.company_id) : '',
      notes: contact.notes ?? '',
    });
    setShowEdit(true);
  }

  async function handleEditSubmit(e: FormEvent) {
    e.preventDefault();
    if (!editForm) return;
    setSavingEdit(true);
    const payload = {
      first_name: editForm.first_name,
      last_name: editForm.last_name,
      email: editForm.email || null,
      phone: editForm.phone || null,
      company_id: editForm.company_id ? Number(editForm.company_id) : null,
      notes: editForm.notes || null,
    };
    try {
      await api.put(`/contacts/${contactId}`, payload);
      setShowEdit(false);
      load();
    } finally {
      setSavingEdit(false);
    }
  }

  async function handleDeleteContact() {
    if (!contact) return;
    if (!confirm(`Delete ${contact.first_name} ${contact.last_name}?`)) return;
    await api.delete(`/contacts/${contactId}`);
    navigate('/contacts');
  }

  function openCallForm() {
    setCallForm(emptyCallForm);
    setShowCallForm(true);
  }

  async function handleCallSubmit(e: FormEvent) {
    e.preventDefault();
    setSavingCall(true);
    const payload = {
      contact_id: contactId,
      called_at: new Date(callForm.called_at).toISOString(),
      duration_minutes: callForm.duration_minutes ? Number(callForm.duration_minutes) : null,
      outcome: callForm.outcome || null,
      notes: callForm.notes || null,
    };
    try {
      await api.post('/calls', payload);
      setShowCallForm(false);
      load();
    } finally {
      setSavingCall(false);
    }
  }

  async function handleDeleteCall(callId: number) {
    if (!confirm('Delete this call log entry?')) return;
    await api.delete(`/calls/${callId}`);
    load();
  }

  function companyName(companyId?: number | null) {
    if (!companyId) return null;
    return companies.find((c) => c.id === companyId)?.name ?? null;
  }

  function stageLabel(stage: string) {
    return DEAL_STAGES.find((s) => s.value === stage)?.label ?? stage;
  }

  if (loading) return <p>Loading...</p>;
  if (!contact) return <p>Contact not found.</p>;

  return (
    <div>
      <Link to="/contacts" className="panel-link">
        ← Back to contacts
      </Link>

      <div className="page-header" style={{ marginTop: 12 }}>
        <h1 className="page-title" style={{ marginBottom: 0 }}>
          {contact.first_name} {contact.last_name}
        </h1>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-secondary" onClick={openEdit}>
            Edit
          </button>
          <button className="btn btn-danger" onClick={handleDeleteContact}>
            Delete
          </button>
        </div>
      </div>

      <div className="panel" style={{ marginBottom: 20 }}>
        <ul className="simple-list">
          <li style={{ borderBottom: 'none' }}>
            <span>Company</span>
            <span className="muted">{companyName(contact.company_id) ?? '—'}</span>
          </li>
          <li style={{ borderBottom: 'none' }}>
            <span>Email</span>
            <span className="muted">{contact.email || '—'}</span>
          </li>
          <li style={{ borderBottom: 'none' }}>
            <span>Phone</span>
            <span className="muted">{contact.phone || '—'}</span>
          </li>
          {contact.notes && (
            <li style={{ borderBottom: 'none' }}>
              <span>Notes</span>
              <span className="muted">{contact.notes}</span>
            </li>
          )}
        </ul>
      </div>

      <div className="dashboard-columns" style={{ marginBottom: 20 }}>
        <section className="panel">
          <h2>Deals</h2>
          {deals.length === 0 && <p className="empty-hint">No deals for this contact.</p>}
          <ul className="simple-list">
            {deals.map((d) => (
              <li key={d.id}>
                <span>{d.title}</span>
                <span className="muted">
                  {stageLabel(d.stage)} · ${d.value.toLocaleString()}
                </span>
              </li>
            ))}
          </ul>
        </section>

        <section className="panel">
          <h2>Tasks</h2>
          {tasks.length === 0 && <p className="empty-hint">No tasks for this contact.</p>}
          <ul className="simple-list">
            {tasks.map((t) => (
              <li key={t.id}>
                <span style={{ textDecoration: t.completed ? 'line-through' : 'none' }}>
                  {t.title}
                </span>
                <span className="muted">
                  {t.due_date ? new Date(t.due_date).toLocaleDateString() : '—'}
                </span>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <div className="panel" style={{ marginBottom: 20 }}>
        <h2>Appointments</h2>
        {appointments.length === 0 && <p className="empty-hint">No appointments scheduled.</p>}
        <ul className="simple-list">
          {appointments.map((a) => (
            <li key={a.id}>
              <span>{a.title}</span>
              <span className="muted">
                {new Date(a.start_time).toLocaleString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  hour: 'numeric',
                  minute: '2-digit',
                })}
              </span>
            </li>
          ))}
        </ul>
      </div>

      <div className="panel">
        <div className="page-header" style={{ marginBottom: 12 }}>
          <h2 style={{ marginBottom: 0 }}>Call log</h2>
          <button className="btn btn-primary btn-sm" onClick={openCallForm}>
            + Log call
          </button>
        </div>
        {calls.length === 0 ? (
          <p className="empty-hint">No calls logged yet.</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>When</th>
                <th>Duration</th>
                <th>Outcome</th>
                <th>Notes</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {calls.map((c) => (
                <tr key={c.id}>
                  <td>{new Date(c.called_at).toLocaleString()}</td>
                  <td>{c.duration_minutes ? `${c.duration_minutes} min` : '—'}</td>
                  <td>
                    {c.outcome ? <span className="badge">{c.outcome}</span> : '—'}
                  </td>
                  <td>{c.notes || '—'}</td>
                  <td className="actions">
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => handleDeleteCall(c.id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showEdit && editForm && (
        <Modal title="Edit contact" onClose={() => setShowEdit(false)}>
          <form onSubmit={handleEditSubmit}>
            <label>
              First name
              <input
                value={editForm.first_name}
                onChange={(e) => setEditForm({ ...editForm, first_name: e.target.value })}
                required
              />
            </label>
            <label>
              Last name
              <input
                value={editForm.last_name}
                onChange={(e) => setEditForm({ ...editForm, last_name: e.target.value })}
                required
              />
            </label>
            <label>
              Email
              <input
                type="email"
                value={editForm.email}
                onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
              />
            </label>
            <label>
              Phone
              <input
                value={editForm.phone}
                onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
              />
            </label>
            <label>
              Company
              <select
                value={editForm.company_id}
                onChange={(e) => setEditForm({ ...editForm, company_id: e.target.value })}
              >
                <option value="">— None —</option>
                {companies.map((co) => (
                  <option key={co.id} value={co.id}>
                    {co.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Notes
              <textarea
                rows={3}
                value={editForm.notes}
                onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
              />
            </label>
            <div className="modal-actions">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setShowEdit(false)}
              >
                Cancel
              </button>
              <button className="btn btn-primary" type="submit" disabled={savingEdit}>
                {savingEdit ? 'Saving...' : 'Save'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {showCallForm && (
        <Modal title="Log a call" onClose={() => setShowCallForm(false)}>
          <form onSubmit={handleCallSubmit}>
            <label>
              Date &amp; time
              <input
                type="datetime-local"
                value={callForm.called_at}
                onChange={(e) => setCallForm({ ...callForm, called_at: e.target.value })}
                required
              />
            </label>
            <label>
              Duration (minutes)
              <input
                type="number"
                min={0}
                value={callForm.duration_minutes}
                onChange={(e) => setCallForm({ ...callForm, duration_minutes: e.target.value })}
              />
            </label>
            <label>
              Outcome
              <select
                value={callForm.outcome}
                onChange={(e) => setCallForm({ ...callForm, outcome: e.target.value })}
              >
                {CALL_OUTCOMES.map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Notes
              <textarea
                rows={3}
                value={callForm.notes}
                onChange={(e) => setCallForm({ ...callForm, notes: e.target.value })}
              />
            </label>
            <div className="modal-actions">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setShowCallForm(false)}
              >
                Cancel
              </button>
              <button className="btn btn-primary" type="submit" disabled={savingCall}>
                {savingCall ? 'Saving...' : 'Save'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
