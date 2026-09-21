"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import MyListMap, {
  type MapPlace,
} from "@/components/MyListMap";

type SavedItem = {
  id: string;
  user_id: string;
  food_id: string | null;
  product_id: string | null;
  place_id: string | null;
  created_at: string;
};

type Food = {
  id: string;
  name: string;
  image_url: string | null;
};

type Product = {
  id: string;
  name: string;
  brand: string | null;
  image_url: string | null;
};

type Place = {
  id: string;
  name: string;
  image_url: string | null;
  latitude: number | null;
  longitude: number | null;
};

type ListItem = {
  id: string;
  type: "food" | "product" | "place";
  name: string;
  image_url: string | null;
  brand: string | null;
  href: string;
};

export default function MyListPage() {
  const router = useRouter();

  const [items, setItems] =
    useState<ListItem[]>([]);

  const [mapPlaces, setMapPlaces] =
    useState<MapPlace[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [notLoggedIn, setNotLoggedIn] =
    useState(false);

  useEffect(() => {
    loadList();
  }, []);

  async function loadList() {
    setLoading(true);

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      setNotLoggedIn(true);
      setLoading(false);
      return;
    }

    const {
      data: savedData,
      error,
    } = await supabase
      .from("saved_items")
      .select(
        "id, user_id, food_id, product_id, place_id, created_at"
      )
      .eq(
        "user_id",
        session.user.id
      )
      .order("created_at", {
        ascending: false,
      });

    if (error) {
      console.error(error);
      setLoading(false);
      return;
    }

    const savedItems =
      (savedData ?? []) as SavedItem[];

    const foodIds = savedItems
      .map((item) => item.food_id)
      .filter(
        (id): id is string =>
          id !== null
      );

    const productIds = savedItems
      .map((item) => item.product_id)
      .filter(
        (id): id is string =>
          id !== null
      );

    const placeIds = savedItems
      .map((item) => item.place_id)
      .filter(
        (id): id is string =>
          id !== null
      );

    const [
      foodsResult,
      productsResult,
      placesResult,
    ] = await Promise.all([
      foodIds.length > 0
        ? supabase
            .from("foods")
            .select(
              "id, name, image_url"
            )
            .in("id", foodIds)
            .eq(
              "status",
              "active"
            )
        : Promise.resolve({
            data: [],
            error: null,
          }),

      productIds.length > 0
        ? supabase
            .from("products")
            .select(
              "id, name, brand, image_url"
            )
            .in(
              "id",
              productIds
            )
            .eq(
              "status",
              "published"
            )
        : Promise.resolve({
            data: [],
            error: null,
          }),

      placeIds.length > 0
        ? supabase
            .from("places")
            .select(
              "id, name, image_url, latitude, longitude"
            )
            .in(
              "id",
              placeIds
            )
            .eq(
              "status",
              "published"
            )
        : Promise.resolve({
            data: [],
            error: null,
          }),
    ]);

    if (foodsResult.error) {
      console.error(
        foodsResult.error
      );
    }

    if (productsResult.error) {
      console.error(
        productsResult.error
      );
    }

    if (placesResult.error) {
      console.error(
        placesResult.error
      );
    }

    const foods =
      (foodsResult.data ??
        []) as Food[];

    const products =
      (productsResult.data ??
        []) as Product[];

    const places =
      (placesResult.data ??
        []) as Place[];

    const foodMap = new Map(
      foods.map((item) => [
        item.id,
        item,
      ])
    );

    const productMap = new Map(
      products.map((item) => [
        item.id,
        item,
      ])
    );

    const placeMap = new Map(
      places.map((item) => [
        item.id,
        item,
      ])
    );

    const result: ListItem[] = [];

    const resultMapPlaces: MapPlace[] =
      [];

    for (const saved of savedItems) {
      if (saved.food_id) {
        const food =
          foodMap.get(
            saved.food_id
          );

        if (food) {
          result.push({
            id: saved.id,
            type: "food",
            name: food.name,
            image_url:
              food.image_url,
            brand: null,
            href: `/food/${food.id}`,
          });
        }
      }

      if (saved.product_id) {
        const product =
          productMap.get(
            saved.product_id
          );

        if (product) {
          result.push({
            id: saved.id,
            type: "product",
            name: product.name,
            image_url:
              product.image_url,
            brand: product.brand,
            href: `/products/${product.id}`,
          });
        }
      }

      if (saved.place_id) {
        const place =
          placeMap.get(
            saved.place_id
          );

        if (place) {
          result.push({
            id: saved.id,
            type: "place",
            name: place.name,
            image_url:
              place.image_url,
            brand: null,
            href: `/places/${place.id}`,
          });

          if (
            place.latitude !== null &&
            place.longitude !== null
          ) {
            resultMapPlaces.push({
              id: place.id,
              name: place.name,
              latitude:
                place.latitude,
              longitude:
                place.longitude,
              href: `/places/${place.id}`,
            });
          }
        }
      }
    }

    setItems(result);
    setMapPlaces(
      resultMapPlaces
    );
    setLoading(false);
  }

  async function removeItem(
    savedId: string
  ) {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      router.push("/login");
      return;
    }

    const { error } =
      await supabase
        .from("saved_items")
        .delete()
        .eq(
          "id",
          savedId
        )
        .eq(
          "user_id",
          session.user.id
        );

    if (error) {
      console.error(error);
      return;
    }

    setItems((current) =>
      current.filter(
        (item) =>
          item.id !== savedId
      )
    );

    await loadList();
  }

  if (loading) {
    return (
      <main style={styles.page}>
        <div style={styles.container}>
          <p
            style={styles.loading}
          >
            Loading...
          </p>
        </div>
      </main>
    );
  }

  if (notLoggedIn) {
    return (
      <main style={styles.page}>
        <div style={styles.container}>
          <section
            style={styles.loginBox}
          >
            <p
              style={styles.eyebrow}
            >
              MY LIST
            </p>

            <h1
              style={styles.title}
            >
              Your saved places,
              <br />
              foods & products
            </h1>

            <p
              style={styles.description}
            >
              Sign in to save your
              favorite finds in
              Tokyo.
            </p>

            <Link
              href="/login?redirect=/my-list"
              style={
                styles.loginButton
              }
            >
              Sign in
            </Link>
          </section>
        </div>
      </main>
    );
  }

  return (
    <main style={styles.page}>
      <div style={styles.container}>
        <header
          style={styles.header}
        >
          <div>
            <p
              style={styles.eyebrow}
            >
              YOUR SAVED LIST
            </p>

            <h1
              style={styles.title}
            >
              MY LIST
            </h1>

            <p
              style={styles.description}
            >
              Your favorite places,
              foods and products in
              one place.
            </p>
          </div>

          <span
            style={styles.count}
          >
            {items.length}{" "}
            {items.length === 1
              ? "saved item"
              : "saved items"}
          </span>
        </header>

        {items.length === 0 ? (
          <section
            style={styles.empty}
          >
            <p
              style={
                styles.emptyTitle
              }
            >
              Nothing saved yet.
            </p>

            <p
              style={
                styles.emptyText
              }
            >
              Explore TOKYO GUIDE
              and save places, foods
              and products you want
              to remember.
            </p>

            <div
              style={styles.links}
            >
              <Link
                href="/food"
                style={
                  styles.exploreLink
                }
              >
                Explore Food
              </Link>

              <Link
                href="/products"
                style={
                  styles.exploreLink
                }
              >
                Explore Products
              </Link>

              <Link
                href="/places"
                style={
                  styles.exploreLink
                }
              >
                Explore Places
              </Link>
            </div>
          </section>
        ) : (
          <>
            <section
              style={styles.mapSection}
            >
              <div
                style={
                  styles.mapHeader
                }
              >
                <div>
                  <p
                    style={
                      styles.mapEyebrow
                    }
                  >
                    SAVED PLACES
                  </p>

                  <h2
                    style={
                      styles.mapTitle
                    }
                  >
                    Your Tokyo Map
                  </h2>
                </div>

                <p
                  style={
                    styles.mapDescription
                  }
                >
                  Your saved places,
                  all in one map.
                </p>
              </div>

              <MyListMap
                places={
                  mapPlaces
                }
              />

              {mapPlaces.length ===
                0 && (
                <p
                  style={
                    styles.mapNotice
                  }
                >
                  Saved places will
                  appear here once
                  their location has
                  been added.
                </p>
              )}
            </section>

            <section
              style={styles.grid}
            >
              {items.map(
                (item) => (
                  <article
                    key={item.id}
                    style={
                      styles.card
                    }
                  >
                    <Link
                      href={
                        item.href
                      }
                      style={
                        styles.cardLink
                      }
                    >
                      <div
                        style={
                          styles.image
                        }
                      >
                        {item.image_url ? (
                          <img
                            src={
                              item.image_url
                            }
                            alt={
                              item.name
                            }
                            style={
                              styles.imageElement
                            }
                          />
                        ) : (
                          <span>
                            TOKYO GUIDE
                          </span>
                        )}
                      </div>

                      <div
                        style={
                          styles.body
                        }
                      >
                        <p
                          style={
                            styles.type
                          }
                        >
                          {item.type.toUpperCase()}
                        </p>

                        {item.brand && (
                          <p
                            style={
                              styles.brand
                            }
                          >
                            {
                              item.brand
                            }
                          </p>
                        )}

                        <h2
                          style={
                            styles.name
                          }
                        >
                          {
                            item.name
                          }
                        </h2>
                      </div>
                    </Link>

                    <button
                      type="button"
                      onClick={() =>
                        removeItem(
                          item.id
                        )
                      }
                      style={
                        styles.removeButton
                      }
                    >
                      Remove
                    </button>
                  </article>
                )
              )}
            </section>
          </>
        )}
      </div>
    </main>
  );
}

