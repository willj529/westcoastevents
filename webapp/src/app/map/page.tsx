import { supabase } from "@/lib/supabase";
import type { Region, Restaurant } from "@/types/database";
import { MapView } from "@/components/MapView";

export const revalidate = 60;

export default async function MapPage() {
  const { data: restaurants } = await supabase
    .from("restaurants")
    .select("*, regions(name, slug)")
    .not("latitude", "is", null)
    .not("longitude", "is", null)
    .order("name");

  // Also fetch total count for the "not geocoded" message
  const { count: totalCount } = await supabase
    .from("restaurants")
    .select("*", { count: "exact", head: true });

  const { data: regions } = await supabase
    .from("regions")
    .select("id, name, slug")
    .order("name");

  const geocoded = (restaurants || []) as (Restaurant & { regions: Pick<Region, "name" | "slug"> })[];
  const total = totalCount || 0;

  return (
    <MapView
      restaurants={geocoded}
      regions={(regions || []) as Pick<Region, "id" | "name" | "slug">[]}
      totalCount={total}
    />
  );
}
