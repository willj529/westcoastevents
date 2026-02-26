import Link from "next/link";
import { supabase } from "@/lib/supabase";
import type { RegionStats } from "@/types/database";

function CoverageBar({ pct }: { pct: number }) {
  const color =
    pct >= 80
      ? "bg-emerald-500"
      : pct >= 50
        ? "bg-amber-500"
        : "bg-red-400";
  return (
    <div className="h-2 w-full rounded-full bg-zinc-200">
      <div
        className={`h-2 rounded-full ${color}`}
        style={{ width: `${Math.min(pct, 100)}%` }}
      />
    </div>
  );
}

export const revalidate = 60;

export default async function HomePage() {
  const { data: regions, error } = await supabase
    .from("region_stats")
    .select("*")
    .order("restaurant_count", { ascending: false });

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-red-700">
        <h2 className="font-semibold">Database connection error</h2>
        <p className="mt-1 text-sm">
          Make sure your Supabase environment variables are configured in{" "}
          <code className="font-mono">.env.local</code>
        </p>
        <pre className="mt-2 text-xs">{error.message}</pre>
      </div>
    );
  }

  const stats = regions as RegionStats[];
  const totalRestaurants = stats.reduce(
    (sum, r) => sum + r.restaurant_count,
    0
  );

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">
          LA Restaurant & Event Venues
        </h1>
        <p className="mt-2 text-zinc-600">
          {totalRestaurants} restaurants across {stats.length} regions. Browse
          private dining options, event spaces, and contact info.
        </p>
      </div>

      <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-lg border border-zinc-200 bg-white p-4">
          <div className="text-2xl font-bold">{totalRestaurants}</div>
          <div className="text-sm text-zinc-500">Total Restaurants</div>
        </div>
        <div className="rounded-lg border border-zinc-200 bg-white p-4">
          <div className="text-2xl font-bold">{stats.length}</div>
          <div className="text-sm text-zinc-500">Regions</div>
        </div>
        <div className="rounded-lg border border-zinc-200 bg-white p-4">
          <div className="text-2xl font-bold">
            {totalRestaurants > 0
              ? Math.round(
                  stats.reduce(
                    (s, r) => s + r.email_coverage * r.restaurant_count,
                    0
                  ) / totalRestaurants
                )
              : 0}
            %
          </div>
          <div className="text-sm text-zinc-500">Avg Email Coverage</div>
        </div>
        <div className="rounded-lg border border-zinc-200 bg-white p-4">
          <div className="text-2xl font-bold">
            {totalRestaurants > 0
              ? Math.round(
                  stats.reduce(
                    (s, r) =>
                      s + r.private_dining_coverage * r.restaurant_count,
                    0
                  ) / totalRestaurants
                )
              : 0}
            %
          </div>
          <div className="text-sm text-zinc-500">Avg Private Dining Info</div>
        </div>
      </div>

      <h2 className="mb-4 text-xl font-semibold">Browse by Region</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        {stats.map((region) => (
          <Link
            key={region.id}
            href={`/regions/${region.slug}`}
            className="group rounded-lg border border-zinc-200 bg-white p-5 transition-shadow hover:shadow-md"
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold group-hover:text-blue-600">
                  {region.name}
                </h3>
                <p className="mt-1 text-sm text-zinc-500">
                  {region.description}
                </p>
              </div>
              <span className="ml-4 shrink-0 rounded-full bg-zinc-100 px-3 py-1 text-sm font-medium">
                {region.restaurant_count}
              </span>
            </div>
            <div className="mt-4 space-y-2 text-xs text-zinc-500">
              <div className="flex items-center gap-2">
                <span className="w-28">Phone</span>
                <CoverageBar pct={region.phone_coverage} />
                <span className="w-10 text-right">
                  {region.phone_coverage}%
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-28">Email</span>
                <CoverageBar pct={region.email_coverage} />
                <span className="w-10 text-right">
                  {region.email_coverage}%
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-28">Website</span>
                <CoverageBar pct={region.website_coverage} />
                <span className="w-10 text-right">
                  {region.website_coverage}%
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-28">Private Dining</span>
                <CoverageBar pct={region.private_dining_coverage} />
                <span className="w-10 text-right">
                  {region.private_dining_coverage}%
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-28">Capacity</span>
                <CoverageBar pct={region.capacity_coverage} />
                <span className="w-10 text-right">
                  {region.capacity_coverage}%
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
