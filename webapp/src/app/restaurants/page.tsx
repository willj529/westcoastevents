import { supabase } from "@/lib/supabase";
import type { Region, Restaurant } from "@/types/database";
import { RestaurantTable } from "@/components/RestaurantTable";

export const revalidate = 60;

export default async function RestaurantsPage() {
  const { data: restaurants } = await supabase
    .from("restaurants")
    .select("*, regions(name, slug)")
    .order("name");

  const { data: regions } = await supabase
    .from("regions")
    .select("id, name, slug")
    .order("name");

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <RestaurantTable
        restaurants={(restaurants || []) as (Restaurant & { regions: Pick<Region, "name" | "slug"> })[]}
        regions={(regions || []) as Pick<Region, "id" | "name" | "slug">[]}
      />
    </div>
  );
}
