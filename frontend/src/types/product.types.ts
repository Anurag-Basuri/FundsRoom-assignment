export interface Product {
  id: string;
  name: string;
  sku: string;
  category: string | null;
  unit_price: number;
  current_stock: number;
  min_stock_alert: number;
  location: string | null;
  created_at: string;
  updated_at: string;
}

export interface StockMovement {
  id: string;
  product_id: string;
  quantity_changed: number;
  movement_type: 'IN' | 'OUT';
  reason: string;
  created_by: string;
  created_at: string;
  product?: { id: string; name: string; sku: string };
  creator?: { id: string; name: string };
}
