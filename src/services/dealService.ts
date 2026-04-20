import { supabase } from '@/lib/supabase';
import type { EnrichedDeal, Branch } from '@/types/models';
import { normalizeError } from '@/lib/errors';

/**
 * Session-scoped cache for the categories map.
 * Categories are loaded once per session and reused across all service calls.
 * When migrating to a C# API, this cache can remain as-is — just update
 * the fetch call inside `getCategoriesMap()` to call the new endpoint.
 */
let _categoriesCache: Record<string, string> | null = null;

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

    if (rpcError) throw normalizeError(rpcError);

    if (!rawDeals || rawDeals.length === 0) {
      return { deals: [], hasMore: false };
    }

    const hasMore = rawDeals.length === pageSize;

    // Use cached categories map (avoids redundant DB roundtrip)
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

    const detailsMap = (detailsData || []).reduce((acc: Record<string, any>, d: any) => {
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
   * Returns a cached ID → Name map for categories.
   * The cache lives for the duration of the browser session.
   * Call `DealService.clearCache()` to invalidate (e.g., on logout).
   */
  static async getCategoriesMap(): Promise<Record<string, string>> {
    if (_categoriesCache) return _categoriesCache;

    const { data: catsRes } = await supabase.from('categories').select('*');
    _categoriesCache = (catsRes || []).reduce((acc: Record<string, string>, c: any) => {
      acc[c.id] = c.name;
      return acc;
    }, {});

    return _categoriesCache;
  }

  /**
   * Clears the session-level categories cache.
   * Should be called on user logout to avoid stale data.
   */
  static clearCache(): void {
    _categoriesCache = null;
  }

  /**
   * Fetches branches for a given tenant ID.
   */
  static async getTenantBranches(tenantId: string): Promise<Branch[]> {
    const { data, error } = await supabase.from('branches').select('*').eq('tenant_id', tenantId);
    if (error) throw normalizeError(error);
    return data as Branch[];
  }
}
