import Link from "next/link";
import { supabase } from "@/lib/supabase";
import type { RegionStats } from "@/types/database";

export const revalidate = 60;

export default async function HomePage() {
  const { data: regions } = await supabase
    .from("region_stats")
    .select("*")
    .order("restaurant_count", { ascending: false });

  const stats = (regions || []) as RegionStats[];
  const totalRestaurants = stats.reduce(
    (sum, r) => sum + r.restaurant_count,
    0
  );

  return (
    <div>
      {/* Hero */}
      <div className="border-b border-zinc-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:py-24">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            Find your perfect
            <br />
            private event venue
          </h1>
          <p className="mt-4 max-w-xl text-lg text-zinc-600">
            Browse {totalRestaurants}+ restaurants across Los Angeles with
            private dining rooms, event spaces, and full buyout options.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/restaurants"
              className="rounded-lg bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-zinc-700"
            >
              Browse All Restaurants
            </Link>
            <Link
              href="/map"
              className="rounded-lg border border-zinc-300 bg-white px-5 py-2.5 text-sm font-medium hover:bg-zinc-50"
            >
              View Map
            </Link>
          </div>
        </div>
      </div>

      {/* Regions grid */}
      <div className="mx-auto max-w-7xl px-4 py-12">
        <h2 className="mb-6 text-2xl font-bold tracking-tight">
          Browse by Region
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {stats.map((region) => (
            <Link
              key={region.id}
              href={`/regions/${region.slug}`}
              className="group rounded-lg border border-zinc-200 bg-white p-5 transition-shadow hover:shadow-md"
            >
              <div className="flex items-start justify-between">
                <h3 className="font-semibold group-hover:text-blue-600">
                  {region.name}
                </h3>
                <span className="ml-3 shrink-0 rounded-full bg-zinc-100 px-2.5 py-0.5 text-sm font-medium">
                  {region.restaurant_count}
                </span>
              </div>
              <p className="mt-1.5 text-sm text-zinc-500 line-clamp-2">
                {region.description}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
