import { type DragEvent, type FormEvent, useEffect, useMemo, useState } from 'react';
import { api } from '../api/client';
import { Modal } from '../components/Modal';
import { DEAL_STAGES, type Company, type Contact, type Deal, type DealStage } from '../api/types';

type FormState = {
  title: string;
  value: string;
  stage: DealStage;
  contact_id: string;
  company_id: string;
  notes: string;
};

const emptyForm: FormState = {
  title: '',
  value: '0',
  stage: 'lead',
  contact_id: '',
  company_id: '',
  notes: '',
};

export function DealsPage() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [dragOverStage, setDragOverStage] = useState<DealStage | null>(null);
  const [companyFilter, setCompanyFilter] = useState('');
  const [contactFilter, setContactFilter] = useState('');

  function load() {
    setLoading(true);
    Promise.all([
      api.get<Deal[]>('/deals'),
      api.get<Company[]>('/companies'),
      api.get<Contact[]>('/contacts'),
    ])
      .then(([dealsRes, companiesRes, contactsRes]) => {
        setDeals(dealsRes.data);
        setCompanies(companiesRes.data);
        setContacts(contactsRes.data);
      })
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  const visibleDeals = useMemo(() => {
    return deals.filter((d) => {
      if (companyFilter && String(d.company_id ?? '') !== companyFilter) return false;
      if (contactFilter && String(d.contact_id ?? '') !== contactFilter) return false;
      return true;
    });
  }, [deals, companyFilter, contactFilter]);

  function openCreate(stage: DealStage) {
    setEditingId(null);
    setForm({ ...emptyForm, stage });
    setShowForm(true);
  }

  function openEdit(deal: Deal) {
    setEditingId(deal.id);
    setForm({
      title: deal.title,
      value: String(deal.value),
      stage: deal.stage,
      contact_id: deal.contact_id ? String(deal.contact_id) : '',
      company_id: deal.company_id ? String(deal.company_id) : '',
      notes: deal.notes ?? '',
    });
    setShowForm(true);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    const payload = {
      title: form.title,
      value: Number(form.value) || 0,
      stage: form.stage,
      contact_id: form.contact_id ? Number(form.contact_id) : null,
      company_id: form.company_id ? Number(form.company_id) : null,
      notes: form.notes || null,
    };
    try {
      if (editingId) {
        await api.put(`/deals/${editingId}`, payload);
      } else {
        await api.post('/deals', payload);
      }
      setShowForm(false);
      load();
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!editingId) return;
    if (!confirm('Delete this deal?')) return;
    await api.delete(`/deals/${editingId}`);
    setShowForm(false);
    load();
  }

  async function moveDeal(dealId: number, stage: DealStage) {
    setDeals((prev) => prev.map((d) => (d.id === dealId ? { ...d, stage } : d)));
    await api.put(`/deals/${dealId}`, { stage });
  }

  function handleDrop(e: DragEvent<HTMLDivElement>, stage: DealStage) {
    e.preventDefault();
    setDragOverStage(null);
    const dealId = Number(e.dataTransfer.getData('text/deal-id'));
    if (dealId) moveDeal(dealId, stage);
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title" style={{ marginBottom: 0 }}>
          Deals
        </h1>
        <div style={{ display: 'flex', gap: 8 }}>
          <select value={companyFilter} onChange={(e) => setCompanyFilter(e.target.value)}>
            <option value="">All companies</option>
            {companies.map((co) => (
              <option key={co.id} value={co.id}>
                {co.name}
              </option>
            ))}
          </select>
          <select value={contactFilter} onChange={(e) => setContactFilter(e.target.value)}>
            <option value="">All contacts</option>
            {contacts.map((c) => (
              <option key={c.id} value={c.id}>
                {c.first_name} {c.last_name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : (
        <div className="kanban-board">
          {DEAL_STAGES.map((stageInfo) => {
            const stageDeals = visibleDeals.filter((d) => d.stage === stageInfo.value);
            const total = stageDeals.reduce((sum, d) => sum + d.value, 0);
            return (
              <div
                key={stageInfo.value}
                className={
                  'kanban-column' + (dragOverStage === stageInfo.value ? ' drag-over' : '')
                }
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOverStage(stageInfo.value);
                }}
                onDragLeave={() => setDragOverStage(null)}
                onDrop={(e) => handleDrop(e, stageInfo.value)}
              >
                <div className="kanban-column-header">
                  <span>{stageInfo.label}</span>
                  <span className="kanban-column-count">
                    {stageDeals.length} · ${total.toLocaleString()}
                  </span>
                </div>
                <div className="kanban-cards">
                  {stageDeals.map((deal) => (
                    <div
                      key={deal.id}
                      className="kanban-card"
                      draggable
                      onDragStart={(e) => e.dataTransfer.setData('text/deal-id', String(deal.id))}
                      onClick={() => openEdit(deal)}
                    >
                      <div className="kanban-card-title">{deal.title}</div>
                      <div className="kanban-card-value">${deal.value.toLocaleString()}</div>
                    </div>
                  ))}
                </div>
                <button
                  className="btn btn-ghost btn-sm kanban-add-btn"
                  onClick={() => openCreate(stageInfo.value)}
                >
                  + Add deal
                </button>
              </div>
            );
          })}
        </div>
      )}

      {showForm && (
        <Modal title={editingId ? 'Edit deal' : 'Add deal'} onClose={() => setShowForm(false)}>
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
              Value ($)
              <input
                type="number"
                min={0}
                value={form.value}
                onChange={(e) => setForm({ ...form, value: e.target.value })}
              />
            </label>
            <label>
              Stage
              <select
                value={form.stage}
                onChange={(e) => setForm({ ...form, stage: e.target.value as DealStage })}
              >
                {DEAL_STAGES.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Company
              <select
                value={form.company_id}
                onChange={(e) => setForm({ ...form, company_id: e.target.value })}
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
              Contact
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
              Notes
              <textarea
                rows={3}
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
              />
            </label>
            <div className="modal-actions" style={{ justifyContent: 'space-between' }}>
              {editingId ? (
                <button type="button" className="btn btn-danger" onClick={handleDelete}>
                  Delete
                </button>
              ) : (
                <span />
              )}
              <div style={{ display: 'flex', gap: 8 }}>
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
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
