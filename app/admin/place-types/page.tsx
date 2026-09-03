"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type PlaceType = {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  is_active: boolean;
  sort_order: number;
};

export default function PlaceTypesAdminPage() {
  const [types, setTypes] = useState<PlaceType[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [message, setMessage] = useState("");

  const [editingId, setEditingId] =
    useState<number | null>(null);

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] =
    useState("");
  const [sortOrder, setSortOrder] =
    useState("0");

  async function loadTypes() {
    setLoading(true);
    setMessage("");

    const { data, error } = await supabase
      .from("place_types")
      .select(`
        id,
        name,
        slug,
        description,
        is_active,
        sort_order
      `)
      .eq("site_id", await getSiteId())
      .order("sort_order")
      .order("name");

    if (error) {
      setMessage(
        `読み込みに失敗しました: ${error.message}`
      );
      setTypes([]);
      setLoading(false);
      return;
    }

    setTypes((data ?? []) as PlaceType[]);
    setLoading(false);
  }

  async function getSiteId() {
    const { data, error } = await supabase
      .from("sites")
      .select("id")
      .eq("slug", "tokyo-guide")
      .single();

    if (error || !data) {
      throw new Error(
        error?.message ??
          "Site not found"
      );
    }

    return data.id;
  }

  useEffect(() => {
    loadTypes().catch((error) => {
      setMessage(
        error instanceof Error
          ? error.message
          : "読み込みに失敗しました。"
      );
      setLoading(false);
    });
  }, []);

  function slugify(value: string) {
    return value
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "");
  }

  function resetForm() {
    setEditingId(null);
    setName("");
    setSlug("");
    setDescription("");
    setSortOrder("0");
  }

  function startEdit(type: PlaceType) {
    setEditingId(type.id);
    setName(type.name);
    setSlug(type.slug);
    setDescription(type.description ?? "");
    setSortOrder(String(type.sort_order));

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  async function saveType(
    e: React.FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    if (!name.trim()) {
      setMessage(
        "Place Type名を入力してください。"
      );
      return;
    }

    const finalSlug =
      slug.trim() || slugify(name);

    if (!finalSlug) {
      setMessage("Slugを入力してください。");
      return;
    }

    setSaving(true);
    setMessage("保存中...");

    try {
      const siteId = await getSiteId();

      const payload = {
        name: name.trim(),
        slug: finalSlug,
        description:
          description.trim() || null,
        sort_order:
          Number(sortOrder) || 0,
        is_active: true,
        updated_at:
          new Date().toISOString(),
      };

      if (editingId) {
        const { error } = await supabase
          .from("place_types")
          .update(payload)
          .eq("id", editingId)
          .eq("site_id", siteId);

        if (error) {
          throw new Error(error.message);
        }

        setMessage(
          "Place Typeを更新しました。"
        );
      } else {
        const { error } = await supabase
          .from("place_types")
          .insert({
            ...payload,
            site_id: siteId,
          });

        if (error) {
          throw new Error(error.message);
        }

        setMessage(
          "Place Typeを追加しました。"
        );
      }

      resetForm();
      await loadTypes();
    } catch (error) {
      setMessage(
        `保存に失敗しました: ${
          error instanceof Error
            ? error.message
            : "Unknown error"
        }`
      );
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(
    type: PlaceType
  ) {
    const { error } = await supabase
      .from("place_types")
      .update({
        is_active: !type.is_active,
        updated_at:
          new Date().toISOString(),
      })
      .eq("id", type.id);

    if (error) {
      setMessage(
        `変更に失敗しました: ${error.message}`
      );
      return;
    }

    await loadTypes();
  }

  async function deleteType(
    type: PlaceType
  ) {
    const { count, error: countError } =
      await supabase
        .from("places")
        .select("id", {
          count: "exact",
          head: true,
        })
        .eq("place_type_id", type.id);

    if (countError) {
      setMessage(
        `使用状況を確認できませんでした: ${countError.message}`
      );
      return;
    }

    if ((count ?? 0) > 0) {
      setMessage(
        `「${type.name}」は${count}件のPlaceで使用中です。削除する代わりにHideを使ってください。`
      );
      return;
    }

    if (
      !window.confirm(
        `「${type.name}」を削除しますか？`
      )
    ) {
      return;
    }

    const { error } = await supabase
      .from("place_types")
      .delete()
      .eq("id", type.id);

    if (error) {
      setMessage(
        `削除に失敗しました: ${error.message}`
      );
      return;
    }

    setMessage(
      "Place Typeを削除しました。"
    );

    await loadTypes();
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
          <p style={styles.eyebrow}>
            STRUCTURE / PLACE TYPES
          </p>

          <h1 style={styles.title}>
            Place Types
          </h1>

          <p style={styles.description}>
            Restaurant・Café・Shopなど、Placeの種類を管理します。
          </p>
        </header>

        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>
            {editingId
              ? "Edit Place Type"
              : "Add Place Type"}
          </h2>

          <form
            onSubmit={saveType}
            style={styles.form}
          >
            <label style={styles.label}>
              Name *

              <input
                style={styles.input}
                value={name}
                onChange={(e) => {
                  setName(e.target.value);

                  if (!editingId) {
                    setSlug(
                      slugify(
                        e.target.value
                      )
                    );
                  }
                }}
                placeholder="Café"
              />
            </label>

            <label style={styles.label}>
              Slug

              <input
                style={styles.input}
                value={slug}
                onChange={(e) =>
                  setSlug(e.target.value)
                }
                placeholder="cafe"
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
                  setSortOrder(
                    e.target.value
                  )
                }
              />
            </label>

            <div style={styles.buttons}>
              <button
                type="submit"
                style={styles.primary}
                disabled={saving}
              >
                {saving
                  ? "Saving..."
                  : editingId
                  ? "Save Changes"
                  : "Add Place Type"}
              </button>

              {editingId && (
                <button
                  type="button"
                  style={styles.secondary}
                  onClick={resetForm}
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </section>

        {message && (
          <div style={styles.message}>
            {message}
          </div>
        )}

        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>
            Place Types
          </h2>

          {loading ? (
            <p style={styles.muted}>
              Loading...
            </p>
          ) : types.length === 0 ? (
            <p style={styles.muted}>
              Place Typeがありません。
            </p>
          ) : (
            <div style={styles.list}>
              {types.map((type) => (
                <div
                  key={type.id}
                  style={styles.row}
                >
                  <div style={styles.info}>
                    <div>
                      <strong>
                        {type.name}
                      </strong>

                      <div
                        style={
                          styles.slug
                        }
                      >
                        /{type.slug}
                      </div>
                    </div>

                    {!type.is_active && (
                      <span
                        style={
                          styles.hiddenBadge
                        }
                      >
                        Hidden
                      </span>
                    )}
                  </div>

                  <div
                    style={styles.actions}
                  >
                    <button
                      type="button"
                      style={
                        styles.smallButton
                      }
                      onClick={() =>
                        startEdit(type)
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
                          type
                        )
                      }
                    >
                      {type.is_active
                        ? "Hide"
                        : "Show"}
                    </button>

                    <button
                      type="button"
                      style={
                        styles.deleteButton
                      }
                      onClick={() =>
                        deleteType(
                          type
                        )
                      }
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
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
    padding: "40px 24px 90px",
  },

  container: {
    maxWidth: "900px",
    margin: "0 auto",
  },

  back: {
    color: "#777",
    textDecoration: "none",
    fontSize: "13px",
  },

  header: {
    padding: "35px 0 28px",
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

  section: {
    background: "#fff",
    border: "1px solid #e7e0dc",
    borderRadius: "15px",
    padding: "22px",
    marginBottom: "18px",
  },

  sectionTitle: {
    fontFamily: "Georgia, serif",
    fontWeight: 400,
    fontSize: "24px",
    margin: 0,
  },

  form: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "14px",
    marginTop: "20px",
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
    border: "1px solid #ddd6d2",
    borderRadius: "9px",
    background: "#fff",
    fontSize: "14px",
  },

  textarea: {
    width: "100%",
    minHeight: "90px",
    boxSizing: "border-box" as const,
    padding: "12px 13px",
    border: "1px solid #ddd6d2",
    borderRadius: "9px",
    background: "#fff",
    fontSize: "14px",
    resize: "vertical" as const,
  },

  buttons: {
    display: "flex",
    gap: "8px",
  },

  primary: {
    border: 0,
    borderRadius: "9px",
    background: "#222",
    color: "#fff",
    padding: "12px 16px",
    cursor: "pointer",
  },

  secondary: {
    border: "1px solid #ddd6d2",
    borderRadius: "9px",
    background: "#fff",
    padding: "12px 16px",
    cursor: "pointer",
  },

  message: {
    background: "#fff3f5",
    color: "#c8647b",
    borderRadius: "10px",
    padding: "13px 15px",
    marginBottom: "18px",
    fontSize: "12px",
  },

  list: {
    borderTop: "1px solid #eee8e4",
    marginTop: "18px",
  },

  row: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "15px",
    padding: "14px 0",
    borderBottom: "1px solid #eee8e4",
  },

  info: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },

  slug: {
    color: "#aaa",
    fontSize: "10px",
    marginTop: "3px",
  },

  hiddenBadge: {
    border: "1px solid #ddd",
    borderRadius: "999px",
    padding: "3px 7px",
    fontSize: "10px",
    color: "#999",
  },

  actions: {
    display: "flex",
    gap: "6px",
  },

  smallButton: {
    border: "1px solid #ddd6d2",
    background: "#fff",
    borderRadius: "7px",
    padding: "6px 9px",
    fontSize: "11px",
    cursor: "pointer",
  },

  deleteButton: {
    border: "1px solid #e4cccc",
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
    marginTop: "18px",
  },
};