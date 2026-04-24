export interface Agreement {
  id: string;
  staff_name: string;
  staff_email: string;
  prepared_date: string;
  business_name: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  customer_abn: string | null;
  products: string[];
  breakdown_notes: string | null;
  price: number;
  billing_type: 'once-off' | 'recurring';
  billing_frequency: 'weekly' | 'fortnightly' | 'monthly' | 'quarterly' | 'yearly' | null;
  status: 'pending' | 'signed' | 'paid';
  signature_data: string | null;
  signed_at: string | null;
  payadvantage_customer_id: string | null;
  payment_status: 'unpaid' | 'processing' | 'paid' | 'failed';
  paid_at: string | null;
  created_at: string;
}

export interface AdminAgreementRow {
  id: string;
  created_at: string;
  business_name: string;
  customer_name: string;
  products: string[];
  price: number;
  billing_type: 'once-off' | 'recurring';
  billing_frequency: 'weekly' | 'fortnightly' | 'monthly' | 'quarterly' | 'yearly' | null;
  status: 'pending' | 'signed' | 'paid';
  payment_status: 'unpaid' | 'processing' | 'paid' | 'failed';
}
