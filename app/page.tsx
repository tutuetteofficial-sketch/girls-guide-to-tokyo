import Link from "next/link";
import Header from "@/components/Header";
import { supabase } from "@/lib/supabase";

type Place = {
  id: string;
  name: string;
  description: string | null;
  image_url: string | null;
};

type Food = {
  id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  editor_pick: number | null;
};

type Product = {
  id: string;
  name: string;
  brand: string | null;
  description: string | null;
  image_url: string | null;
  editor_pick: number | null;
};

type Article = {
  id: string;
  title: string;
  excerpt: string | null;
  image_url: string | null;
};

export default async function HomePage() {
  const [
    placesResult,
    foodsResult,
    productsResult,
    articlesResult,
  ] = await Promise.all([
    supabase
      .from("places")
      .select(`
        id,
        name,
        description,
        image_url
      `)
      .eq("status", "published")
      .order("updated_at", {
        ascending: false,
      })
      .limit(4),

    supabase
      .from("foods")
      .select(`
        id,
        name,
        description,
        image_url,
        editor_pick
      `)
      .eq("status", "active")
      .order("editor_pick", {
        ascending: false,
      })
      .limit(4),

    supabase
      .from("products")
      .select(`
        id,
        name,
        brand,
        description,
        image_url,
        editor_pick
      `)
      .eq("status", "published")
      .order("editor_pick", {
        ascending: false,
      })
      .limit(4),

    supabase
      .from("articles")
      .select(`
        id,
        title,
        excerpt,
        image_url
      `)
      .eq("status", "published")
      .order("updated_at", {
        ascending: false,
      })
      .limit(3),
  ]);

  const places =
    (placesResult.data ?? []) as Place[];

  const foods =
    (foodsResult.data ?? []) as Food[];

  const products =
    (productsResult.data ?? []) as Product[];

  const articles =
    (articlesResult.data ?? []) as Article[];

  return (
    <main style={styles.main}>
      <Header />

      <div style={styles.container}>
        {/* PLACES */}

        <section style={styles.section}>
          <SectionHeader
            eyebrow="WHERE TO GO"
            title="Places"
            href="/places"
          />

          <div style={styles.gridFour}>
            {places.length === 0 ? (
              <Empty text="No places yet." />
            ) : (
              places.map((place) => (
                <Link
                  key={place.id}
                  href={`/places/${place.id}`}
                  style={styles.card}
                >
                  <ImageBox
                    image={place.image_url}
                    alt={place.name}
                  />

                  <h3 style={styles.cardTitle}>
                    {place.name}
                  </h3>

                  {place.description && (
                    <p style={styles.cardText}>
                      {place.description}
                    </p>
                  )}
                </Link>
              ))
            )}
          </div>
        </section>

        {/* FOOD */}

        <section style={styles.section}>
          <SectionHeader
            eyebrow="WHAT TO EAT"
            title="Food"
            href="/foods"
          />

          <div style={styles.gridFour}>
            {foods.length === 0 ? (
              <Empty text="No food yet." />
            ) : (
              foods.map((food) => (
                <Link
                  key={food.id}
                  href={`/foods/${food.id}`}
                  style={styles.card}
                >
                  <div style={styles.imageWrapper}>
                    <ImageBox
                      image={food.image_url}
                      alt={food.name}
                    />

                    {(food.editor_pick ?? 0) > 0 && (
                      <span style={styles.pickBadge}>
                        PICK
                      </span>
                    )}
                  </div>

                  <h3 style={styles.cardTitle}>
                    {food.name}
                  </h3>

                  {food.description && (
                    <p style={styles.cardText}>
                      {food.description}
                    </p>
                  )}
                </Link>
              ))
            )}
          </div>
        </section>

        {/* PRODUCTS */}

        <section style={styles.section}>
          <SectionHeader
            eyebrow="WHAT TO BUY"
            title="Products"
            href="/products"
          />

          <div style={styles.gridFour}>
            {products.length === 0 ? (
              <Empty text="No products yet." />
            ) : (
              products.map((product) => (
                <Link
                  key={product.id}
                  href={`/products/${product.id}`}
                  style={styles.card}
                >
                  <div style={styles.imageWrapper}>
                    <ImageBox
                      image={product.image_url}
                      alt={product.name}
                    />

                    {(product.editor_pick ?? 0) > 0 && (
                      <span style={styles.pickBadge}>
                        PICK
                      </span>
                    )}
                  </div>

                  {product.brand && (
                    <p style={styles.brand}>
                      {product.brand}
                    </p>
                  )}

                  <h3 style={styles.cardTitle}>
                    {product.name}
                  </h3>

                  {product.description && (
                    <p style={styles.cardText}>
                      {product.description}
                    </p>
                  )}
                </Link>
              ))
            )}
          </div>
        </section>

        {/* ARTICLES */}

        <section style={styles.section}>
          <SectionHeader
            eyebrow="TOKYO STORIES"
            title="Articles"
            href="/articles"
          />

          <div style={styles.articleGrid}>
            {articles.length === 0 ? (
              <Empty text="No articles yet." />
            ) : (
              articles.map((article) => (
                <Link
                  key={article.id}
                  href={`/articles/${article.id}`}
                  style={styles.articleCard}
                >
                  <ImageBox
                    image={article.image_url}
                    alt={article.title}
                  />

                  <div style={styles.articleBody}>
                    <h3 style={styles.articleTitle}>
                      {article.title}
                    </h3>

                    {article.excerpt && (
                      <p style={styles.cardText}>
                        {article.excerpt}
                      </p>
                    )}

                    <span style={styles.readMore}>
                      Read story →
                    </span>
                  </div>
                </Link>
              ))
            )}
          </div>
        </section>

        <footer style={styles.footer}>
          <div>
            <p style={styles.footerLogo}>
              Girls' Guide to TOKYO
            </p>

            <p style={styles.footerText}>
              A curated guide to Tokyo.
            </p>
          </div>

          <p style={styles.footerText}>
            © Girls' Guide to TOKYO
          </p>
        </footer>
      </div>
    </main>
  );
}

