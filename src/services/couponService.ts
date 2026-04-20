import { supabase } from '@/lib/supabase';
import type { Coupon, EnrichedDeal } from '@/types/models';
import { normalizeError, ForbiddenError } from '@/lib/errors';

export class CouponService {
  /**
   * Fetches all coupons for a given user, including related deals and tenants.
   *
   * [Security]: We enforce userId client-side in addition to Supabase RLS.
   * This decouples the security contract from the database layer, making
   * it trivial to swap Supabase for a C# API in the future — the service
   * will still validate ownership before returning data.
   */
  static async getUserCoupons(userId: string): Promise<Coupon[]> {
    if (!userId) throw new ForbiddenError('A valid user is required to fetch coupons.');

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

    if (error) throw normalizeError(error);

    // Fetch categories (benefits from static cache in DealService)
    const { data: catsData } = await supabase.from('categories').select('*');
    const catsMap = (catsData || []).reduce((acc: Record<string, string>, c: any) => {
      acc[c.id] = c.name;
      return acc;
    }, {});

    const enrichedCoupons: Coupon[] = (data || []).map((c: any) => {
      // [Security]: Validate that each row belongs to the requesting user before returning it.
      // This guard mirrors what the future C# API will enforce at the controller level.
      if (c.user_id !== userId) throw new ForbiddenError();

      return {
        ...c,
        categoryName: c.deals?.category_id ? catsMap[c.deals.category_id] : 'Other',
        tenants: {
          ...c.tenants,
          logo_url: c.tenants?.logo_url?.replace('via.placeholder.com', 'placehold.co'),
        },
      };
    });

    return enrichedCoupons;
  }

  /**
   * Claims a deal and generates a new coupon.
   * [Security]: Validates userId before inserting to ensure the actor is authenticated.
   */
  static async claimDeal(userId: string, deal: EnrichedDeal): Promise<Coupon> {
    if (!userId) throw new ForbiddenError('Authentication is required to claim a deal.');

    const qrCode = `RG-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
    const { data, error } = await supabase.from('coupons').insert({
      deal_id: deal.deal_id,
      tenant_id: deal.tenant_id,
      user_id: userId,
      qr_code: qrCode,
      status: 'pending',
    }).select().single();

    if (error) throw normalizeError(error);
    return data as Coupon;
  }

  /**
   * Returns a map of deal_id -> { id, status } for lightweight claim tracking.
   * [Security]: Validates userId before querying.
   */
  static async getUserCouponsMap(userId: string): Promise<Record<string, { id: string; status: string }>> {
    if (!userId) throw new ForbiddenError();

    const { data, error } = await supabase
      .from('coupons')
      .select('id, deal_id, status')
      .eq('user_id', userId);

    if (error) throw normalizeError(error);

    const cmap: Record<string, { id: string; status: string }> = {};
    (data || []).forEach(c => { cmap[c.deal_id] = { id: c.id, status: c.status }; });
    return cmap;
  }
}
