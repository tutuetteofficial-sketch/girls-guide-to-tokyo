"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

type Product = {
  id: string;
  name: string;
  brand: string | null;
  price: number | null;
  status: string;
  editor_pick: number;
  updated_at: string;
  category_id: number | null;
};

type Category = {
  id: number;
  name: string;
};

type ProductGroup = {
  product_id: string;
  group_id: string;
};

type PlaceGroup = {
  id: string;
  name: string;
};

export default function ProductsAdminPage() {
  const [products, setProducts] =
    useState<Product[]>([]);

  const [categories, setCategories] =
    useState<Category[]>([]);

  const [productGroups, setProductGroups] =
    useState<ProductGroup[]>([]);

  const [placeGroups, setPlaceGroups] =
    useState<PlaceGroup[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [errorMessage, setErrorMessage] =
    useState("");

  const [search, setSearch] =
    useState("");

  const [statusFilter, setStatusFilter] =
    useState("all");

  const [categoryFilter, setCategoryFilter] =
    useState("all");

  const [shopFilter, setShopFilter] =
    useState("all");

  async function loadProducts() {
    setLoading(true);
    setErrorMessage("");

    const [
      productsResult,
      categoriesResult,
      productGroupsResult,
      placeGroupsResult,
    ] = await Promise.all([
      supabase
        .from("products")
        .select(
          "id, name, brand, price, status, editor_pick, updated_at, category_id"
        )
        .order("updated_at", {
          ascending: false,
        }),

      supabase
        .from("product_categories")
        .select("id, name")
        .eq("is_active", true)
        .order("sort_order")
        .order("name"),

      supabase
        .from("product_groups")
        .select(
          "product_id, group_id"
        ),

      supabase
        .from("place_groups")
        .select("id, name")
        .eq("is_active", true)
        .order("name"),
    ]);

    const errors = [
      productsResult.error,
      categoriesResult.error,
      productGroupsResult.error,
      placeGroupsResult.error,
    ].filter(Boolean);

    if (errors.length > 0) {
      setErrorMessage(
        errors[0]!.message
      );
    }

    setProducts(
      (productsResult.data ??
        []) as Product[]
    );

    setCategories(
      (categoriesResult.data ??
        []) as Category[]
    );

    setProductGroups(
      (productGroupsResult.data ??
        []) as ProductGroup[]
    );

    setPlaceGroups(
      (placeGroupsResult.data ??
        []) as PlaceGroup[]
    );

    setLoading(false);
  }

  useEffect(() => {
    loadProducts();
  }, []);

  const categoryMap = useMemo(() => {
    const map: Record<string, string> =
      {};

    categories.forEach((category) => {
      map[String(category.id)] =
        category.name;
    });

    return map;
  }, [categories]);

  const shopMap = useMemo(() => {
    const map: Record<string, string> =
      {};

    placeGroups.forEach((group) => {
      map[group.id] = group.name;
    });

    return map;
  }, [placeGroups]);

  const filteredProducts = useMemo(() => {
    const keyword =
      search.trim().toLowerCase();

    return products.filter(
      (product) => {
        const categoryName =
          product.category_id !== null
            ? categoryMap[
                String(
                  product.category_id
                )
              ] ?? ""
            : "";

        const shops =
          productGroups
            .filter(
              (relation) =>
                relation.product_id ===
                product.id
            )
            .map(
              (relation) =>
                shopMap[
                  relation.group_id
                ] ?? ""
            );

        const matchesSearch =
          !keyword ||
          [
            product.name,
            product.brand ?? "",
            categoryName,
            ...shops,
          ]
            .join(" ")
            .toLowerCase()
            .includes(keyword);

        const matchesStatus =
          statusFilter === "all" ||
          product.status ===
            statusFilter;

        const matchesCategory =
          categoryFilter === "all" ||
          categoryName ===
            categoryFilter;

        const matchesShop =
          shopFilter === "all" ||
          shops.includes(
            shopFilter
          );

        return (
          matchesSearch &&
          matchesStatus &&
          matchesCategory &&
          matchesShop
        );
      }
    );
  }, [
    products,
    categories,
    categoryMap,
    productGroups,
    shopMap,
    search,
    statusFilter,
    categoryFilter,
    shopFilter,
  ]);

  function getShops(
    productId: string
  ) {
    return productGroups
      .filter(
        (relation) =>
          relation.product_id ===
          productId
      )
      .map(
        (relation) =>
          shopMap[
            relation.group_id
          ]
      )
      .filter(Boolean);
  }

  return (
    <main style={styles.main}>
      <div style={styles.container}>
        <header style={styles.header}>
          <Link
            href="/admin"
            style={styles.back}
          >
            ← Dashboard
          </Link>

          <div style={styles.headerRow}>
            <div>
              <p style={styles.eyebrow}>
                CONTENT / PRODUCTS
              </p>

              <h1 style={styles.title}>
                Products
              </h1>

              <p style={styles.description}>
                日本で買える商品を管理します。
              </p>
            </div>

            <Link
              href="/admin/products/new"
              style={styles.addButton}
            >
              + Add Product
            </Link>
          </div>
        </header>

        <section style={styles.filters}>
          <input
            style={styles.search}
            value={search}
            onChange={(e) =>
              setSearch(
                e.target.value
              )
            }
            placeholder="Search products, brands, shops..."
          />

          <select
            style={styles.select}
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(
                e.target.value
              )
            }
          >
            <option value="all">
              All statuses
            </option>
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

          <select
            style={styles.select}
            value={categoryFilter}
            onChange={(e) =>
              setCategoryFilter(
                e.target.value
              )
            }
          >
            <option value="all">
              All categories
            </option>

            {categories.map(
              (category) => (
                <option
                  key={category.id}
                  value={
                    category.name
                  }
                >
                  {category.name}
                </option>
              )
            )}
          </select>

          <select
            style={styles.select}
            value={shopFilter}
            onChange={(e) =>
              setShopFilter(
                e.target.value
              )
            }
          >
            <option value="all">
              All shops
            </option>

            {placeGroups.map(
              (group) => (
                <option
                  key={group.id}
                  value={
                    group.name
                  }
                >
                  {group.name}
                </option>
              )
            )}
          </select>
        </section>

        <div style={styles.resultCount}>
          {loading
            ? "Loading..."
            : `${filteredProducts.length} products`}
        </div>

        {errorMessage && (
          <div style={styles.error}>
            {errorMessage}
          </div>
        )}

        {!loading &&
          !errorMessage && (
            <section style={styles.table}>
              <div style={styles.tableHeader}>
                <span>
                  Product
                </span>

                <span>
                  Brand
                </span>

                <span>
                  Category
                </span>

                <span>
                  Available at
                </span>

                <span>
                  Price
                </span>

                <span>
                  Status
                </span>
              </div>

              {filteredProducts.length ===
              0 ? (
                <div style={styles.empty}>
                  <p>
                    該当するProductがありません。
                  </p>

                  <Link
                    href="/admin/products/new"
                    style={styles.emptyLink}
                  >
                    + Add Product
                  </Link>
                </div>
              ) : (
                filteredProducts.map(
                  (product) => {
                    const shops =
                      getShops(
                        product.id
                      );

                    const categoryName =
                      product.category_id !==
                      null
                        ? categoryMap[
                            String(
                              product.category_id
                            )
                          ] ?? "—"
                        : "—";

                    return (
                      <Link
                        key={
                          product.id
                        }
                        href={`/admin/products/${product.id}`}
                        style={styles.row}
                      >
                        <div
                          style={
                            styles.productCell
                          }
                        >
                          <strong>
                            {
                              product.name
                            }
                          </strong>

                          {product.editor_pick >
                            0 && (
                            <span
                              style={
                                styles.pick
                              }
                            >
                              {"★".repeat(
                                product.editor_pick
                              )}
                            </span>
                          )}
                        </div>

                        <span>
                          {
                            product.brand ??
                            "—"
                          }
                        </span>

                        <span>
                          {
                            categoryName
                          }
                        </span>

                        <div
                          style={
                            styles.shopCell
                          }
                        >
                          {shops.length ===
                          0 ? (
                            <span
                              style={
                                styles.muted
                              }
                            >
                              —
                            </span>
                          ) : (
                            shops
                              .slice(
                                0,
                                3
                              )
                              .map(
                                (
                                  shop
                                ) => (
                                  <span
                                    key={
                                      shop
                                    }
                                  >
                                    {
                                      shop
                                    }
                                  </span>
                                )
                              )
                          )}

                          {shops.length >
                            3 && (
                            <span
                              style={
                                styles.more
                              }
                            >
                              +
                              {shops.length -
                                3}{" "}
                              more
                            </span>
                          )}
                        </div>

                        <span
                          style={
                            styles.price
                          }
                        >
                          {product.price !==
                          null
                            ? `¥${product.price.toLocaleString()}`
                            : "—"}
                        </span>

                        <StatusBadge
                          status={
                            product.status
                          }
                        />
                      </Link>
                    );
                  }
                )
              )}
            </section>
          )}
      </div>
    </main>
  );
}

