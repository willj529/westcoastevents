"use client";

import { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import type { Region, Restaurant } from "@/types/database";

type RestaurantRow = Restaurant & { regions: Pick<Region, "name" | "slug"> };

const MapContainer = dynamic(
  () => import("react-leaflet").then((mod) => mod.MapContainer),
  { ssr: false }
);
const TileLayer = dynamic(
  () => import("react-leaflet").then((mod) => mod.TileLayer),
  { ssr: false }
);
const Marker = dynamic(
  () => import("react-leaflet").then((mod) => mod.Marker),
  { ssr: false }
);
const Popup = dynamic(
  () => import("react-leaflet").then((mod) => mod.Popup),
  { ssr: false }
);

function MapInner({
  restaurants,
  icon,
}: {
  restaurants: RestaurantRow[];
  icon: L.Icon | null;
}) {
  if (!icon) return null;

  return (
    <>
      {restaurants.map((r) => (
        <Marker
          key={r.id}
          position={[r.latitude!, r.longitude!]}
          icon={icon}
        >
          <Popup maxWidth={320} minWidth={240}>
            <div className="font-sans">
              <h3 className="text-base font-semibold leading-tight">
                {r.name}
              </h3>
              <div className="mt-1 text-xs text-zinc-500">
                {r.neighborhood && <span>{r.neighborhood}</span>}
                {r.neighborhood && r.cuisine_type && <span> / </span>}
                {r.cuisine_type && <span>{r.cuisine_type}</span>}
              </div>
              {r.address && (
                <p className="mt-1.5 text-xs text-zinc-600">{r.address}</p>
              )}
              {r.private_dining_info && (
                <p className="mt-1.5 text-xs text-zinc-700 line-clamp-3">
                  {r.private_dining_info}
                </p>
              )}
              {r.approximate_capacity && (
                <p className="mt-1 text-xs text-zinc-500">
                  Capacity: {r.approximate_capacity}
                </p>
              )}
              <Link
                href={`/restaurants/${r.id}`}
                className="mt-2 inline-block text-xs font-medium text-blue-600 hover:underline"
              >
                View details &rarr;
              </Link>
            </div>
          </Popup>
        </Marker>
      ))}
    </>
  );
}

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
  const [icon, setIcon] = useState<L.Icon | null>(null);
  const [mounted, setMounted] = useState(false);

  // Load Leaflet CSS and icon on mount
  useMemo(() => {
    if (typeof window === "undefined") return;
    if (mounted) return;
    setMounted(true);

    // Load CSS
    if (!document.querySelector('link[href*="leaflet"]')) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(link);
    }

    // Create icon
    import("leaflet").then((L) => {
      setIcon(
        new L.Icon({
          iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
          iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
          shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
          iconSize: [25, 41],
          iconAnchor: [12, 41],
          popupAnchor: [1, -34],
          shadowSize: [41, 41],
        })
      );
    });
  }, [mounted]);

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

  // Center on LA
  const center: [number, number] = [34.05, -118.35];

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
        {mounted && icon ? (
          <MapContainer
            center={center}
            zoom={10}
            style={{ height: "100%", width: "100%" }}
            scrollWheelZoom={true}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <MapInner restaurants={filtered} icon={icon} />
          </MapContainer>
        ) : (
          <div className="flex h-full items-center justify-center text-zinc-400">
            Loading map...
          </div>
        )}
      </div>
    </div>
  );
}
