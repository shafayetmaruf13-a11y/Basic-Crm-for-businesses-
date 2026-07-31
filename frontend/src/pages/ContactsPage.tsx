import { type FormEvent, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import { Modal } from '../components/Modal';
import type { Company, Contact } from '../api/types';

type FormState = {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  company_id: string;
  notes: string;
};

const emptyForm: FormState = {
  first_name: '',
  last_name: '',
  email: '',
  phone: '',
  company_id: '',
  notes: '',
};

export function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Contact | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');

  function load() {
    setLoading(true);
    Promise.all([api.get<Contact[]>('/contacts'), api.get<Company[]>('/companies')])
      .then(([contactsRes, companiesRes]) => {
        setContacts(contactsRes.data);
        setCompanies(companiesRes.data);
      })
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  function companyName(id?: number | null) {
    if (!id) return '—';
    return companies.find((c) => c.id === id)?.name ?? '—';
  }

  const filteredContacts = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return contacts;
    return contacts.filter((c) => {
      const haystack = [
        c.first_name,
        c.last_name,
        c.email ?? '',
        c.phone ?? '',
        companyName(c.company_id),
      ]
        .join(' ')
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [contacts, search, companies]);

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setShowForm(true);
  }

  function openEdit(contact: Contact) {
    setEditing(contact);
    setForm({
      first_name: contact.first_name,
      last_name: contact.last_name,
      email: contact.email ?? '',
      phone: contact.phone ?? '',
      company_id: contact.company_id ? String(contact.company_id) : '',
      notes: contact.notes ?? '',
    });
    setShowForm(true);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    const payload = {
      first_name: form.first_name,
      last_name: form.last_name,
      email: form.email || null,
      phone: form.phone || null,
      notes: form.notes || null,
      company_id: form.company_id ? Number(form.company_id) : null,
    };
    try {
      if (editing) {
        await api.put(`/contacts/${editing.id}`, payload);
      } else {
        await api.post('/contacts', payload);
      }
      setShowForm(false);
      load();
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(contact: Contact) {
    if (!confirm(`Delete ${contact.first_name} ${contact.last_name}?`)) return;
    await api.delete(`/contacts/${contact.id}`);
    load();
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title" style={{ marginBottom: 0 }}>
          Contacts
        </h1>
        <button className="btn btn-primary" onClick={openCreate}>
          + Add contact
        </button>
      </div>

      <div style={{ marginBottom: 16, maxWidth: 320 }}>
        <input
          placeholder="Search contacts..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : filteredContacts.length === 0 ? (
        <p className="empty-hint">
          {contacts.length === 0 ? 'No contacts yet. Add your first one.' : 'No matches.'}
        </p>
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Company</th>
              <th>Email</th>
              <th>Phone</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filteredContacts.map((c) => (
              <tr key={c.id}>
                <td>
                  <Link to={`/contacts/${c.id}`}>
                    {c.first_name} {c.last_name}
                  </Link>
                </td>
                <td>{companyName(c.company_id)}</td>
                <td>{c.email || '—'}</td>
                <td>{c.phone || '—'}</td>
                <td className="actions">
                  <button className="btn btn-secondary btn-sm" onClick={() => openEdit(c)}>
                    Edit
                  </button>
                  <button className="btn btn-danger btn-sm" onClick={() => handleDelete(c)}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {showForm && (
        <Modal title={editing ? 'Edit contact' : 'Add contact'} onClose={() => setShowForm(false)}>
          <form onSubmit={handleSubmit}>
            <label>
              First name
              <input
                value={form.first_name}
                onChange={(e) => setForm({ ...form, first_name: e.target.value })}
                required
              />
            </label>
            <label>
              Last name
              <input
                value={form.last_name}
                onChange={(e) => setForm({ ...form, last_name: e.target.value })}
                required
              />
            </label>
            <label>
              Email
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </label>
            <label>
              Phone
              <input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
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
              Notes
              <textarea
                rows={3}
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
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
