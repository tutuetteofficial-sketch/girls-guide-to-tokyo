"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

type Group = {
  id: string;
  name: string;
  description: string | null;
  logo_url: string | null;
  official_url: string | null;
  instagram_url: string | null;
  is_active: boolean;
  created_at: string;
};

export default function PlaceGroupsPage() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [placeCounts, setPlaceCounts] = useState<Record<string, number>>({});

  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const [search, setSearch] = useState("");
  const [showInactive, setShowInactive] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [officialUrl, setOfficialUrl] = useState("");
  const [instagramUrl, setInstagramUrl] = useState("");

  async function loadGroups() {
    setLoading(true);
    setMessage("");

    const { data, error } = await supabase
      .from("place_groups")
      .select(`
        id,
        name,
        description,
        logo_url,
        official_url,
        instagram_url,
        is_active,
        created_at
      `)
      .order("name");

    if (error) {
      setMessage(`読み込みに失敗しました: ${error.message}`);
      setLoading(false);
      return;
    }

    const groupData = (data ?? []) as Group[];
    setGroups(groupData);

    const { data: placesData } = await supabase
      .from("places")
      .select("id, group_id");

    const counts: Record<string, number> = {};

    (placesData ?? []).forEach((place: any) => {
      if (place.group_id) {
        counts[place.group_id] =
          (counts[place.group_id] ?? 0) + 1;
      }
    });

    setPlaceCounts(counts);

    setLoading(false);
  }

  useEffect(() => {
    loadGroups();
  }, []);

  function resetForm() {
    setEditingId(null);
    setName("");
    setDescription("");
    setLogoUrl("");
    setOfficialUrl("");
    setInstagramUrl("");
    setMessage("");
  }

  function startEdit(group: Group) {
    setEditingId(group.id);
    setName(group.name);
    setDescription(group.description ?? "");
    setLogoUrl(group.logo_url ?? "");
    setOfficialUrl(group.official_url ?? "");
    setInstagramUrl(group.instagram_url ?? "");
    setMessage("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function saveGroup(e: React.FormEvent) {
    e.preventDefault();

    if (!name.trim()) {
      setMessage("Group nameを入力してください。");
      return;
    }

    setMessage("保存中...");

    const payload = {
      name: name.trim(),
      description: description.trim() || null,
      logo_url: logoUrl.trim() || null,
      official_url: officialUrl.trim() || null,
      instagram_url: instagramUrl.trim() || null,
      is_active: true,
    };

    if (editingId) {
      const { error } = await supabase
        .from("place_groups")
        .update(payload)
        .eq("id", editingId);

      if (error) {
        setMessage(`更新に失敗しました: ${error.message}`);
        return;
      }

      setMessage("Place Groupを更新しました。");
    } else {
      const { error } = await supabase
        .from("place_groups")
        .insert(payload);

      if (error) {
        setMessage(`追加に失敗しました: ${error.message}`);
        return;
      }

      setMessage("Place Groupを追加しました。");
    }

    resetForm();
    await loadGroups();
  }

  async function toggleActive(group: Group) {
    const { error } = await supabase
      .from("place_groups")
      .update({
        is_active: !group.is_active,
      })
      .eq("id", group.id);

    if (error) {
      setMessage(`変更に失敗しました: ${error.message}`);
      return;
    }

    await loadGroups();
  }

  async function deleteGroup(group: Group) {
    const count = placeCounts[group.id] ?? 0;

    if (count > 0) {
      setMessage(
        `「${group.name}」は${count}件のPlaceで使用されています。先にPlace側のGroupを変更してください。`
      );
      return;
    }

    const confirmed = window.confirm(
      `「${group.name}」を削除しますか？`
    );

    if (!confirmed) return;

    const { error } = await supabase
      .from("place_groups")
      .delete()
      .eq("id", group.id);

    if (error) {
      setMessage(`削除に失敗しました: ${error.message}`);
      return;
    }

    setMessage("Place Groupを削除しました。");
    await loadGroups();
  }

  const filteredGroups = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return groups.filter((group) => {
      const matchesSearch =
        !keyword ||
        [
          group.name,
          group.description ?? "",
        ]
          .join(" ")
          .toLowerCase()
          .includes(keyword);

      const matchesActive =
        showInactive || group.is_active;

      return matchesSearch && matchesActive;
    });
  }, [groups, search, showInactive]);

  return (
    <main style={styles.main}>
      <div style={styles.container}>
        <Link href="/admin/places" style={styles.back}>
          ← Places
        </Link>

        <header style={styles.header}>
          <div>
            <p style={styles.eyebrow}>
              PLACES / GROUPS
            </p>

            <h1 style={styles.title}>
              Place Groups
            </h1>

            <p style={styles.description}>
              同じ系列・店舗網に属するPlaceをまとめて管理します。
            </p>
          </div>

          <button
            type="button"
            style={styles.addButton}
            onClick={() => {
              resetForm();
              window.scrollTo({
                top: 0,
                behavior: "smooth",
              });
            }}
          >
            + Add Group
          </button>
        </header>

        <section style={styles.formSection}>
          <h2 style={styles.sectionTitle}>
            {editingId ? "Edit Group" : "Add Group"}
          </h2>

          <form onSubmit={saveGroup} style={styles.form}>
            <label style={styles.label}>
              Group name *
              <input
                style={styles.input}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="LOFT"
              />
            </label>

            <label style={styles.label}>
              Description
              <textarea
                style={styles.textarea}
                value={description}
                onChange={(e) =>
                  setDescription(e.target.value)
                }
                placeholder="About this place group..."
              />
            </label>

            <label style={styles.label}>
              Logo URL
              <input
                style={styles.input}
                value={logoUrl}
                onChange={(e) =>
                  setLogoUrl(e.target.value)
                }
              />
            </label>

            <label style={styles.label}>
              Official website
              <input
                style={styles.input}
                value={officialUrl}
                onChange={(e) =>
                  setOfficialUrl(e.target.value)
                }
              />
            </label>

            <label style={styles.label}>
              Instagram
              <input
                style={styles.input}
                value={instagramUrl}
                onChange={(e) =>
                  setInstagramUrl(e.target.value)
                }
              />
            </label>

            <div style={styles.formActions}>
              <button
                type="submit"
                style={styles.saveButton}
              >
                {editingId
                  ? "Update Group"
                  : "Add Group"}
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

        <section style={styles.controls}>
          <input
            style={styles.search}
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
            placeholder="Search groups..."
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

        <p style={styles.count}>
          {loading
            ? "Loading..."
            : `${filteredGroups.length} groups`}
        </p>

        <section style={styles.list}>
          {filteredGroups.length === 0 ? (
            <div style={styles.empty}>
              <p>No groups yet.</p>
            </div>
          ) : (
            filteredGroups.map((group) => (
              <article
                key={group.id}
                style={styles.groupCard}
              >
                <div style={styles.groupMain}>
                  <div style={styles.logoBox}>
                    {group.logo_url ? (
                      <img
                        src={group.logo_url}
                        alt={group.name}
                        style={styles.logoImage}
                      />
                    ) : (
                      <span>
                        {group.name.slice(0, 1)}
                      </span>
                    )}
                  </div>

                  <div>
                    <h3 style={styles.groupName}>
                      {group.name}
                    </h3>

                    <p style={styles.placeCount}>
                      {placeCounts[group.id] ?? 0} places
                    </p>

                    {group.description && (
                      <p style={styles.groupDescription}>
                        {group.description}
                      </p>
                    )}

                    {!group.is_active && (
                      <span style={styles.inactive}>
                        Inactive
                      </span>
                    )}
                  </div>
                </div>

                <div style={styles.actions}>
                  <button
                    type="button"
                    style={styles.smallButton}
                    onClick={() =>
                      startEdit(group)
                    }
                  >
                    Edit
                  </button>

                  <button
                    type="button"
                    style={styles.smallButton}
                    onClick={() =>
                      toggleActive(group)
                    }
                  >
                    {group.is_active
                      ? "Hide"
                      : "Show"}
                  </button>

                  <button
                    type="button"
                    style={styles.deleteButton}
                    onClick={() =>
                      deleteGroup(group)
                    }
                  >
                    Delete
                  </button>
                </div>
              </article>
            ))
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
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-end",
    gap: "20px",
    marginTop: "30px",
    marginBottom: "25px",
  },

  eyebrow: {
    color: "#c8647b",
    fontSize: "10px",
    fontWeight: 700,
    letterSpacing: "3px",
    marginBottom: "7px",
  },

  title: {
    fontFamily: "Georgia, serif",
    fontSize: "46px",
    fontWeight: 400,
    margin: 0,
  },

  description: {
    color: "#777",
    marginTop: "10px",
  },

  addButton: {
    border: 0,
    borderRadius: "10px",
    background: "#222",
    color: "#fff",
    padding: "13px 17px",
    cursor: "pointer",
    fontSize: "12px",
  },

  formSection: {
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

  form: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "14px",
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

  formActions: {
    display: "flex",
    gap: "8px",
    marginTop: "5px",
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
  },

  controls: {
    display: "flex",
    alignItems: "center",
    gap: "18px",
    marginTop: "24px",
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

  count: {
    color: "#888",
    fontSize: "12px",
    margin: "12px 2px",
  },

  list: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "10px",
  },

  groupCard: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "20px",
    padding: "17px",
    background: "#fff",
    border: "1px solid #e7e0dc",
    borderRadius: "14px",
  },

  groupMain: {
    display: "flex",
    alignItems: "center",
    gap: "15px",
    minWidth: 0,
  },

  logoBox: {
    width: "55px",
    height: "55px",
    borderRadius: "12px",
    background: "#f4efec",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    overflow: "hidden",
    fontFamily: "Georgia, serif",
    color: "#777",
  },

  logoImage: {
    width: "100%",
    height: "100%",
    objectFit: "contain" as const,
  },

  groupName: {
    fontFamily: "Georgia, serif",
    fontSize: "20px",
    fontWeight: 400,
    margin: 0,
  },

  placeCount: {
    color: "#c8647b",
    fontSize: "11px",
    margin: "5px 0 0",
  },

  groupDescription: {
    color: "#777",
    fontSize: "12px",
    margin: "7px 0 0",
  },

  inactive: {
    display: "inline-block",
    marginTop: "7px",
    fontSize: "10px",
    color: "#999",
    border: "1px solid #ddd",
    borderRadius: "999px",
    padding: "3px 7px",
  },

  actions: {
    display: "flex",
    gap: "7px",
    flexShrink: 0,
  },

  smallButton: {
    border: "1px solid #ddd5d1",
    background: "#fff",
    borderRadius: "7px",
    padding: "7px 9px",
    fontSize: "11px",
    cursor: "pointer",
  },

  deleteButton: {
    border: "1px solid #e3cccc",
    background: "#fff",
    color: "#a44",
    borderRadius: "7px",
    padding: "7px 9px",
    fontSize: "11px",
    cursor: "pointer",
  },

  empty: {
    background: "#fff",
    border: "1px solid #e7e0dc",
    borderRadius: "15px",
    padding: "60px 20px",
    textAlign: "center" as const,
    color: "#888",
  },
};