/**
 * CSV Import Script for West Coast Events
 *
 * Usage:
 *   npx tsx scripts/import-csv.ts
 *
 * Requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY env vars
 * (use service role key for write access, not anon key)
 */

import { createClient } from "@supabase/supabase-js";
import { parse } from "csv-parse/sync";
import * as fs from "fs";
import * as path from "path";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error(
    "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables"
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Map CSV filenames to region slugs
const FILE_REGION_MAP: Record<string, string> = {
  "pasadena_glendale_burbank_restaurants.csv": "pasadena-glendale-burbank",
  "south_bay_restaurants.csv": "south-bay",
  "westside_la_restaurants.csv": "westside-la",
  "hollywood_weho_bevhills_restaurants.csv": "hollywood-weho-bevhills",
  "valley_restaurants.csv": "san-fernando-valley",
  "culver_westla_century_city_restaurants.csv": "culver-city-west-la",
  "mid_city_koreatown_restaurants.csv": "mid-city-koreatown",
  "dtla_restaurants.csv": "dtla",
  "eastside_la_restaurants.csv": "eastside-la",
  "malibu_palisades_topanga_restaurants.csv": "malibu-palisades-topanga",
};

// Normalize column headers across different CSV formats
function normalizeHeaders(headers: string[]): string[] {
  return headers.map((h) => {
    const lower = h.trim().toLowerCase();
    if (lower === "restaurant name") return "name";
    if (lower === "neighborhood") return "neighborhood";
    if (lower === "cuisine type") return "cuisine_type";
    if (lower === "address") return "address";
    if (lower === "phone") return "phone";
    if (lower === "email") return "email";
    if (lower === "website") return "website";
    if (lower === "yelp url") return "yelp_url";
    if (lower.includes("private dining") || lower.includes("event"))
      return "private_dining_info";
    if (lower.includes("capacity")) return "approximate_capacity";
    if (lower === "notes") return "notes";
    return lower.replace(/\s+/g, "_");
  });
}

interface RestaurantRow {
  name: string;
  neighborhood: string;
  cuisine_type: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  yelp_url: string;
  private_dining_info: string;
  approximate_capacity: string;
  notes: string;
}

async function importFile(filename: string, regionSlug: string) {
  const csvDir = path.resolve(__dirname, "../../");
  const filePath = path.join(csvDir, filename);

  if (!fs.existsSync(filePath)) {
    console.error(`  File not found: ${filePath}`);
    return;
  }

  const content = fs.readFileSync(filePath, "utf-8");
  const records = parse(content, {
    columns: (headers: string[]) => normalizeHeaders(headers),
    skip_empty_lines: true,
    trim: true,
    relax_column_count: true,
  }) as RestaurantRow[];

  // Look up region ID
  const { data: region, error: regionError } = await supabase
    .from("regions")
    .select("id")
    .eq("slug", regionSlug)
    .single();

  if (regionError || !region) {
    console.error(`  Region not found: ${regionSlug}`, regionError);
    return;
  }

  // Transform rows
  const rows = records.map((r) => ({
    region_id: region.id,
    name: r.name || null,
    neighborhood: r.neighborhood || null,
    cuisine_type: r.cuisine_type || null,
    address: r.address || null,
    phone: r.phone || null,
    email: r.email || null,
    website: r.website || null,
    yelp_url: r.yelp_url || null,
    private_dining_info: r.private_dining_info || null,
    approximate_capacity: r.approximate_capacity || null,
    notes: r.notes || null,
  }));

  // Insert in batches of 50
  const batchSize = 50;
  let inserted = 0;
  for (let i = 0; i < rows.length; i += batchSize) {
    const batch = rows.slice(i, i + batchSize);
    const { error } = await supabase.from("restaurants").insert(batch);
    if (error) {
      console.error(`  Error inserting batch at row ${i}:`, error.message);
    } else {
      inserted += batch.length;
    }
  }

  console.log(`  Inserted ${inserted}/${records.length} restaurants`);
}

async function main() {
  console.log("Starting CSV import to Supabase...\n");

  for (const [filename, regionSlug] of Object.entries(FILE_REGION_MAP)) {
    console.log(`Importing ${filename} → ${regionSlug}`);
    await importFile(filename, regionSlug);
  }

  console.log("\nDone!");
}

main().catch(console.error);
