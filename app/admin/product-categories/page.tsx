"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

type Category = {
  id: number;
  site_id: string;
  name: string;
  parent_id: number | null;
  sort_order: number;
  is_active: boolean;
};

type CategoryNode = Category & {
  children: CategoryNode[];
};

export default function ProductCategoriesAdminPage() {
  const [categories, setCategories] =
    useState<Category[]>([]);

  const [name, setName] = useState("");
  const [parentId, setParentId] = useState("");
  const [sortOrder, setSortOrder] = useState("0");

  const [editingId, setEditingId] =
    useState<number | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  async function getSiteId() {
    const { data, error } = await supabase
      .from("sites")
      .select("id")
      .eq("slug", "tokyo-guide")
      .single();

    if (error || !data) {
      throw new Error(
        `サイト情報を取得できませんでした: ${
          error?.message ?? "Unknown error"
        }`
      );
    }

    return data.id;
  }

  async function loadCategories() {
    setLoading(true);
    setMessage("");

    const { data, error } = await supabase
      .from("product_categories")
      .select(
        "id, site_id, name, parent_id, sort_order, is_active"
      )
      .order("sort_order")
      .order("name");

    if (error) {
      setCategories([]);
      setMessage(
        `カテゴリの読み込みに失敗しました: ${error.message}`
      );
      setLoading(false);
      return;
    }

    setCategories(
      (data ?? []) as Category[]
    );

    setLoading(false);
  }

  useEffect(() => {
    loadCategories();
  }, []);

  const categoryTree = useMemo(() => {
    const nodes =
      new Map<number, CategoryNode>();

    categories.forEach((category) => {
      nodes.set(category.id, {
        ...category,
        children: [],
      });
    });

    const roots: CategoryNode[] = [];

    categories.forEach((category) => {
      const node = nodes.get(category.id);

      if (!node) return;

      if (
        category.parent_id !== null &&
        nodes.has(category.parent_id)
      ) {
        nodes
          .get(category.parent_id)!
          .children.push(node);
      } else {
        roots.push(node);
      }
    });

    return roots;
  }, [categories]);

  function flattenForParentSelect(
    nodes: CategoryNode[],
    level = 0,
    excludeId: number | null = null
  ): { id: number; name: string }[] {
    return nodes.flatMap((node) => {
      if (node.id === excludeId) {
        return [];
      }

      return [
        {
          id: node.id,
          name:
            "　".repeat(level) +
            node.name,
        },
        ...flattenForParentSelect(
          node.children,
          level + 1,
          excludeId
        ),
      ];
    });
  }

  const parentOptions =
    flattenForParentSelect(
      categoryTree,
      0,
      editingId
    );

  function resetForm() {
    setEditingId(null);
    setName("");
    setParentId("");
    setSortOrder("0");
  }

  function startEdit(category: Category) {
    setEditingId(category.id);
    setName(category.name);
    setParentId(
      category.parent_id !== null
        ? String(category.parent_id)
        : ""
    );
    setSortOrder(
      String(category.sort_order)
    );

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  async function saveCategory(
    e: React.FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    const trimmedName = name.trim();

    if (!trimmedName) {
      setMessage(
        "カテゴリ名を入力してください。"
      );
      return;
    }

    setSaving(true);
    setMessage("保存中...");

    try {
      const siteId = await getSiteId();

      const payload = {
        name: trimmedName,
        parent_id: parentId
          ? Number(parentId)
          : null,
        sort_order:
          Number(sortOrder) || 0,
        is_active: true,
      };

      if (editingId !== null) {
        const { error } = await supabase
          .from("product_categories")
          .update(payload)
          .eq("id", editingId)
          .eq("site_id", siteId);

        if (error) {
          throw new Error(error.message);
        }

        setMessage(
          "Productカテゴリを更新しました。"
        );
      } else {
        const { error } = await supabase
          .from("product_categories")
          .insert({
            ...payload,
            site_id: siteId,
          });

        if (error) {
          throw new Error(error.message);
        }

        setMessage(
          "Productカテゴリを追加しました。"
        );
      }

      resetForm();
      await loadCategories();
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

  async function toggleActive(
    category: Category
  ) {
    const { error } = await supabase
      .from("product_categories")
      .update({
        is_active:
          !category.is_active,
      })
      .eq("id", category.id);

    if (error) {
      setMessage(
        `変更に失敗しました: ${error.message}`
      );
      return;
    }

    await loadCategories();
  }

  async function deleteCategory(
    category: Category
  ) {
    const { count, error: countError } =
      await supabase
        .from("products")
        .select("id", {
          count: "exact",
          head: true,
        })
        .eq(
          "category_id",
          category.id
        );

    if (countError) {
      setMessage(
        `使用状況を確認できませんでした: ${countError.message}`
      );
      return;
    }

    const childCount =
      categories.filter(
        (item) =>
          item.parent_id ===
          category.id
      ).length;

    if ((count ?? 0) > 0) {
      setMessage(
        `「${category.name}」は${count}件のProductで使用中です。削除せずHideを使ってください。`
      );
      return;
    }

    if (childCount > 0) {
      setMessage(
        `「${category.name}」には子カテゴリがあります。先に子カテゴリを移動または削除してください。`
      );
      return;
    }

    const confirmed =
      window.confirm(
        `「${category.name}」を削除しますか？`
      );

    if (!confirmed) return;

    const { error } = await supabase
      .from("product_categories")
      .delete()
      .eq("id", category.id);

    if (error) {
      setMessage(
        `削除に失敗しました: ${error.message}`
      );
      return;
    }

    setMessage(
      "Productカテゴリを削除しました。"
    );

    await loadCategories();
  }

  function renderCategory(
    category: CategoryNode,
    level = 0
  ): React.ReactNode {
    return (
      <div key={category.id}>
        <div
          style={{
            ...styles.categoryRow,
            marginLeft:
              `${level * 22}px`,
          }}
        >
          <div style={styles.categoryInfo}>
            <div
              style={
                styles.categoryNameRow
              }
            >
              <strong>
                {category.name}
              </strong>

              {!category.is_active && (
                <span
                  style={
                    styles.hiddenBadge
                  }
                >
                  Hidden
                </span>
              )}
            </div>

            <span
              style={styles.meta}
            >
              Sort {category.sort_order}
            </span>
          </div>

          <div style={styles.actions}>
            <button
              type="button"
              style={
                styles.smallButton
              }
              onClick={() =>
                startEdit(category)
              }
            >
              Edit
            </button>

            <button
              type="button"
              style={
                styles.smallButton
              }
              onClick={() =>
                toggleActive(
                  category
                )
              }
            >
              {category.is_active
                ? "Hide"
                : "Show"}
            </button>

            <button
              type="button"
              style={
                styles.deleteButton
              }
              onClick={() =>
                deleteCategory(
                  category
                )
              }
            >
              Delete
            </button>
          </div>
        </div>

        {category.children.map(
          (child) =>
            renderCategory(
              child,
              level + 1
            )
        )}
      </div>
    );
  }

  return (
    <main style={styles.main}>
      <div style={styles.container}>
        <Link
          href="/admin"
          style={styles.back}
        >
          ← Dashboard
        </Link>

        <header style={styles.header}>
          <p
            style={
              styles.eyebrow
            }
          >
            STRUCTURE / PRODUCT CATEGORIES
          </p>

          <h1
            style={
              styles.title
            }
          >
            Product Categories
          </h1>

          <p
            style={
              styles.description
            }
          >
            Shopping商品のジャンルと階層を管理します。
          </p>
        </header>

        <section
          style={
            styles.section
          }
        >
          <h2
            style={
              styles.sectionTitle
            }
          >
            {editingId !== null
              ? "Edit Category"
              : "Add Category"}
          </h2>

          <form
            onSubmit={
              saveCategory
            }
            style={
              styles.form
            }
          >
            <label
              style={
                styles.label
              }
            >
              Category name *

              <input
                style={
                  styles.input
                }
                value={name}
                onChange={(e) =>
                  setName(
                    e.target
                      .value
                  )
                }
                placeholder="Women's Clothing"
              />
            </label>

            <label
              style={
                styles.label
              }
            >
              Parent Category

              <select
                style={
                  styles.input
                }
                value={
                  parentId
                }
                onChange={(e) =>
                  setParentId(
                    e.target
                      .value
                  )
                }
              >
                <option value="">
                  No parent
                </option>

                {parentOptions.map(
                  (category) => (
                    <option
                      key={
                        category.id
                      }
                      value={
                        category.id
                      }
                    >
                      {
                        category.name
                      }
                    </option>
                  )
                )}
              </select>
            </label>

            <label
              style={
                styles.label
              }
            >
              Sort order

              <input
                style={
                  styles.input
                }
                type="number"
                value={
                  sortOrder
                }
                onChange={(e) =>
                  setSortOrder(
                    e.target
                      .value
                  )
                }
              />
            </label>

            <div
              style={
                styles.buttons
              }
            >
              <button
                type="submit"
                disabled={
                  saving
                }
                style={
                  styles.primary
                }
              >
                {saving
                  ? "Saving..."
                  : editingId !==
                    null
                  ? "Save Changes"
                  : "Add Category"}
              </button>

              {editingId !==
                null && (
                <button
                  type="button"
                  style={
                    styles.secondary
                  }
                  onClick={
                    resetForm
                  }
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </section>

        {message && (
          <div
            style={
              styles.message
            }
          >
            {message}
          </div>
        )}

        <section
          style={
            styles.section
          }
        >
          <h2
            style={
              styles.sectionTitle
            }
          >
            Categories
          </h2>

          {loading ? (
            <p
              style={
                styles.muted
              }
            >
              Loading...
            </p>
          ) : categoryTree.length ===
            0 ? (
            <p
              style={
                styles.muted
              }
            >
              Productカテゴリがありません。
            </p>
          ) : (
            <div
              style={
                styles.categoryList
              }
            >
              {categoryTree.map(
                (category) =>
                  renderCategory(
                    category
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
    background: "#faf8f6",
    color: "#222",
    padding:
      "40px 24px 90px",
  },

  container: {
    maxWidth: "1000px",
    margin: "0 auto",
  },

  back: {
    color: "#777",
    textDecoration:
      "none",
    fontSize: "13px",
  },

  header: {
    padding:
      "35px 0 28px",
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
    lineHeight: 1.7,
    marginTop:
      "10px",
  },

  section: {
    background: "#fff",
    border:
      "1px solid #e7e0dc",
    borderRadius:
      "15px",
    padding: "22px",
    marginBottom:
      "18px",
  },

  sectionTitle: {
    fontFamily:
      "Georgia, serif",
    fontSize: "24px",
    fontWeight: 400,
    margin: 0,
  },

  form: {
    display: "flex",
    flexDirection:
      "column" as const,
    gap: "14px",
    marginTop:
      "20px",
  },

  label: {
    display: "flex",
    flexDirection:
      "column" as const,
    gap: "7px",
    fontSize: "13px",
    fontWeight: 600,
  },

  input: {
    width: "100%",
    boxSizing:
      "border-box" as const,
    padding:
      "12px 13px",
    border:
      "1px solid #ddd6d2",
    borderRadius:
      "9px",
    background: "#fff",
    fontSize: "14px",
  },

  buttons: {
    display: "flex",
    gap: "8px",
  },

  primary: {
    border: 0,
    borderRadius:
      "9px",
    background:
      "#222",
    color: "#fff",
    padding:
      "12px 16px",
    cursor:
      "pointer",
    fontSize:
      "13px",
  },

  secondary: {
    border:
      "1px solid #ddd6d2",
    borderRadius:
      "9px",
    background:
      "#fff",
    padding:
      "12px 16px",
    cursor:
      "pointer",
    fontSize:
      "13px",
  },

  message: {
    background:
      "#fff3f5",
    color:
      "#c8647b",
    borderRadius:
      "10px",
    padding:
      "13px 15px",
    marginBottom:
      "18px",
    fontSize:
      "12px",
  },

  categoryList: {
    borderTop:
      "1px solid #eee8e4",
    marginTop:
      "18px",
  },

  categoryRow: {
    display: "flex",
    justifyContent:
      "space-between",
    alignItems:
      "center",
    gap: "15px",
    padding:
      "13px 0",
    borderBottom:
      "1px solid #eee8e4",
  },

  categoryInfo: {
    display: "flex",
    flexDirection:
      "column" as const,
    gap: "4px",
  },

  categoryNameRow: {
    display: "flex",
    alignItems:
      "center",
    gap: "8px",
  },

  meta: {
    color: "#999",
    fontSize:
      "10px",
  },

  hiddenBadge: {
    border:
      "1px solid #ddd",
    borderRadius:
      "999px",
    padding:
      "3px 7px",
    color:
      "#999",
    fontSize:
      "10px",
  },

  actions: {
    display: "flex",
    gap: "6px",
  },

  smallButton: {
    border:
      "1px solid #ddd6d2",
    background:
      "#fff",
    borderRadius:
      "7px",
    padding:
      "6px 9px",
    fontSize:
      "11px",
    cursor:
      "pointer",
  },

  deleteButton: {
    border:
      "1px solid #e4cccc",
    background:
      "#fff",
    color:
      "#a44",
    borderRadius:
      "7px",
    padding:
      "6px 9px",
    fontSize:
      "11px",
    cursor:
      "pointer",
  },

  muted: {
    color: "#888",
    fontSize:
      "13px",
    marginTop:
      "18px",
  },
};