function SectionHeader({
  eyebrow,
  title,
  href,
}: {
  eyebrow: string;
  title: string;
  href: string;
}) {
  return (
    <div style={styles.sectionHeader}>
      <div>
        <p style={styles.eyebrow}>
          {eyebrow}
        </p>

        <h2 style={styles.sectionTitle}>
          {title}
        </h2>
      </div>

      <Link
        href={href}
        style={styles.viewAll}
      >
        View all →
      </Link>
    </div>
  );
}

function ImageBox({
  image,
  alt,
}: {
  image: string | null;
  alt: string;
}) {
  return (
    <div style={styles.image}>
      {image ? (
        <img
          src={image}
          alt={alt}
          style={styles.imageElement}
        />
      ) : (
        <span style={styles.placeholder}>
          Girls' Guide to TOKYO
        </span>
      )}
    </div>
  );
}

function Empty({
  text,
}: {
  text: string;
}) {
  return (
    <div style={styles.empty}>
      {text}
    </div>
  );
}

const styles = {
  main: {
    minHeight: "100vh",
    background: "#fffaf8",
    color: "#222",
  },

  container: {
    maxWidth: "1150px",
    margin: "0 auto",
    padding: "0 24px 80px",
  },

  section: {
    paddingTop: "70px",
  },

  sectionHeader: {
    display: "flex",
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: "20px",
    marginBottom: "28px",
  },

  eyebrow: {
    color: "#c8647b",
    fontSize: "10px",
    fontWeight: 700,
    letterSpacing: "3px",
    margin: 0,
  },

  sectionTitle: {
    fontFamily: "Georgia, serif",
    fontSize: "42px",
    fontWeight: 400,
    margin: "8px 0 0",
  },

  viewAll: {
    color: "#777",
    textDecoration: "none",
    fontSize: "12px",
    paddingBottom: "6px",
    whiteSpace: "nowrap" as const,
  },

  gridFour: {
    display: "grid",
    gridTemplateColumns:
      "repeat(4, minmax(0, 1fr))",
    gap: "20px",
    alignItems: "start",
  },

  card: {
    color: "#222",
    textDecoration: "none",
    minWidth: 0,
    display: "block",
  },

  imageWrapper: {
    position: "relative" as const,
  },

  image: {
    width: "100%",
    aspectRatio: "1 / 1",
    background: "#f2e7e2",
    borderRadius: "14px",
    overflow: "hidden",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },

  imageElement: {
    width: "100%",
    height: "100%",
    objectFit: "cover" as const,
    display: "block",
  },

  placeholder: {
    color: "#987a73",
    fontFamily: "Georgia, serif",
    fontSize: "9px",
    letterSpacing: "1px",
    textAlign: "center" as const,
    padding: "10px",
  },

  pickBadge: {
    position: "absolute" as const,
    top: "10px",
    right: "10px",
    background: "#222",
    color: "#fff",
    fontSize: "8px",
    padding: "6px 8px",
    borderRadius: "999px",
    letterSpacing: "1px",
  },

  brand: {
    color: "#c8647b",
    fontSize: "9px",
    fontWeight: 700,
    letterSpacing: "0.8px",
    margin: "12px 0 0",
    textTransform: "uppercase" as const,
  },

  cardTitle: {
    fontFamily: "Georgia, serif",
    fontWeight: 400,
    fontSize: "21px",
    lineHeight: 1.25,
    margin: "10px 0 0",
    display: "-webkit-box",
    WebkitLineClamp: 2,
    WebkitBoxOrient: "vertical" as const,
    overflow: "hidden",
  },

  cardText: {
    color: "#777",
    fontSize: "11px",
    lineHeight: 1.7,
    margin: "7px 0 0",
    display: "-webkit-box",
    WebkitLineClamp: 3,
    WebkitBoxOrient: "vertical" as const,
    overflow: "hidden",
  },

  articleGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(3, minmax(0, 1fr))",
    gap: "22px",
    alignItems: "start",
  },

  articleCard: {
    color: "#222",
    textDecoration: "none",
    background: "#fff",
    border: "1px solid #e7e0dc",
    borderRadius: "15px",
    overflow: "hidden",
    display: "block",
  },

  articleBody: {
    padding: "18px",
  },

  articleTitle: {
    fontFamily: "Georgia, serif",
    fontWeight: 400,
    fontSize: "24px",
    lineHeight: 1.3,
    margin: 0,
    display: "-webkit-box",
    WebkitLineClamp: 2,
    WebkitBoxOrient: "vertical" as const,
    overflow: "hidden",
  },

  readMore: {
    display: "inline-block",
    color: "#c8647b",
    fontSize: "11px",
    marginTop: "15px",
  },

  empty: {
    gridColumn: "1 / -1",
    padding: "45px",
    textAlign: "center" as const,
    background: "#fff",
    border: "1px solid #e7e0dc",
    borderRadius: "14px",
    color: "#999",
    fontSize: "13px",
  },

  footer: {
    marginTop: "100px",
    paddingTop: "35px",
    borderTop: "1px solid #e7e0dc",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-end",
    gap: "20px",
  },

  footerLogo: {
    fontFamily: "Georgia, serif",
    letterSpacing: "1px",
    fontSize: "14px",
    margin: 0,
  },

  footerText: {
    color: "#999",
    fontSize: "10px",
    marginTop: "8px",
  },
};