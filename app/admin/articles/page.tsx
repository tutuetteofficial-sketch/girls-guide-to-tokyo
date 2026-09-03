"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type ArticleStatus =
  | "draft"
  | "published"
  | "hidden"
  | "archived";

type Article = {
  id: string;
  title: string;
  category: string | null;
  cover_image: string | null;
  status: ArticleStatus;
  created_at: string;
  updated_at: string;
};

export default function ArticlesPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  async function loadArticles() {
    setLoading(true);
    setMessage("");

    const { data, error } = await supabase
      .from("articles")
      .select(
        "id, title, category, cover_image, status, created_at, updated_at"
      )
      .order("updated_at", { ascending: false });

    if (error) {
      setMessage(
        `Articleの読み込みに失敗しました: ${error.message}`
      );
      setArticles([]);
    } else {
      setArticles((data ?? []) as Article[]);
    }

    setLoading(false);
  }

  useEffect(() => {
    loadArticles();
  }, []);

  function statusLabel(status: ArticleStatus) {
    switch (status) {
      case "published":
        return "Published";
      case "hidden":
        return "Hidden";
      case "archived":
        return "Archived";
      default:
        return "Draft";
    }
  }

  function statusStyle(status: ArticleStatus) {
    switch (status) {
      case "published":
        return styles.statusPublished;
      case "hidden":
        return styles.statusHidden;
      case "archived":
        return styles.statusArchived;
      default:
        return styles.statusDraft;
    }
  }

  function formatDate(value: string) {
    return new Date(value).toLocaleDateString(
      "en-US",
      {
        year: "numeric",
        month: "short",
        day: "numeric",
      }
    );
  }

  return (
    <main style={styles.main}>
      <div style={styles.container}>
        {/* =========================
            Header
        ========================== */}

        <div style={styles.topbar}>
          <div>
            <p style={styles.eyebrow}>
              CONTENT
            </p>

            <h1 style={styles.title}>
              Articles
            </h1>

            <p style={styles.description}>
              Manage your editorial content.
            </p>
          </div>

          <Link
            href="/admin/articles/new"
            style={styles.newButton}
          >
            + New Article
          </Link>
        </div>

        {/* =========================
            Message
        ========================== */}

        {message && (
          <div style={styles.message}>
            {message}
          </div>
        )}

        {/* =========================
            Loading
        ========================== */}

        {loading ? (
          <div style={styles.loading}>
            Loading articles...
          </div>
        ) : articles.length === 0 ? (
          /* =========================
             Empty
          ========================== */

          <section style={styles.emptyCard}>
            <h2 style={styles.emptyTitle}>
              No articles yet
            </h2>

            <p style={styles.emptyText}>
              Create your first article to start building the guide.
            </p>

            <Link
              href="/admin/articles/new"
              style={styles.emptyButton}
            >
              Create Article
            </Link>
          </section>
        ) : (
          /* =========================
             List
          ========================== */

          <section style={styles.listCard}>
            <div style={styles.listHeader}>
              <span>
                {articles.length}{" "}
                {articles.length === 1
                  ? "article"
                  : "articles"}
              </span>
            </div>

            <div style={styles.articleList}>
              {articles.map((article) => (
                <Link
                  key={article.id}
                  href={`/admin/articles/${article.id}`}
                  style={styles.articleCard}
                >
                  <div style={styles.cover}>
                    {article.cover_image ? (
                      <img
                        src={article.cover_image}
                        alt={article.title}
                        style={styles.coverImage}
                      />
                    ) : (
                      <div style={styles.coverPlaceholder}>
                        ARTICLE
                      </div>
                    )}
                  </div>

                  <div style={styles.articleMain}>
                    <div style={styles.articleTop}>
                      <div style={styles.articleTitleBlock}>
                        <h2 style={styles.articleTitle}>
                          {article.title ||
                            "Untitled Article"}
                        </h2>

                        {article.category && (
                          <span style={styles.category}>
                            {article.category}
                          </span>
                        )}
                      </div>

                      <span
                        style={{
                          ...styles.status,
                          ...statusStyle(article.status),
                        }}
                      >
                        {statusLabel(article.status)}
                      </span>
                    </div>

                    <div style={styles.articleMeta}>
                      <span>
                        Updated{" "}
                        {formatDate(
                          article.updated_at
                        )}
                      </span>

                      <span style={styles.arrow}>
                        →
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
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
    padding: "40px 24px 100px",
  },

  container: {
    maxWidth: "1100px",
    margin: "0 auto",
  },

  topbar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-end",
    gap: "20px",
    marginBottom: "30px",
  },

  eyebrow: {
    color: "#c8647b",
    fontSize: "10px",
    fontWeight: 700,
    letterSpacing: "3px",
    margin: "0 0 8px",
  },

  title: {
    fontFamily: "Georgia, serif",
    fontSize: "48px",
    fontWeight: 400,
    margin: 0,
  },

  description: {
    margin: "10px 0 0",
    color: "#777",
    lineHeight: 1.7,
  },

  newButton: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "44px",
    padding: "0 18px",
    borderRadius: "10px",
    background: "#222",
    color: "#fff",
    textDecoration: "none",
    fontSize: "13px",
    fontWeight: 600,
    whiteSpace: "nowrap" as const,
  },

  message: {
    marginBottom: "18px",
    padding: "12px 14px",
    border: "1px solid #e5cccc",
    borderRadius: "10px",
    background: "#fff8f8",
    color: "#a44",
    fontSize: "13px",
  },

  loading: {
    padding: "60px 20px",
    textAlign: "center" as const,
    color: "#888",
  },

  emptyCard: {
    background: "#fff",
    border: "1px solid #e7e0dc",
    borderRadius: "15px",
    padding: "70px 30px",
    textAlign: "center" as const,
  },

  emptyTitle: {
    fontFamily: "Georgia, serif",
    fontSize: "28px",
    fontWeight: 400,
    margin: "0 0 10px",
  },

  emptyText: {
    color: "#777",
    fontSize: "13px",
    lineHeight: 1.7,
    margin: "0 0 22px",
  },

  emptyButton: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "42px",
    padding: "0 16px",
    borderRadius: "9px",
    background: "#222",
    color: "#fff",
    textDecoration: "none",
    fontSize: "13px",
    fontWeight: 600,
  },

  listCard: {
    background: "#fff",
    border: "1px solid #e7e0dc",
    borderRadius: "15px",
    overflow: "hidden",
  },

  listHeader: {
    padding: "15px 18px",
    borderBottom: "1px solid #eee7e3",
    color: "#888",
    fontSize: "12px",
  },

  articleList: {
    display: "flex",
    flexDirection: "column" as const,
  },

  articleCard: {
    display: "flex",
    alignItems: "stretch",
    gap: "18px",
    padding: "16px 18px",
    borderBottom: "1px solid #eee7e3",
    textDecoration: "none",
    color: "#222",
    transition: "background 0.15s ease",
  },

  cover: {
    width: "150px",
    minWidth: "150px",
    height: "100px",
    borderRadius: "10px",
    overflow: "hidden",
    background: "#f4f0ed",
  },

  coverImage: {
    display: "block",
    width: "100%",
    height: "100%",
    objectFit: "cover" as const,
  },

  coverPlaceholder: {
    width: "100%",
    height: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#aaa",
    fontSize: "10px",
    fontWeight: 700,
    letterSpacing: "2px",
  },

  articleMain: {
    flex: 1,
    minWidth: 0,
    display: "flex",
    flexDirection: "column" as const,
    justifyContent: "space-between",
    gap: "15px",
    padding: "2px 0",
  },

  articleTop: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: "15px",
  },

  articleTitleBlock: {
    minWidth: 0,
  },

  articleTitle: {
    margin: 0,
    fontFamily: "Georgia, serif",
    fontSize: "21px",
    fontWeight: 400,
    lineHeight: 1.35,
    overflow: "hidden",
    textOverflow: "ellipsis",
    display: "-webkit-box",
    WebkitLineClamp: 2,
    WebkitBoxOrient: "vertical" as const,
  },

  category: {
    display: "inline-block",
    marginTop: "8px",
    color: "#888",
    fontSize: "11px",
  },

  status: {
    flexShrink: 0,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "28px",
    padding: "0 9px",
    borderRadius: "999px",
    fontSize: "10px",
    fontWeight: 700,
  },

  statusDraft: {
    background: "#f1efed",
    color: "#777",
  },

  statusPublished: {
    background: "#f8e8ed",
    color: "#b5536d",
  },

  statusHidden: {
    background: "#eee",
    color: "#666",
  },

  statusArchived: {
    background: "#e9e6e3",
    color: "#888",
  },

  articleMeta: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "15px",
    color: "#999",
    fontSize: "11px",
  },

  arrow: {
    color: "#555",
    fontSize: "16px",
  },
};