import { supabase } from '@/lib/supabase';
import type { EnrichedDeal, Branch } from '@/types/models';

export class DealService {
  /**
   * Fetches nearby branches that have active deals.
   */
  static async getNearbyDeals(
    lat: number,
    lng: number,
    radiusMeters: number = 50000,
    pageSize: number = 20,
    pageOffset: number = 0
  ): Promise<{ deals: EnrichedDeal[]; hasMore: boolean }> {
    const { data: rawDeals, error: rpcError } = await supabase.rpc('get_nearby_branches', {
      lat,
      lng,
      radius_meters: radiusMeters,
      page_size: pageSize,
      page_offset: pageOffset,
    });

    if (rpcError) throw rpcError;

    if (!rawDeals || rawDeals.length === 0) {
      return { deals: [], hasMore: false };
    }

    const hasMore = rawDeals.length === pageSize;
    
    // Fetch categories to map IDs to Names
    const categoriesMap = await this.getCategoriesMap();

    // Fetch deal details
    const dealIds = [...new Set(rawDeals.map((d: any) => d.deal_id))];
    const { data: detailsData, error: detailsErr } = await supabase
      .from('deals')
      .select('*, tenant:tenant_id(*)')
      .in('id', dealIds);

    if (detailsErr) {
      console.error('Details fetch error:', detailsErr);
    }

    const detailsMap = (detailsData || []).reduce((acc: any, d: any) => {
      acc[d.id] = d;
      return acc;
    }, {});

    const enrichedDeals: EnrichedDeal[] = rawDeals.map((d: any) => {
      const detail = detailsMap[d.deal_id];
      const tenant = detail?.tenant;
      return {
        deal_id: d.deal_id,
        branch_name: d.branch_name,
        distance: d.distance,
        deal_title: d.deal_title,
        category: detail?.category_id ? (categoriesMap[detail.category_id] || 'Other') : 'Other',
        tenant_id: detail?.tenant_id,
        discount_value: detail?.discount_value,
        tenant_name: tenant?.name || 'Business',
        tenant_logo: tenant?.logo_url?.replace('via.placeholder.com', 'placehold.co'),
        end_date: detail?.end_date,
        image_url: detail?.image_url,
        description: detail?.description,
      };
    });

    return { deals: enrichedDeals, hasMore };
  }

  /**
   * Fetches categories and returns a ID -> Name map.
   */
  static async getCategoriesMap(): Promise<Record<string, string>> {
    // Note: In a real enterprise app, we might want to cache this in memory or localStorage.
    const { data: catsRes } = await supabase.from('categories').select('*');
    return (catsRes || []).reduce((acc: any, c: any) => {
      acc[c.id] = c.name;
      return acc;
    }, {});
  }

  /**
   * Fetches branches for a given tenant ID.
   */
  static async getTenantBranches(tenantId: string): Promise<Branch[]> {
    const { data, error } = await supabase.from('branches').select('*').eq('tenant_id', tenantId);
    if (error) throw error;
    return data as Branch[];
  }
}
