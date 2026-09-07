"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import PlaceCard from "@/components/PlaceCard";
import { supabase } from "@/lib/supabase";


type Region = {
  id: number;
  name: string;
};

type Area = {
  id: number;
  region_id: number;
  name: string;
};

type Category = {
  id: number;
  name: string;
  parent_id: number | null;
};

type Place = {
  id: string;
  name: string;
  description: string | null;
  region_id: number | null;
  area_id: number | null;
  status: string;
  editor_note: string | null;
  sort_order: number | null;
  created_at: string | null;
};

type PlaceCategoryRelation = {
  place_id: string;
  category_id: number;
};

type PlaceImage = {
  place_id: string;
  image_url: string;
  sort_order: number;
};

type PlaceWithMeta = Place & {
  regionName: string | null;
  areaName: string | null;
  categoryName: string | null;
  categoryIds: number[];
  imageUrl: string | null;
};

type SortOption =
  | "recommended"
  | "newest"
  | "az";

export default function PlacesPage() {
  const [places, setPlaces] = useState<
    PlaceWithMeta[]
  >([]);

  const [regions, setRegions] = useState<
    Region[]
  >([]);

  const [areas, setAreas] = useState<
    Area[]
  >([]);

  const [categories, setCategories] = useState<
    Category[]
  >([]);

  const [regionId, setRegionId] =
    useState("");

  const [areaId, setAreaId] =
    useState("");

  const [categoryId, setCategoryId] =
    useState("");

  const [sortBy, setSortBy] =
    useState<SortOption>("recommended");

  const [loading, setLoading] =
    useState(true);

  const [errorMessage, setErrorMessage] =
    useState("");

  useEffect(() => {
    async function load() {
      setLoading(true);
      setErrorMessage("");

      const [
        placesResult,
        regionsResult,
        areasResult,
        categoriesResult,
        relationsResult,
        imagesResult,
      ] = await Promise.all([
        supabase
          .from("places")
          .select(`
            id,
            name,
            description,
            region_id,
            area_id,
            status,
            editor_note,
            sort_order,
            created_at
          `)
          .eq("status", "published")
          .order("sort_order", {
            ascending: true,
          })
          .order("created_at", {
            ascending: false,
          }),

        supabase
          .from("regions")
          .select("id, name")
          .eq("is_active", true)
          .order("sort_order")
          .order("name"),

        supabase
          .from("areas")
          .select(`
            id,
            region_id,
            name
          `)
          .eq("is_active", true)
          .order("sort_order")
          .order("name"),

        supabase
          .from("place_categories")
          .select(`
            id,
            name,
            parent_id
          `)
          .eq("is_active", true)
          .order("sort_order")
          .order("name"),

        supabase
          .from(
            "place_category_relations"
          )
          .select(`
            place_id,
            category_id
          `),

        supabase
          .from("place_images")
          .select(`
            place_id,
            image_url,
            sort_order
          `)
          .order("sort_order"),
      ]);

      const firstError =
        placesResult.error ||
        regionsResult.error ||
        areasResult.error ||
        categoriesResult.error ||
        relationsResult.error ||
        imagesResult.error;

      if (firstError) {
        setErrorMessage(
          firstError.message
        );

        setLoading(false);
        return;
      }

      const loadedPlaces =
        (placesResult.data ?? []) as Place[];

      const loadedRegions =
        (regionsResult.data ?? []) as Region[];

      const loadedAreas =
        (areasResult.data ?? []) as Area[];

      const loadedCategories =
        (categoriesResult.data ??
          []) as Category[];

      const relations =
        (relationsResult.data ??
          []) as PlaceCategoryRelation[];

      const images =
        (imagesResult.data ??
          []) as PlaceImage[];

      const regionMap =
        new Map<number, string>();

      loadedRegions.forEach(
        (region) => {
          regionMap.set(
            region.id,
            region.name
          );
        }
      );

      const areaMap =
        new Map<number, string>();

      loadedAreas.forEach((area) => {
        areaMap.set(
          area.id,
          area.name
        );
      });

      const categoryMap =
        new Map<number, string>();

      loadedCategories.forEach(
        (category) => {
          categoryMap.set(
            category.id,
            category.name
          );
        }
      );

      const placeCategoryMap =
        new Map<string, number[]>();

      relations.forEach(
        (relation) => {
          const current =
            placeCategoryMap.get(
              relation.place_id
            ) ?? [];

          current.push(
            relation.category_id
          );

          placeCategoryMap.set(
            relation.place_id,
            current
          );
        }
      );

      const primaryImageMap =
        new Map<string, string>();

      images.forEach((image) => {
        if (
          !primaryImageMap.has(
            image.place_id
          )
        ) {
          primaryImageMap.set(
            image.place_id,
            image.image_url
          );
        }
      });

      const result =
        loadedPlaces.map(
          (place): PlaceWithMeta => {
            const categoryIds =
              placeCategoryMap.get(
                place.id
              ) ?? [];

            const firstCategoryId =
              categoryIds[0];

            return {
              ...place,

              regionName:
                place.region_id !== null
                  ? regionMap.get(
                      place.region_id
                    ) ?? null
                  : null,

              areaName:
                place.area_id !== null
                  ? areaMap.get(
                      place.area_id
                    ) ?? null
                  : null,

              categoryName:
                firstCategoryId !== undefined
                  ? categoryMap.get(
                      firstCategoryId
                    ) ?? null
                  : null,

              categoryIds,

              imageUrl:
                primaryImageMap.get(
                  place.id
                ) ?? null,
            };
          }
        );

      setPlaces(result);
      setRegions(loadedRegions);
      setAreas(loadedAreas);
      setCategories(loadedCategories);

      setLoading(false);
    }

    load();
  }, []);

  const filteredAreas = useMemo(() => {
    if (!regionId) {
      return areas;
    }

    return areas.filter(
      (area) =>
        area.region_id ===
        Number(regionId)
    );
  }, [areas, regionId]);

  const filteredPlaces = useMemo(() => {
    const result = places.filter((place) => {
      if (
        regionId &&
        place.region_id !==
          Number(regionId)
      ) {
        return false;
      }

      if (
        areaId &&
        place.area_id !==
          Number(areaId)
      ) {
        return false;
      }

      if (
        categoryId &&
        !place.categoryIds.includes(
          Number(categoryId)
        )
      ) {
        return false;
      }

      return true;
    });

    if (sortBy === "newest") {
      return [...result].sort((a, b) => {
        const dateA =
          a.created_at
            ? new Date(
                a.created_at
              ).getTime()
            : 0;

        const dateB =
          b.created_at
            ? new Date(
                b.created_at
              ).getTime()
            : 0;

        return dateB - dateA;
      });
    }

    if (sortBy === "az") {
      return [...result].sort((a, b) =>
        a.name.localeCompare(b.name)
      );
    }

    return [...result].sort((a, b) => {
      const orderA =
        a.sort_order ?? 9999;

      const orderB =
        b.sort_order ?? 9999;

      return orderA - orderB;
    });
  }, [
    places,
    regionId,
    areaId,
    categoryId,
    sortBy,
  ]);

  function clearFilters() {
    setRegionId("");
    setAreaId("");
    setCategoryId("");
    setSortBy("recommended");
  }

  const hasFilters = Boolean(
    regionId ||
      areaId ||
      categoryId
  );

  return (
    <main style={styles.main}>

      <div
        className="places-main"
        style={styles.container}
      >
        <header style={styles.hero}>
          <p style={styles.eyebrow}>
            TOKYO GUIDE
          </p>

          <h1
            className="places-title"
            style={styles.title}
          >
            Places
          </h1>

          <p style={styles.description}>
            Discover restaurants, cafés,
            shops, hotels and places worth
            visiting in Japan.
          </p>
        </header>

        <section
          className="places-filter-section"
          style={styles.filtersSection}
        >
          <div style={styles.filtersHeader}>
            <h2 style={styles.filterTitle}>
              Find a place
            </h2>

            {(hasFilters ||
              sortBy !== "recommended") && (
              <button
                type="button"
                onClick={clearFilters}
                style={styles.clearButton}
              >
                Reset
              </button>
            )}
          </div>

          <div
            className="places-filters-grid"
            style={styles.filtersGrid}
          >
            <label style={styles.filterLabel}>
              <span
                style={styles.filterLabelText}
              >
                Region
              </span>

              <select
                value={regionId}
                onChange={(e) => {
                  setRegionId(
                    e.target.value
                  );

                  setAreaId("");
                }}
                style={styles.select}
              >
                <option value="">
                  All regions
                </option>

                {regions.map((region) => (
                  <option
                    key={region.id}
                    value={region.id}
                  >
                    {region.name}
                  </option>
                ))}
              </select>
            </label>

            <label style={styles.filterLabel}>
              <span
                style={styles.filterLabelText}
              >
                Area
              </span>

              <select
                value={areaId}
                onChange={(e) =>
                  setAreaId(
                    e.target.value
                  )
                }
                style={styles.select}
              >
                <option value="">
                  All areas
                </option>

                {filteredAreas.map((area) => (
                  <option
                    key={area.id}
                    value={area.id}
                  >
                    {area.name}
                  </option>
                ))}
              </select>
            </label>

            <label style={styles.filterLabel}>
              <span
                style={styles.filterLabelText}
              >
                Category
              </span>

              <select
                value={categoryId}
                onChange={(e) =>
                  setCategoryId(
                    e.target.value
                  )
                }
                style={styles.select}
              >
                <option value="">
                  All categories
                </option>

                {categories.map(
                  (category) => (
                    <option
                      key={category.id}
                      value={category.id}
                    >
                      {category.name}
                    </option>
                  )
                )}
              </select>
            </label>

            <label style={styles.filterLabel}>
              <span
                style={styles.filterLabelText}
              >
                Sort by
              </span>

              <select
                value={sortBy}
                onChange={(e) =>
                  setSortBy(
                    e.target
                      .value as SortOption
                  )
                }
                style={styles.select}
              >
                <option value="recommended">
                  Recommended
                </option>

                <option value="newest">
                  Newest
                </option>

                <option value="az">
                  A–Z
                </option>
              </select>
            </label>
          </div>
        </section>

        <section style={styles.resultsSection}>
          <div
            className="places-results-header"
            style={styles.resultsHeader}
          >
            <div>
              <p
                style={styles.resultsEyebrow}
              >
                PLACES
              </p>

              <h2 style={styles.resultsTitle}>
                {hasFilters
                  ? "Selected places"
                  : "All places"}
              </h2>
            </div>

            <span style={styles.resultCount}>
              {loading
                ? "—"
                : `${filteredPlaces.length} places`}
            </span>
          </div>

          {errorMessage && (
            <div style={styles.error}>
              {errorMessage}
            </div>
          )}

          {loading ? (
            <div style={styles.loading}>
              Loading places...
            </div>
          ) : filteredPlaces.length === 0 ? (
            <div style={styles.empty}>
              <p style={styles.emptyTitle}>
                No places found.
              </p>

              <p style={styles.emptyText}>
                Try changing your filters.
              </p>
            </div>
          ) : (
            <div
              className="places-grid"
              style={styles.grid}
            >
              {filteredPlaces.map(
                (place) => (
                  <PlaceCard
                    key={place.id}
                    id={place.id}
                    name={place.name}
                    imageUrl={place.imageUrl}
                    category={
                      place.categoryName
                    }
                    region={place.regionName}
                    area={place.areaName}
                    description={
                      place.description
                    }
                    editorNote={
                      place.editor_note
                    }
                  />
                )
              )}
            </div>
          )}
        </section>

        <section style={styles.bottomCta}>
          <Link
            href="/articles"
            style={styles.cta}
          >
            Explore our guides
            <span>→</span>
          </Link>
        </section>
      </div>

      <style jsx global>{`
        @media (max-width: 800px) {
          .places-filters-grid {
            grid-template-columns:
              repeat(
                2,
                minmax(0, 1fr)
              ) !important;
          }

          .places-grid {
            grid-template-columns:
              repeat(
                2,
                minmax(0, 1fr)
              ) !important;
          }
        }

        @media (max-width: 520px) {
          .places-main {
            padding-left: 16px !important;
            padding-right: 16px !important;
          }

          .places-title {
            font-size: 44px !important;
          }

          .places-filters-grid {
            grid-template-columns:
              1fr !important;
          }

          .places-grid {
            grid-template-columns:
              1fr !important;
          }

          .places-results-header {
            align-items:
              flex-start !important;

            flex-direction:
              column !important;

            gap: 8px !important;
          }

          .places-filter-section {
            padding: 18px !important;
          }
        }
      `}</style>
    </main>
  );
}

