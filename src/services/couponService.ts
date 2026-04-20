import { supabase } from '@/lib/supabase';
import type { Coupon, EnrichedDeal } from '@/types/models';

export class CouponService {
  /**
   * Fetches all coupons for a given user, including related deals and tenants.
   */
  static async getUserCoupons(userId: string): Promise<Coupon[]> {
    const { data, error } = await supabase
      .from('coupons')
      .select(`
        *,
        deals (
          title,
          description,
          image_url,
          end_date,
          id,
          category_id
        ),
        tenants (
          id,
          name,
          logo_url
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    
    // Fetch categories for mapping
    const { data: catsData } = await supabase.from('categories').select('*');
    const catsMap = (catsData || []).reduce((acc: any, c: any) => {
      acc[c.id] = c.name;
      return acc;
    }, {});

    const enrichedCoupons: Coupon[] = (data || []).map((c: any) => ({
      ...c,
      categoryName: c.deals?.category_id ? catsMap[c.deals.category_id] : 'Other',
      tenants: {
        ...c.tenants,
        logo_url: c.tenants?.logo_url?.replace('via.placeholder.com', 'placehold.co')
      }
    }));

    return enrichedCoupons;
  }

  /**
   * Claims a deal and generates a new coupon
   */
  static async claimDeal(userId: string, deal: EnrichedDeal): Promise<Coupon> {
    const qrCode = `RG-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
    const { data, error } = await supabase.from('coupons').insert({
      deal_id: deal.deal_id,
      tenant_id: deal.tenant_id,
      user_id: userId,
      qr_code: qrCode,
      status: 'pending'
    }).select().single();

    if (error) throw error;
    return data as Coupon;
  }

  /**
   * Helper to fetch simplified tracking of claimed coupons for a user
   * Returns a map of deal_id -> { id, status }
   */
  static async getUserCouponsMap(userId: string): Promise<Record<string, { id: string; status: string }>> {
    const { data } = await supabase.from('coupons').select('id, deal_id, status').eq('user_id', userId);
    const cmap: Record<string, { id: string; status: string }> = {};
    if (data) {
      data.forEach(c => { cmap[c.deal_id] = { id: c.id, status: c.status }; });
    }
    return cmap;
  }
}
