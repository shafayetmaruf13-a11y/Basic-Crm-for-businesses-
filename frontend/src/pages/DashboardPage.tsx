import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import type { Appointment, Company, Contact, Deal, Task } from '../api/types';

export function DashboardPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);

  useEffect(() => {
    api.get<Company[]>('/companies').then((r) => setCompanies(r.data));
    api.get<Contact[]>('/contacts').then((r) => setContacts(r.data));
    api.get<Deal[]>('/deals').then((r) => setDeals(r.data));
    api.get<Task[]>('/tasks', { params: { completed: false } }).then((r) => setTasks(r.data));
    const now = new Date().toISOString();
    api.get<Appointment[]>('/appointments', { params: { start: now } }).then((r) =>
      setAppointments(r.data.slice(0, 5))
    );
  }, []);

  const openDeals = deals.filter((d) => d.stage !== 'won' && d.stage !== 'lost');
  const pipelineValue = openDeals.reduce((sum, d) => sum + d.value, 0);

  return (
    <div>
      <h1 className="page-title">Dashboard</h1>
      <div className="stat-grid">
        <Link to="/companies" className="stat-card">
          <div className="stat-value">{companies.length}</div>
          <div className="stat-label">Companies</div>
        </Link>
        <Link to="/contacts" className="stat-card">
          <div className="stat-value">{contacts.length}</div>
          <div className="stat-label">Contacts</div>
        </Link>
        <Link to="/deals" className="stat-card">
          <div className="stat-value">{openDeals.length}</div>
          <div className="stat-label">Open Deals</div>
        </Link>
        <Link to="/deals" className="stat-card">
          <div className="stat-value">${pipelineValue.toLocaleString()}</div>
          <div className="stat-label">Pipeline Value</div>
        </Link>
      </div>

      <div className="dashboard-columns">
        <section className="panel">
          <h2>Upcoming tasks</h2>
          {tasks.length === 0 && <p className="empty-hint">No open tasks.</p>}
          <ul className="simple-list">
            {tasks.slice(0, 6).map((t) => (
              <li key={t.id}>
                <span>{t.title}</span>
                {t.due_date && (
                  <span className="muted">{new Date(t.due_date).toLocaleDateString()}</span>
                )}
              </li>
            ))}
          </ul>
          <Link to="/tasks" className="panel-link">
            View all tasks →
          </Link>
        </section>

        <section className="panel">
          <h2>Upcoming appointments</h2>
          {appointments.length === 0 && <p className="empty-hint">Nothing scheduled.</p>}
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
          <Link to="/calendar" className="panel-link">
            View calendar →
          </Link>
        </section>
      </div>
    </div>
  );
}
