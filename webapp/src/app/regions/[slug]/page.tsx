import Link from "next/link";
import { notFound } from "next/navigation";
import { supabase } from "@/lib/supabase";
import type { Region, Restaurant } from "@/types/database";

export const revalidate = 60;

export default async function RegionPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ cuisine?: string; q?: string }>;
}) {
  const { slug } = await params;
  const { cuisine, q } = await searchParams;

  // Fetch region
  const { data: region } = await supabase
    .from("regions")
    .select("*")
    .eq("slug", slug)
    .single();

  if (!region) notFound();

  const typedRegion = region as Region;

  // Fetch restaurants for this region
  let query = supabase
    .from("restaurants")
    .select("*")
    .eq("region_id", typedRegion.id)
    .order("name");

  if (cuisine) {
    query = query.ilike("cuisine_type", `%${cuisine}%`);
  }
  if (q) {
    query = query.or(
      `name.ilike.%${q}%,neighborhood.ilike.%${q}%,cuisine_type.ilike.%${q}%`
    );
  }

  const { data: restaurants } = await query;
  const typedRestaurants = (restaurants || []) as Restaurant[];

  // Get unique cuisine types for filter
  const { data: allRestaurants } = await supabase
    .from("restaurants")
    .select("cuisine_type")
    .eq("region_id", typedRegion.id)
    .not("cuisine_type", "is", null);

  const cuisineTypes = [
    ...new Set(
      (allRestaurants || [])
        .map((r) => (r as { cuisine_type: string }).cuisine_type)
        .filter(Boolean)
    ),
  ].sort();

  return (
    <div>
      <Link
        href="/"
        className="mb-4 inline-block text-sm text-zinc-500 hover:text-zinc-700"
      >
        &larr; All Regions
      </Link>

      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">
          {typedRegion.name}
        </h1>
        <p className="mt-1 text-zinc-600">{typedRegion.description}</p>
        <p className="mt-1 text-sm text-zinc-500">
          {typedRestaurants.length} restaurant
          {typedRestaurants.length !== 1 ? "s" : ""}
          {cuisine || q ? " matching filters" : ""}
        </p>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-wrap gap-3">
        <form className="flex gap-2" action={`/regions/${slug}`}>
          <input
            type="text"
            name="q"
            placeholder="Search name, cuisine, neighborhood..."
            defaultValue={q || ""}
            className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          {cuisine && <input type="hidden" name="cuisine" value={cuisine} />}
          <button
            type="submit"
            className="rounded-md bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-zinc-700"
          >
            Search
          </button>
          {(q || cuisine) && (
            <Link
              href={`/regions/${slug}`}
              className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-100"
            >
              Clear
            </Link>
          )}
        </form>
      </div>

      {/* Cuisine filter chips */}
      {cuisineTypes.length > 0 && (
        <div className="mb-6 flex flex-wrap gap-1.5">
          {cuisineTypes.slice(0, 20).map((c) => (
            <Link
              key={c}
              href={`/regions/${slug}?cuisine=${encodeURIComponent(c)}${q ? `&q=${encodeURIComponent(q)}` : ""}`}
              className={`rounded-full px-3 py-1 text-xs transition-colors ${
                cuisine === c
                  ? "bg-zinc-900 text-white"
                  : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
              }`}
            >
              {c}
            </Link>
          ))}
        </div>
      )}

      {/* Restaurant list */}
      <div className="space-y-3">
        {typedRestaurants.map((restaurant) => (
          <Link
            key={restaurant.id}
            href={`/restaurants/${restaurant.id}`}
            className="group block rounded-lg border border-zinc-200 bg-white p-4 transition-shadow hover:shadow-md"
          >
            <div className="flex items-start justify-between">
              <div className="min-w-0 flex-1">
                <h3 className="font-semibold group-hover:text-blue-600">
                  {restaurant.name}
                </h3>
                <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-sm text-zinc-500">
                  {restaurant.neighborhood && (
                    <span>{restaurant.neighborhood}</span>
                  )}
                  {restaurant.cuisine_type && (
                    <span className="text-zinc-400">
                      {restaurant.cuisine_type}
                    </span>
                  )}
                </div>
                {restaurant.private_dining_info && (
                  <p className="mt-2 text-sm text-zinc-600 line-clamp-2">
                    {restaurant.private_dining_info}
                  </p>
                )}
              </div>
              {restaurant.approximate_capacity && (
                <span className="ml-3 shrink-0 rounded bg-zinc-100 px-2 py-0.5 text-xs text-zinc-600">
                  {restaurant.approximate_capacity}
                </span>
              )}
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {restaurant.phone && (
                <span className="rounded bg-emerald-50 px-1.5 py-0.5 text-xs text-emerald-700">
                  Phone
                </span>
              )}
              {restaurant.email && (
                <span className="rounded bg-blue-50 px-1.5 py-0.5 text-xs text-blue-700">
                  Email
                </span>
              )}
              {restaurant.website && (
                <span className="rounded bg-purple-50 px-1.5 py-0.5 text-xs text-purple-700">
                  Website
                </span>
              )}
              {restaurant.private_dining_info && (
                <span className="rounded bg-amber-50 px-1.5 py-0.5 text-xs text-amber-700">
                  Private Dining
                </span>
              )}
            </div>
          </Link>
        ))}

        {typedRestaurants.length === 0 && (
          <div className="rounded-lg border border-zinc-200 bg-white p-8 text-center text-zinc-500">
            No restaurants found matching your filters.
          </div>
        )}
      </div>
    </div>
  );
}
