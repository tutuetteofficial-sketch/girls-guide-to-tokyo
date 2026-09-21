import Link from "next/link";
import { notFound } from "next/navigation";
import { supabase } from "@/lib/supabase";
import SaveButton from "@/components/SaveButton";

type Place = {
  id: string;
  name: string;
  description: string | null;
  place_type_id: string | null;
  area_id: string | null;
  price_range: string | null;
  editor_note: string | null;

  postal_code: string | null;
  address: string | null;
  google_maps_url: string | null;

  phone: string | null;
  official_url: string | null;
  instagram_url: string | null;
  tabelog_url: string | null;

  reservation: string | null;
  english_support: string | null;
  opening_hours: string | null;
  closed_days: string | null;
  seats: string | null;
  counter_seats: string | null;
  table_seats: string | null;
  card: string | null;
  tax_free: string | null;

  image_url: string | null;
  latitude: number | null;
  longitude: number | null;
};

type Area = {
  id: string;
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
      place_type_id,
      area_id,
      price_range,
      editor_note,

      postal_code,
      address,
      google_maps_url,

      phone,
      official_url,
      instagram_url,
      tabelog_url,

      reservation,
      english_support,
      opening_hours,
      closed_days,
      seats,
      counter_seats,
      table_seats,
      card,
      tax_free,

      image_url,
      latitude,
      longitude
    `)
    .eq("id", id)
    .eq("status", "published")
    .maybeSingle();

  if (placeError) {
    console.error(
      "PLACE DETAIL SUPABASE ERROR:",
      placeError
    );

    return (
      <main style={styles.errorMain}>
        <div style={styles.errorBox}>
          <h1 style={styles.errorTitle}>
            Place could not be loaded
          </h1>

          <p style={styles.errorMessage}>
            {placeError.message}
          </p>

          <p style={styles.errorId}>
            Place ID: {id}
          </p>

          <Link
            href="/places"
            style={styles.back}
          >
            ← Back to Places
          </Link>
        </div>
      </main>
    );
  }

  if (!placeData) {
    notFound();
  }

  const place = placeData as Place;

  const [
    imagesResult,
    areaResult,
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

    place.area_id !== null
      ? supabase
          .from("areas")
          .select("id, name")
          .eq("id", place.area_id)
          .maybeSingle()
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

  const area = areaResult.data
    ? (areaResult.data as Area)
    : null;

  const productRelations =
    (productRelationsResult.data ??
      []) as PlaceProductRelation[];

  const productIds = [
    ...new Set(
      productRelations.map(
        (relation) =>
          relation.product_id
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

  const heroImage =
    images.length > 0
      ? images[0].image_url
      : place.image_url;

  return (
    <main style={styles.main}>
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
            {heroImage ? (
              <img
                src={heroImage}
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
            {area && (
              <p style={styles.area}>
                {area.name}
              </p>
            )}

            <h1 style={styles.title}>
              {place.name}
            </h1>

            <div style={styles.saveArea}>
              <SaveButton
                type="place"
                itemId={place.id}
              />
            </div>

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
                <p
                  style={
                    styles.editorNoteLabel
                  }
                >
                  TOKYO GIRL'S NOTE
                </p>

                <p
                  style={
                    styles.editorNoteText
                  }
                >
                  {place.editor_note}
                </p>
              </div>
            )}
          </div>
        </section>

        <section style={styles.section}>
          <div style={styles.sectionHeader}>
            <div>
              <p
                style={
                  styles.sectionEyebrow
                }
              >
                INFORMATION
              </p>

              <h2
                style={styles.sectionTitle}
              >
                About this place
              </h2>
            </div>
          </div>

          <div style={styles.infoGrid}>
            {(place.address ||
              place.postal_code) && (
              <div style={styles.infoItem}>
                <p style={styles.infoLabel}>
                  ADDRESS
                </p>

                {place.postal_code && (
                  <p style={styles.infoValue}>
                    {place.postal_code}
                  </p>
                )}

                {place.address && (
                  <p style={styles.infoValue}>
                    {place.address}
                  </p>
                )}

                {place.google_maps_url && (
                  <a
                    href={
                      place.google_maps_url
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    style={styles.infoLink}
                  >
                    Open in Google Maps →
                  </a>
                )}
              </div>
            )}

            {place.opening_hours && (
              <div style={styles.infoItem}>
                <p style={styles.infoLabel}>
                  OPENING HOURS
                </p>

                <p style={styles.infoValue}>
                  {place.opening_hours}
                </p>

                {place.closed_days && (
                  <p
                    style={
                      styles.infoSecondary
                    }
                  >
                    Closed:{" "}
                    {place.closed_days}
                  </p>
                )}
              </div>
            )}

            {place.reservation && (
              <div style={styles.infoItem}>
                <p style={styles.infoLabel}>
                  RESERVATION
                </p>

                <p style={styles.infoValue}>
                  {place.reservation}
                </p>
              </div>
            )}

            {place.english_support && (
              <div style={styles.infoItem}>
                <p style={styles.infoLabel}>
                  ENGLISH SUPPORT
                </p>

                <p style={styles.infoValue}>
                  {place.english_support}
                </p>
              </div>
            )}

            {(place.seats ||
              place.counter_seats ||
              place.table_seats) && (
              <div style={styles.infoItem}>
                <p style={styles.infoLabel}>
                  SEATING
                </p>

                {place.seats && (
                  <p style={styles.infoValue}>
                    Total: {place.seats}
                  </p>
                )}

                {place.counter_seats && (
                  <p style={styles.infoSecondary}>
                    Counter:{" "}
                    {place.counter_seats}
                  </p>
                )}

                {place.table_seats && (
                  <p style={styles.infoSecondary}>
                    Table:{" "}
                    {place.table_seats}
                  </p>
                )}
              </div>
            )}

            {place.card && (
              <div style={styles.infoItem}>
                <p style={styles.infoLabel}>
                  PAYMENT
                </p>

                <p style={styles.infoValue}>
                  {place.card}
                </p>
              </div>
            )}

            {place.tax_free && (
              <div style={styles.infoItem}>
                <p style={styles.infoLabel}>
                  TAX FREE
                </p>

                <p style={styles.infoValue}>
                  {place.tax_free}
                </p>
              </div>
            )}

            {place.phone && (
              <div style={styles.infoItem}>
                <p style={styles.infoLabel}>
                  PHONE
                </p>

                <p style={styles.infoValue}>
                  {place.phone}
                </p>
              </div>
            )}
          </div>
        </section>

        {(place.official_url ||
          place.instagram_url ||
          place.tabelog_url) && (
          <section style={styles.section}>
            <div style={styles.sectionHeader}>
              <div>
                <p
                  style={
                    styles.sectionEyebrow
                  }
                >
                  LINKS
                </p>

                <h2
                  style={styles.sectionTitle}
                >
                  Find out more
                </h2>
              </div>
            </div>

            <div style={styles.linkList}>
              {place.official_url && (
                <a
                  href={place.official_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={styles.externalLink}
                >
                  Official Website
                  <span>→</span>
                </a>
              )}

              {place.instagram_url && (
                <a
                  href={place.instagram_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={styles.externalLink}
                >
                  Instagram
                  <span>→</span>
                </a>
              )}

              {place.tabelog_url && (
                <a
                  href={place.tabelog_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={styles.externalLink}
                >
                  Tabelog
                  <span>→</span>
                </a>
              )}
            </div>
          </section>
        )}

        {images.length > 1 && (
          <section style={styles.section}>
            <div style={styles.sectionHeader}>
              <div>
                <p
                  style={
                    styles.sectionEyebrow
                  }
                >
                  INSIDE THE PLACE
                </p>

                <h2
                  style={styles.sectionTitle}
                >
                  Gallery
                </h2>
              </div>
            </div>

            <div style={styles.galleryGrid}>
              {images
                .slice(1)
                .map((image) => (
                  <div
                    key={image.id}
                    style={
                      styles.galleryImage
                    }
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
              <p
                style={
                  styles.sectionEyebrow
                }
              >
                WHAT TO BUY
              </p>

              <h2
                style={styles.sectionTitle}
              >
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
              {products.map(
                (product) => (
                  <Link
                    key={product.id}
                    href={`/products/${product.id}`}
                    style={
                      styles.productCard
                    }
                  >
                    <div
                      style={
                        styles.productImage
                      }
                    >
                      {product.image_url ? (
                        <img
                          src={
                            product.image_url
                          }
                          alt={
                            product.name
                          }
                          style={
                            styles.productImageElement
                          }
                        />
                      ) : (
                        <span>
                          TOKYO GUIDE
                        </span>
                      )}

                      {(product.editor_pick ??
                        0) > 0 && (
                        <span
                          style={
                            styles.pickBadge
                          }
                        >
                          PICK
                        </span>
                      )}
                    </div>

                    <div
                      style={
                        styles.productBody
                      }
                    >
                      {product.brand && (
                        <p
                          style={
                            styles.brand
                          }
                        >
                          {product.brand}
                        </p>
                      )}

                      <h3
                        style={
                          styles.productName
                        }
                      >
                        {product.name}
                      </h3>

                      {product.description && (
                        <p
                          style={
                            styles.productDescription
                          }
                        >
                          {
                            product.description
                          }
                        </p>
                      )}

                      <div
                        style={
                          styles.viewProduct
                        }
                      >
                        <span>
                          View product
                        </span>

                        <span>
                          →
                        </span>
                      </div>
                    </div>
                  </Link>
                )
              )}
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

  errorMain: {
    minHeight: "100vh",
    padding: "60px 24px",
    background: "#fffaf8",
    color: "#222",
  },

  errorBox: {
    maxWidth: "800px",
    margin: "0 auto",
    background: "#fff",
    border: "1px solid #e5ddd9",
    borderRadius: "16px",
    padding: "30px",
  },

  errorTitle: {
    fontFamily: "Georgia, serif",
    fontWeight: 400,
    fontSize: "30px",
    margin: 0,
  },

  errorMessage: {
    marginTop: "20px",
    color: "#c8647b",
    fontSize: "14px",
    lineHeight: 1.7,
    wordBreak: "break-word" as const,
  },

  errorId: {
    marginTop: "20px",
    color: "#777",
    fontSize: "12px",
    lineHeight: 1.7,
    wordBreak: "break-word" as const,
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

  area: {
    color: "#c8647b",
    fontSize: "10px",
    fontWeight: 700,
    letterSpacing: "1.2px",
    margin: 0,
    textTransform:
      "uppercase" as const,
  },

  title: {
    fontFamily: "Georgia, serif",
    fontWeight: 400,
    fontSize: "48px",
    lineHeight: 1.15,
    margin: "12px 0 0",
  },

  saveArea: {
    marginTop: "20px",
  },

  price: {
    color: "#666",
    fontSize: "12px",
    margin: "15px 0 0",
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
    borderLeft:
      "3px solid #c8647b",
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
    borderTop:
      "1px solid #e8dfdb",
  },

  sectionHeader: {
    display: "flex",
    justifyContent:
      "space-between",
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

  infoGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(2, minmax(0, 1fr))",
    gap: "1px",
    background: "#e8dfdb",
    border: "1px solid #e8dfdb",
  },

  infoItem: {
    background: "#fff",
    padding: "22px",
    minHeight: "100px",
  },

  infoLabel: {
    color: "#c8647b",
    fontSize: "9px",
    fontWeight: 700,
    letterSpacing: "1.6px",
    margin: 0,
  },

  infoValue: {
    color: "#444",
    fontSize: "13px",
    lineHeight: 1.8,
    margin: "8px 0 0",
    whiteSpace: "pre-line" as const,
  },

  infoSecondary: {
    color: "#888",
    fontSize: "12px",
    lineHeight: 1.7,
    margin: "5px 0 0",
    whiteSpace: "pre-line" as const,
  },

  infoLink: {
    display: "inline-block",
    marginTop: "10px",
    color: "#c8647b",
    textDecoration: "none",
    fontSize: "11px",
  },

  linkList: {
    display: "grid",
    gridTemplateColumns:
      "repeat(3, minmax(0, 1fr))",
    gap: "12px",
  },

  externalLink: {
    display: "flex",
    justifyContent:
      "space-between",
    alignItems: "center",
    padding: "16px 18px",
    background: "#fff",
    border: "1px solid #e5ddd9",
    borderRadius: "12px",
    color: "#333",
    textDecoration: "none",
    fontSize: "12px",
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
    justifyContent:
      "space-between",
    alignItems: "center",
    marginTop: "16px",
    paddingTop: "12px",
    borderTop:
      "1px solid #eee6e2",
    color: "#c8647b",
    fontSize: "11px",
  },

  count: {
    color: "#999",
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