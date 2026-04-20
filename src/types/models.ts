export interface Tenant {
  id: string;
  name: string;
  logo_url?: string;
}

export interface Category {
  id: string;
  name: string;
}

export interface Deal {
  id: string;
  tenant_id: string;
  category_id: string;
  title: string;
  description: string;
  image_url?: string;
  end_date?: string;
  discount_value?: number | string;
}

export interface Branch {
  id: string;
  tenant_id: string;
  name: string;
  location?: any;
}

export interface Coupon {
  id: string;
  deal_id: string;
  tenant_id: string;
  user_id: string;
  qr_code: string;
  status: 'pending' | 'redeemed';
  created_at: string;
  
  // Relations dynamically joined
  deals?: Deal;
  tenants?: Tenant;
  categoryName?: string;
}

export interface Profile {
  id: string;
  [key: string]: any;
}

// Extracted from RPC get_nearby_branches
export interface NearbyDealRPCResult {
  deal_id: string;
  branch_name: string;
  distance: number;
  deal_title: string;
}

/** 
 * Enriched deal used by the Home interface.
 * Combines minimal location-based data with full deal config.
 */
export interface EnrichedDeal extends NearbyDealRPCResult {
  category: string;
  tenant_id: string;
  discount_value?: number | string;
  tenant_name: string;
  tenant_logo?: string;
  end_date?: string;
  image_url?: string;
  description?: string;
}
