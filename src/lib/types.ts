export interface Company {
  id: string;
  name: string;
  created_at: string;
}

export interface Profile {
  id: string;
  company_id: string;
  role: 'admin' | 'sdr';
  full_name: string | null;
}

export interface Lead {
  id: string;
  company_id: string;
  sdr_id: string | null;
  phone: string | null;
  status: string;
  rejection_reason: string | null;
  scheduled_at: string | null;
  performance_rating: number | null;
  notes: string | null;
  tags: string[];
  created_at: string;
}
