import Link from "next/link";
import { notFound } from "next/navigation";
import Header from "@/components/Header";
import { supabase } from "@/lib/supabase";

type Place = {
  id: string;
  name: string;
  description: string | null;
  region_id: number | null;
  area_id: number | null;
  group_id: string | null;
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

type PlaceCategory = {
  id: number;
  name: string;
};

type PlaceImage = {
  id: string;
  image_url: string;
  sort_order: number;
};

type Product = {
  id: string;
  name: string;
  brand: string | null;
  description: string | null;
  image_url: string | null;
  editor_pick: number | null;
};

type PlaceProductRelation = {
  product_id: string;
};

export default async function PlaceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const {
    data: placeData,
    error: placeError,
  } = await supabase
    .from("places")
    .select(`
      id,
      name,
      description,
      region_id,
      area_id,
      group_id,
      price_range,
      editor_note
    `)
    .eq("id", id)
    .eq("status", "published")
    .single();

  if (placeError || !placeData) {
    notFound();
  }

  const place = placeData as Place;

  const [
    imagesResult,
    categoriesResult,
    regionResult,
    areaResult,
    groupResult,
    productRelationsResult,
  ] = await Promise.all([
    supabase
      .from("place_images")
      .select(`
        id,
        image_url,
        sort_order
      `)
      .eq("place_id", place.id)
      .order("sort_order"),

    supabase
      .from("place_category_relations")
      .select(`
        category_id,
        place_categories (
          id,
          name
        )
      `)
      .eq("place_id", place.id),

    place.region_id !== null
      ? supabase
          .from("regions")
          .select("id, name")
          .eq("id", place.region_id)
          .single()
      : Promise.resolve({
          data: null,
          error: null,
        }),

    place.area_id !== null
      ? supabase
          .from("areas")
          .select("id, name")
          .eq("id", place.area_id)
          .single()
      : Promise.resolve({
          data: null,
          error: null,
        }),

    place.group_id
      ? supabase
          .from("place_groups")
          .select("id, name")
          .eq("id", place.group_id)
          .single()
      : Promise.resolve({
          data: null,
          error: null,
        }),

    supabase
      .from("place_products")
      .select("product_id")
      .eq("place_id", place.id)
      .eq("available", true),
  ]);

  const images =
    (imagesResult.data ?? []) as PlaceImage[];

  const region = regionResult.data
    ? (regionResult.data as Region)
    : null;

  const area = areaResult.data
    ? (areaResult.data as Area)
    : null;

  const group = groupResult.data
    ? (groupResult.data as PlaceGroup)
    : null;

  const categories =
    ((categoriesResult.data ?? [])
      .map((item: any) => item.place_categories)
      .filter(Boolean) ?? []) as PlaceCategory[];

  const productRelations =
    (productRelationsResult.data ??
      []) as PlaceProductRelation[];

  const productIds = [
    ...new Set(
      productRelations.map(
        (relation) => relation.product_id
      )
    ),
  ];

  let products: Product[] = [];

  if (productIds.length > 0) {
    const {
      data: productsData,
    } = await supabase
      .from("products")
      .select(`
        id,
        name,
        brand,
        description,
        image_url,
        editor_pick
      `)
      .in("id", productIds)
      .eq("status", "published")
      .order("name");

    products =
      (productsData ?? []) as Product[];
  }

  return (
    <main style={styles.main}>
      <Header />

      <div style={styles.container}>
        <div style={styles.subHeader}>
          <Link
            href="/places"
            style={styles.back}
          >
            ← Places
          </Link>
        </div>

        <section style={styles.hero}>
          <div style={styles.imageArea}>
            {images.length > 0 ? (
              <img
                src={images[0].image_url}
                alt={place.name}
                style={styles.heroImage}
              />
            ) : (
              <div style={styles.placeholder}>
                TOKYO GUIDE
              </div>
            )}
          </div>

          <div style={styles.infoArea}>
            {group && (
              <p style={styles.group}>
                {group.name}
              </p>
            )}

            {categories.length > 0 && (
              <div style={styles.categories}>
                {categories.map((category) => (
                  <span
                    key={category.id}
                    style={styles.category}
                  >
                    {category.name}
                  </span>
                ))}
              </div>
            )}

            <h1 style={styles.title}>
              {place.name}
            </h1>

            {(region || area) && (
              <p style={styles.location}>
                {region?.name ?? ""}
                {region && area ? " / " : ""}
                {area?.name ?? ""}
              </p>
            )}

            {place.price_range && (
              <p style={styles.price}>
                {place.price_range}
              </p>
            )}

            {place.description && (
              <p style={styles.description}>
                {place.description}
              </p>
            )}

            {place.editor_note && (
              <div style={styles.editorNote}>
                <p style={styles.editorNoteLabel}>
                  TOKYO GIRL'S NOTE
                </p>

                <p style={styles.editorNoteText}>
                  {place.editor_note}
                </p>
              </div>
            )}
          </div>
        </section>

        {images.length > 1 && (
          <section style={styles.section}>
            <div style={styles.sectionHeader}>
              <div>
                <p style={styles.sectionEyebrow}>
                  INSIDE THE PLACE
                </p>

                <h2 style={styles.sectionTitle}>
                  Gallery
                </h2>
              </div>
            </div>

            <div style={styles.galleryGrid}>
              {images.slice(1).map((image) => (
                <div
                  key={image.id}
                  style={styles.galleryImage}
                >
                  <img
                    src={image.image_url}
                    alt={place.name}
                    style={
                      styles.galleryImageElement
                    }
                  />
                </div>
              ))}
            </div>
          </section>
        )}

        <section style={styles.section}>
          <div style={styles.sectionHeader}>
            <div>
              <p style={styles.sectionEyebrow}>
                WHAT TO BUY
              </p>

              <h2 style={styles.sectionTitle}>
                Available here
              </h2>
            </div>

            {products.length > 0 && (
              <span style={styles.count}>
                {products.length}{" "}
                {products.length === 1
                  ? "product"
                  : "products"}
              </span>
            )}
          </div>

          {products.length === 0 ? (
            <div style={styles.empty}>
              <p style={styles.emptyTitle}>
                No products listed yet.
              </p>

              <p style={styles.emptyText}>
                Products available at this
                place will be added soon.
              </p>
            </div>
          ) : (
            <div style={styles.productGrid}>
              {products.map((product) => (
                <Link
                  key={product.id}
                  href={`/products/${product.id}`}
                  style={styles.productCard}
                >
                  <div style={styles.productImage}>
                    {product.image_url ? (
                      <img
                        src={product.image_url}
                        alt={product.name}
                        style={
                          styles.productImageElement
                        }
                      />
                    ) : (
                      <span>
                        TOKYO GUIDE
                      </span>
                    )}

                    {(product.editor_pick ?? 0) >
                      0 && (
                      <span style={styles.pickBadge}>
                        PICK
                      </span>
                    )}
                  </div>

                  <div style={styles.productBody}>
                    {product.brand && (
                      <p style={styles.brand}>
                        {product.brand}
                      </p>
                    )}

                    <h3 style={styles.productName}>
                      {product.name}
                    </h3>

                    {product.description && (
                      <p
                        style={
                          styles.productDescription
                        }
                      >
                        {product.description}
                      </p>
                    )}

                    <div style={styles.viewProduct}>
                      <span>
                        View product
                      </span>

                      <span>→</span>
                    </div>
                  </div>
                </Link>
              ))}
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
      "minmax(0, 1.05fr) minmax(0, 1fr)",
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

  group: {
    color: "#c8647b",
    fontSize: "10px",
    fontWeight: 700,
    letterSpacing: "1.2px",
    margin: 0,
    textTransform: "uppercase" as const,
  },

  categories: {
    display: "flex",
    flexWrap: "wrap" as const,
    gap: "6px",
    marginTop: "10px",
  },

  category: {
    color: "#888",
    fontSize: "10px",
  },

  title: {
    fontFamily: "Georgia, serif",
    fontWeight: 400,
    fontSize: "48px",
    lineHeight: 1.15,
    margin: "12px 0 0",
  },

  location: {
    color: "#999",
    fontSize: "12px",
    margin: "15px 0 0",
  },

  price: {
    color: "#666",
    fontSize: "12px",
    margin: "8px 0 0",
  },

  description: {
    color: "#666",
    fontSize: "14px",
    lineHeight: 1.9,
    marginTop: "25px",
  },

  editorNote: {
    marginTop: "28px",
    padding: "18px",
    background: "#fff",
    borderLeft: "3px solid #c8647b",
  },

  editorNoteLabel: {
    color: "#c8647b",
    fontSize: "9px",
    fontWeight: 700,
    letterSpacing: "1.8px",
    margin: 0,
  },

  editorNoteText: {
    color: "#555",
    fontSize: "13px",
    lineHeight: 1.8,
    margin: "9px 0 0",
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

  galleryGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(3, minmax(0, 1fr))",
    gap: "18px",
  },

  galleryImage: {
    aspectRatio: "1 / 1",
    borderRadius: "14px",
    overflow: "hidden",
    background: "#f2e7e2",
  },

  galleryImageElement: {
    width: "100%",
    height: "100%",
    objectFit: "cover" as const,
    display: "block",
  },

  productGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(3, minmax(0, 1fr))",
    gap: "18px",
  },

  productCard: {
    display: "block",
    color: "#222",
    textDecoration: "none",
    background: "#fff",
    border: "1px solid #e5ddd9",
    borderRadius: "15px",
    overflow: "hidden",
  },

  productImage: {
    position: "relative" as const,
    aspectRatio: "1 / 1",
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

  productImageElement: {
    width: "100%",
    height: "100%",
    objectFit: "cover" as const,
    display: "block",
  },

  pickBadge: {
    position: "absolute" as const,
    top: "10px",
    right: "10px",
    background: "#222",
    color: "#fff",
    borderRadius: "999px",
    padding: "6px 8px",
    fontSize: "8px",
    letterSpacing: "1px",
  },

  productBody: {
    padding: "15px",
  },

  brand: {
    color: "#c8647b",
    fontSize: "9px",
    fontWeight: 700,
    letterSpacing: "0.8px",
    margin: 0,
  },

  productName: {
    fontFamily: "Georgia, serif",
    fontSize: "21px",
    fontWeight: 400,
    margin: "6px 0 0",
  },

  productDescription: {
    color: "#777",
    fontSize: "11px",
    lineHeight: 1.7,
    margin: "10px 0 0",
  },

  viewProduct: {
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