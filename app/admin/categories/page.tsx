"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

type CategoryKind = "place" | "product" | "food";

type Category = {
  id: number;
  name: string;
  slug: string;
  parent_id: number | null;
  description: string | null;
  is_active: boolean;
  sort_order: number;
};

type TreeNode = Category & {
  children: TreeNode[];
};

const KIND_CONFIG: Record<
  CategoryKind,
  {
    label: string;
    table: string;
    description: string;
  }
> = {
  place: {
    label: "Place Categories",
    table: "place_categories",
    description:
      "店舗・ホテル・観光・体験など、Placeを分類します。",
  },
  product: {
    label: "Product Categories",
    table: "product_categories",
    description:
      "日本の商品を分類します。",
  },
  food: {
    label: "Food Categories",
    table: "food_categories",
    description:
      "食べ物・メニューを分類します。",
  },
};

export default function CategoriesAdminPage() {
  const [kind, setKind] = useState<CategoryKind>("place");

  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [parentId, setParentId] = useState("");
  const [description, setDescription] = useState("");
  const [sortOrder, setSortOrder] = useState("0");

  const [editingId, setEditingId] = useState<number | null>(null);

  async function loadCategories(
    selectedKind = kind
  ) {
    setLoading(true);
    setMessage("");

    const table = KIND_CONFIG[selectedKind].table;

    const { data, error } = await supabase
      .from(table)
      .select(`
        id,
        name,
        slug,
        parent_id,
        description,
        is_active,
        sort_order
      `)
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true });

    if (error) {
      setCategories([]);
      setMessage(
        `読み込みに失敗しました: ${error.message}`
      );
      setLoading(false);
      return;
    }

    setCategories((data ?? []) as Category[]);
    setLoading(false);
  }

  useEffect(() => {
    loadCategories(kind);
  }, [kind]);

  function makeSlug(value: string) {
    return value
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "");
  }

  function handleNameChange(value: string) {
    setName(value);

    if (!editingId) {
      setSlug(makeSlug(value));
    }
  }

  function resetForm() {
    setEditingId(null);
    setName("");
    setSlug("");
    setParentId("");
    setDescription("");
    setSortOrder("0");
  }

  function startEdit(category: Category) {
    setEditingId(category.id);
    setName(category.name);
    setSlug(category.slug);
    setParentId(
      category.parent_id !== null
        ? String(category.parent_id)
        : ""
    );
    setDescription(category.description ?? "");
    setSortOrder(String(category.sort_order));

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  function hasDescendant(
    categoryId: number,
    possibleParentId: number
  ) {
    let currentId: number | null = possibleParentId;

    while (currentId !== null) {
      const current = categories.find(
        (category) => category.id === currentId
      );

      if (!current) {
        return false;
      }

      if (current.parent_id === categoryId) {
        return true;
      }

      currentId = current.parent_id;
    }

    return false;
  }

  async function saveCategory(
    e: React.FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    if (!name.trim()) {
      setMessage("カテゴリー名を入力してください。");
      return;
    }

    if (!slug.trim()) {
      setMessage("Slugを入力してください。");
      return;
    }

    if (
      editingId &&
      parentId &&
      (
        Number(parentId) === editingId ||
        hasDescendant(
          editingId,
          Number(parentId)
        )
      )
    ) {
      setMessage(
        "自分自身または自分の子カテゴリーを親にはできません。"
      );
      return;
    }

    setMessage("保存中...");

    const payload = {
      name: name.trim(),
      slug: slug.trim(),
      parent_id: parentId
        ? Number(parentId)
        : null,
      description:
        description.trim() || null,
      sort_order:
        Number(sortOrder) || 0,
      is_active: true,
    };

    const table = KIND_CONFIG[kind].table;

    if (editingId) {
      const { error } = await supabase
        .from(table)
        .update(payload)
        .eq("id", editingId);

      if (error) {
        setMessage(
          `更新に失敗しました: ${error.message}`
        );
        return;
      }

      setMessage("カテゴリーを更新しました。");
    } else {
      const { data: site, error: siteError } =
        await supabase
          .from("sites")
          .select("id")
          .eq("slug", "tokyo-guide")
          .single();

      if (siteError || !site) {
        setMessage(
          `サイト情報を取得できませんでした: ${
            siteError?.message ?? "Unknown error"
          }`
        );
        return;
      }

      const { error } = await supabase
        .from(table)
        .insert({
          ...payload,
          site_id: site.id,
        });

      if (error) {
        setMessage(
          `追加に失敗しました: ${error.message}`
        );
        return;
      }

      setMessage("カテゴリーを追加しました。");
    }

    resetForm();
    await loadCategories(kind);
  }

  async function toggleActive(
    category: Category
  ) {
    const table = KIND_CONFIG[kind].table;

    const { error } = await supabase
      .from(table)
      .update({
        is_active: !category.is_active,
      })
      .eq("id", category.id);

    if (error) {
      setMessage(
        `変更に失敗しました: ${error.message}`
      );
      return;
    }

    await loadCategories(kind);
  }

  async function deleteCategory(
    category: Category
  ) {
    const hasChildren = categories.some(
      (item) =>
        item.parent_id === category.id
    );

    if (hasChildren) {
      setMessage(
        "子カテゴリーがあります。先に子カテゴリーを移動または削除してください。"
      );
      return;
    }

    const confirmed = window.confirm(
      `「${category.name}」を削除しますか？`
    );

    if (!confirmed) {
      return;
    }

    const table = KIND_CONFIG[kind].table;

    const { error } = await supabase
      .from(table)
      .delete()
      .eq("id", category.id);

    if (error) {
      setMessage(
        `削除に失敗しました: ${error.message}`
      );
      return;
    }

    setMessage("カテゴリーを削除しました。");
    await loadCategories(kind);
  }

  const roots = useMemo(() => {
    const nodeMap = new Map<
      number,
      TreeNode
    >();

    categories.forEach((category) => {
      nodeMap.set(category.id, {
        ...category,
        children: [],
      });
    });

    const rootNodes: TreeNode[] = [];

    categories.forEach((category) => {
      const node = nodeMap.get(category.id);

      if (!node) {
        return;
      }

      if (
        category.parent_id !== null &&
        nodeMap.has(category.parent_id)
      ) {
        nodeMap
          .get(category.parent_id)!
          .children.push(node);
      } else {
        rootNodes.push(node);
      }
    });

    return rootNodes;
  }, [categories]);

  function renderTree(
    node: TreeNode,
    level = 0
  ): React.ReactNode {
    return (
      <div key={node.id}>
        <div
          style={{
            ...styles.categoryRow,
            marginLeft: `${level * 28}px`,
          }}
        >
          <div style={styles.categoryInfo}>
            <div>
              <div style={styles.categoryName}>
                {node.name}
              </div>

              <div style={styles.slug}>
                /{node.slug}
              </div>
            </div>

            {!node.is_active && (
              <span style={styles.inactive}>
                Hidden
              </span>
            )}
          </div>

          <div style={styles.actions}>
            <button
              type="button"
              style={styles.smallButton}
              onClick={() =>
                startEdit(node)
              }
            >
              Edit
            </button>

            <button
              type="button"
              style={styles.smallButton}
              onClick={() =>
                toggleActive(node)
              }
            >
              {node.is_active
                ? "Hide"
                : "Show"}
            </button>

            <button
              type="button"
              style={styles.deleteButton}
              onClick={() =>
                deleteCategory(node)
              }
            >
              Delete
            </button>
          </div>
        </div>

        {node.children.map((child) =>
          renderTree(child, level + 1)
        )}
      </div>
    );
  }

  const config = KIND_CONFIG[kind];

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
          <p style={styles.eyebrow}>
            STRUCTURE / CATEGORIES
          </p>

          <h1 style={styles.title}>
            Categories
          </h1>

          <p style={styles.description}>
            {config.description}
          </p>
        </header>

        {/* ======================
            CATEGORY TYPE
        ======================= */}

        <div style={styles.tabs}>
          <button
            type="button"
            onClick={() => {
              setKind("place");
              resetForm();
            }}
            style={{
              ...styles.tab,
              ...(kind === "place"
                ? styles.tabActive
                : {}),
            }}
          >
            Places
          </button>

          <button
            type="button"
            onClick={() => {
              setKind("product");
              resetForm();
            }}
            style={{
              ...styles.tab,
              ...(kind === "product"
                ? styles.tabActive
                : {}),
            }}
          >
            Products
          </button>

          <button
            type="button"
            onClick={() => {
              setKind("food");
              resetForm();
            }}
            style={{
              ...styles.tab,
              ...(kind === "food"
                ? styles.tabActive
                : {}),
            }}
          >
            Foods
          </button>
        </div>

        {/* ======================
            ADD / EDIT
        ======================= */}

        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>
            {editingId
              ? "Edit Category"
              : "Add Category"}
          </h2>

          <form
            onSubmit={saveCategory}
            style={styles.form}
          >
            <label style={styles.label}>
              Category name *
              <input
                style={styles.input}
                value={name}
                onChange={(e) =>
                  handleNameChange(
                    e.target.value
                  )
                }
                placeholder="Fashion"
              />
            </label>

            <label style={styles.label}>
              Parent category
              <select
                style={styles.input}
                value={parentId}
                onChange={(e) =>
                  setParentId(e.target.value)
                }
              >
                <option value="">
                  Top level
                </option>

                {categories
                  .filter(
                    (category) =>
                      category.id !== editingId
                  )
                  .map((category) => (
                    <option
                      key={category.id}
                      value={category.id}
                    >
                      {category.name}
                    </option>
                  ))}
              </select>
            </label>

            <label style={styles.label}>
              Slug
              <input
                style={styles.input}
                value={slug}
                onChange={(e) =>
                  setSlug(e.target.value)
                }
                placeholder="fashion"
              />
            </label>

            <label style={styles.label}>
              Description
              <textarea
                style={styles.textarea}
                value={description}
                onChange={(e) =>
                  setDescription(
                    e.target.value
                  )
                }
              />
            </label>

            <label style={styles.label}>
              Sort order
              <input
                style={styles.input}
                type="number"
                value={sortOrder}
                onChange={(e) =>
                  setSortOrder(e.target.value)
                }
              />
            </label>

            <div style={styles.formActions}>
              <button
                type="submit"
                style={styles.saveButton}
              >
                {editingId
                  ? "Save Changes"
                  : "Add Category"}
              </button>

              {editingId && (
                <button
                  type="button"
                  style={styles.cancelButton}
                  onClick={resetForm}
                >
                  Cancel
                </button>
              )}
            </div>

            {message && (
              <p style={styles.message}>
                {message}
              </p>
            )}
          </form>
        </section>

        {/* ======================
            TREE
        ======================= */}

        <section style={styles.section}>
          <div style={styles.treeHeader}>
            <div>
              <h2 style={styles.sectionTitle}>
                {config.label}
              </h2>

              <p style={styles.count}>
                {categories.length} categories
              </p>
            </div>
          </div>

          {loading ? (
            <p style={styles.muted}>
              Loading...
            </p>
          ) : roots.length === 0 ? (
            <p style={styles.muted}>
              まだカテゴリーがありません。
            </p>
          ) : (
            <div style={styles.tree}>
              {roots.map((root) =>
                renderTree(root)
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
    padding: "35px 24px 90px",
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
    marginTop: "30px",
    marginBottom: "22px",
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
    lineHeight: 1.7,
    marginTop: "10px",
  },

  tabs: {
    display: "flex",
    gap: "6px",
    marginBottom: "18px",
  },

  tab: {
    border: "1px solid #ddd5d1",
    background: "#fff",
    color: "#666",
    padding: "10px 15px",
    borderRadius: "9px",
    cursor: "pointer",
    fontSize: "12px",
  },

  tabActive: {
    background: "#222",
    color: "#fff",
    borderColor: "#222",
  },

  section: {
    background: "#fff",
    border: "1px solid #e7e0dc",
    borderRadius: "15px",
    padding: "22px",
    marginBottom: "18px",
  },

  sectionTitle: {
    fontFamily: "Georgia, serif",
    fontSize: "24px",
    fontWeight: 400,
    margin: 0,
  },

  form: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "14px",
    marginTop: "18px",
  },

  label: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "7px",
    fontSize: "13px",
    fontWeight: 600,
  },

  input: {
    width: "100%",
    boxSizing: "border-box" as const,
    padding: "12px 13px",
    border: "1px solid #ddd5d1",
    borderRadius: "9px",
    background: "#fff",
    fontSize: "14px",
  },

  textarea: {
    width: "100%",
    minHeight: "90px",
    boxSizing: "border-box" as const,
    padding: "12px 13px",
    border: "1px solid #ddd5d1",
    borderRadius: "9px",
    background: "#fff",
    fontSize: "14px",
    resize: "vertical" as const,
  },

  formActions: {
    display: "flex",
    gap: "8px",
  },

  saveButton: {
    border: 0,
    borderRadius: "9px",
    background: "#222",
    color: "#fff",
    padding: "12px 18px",
    cursor: "pointer",
  },

  cancelButton: {
    border: "1px solid #ddd5d1",
    borderRadius: "9px",
    background: "#fff",
    padding: "12px 18px",
    cursor: "pointer",
  },

  message: {
    color: "#c8647b",
    fontSize: "13px",
    margin: 0,
  },

  treeHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "16px",
  },

  count: {
    color: "#888",
    fontSize: "12px",
    marginTop: "5px",
  },

  tree: {
    borderTop: "1px solid #eee8e4",
  },

  categoryRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "15px",
    padding: "12px 0",
    borderBottom: "1px solid #eee8e4",
  },

  categoryInfo: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    minWidth: 0,
  },

  categoryName: {
    fontSize: "14px",
  },

  slug: {
    color: "#aaa",
    fontSize: "10px",
    marginTop: "3px",
  },

  inactive: {
    fontSize: "10px",
    color: "#999",
    border: "1px solid #ddd",
    borderRadius: "999px",
    padding: "3px 7px",
  },

  actions: {
    display: "flex",
    gap: "6px",
    flexShrink: 0,
  },

  smallButton: {
    border: "1px solid #ddd5d1",
    background: "#fff",
    borderRadius: "7px",
    padding: "6px 9px",
    fontSize: "11px",
    cursor: "pointer",
  },

  deleteButton: {
    border: "1px solid #e2cccc",
    background: "#fff",
    color: "#a44",
    borderRadius: "7px",
    padding: "6px 9px",
    fontSize: "11px",
    cursor: "pointer",
  },

  muted: {
    color: "#888",
    fontSize: "13px",
  },
};