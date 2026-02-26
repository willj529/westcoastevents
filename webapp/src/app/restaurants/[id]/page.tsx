import Link from "next/link";
import { notFound } from "next/navigation";
import { supabase } from "@/lib/supabase";
import type { RestaurantWithRegion } from "@/types/database";

export const revalidate = 60;

function InfoRow({
  label,
  value,
  href,
}: {
  label: string;
  value: string | null;
  href?: string;
}) {
  if (!value) return null;
  return (
    <div className="flex gap-3 py-2.5 border-b border-zinc-100 last:border-0">
      <span className="w-36 shrink-0 text-sm font-medium text-zinc-500">
        {label}
      </span>
      <span className="text-sm">
        {href ? (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline break-all"
          >
            {value}
          </a>
        ) : (
          value
        )}
      </span>
    </div>
  );
}

export default async function RestaurantPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const { data: restaurant } = await supabase
    .from("restaurants")
    .select("*, regions(*)")
    .eq("id", id)
    .single();

  if (!restaurant) notFound();

  const r = restaurant as RestaurantWithRegion;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <Link
        href={`/regions/${r.regions.slug}`}
        className="mb-4 inline-block text-sm text-zinc-500 hover:text-zinc-700"
      >
        &larr; {r.regions.name}
      </Link>

      <div className="rounded-lg border border-zinc-200 bg-white">
        <div className="border-b border-zinc-100 p-6">
          <h1 className="text-2xl font-bold tracking-tight">{r.name}</h1>
          <div className="mt-2 flex flex-wrap gap-2 text-sm text-zinc-500">
            {r.neighborhood && <span>{r.neighborhood}</span>}
            {r.neighborhood && r.cuisine_type && (
              <span className="text-zinc-300">/</span>
            )}
            {r.cuisine_type && <span>{r.cuisine_type}</span>}
          </div>
        </div>

        <div className="p-6">
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wider text-zinc-400">
            Contact
          </h2>
          <div className="mb-6">
            <InfoRow label="Address" value={r.address} />
            <InfoRow
              label="Phone"
              value={r.phone}
              href={r.phone ? `tel:${r.phone.replace(/\D/g, "")}` : undefined}
            />
            <InfoRow
              label="Email"
              value={r.email}
              href={
                r.email && r.email.includes("@")
                  ? `mailto:${r.email}`
                  : r.email || undefined
              }
            />
            <InfoRow label="Website" value={r.website} href={r.website || undefined} />
            <InfoRow label="Yelp" value={r.yelp_url ? "View on Yelp" : null} href={r.yelp_url || undefined} />
          </div>

          {(r.private_dining_info || r.approximate_capacity) && (
            <>
              <h2 className="mb-2 text-sm font-semibold uppercase tracking-wider text-zinc-400">
                Events & Private Dining
              </h2>
              <div className="mb-6">
                <InfoRow
                  label="Private Dining"
                  value={r.private_dining_info}
                />
                <InfoRow label="Capacity" value={r.approximate_capacity} />
              </div>
            </>
          )}

          {r.notes && (
            <>
              <h2 className="mb-2 text-sm font-semibold uppercase tracking-wider text-zinc-400">
                Notes
              </h2>
              <p className="text-sm text-zinc-700 leading-relaxed">{r.notes}</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
