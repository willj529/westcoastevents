import Link from "next/link";
import { supabase } from "@/lib/supabase";
import type { RegionStats } from "@/types/database";

export const revalidate = 60;

export default async function RegionsPage() {
  const { data: regions } = await supabase
    .from("region_stats")
    .select("*")
    .order("name");

  const stats = (regions || []) as RegionStats[];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="mb-6 text-3xl font-bold tracking-tight">All Regions</h1>
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
            <p className="mt-1.5 text-sm text-zinc-500">{region.description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
