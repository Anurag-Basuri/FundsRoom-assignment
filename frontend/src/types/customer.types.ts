export interface Customer {
  id: string;
  name: string;
  mobile: string;
  email: string | null;
  business_name: string | null;
  gst_number: string | null;
  customer_type: 'Retail' | 'Wholesale' | 'Distributor';
  address: string | null;
  status: 'Lead' | 'Active' | 'Inactive';
  follow_up_date: string | null;
  notes: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  creator?: { id: string; name: string };
  followUps?: FollowUp[];
}

export interface FollowUp {
  id: string;
  customer_id: string;
  note: string;
  follow_up_date: string | null;
  created_by: string;
  created_at: string;
  creator?: { id: string; name: string };
}
