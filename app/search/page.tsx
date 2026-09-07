import Link from "next/link";
import Header from "@/components/Header";
import { supabase } from "@/lib/supabase";

type SearchParams = {
  q?: string;
};

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
};

type Product = {
  id: string;
  name: string;
  description: string | null;
  image_url: string | null;
};

type Article = {
  id: string;
  title: string;
  excerpt: string | null;
  cover_image_url: string | null;
};

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const { q } = await searchParams;

  const query = q?.trim() ?? "";

  let places: Place[] = [];
  let foods: Food[] = [];
  let products: Product[] = [];
  let articles: Article[] = [];

  let errorMessage = "";

  if (query) {
    const keyword = `%${query}%`;

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
        .or(
          `name.ilike.${keyword},description.ilike.${keyword}`
        )
        .limit(12),

      supabase
        .from("foods")
        .select(`
          id,
          name,
          description,
          image_url
        `)
        .eq("status", "active")
        .or(
          `name.ilike.${keyword},description.ilike.${keyword}`
        )
        .limit(12),

      supabase
        .from("products")
        .select(`
          id,
          name,
          description,
          image_url
        `)
        .eq("status", "published")
        .or(
          `name.ilike.${keyword},description.ilike.${keyword}`
        )
        .limit(12),

      supabase
        .from("articles")
        .select(`
          id,
          title,
          excerpt,
          cover_image_url
        `)
        .eq("status", "published")
        .or(
          `title.ilike.${keyword},excerpt.ilike.${keyword}`
        )
        .limit(12),
    ]);

    const firstError =
      placesResult.error ||
      foodsResult.error ||
      productsResult.error ||
      articlesResult.error;

    if (firstError) {
      errorMessage = firstError.message;
    }

    places =
      (placesResult.data ?? []) as Place[];

    foods =
      (foodsResult.data ?? []) as Food[];

    products =
      (productsResult.data ?? []) as Product[];

    articles =
      (articlesResult.data ?? []) as Article[];
  }

  const total =
    places.length +
    foods.length +
    products.length +
    articles.length;

  return (
    <main style={styles.main}>
      <Header />

      <div style={styles.container}>
        <header style={styles.header}>
          <p style={styles.eyebrow}>
            DISCOVER TOKYO
          </p>

          <h1 style={styles.title}>
            Search
          </h1>

          <p style={styles.description}>
            Find places, food, products and stories.
          </p>
        </header>

        <form
          action="/search"
          style={styles.searchForm}
        >
          <input
            type="text"
            name="q"
            defaultValue={query}
            placeholder="Search Tokyo..."
            style={styles.searchInput}
          />

          <button
            type="submit"
            style={styles.searchButton}
          >
            Search
          </button>
        </form>

        {!query ? (
          <div style={styles.startMessage}>
            <p style={styles.startTitle}>
              What are you looking for?
            </p>

            <p style={styles.startText}>
              Search for places, food,
              products or stories from Tokyo.
            </p>

            <div style={styles.examples}>
              <Link
                href="/search?q=matcha"
                style={styles.exampleLink}
              >
                Matcha
              </Link>

              <Link
                href="/search?q=shibuya"
                style={styles.exampleLink}
              >
                Shibuya
              </Link>

              <Link
                href="/search?q=ramen"
                style={styles.exampleLink}
              >
                Ramen
              </Link>
            </div>
          </div>
        ) : errorMessage ? (
          <div style={styles.error}>
            {errorMessage}
          </div>
        ) : (
          <>
            <div style={styles.resultHeader}>
              <p style={styles.resultText}>
                Results for{" "}
                <strong>
                  “{query}”
                </strong>
              </p>

              <p style={styles.resultCount}>
                {total} results
              </p>
            </div>

            {total === 0 ? (
              <div style={styles.empty}>
                <h2 style={styles.emptyTitle}>
                  Nothing found
                </h2>

                <p style={styles.emptyText}>
                  Try searching for something else.
                </p>
              </div>
            ) : (
              <div style={styles.results}>
                {places.length > 0 && (
                  <SearchSection
                    title="Places"
                  >
                    {places.map((place) => (
                      <SearchCard
                        key={place.id}
                        href={`/places/${place.id}`}
                        type="PLACE"
                        title={place.name}
                        imageUrl={place.image_url}
                      />
                    ))}
                  </SearchSection>
                )}

                {foods.length > 0 && (
                  <SearchSection
                    title="Food"
                  >
                    {foods.map((food) => (
                      <SearchCard
                        key={food.id}
                        href={`/food/${food.id}`}
                        type="FOOD"
                        title={food.name}
                        imageUrl={food.image_url}
                      />
                    ))}
                  </SearchSection>
                )}

                {products.length > 0 && (
                  <SearchSection
                    title="Products"
                  >
                    {products.map((product) => (
                      <SearchCard
                        key={product.id}
                        href={`/products/${product.id}`}
                        type="PRODUCT"
                        title={product.name}
                        imageUrl={product.image_url}
                      />
                    ))}
                  </SearchSection>
                )}

                {articles.length > 0 && (
                  <SearchSection
                    title="Articles"
                  >
                    {articles.map((article) => (
                      <SearchCard
                        key={article.id}
                        href={`/articles/${article.id}`}
                        type="ARTICLE"
                        title={article.title}
                        imageUrl={
                          article.cover_image_url
                        }
                      />
                    ))}
                  </SearchSection>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}

function SearchSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section style={styles.section}>
      <div style={styles.sectionHeader}>
        <h2 style={styles.sectionTitle}>
          {title}
        </h2>
      </div>

      <div style={styles.grid}>
        {children}
      </div>
    </section>
  );
}

function SearchCard({
  href,
  type,
  title,
  imageUrl,
}: {
  href: string;
  type: string;
  title: string;
  imageUrl: string | null;
}) {
  return (
    <Link
      href={href}
      style={styles.card}
    >
      <div style={styles.image}>
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={title}
            style={styles.imageElement}
          />
        ) : (
          <span style={styles.placeholder}>
            TOKYO GUIDE
          </span>
        )}
      </div>

      <div style={styles.cardBody}>
        <p style={styles.type}>
          {type}
        </p>

        <h3 style={styles.cardTitle}>
          {title}
        </h3>
      </div>
    </Link>
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

  header: {
    padding: "55px 0 30px",
  },

  eyebrow: {
    color: "#c8647b",
    fontSize: "10px",
    fontWeight: 700,
    letterSpacing: "3px",
    margin: 0,
  },

  title: {
    fontFamily: "Georgia, serif",
    fontSize: "56px",
    fontWeight: 400,
    margin: "10px 0 0",
  },

  description: {
    color: "#777",
    marginTop: "12px",
    fontSize: "14px",
  },

  searchForm: {
    display: "flex",
    gap: "10px",
    marginBottom: "50px",
  },

  searchInput: {
    flex: 1,
    minWidth: 0,
    border: "1px solid #ded6d2",
    background: "#fff",
    borderRadius: "12px",
    padding: "16px 18px",
    fontSize: "14px",
    outline: "none",
  },

  searchButton: {
    border: "none",
    background: "#222",
    color: "#fff",
    borderRadius: "12px",
    padding: "0 26px",
    cursor: "pointer",
    fontSize: "13px",
  },

  startMessage: {
    padding: "65px 20px",
    textAlign: "center" as const,
    background: "#fff",
    border: "1px solid #e7e0dc",
    borderRadius: "18px",
  },

  startTitle: {
    fontFamily: "Georgia, serif",
    fontSize: "26px",
    margin: 0,
  },

  startText: {
    color: "#777",
    fontSize: "13px",
    marginTop: "12px",
  },

  examples: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    gap: "10px",
    marginTop: "25px",
    flexWrap: "wrap" as const,
  },

  exampleLink: {
    color: "#c8647b",
    textDecoration: "none",
    border: "1px solid #ead7dc",
    background: "#fffaf8",
    borderRadius: "999px",
    padding: "8px 14px",
    fontSize: "11px",
  },

  resultHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "35px",
  },

  resultText: {
    fontSize: "14px",
    margin: 0,
  },

  resultCount: {
    color: "#999",
    fontSize: "12px",
    margin: 0,
  },

  results: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "50px",
  },

  section: {
    borderTop: "1px solid #e8dfdb",
    paddingTop: "25px",
  },

  sectionHeader: {
    marginBottom: "18px",
  },

  sectionTitle: {
    fontFamily: "Georgia, serif",
    fontSize: "32px",
    fontWeight: 400,
    margin: 0,
  },

  grid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(4, minmax(0, 1fr))",
    gap: "18px",
  },

  card: {
    color: "#222",
    textDecoration: "none",
    minWidth: 0,
  },

  image: {
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
    letterSpacing: "2px",
  },

  cardBody: {
    paddingTop: "12px",
  },

  type: {
    color: "#c8647b",
    fontSize: "9px",
    fontWeight: 700,
    letterSpacing: "1.5px",
    margin: 0,
  },

  cardTitle: {
    fontFamily: "Georgia, serif",
    fontSize: "20px",
    fontWeight: 400,
    lineHeight: 1.3,
    margin: "5px 0 0",
  },

  empty: {
    padding: "70px 20px",
    textAlign: "center" as const,
    background: "#fff",
    border: "1px solid #e7e0dc",
    borderRadius: "18px",
  },

  emptyTitle: {
    fontFamily: "Georgia, serif",
    fontWeight: 400,
    margin: 0,
  },

  emptyText: {
    color: "#888",
    fontSize: "13px",
    marginTop: "10px",
  },

  error: {
    padding: "20px",
    background: "#fff0f0",
    border: "1px solid #edcaca",
    borderRadius: "12px",
    color: "#a44",
  },
};