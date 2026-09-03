"use client";

import Link from "next/link";
import Header from "@/components/Header";
import { useEffect, useMemo, useState } from "react";
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
  parent_id: number | null;
};

export default function ProductsPage() {
  const [products, setProducts] =
    useState<Product[]>([]);

  const [categories, setCategories] =
    useState<ProductCategory[]>([]);

  const [categoryId, setCategoryId] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const [errorMessage, setErrorMessage] =
    useState("");

  useEffect(() => {
    async function load() {
      setLoading(true);
      setErrorMessage("");

      const [
        productsResult,
        categoriesResult,
      ] = await Promise.all([
        supabase
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
          .eq("status", "published")
          .order("name"),

        supabase
          .from("product_categories")
          .select(`
            id,
            name,
            parent_id
          `)
          .eq("is_active", true)
          .order("sort_order")
          .order("name"),
      ]);

      const firstError =
        productsResult.error ||
        categoriesResult.error;

      if (firstError) {
        setErrorMessage(
          firstError.message
        );

        setLoading(false);
        return;
      }

      setProducts(
        (productsResult.data ?? []) as Product[]
      );

      setCategories(
        (
          categoriesResult.data ?? []
        ) as ProductCategory[]
      );

      setLoading(false);
    }

    load();
  }, []);

  const categoryMap = useMemo(() => {
    return new Map<number, ProductCategory>(
      categories.map((category) => [
        category.id,
        category,
      ])
    );
  }, [categories]);

  const filteredProducts = useMemo(() => {
    if (!categoryId) {
      return products;
    }

    return products.filter(
      (product) =>
        product.category_id ===
        Number(categoryId)
    );
  }, [products, categoryId]);

  const hasFilter = Boolean(categoryId);

  function clearFilter() {
    setCategoryId("");
  }

  return (
    <main style={styles.main}>
      <Header />

      <div style={styles.container}>
        <header style={styles.header}>
          <p style={styles.eyebrow}>
            WHAT TO BUY
          </p>

          <h1 style={styles.title}>
            Products
          </h1>

          <p style={styles.description}>
            Things worth discovering and
            bringing home from Japan.
          </p>
        </header>

        <section style={styles.filterSection}>
          <div style={styles.filterHeader}>
            <div>
              <p style={styles.filterEyebrow}>
                EXPLORE
              </p>

              <h2 style={styles.filterTitle}>
                Find something you love
              </h2>
            </div>

            {hasFilter && (
              <button
                type="button"
                onClick={clearFilter}
                style={styles.clearButton}
              >
                Clear
              </button>
            )}
          </div>

          <label style={styles.filterLabel}>
            <span style={styles.labelText}>
              Category
            </span>

            <select
              value={categoryId}
              onChange={(event) =>
                setCategoryId(
                  event.target.value
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
        </section>

        <section style={styles.resultsSection}>
          <div style={styles.resultsHeader}>
            <div>
              <p style={styles.resultsEyebrow}>
                PRODUCTS
              </p>

              <h2 style={styles.resultsTitle}>
                {hasFilter
                  ? categoryMap.get(
                      Number(categoryId)
                    )?.name ??
                    "Selected products"
                  : "All products"}
              </h2>
            </div>

            <span style={styles.resultCount}>
              {loading
                ? "—"
                : `${filteredProducts.length} products`}
            </span>
          </div>

          {errorMessage && (
            <div style={styles.error}>
              {errorMessage}
            </div>
          )}

          {loading ? (
            <div style={styles.loading}>
              Loading products...
            </div>
          ) : filteredProducts.length === 0 ? (
            <div style={styles.empty}>
              <p style={styles.emptyTitle}>
                No products found.
              </p>

              <p style={styles.emptyText}>
                Try another category.
              </p>
            </div>
          ) : (
            <div
              className="products-grid"
              style={styles.grid}
            >
              {filteredProducts.map(
                (product) => {
                  const category =
                    product.category_id !== null
                      ? categoryMap.get(
                          product.category_id
                        )
                      : null;

                  return (
                    <Link
                      key={product.id}
                      href={`/products/${product.id}`}
                      style={styles.card}
                    >
                      <div style={styles.image}>
                        {product.image_url ? (
                          <img
                            src={
                              product.image_url
                            }
                            alt={product.name}
                            style={
                              styles.imageElement
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
                        style={styles.cardBody}
                      >
                        {product.brand && (
                          <p
                            style={styles.brand}
                          >
                            {product.brand}
                          </p>
                        )}

                        {category && (
                          <p
                            style={
                              styles.category
                            }
                          >
                            {category.name}
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
                              styles.descriptionSmall
                            }
                          >
                            {
                              product.description
                            }
                          </p>
                        )}

                        {(product.editor_pick ??
                          0) > 0 && (
                          <div
                            style={styles.pick}
                          >
                            {"★".repeat(
                              product.editor_pick ??
                                0
                            )}

                            {"☆".repeat(
                              Math.max(
                                0,
                                5 -
                                  (
                                    product.editor_pick ??
                                    0
                                  )
                              )
                            )}
                          </div>
                        )}
                      </div>
                    </Link>
                  );
                }
              )}
            </div>
          )}
        </section>
      </div>

      <style jsx global>{`
        @media (max-width: 900px) {
          .products-grid {
            grid-template-columns:
              repeat(3, minmax(0, 1fr)) !important;
          }
        }

        @media (max-width: 700px) {
          .products-grid {
            grid-template-columns:
              repeat(2, minmax(0, 1fr)) !important;
          }
        }

        @media (max-width: 480px) {
          .products-grid {
            grid-template-columns:
              1fr !important;
          }
        }
      `}</style>
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
    maxWidth: "1150px",
    margin: "0 auto",
    padding: "0 24px 100px",
  },

  header: {
    padding: "45px 0 42px",
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
    fontSize: "52px",
    fontWeight: 400,
    margin: "9px 0 0",
  },

  description: {
    color: "#777",
    fontSize: "14px",
    lineHeight: 1.7,
    marginTop: "13px",
    marginBottom: 0,
  },

  filterSection: {
    background: "#fff",
    border: "1px solid #e7e0dc",
    borderRadius: "18px",
    padding: "22px",
    marginBottom: "55px",
  },

  filterHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "20px",
    marginBottom: "20px",
  },

  filterEyebrow: {
    margin: 0,
    color: "#c8647b",
    fontSize: "9px",
    fontWeight: 700,
    letterSpacing: "2px",
  },

  filterTitle: {
    margin: "6px 0 0",
    fontFamily: "Georgia, serif",
    fontSize: "24px",
    fontWeight: 400,
  },

  clearButton: {
    border: 0,
    background: "transparent",
    color: "#c8647b",
    fontSize: "11px",
    fontWeight: 700,
    cursor: "pointer",
    padding: "5px 0",
  },

  filterLabel: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "8px",
    maxWidth: "360px",
  },

  labelText: {
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
    border: "1px solid #ddd5d0",
    borderRadius: "10px",
    background: "#fff",
    color: "#333",
    fontSize: "12px",
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
      "repeat(4, minmax(0, 1fr))",
    gap: "22px",
  },

  card: {
    color: "#222",
    textDecoration: "none",
    minWidth: 0,
  },

  image: {
    position: "relative" as const,
    aspectRatio: "1 / 1",
    background: "#f2e7e2",
    borderRadius: "14px",
    overflow: "hidden",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#987a73",
    fontFamily: "Georgia, serif",
    fontSize: "10px",
    letterSpacing: "2px",
  },

  imageElement: {
    width: "100%",
    height: "100%",
    objectFit: "cover" as const,
    display: "block",
  },

  pickBadge: {
    position: "absolute" as const,
    right: "10px",
    top: "10px",
    background: "#222",
    color: "#fff",
    padding: "6px 8px",
    borderRadius: "999px",
    fontSize: "8px",
    letterSpacing: "1px",
  },

  cardBody: {
    paddingTop: "12px",
  },

  brand: {
    color: "#c8647b",
    fontSize: "9px",
    fontWeight: 700,
    letterSpacing: "0.5px",
    margin: 0,
  },

  category: {
    color: "#999",
    fontSize: "9px",
    margin: "4px 0 0",
  },

  productName: {
    fontFamily: "Georgia, serif",
    fontSize: "20px",
    lineHeight: 1.2,
    fontWeight: 400,
    margin: "5px 0 0",
  },

  descriptionSmall: {
    color: "#777",
    fontSize: "11px",
    lineHeight: 1.6,
    marginTop: "7px",
  },

  pick: {
    color: "#c8647b",
    fontSize: "10px",
    marginTop: "7px",
  },

  loading: {
    padding: "70px 20px",
    textAlign: "center" as const,
    color: "#999",
    fontSize: "13px",
  },

  empty: {
    padding: "70px 20px",
    textAlign: "center" as const,
    background: "#fff",
    border: "1px solid #e7e0dc",
    borderRadius: "16px",
  },

  emptyTitle: {
    margin: 0,
    fontFamily: "Georgia, serif",
    fontSize: "22px",
    fontWeight: 400,
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
    border: "1px solid #edcaca",
    borderRadius: "12px",
    color: "#a44",
    fontSize: "12px",
  },
} as const;