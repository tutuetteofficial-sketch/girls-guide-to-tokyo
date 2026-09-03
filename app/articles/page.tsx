import Link from "next/link";
import { supabase } from "@/lib/supabase";

type Article = {
  id: string;
  title: string;
  category: string | null;
  cover_image: string | null;
  content: string;
  created_at: string;
};

export default async function ArticlesPage() {
  const { data: articles, error } = await supabase
    .from("articles")
    .select(
      "id, title, category, cover_image, content, created_at"
    )
    .eq("status", "published")
    .order("created_at", {
      ascending: false,
    });

  if (error) {
    return (
      <main style={styles.main}>
        <div style={styles.container}>
          <p style={styles.eyebrow}>
            ARTICLES
          </p>

          <h1 style={styles.title}>
            Articles
          </h1>

          <p style={styles.error}>
            Articles could not be loaded.
          </p>
        </div>
      </main>
    );
  }

  const publishedArticles =
    (articles ?? []) as Article[];

  return (
    <main style={styles.main}>
      <div style={styles.container}>
        {/* =========================
            Header
        ========================== */}

        <header style={styles.header}>
          <p style={styles.eyebrow}>
            TOKYO GUIDE / ARTICLES
          </p>

          <h1 style={styles.title}>
            Articles
          </h1>

          <p style={styles.description}>
            Stories, guides and ideas for discovering the cute side of Japan.
          </p>
        </header>

        {/* =========================
            Empty
        ========================== */}

        {publishedArticles.length === 0 ? (
          <section style={styles.empty}>
            <h2 style={styles.emptyTitle}>
              No articles yet
            </h2>

            <p style={styles.emptyText}>
              New stories are coming soon.
            </p>
          </section>
        ) : (
          /* =========================
             Article Grid
          ========================== */

          <section style={styles.grid}>
            {publishedArticles.map(
              (article) => (
                <Link
                  key={article.id}
                  href={`/articles/${article.id}`}
                  style={styles.card}
                >
                  <div style={styles.imageWrap}>
                    {article.cover_image ? (
                      <img
                        src={article.cover_image}
                        alt={article.title}
                        style={styles.image}
                      />
                    ) : (
                      <div style={styles.imagePlaceholder}>
                        TOKYO GUIDE
                      </div>
                    )}
                  </div>

                  <div style={styles.cardBody}>
                    {article.category && (
                      <div style={styles.category}>
                        {article.category}
                      </div>
                    )}

                    <h2 style={styles.cardTitle}>
                      {article.title}
                    </h2>

                    <p style={styles.readMore}>
                      Read article →
                    </p>
                  </div>
                </Link>
              )
            )}
          </section>
        )}
      </div>
    </main>
  );
}

/* =========================
   Styles
========================= */

const styles = {
  main: {
    minHeight: "100vh",
    background: "#faf8f6",
    color: "#222",
    padding: "60px 24px 100px",
  },

  container: {
    maxWidth: "1180px",
    margin: "0 auto",
  },

  header: {
    maxWidth: "760px",
    marginBottom: "42px",
  },

  eyebrow: {
    margin: "0 0 10px",
    color: "#c8647b",
    fontSize: "10px",
    fontWeight: 700,
    letterSpacing: "3px",
  },

  title: {
    margin: 0,
    fontFamily: "Georgia, serif",
    fontSize: "52px",
    fontWeight: 400,
    lineHeight: 1.15,
  },

  description: {
    margin: "14px 0 0",
    color: "#777",
    fontSize: "14px",
    lineHeight: 1.8,
  },

  grid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(3, minmax(0, 1fr))",
    gap: "28px",
  },

  card: {
    display: "block",
    background: "#fff",
    border: "1px solid #e8e1dd",
    borderRadius: "16px",
    overflow: "hidden",
    color: "#222",
    textDecoration: "none",
  },

  imageWrap: {
    width: "100%",
    aspectRatio: "16 / 10",
    overflow: "hidden",
    background: "#f2eeeb",
  },

  image: {
    display: "block",
    width: "100%",
    height: "100%",
    objectFit: "cover" as const,
  },

  imagePlaceholder: {
    width: "100%",
    height: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#aaa",
    fontSize: "10px",
    fontWeight: 700,
    letterSpacing: "3px",
  },

  cardBody: {
    padding: "18px 19px 20px",
  },

  category: {
    marginBottom: "8px",
    color: "#c8647b",
    fontSize: "10px",
    fontWeight: 700,
    letterSpacing: "1.5px",
    textTransform: "uppercase" as const,
  },

  cardTitle: {
    margin: 0,
    fontFamily: "Georgia, serif",
    fontSize: "23px",
    fontWeight: 400,
    lineHeight: 1.4,
  },

  readMore: {
    margin: "15px 0 0",
    color: "#777",
    fontSize: "11px",
  },

  empty: {
    padding: "70px 20px",
    textAlign: "center" as const,
    background: "#fff",
    border: "1px solid #e8e1dd",
    borderRadius: "16px",
  },

  emptyTitle: {
    margin: 0,
    fontFamily: "Georgia, serif",
    fontSize: "28px",
    fontWeight: 400,
  },

  emptyText: {
    margin: "10px 0 0",
    color: "#777",
    fontSize: "13px",
  },

  error: {
    marginTop: "25px",
    color: "#a44",
  },
};