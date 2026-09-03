"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

type Food = {
  id: string;
  name: string;
  description: string | null;
  status: string;
  editor_pick: number;
  created_at: string;
  category_id: number | null;
};

type FoodCategory = {
  id: number;
  name: string;
};

type FoodPlaceRelation = {
  food_id: string;
  place_id: string;
};

type Place = {
  id: string;
  name: string;
  price_range: string | null;
};

export default function FoodsAdminPage() {
  const [foods, setFoods] = useState<Food[]>([]);
  const [categories, setCategories] = useState<
    FoodCategory[]
  >([]);
  const [places, setPlaces] = useState<Place[]>([]);
  const [foodPlaceRelations, setFoodPlaceRelations] =
    useState<FoodPlaceRelation[]>([]);

  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] =
    useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] =
    useState("all");
  const [categoryFilter, setCategoryFilter] =
    useState("all");

  async function loadFoods() {
    setLoading(true);
    setErrorMessage("");

    const [
      foodsResult,
      categoriesResult,
      relationsResult,
      placesResult,
    ] = await Promise.all([
      supabase
        .from("foods")
        .select(`
          id,
          name,
          description,
          status,
          editor_pick,
          created_at,
          category_id
        `)
        .order("created_at", {
          ascending: false,
        }),

      supabase
        .from("food_categories")
        .select("id, name")
        .eq("is_active", true)
        .order("sort_order")
        .order("name"),

      supabase
        .from("place_foods")
        .select("food_id, place_id"),

      supabase
        .from("places")
        .select("id, name, price_range")
        .in("status", [
          "draft",
          "published",
        ])
        .order("name"),
    ]);

    const errors = [
      foodsResult.error,
      categoriesResult.error,
      relationsResult.error,
      placesResult.error,
    ].filter(Boolean);

    if (errors.length > 0) {
      setErrorMessage(
        errors[0]!.message
      );
    }

    setFoods(
      (foodsResult.data ?? []) as Food[]
    );

    setCategories(
      (categoriesResult.data ?? []) as FoodCategory[]
    );

    setFoodPlaceRelations(
      (relationsResult.data ?? []) as FoodPlaceRelation[]
    );

    setPlaces(
      (placesResult.data ?? []) as Place[]
    );

    setLoading(false);
  }

  useEffect(() => {
    loadFoods();
  }, []);

  const categoryMap = useMemo(() => {
    const map: Record<string, string> = {};

    categories.forEach(
      (category) => {
        map[String(category.id)] =
          category.name;
      }
    );

    return map;
  }, [categories]);

  const placeMap = useMemo(() => {
    const map: Record<
      string,
      Place
    > = {};

    places.forEach(
      (place) => {
        map[place.id] = place;
      }
    );

    return map;
  }, [places]);

  const categoryNames = useMemo(() => {
    return categories.map(
      (category) => category.name
    );
  }, [categories]);

  const filteredFoods = useMemo(() => {
    const keyword =
      search.trim().toLowerCase();

    return foods.filter((food) => {
      const categoryName =
        food.category_id !== null
          ? categoryMap[
              String(food.category_id)
            ] ?? ""
          : "";

      const foodPlaces =
        foodPlaceRelations
          .filter(
            (relation) =>
              relation.food_id ===
              food.id
          )
          .map(
            (relation) =>
              placeMap[
                relation.place_id
              ]?.name ?? ""
          );

      const matchesSearch =
        !keyword ||
        [
          food.name,
          food.description ?? "",
          categoryName,
          ...foodPlaces,
        ]
          .join(" ")
          .toLowerCase()
          .includes(keyword);

      const matchesStatus =
        statusFilter === "all" ||
        food.status ===
          statusFilter;

      const matchesCategory =
        categoryFilter === "all" ||
        categoryName ===
          categoryFilter;

      return (
        matchesSearch &&
        matchesStatus &&
        matchesCategory
      );
    });
  }, [
    foods,
    categoryMap,
    placeMap,
    foodPlaceRelations,
    search,
    statusFilter,
    categoryFilter,
  ]);

  function getFoodPlaces(
    foodId: string
  ) {
    return foodPlaceRelations
      .filter(
        (relation) =>
          relation.food_id ===
          foodId
      )
      .map(
        (relation) =>
          placeMap[
            relation.place_id
          ]
      )
      .filter(Boolean);
  }

  return (
    <main style={styles.main}>
      <div style={styles.container}>
        <header style={styles.header}>
          <Link
            href="/admin"
            style={styles.back}
          >
            ← Dashboard
          </Link>

          <div style={styles.headerRow}>
            <div>
              <p style={styles.eyebrow}>
                CONTENT / FOODS
              </p>

              <h1 style={styles.title}>
                Foods
              </h1>

              <p style={styles.description}>
                食べ物と提供店舗を管理します。
              </p>
            </div>

            <Link
              href="/admin/foods/new"
              style={styles.addButton}
            >
              + Add Food
            </Link>
          </div>
        </header>

        <section style={styles.filters}>
          <input
            style={styles.search}
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
            placeholder="Search foods, categories, places..."
          />

          <select
            style={styles.select}
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(
                e.target.value
              )
            }
          >
            <option value="all">
              All statuses
            </option>

            <option value="active">
              Active
            </option>

            <option value="hidden">
              Hidden
            </option>

            <option value="archived">
              Archived
            </option>
          </select>

          <select
            style={styles.select}
            value={categoryFilter}
            onChange={(e) =>
              setCategoryFilter(
                e.target.value
              )
            }
          >
            <option value="all">
              All categories
            </option>

            {categoryNames.map(
              (name) => (
                <option
                  key={name}
                  value={name}
                >
                  {name}
                </option>
              )
            )}
          </select>
        </section>

        <div style={styles.resultCount}>
          {loading
            ? "Loading..."
            : `${filteredFoods.length} foods`}
        </div>

        {errorMessage && (
          <div style={styles.error}>
            {errorMessage}
          </div>
        )}

        {!loading &&
          !errorMessage && (
            <section style={styles.table}>
              <div style={styles.tableHeader}>
                <span>
                  Food
                </span>

                <span>
                  Category
                </span>

                <span>
                  Where to eat
                </span>

                <span>
                  Status
                </span>

                <span>
                  Created
                </span>
              </div>

              {filteredFoods.length ===
              0 ? (
                <div style={styles.empty}>
                  <p>
                    該当するFoodがありません。
                  </p>

                  <Link
                    href="/admin/foods/new"
                    style={
                      styles.emptyLink
                    }
                  >
                    + Add Food
                  </Link>
                </div>
              ) : (
                filteredFoods.map(
                  (food) => {
                    const categoryName =
                      food.category_id !==
                      null
                        ? categoryMap[
                            String(
                              food.category_id
                            )
                          ] ?? "—"
                        : "—";

                    const foodPlaces =
                      getFoodPlaces(
                        food.id
                      );

                    return (
                      <Link
                        key={food.id}
                        href={`/admin/foods/${food.id}`}
                        style={styles.row}
                      >
                        <div
                          style={
                            styles.foodCell
                          }
                        >
                          <strong>
                            {food.name}
                          </strong>

                          {food.editor_pick >
                            0 && (
                            <span
                              style={
                                styles.pick
                              }
                            >
                              PICK{" "}
                              {"★".repeat(
                                food.editor_pick
                              )}
                            </span>
                          )}
                        </div>

                        <span>
                          {categoryName}
                        </span>

                        <div
                          style={
                            styles.placesCell
                          }
                        >
                          {foodPlaces.length ===
                          0 ? (
                            <span
                              style={
                                styles.muted
                              }
                            >
                              —
                            </span>
                          ) : (
                            foodPlaces
                              .slice(
                                0,
                                3
                              )
                              .map(
                                (
                                  place
                                ) => (
                                  <span
                                    key={
                                      place!.id
                                    }
                                  >
                                    {
                                      place!.name
                                    }
                                  </span>
                                )
                              )
                          )}

                          {foodPlaces.length >
                            3 && (
                            <span
                              style={
                                styles.more
                              }
                            >
                              +
                              {foodPlaces.length -
                                3}{" "}
                              more
                            </span>
                          )}
                        </div>

                        <StatusBadge
                          status={
                            food.status
                          }
                        />

                        <span
                          style={
                            styles.date
                          }
                        >
                          {formatDate(
                            food.created_at
                          )}
                        </span>
                      </Link>
                    );
                  }
                )
              )}
            </section>
          )}
      </div>
    </main>
  );
}

