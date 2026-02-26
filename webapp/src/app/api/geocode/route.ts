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

  const { count: failedCount } = await supabase
    .from("restaurants")
    .select("*", { count: "exact", head: true })
    .eq("geocode_failed", true);

  // Get next restaurant to geocode (skip previously failed ones)
  const { data: next } = await supabase
    .from("restaurants")
    .select("id, name, address")
    .is("latitude", null)
    .not("address", "is", null)
    .neq("address", "")
    .or("geocode_failed.is.null,geocode_failed.eq.false")
    .order("id")
    .limit(1)
    .single();

  const total = totalCount || 0;
  const geocoded = geocodedCount || 0;
  const noAddress = noAddressCount || 0;
  const failed = failedCount || 0;

  return NextResponse.json({
    total,
    geocoded,
    noAddress,
    failed,
    remaining: total - geocoded - noAddress - failed,
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
    // Mark as failed so it gets skipped on future runs
    await supabase
      .from("restaurants")
      .update({ geocode_failed: true })
      .eq("id", id);
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
