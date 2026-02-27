"use client";

import { useState, useMemo, useCallback } from "react";
import Map, { Marker, Popup, NavigationControl } from "react-map-gl/mapbox";
import Link from "next/link";
import type { Region, Restaurant } from "@/types/database";
import "mapbox-gl/dist/mapbox-gl.css";

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || "";

type RestaurantRow = Restaurant & { regions: Pick<Region, "name" | "slug"> };

export function MapView({
  restaurants,
  regions,
  totalCount,
}: {
  restaurants: RestaurantRow[];
  regions: Pick<Region, "id" | "name" | "slug">[];
  totalCount: number;
}) {
  const [regionFilter, setRegionFilter] = useState("");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<RestaurantRow | null>(null);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return restaurants.filter((r) => {
      if (regionFilter && r.regions.slug !== regionFilter) return false;
      if (q) {
        return (
          r.name?.toLowerCase().includes(q) ||
          r.neighborhood?.toLowerCase().includes(q) ||
          r.cuisine_type?.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [restaurants, regionFilter, search]);

  const notGeocoded = totalCount - restaurants.length;

  const handleMarkerClick = useCallback((r: RestaurantRow) => {
    setSelected(r);
  }, []);

  return (
    <div className="flex h-[calc(100vh-65px)] flex-col">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 border-b border-zinc-200 bg-white px-4 py-3">
        <input
          type="text"
          placeholder="Search..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-56 rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
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
        <span className="text-sm text-zinc-500">
          {filtered.length} pins shown
        </span>
        {notGeocoded > 0 && (
          <span className="text-xs text-amber-600">
            ({notGeocoded} restaurants not yet geocoded)
          </span>
        )}
      </div>

      {/* Map */}
      <div className="flex-1">
        <Map
          initialViewState={{
            longitude: -118.35,
            latitude: 34.05,
            zoom: 10,
          }}
          style={{ width: "100%", height: "100%" }}
          mapStyle="mapbox://styles/mapbox/light-v11"
          mapboxAccessToken={MAPBOX_TOKEN}
        >
          <NavigationControl position="top-right" />

          {filtered.map((r) => (
            <Marker
              key={r.id}
              longitude={r.longitude!}
              latitude={r.latitude!}
              anchor="bottom"
              onClick={(e) => {
                e.originalEvent.stopPropagation();
                handleMarkerClick(r);
              }}
            >
              <div className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-full bg-zinc-900 shadow-lg ring-2 ring-white transition-transform hover:scale-110">
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="white"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M18 8h1a4 4 0 0 1 0 8h-1" />
                  <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z" />
                  <line x1="6" y1="1" x2="6" y2="4" />
                  <line x1="10" y1="1" x2="10" y2="4" />
                  <line x1="14" y1="1" x2="14" y2="4" />
                </svg>
              </div>
            </Marker>
          ))}

          {selected && (
            <Popup
              longitude={selected.longitude!}
              latitude={selected.latitude!}
              anchor="bottom"
              offset={[0, -32] as [number, number]}
              onClose={() => setSelected(null)}
              closeOnClick={false}
              maxWidth="320px"
            >
              <div className="font-sans">
                <h3 className="text-base font-semibold leading-tight">
                  {selected.name}
                </h3>
                <div className="mt-1 text-xs text-zinc-500">
                  {selected.neighborhood && <span>{selected.neighborhood}</span>}
                  {selected.neighborhood && selected.cuisine_type && (
                    <span> / </span>
                  )}
                  {selected.cuisine_type && <span>{selected.cuisine_type}</span>}
                </div>
                {selected.address && (
                  <p className="mt-1.5 text-xs text-zinc-600">
                    {selected.address}
                  </p>
                )}
                {selected.private_dining_info && (
                  <p className="mt-1.5 text-xs text-zinc-700 line-clamp-3">
                    {selected.private_dining_info}
                  </p>
                )}
                {selected.approximate_capacity && (
                  <p className="mt-1 text-xs text-zinc-500">
                    Capacity: {selected.approximate_capacity}
                  </p>
                )}
                <Link
                  href={`/restaurants/${selected.id}`}
                  className="mt-2 inline-block text-xs font-medium text-blue-600 hover:underline"
                >
                  View details &rarr;
                </Link>
              </div>
            </Popup>
          )}
        </Map>
      </div>
    </div>
  );
}
