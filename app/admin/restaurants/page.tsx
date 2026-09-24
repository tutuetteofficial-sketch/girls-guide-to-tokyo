"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Restaurant = {
  id: string;
  name: string;
  restaurant_type: string | null;
  area_id: number | null;
  status: string | null;
};

export default function RestaurantsPage() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    loadRestaurants();
  }, []);

  async function loadRestaurants() {
    setLoading(true);
    setErrorMessage("");

    try {
      const { data, error } = await supabase
        .from("restaurants")
        .select(`
          id,
          name,
          restaurant_type,
          area_id,
          status
        `)
        .order("name");

      if (error) {
        throw error;
      }

      setRestaurants(data ?? []);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Failed to load restaurants."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={styles.page}>
      <div style={styles.container}>

        <div style={styles.top}>
          <div>
            <p style={styles.eyebrow}>
              TOKYO GUIDE ADMIN
            </p>

            <h1 style={styles.title}>
              Restaurants & Cafés
            </h1>

            <p style={styles.subtitle}>
              Manage restaurants, cafés and their signatures.
            </p>
          </div>

          <Link
            href="/admin/restaurants/new"
            style={styles.add}
          >
            + Add Restaurant / Café
          </Link>
        </div>

        {errorMessage && (
          <div style={styles.error}>
            {errorMessage}
          </div>
        )}

        {loading ? (
          <div style={styles.card}>
            Loading...
          </div>
        ) : restaurants.length === 0 ? (
          <div style={styles.empty}>
            <p>No restaurants or cafés yet.</p>

            <Link
              href="/admin/restaurants/new"
              style={styles.emptyLink}
            >
              Add your first restaurant / café →
            </Link>
          </div>
        ) : (
          <div style={styles.list}>
            {restaurants.map((restaurant) => (
              <Link
                key={restaurant.id}
                href={`/admin/restaurants/${restaurant.id}`}
                style={styles.item}
              >
                <div>
                  <div style={styles.name}>
                    {restaurant.name}
                  </div>

                  <div style={styles.meta}>
                    {restaurant.restaurant_type === "cafe"
                      ? "Café"
                      : "Restaurant"}

                    {restaurant.status
                      ? ` · ${restaurant.status}`
                      : ""}
                  </div>
                </div>

                <div style={styles.arrow}>
                  →
                </div>
              </Link>
            ))}
          </div>
        )}

      </div>
    </main>
  );
}

const styles: Record<
  string,
  React.CSSProperties
> = {
  page: {
    minHeight: "100vh",
    padding: 40,
    background: "#fff8fb",
  },

  container: {
    maxWidth: 1000,
    margin: "0 auto",
  },

  top: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-end",
    gap: 30,
    marginBottom: 30,
  },

  eyebrow: {
    fontSize: 11,
    fontWeight: 800,
    letterSpacing: "0.15em",
    color: "#b2819c",
    marginBottom: 6,
  },

  title: {
    margin: 0,
    color: "#463c46",
  },

  subtitle: {
    marginTop: 8,
    color: "#806878",
  },

  add: {
    display: "inline-block",
    padding: "13px 18px",
    borderRadius: 12,
    background: "#d98eae",
    color: "#fff",
    textDecoration: "none",
    fontWeight: 700,
    whiteSpace: "nowrap",
  },

  card: {
    background: "#fff",
    padding: 30,
    borderRadius: 20,
    border: "1px solid #eadde4",
  },

  list: {
    display: "grid",
    gap: 12,
  },

  item: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    background: "#fff",
    border: "1px solid #eadde4",
    borderRadius: 16,
    textDecoration: "none",
    color: "inherit",
  },

  name: {
    fontSize: 17,
    fontWeight: 750,
    color: "#463c46",
  },

  meta: {
    marginTop: 5,
    fontSize: 13,
    color: "#927d89",
  },

  arrow: {
    fontSize: 20,
    color: "#b2819c",
  },

  empty: {
    padding: 50,
    background: "#fff",
    border: "1px solid #eadde4",
    borderRadius: 20,
    textAlign: "center",
    color: "#806878",
  },

  emptyLink: {
    color: "#9a6078",
    textDecoration: "none",
    fontWeight: 700,
  },

  error: {
    padding: 15,
    marginBottom: 15,
    borderRadius: 12,
    background: "#fff0f2",
    color: "#b45165",
  },
};