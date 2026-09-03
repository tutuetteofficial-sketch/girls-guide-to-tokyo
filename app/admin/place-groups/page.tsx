"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

type PlaceGroup = {
  id: string;
  site_id: string;
  name: string;
  official_url: string | null;
  is_active: boolean;
};

type Place = {
  id: string;
  name: string;
  group_id: string | null;
  status: string;
};

type ProductGroup = {
  product_id: string;
  group_id: string;
};

export default function PlaceGroupsAdminPage() {
  const [groups, setGroups] = useState<PlaceGroup[]>(
    []
  );

  const [places, setPlaces] = useState<Place[]>(
    []
  );

  const [productGroups, setProductGroups] =
    useState<ProductGroup[]>([]);

  const [name, setName] = useState("");
  const [officialUrl, setOfficialUrl] =
    useState("");

  const [editingId, setEditingId] =
    useState<string | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [message, setMessage] =
    useState("");

  // =====================================
  // Site
  // =====================================

  async function getSiteId() {
    const { data, error } =
      await supabase
        .from("sites")
        .select("id")
        .eq("slug", "tokyo-guide")
        .single();

    if (error || !data) {
      throw new Error(
        `サイト情報を取得できませんでした: ${
          error?.message ??
          "Unknown error"
        }`
      );
    }

    return data.id;
  }

  // =====================================
  // Load
  // =====================================

  async function loadGroups() {
    setLoading(true);
    setMessage("");

    const [
      groupsResult,
      placesResult,
      productGroupsResult,
    ] = await Promise.all([
      supabase
        .from("place_groups")
        .select(
          "id, site_id, name, official_url, is_active"
        )
        .order("name"),

      supabase
        .from("places")
        .select(
          "id, name, group_id, status"
        )
        .order("name"),

      supabase
        .from("product_groups")
        .select(
          "product_id, group_id"
        ),
    ]);

    const errors = [
      groupsResult.error,
      placesResult.error,
      productGroupsResult.error,
    ].filter(Boolean);

    if (errors.length > 0) {
      setMessage(
        `データの読み込みに失敗しました: ${
          errors[0]!.message
        }`
      );
    }

    setGroups(
      (groupsResult.data ??
        []) as PlaceGroup[]
    );

    setPlaces(
      (placesResult.data ??
        []) as Place[]
    );

    setProductGroups(
      (productGroupsResult.data ??
        []) as ProductGroup[]
    );

    setLoading(false);
  }

  useEffect(() => {
    loadGroups();
  }, []);

  // =====================================
  // Counts
  // =====================================

  const placeCountMap = useMemo(() => {
    const map: Record<
      string,
      number
    > = {};

    places.forEach((place) => {
      if (!place.group_id) {
        return;
      }

      map[place.group_id] =
        (map[place.group_id] ?? 0) + 1;
    });

    return map;
  }, [places]);

  const productCountMap = useMemo(() => {
    const map: Record<
      string,
      number
    > = {};

    productGroups.forEach(
      (relation) => {
        map[relation.group_id] =
          (map[relation.group_id] ??
            0) + 1;
      }
    );

    return map;
  }, [productGroups]);

  // =====================================
  // Form
  // =====================================

  function resetForm() {
    setEditingId(null);
    setName("");
    setOfficialUrl("");
  }

  function startEdit(
    group: PlaceGroup
  ) {
    setEditingId(group.id);
    setName(group.name);
    setOfficialUrl(
      group.official_url ?? ""
    );

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  // =====================================
  // Save
  // =====================================

  async function saveGroup(
    e: React.FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    const trimmedName =
      name.trim();

    if (!trimmedName) {
      setMessage(
        "Shop名を入力してください。"
      );
      return;
    }

    setSaving(true);
    setMessage("保存中...");

    try {
      const siteId =
        await getSiteId();

      const duplicate =
        groups.find(
          (group) =>
            group.id !==
              editingId &&
            group.name
              .trim()
              .toLowerCase() ===
              trimmedName.toLowerCase()
        );

      if (duplicate) {
        throw new Error(
          `「${duplicate.name}」はすでに存在します。`
        );
      }

      const payload = {
        name: trimmedName,
        official_url:
          officialUrl.trim() ||
          null,
      };

      if (editingId) {
        const {
          error,
        } = await supabase
          .from("place_groups")
          .update(payload)
          .eq(
            "id",
            editingId
          )
          .eq(
            "site_id",
            siteId
          );

        if (error) {
          throw new Error(
            error.message
          );
        }

        setMessage(
          "Shopを更新しました。"
        );
      } else {
        const {
          error,
        } = await supabase
          .from("place_groups")
          .insert({
            site_id:
              siteId,
            name:
              trimmedName,
            official_url:
              officialUrl.trim() ||
              null,
            is_active:
              true,
          });

        if (error) {
          throw new Error(
            error.message
          );
        }

        setMessage(
          "Shopを追加しました。"
        );
      }

      resetForm();
      await loadGroups();
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

  // =====================================
  // Active
  // =====================================

  async function toggleActive(
    group: PlaceGroup
  ) {
    const { error } =
      await supabase
        .from("place_groups")
        .update({
          is_active:
            !group.is_active,
        })
        .eq(
          "id",
          group.id
        );

    if (error) {
      setMessage(
        `変更に失敗しました: ${error.message}`
      );
      return;
    }

    await loadGroups();
  }

  // =====================================
  // Delete
  // =====================================

  async function deleteGroup(
    group: PlaceGroup
  ) {
    const placeCount =
      placeCountMap[
        group.id
      ] ?? 0;

    const productCount =
      productCountMap[
        group.id
      ] ?? 0;

    if (
      placeCount > 0 ||
      productCount > 0
    ) {
      setMessage(
        `「${group.name}」は${placeCount}店舗・${productCount}件の商品で使用中です。削除せずHideを使ってください。`
      );
      return;
    }

    const confirmed =
      window.confirm(
        `「${group.name}」を削除しますか？`
      );

    if (!confirmed) {
      return;
    }

    const { error } =
      await supabase
        .from("place_groups")
        .delete()
        .eq(
          "id",
          group.id
        );

    if (error) {
      setMessage(
        `削除に失敗しました: ${error.message}`
      );
      return;
    }

    setMessage(
      "Shopを削除しました。"
    );

    await loadGroups();
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
            STRUCTURE / SHOPS
          </p>

          <h1 style={styles.title}>
            Shops
          </h1>

          <p style={styles.description}>
            商品を購入できるShopを管理します。
          </p>
        </header>

        {/* =========================
            ADD / EDIT
        ========================== */}

        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>
            {editingId
              ? "Edit Shop"
              : "Add Shop"}
          </h2>

          <form
            onSubmit={
              saveGroup
            }
            style={styles.form}
          >
            <label style={styles.label}>
              Shop name *

              <input
                style={styles.input}
                value={name}
                onChange={(e) =>
                  setName(
                    e.target.value
                  )
                }
                placeholder="LOFT"
              />

              <span
                style={
                  styles.fieldHelp
                }
              >
                LOFTのような販売チェーン単位で登録します。渋谷店・新宿店などの個別店舗はPlaceとして登録します。
              </span>
            </label>

            <label style={styles.label}>
              Official website

              <input
                style={styles.input}
                type="url"
                value={
                  officialUrl
                }
                onChange={(e) =>
                  setOfficialUrl(
                    e.target.value
                  )
                }
                placeholder="https://www.loft.co.jp/"
              />

              <span
                style={
                  styles.fieldHelp
                }
              >
                このShopの公式サイトです。公開ページで「すべての店舗を見る」リンクに使用します。
              </span>
            </label>

            <div style={styles.buttons}>
              <button
                type="submit"
                disabled={saving}
                style={{
                  ...styles.primary,
                  opacity:
                    saving
                      ? 0.6
                      : 1,
                }}
              >
                {saving
                  ? "Saving..."
                  : editingId
                  ? "Save Changes"
                  : "Add Shop"}
              </button>

              {editingId && (
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

        {/* =========================
            SHOP LIST
        ========================== */}

        <section style={styles.section}>
          <div
            style={
              styles.listHeader
            }
          >
            <div>
              <h2
                style={
                  styles.sectionTitle
                }
              >
                Shop Groups
              </h2>

              <p
                style={
                  styles.helper
                }
              >
                商品ページではShop名を表示し、クリックすると登録済み店舗の一覧へ移動します。
              </p>
            </div>

            <span
              style={
                styles.count
              }
            >
              {groups.length} shops
            </span>
          </div>

          {loading ? (
            <p
              style={
                styles.muted
              }
            >
              Loading...
            </p>
          ) : groups.length ===
            0 ? (
            <p
              style={
                styles.muted
              }
            >
              Shopがまだ登録されていません。
            </p>
          ) : (
            <div
              style={
                styles.list
              }
            >
              {groups.map(
                (group) => {
                  const placeCount =
                    placeCountMap[
                      group.id
                    ] ?? 0;

                  const productCount =
                    productCountMap[
                      group.id
                    ] ?? 0;

                  return (
                    <div
                      key={
                        group.id
                      }
                      style={{
                        ...styles.row,
                        opacity:
                          group.is_active
                            ? 1
                            : 0.55,
                      }}
                    >
                      <div
                        style={
                          styles.info
                        }
                      >
                        <div
                          style={
                            styles.nameRow
                          }
                        >
                          <strong>
                            {
                              group.name
                            }
                          </strong>

                          {!group.is_active && (
                            <span
                              style={
                                styles.hiddenBadge
                              }
                            >
                              Hidden
                            </span>
                          )}
                        </div>

                        {group.official_url && (
                          <a
                            href={
                              group.official_url
                            }
                            target="_blank"
                            rel="noopener noreferrer"
                            style={
                              styles.officialLink
                            }
                          >
                            Official website ↗
                          </a>
                        )}

                        <div
                          style={
                            styles.stats
                          }
                        >
                          <span>
                            {placeCount}{" "}
                            stores
                          </span>

                          <span>
                            {productCount}{" "}
                            products
                          </span>
                        </div>
                      </div>

                      <div
                        style={
                          styles.actions
                        }
                      >
                        <button
                          type="button"
                          style={
                            styles.smallButton
                          }
                          onClick={() =>
                            startEdit(
                              group
                            )
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
                              group
                            )
                          }
                        >
                          {group.is_active
                            ? "Hide"
                            : "Show"}
                        </button>

                        <button
                          type="button"
                          style={
                            styles.deleteButton
                          }
                          onClick={() =>
                            deleteGroup(
                              group
                            )
                          }
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  );
                }
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
    minHeight:
      "100vh",
    background:
      "#faf8f6",
    color:
      "#222",
    padding:
      "40px 24px 90px",
  },

  container: {
    maxWidth:
      "1000px",
    margin:
      "0 auto",
  },

  back: {
    color:
      "#777",
    textDecoration:
      "none",
    fontSize:
      "13px",
  },

  header: {
    padding:
      "35px 0 28px",
  },

  eyebrow: {
    color:
      "#c8647b",
    fontSize:
      "10px",
    fontWeight:
      700,
    letterSpacing:
      "3px",
    marginBottom:
      "8px",
  },

  title: {
    fontFamily:
      "Georgia, serif",
    fontSize:
      "48px",
    fontWeight:
      400,
    margin: 0,
  },

  description: {
    color:
      "#777",
    lineHeight:
      1.7,
    marginTop:
      "10px",
  },

  section: {
    background:
      "#fff",
    border:
      "1px solid #e7e0dc",
    borderRadius:
      "15px",
    padding:
      "22px",
    marginBottom:
      "18px",
  },

  sectionTitle: {
    fontFamily:
      "Georgia, serif",
    fontSize:
      "24px",
    fontWeight:
      400,
    margin: 0,
  },

  form: {
    display:
      "flex",
    flexDirection:
      "column" as const,
    gap:
      "14px",
    marginTop:
      "20px",
  },

  label: {
    display:
      "flex",
    flexDirection:
      "column" as const,
    gap:
      "7px",
    fontSize:
      "13px",
    fontWeight:
      600,
  },

  input: {
    width:
      "100%",
    boxSizing:
      "border-box" as const,
    padding:
      "12px 13px",
    border:
      "1px solid #ddd6d2",
    borderRadius:
      "9px",
    background:
      "#fff",
    fontSize:
      "14px",
  },

  fieldHelp: {
    color:
      "#999",
    fontSize:
      "11px",
    fontWeight:
      400,
    lineHeight:
      1.5,
  },

  buttons: {
    display:
      "flex",
    gap:
      "8px",
  },

  primary: {
    border: 0,
    borderRadius:
      "9px",
    background:
      "#222",
    color:
      "#fff",
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

  listHeader: {
    display:
      "flex",
    justifyContent:
      "space-between",
    alignItems:
      "flex-start",
    gap:
      "15px",
    marginBottom:
      "18px",
  },

  helper: {
    color:
      "#888",
    fontSize:
      "12px",
    lineHeight:
      1.6,
    marginTop:
      "7px",
  },

  count: {
    color:
      "#999",
    fontSize:
      "11px",
  },

  list: {
    borderTop:
      "1px solid #eee8e4",
  },

  row: {
    display:
      "flex",
    justifyContent:
      "space-between",
    alignItems:
      "center",
    gap:
      "20px",
    padding:
      "15px 0",
    borderBottom:
      "1px solid #eee8e4",
  },

  info: {
    display:
      "flex",
    flexDirection:
      "column" as const,
    gap:
      "6px",
  },

  nameRow: {
    display:
      "flex",
    alignItems:
      "center",
    gap:
      "8px",
    fontSize:
      "14px",
  },

  officialLink: {
    color:
      "#777",
    fontSize:
      "11px",
    textDecoration:
      "none",
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
    fontWeight:
      400,
  },

  stats: {
    display:
      "flex",
    gap:
      "12px",
    color:
      "#999",
    fontSize:
      "11px",
  },

  actions: {
    display:
      "flex",
    gap:
      "6px",
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
      "1px solid #e3cccc",
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
    color:
      "#888",
    fontSize:
      "13px",
    marginTop:
      "18px",
  },
};