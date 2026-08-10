import { Customer } from './customer.types';

export interface ChallanItem {
  id: string;
  challan_id: string;
  product_id: string;
  product_name_snapshot: string;
  sku_snapshot: string;
  unit_price_snapshot: number;
  quantity: number;
}

export interface Challan {
  id: string;
  challan_number: string;
  customer_id: string;
  status: 'Draft' | 'Confirmed' | 'Cancelled';
  total_quantity: number;
  total_amount: number;
  created_by: string;
  created_at: string;
  updated_at: string;
  confirmed_at: string | null;
  customer?: Customer;
  creator?: { id: string; name: string };
  items?: ChallanItem[];
}
