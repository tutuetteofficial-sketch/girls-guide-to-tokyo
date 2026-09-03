import Link from "next/link";
import { notFound } from "next/navigation";
import Header from "@/components/Header";
import { supabase } from "@/lib/supabase";

type Article = {
  id: string;
  title: string;
  category: string | null;
  cover_image: string | null;
  content: string;
  created_at: string;
};

export default async function ArticleDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const {
    data: articleData,
    error,
  } = await supabase
    .from("articles")
    .select(`
      id,
      title,
      category,
      cover_image,
      content,
      created_at
    `)
    .eq("id", id)
    .eq("status", "published")
    .single();

  if (error || !articleData) {
    notFound();
  }

  const article = articleData as Article;

  const {
    data: relatedData,
  } = await supabase
    .from("articles")
    .select(`
      id,
      title,
      category,
      cover_image,
      created_at
    `)
    .eq("status", "published")
    .neq("id", article.id)
    .order("created_at", {
      ascending: false,
    })
    .limit(3);

  const relatedArticles = relatedData ?? [];

  const formattedDate =
    new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(new Date(article.created_at));

  return (
    <main style={styles.main}>
      <Header />

      <div style={styles.container}>
        <div style={styles.subHeader}>
          <Link
            href="/articles"
            style={styles.back}
          >
            ← Articles
          </Link>
        </div>

        <article>
          <header style={styles.hero}>
            {article.category && (
              <p style={styles.category}>
                {article.category}
              </p>
            )}

            <h1 style={styles.title}>
              {article.title}
            </h1>

            <p style={styles.date}>
              {formattedDate}
            </p>
          </header>

          <div style={styles.coverWrap}>
            {article.cover_image ? (
              <img
                src={article.cover_image}
                alt={article.title}
                style={styles.coverImage}
              />
            ) : (
              <div style={styles.coverPlaceholder}>
                TOKYO GUIDE
              </div>
            )}
          </div>

          {/* ARTICLE CONTENT */}
          <div
            className="article-content"
            style={styles.content}
            dangerouslySetInnerHTML={{
              __html: article.content,
            }}
          />
        </article>

        <section style={styles.relatedSection}>
          <div style={styles.relatedHeader}>
            <div>
              <p style={styles.relatedEyebrow}>
                KEEP EXPLORING
              </p>

              <h2 style={styles.relatedTitle}>
                More articles
              </h2>
            </div>

            <Link
              href="/articles"
              style={styles.allArticles}
            >
              All articles →
            </Link>
          </div>

          {relatedArticles.length > 0 ? (
            <div style={styles.relatedGrid}>
              {relatedArticles.map((related) => (
                <Link
                  key={related.id}
                  href={`/articles/${related.id}`}
                  style={styles.relatedCard}
                >
                  <div style={styles.relatedImageWrap}>
                    {related.cover_image ? (
                      <img
                        src={related.cover_image}
                        alt={related.title}
                        style={styles.relatedImage}
                      />
                    ) : (
                      <div style={styles.relatedPlaceholder}>
                        TOKYO GUIDE
                      </div>
                    )}
                  </div>

                  <div style={styles.relatedBody}>
                    {related.category && (
                      <p style={styles.relatedCategory}>
                        {related.category}
                      </p>
                    )}

                    <h3 style={styles.relatedCardTitle}>
                      {related.title}
                    </h3>

                    <p style={styles.readMore}>
                      Read article →
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div style={styles.empty}>
              More articles will be added soon.
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
    maxWidth: "1000px",
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
    maxWidth: "820px",
    margin: "65px auto 40px",
    textAlign: "center" as const,
  },

  category: {
    margin: 0,
    color: "#c8647b",
    fontSize: "10px",
    fontWeight: 700,
    letterSpacing: "2px",
    textTransform: "uppercase" as const,
  },

  title: {
    margin: "15px 0 0",
    fontFamily: "Georgia, serif",
    fontSize: "54px",
    fontWeight: 400,
    lineHeight: 1.2,
  },

  date: {
    margin: "18px 0 0",
    color: "#999",
    fontSize: "11px",
  },

  coverWrap: {
    width: "100%",
    aspectRatio: "16 / 8.5",
    overflow: "hidden",
    borderRadius: "18px",
    background: "#f2e7e2",
  },

  coverImage: {
    width: "100%",
    height: "100%",
    objectFit: "cover" as const,
    display: "block",
  },

  coverPlaceholder: {
    width: "100%",
    height: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#987a73",
    fontFamily: "Georgia, serif",
    fontSize: "11px",
    letterSpacing: "3px",
  },

  content: {
    maxWidth: "720px",
    margin: "55px auto 0",
    color: "#444",
    fontSize: "16px",
    lineHeight: 2,
  },

  relatedSection: {
    marginTop: "90px",
    paddingTop: "35px",
    borderTop: "1px solid #e8dfdb",
  },

  relatedHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-end",
    gap: "20px",
    marginBottom: "25px",
  },

  relatedEyebrow: {
    margin: 0,
    color: "#c8647b",
    fontSize: "9px",
    fontWeight: 700,
    letterSpacing: "2px",
  },

  relatedTitle: {
    margin: "7px 0 0",
    fontFamily: "Georgia, serif",
    fontSize: "30px",
    fontWeight: 400,
  },

  allArticles: {
    color: "#777",
    fontSize: "11px",
    textDecoration: "none",
  },

  relatedGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(3, minmax(0, 1fr))",
    gap: "18px",
  },

  relatedCard: {
    display: "block",
    color: "#222",
    textDecoration: "none",
    background: "#fff",
    border: "1px solid #e5ddd9",
    borderRadius: "15px",
    overflow: "hidden",
  },

  relatedImageWrap: {
    aspectRatio: "16 / 10",
    background: "#f2e7e2",
    overflow: "hidden",
  },

  relatedImage: {
    width: "100%",
    height: "100%",
    objectFit: "cover" as const,
    display: "block",
  },

  relatedPlaceholder: {
    width: "100%",
    height: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#987a73",
    fontFamily: "Georgia, serif",
    fontSize: "9px",
    letterSpacing: "2px",
  },

  relatedBody: {
    padding: "16px",
  },

  relatedCategory: {
    margin: 0,
    color: "#c8647b",
    fontSize: "9px",
    fontWeight: 700,
    letterSpacing: "1.2px",
    textTransform: "uppercase" as const,
  },

  relatedCardTitle: {
    margin: "7px 0 0",
    fontFamily: "Georgia, serif",
    fontSize: "20px",
    fontWeight: 400,
    lineHeight: 1.4,
  },

  readMore: {
    margin: "15px 0 0",
    color: "#777",
    fontSize: "10px",
  },

  empty: {
    padding: "45px 20px",
    textAlign: "center" as const,
    background: "#fff",
    border: "1px solid #e7e0dc",
    borderRadius: "15px",
    color: "#999",
    fontSize: "12px",
  },
} as const;