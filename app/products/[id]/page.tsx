import Link from "next/link";
import { notFound } from "next/navigation";
import Header from "@/components/Header";
import { supabase } from "@/lib/supabase";

type Product = {
  id: string;
  name: string;
  brand: string | null;
  description: string | null;
  image_url: string | null;
  category_id: number | null;
  editor_pick: number | null;
};

type ProductCategory = {
  id: number;
  name: string;
};

type ProductVariant = {
  id: string;
  name: string | null;
  image_url: string | null;
};

type Place = {
  id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  group_id: string | null;
  region_id: number | null;
  area_id: number | null;
  price_range: string | null;
  editor_note: string | null;
};

type Region = {
  id: number;
  name: string;
};

type Area = {
  id: number;
  name: string;
};

type PlaceGroup = {
  id: string;
  name: string;
};

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const {
    data: product,
    error: productError,
  } = await supabase
    .from("products")
    .select(`
      id,
      name,
      brand,
      description,
      image_url,
      category_id,
      editor_pick
    `)
    .eq("id", id)
    .eq("status", "published")
    .single();

  if (productError || !product) {
    notFound();
  }

  const loadedProduct = product as Product;

  const [
    categoryResult,
    variantsResult,
    relationsResult,
  ] = await Promise.all([
    loadedProduct.category_id !== null
      ? supabase
          .from("product_categories")
          .select("id, name")
          .eq(
            "id",
            loadedProduct.category_id
          )
          .single()
      : Promise.resolve({
          data: null,
          error: null,
        }),

    supabase
      .from("product_variants")
      .select(`
        id,
        name,
        image_url
      `)
      .eq(
        "product_id",
        loadedProduct.id
      )
      .order("sort_order"),

    supabase
      .from("place_products")
      .select("place_id")
      .eq(
        "product_id",
        loadedProduct.id
      )
      .eq("available", true),
  ]);

  const category =
    categoryResult.data
      ? (categoryResult.data as ProductCategory)
      : null;

  const variants =
    (variantsResult.data ?? []) as ProductVariant[];

  const placeIds = [
    ...new Set(
      (relationsResult.data ?? []).map(
        (relation) => relation.place_id
      )
    ),
  ];

  let places: Place[] = [];

  if (placeIds.length > 0) {
    const {
      data: placesData,
    } = await supabase
      .from("places")
      .select(`
        id,
        name,
        description,
        image_url,
        group_id,
        region_id,
        area_id,
        price_range,
        editor_note
      `)
      .in("id", placeIds)
      .eq("status", "published")
      .order("name");

    places =
      (placesData ?? []) as Place[];
  }

  const regionIds = [
    ...new Set(
      places
        .map(
          (place) => place.region_id
        )
        .filter(
          (
            value
          ): value is number =>
            value !== null
        )
    ),
  ];

  const areaIds = [
    ...new Set(
      places
        .map(
          (place) => place.area_id
        )
        .filter(
          (
            value
          ): value is number =>
            value !== null
        )
    ),
  ];

  const groupIds = [
    ...new Set(
      places
        .map(
          (place) => place.group_id
        )
        .filter(
          (
            value
          ): value is string =>
            value !== null
        )
    ),
  ];

  const [
    regionsResult,
    areasResult,
    groupsResult,
  ] = await Promise.all([
    regionIds.length > 0
      ? supabase
          .from("regions")
          .select("id, name")
          .in("id", regionIds)
      : Promise.resolve({
          data: [],
          error: null,
        }),

    areaIds.length > 0
      ? supabase
          .from("areas")
          .select("id, name")
          .in("id", areaIds)
      : Promise.resolve({
          data: [],
          error: null,
        }),

    groupIds.length > 0
      ? supabase
          .from("place_groups")
          .select("id, name")
          .in("id", groupIds)
          .eq("is_active", true)
      : Promise.resolve({
          data: [],
          error: null,
        }),
  ]);

  const regionMap =
    new Map<number, string>(
      (
        (regionsResult.data ?? []) as Region[]
      ).map((region) => [
        region.id,
        region.name,
      ])
    );

  const areaMap =
    new Map<number, string>(
      (
        (areasResult.data ?? []) as Area[]
      ).map((area) => [
        area.id,
        area.name,
      ])
    );

  const groupMap =
    new Map<string, string>(
      (
        (groupsResult.data ?? []) as PlaceGroup[]
      ).map((group) => [
        String(group.id),
        group.name,
      ])
    );

  return (
    <main style={styles.main}>
      <Header />

      <div
        style={styles.container}
        className="product-detail-container"
      >
        <div style={styles.subHeader}>
          <Link
            href="/products"
            style={styles.back}
          >
            ← Products
          </Link>
        </div>

        <section
          style={styles.hero}
          className="product-detail-hero"
        >
          <div style={styles.imageArea}>
            {loadedProduct.image_url ? (
              <img
                src={loadedProduct.image_url}
                alt={loadedProduct.name}
                style={styles.heroImage}
              />
            ) : (
              <div style={styles.placeholder}>
                TOKYO GUIDE
              </div>
            )}
          </div>

          <div style={styles.infoArea}>
            {loadedProduct.brand && (
              <p style={styles.brand}>
                {loadedProduct.brand}
              </p>
            )}

            {category && (
              <p style={styles.category}>
                {category.name}
              </p>
            )}

            <h1
              style={styles.title}
              className="product-detail-title"
            >
              {loadedProduct.name}
            </h1>

            {(loadedProduct.editor_pick ?? 0) > 0 && (
              <div style={styles.pick}>
                <span>
                  TOKYO GIRL PICK
                </span>

                <span>
                  {"★".repeat(
                    loadedProduct.editor_pick ?? 0
                  )}

                  {"☆".repeat(
                    5 -
                      (
                        loadedProduct.editor_pick ??
                        0
                      )
                  )}
                </span>
              </div>
            )}

            {loadedProduct.description && (
              <p style={styles.description}>
                {loadedProduct.description}
              </p>
            )}
          </div>
        </section>

        {variants.length > 0 && (
          <section style={styles.section}>
            <div
              style={styles.sectionHeader}
              className="product-section-header"
            >
              <div>
                <p
                  style={styles.sectionEyebrow}
                >
                  COLORS & TYPES
                </p>

                <h2 style={styles.sectionTitle}>
                  Variations
                </h2>
              </div>
            </div>

            <div
              style={styles.variantGrid}
              className="product-variant-grid"
            >
              {variants.map((variant) => (
                <div
                  key={variant.id}
                  style={styles.variantCard}
                >
                  <div
                    style={styles.variantImage}
                  >
                    {variant.image_url ? (
                      <img
                        src={variant.image_url}
                        alt={
                          variant.name ??
                          loadedProduct.name
                        }
                        style={
                          styles.variantImageElement
                        }
                      />
                    ) : (
                      <span>
                        TOKYO GUIDE
                      </span>
                    )}
                  </div>

                  {variant.name && (
                    <p
                      style={
                        styles.variantName
                      }
                    >
                      {variant.name}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        <section style={styles.section}>
          <div
            style={styles.sectionHeader}
            className="product-section-header"
          >
            <div>
              <p
                style={styles.sectionEyebrow}
              >
                WHERE TO BUY
              </p>

              <h2 style={styles.sectionTitle}>
                Available here
              </h2>
            </div>

            {places.length > 0 && (
              <span style={styles.count}>
                {places.length}{" "}
                {places.length === 1
                  ? "place"
                  : "places"}
              </span>
            )}
          </div>

          {places.length === 0 ? (
            <div style={styles.empty}>
              <p style={styles.emptyTitle}>
                No stores listed yet.
              </p>

              <p style={styles.emptyText}>
                Store information for this
                product will be added soon.
              </p>
            </div>
          ) : (
            <div
              style={styles.placeGrid}
              className="product-place-grid"
            >
              {places.map((place) => {
                const regionName =
                  place.region_id !== null
                    ? regionMap.get(
                        place.region_id
                      ) ?? null
                    : null;

                const areaName =
                  place.area_id !== null
                    ? areaMap.get(
                        place.area_id
                      ) ?? null
                    : null;

                const groupName =
                  place.group_id
                    ? groupMap.get(
                        String(place.group_id)
                      ) ?? null
                    : null;

                return (
                  <Link
                    key={place.id}
                    href={`/places/${place.id}`}
                    style={styles.placeCard}
                  >
                    <div
                      style={styles.placeImage}
                    >
                      {place.image_url ? (
                        <img
                          src={place.image_url}
                          alt={place.name}
                          style={
                            styles.placeImageElement
                          }
                        />
                      ) : (
                        <span>
                          TOKYO GUIDE
                        </span>
                      )}
                    </div>

                    <div
                      style={styles.placeBody}
                    >
                      {groupName && (
                        <p style={styles.group}>
                          {groupName}
                        </p>
                      )}

                      <h3
                        style={
                          styles.placeName
                        }
                      >
                        {place.name}
                      </h3>

                      {(regionName ||
                        areaName) && (
                        <p
                          style={
                            styles.location
                          }
                        >
                          {regionName ?? ""}

                          {areaName
                            ? ` / ${areaName}`
                            : ""}
                        </p>
                      )}

                      {place.price_range && (
                        <p
                          style={styles.price}
                        >
                          {place.price_range}
                        </p>
                      )}

                      {place.description && (
                        <p
                          style={
                            styles.placeDescription
                          }
                        >
                          {place.description}
                        </p>
                      )}

                      {place.editor_note && (
                        <div
                          style={
                            styles.editorNote
                          }
                        >
                          <span
                            style={
                              styles.editorNoteLabel
                            }
                          >
                            TOKYO GIRL'S NOTE
                          </span>

                          <p
                            style={
                              styles.editorNoteText
                            }
                          >
                            {place.editor_note}
                          </p>
                        </div>
                      )}

                      <div
                        style={
                          styles.viewPlace
                        }
                      >
                        <span>
                          View place
                        </span>

                        <span>→</span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

const styles = {
  main: {
    minHeight: "100vh",
    background: "#fffaf8",
    color: "#222",
  },

  container: {
    maxWidth: "1100px",
    margin: "0 auto",
    padding: "0 24px 100px",
  },

  subHeader: {
    padding: "22px 0 0",
  },

  back: {
    color: "#777",
    textDecoration: "none",
    fontSize: "12px",
  },

  hero: {
    display: "grid",
    gridTemplateColumns:
      "1.05fr 1fr",
    gap: "55px",
    alignItems: "start",
    paddingTop: "28px",
  },

  imageArea: {
    aspectRatio: "1 / 1",
    background: "#f2e7e2",
    borderRadius: "18px",
    overflow: "hidden",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },

  heroImage: {
    width: "100%",
    height: "100%",
    objectFit: "cover" as const,
    display: "block",
  },

  placeholder: {
    color: "#987a73",
    fontFamily: "Georgia, serif",
    fontSize: "11px",
    letterSpacing: "2px",
  },

  infoArea: {
    paddingTop: "20px",
  },

  brand: {
    color: "#c8647b",
    fontSize: "10px",
    fontWeight: 700,
    letterSpacing: "1.2px",
    margin: 0,
    textTransform: "uppercase" as const,
  },

  category: {
    color: "#999",
    fontSize: "10px",
    letterSpacing: "1px",
    margin: "7px 0 0",
  },

  title: {
    fontFamily: "Georgia, serif",
    fontWeight: 400,
    fontSize: "48px",
    lineHeight: 1.15,
    margin: "10px 0 0",
  },

  pick: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    color: "#c8647b",
    fontSize: "10px",
    marginTop: "16px",
    letterSpacing: "0.5px",
  },

  description: {
    color: "#666",
    fontSize: "14px",
    lineHeight: 1.9,
    marginTop: "25px",
  },

  section: {
    marginTop: "65px",
    paddingTop: "32px",
    borderTop: "1px solid #e8dfdb",
  },

  sectionHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-end",
    gap: "20px",
    marginBottom: "25px",
  },

  sectionEyebrow: {
    color: "#c8647b",
    fontSize: "9px",
    fontWeight: 700,
    letterSpacing: "2px",
    margin: 0,
  },

  sectionTitle: {
    fontFamily: "Georgia, serif",
    fontWeight: 400,
    fontSize: "30px",
    margin: "7px 0 0",
  },

  count: {
    color: "#999",
    fontSize: "11px",
  },

  variantGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(4, minmax(0, 1fr))",
    gap: "18px",
  },

  variantCard: {
    minWidth: 0,
  },

  variantImage: {
    aspectRatio: "1 / 1",
    background: "#f2e7e2",
    borderRadius: "14px",
    overflow: "hidden",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#987a73",
    fontFamily: "Georgia, serif",
    fontSize: "9px",
    letterSpacing: "2px",
  },

  variantImageElement: {
    width: "100%",
    height: "100%",
    objectFit: "cover" as const,
    display: "block",
  },

  variantName: {
    fontSize: "12px",
    color: "#555",
    margin: "9px 0 0",
  },

  placeGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(3, minmax(0, 1fr))",
    gap: "18px",
  },

  placeCard: {
    display: "block",
    color: "#222",
    textDecoration: "none",
    background: "#fff",
    border: "1px solid #e5ddd9",
    borderRadius: "15px",
    overflow: "hidden",
  },

  placeImage: {
    aspectRatio: "4 / 3",
    background: "#f2e7e2",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    color: "#987a73",
    fontFamily: "Georgia, serif",
    fontSize: "9px",
    letterSpacing: "2px",
  },

  placeImageElement: {
    width: "100%",
    height: "100%",
    objectFit: "cover" as const,
    display: "block",
  },

  placeBody: {
    padding: "15px",
  },

  group: {
    color: "#999",
    fontSize: "9px",
    margin: 0,
  },

  placeName: {
    fontFamily: "Georgia, serif",
    fontSize: "21px",
    fontWeight: 400,
    margin: "5px 0 0",
  },

  location: {
    color: "#999",
    fontSize: "10px",
    margin: "7px 0 0",
  },

  price: {
    color: "#666",
    fontSize: "11px",
    margin: "8px 0 0",
  },

  placeDescription: {
    color: "#777",
    fontSize: "11px",
    lineHeight: 1.7,
    margin: "10px 0 0",
  },

  editorNote: {
    marginTop: "12px",
    paddingTop: "10px",
    borderTop: "1px solid #eee6e2",
  },

  editorNoteLabel: {
    color: "#c8647b",
    fontSize: "8px",
    fontWeight: 700,
    letterSpacing: "1.5px",
  },

  editorNoteText: {
    color: "#555",
    fontSize: "11px",
    lineHeight: 1.7,
    margin: "5px 0 0",
  },

  viewPlace: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: "16px",
    paddingTop: "12px",
    borderTop: "1px solid #eee6e2",
    color: "#c8647b",
    fontSize: "11px",
  },

  empty: {
    padding: "60px 20px",
    background: "#fff",
    border: "1px solid #e7e0dc",
    borderRadius: "15px",
    textAlign: "center" as const,
  },

  emptyTitle: {
    fontFamily: "Georgia, serif",
    fontSize: "21px",
    margin: 0,
  },

  emptyText: {
    color: "#999",
    fontSize: "12px",
    margin: "10px 0 0",
  },
} as const;