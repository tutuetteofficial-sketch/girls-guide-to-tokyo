"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

type Region = {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  is_active: boolean;
  sort_order: number;
};

type Area = {
  id: number;
  region_id: number;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  is_active: boolean;
  sort_order: number;
};

export default function RegionsAdminPage() {
  const [regions, setRegions] = useState<Region[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);

  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const [search, setSearch] = useState("");
  const [showInactive, setShowInactive] = useState(false);

  const [regionFormOpen, setRegionFormOpen] = useState(false);
  const [areaFormOpen, setAreaFormOpen] = useState(false);

  const [editingRegionId, setEditingRegionId] =
    useState<number | null>(null);

  const [editingAreaId, setEditingAreaId] =
    useState<number | null>(null);

  const [regionName, setRegionName] = useState("");
  const [regionSlug, setRegionSlug] = useState("");
  const [regionDescription, setRegionDescription] =
    useState("");
  const [regionSortOrder, setRegionSortOrder] =
    useState("0");

  const [areaName, setAreaName] = useState("");
  const [areaSlug, setAreaSlug] = useState("");
  const [areaRegionId, setAreaRegionId] =
    useState("");
  const [areaDescription, setAreaDescription] =
    useState("");
  const [areaSortOrder, setAreaSortOrder] =
    useState("0");

  async function loadData() {
    setLoading(true);
    setMessage("");

    const [regionsResult, areasResult] =
      await Promise.all([
        supabase
          .from("regions")
          .select(
            "id, name, slug, description, image_url, is_active, sort_order"
          )
          .order("sort_order")
          .order("name"),

        supabase
          .from("areas")
          .select(
            "id, region_id, name, slug, description, image_url, is_active, sort_order"
          )
          .order("sort_order")
          .order("name"),
      ]);

    if (regionsResult.error) {
      setMessage(
        `Regionの読み込みに失敗しました: ${regionsResult.error.message}`
      );
      setLoading(false);
      return;
    }

    if (areasResult.error) {
      setMessage(
        `Areaの読み込みに失敗しました: ${areasResult.error.message}`
      );
      setLoading(false);
      return;
    }

    setRegions((regionsResult.data ?? []) as Region[]);
    setAreas((areasResult.data ?? []) as Area[]);
    setLoading(false);
  }

  useEffect(() => {
    loadData();
  }, []);

  function slugify(value: string) {
    return value
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "");
  }

  function resetRegionForm() {
    setEditingRegionId(null);
    setRegionName("");
    setRegionSlug("");
    setRegionDescription("");
    setRegionSortOrder("0");
  }

  function resetAreaForm() {
    setEditingAreaId(null);
    setAreaName("");
    setAreaSlug("");
    setAreaRegionId("");
    setAreaDescription("");
    setAreaSortOrder("0");
  }

  function startEditRegion(region: Region) {
    setEditingRegionId(region.id);
    setRegionName(region.name);
    setRegionSlug(region.slug);
    setRegionDescription(region.description ?? "");
    setRegionSortOrder(String(region.sort_order));
    setRegionFormOpen(true);
    setAreaFormOpen(false);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  function startEditArea(area: Area) {
    setEditingAreaId(area.id);
    setAreaName(area.name);
    setAreaSlug(area.slug);
    setAreaRegionId(String(area.region_id));
    setAreaDescription(area.description ?? "");
    setAreaSortOrder(String(area.sort_order));
    setAreaFormOpen(true);
    setRegionFormOpen(false);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  async function saveRegion(
    e: React.FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    if (!regionName.trim()) {
      setMessage("Region名を入力してください。");
      return;
    }

    const payload = {
      name: regionName.trim(),
      slug:
        regionSlug.trim() ||
        slugify(regionName),
      description:
        regionDescription.trim() || null,
      sort_order:
        Number(regionSortOrder) || 0,
      is_active: true,
    };

    setMessage("保存中...");

    const result = editingRegionId
      ? await supabase
          .from("regions")
          .update(payload)
          .eq("id", editingRegionId)
      : await supabase
          .from("sites")
          .select("id")
          .eq("slug", "tokyo-guide")
          .single();

    if (!editingRegionId) {
      if (result.error || !result.data) {
        setMessage(
          `サイト情報の取得に失敗しました: ${
            result.error?.message ?? "Unknown error"
          }`
        );
        return;
      }

      const { error } = await supabase
        .from("regions")
        .insert({
          ...payload,
          site_id: result.data.id,
        });

      if (error) {
        setMessage(
          `Regionの追加に失敗しました: ${error.message}`
        );
        return;
      }

      setMessage("Regionを追加しました。");
    } else {
      if (result.error) {
        setMessage(
          `Regionの更新に失敗しました: ${result.error.message}`
        );
        return;
      }

      setMessage("Regionを更新しました。");
    }

    resetRegionForm();
    setRegionFormOpen(false);
    await loadData();
  }

  async function saveArea(
    e: React.FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    if (!areaName.trim()) {
      setMessage("Area名を入力してください。");
      return;
    }

    if (!areaRegionId) {
      setMessage("Regionを選択してください。");
      return;
    }

    const payload = {
      name: areaName.trim(),
      slug:
        areaSlug.trim() ||
        slugify(areaName),
      region_id: Number(areaRegionId),
      description:
        areaDescription.trim() || null,
      sort_order:
        Number(areaSortOrder) || 0,
      is_active: true,
    };

    setMessage("保存中...");

    if (editingAreaId) {
      const { error } = await supabase
        .from("areas")
        .update(payload)
        .eq("id", editingAreaId);

      if (error) {
        setMessage(
          `Areaの更新に失敗しました: ${error.message}`
        );
        return;
      }

      setMessage("Areaを更新しました。");
    } else {
      const { error } = await supabase
        .from("areas")
        .insert(payload);

      if (error) {
        setMessage(
          `Areaの追加に失敗しました: ${error.message}`
        );
        return;
      }

      setMessage("Areaを追加しました。");
    }

    resetAreaForm();
    setAreaFormOpen(false);
    await loadData();
  }

  async function toggleRegion(region: Region) {
    const { error } = await supabase
      .from("regions")
      .update({
        is_active: !region.is_active,
      })
      .eq("id", region.id);

    if (error) {
      setMessage(
        `変更に失敗しました: ${error.message}`
      );
      return;
    }

    await loadData();
  }

  async function toggleArea(area: Area) {
    const { error } = await supabase
      .from("areas")
      .update({
        is_active: !area.is_active,
      })
      .eq("id", area.id);

    if (error) {
      setMessage(
        `変更に失敗しました: ${error.message}`
      );
      return;
    }

    await loadData();
  }

  async function deleteRegion(region: Region) {
    const children = areas.filter(
      (area) => area.region_id === region.id
    );

    if (children.length > 0) {
      setMessage(
        `「${region.name}」には${children.length}件のAreaがあります。先にAreaを移動または削除してください。`
      );
      return;
    }

    if (
      !window.confirm(
        `「${region.name}」を削除しますか？`
      )
    ) {
      return;
    }

    const { error } = await supabase
      .from("regions")
      .delete()
      .eq("id", region.id);

    if (error) {
      setMessage(
        `削除に失敗しました: ${error.message}`
      );
      return;
    }

    await loadData();
  }

  async function deleteArea(area: Area) {
    if (
      !window.confirm(
        `「${area.name}」を削除しますか？`
      )
    ) {
      return;
    }

    const { error } = await supabase
      .from("areas")
      .delete()
      .eq("id", area.id);

    if (error) {
      setMessage(
        `削除に失敗しました: ${error.message}`
      );
      return;
    }

    await loadData();
  }

  const visibleRegions = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return regions
      .filter(
        (region) =>
          showInactive || region.is_active
      )
      .filter((region) => {
        if (!keyword) return true;

        const regionMatch = region.name
          .toLowerCase()
          .includes(keyword);

        const areaMatch = areas.some(
          (area) =>
            area.region_id === region.id &&
            area.name
              .toLowerCase()
              .includes(keyword)
        );

        return regionMatch || areaMatch;
      });
  }, [regions, areas, search, showInactive]);

  return (
    <main style={styles.main}>
      <div style={styles.container}>
        <Link href="/admin" style={styles.back}>
          ← Dashboard
        </Link>

        <header style={styles.header}>
          <p style={styles.eyebrow}>
            STRUCTURE / REGIONS
          </p>

          <h1 style={styles.title}>
            Regions
          </h1>

          <p style={styles.description}>
            地域と、その地域に属するAreaを管理します。
          </p>
        </header>

        <div style={styles.actionRow}>
          <button
            style={styles.primaryButton}
            onClick={() => {
              resetRegionForm();
              setRegionFormOpen(true);
              setAreaFormOpen(false);
            }}
          >
            + Add Region
          </button>

          <button
            style={styles.secondaryButton}
            onClick={() => {
              resetAreaForm();
              setAreaFormOpen(true);
              setRegionFormOpen(false);
            }}
          >
            + Add Area
          </button>
        </div>

        {regionFormOpen && (
          <section style={styles.section}>
            <h2 style={styles.sectionTitle}>
              {editingRegionId
                ? "Edit Region"
                : "Add Region"}
            </h2>

            <form
              onSubmit={saveRegion}
              style={styles.form}
            >
              <label style={styles.label}>
                Region name *
                <input
                  style={styles.input}
                  value={regionName}
                  onChange={(e) => {
                    setRegionName(e.target.value);

                    if (!editingRegionId) {
                      setRegionSlug(
                        slugify(e.target.value)
                      );
                    }
                  }}
                  placeholder="Tokyo"
                />
              </label>

              <label style={styles.label}>
                Slug
                <input
                  style={styles.input}
                  value={regionSlug}
                  onChange={(e) =>
                    setRegionSlug(e.target.value)
                  }
                  placeholder="tokyo"
                />
              </label>

              <label style={styles.label}>
                Description
                <textarea
                  style={styles.textarea}
                  value={regionDescription}
                  onChange={(e) =>
                    setRegionDescription(
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
                  value={regionSortOrder}
                  onChange={(e) =>
                    setRegionSortOrder(
                      e.target.value
                    )
                  }
                />
              </label>

              <div style={styles.buttonRow}>
                <button
                  type="submit"
                  style={styles.primaryButton}
                >
                  {editingRegionId
                    ? "Save Changes"
                    : "Add Region"}
                </button>

                <button
                  type="button"
                  style={styles.secondaryButton}
                  onClick={() => {
                    resetRegionForm();
                    setRegionFormOpen(false);
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </section>
        )}

        {areaFormOpen && (
          <section style={styles.section}>
            <h2 style={styles.sectionTitle}>
              {editingAreaId
                ? "Edit Area"
                : "Add Area"}
            </h2>

            <form
              onSubmit={saveArea}
              style={styles.form}
            >
              <label style={styles.label}>
                Region *
                <select
                  style={styles.input}
                  value={areaRegionId}
                  onChange={(e) =>
                    setAreaRegionId(e.target.value)
                  }
                >
                  <option value="">
                    Select region
                  </option>

                  {regions
                    .filter(
                      (region) =>
                        region.is_active
                    )
                    .map((region) => (
                      <option
                        key={region.id}
                        value={region.id}
                      >
                        {region.name}
                      </option>
                    ))}
                </select>
              </label>

              <label style={styles.label}>
                Area name *
                <input
                  style={styles.input}
                  value={areaName}
                  onChange={(e) => {
                    setAreaName(e.target.value);

                    if (!editingAreaId) {
                      setAreaSlug(
                        slugify(e.target.value)
                      );
                    }
                  }}
                  placeholder="Shibuya"
                />
              </label>

              <label style={styles.label}>
                Slug
                <input
                  style={styles.input}
                  value={areaSlug}
                  onChange={(e) =>
                    setAreaSlug(e.target.value)
                  }
                  placeholder="shibuya"
                />
              </label>

              <label style={styles.label}>
                Description
                <textarea
                  style={styles.textarea}
                  value={areaDescription}
                  onChange={(e) =>
                    setAreaDescription(
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
                  value={areaSortOrder}
                  onChange={(e) =>
                    setAreaSortOrder(
                      e.target.value
                    )
                  }
                />
              </label>

              <div style={styles.buttonRow}>
                <button
                  type="submit"
                  style={styles.primaryButton}
                >
                  {editingAreaId
                    ? "Save Changes"
                    : "Add Area"}
                </button>

                <button
                  type="button"
                  style={styles.secondaryButton}
                  onClick={() => {
                    resetAreaForm();
                    setAreaFormOpen(false);
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </section>
        )}

        {message && (
          <div style={styles.message}>
            {message}
          </div>
        )}

        <section style={styles.controls}>
          <input
            style={styles.search}
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
            placeholder="Search regions and areas..."
          />

          <label style={styles.checkbox}>
            <input
              type="checkbox"
              checked={showInactive}
              onChange={(e) =>
                setShowInactive(e.target.checked)
              }
            />
            Show inactive
          </label>
        </section>

        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>
            Region / Area
          </h2>

          {loading ? (
            <p style={styles.muted}>
              Loading...
            </p>
          ) : visibleRegions.length === 0 ? (
            <p style={styles.muted}>
              まだ地域がありません。
            </p>
          ) : (
            <div style={styles.tree}>
              {visibleRegions.map((region) => {
                const regionAreas =
                  areas.filter(
                    (area) =>
                      area.region_id ===
                      region.id
                  );

                return (
                  <div key={region.id}>
                    <div style={styles.regionRow}>
                      <div>
                        <strong
                          style={
                            styles.regionName
                          }
                        >
                          {region.name}
                        </strong>

                        <span
                          style={
                            styles.areaCount
                          }
                        >
                          {regionAreas.length} areas
                        </span>

                        {!region.is_active && (
                          <span
                            style={
                              styles.inactive
                            }
                          >
                            Hidden
                          </span>
                        )}
                      </div>

                      <div style={styles.actions}>
                        <button
                          style={
                            styles.smallButton
                          }
                          onClick={() =>
                            startEditRegion(
                              region
                            )
                          }
                        >
                          Edit
                        </button>

                        <button
                          style={
                            styles.smallButton
                          }
                          onClick={() =>
                            toggleRegion(
                              region
                            )
                          }
                        >
                          {region.is_active
                            ? "Hide"
                            : "Show"}
                        </button>

                        <button
                          style={
                            styles.deleteButton
                          }
                          onClick={() =>
                            deleteRegion(
                              region
                            )
                          }
                        >
                          Delete
                        </button>
                      </div>
                    </div>

                    {regionAreas.map(
                      (area) => (
                        <div
                          key={area.id}
                          style={
                            styles.areaRow
                          }
                        >
                          <span>
                            ↳ {area.name}
                          </span>

                          <div
                            style={
                              styles.actions
                            }
                          >
                            <button
                              style={
                                styles.smallButton
                              }
                              onClick={() =>
                                startEditArea(
                                  area
                                )
                              }
                            >
                              Edit
                            </button>

                            <button
                              style={
                                styles.smallButton
                              }
                              onClick={() =>
                                toggleArea(
                                  area
                                )
                              }
                            >
                              {area.is_active
                                ? "Hide"
                                : "Show"}
                            </button>

                            <button
                              style={
                                styles.deleteButton
                              }
                              onClick={() =>
                                deleteArea(
                                  area
                                )
                              }
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      )
                    )}
                  </div>
                );
              })}
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
    marginBottom: "20px",
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

  actionRow: {
    display: "flex",
    gap: "8px",
    marginBottom: "18px",
  },

  primaryButton: {
    border: 0,
    borderRadius: "9px",
    background: "#222",
    color: "#fff",
    padding: "11px 16px",
    cursor: "pointer",
    fontSize: "12px",
  },

  secondaryButton: {
    border: "1px solid #ddd5d1",
    borderRadius: "9px",
    background: "#fff",
    color: "#222",
    padding: "11px 16px",
    cursor: "pointer",
    fontSize: "12px",
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
    border: "1px solid #ded7d3",
    borderRadius: "9px",
    background: "#fff",
    fontSize: "14px",
  },

  textarea: {
    width: "100%",
    minHeight: "90px",
    boxSizing: "border-box" as const,
    padding: "12px 13px",
    border: "1px solid #ded7d3",
    borderRadius: "9px",
    background: "#fff",
    fontSize: "14px",
    resize: "vertical" as const,
  },

  buttonRow: {
    display: "flex",
    gap: "8px",
  },

  message: {
    padding: "13px 15px",
    background: "#fff3f5",
    borderRadius: "10px",
    color: "#c8647b",
    fontSize: "12px",
    marginBottom: "15px",
  },

  controls: {
    display: "flex",
    alignItems: "center",
    gap: "18px",
    marginBottom: "14px",
  },

  search: {
    flex: 1,
    padding: "12px 14px",
    border: "1px solid #ded7d3",
    borderRadius: "10px",
    background: "#fff",
    fontSize: "13px",
  },

  checkbox: {
    display: "flex",
    alignItems: "center",
    gap: "7px",
    fontSize: "12px",
    whiteSpace: "nowrap" as const,
  },

  tree: {
    borderTop: "1px solid #eee8e4",
    marginTop: "18px",
  },

  regionRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "15px",
    padding: "15px 0",
    borderBottom: "1px solid #eee8e4",
  },

  regionName: {
    fontFamily: "Georgia, serif",
    fontSize: "20px",
    fontWeight: 400,
  },

  areaCount: {
    color: "#888",
    fontSize: "11px",
    marginLeft: "10px",
  },

  areaRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "11px 0 11px 25px",
    borderBottom: "1px solid #f0ebe8",
    fontSize: "13px",
    color: "#555",
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
    border: "1px solid #e3cccc",
    background: "#fff",
    color: "#a44",
    borderRadius: "7px",
    padding: "6px 9px",
    fontSize: "11px",
    cursor: "pointer",
  },

  inactive: {
    display: "inline-block",
    marginLeft: "9px",
    fontSize: "10px",
    color: "#999",
    border: "1px solid #ddd",
    borderRadius: "999px",
    padding: "3px 7px",
  },

  muted: {
    color: "#888",
    fontSize: "13px",
  },
};