const styles = {
  page: {
    minHeight:
      "calc(100vh - 72px)",
    background:
      "#fffaf8",
    color: "#222",
    padding:
      "65px 24px 100px",
  },

  container: {
    maxWidth:
      "1100px",
    margin: "0 auto",
  },

  header: {
    display: "flex",
    justifyContent:
      "space-between",
    alignItems:
      "flex-end",
    gap: "30px",
    marginBottom:
      "40px",
  },

  eyebrow: {
    color: "#c8647b",
    fontSize: "9px",
    fontWeight: 700,
    letterSpacing: "2px",
    margin:
      "0 0 10px",
  },

  title: {
    color: "#222",
    fontFamily:
      "Georgia, serif",
    fontSize: "42px",
    fontWeight: 400,
    lineHeight: 1.15,
    margin: 0,
  },

  description: {
    color: "#888",
    fontSize: "12px",
    lineHeight: 1.7,
    margin:
      "14px 0 0",
  },

  count: {
    color: "#999",
    fontSize: "11px",
    whiteSpace:
      "nowrap" as const,
  },

  mapSection: {
    marginBottom:
      "45px",
  },

  mapHeader: {
    display: "flex",
    justifyContent:
      "space-between",
    alignItems:
      "flex-end",
    gap: "30px",
    marginBottom:
      "18px",
  },

  mapEyebrow: {
    color: "#999",
    fontSize: "8px",
    fontWeight: 700,
    letterSpacing:
      "1.5px",
    margin:
      "0 0 7px",
  },

  mapTitle: {
    color: "#222",
    fontFamily:
      "Georgia, serif",
    fontSize: "28px",
    fontWeight: 400,
    margin: 0,
  },

  mapDescription: {
    color: "#999",
    fontSize: "11px",
    margin: 0,
  },

  mapNotice: {
    color: "#999",
    fontSize: "11px",
    lineHeight: 1.7,
    margin:
      "10px 0 0",
  },

  grid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(3, minmax(0, 1fr))",
    gap: "20px",
  },

  card: {
    background: "#fff",
    border:
      "1px solid #e5ddd9",
    borderRadius: "15px",
    overflow: "hidden",
  },

  cardLink: {
    display: "block",
    color: "#222",
    textDecoration: "none",
  },

  image: {
    aspectRatio: "1 / 1",
    background: "#f2e7e2",
    display: "flex",
    alignItems: "center",
    justifyContent:
      "center",
    overflow: "hidden",
    color: "#987a73",
    fontFamily:
      "Georgia, serif",
    fontSize: "9px",
    letterSpacing: "2px",
  },

  imageElement: {
    width: "100%",
    height: "100%",
    objectFit:
      "cover" as const,
    display: "block",
  },

  body: {
    padding: "15px",
  },

  type: {
    color: "#c8647b",
    fontSize: "8px",
    fontWeight: 700,
    letterSpacing:
      "1.5px",
    margin: 0,
  },

  brand: {
    color: "#999",
    fontSize: "9px",
    margin:
      "7px 0 0",
  },

  name: {
    color: "#222",
    fontFamily:
      "Georgia, serif",
    fontSize: "20px",
    fontWeight: 400,
    lineHeight: 1.3,
    margin:
      "5px 0 0",
  },

  removeButton: {
    width: "100%",
    height: "38px",
    border: 0,
    borderTop:
      "1px solid #eee6e2",
    background: "#fff",
    color: "#999",
    fontSize: "10px",
    cursor: "pointer",
  },

  empty: {
    padding:
      "75px 30px",
    background: "#fff",
    border:
      "1px solid #e7e0dc",
    textAlign:
      "center" as const,
  },

  emptyTitle: {
    color: "#333",
    fontFamily:
      "Georgia, serif",
    fontSize: "24px",
    margin: 0,
  },

  emptyText: {
    maxWidth: "430px",
    margin:
      "13px auto 0",
    color: "#999",
    fontSize: "12px",
    lineHeight: 1.8,
  },

  links: {
    display: "flex",
    justifyContent:
      "center",
    flexWrap:
      "wrap" as const,
    gap: "10px",
    marginTop: "28px",
  },

  exploreLink: {
    color: "#c8647b",
    textDecoration:
      "none",
    fontSize: "10px",
    fontWeight: 700,
    letterSpacing:
      "0.8px",
  },

  loginBox: {
    maxWidth: "620px",
    margin: "80px auto",
    padding:
      "60px 30px",
    background: "#fff",
    border:
      "1px solid #e7e0dc",
    textAlign:
      "center" as const,
  },

  loginButton: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent:
      "center",
    minWidth: "130px",
    height: "44px",
    marginTop: "25px",
    background: "#222",
    color: "#fff",
    textDecoration:
      "none",
    fontSize: "11px",
    fontWeight: 700,
    letterSpacing: "1px",
  },

  loading: {
    paddingTop: "80px",
    color: "#999",
    textAlign:
      "center" as const,
    fontSize: "12px",
  },
};