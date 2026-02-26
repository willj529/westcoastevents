import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// GET: return next un-geocoded restaurant
export async function GET() {
  if (!serviceRoleKey) {
    return NextResponse.json(
      { error: "SUPABASE_SERVICE_ROLE_KEY not configured on server" },
      { status: 500 }
    );
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);

  // Count totals
  const { count: totalCount } = await supabase
    .from("restaurants")
    .select("*", { count: "exact", head: true });

  const { count: geocodedCount } = await supabase
    .from("restaurants")
    .select("*", { count: "exact", head: true })
    .not("latitude", "is", null);

  const { count: noAddressCount } = await supabase
    .from("restaurants")
    .select("*", { count: "exact", head: true })
    .or("address.is.null,address.eq.");

  // Get next restaurant to geocode
  const { data: next } = await supabase
    .from("restaurants")
    .select("id, name, address")
    .is("latitude", null)
    .not("address", "is", null)
    .neq("address", "")
    .order("id")
    .limit(1)
    .single();

  return NextResponse.json({
    total: totalCount || 0,
    geocoded: geocodedCount || 0,
    noAddress: noAddressCount || 0,
    remaining: (totalCount || 0) - (geocodedCount || 0) - (noAddressCount || 0),
    next: next || null,
  });
}

// POST: geocode a specific restaurant by ID
export async function POST(request: Request) {
  if (!serviceRoleKey) {
    return NextResponse.json(
      { error: "SUPABASE_SERVICE_ROLE_KEY not configured on server" },
      { status: 500 }
    );
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);
  const { id, address } = await request.json();

  if (!id || !address) {
    return NextResponse.json({ error: "Missing id or address" }, { status: 400 });
  }

  // Call Nominatim
  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`;
  const res = await fetch(url, {
    headers: { "User-Agent": "WestCoastPrivateEvents/1.0" },
  });

  if (!res.ok) {
    return NextResponse.json(
      { error: `Nominatim returned ${res.status}` },
      { status: 502 }
    );
  }

  const data = await res.json();

  if (data.length === 0) {
    // Mark as attempted but not found (set to 0,0 would be wrong, just skip)
    return NextResponse.json({ success: false, reason: "Address not found" });
  }

  const lat = parseFloat(data[0].lat);
  const lon = parseFloat(data[0].lon);

  const { error } = await supabase
    .from("restaurants")
    .update({ latitude: lat, longitude: lon })
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, lat, lon });
}
