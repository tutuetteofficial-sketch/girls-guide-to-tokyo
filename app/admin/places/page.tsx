"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

type RelatedName = {
  name: string;
};

type Place = {
  id: string;
  name: string;
  address: string | null;
  status: string;

  place_types: RelatedName[] | null;
  regions: RelatedName[] | null;
  areas: RelatedName[] | null;
};

export default function AdminPlacesPage() {
  const [places, setPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    loadPlaces();
  }, []);

  async function loadPlaces() {
    setLoading(true);

    const { data, error } = await supabase
      .from("places")
      .select(`
        id,
        name,
        address,
        status,
        place_types (
          name
        ),
        regions (
          name
        ),
        areas (
          name
        )
      `)
      .order("name");

    if (error) {
      console.error(error);
      alert(error.message);
      setLoading(false);
      return;
    }

    setPlaces((data || []) as Place[]);
    setLoading(false);
  }

  const filteredPlaces = places.filter((place) => {
    const keyword = search.toLowerCase();

    const placeTypeName =
      place.place_types?.[0]?.name?.toLowerCase() || "";

    const regionName =
      place.regions?.[0]?.name?.toLowerCase() || "";

    const areaName =
      place.areas?.[0]?.name?.toLowerCase() || "";

    const address =
      place.address?.toLowerCase() || "";

    return (
      place.name.toLowerCase().includes(keyword) ||
      address.includes(keyword) ||
      placeTypeName.includes(keyword) ||
      regionName.includes(keyword) ||
      areaName.includes(keyword)
    );
  });

  return (
    <main
      style={{
        maxWidth: "1200px",
        margin: "0 auto",
        padding: "40px 24px",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "20px",
          marginBottom: "32px",
        }}
      >
        <div>
          <h1 style={{ margin: 0 }}>
            Places
          </h1>

          <p style={{ color: "#666" }}>
            Restaurants, shops, sightseeing spots and other places
          </p>
        </div>

        <Link
          href="/admin/places/new"
          style={{
            background: "#111",
            color: "#fff",
            padding: "12px 18px",
            borderRadius: "8px",
            textDecoration: "none",
          }}
        >
          + Add Place
        </Link>
      </div>

      <input
        type="text"
        placeholder="Search places..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{
          width: "100%",
          padding: "14px",
          border: "1px solid #ddd",
          borderRadius: "8px",
          marginBottom: "24px",
          fontSize: "16px",
          boxSizing: "border-box",
        }}
      />

      {loading ? (
        <p>Loading...</p>
      ) : filteredPlaces.length === 0 ? (
        <div
          style={{
            padding: "40px",
            textAlign: "center",
            border: "1px solid #eee",
            borderRadius: "12px",
          }}
        >
          <p>No places yet.</p>

          <Link href="/admin/places/new">
            Add your first place
          </Link>
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gap: "12px",
          }}
        >
          {filteredPlaces.map((place) => {
            const placeTypeName =
              place.place_types?.[0]?.name;

            const regionName =
              place.regions?.[0]?.name;

            const areaName =
              place.areas?.[0]?.name;

            return (
              <Link
                key={place.id}
                href={`/admin/places/${place.id}`}
                style={{
                  display: "block",
                  padding: "20px",
                  border: "1px solid #e5e5e5",
                  borderRadius: "12px",
                  textDecoration: "none",
                  color: "inherit",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: "20px",
                  }}
                >
                  <div>
                    <h2
                      style={{
                        margin: "0 0 8px",
                        fontSize: "18px",
                      }}
                    >
                      {place.name}
                    </h2>

                    <div
                      style={{
                        display: "flex",
                        gap: "8px",
                        flexWrap: "wrap",
                        fontSize: "14px",
                        color: "#666",
                      }}
                    >
                      {placeTypeName && (
                        <span>
                          {placeTypeName}
                        </span>
                      )}

                      {regionName && (
                        <span>
                          • {regionName}
                        </span>
                      )}

                      {areaName && (
                        <span>
                          • {areaName}
                        </span>
                      )}
                    </div>

                    {place.address && (
                      <p
                        style={{
                          margin: "10px 0 0",
                          color: "#777",
                          fontSize: "14px",
                        }}
                      >
                        {place.address}
                      </p>
                    )}
                  </div>

                  <div>
                    <span
                      style={{
                        fontSize: "13px",
                        padding: "6px 10px",
                        borderRadius: "999px",
                        background:
                          place.status === "published"
                            ? "#e8f7ee"
                            : "#f3f3f3",
                      }}
                    >
                      {place.status}
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </main>
  );
}