const styles = {
  main: {
    minHeight: "100vh",
    background: "#faf8f6",
    color: "#222",
  },

  container: {
    maxWidth: "1180px",
    margin: "0 auto",
    padding: "70px 24px 100px",
  },

  hero: {
    maxWidth: "720px",
    marginBottom: "50px",
  },

  eyebrow: {
    margin: 0,
    color: "#c8647b",
    fontSize: "10px",
    fontWeight: 700,
    letterSpacing: "3px",
  },

  title: {
    margin: "10px 0 0",
    fontFamily: "Georgia, serif",
    fontSize: "56px",
    fontWeight: 400,
    lineHeight: 1,
  },

  description: {
    margin: "20px 0 0",
    color: "#777",
    fontSize: "14px",
    lineHeight: 1.8,
  },

  filtersSection: {
    marginBottom: "55px",
    padding: "22px",
    background: "#fff",
    borderStyle: "solid",
    borderWidth: "1px",
    borderColor: "#e7e0dc",
    borderRadius: "18px",
  },

  filtersHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "20px",
    marginBottom: "20px",
  },

  filterTitle: {
    margin: 0,
    fontFamily: "Georgia, serif",
    fontSize: "22px",
    fontWeight: 400,
  },

  clearButton: {
    border: 0,
    background: "transparent",
    color: "#c8647b",
    fontSize: "11px",
    fontWeight: 700,
    cursor: "pointer",
  },

  filtersGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(4, minmax(0, 1fr))",
    gap: "12px",
  },

  filterLabel: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "8px",
  },

  filterLabelText: {
    color: "#888",
    fontSize: "9px",
    fontWeight: 700,
    letterSpacing: "1.5px",
    textTransform: "uppercase" as const,
  },

  select: {
    width: "100%",
    height: "46px",
    padding: "0 12px",
    borderStyle: "solid",
    borderWidth: "1px",
    borderColor: "#ddd5d0",
    borderRadius: "10px",
    background: "#fff",
    color: "#333",
    fontSize: "12px",
    outline: "none",
  },

  resultsSection: {
    marginTop: "10px",
  },

  resultsHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-end",
    gap: "20px",
    marginBottom: "22px",
  },

  resultsEyebrow: {
    margin: 0,
    color: "#c8647b",
    fontSize: "9px",
    fontWeight: 700,
    letterSpacing: "2px",
  },

  resultsTitle: {
    margin: "6px 0 0",
    fontFamily: "Georgia, serif",
    fontSize: "30px",
    fontWeight: 400,
  },

  resultCount: {
    color: "#999",
    fontSize: "11px",
  },

  grid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(3, minmax(0, 1fr))",
    gap: "18px",
  },

  loading: {
    padding: "70px 20px",
    textAlign: "center" as const,
    color: "#999",
    fontSize: "13px",
  },

  empty: {
    padding: "70px 20px",
    background: "#fff",
    borderStyle: "solid",
    borderWidth: "1px",
    borderColor: "#e7e0dc",
    borderRadius: "16px",
    textAlign: "center" as const,
  },

  emptyTitle: {
    margin: 0,
    fontFamily: "Georgia, serif",
    fontSize: "22px",
  },

  emptyText: {
    margin: "10px 0 0",
    color: "#999",
    fontSize: "12px",
  },

  error: {
    marginBottom: "20px",
    padding: "15px",
    background: "#fff1f1",
    borderStyle: "solid",
    borderWidth: "1px",
    borderColor: "#edcaca",
    borderRadius: "12px",
    color: "#a44",
    fontSize: "12px",
  },

  bottomCta: {
    marginTop: "60px",
    textAlign: "center" as const,
  },

  cta: {
    display: "inline-flex",
    alignItems: "center",
    gap: "20px",
    color: "#222",
    textDecoration: "none",
    fontFamily: "Georgia, serif",
    fontSize: "18px",
  },
} as const;