function StatusBadge({
  status,
}: {
  status: string;
}) {
  const labels: Record<
    string,
    string
  > = {
    active: "Active",
    hidden: "Hidden",
    archived: "Archived",
  };

  return (
    <span style={styles.status}>
      {labels[status] ??
        status}
    </span>
  );
}

function formatDate(
  value: string
) {
  if (!value) {
    return "—";
  }

  return new Intl.DateTimeFormat(
    "en-US",
    {
      year: "numeric",
      month: "short",
      day: "numeric",
    }
  ).format(
    new Date(value)
  );
}

const styles = {
  main: {
    minHeight: "100vh",
    background: "#faf8f6",
    color: "#222",
    padding:
      "40px 24px 90px",
  },

  container: {
    maxWidth: "1200px",
    margin: "0 auto",
  },

  header: {
    marginBottom: "28px",
  },

  back: {
    color: "#777",
    textDecoration: "none",
    fontSize: "13px",
  },

  headerRow: {
    marginTop: "30px",
    display: "flex",
    justifyContent:
      "space-between",
    alignItems: "flex-end",
    gap: "20px",
  },

  eyebrow: {
    color: "#c8647b",
    fontSize: "10px",
    fontWeight: 700,
    letterSpacing:
      "3px",
    marginBottom:
      "8px",
  },

  title: {
    fontFamily:
      "Georgia, serif",
    fontSize:
      "48px",
    fontWeight:
      400,
    margin: 0,
  },

  description: {
    color: "#777",
    marginTop:
      "10px",
  },

  addButton: {
    background:
      "#222",
    color:
      "#fff",
    textDecoration:
      "none",
    padding:
      "13px 17px",
    borderRadius:
      "10px",
    fontSize:
      "12px",
    whiteSpace:
      "nowrap" as const,
  },

  filters: {
    display:
      "grid",
    gridTemplateColumns:
      "1fr 180px 200px",
    gap:
      "10px",
    marginBottom:
      "14px",
  },

  search: {
    width: "100%",
    boxSizing:
      "border-box" as const,
    padding:
      "13px 14px",
    border:
      "1px solid #ded7d3",
    borderRadius:
      "10px",
    background:
      "#fff",
    fontSize:
      "13px",
    outline:
      "none",
  },

  select: {
    width: "100%",
    boxSizing:
      "border-box" as const,
    padding:
      "13px 14px",
    border:
      "1px solid #ded7d3",
    borderRadius:
      "10px",
    background:
      "#fff",
    fontSize:
      "13px",
  },

  resultCount: {
    color:
      "#888",
    fontSize:
      "12px",
    margin:
      "12px 2px",
  },

  error: {
    background:
      "#fff0f0",
    border:
      "1px solid #eccaca",
    color:
      "#a44",
    borderRadius:
      "12px",
    padding:
      "15px",
  },

  table: {
    background:
      "#fff",
    border:
      "1px solid #e7e0dc",
    borderRadius:
      "15px",
    overflow:
      "hidden",
  },

  tableHeader: {
    display:
      "grid",
    gridTemplateColumns:
      "2fr 1.2fr 2fr 100px 120px",
    gap:
      "12px",
    padding:
      "13px 18px",
    background:
      "#f6f2ef",
    color:
      "#888",
    fontSize:
      "10px",
    textTransform:
      "uppercase" as const,
    letterSpacing:
      "1px",
  },

  row: {
    display:
      "grid",
    gridTemplateColumns:
      "2fr 1.2fr 2fr 100px 120px",
    gap:
      "12px",
    padding:
      "17px 18px",
    borderTop:
      "1px solid #eee8e4",
    alignItems:
      "center",
    textDecoration:
      "none",
    color:
      "#222",
    fontSize:
      "13px",
  },

  foodCell: {
    display:
      "flex",
    flexDirection:
      "column" as const,
    gap:
      "5px",
  },

  pick: {
    color:
      "#c8647b",
    fontSize:
      "10px",
  },

  placesCell: {
    display:
      "flex",
    flexDirection:
      "column" as const,
    gap:
      "3px",
    fontSize:
      "12px",
  },

  muted: {
    color:
      "#aaa",
  },

  more: {
    color:
      "#999",
    fontSize:
      "10px",
  },

  status: {
    width:
      "fit-content",
    padding:
      "5px 8px",
    borderRadius:
      "999px",
    background:
      "#f3eeeb",
    color:
      "#666",
    fontSize:
      "10px",
  },

  date: {
    color:
      "#888",
    fontSize:
      "12px",
  },

  empty: {
    textAlign:
      "center" as const,
    padding:
      "60px 20px",
    color:
      "#888",
  },

  emptyLink: {
    display:
      "inline-block",
    marginTop:
      "10px",
    color:
      "#222",
    fontSize:
      "12px",
  },
};