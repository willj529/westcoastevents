"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import type { Region, Restaurant } from "@/types/database";

type RestaurantRow = Restaurant & { regions: Pick<Region, "name" | "slug"> };

export function RestaurantTable({
  restaurants,
  regions,
}: {
  restaurants: RestaurantRow[];
  regions: Pick<Region, "id" | "name" | "slug">[];
}) {
  const [search, setSearch] = useState("");
  const [regionFilter, setRegionFilter] = useState("");
  const [cuisineFilter, setCuisineFilter] = useState("");
  const [privateDiningOnly, setPrivateDiningOnly] = useState(false);
  const [sortField, setSortField] = useState<
    "name" | "neighborhood" | "cuisine_type" | "region"
  >("name");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const cuisineTypes = useMemo(() => {
    const types = new Set<string>();
    restaurants.forEach((r) => {
      if (r.cuisine_type) {
        r.cuisine_type.split(/\s*\/\s*/).forEach((t) => types.add(t.trim()));
      }
    });
    return [...types].sort();
  }, [restaurants]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return restaurants
      .filter((r) => {
        if (q) {
          const match =
            r.name?.toLowerCase().includes(q) ||
            r.neighborhood?.toLowerCase().includes(q) ||
            r.cuisine_type?.toLowerCase().includes(q) ||
            r.address?.toLowerCase().includes(q) ||
            r.regions.name.toLowerCase().includes(q);
          if (!match) return false;
        }
        if (regionFilter && r.regions.slug !== regionFilter) return false;
        if (cuisineFilter && !r.cuisine_type?.toLowerCase().includes(cuisineFilter.toLowerCase()))
          return false;
        if (privateDiningOnly && !r.private_dining_info) return false;
        return true;
      })
      .sort((a, b) => {
        let av: string, bv: string;
        if (sortField === "region") {
          av = a.regions.name;
          bv = b.regions.name;
        } else {
          av = (a[sortField] || "") as string;
          bv = (b[sortField] || "") as string;
        }
        const cmp = av.localeCompare(bv);
        return sortDir === "asc" ? cmp : -cmp;
      });
  }, [restaurants, search, regionFilter, cuisineFilter, privateDiningOnly, sortField, sortDir]);

  function toggleSort(field: typeof sortField) {
    if (sortField === field) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDir("asc");
    }
  }

  const sortIcon = (field: typeof sortField) => {
    if (sortField !== field) return "";
    return sortDir === "asc" ? " \u2191" : " \u2193";
  };

  const hasFilters = search || regionFilter || cuisineFilter || privateDiningOnly;

  return (
    <div>
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            All Restaurants
          </h1>
          <p className="mt-1 text-zinc-500">
            {filtered.length} of {restaurants.length} restaurants
            {hasFilters ? " matching filters" : ""}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <input
          type="text"
          placeholder="Search name, neighborhood, cuisine, address..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-72 rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        <select
          value={regionFilter}
          onChange={(e) => setRegionFilter(e.target.value)}
          className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option value="">All Regions</option>
          {regions.map((r) => (
            <option key={r.slug} value={r.slug}>
              {r.name}
            </option>
          ))}
        </select>
        <select
          value={cuisineFilter}
          onChange={(e) => setCuisineFilter(e.target.value)}
          className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option value="">All Cuisines</option>
          {cuisineTypes.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <label className="flex items-center gap-1.5 text-sm text-zinc-600">
          <input
            type="checkbox"
            checked={privateDiningOnly}
            onChange={(e) => setPrivateDiningOnly(e.target.checked)}
            className="rounded border-zinc-300"
          />
          Private dining only
        </label>
        {hasFilters && (
          <button
            onClick={() => {
              setSearch("");
              setRegionFilter("");
              setCuisineFilter("");
              setPrivateDiningOnly(false);
            }}
            className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-100"
          >
            Clear all
          </button>
        )}
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-zinc-200 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-200 bg-zinc-50 text-left">
              <th
                className="cursor-pointer px-4 py-3 font-medium text-zinc-600 hover:text-zinc-900"
                onClick={() => toggleSort("name")}
              >
                Name{sortIcon("name")}
              </th>
              <th
                className="cursor-pointer px-4 py-3 font-medium text-zinc-600 hover:text-zinc-900"
                onClick={() => toggleSort("region")}
              >
                Region{sortIcon("region")}
              </th>
              <th
                className="cursor-pointer px-4 py-3 font-medium text-zinc-600 hover:text-zinc-900"
                onClick={() => toggleSort("neighborhood")}
              >
                Neighborhood{sortIcon("neighborhood")}
              </th>
              <th
                className="cursor-pointer px-4 py-3 font-medium text-zinc-600 hover:text-zinc-900"
                onClick={() => toggleSort("cuisine_type")}
              >
                Cuisine{sortIcon("cuisine_type")}
              </th>
              <th className="px-4 py-3 font-medium text-zinc-600">Capacity</th>
              <th className="px-4 py-3 font-medium text-zinc-600">Contact</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {filtered.map((r) => (
              <tr key={r.id} className="hover:bg-zinc-50">
                <td className="px-4 py-3">
                  <Link
                    href={`/restaurants/${r.id}`}
                    className="font-medium text-blue-600 hover:underline"
                  >
                    {r.name}
                  </Link>
                </td>
                <td className="px-4 py-3 text-zinc-500">{r.regions.name}</td>
                <td className="px-4 py-3 text-zinc-500">
                  {r.neighborhood || "—"}
                </td>
                <td className="px-4 py-3 text-zinc-500">
                  {r.cuisine_type || "—"}
                </td>
                <td className="px-4 py-3 text-zinc-500">
                  {r.approximate_capacity || "—"}
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-1.5">
                    {r.phone && (
                      <span className="rounded bg-emerald-50 px-1.5 py-0.5 text-xs text-emerald-700">
                        Ph
                      </span>
                    )}
                    {r.email && (
                      <span className="rounded bg-blue-50 px-1.5 py-0.5 text-xs text-blue-700">
                        Em
                      </span>
                    )}
                    {r.website && (
                      <span className="rounded bg-purple-50 px-1.5 py-0.5 text-xs text-purple-700">
                        Web
                      </span>
                    )}
                    {r.private_dining_info && (
                      <span className="rounded bg-amber-50 px-1.5 py-0.5 text-xs text-amber-700">
                        PD
                      </span>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filtered.length === 0 && (
          <div className="p-8 text-center text-zinc-500">
            No restaurants match your filters.
          </div>
        )}
      </div>
    </div>
  );
}
