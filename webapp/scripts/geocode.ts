/**
 * Geocoding Script for West Coast Events
 *
 * Uses the free Nominatim (OpenStreetMap) API to geocode restaurant addresses.
 * Nominatim requires max 1 request/second, so this runs slowly but is free.
 *
 * Usage:
 *   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... npx tsx scripts/geocode.ts
 *
 * Options:
 *   --limit N     Only geocode N restaurants (default: all)
 *   --region SLUG Only geocode restaurants in a specific region
 */

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function geocodeAddress(address: string): Promise<{ lat: number; lon: number } | null> {
  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`;

  const res = await fetch(url, {
    headers: { "User-Agent": "WestCoastEvents/1.0" },
  });

  if (!res.ok) {
    console.error(`  Nominatim error ${res.status}: ${res.statusText}`);
    return null;
  }

  const data = await res.json();
  if (data.length === 0) return null;

  return {
    lat: parseFloat(data[0].lat),
    lon: parseFloat(data[0].lon),
  };
}

async function main() {
  const args = process.argv.slice(2);
  const limitIdx = args.indexOf("--limit");
  const regionIdx = args.indexOf("--region");
  const limit = limitIdx >= 0 ? parseInt(args[limitIdx + 1], 10) : undefined;
  const regionSlug = regionIdx >= 0 ? args[regionIdx + 1] : undefined;

  // Fetch restaurants without coordinates that have addresses
  let query = supabase
    .from("restaurants")
    .select("id, name, address, region_id, regions(slug)")
    .is("latitude", null)
    .not("address", "is", null)
    .neq("address", "")
    .order("id");

  if (regionSlug) {
    const { data: region } = await supabase
      .from("regions")
      .select("id")
      .eq("slug", regionSlug)
      .single();
    if (!region) {
      console.error(`Region not found: ${regionSlug}`);
      process.exit(1);
    }
    query = query.eq("region_id", region.id);
  }

  if (limit) {
    query = query.limit(limit);
  }

  const { data: restaurants, error } = await query;

  if (error) {
    console.error("Error fetching restaurants:", error.message);
    process.exit(1);
  }

  console.log(`Found ${restaurants.length} restaurants to geocode\n`);

  let success = 0;
  let failed = 0;

  for (let i = 0; i < restaurants.length; i++) {
    const r = restaurants[i];
    process.stdout.write(`[${i + 1}/${restaurants.length}] ${r.name}... `);

    const coords = await geocodeAddress(r.address!);

    if (coords) {
      const { error: updateError } = await supabase
        .from("restaurants")
        .update({ latitude: coords.lat, longitude: coords.lon })
        .eq("id", r.id);

      if (updateError) {
        console.log(`DB error: ${updateError.message}`);
        failed++;
      } else {
        console.log(`${coords.lat.toFixed(5)}, ${coords.lon.toFixed(5)}`);
        success++;
      }
    } else {
      console.log("not found");
      failed++;
    }

    // Rate limit: 1 request per second for Nominatim
    if (i < restaurants.length - 1) {
      await sleep(1100);
    }
  }

  console.log(`\nDone! ${success} geocoded, ${failed} failed.`);
}

main().catch(console.error);
