"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import ArticleEditor from "@/components/article-folder/ArticleEditor";
import ImageUploader from "@/components/ImageUploader";
import { supabase } from "@/lib/supabase";

type Place = {
  id: string;
  name: string;
};

type Product = {
  id: string;
  name: string;
};

type ArticleStatus =
  | "draft"
  | "published"
  | "hidden"
  | "archived";

export default function NewArticlePage() {
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [coverImage, setCoverImage] = useState("");
  const [content, setContent] = useState("");

  const [places, setPlaces] = useState<Place[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  const [selectedPlaceIds, setSelectedPlaceIds] =
    useState<string[]>([]);

  const [selectedProductIds, setSelectedProductIds] =
    useState<string[]>([]);

  const [status, setStatus] =
    useState<ArticleStatus>("draft");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  /* =========================
     Load options
  ========================== */

  useEffect(() => {
    async function load() {
      setLoading(true);
      setMessage("");

      const [placesResult, productsResult] =
        await Promise.all([
          supabase
            .from("places")
            .select("id, name")
            .eq("status", "published")
            .order("name"),

          supabase
            .from("products")
            .select("id, name")
            .eq("status", "published")
            .order("name"),
        ]);

      if (placesResult.error) {
        setMessage(
          `Placeの読み込みに失敗しました: ${placesResult.error.message}`
        );
      }

      if (productsResult.error) {
        setMessage(
          `Productの読み込みに失敗しました: ${productsResult.error.message}`
        );
      }

      setPlaces(
        (placesResult.data ?? []) as Place[]
      );

      setProducts(
        (productsResult.data ?? []) as Product[]
      );

      setLoading(false);
    }

    load();
  }, []);

  /* =========================
     Toggle relations
  ========================== */

  function togglePlace(placeId: string) {
    setSelectedPlaceIds((current) => {
      if (current.includes(placeId)) {
        return current.filter(
          (id) => id !== placeId
        );
      }

      return [...current, placeId];
    });
  }

  function toggleProduct(productId: string) {
    setSelectedProductIds((current) => {
      if (current.includes(productId)) {
        return current.filter(
          (id) => id !== productId
        );
      }

      return [...current, productId];
    });
  }

  /* =========================
     Save
  ========================== */

  async function handleSave(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!title.trim()) {
      setMessage("Titleを入力してください。");
      return;
    }

    setSaving(true);
    setMessage("Saving...");

    try {
      /* =========================
         Article
      ========================== */

      const { data: article, error: articleError } =
        await supabase
          .from("articles")
          .insert({
            title: title.trim(),
            category:
              category.trim() || null,
            cover_image:
              coverImage.trim() || null,
            content: content || "",
            status,
          })
          .select("id")
          .single();

      if (
        articleError ||
        !article
      ) {
        throw new Error(
          `Articleの保存に失敗しました: ${
            articleError?.message ??
            "Unknown error"
          }`
        );
      }

      /* =========================
         Places
      ========================== */

      if (selectedPlaceIds.length > 0) {
        const placeRows =
          selectedPlaceIds.map((placeId) => ({
            article_id: article.id,
            place_id: placeId,
          }));

        const {
          error: placeRelationError,
        } = await supabase
          .from("article_places")
          .insert(placeRows);

        if (placeRelationError) {
          throw new Error(
            `Related Placesの保存に失敗しました: ${placeRelationError.message}`
          );
        }
      }

      /* =========================
         Products
      ========================== */

      if (
        selectedProductIds.length > 0
      ) {
        const productRows =
          selectedProductIds.map(
            (productId) => ({
              article_id: article.id,
              product_id: productId,
            })
          );

        const {
          error: productRelationError,
        } = await supabase
          .from("article_products")
          .insert(productRows);

        if (productRelationError) {
          throw new Error(
            `Related Productsの保存に失敗しました: ${productRelationError.message}`
          );
        }
      }

      setMessage("Articleを保存しました。");

      router.push(
        `/admin/articles/${article.id}`
      );
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "保存に失敗しました。"
      );
    } finally {
      setSaving(false);
    }
  }

  /* =========================
     Loading
  ========================== */

  if (loading) {
    return (
      <main style={styles.loadingPage}>
        Loading...
      </main>
    );
  }

  /* =========================
     Page
  ========================== */

  return (
    <main style={styles.main}>
      <div style={styles.container}>
        <Link
          href="/admin/articles"
          style={styles.back}
        >
          ← Articles
        </Link>

        <header style={styles.header}>
          <p style={styles.eyebrow}>
            CONTENT / ARTICLES
          </p>

          <h1 style={styles.title}>
            New Article
          </h1>

          <p style={styles.description}>
            Create an article and connect it with Places and Products.
          </p>
        </header>

        <form
          onSubmit={handleSave}
          style={styles.form}
        >
          {/* =====================
              BASIC INFORMATION
          ====================== */}

          <section style={styles.section}>
            <h2 style={styles.sectionTitle}>
              Basic Information
            </h2>

            <label style={styles.label}>
              Title *
              <input
                style={styles.input}
                value={title}
                onChange={(event) =>
                  setTitle(event.target.value)
                }
                placeholder="10 Cute Things to Buy in Tokyo"
                required
              />
            </label>

            <label style={styles.label}>
              Category
              <input
                style={styles.input}
                value={category}
                onChange={(event) =>
                  setCategory(event.target.value)
                }
                placeholder="Shopping"
              />
            </label>
          </section>

          {/* =====================
              COVER IMAGE
          ====================== */}

          <section style={styles.section}>
            <h2 style={styles.sectionTitle}>
              Cover Image
            </h2>

            <ImageUploader
              value={coverImage}
              onChange={setCoverImage}
              folder="article-covers"
              label="Cover Image"
            />

            <p style={styles.helper}>
              This image will be used as the main image for the article.
            </p>

            {coverImage && (
              <div style={styles.coverPreview}>
                <img
                  src={coverImage}
                  alt="Article cover preview"
                  style={styles.coverPreviewImage}
                />
              </div>
            )}
          </section>

          {/* =====================
              BODY
          ====================== */}

          <section style={styles.section}>
            <h2 style={styles.sectionTitle}>
              Body
            </h2>

            <ArticleEditor
              value={content}
              onChange={setContent}
              placeholder="Write your article here..."
            />
          </section>

          {/* =====================
              RELATED PLACES
          ====================== */}

          <section style={styles.section}>
            <h2 style={styles.sectionTitle}>
              Related Places
            </h2>

            <p style={styles.helper}>
              Select the Places mentioned in this article.
            </p>

            {places.length === 0 ? (
              <p style={styles.empty}>
                Published Placeがまだありません。
              </p>
            ) : (
              <div style={styles.selectionList}>
                {places.map((place) => (
                  <label
                    key={place.id}
                    style={styles.selectionItem}
                  >
                    <input
                      type="checkbox"
                      checked={selectedPlaceIds.includes(
                        place.id
                      )}
                      onChange={() =>
                        togglePlace(place.id)
                      }
                    />

                    <span>{place.name}</span>
                  </label>
                ))}
              </div>
            )}

            {selectedPlaceIds.length > 0 && (
              <p style={styles.selectedCount}>
                {selectedPlaceIds.length} Place
                {selectedPlaceIds.length === 1
                  ? ""
                  : "s"} selected
              </p>
            )}
          </section>

          {/* =====================
              RELATED PRODUCTS
          ====================== */}

          <section style={styles.section}>
            <h2 style={styles.sectionTitle}>
              Related Products
            </h2>

            <p style={styles.helper}>
              Select the Products mentioned in this article.
            </p>

            {products.length === 0 ? (
              <p style={styles.empty}>
                Published Productがまだありません。
              </p>
            ) : (
              <div style={styles.selectionList}>
                {products.map((product) => (
                  <label
                    key={product.id}
                    style={styles.selectionItem}
                  >
                    <input
                      type="checkbox"
                      checked={selectedProductIds.includes(
                        product.id
                      )}
                      onChange={() =>
                        toggleProduct(product.id)
                      }
                    />

                    <span>{product.name}</span>
                  </label>
                ))}
              </div>
            )}

            {selectedProductIds.length > 0 && (
              <p style={styles.selectedCount}>
                {selectedProductIds.length} Product
                {selectedProductIds.length === 1
                  ? ""
                  : "s"} selected
              </p>
            )}
          </section>

          {/* =====================
              PUBLISHING
          ====================== */}

          <section style={styles.section}>
            <h2 style={styles.sectionTitle}>
              Publishing
            </h2>

            <label style={styles.label}>
              Status
              <select
                style={styles.input}
                value={status}
                onChange={(event) =>
                  setStatus(
                    event.target.value as ArticleStatus
                  )
                }
              >
                <option value="draft">
                  Draft
                </option>

                <option value="published">
                  Published
                </option>

                <option value="hidden">
                  Hidden
                </option>

                <option value="archived">
                  Archived
                </option>
              </select>
            </label>
          </section>

          {/* =====================
              SAVE
          ====================== */}

          <div style={styles.bottomBar}>
            <button
              type="submit"
              disabled={saving}
              style={{
                ...styles.saveButton,
                opacity: saving ? 0.6 : 1,
              }}
            >
              {saving
                ? "Saving..."
                : "Create Article"}
            </button>

            {message && (
              <span style={styles.message}>
                {message}
              </span>
            )}
          </div>
        </form>
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
    padding: "35px 24px 100px",
  },

  loadingPage: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#faf8f6",
    color: "#888",
  },

  container: {
    maxWidth: "1000px",
    margin: "0 auto",
  },

  back: {
    color: "#777",
    textDecoration: "none",
    fontSize: "13px",
  },

  header: {
    padding: "35px 0 25px",
  },

  eyebrow: {
    color: "#c8647b",
    fontSize: "10px",
    fontWeight: 700,
    letterSpacing: "3px",
    marginBottom: "8px",
  },

  title: {
    fontFamily: "Georgia, serif",
    fontSize: "48px",
    fontWeight: 400,
    margin: 0,
  },

  description: {
    color: "#777",
    marginTop: "10px",
    lineHeight: 1.7,
  },

  form: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "18px",
  },

  section: {
    background: "#fff",
    border: "1px solid #e7e0dc",
    borderRadius: "15px",
    padding: "22px",
  },

  sectionTitle: {
    fontFamily: "Georgia, serif",
    fontSize: "24px",
    fontWeight: 400,
    margin: "0 0 18px",
  },

  label: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "7px",
    fontSize: "13px",
    fontWeight: 600,
    marginBottom: "16px",
  },

  input: {
    width: "100%",
    boxSizing: "border-box" as const,
    padding: "12px 13px",
    border: "1px solid #ded7d3",
    borderRadius: "9px",
    background: "#fff",
    fontSize: "14px",
  },

  helper: {
    color: "#888",
    fontSize: "12px",
    lineHeight: 1.7,
    margin: "7px 0 0",
  },

  coverPreview: {
    marginTop: "18px",
    borderRadius: "12px",
    overflow: "hidden",
    border: "1px solid #e8e1de",
    background: "#faf8f6",
  },

  coverPreviewImage: {
    display: "block",
    width: "100%",
    maxHeight: "420px",
    objectFit: "cover" as const,
  },

  selectionList: {
    display: "grid",
    gridTemplateColumns:
      "repeat(2, minmax(0, 1fr))",
    gap: "8px 18px",
    maxHeight: "360px",
    overflowY: "auto" as const,
    border: "1px solid #eee8e4",
    borderRadius: "10px",
    padding: "12px 14px",
  },

  selectionItem: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "7px 0",
    fontSize: "13px",
    fontWeight: 400,
    cursor: "pointer",
  },

  selectedCount: {
    color: "#c8647b",
    fontSize: "12px",
    fontWeight: 700,
    margin: "10px 0 0",
  },

  empty: {
    color: "#888",
    fontSize: "13px",
    padding: "12px 0",
  },

  bottomBar: {
    display: "flex",
    alignItems: "center",
    gap: "18px",
    flexWrap: "wrap" as const,
  },

  saveButton: {
    border: 0,
    borderRadius: "10px",
    background: "#222",
    color: "#fff",
    padding: "15px 22px",
    fontSize: "14px",
    cursor: "pointer",
  },

  message: {
    color: "#c8647b",
    fontSize: "13px",
  },
};