function StatusBadge({
  status,
}: {
  status: string;
}) {
  const labels: Record<
    string,
    string
  > = {
    draft: "Draft",
    published: "Published",
    hidden: "Hidden",
    archived: "Archived",
  };

  return (
    <span style={styles.status}>
      {labels[status] ?? status}
    </span>
  );
}

const styles = {
  main: {
    minHeight: "100vh",
    background: "#faf8f6",
    color: "#222",
    padding:
      "40px 24px 90px",
  },

  container: {
    maxWidth: "1250px",
    margin: "0 auto",
  },

  header: {
    marginBottom: "28px",
  },

  back: {
    color: "#777",
    textDecoration:
      "none",
    fontSize: "13px",
  },

  headerRow: {
    marginTop: "30px",
    display: "flex",
    justifyContent:
      "space-between",
    alignItems:
      "flex-end",
    gap: "20px",
  },

  eyebrow: {
    color: "#c8647b",
    fontSize: "10px",
    fontWeight: 700,
    letterSpacing:
      "3px",
    marginBottom:
      "8px",
  },

  title: {
    fontFamily:
      "Georgia, serif",
    fontSize: "48px",
    fontWeight: 400,
    margin: 0,
  },

  description: {
    color: "#777",
    marginTop:
      "10px",
  },

  addButton: {
    background: "#222",
    color: "#fff",
    textDecoration:
      "none",
    padding:
      "13px 17px",
    borderRadius:
      "10px",
    fontSize: "12px",
    whiteSpace:
      "nowrap" as const,
  },

  filters: {
    display: "grid",
    gridTemplateColumns:
      "1fr 170px 190px 180px",
    gap: "10px",
    marginBottom:
      "14px",
  },

  search: {
    width: "100%",
    boxSizing:
      "border-box" as const,
    padding:
      "13px 14px",
    border:
      "1px solid #ded7d3",
    borderRadius:
      "10px",
    background:
      "#fff",
    fontSize:
      "13px",
    outline:
      "none",
  },

  select: {
    width: "100%",
    boxSizing:
      "border-box" as const,
    padding:
      "13px 14px",
    border:
      "1px solid #ded7d3",
    borderRadius:
      "10px",
    background:
      "#fff",
    fontSize:
      "13px",
  },

  resultCount: {
    color: "#888",
    fontSize: "12px",
    margin:
      "12px 2px",
  },

  error: {
    background:
      "#fff0f0",
    border:
      "1px solid #eccaca",
    color: "#a44",
    borderRadius:
      "12px",
    padding:
      "15px",
  },

  table: {
    background:
      "#fff",
    border:
      "1px solid #e7e0dc",
    borderRadius:
      "15px",
    overflow:
      "hidden",
  },

  tableHeader: {
    display: "grid",
    gridTemplateColumns:
      "2fr 1fr 1.1fr 1.7fr 120px 100px",
    gap: "12px",
    padding:
      "13px 18px",
    background:
      "#f6f2ef",
    color: "#888",
    fontSize:
      "10px",
    textTransform:
      "uppercase" as const,
    letterSpacing:
      "1px",
  },

  row: {
    display: "grid",
    gridTemplateColumns:
      "2fr 1fr 1.1fr 1.7fr 120px 100px",
    gap: "12px",
    padding:
      "17px 18px",
    borderTop:
      "1px solid #eee8e4",
    alignItems:
      "center",
    textDecoration:
      "none",
    color: "#222",
    fontSize:
      "13px",
  },

  productCell: {
    display: "flex",
    flexDirection:
      "column" as const,
    gap:
      "5px",
  },

  pick: {
    color:
      "#c8647b",
    fontSize:
      "10px",
  },

  shopCell: {
    display: "flex",
    flexDirection:
      "column" as const,
    gap:
      "3px",
    fontSize:
      "12px",
  },

  muted: {
    color:
      "#aaa",
  },

  more: {
    color:
      "#999",
    fontSize:
      "10px",
  },

  price: {
    fontSize:
      "12px",
  },

  status: {
    width:
      "fit-content",
    padding:
      "5px 8px",
    borderRadius:
      "999px",
    background:
      "#f3eeeb",
    color:
      "#666",
    fontSize:
      "10px",
  },

  empty: {
    textAlign:
      "center" as const,
    padding:
      "60px 20px",
    color:
      "#888",
  },

  emptyLink: {
    display:
      "inline-block",
    marginTop:
      "10px",
    color:
      "#222",
    fontSize:
      "12px",
  },
};