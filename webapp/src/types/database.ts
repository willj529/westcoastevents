export interface Region {
  id: number;
  name: string;
  slug: string;
  description: string | null;
}

export interface Restaurant {
  id: number;
  region_id: number;
  name: string;
  neighborhood: string | null;
  cuisine_type: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  yelp_url: string | null;
  private_dining_info: string | null;
  approximate_capacity: string | null;
  notes: string | null;
  latitude: number | null;
  longitude: number | null;
  created_at: string;
  updated_at: string;
}

export interface RegionStats {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  restaurant_count: number;
  phone_coverage: number;
  email_coverage: number;
  website_coverage: number;
  private_dining_coverage: number;
  capacity_coverage: number;
}

export interface RestaurantWithRegion extends Restaurant {
  regions: Region;
}
