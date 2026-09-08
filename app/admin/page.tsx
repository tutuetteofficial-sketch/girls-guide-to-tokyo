"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type CountData = {
  places: number;
  foods: number;
  products: number;
  placeTypes: number;
  foodCategories: number;
  productCategories: number;
  regions: number;
};

type RecentPlace = {
  id: string;
  name: string;
  status: string;
  updated_at: string | null;
  address: string | null;
  place_types: { name: string }[] | null;
  regions: { name: string }[] | null;
  areas: { name: string }[] | null;
};

type RecentFood = {
  id: string;
  name: string;
  status: string;
  editor_pick: number;
  updated_at: string | null;
  foods_categories?: never;
  food_categories: { name: string }[] | null;
};

type RecentProduct = {
  id: string;
  name: string;
  brand: string | null;
  status: string;
  updated_at: string | null;
  product_categories: { name: string }[] | null;
};

export default function AdminDashboard() {
  const router = useRouter();

  const [counts, setCounts] = useState<CountData>({
    places: 0,
    foods: 0,
    products: 0,
    placeTypes: 0,
    foodCategories: 0,
    productCategories: 0,
    regions: 0,
  });

  const [recentPlaces, setRecentPlaces] = useState<RecentPlace[]>([]);
  const [recentFoods, setRecentFoods] = useState<RecentFood[]>([]);
  const [recentProducts, setRecentProducts] = useState<RecentProduct[]>([]);

  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.replace("/login");
    router.refresh();
  };

  useEffect(() => {
    async function loadDashboard() {
      setLoading(true);
      setErrorMessage("");

      const [
        placesCount,
        foodsCount,
        productsCount,
        placeTypesCount,
        foodCategoriesCount,
        productCategoriesCount,
        regionsCount,
        recentPlacesResult,
        recentFoodsResult,
        recentProductsResult,
      ] = await Promise.all([
        supabase.from("places").select("*", {
          count: "exact",
          head: true,
        }),

        supabase.from("foods").select("*", {
          count: "exact",
          head: true,
        }),

        supabase.from("products").select("*", {
          count: "exact",
          head: true,
        }),

        supabase.from("place_types").select("*", {
          count: "exact",
          head: true,
        }),

        supabase.from("food_categories").select("*", {
          count: "exact",
          head: true,
        }),

        supabase.from("product_categories").select("*", {
          count: "exact",
          head: true,
        }),

        supabase.from("regions").select("*", {
          count: "exact",
          head: true,
        }),

        supabase
          .from("places")
          .select(`
            id,
            name,
            status,
            updated_at,
            address,
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
          .order("updated_at", {
            ascending: false,
          })
          .limit(5),

        supabase
          .from("foods")
          .select(`
            id,
            name,
            status,
            editor_pick,
            updated_at,
            food_categories (
              name
            )
          `)
          .order("updated_at", {
            ascending: false,
          })
          .limit(5),

        supabase
          .from("products")
          .select(`
            id,
            name,
            brand,
            status,
            updated_at,
            product_categories (
              name
            )
          `)
          .order("updated_at", {
            ascending: false,
          })
          .limit(5),
      ]);

      const firstError =
        placesCount.error ||
        foodsCount.error ||
        productsCount.error ||
        placeTypesCount.error ||
        foodCategoriesCount.error ||
        productCategoriesCount.error ||
        regionsCount.error ||
        recentPlacesResult.error ||
        recentFoodsResult.error ||
        recentProductsResult.error;

      if (firstError) {
        setErrorMessage(firstError.message);
        setLoading(false);
        return;
      }

      setCounts({
        places: placesCount.count ?? 0,
        foods: foodsCount.count ?? 0,
        products: productsCount.count ?? 0,
        placeTypes: placeTypesCount.count ?? 0,
        foodCategories: foodCategoriesCount.count ?? 0,
        productCategories: productCategoriesCount.count ?? 0,
        regions: regionsCount.count ?? 0,
      });

      setRecentPlaces(
        (recentPlacesResult.data ?? []) as unknown as RecentPlace[]
      );

      setRecentFoods(
        (recentFoodsResult.data ?? []) as unknown as RecentFood[]
      );

      setRecentProducts(
        (recentProductsResult.data ?? []) as unknown as RecentProduct[]
      );

      setLoading(false);
    }

    loadDashboard();
  }, []);

  const stats = [
    {
      label: "Places",
      value: counts.places,
      href: "/admin/places",
    },
    {
      label: "Foods",
      value: counts.foods,
      href: "/admin/food",
    },
    {
      label: "Products",
      value: counts.products,
      href: "/admin/products",
    },
    {
      label: "Place Types",
      value: counts.placeTypes,
      href: "/admin/place-types",
    },
    {
      label: "Food Categories",
      value: counts.foodCategories,
      href: "/admin/food-categories",
    },
    {
      label: "Regions",
      value: counts.regions,
      href: "/admin/regions",
    },
  ];

  return (
    <main style={styles.main}>
      <div style={styles.container}>
        <header style={styles.header}>
          <div style={styles.topBar}>
            <Link href="/" style={styles.logo}>
              TOKYO GUIDE
            </Link>

            <button
              onClick={handleLogout}
              style={styles.logoutButton}
            >
              Log out
            </button>
          </div>

          <p style={styles.eyebrow}>
            CONTENT MANAGEMENT
          </p>

          <h1 style={styles.title}>
            Admin Dashboard
          </h1>

          <p style={styles.description}>
            Manage TOKYO GUIDE content.
          </p>
        </header>

        {errorMessage && (
          <div style={styles.error}>
            {errorMessage}
          </div>
        )}

        <section style={styles.statsGrid}>
          {stats.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              style={styles.statCard}
            >
              <span style={styles.statLabel}>
                {item.label}
              </span>

              <strong style={styles.statNumber}>
                {loading ? "—" : item.value}
              </strong>

              <span style={styles.statArrow}>
                →
              </span>
            </Link>
          ))}
        </section>

        <section style={styles.section}>
          <div style={styles.sectionHeader}>
            <h2 style={styles.sectionTitle}>
              Create
            </h2>
          </div>

          <div style={styles.actionGrid}>
            <Link
              href="/admin/places/new"
              style={styles.actionCard}
            >
              <span style={styles.actionPlus}>+</span>

              <strong>Place</strong>

              <span>
                Add a restaurant, shop, sightseeing spot or other place.
              </span>
            </Link>

            <Link
              href="/admin/food/new"
              style={styles.actionCard}
            >
              <span style={styles.actionPlus}>+</span>

              <strong>Food</strong>

              <span>
                Add an individual food item and connect it to a place.
              </span>
            </Link>

            <Link
              href="/admin/products/new"
              style={styles.actionCard}
            >
              <span style={styles.actionPlus}>+</span>

              <strong>Product</strong>

              <span>
                Add a product and connect it to places where it is available.
              </span>
            </Link>
          </div>
        </section>

        <section style={styles.section}>
          <div style={styles.sectionHeader}>
            <h2 style={styles.sectionTitle}>
              Recent Places
            </h2>

            <Link
              href="/admin/places"
              style={styles.viewAll}
            >
              View all →
            </Link>
          </div>

          <div style={styles.table}>
            <div style={styles.tableHeaderFour}>
              <span>Name</span>
              <span>Type</span>
              <span>Area</span>
              <span>Status</span>
            </div>

            {recentPlaces.length === 0 ? (
              <div style={styles.empty}>
                No places yet.
              </div>
            ) : (
              recentPlaces.map((place) => (
                <Link
                  href={`/admin/places/${place.id}`}
                  key={place.id}
                  style={styles.tableRowFour}
                >
                  <strong>{place.name}</strong>

                  <span>
                    {place.place_types?.[0]?.name ?? "—"}
                  </span>

                  <span>
                    {place.areas?.[0]?.name ??
                      place.regions?.[0]?.name ??
                      "—"}
                  </span>

                  <StatusBadge status={place.status} />
                </Link>
              ))
            )}
          </div>
        </section>

        <section style={styles.section}>
          <div style={styles.sectionHeader}>
            <h2 style={styles.sectionTitle}>
              Recent Foods
            </h2>

            <Link
              href="/admin/food"
              style={styles.viewAll}
            >
              View all →
            </Link>
          </div>

          <div style={styles.table}>
            <div style={styles.tableHeaderThree}>
              <span>Food</span>
              <span>Pick</span>
              <span>Status</span>
            </div>

            {recentFoods.length === 0 ? (
              <div style={styles.empty}>
                No foods yet.
              </div>
            ) : (
              recentFoods.map((food) => (
                <Link
                  href={`/admin/food/${food.id}`}
                  key={food.id}
                  style={styles.tableRowThree}
                >
                  <strong>{food.name}</strong>

                  <span style={styles.foodPick}>
                    {food.editor_pick > 0
                      ? "★".repeat(food.editor_pick)
                      : "—"}
                  </span>

                  <StatusBadge status={food.status} />
                </Link>
              ))
            )}
          </div>
        </section>

        <section style={styles.section}>
          <div style={styles.sectionHeader}>
            <h2 style={styles.sectionTitle}>
              Recent Products
            </h2>

            <Link
              href="/admin/products"
              style={styles.viewAll}
            >
              View all →
            </Link>
          </div>

          <div style={styles.table}>
            <div style={styles.tableHeaderFour}>
              <span>Product</span>
              <span>Brand</span>
              <span>Category</span>
              <span>Status</span>
            </div>

            {recentProducts.length === 0 ? (
              <div style={styles.empty}>
                No products yet.
              </div>
            ) : (
              recentProducts.map((product) => (
                <Link
                  href={`/admin/products/${product.id}`}
                  key={product.id}
                  style={styles.tableRowFour}
                >
                  <strong>{product.name}</strong>

                  <span>
                    {product.brand ?? "—"}
                  </span>

                  <span>
                    {product.product_categories?.[0]?.name ?? "—"}
                  </span>

                  <StatusBadge status={product.status} />
                </Link>
              ))
            )}
          </div>
        </section>

        <section style={styles.section}>
          <div style={styles.sectionHeader}>
            <h2 style={styles.sectionTitle}>
              Structure
            </h2>
          </div>

          <div style={styles.structureGrid}>
            <Link
              href="/admin/places"
              style={styles.manageLink}
            >
              <span>Places</span>
              <span>→</span>
            </Link>

            <Link
              href="/admin/food"
              style={styles.manageLink}
            >
              <span>Foods</span>
              <span>→</span>
            </Link>

            <Link
              href="/admin/place-types"
              style={styles.manageLink}
            >
              <span>Place Types</span>
              <span>→</span>
            </Link>

            <Link
              href="/admin/food-categories"
              style={styles.manageLink}
            >
              <span>Food Categories</span>
              <span>→</span>
            </Link>

            <Link
              href="/admin/product-categories"
              style={styles.manageLink}
            >
              <span>Product Categories</span>
              <span>→</span>
            </Link>

            <Link
              href="/admin/regions"
              style={styles.manageLink}
            >
              <span>Regions</span>
              <span>→</span>
            </Link>

            <Link
              href="/admin/areas"
              style={styles.manageLink}
            >
              <span>Areas</span>
              <span>→</span>
            </Link>

            <Link
              href="/admin/stations"
              style={styles.manageLink}
            >
              <span>Stations</span>
              <span>→</span>
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}

function StatusBadge({
  status,
}: {
  status: string;
}) {
  const labelMap: Record<string, string> = {
    draft: "Draft",
    published: "Published",
    active: "Active",
    hidden: "Hidden",
    archived: "Archived",
  };

  return (
    <span style={styles.status}>
      {labelMap[status] ?? status}
    </span>
  );
}

const styles = {
  main: {
    minHeight: "100vh",
    background: "#faf8f6",
    color: "#222",
    padding: "40px 24px 90px",
  },

  container: {
    maxWidth: "1180px",
    margin: "0 auto",
  },

  header: {
    marginBottom: "35px",
  },

  topBar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },

  logo: {
    color: "#222",
    textDecoration: "none",
    fontFamily: "Georgia, serif",
    letterSpacing: "2px",
    fontSize: "15px",
  },

  logoutButton: {
    background: "transparent",
    border: "1px solid #e7e0dc",
    borderRadius: "999px",
    padding: "8px 14px",
    cursor: "pointer",
    fontSize: "12px",
    color: "#555",
  },

  eyebrow: {
    color: "#c8647b",
    fontSize: "10px",
    fontWeight: 700,
    letterSpacing: "3px",
    marginTop: "38px",
    marginBottom: "8px",
  },

  title: {
    fontFamily: "Georgia, serif",
    fontWeight: 400,
    fontSize: "48px",
    margin: 0,
  },

  description: {
    color: "#777",
    marginTop: "12px",
  },

  error: {
    background: "#fff1f1",
    border: "1px solid #edcaca",
    color: "#a44",
    borderRadius: "12px",
    padding: "15px",
    marginBottom: "22px",
  },

  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
    gap: "10px",
  },

  statCard: {
    position: "relative" as const,
    background: "#fff",
    border: "1px solid #e7e0dc",
    borderRadius: "15px",
    padding: "18px",
    textDecoration: "none",
    color: "inherit",
    minHeight: "120px",
  },

  statLabel: {
    display: "block",
    color: "#777",
    fontSize: "11px",
  },

  statNumber: {
    display: "block",
    fontFamily: "Georgia, serif",
    fontSize: "32px",
    fontWeight: 400,
    marginTop: "10px",
  },

  statArrow: {
    position: "absolute" as const,
    right: "16px",
    bottom: "16px",
    color: "#c8647b",
  },

  section: {
    marginTop: "30px",
  },

  sectionHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "12px",
  },

  sectionTitle: {
    fontFamily: "Georgia, serif",
    fontWeight: 400,
    fontSize: "25px",
    margin: 0,
  },

  viewAll: {
    fontSize: "12px",
    color: "#777",
    textDecoration: "none",
  },

  actionGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
    gap: "12px",
  },

  actionCard: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "8px",
    background: "#222",
    color: "#fff",
    borderRadius: "15px",
    padding: "20px",
    textDecoration: "none",
    minHeight: "145px",
  },

  actionPlus: {
    fontSize: "25px",
    fontWeight: 300,
  },

  table: {
    background: "#fff",
    border: "1px solid #e7e0dc",
    borderRadius: "15px",
    overflow: "hidden",
  },

  tableHeaderFour: {
    display: "grid",
    gridTemplateColumns: "2fr 1fr 1fr 110px",
    gap: "15px",
    padding: "12px 18px",
    background: "#f7f3f0",
    color: "#888",
    fontSize: "10px",
    textTransform: "uppercase" as const,
    letterSpacing: "1px",
  },

  tableRowFour: {
    display: "grid",
    gridTemplateColumns: "2fr 1fr 1fr 110px",
    gap: "15px",
    padding: "16px 18px",
    borderTop: "1px solid #eee8e4",
    color: "#222",
    textDecoration: "none",
    alignItems: "center",
    fontSize: "13px",
  },

  tableHeaderThree: {
    display: "grid",
    gridTemplateColumns: "2fr 1fr 110px",
    gap: "15px",
    padding: "12px 18px",
    background: "#f7f3f0",
    color: "#888",
    fontSize: "10px",
    textTransform: "uppercase" as const,
    letterSpacing: "1px",
  },

  tableRowThree: {
    display: "grid",
    gridTemplateColumns: "2fr 1fr 110px",
    gap: "15px",
    padding: "16px 18px",
    borderTop: "1px solid #eee8e4",
    color: "#222",
    textDecoration: "none",
    alignItems: "center",
    fontSize: "13px",
  },

  status: {
    display: "inline-block",
    width: "fit-content",
    padding: "5px 8px",
    borderRadius: "999px",
    background: "#f3eeeb",
    color: "#666",
    fontSize: "10px",
  },

  foodPick: {
    color: "#c8647b",
    fontSize: "11px",
  },

  empty: {
    padding: "30px 18px",
    color: "#999",
    textAlign: "center" as const,
    fontSize: "13px",
  },

  structureGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
    gap: "10px",
    paddingBottom: "20px",
  },

  manageLink: {
    display: "flex",
    justifyContent: "space-between",
    background: "#fff",
    border: "1px solid #e7e0dc",
    borderRadius: "12px",
    padding: "16px",
    textDecoration: "none",
    color: "#222",
    fontSize: "13px",
  },
};