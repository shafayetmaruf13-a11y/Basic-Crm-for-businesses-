export interface User {
  id: number;
  email: string;
  full_name: string;
}

export interface Company {
  id: number;
  name: string;
  website?: string | null;
  phone?: string | null;
  address?: string | null;
  notes?: string | null;
  created_at: string;
}

export interface Contact {
  id: number;
  first_name: string;
  last_name: string;
  email?: string | null;
  phone?: string | null;
  notes?: string | null;
  company_id?: number | null;
  created_at: string;
}

export type DealStage =
  | 'lead'
  | 'contacted'
  | 'proposal'
  | 'negotiation'
  | 'won'
  | 'lost';

export const DEAL_STAGES: { value: DealStage; label: string }[] = [
  { value: 'lead', label: 'Lead' },
  { value: 'contacted', label: 'Contacted' },
  { value: 'proposal', label: 'Proposal' },
  { value: 'negotiation', label: 'Negotiation' },
  { value: 'won', label: 'Won' },
  { value: 'lost', label: 'Lost' },
];

export interface Deal {
  id: number;
  title: string;
  value: number;
  stage: DealStage;
  contact_id?: number | null;
  company_id?: number | null;
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Task {
  id: number;
  title: string;
  description?: string | null;
  due_date?: string | null;
  completed: boolean;
  contact_id?: number | null;
  created_at: string;
}

export interface Appointment {
  id: number;
  title: string;
  description?: string | null;
  start_time: string;
  end_time: string;
  location?: string | null;
  contact_id?: number | null;
  created_at: string;
}

export interface Call {
  id: number;
  contact_id: number;
  called_at: string;
  duration_minutes?: number | null;
  outcome?: string | null;
  notes?: string | null;
  created_at: string;
}

export const CALL_OUTCOMES = [
  'Connected',
  'Left voicemail',
  'No answer',
  'Scheduled follow-up',
  'Not interested',
];
