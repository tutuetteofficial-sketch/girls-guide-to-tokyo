"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

type FoodCategory = {
  id: number;
  name: string;
};

type Place = {
  id: string;
  name: string;
};

type FoodStatus = "active" | "hidden" | "archived";

type FoodRow = {
  id: string;
  name: string;
  category_id: string;
  place_id: string;
  description: string;
  editor_pick: number;
  status: FoodStatus;
  isNew?: boolean;
  isDirty?: boolean;
};

const STATUS_OPTIONS: FoodStatus[] = [
  "active",
  "hidden",
  "archived",
];

export default function FoodPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [siteId, setSiteId] = useState("");

  const [categories, setCategories] = useState<FoodCategory[]>([]);
  const [places, setPlaces] = useState<Place[]>([]);
  const [foods, setFoods] = useState<FoodRow[]>([]);

  const [activeCategoryId, setActiveCategoryId] =
    useState<string>("all");

  const [search, setSearch] = useState("");

  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    setErrorMessage("");

    try {
      // SITE

      const { data: site, error: siteError } = await supabase
        .from("sites")
        .select("id")
        .eq("slug", "tokyo-guide")
        .single();

      if (siteError || !site) {
        throw new Error(
          siteError?.message ||
            "TOKYO GUIDE site could not be found."
        );
      }

      setSiteId(site.id);

      // LOAD EVERYTHING

      const [
        categoriesResult,
        placesResult,
        foodsResult,
      ] = await Promise.all([
        supabase
          .from("food_categories")
          .select("id, name")
          .eq("site_id", site.id)
          .eq("is_active", true)
          .order("sort_order"),

        supabase
          .from("places")
          .select("id, name")
          .eq("site_id", site.id)
          .order("name"),

        supabase
          .from("foods")
          .select(`
            id,
            name,
            category_id,
            place_id,
            description,
            editor_pick,
            status
          `)
          .eq("site_id", site.id)
          .order("created_at", {
            ascending: false,
          }),
      ]);

      const firstError =
        categoriesResult.error ||
        placesResult.error ||
        foodsResult.error;

      if (firstError) {
        throw new Error(firstError.message);
      }

      setCategories(categoriesResult.data ?? []);
      setPlaces(placesResult.data ?? []);

      const formattedFoods: FoodRow[] =
        (foodsResult.data ?? []).map((food: any) => ({
          id: food.id,
          name: food.name ?? "",
          category_id: food.category_id
            ? String(food.category_id)
            : "",
          place_id: food.place_id ?? "",
          description: food.description ?? "",
          editor_pick: food.editor_pick ?? 0,
          status: food.status ?? "active",
          isNew: false,
          isDirty: false,
        }));

      setFoods(formattedFoods);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Failed to load food database."
      );
    } finally {
      setLoading(false);
    }
  }

  const filteredFoods = useMemo(() => {
    const keyword = search.toLowerCase().trim();

    return foods.filter((food) => {
      const matchesCategory =
        activeCategoryId === "all" ||
        food.category_id === activeCategoryId;

      const placeName =
        places.find(
          (place) => place.id === food.place_id
        )?.name ?? "";

      const matchesSearch =
        !keyword ||
        food.name.toLowerCase().includes(keyword) ||
        food.description
          .toLowerCase()
          .includes(keyword) ||
        placeName.toLowerCase().includes(keyword);

      return matchesCategory && matchesSearch;
    });
  }, [
    foods,
    places,
    activeCategoryId,
    search,
  ]);

  function updateFood(
    id: string,
    field: keyof FoodRow,
    value: string | number
  ) {
    setFoods((current) =>
      current.map((food) => {
        if (food.id !== id) return food;

        return {
          ...food,
          [field]: value,
          isDirty: true,
        };
      })
    );

    setMessage("");
    setErrorMessage("");
  }

  function addNewRow() {
    const temporaryId = `new-${Date.now()}`;

    const newFood: FoodRow = {
      id: temporaryId,
      name: "",
      category_id:
        activeCategoryId !== "all"
          ? activeCategoryId
          : "",
      place_id: "",
      description: "",
      editor_pick: 0,
      status: "active",
      isNew: true,
      isDirty: true,
    };

    setFoods((current) => [
      newFood,
      ...current,
    ]);

    setMessage("");
    setErrorMessage("");
  }

  function removeNewRow(id: string) {
    setFoods((current) =>
      current.filter((food) => food.id !== id)
    );
  }

  async function saveChanges() {
    setSaving(true);
    setMessage("");
    setErrorMessage("");

    try {
      if (!siteId) {
        throw new Error(
          "Site information could not be loaded."
        );
      }

      const changedFoods = foods.filter(
        (food) =>
          food.isNew || food.isDirty
      );

      if (changedFoods.length === 0) {
        setMessage("No changes to save.");
        return;
      }

      const savedIdMap = new Map<string, string>();

      for (const food of changedFoods) {
        if (!food.name.trim()) {
          throw new Error(
            "Every new food needs a Food Name."
          );
        }

        const payload = {
          site_id: siteId,

          name: food.name.trim(),

          category_id: food.category_id
            ? Number(food.category_id)
            : null,

          place_id:
            food.place_id || null,

          description:
            food.description.trim() || null,

          editor_pick: Number(
            food.editor_pick
          ),

          status: food.status,
        };

        // NEW FOOD

        if (food.isNew) {
          const { data, error } =
            await supabase
              .from("foods")
              .insert(payload)
              .select("id")
              .single();

          if (error || !data) {
            throw new Error(
              error?.message ||
                `Failed to create "${food.name}".`
            );
          }

          savedIdMap.set(
            food.id,
            data.id
          );
        }

        // EXISTING FOOD

        else {
          const { error } =
            await supabase
              .from("foods")
              .update(payload)
              .eq("id", food.id);

          if (error) {
            throw new Error(
              `Failed to update "${food.name}": ${error.message}`
            );
          }
        }
      }

      setFoods((current) =>
        current.map((food) => ({
          ...food,
          id:
            savedIdMap.get(food.id) ??
            food.id,
          isNew: false,
          isDirty: false,
        }))
      );

      setMessage(
        `${changedFoods.length} food${
          changedFoods.length === 1
            ? ""
            : "s"
        } saved successfully ✦`
      );
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Failed to save food."
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main style={styles.page}>
        <div style={styles.loading}>
          Loading your food database...
        </div>
      </main>
    );
  }

  return (
    <main style={styles.page}>
      <div style={styles.container}>

        {/* HEADER */}

        <div style={styles.header}>
          <div>
            <p style={styles.eyebrow}>
              TOKYO GUIDE ADMIN
            </p>

            <h1 style={styles.title}>
              Food Database ✦
            </h1>

            <p style={styles.subtitle}>
              Manage every dish, sweet and drink — and connect it to its place.
            </p>
          </div>

          <div style={styles.headerButtons}>
            <Link
              href="/admin/food/new"
              style={styles.detailButton}
            >
              ＋ Detailed Entry
            </Link>

            <button
              onClick={saveChanges}
              disabled={saving}
              style={styles.saveButton}
            >
              {saving
                ? "Saving..."
                : "Save Changes ✦"}
            </button>
          </div>
        </div>

        {/* MESSAGE */}

        {errorMessage && (
          <div style={styles.errorMessage}>
            {errorMessage}
          </div>
        )}

        {message && (
          <div style={styles.successMessage}>
            {message}
          </div>
        )}

        {/* CATEGORY TABS */}

        <div style={styles.tabs}>
          <button
            onClick={() =>
              setActiveCategoryId("all")
            }
            style={{
              ...styles.tab,
              ...(activeCategoryId === "all"
                ? styles.activeTab
                : {}),
            }}
          >
            All Food
          </button>

          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() =>
                setActiveCategoryId(
                  String(category.id)
                )
              }
              style={{
                ...styles.tab,
                ...(activeCategoryId ===
                String(category.id)
                  ? styles.activeTab
                  : {}),
              }}
            >
              {category.name}
            </button>
          ))}
        </div>

        {/* TOOLBAR */}

        <div style={styles.toolbar}>
          <input
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
            placeholder="⌕ Search food or place..."
            style={styles.search}
          />

          <div style={styles.toolbarRight}>
            <span style={styles.count}>
              {filteredFoods.length} items
            </span>

            <button
              onClick={addNewRow}
              style={styles.addButton}
            >
              ＋ Add Row
            </button>
          </div>
        </div>

        {/* TABLE */}

        <div style={styles.databaseCard}>
          <div style={styles.tableWrapper}>
            <table style={styles.table}>

              <thead>
                <tr>
                  <th style={styles.th}>
                    Food Name
                  </th>

                  <th style={styles.th}>
                    Category
                  </th>

                  <th style={styles.th}>
                    Place
                  </th>

                  <th style={styles.th}>
                    Description
                  </th>

                  <th style={styles.th}>
                    Pick
                  </th>

                  <th style={styles.th}>
                    Status
                  </th>

                  <th style={styles.thAction}>
                    Details
                  </th>
                </tr>
              </thead>

              <tbody>
                {filteredFoods.map((food) => (
                  <tr
                    key={food.id}
                    style={
                      food.isNew
                        ? styles.newRow
                        : food.isDirty
                        ? styles.dirtyRow
                        : {}
                    }
                  >

                    {/* NAME */}

                    <td style={styles.td}>
                      <input
                        value={food.name}
                        onChange={(e) =>
                          updateFood(
                            food.id,
                            "name",
                            e.target.value
                          )
                        }
                        placeholder="Food name"
                        style={styles.cellInput}
                      />
                    </td>

                    {/* CATEGORY */}

                    <td style={styles.td}>
                      <select
                        value={food.category_id}
                        onChange={(e) =>
                          updateFood(
                            food.id,
                            "category_id",
                            e.target.value
                          )
                        }
                        style={styles.cellSelect}
                      >
                        <option value="">
                          —
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
                    </td>

                    {/* PLACE */}

                    <td style={styles.td}>
                      <select
                        value={food.place_id}
                        onChange={(e) =>
                          updateFood(
                            food.id,
                            "place_id",
                            e.target.value
                          )
                        }
                        style={styles.cellSelect}
                      >
                        <option value="">
                          No place selected
                        </option>

                        {places.map((place) => (
                          <option
                            key={place.id}
                            value={place.id}
                          >
                            {place.name}
                          </option>
                        ))}
                      </select>
                    </td>

                    {/* DESCRIPTION */}

                    <td style={styles.td}>
                      <input
                        value={food.description}
                        onChange={(e) =>
                          updateFood(
                            food.id,
                            "description",
                            e.target.value
                          )
                        }
                        placeholder="Short description"
                        style={styles.cellInput}
                      />
                    </td>

                    {/* PICK */}

                    <td style={styles.td}>
                      <select
                        value={food.editor_pick}
                        onChange={(e) =>
                          updateFood(
                            food.id,
                            "editor_pick",
                            Number(
                              e.target.value
                            )
                          )
                        }
                        style={styles.pickSelect}
                      >
                        <option value={0}>
                          —
                        </option>

                        <option value={1}>
                          ★
                        </option>

                        <option value={2}>
                          ★★
                        </option>

                        <option value={3}>
                          ★★★
                        </option>

                        <option value={4}>
                          ★★★★
                        </option>

                        <option value={5}>
                          ★★★★★
                        </option>
                      </select>
                    </td>

                    {/* STATUS */}

                    <td style={styles.td}>
                      <select
                        value={food.status}
                        onChange={(e) =>
                          updateFood(
                            food.id,
                            "status",
                            e.target.value
                          )
                        }
                        style={styles.statusSelect}
                      >
                        {STATUS_OPTIONS.map(
                          (status) => (
                            <option
                              key={status}
                              value={status}
                            >
                              {status}
                            </option>
                          )
                        )}
                      </select>
                    </td>

                    {/* DETAILS */}

                    <td style={styles.tdAction}>
                      {food.isNew ? (
                        <button
                          onClick={() =>
                            removeNewRow(
                              food.id
                            )
                          }
                          style={styles.removeButton}
                        >
                          ×
                        </button>
                      ) : (
                        <Link
                          href={`/admin/food/${food.id}`}
                          style={styles.editButton}
                        >
                          Edit →
                        </Link>
                      )}
                    </td>

                  </tr>
                ))}

                {filteredFoods.length === 0 && (
                  <tr>
                    <td
                      colSpan={7}
                      style={styles.empty}
                    >
                      No food here yet ✦
                    </td>
                  </tr>
                )}

              </tbody>

            </table>
          </div>

          <button
            onClick={addNewRow}
            style={styles.bottomAddButton}
          >
            ＋ Add a new food
          </button>
        </div>

        {/* FOOTER */}

        <div style={styles.footer}>
          <span style={styles.footerText}>
            Changes are highlighted until saved.
          </span>

          <button
            onClick={saveChanges}
            disabled={saving}
            style={styles.saveButton}
          >
            {saving
              ? "Saving..."
              : "Save Changes ✦"}
          </button>
        </div>

      </div>
    </main>
  );
}

const styles: Record<
  string,
  React.CSSProperties
> = {
  page: {
    minHeight: "100vh",
    padding: "40px 24px 100px",
    background:
      "linear-gradient(135deg, #fff8fb 0%, #f8f5ff 50%, #fffaf5 100%)",
    color: "#463c46",
  },

  container: {
    maxWidth: "1500px",
    margin: "0 auto",
  },

  loading: {
    padding: "120px 20px",
    textAlign: "center",
    color: "#967c8d",
    fontSize: "16px",
  },

  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-end",
    gap: "24px",
    marginBottom: "28px",
  },

  eyebrow: {
    margin: "0 0 8px",
    color: "#b2819c",
    fontSize: "11px",
    fontWeight: 800,
    letterSpacing: "0.14em",
  },

  title: {
    margin: 0,
    fontSize: "38px",
    letterSpacing: "-1.5px",
  },

  subtitle: {
    margin: "10px 0 0",
    color: "#9a8491",
    fontSize: "14px",
  },

  headerButtons: {
    display: "flex",
    gap: "10px",
    alignItems: "center",
    flexWrap: "wrap",
  },

  detailButton: {
    textDecoration: "none",
    padding: "13px 18px",
    borderRadius: "14px",
    background: "#fff",
    border: "1px solid #eadbe4",
    color: "#806878",
    fontSize: "14px",
    fontWeight: 700,
  },

  saveButton: {
    border: "none",
    padding: "14px 20px",
    borderRadius: "14px",
    background:
      "linear-gradient(135deg, #e99bb9, #c69ae1)",
    color: "#fff",
    fontWeight: 800,
    cursor: "pointer",
    fontSize: "14px",
    boxShadow:
      "0 8px 20px rgba(202,143,177,0.25)",
  },

  tabs: {
    display: "flex",
    gap: "8px",
    flexWrap: "wrap",
    marginBottom: "18px",
  },

  tab: {
    border: "1px solid #eadce5",
    background: "rgba(255,255,255,0.7)",
    color: "#806c78",
    padding: "10px 17px",
    borderRadius: "999px",
    cursor: "pointer",
    fontWeight: 700,
    fontSize: "13px",
  },

  activeTab: {
    background: "#f7dbe7",
    border: "1px solid #e9b7cc",
    color: "#87546d",
  },

  toolbar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "16px",
    marginBottom: "14px",
  },

  toolbarRight: {
    display: "flex",
    alignItems: "center",
    gap: "14px",
  },

  search: {
    width: "320px",
    maxWidth: "100%",
    height: "46px",
    padding: "0 15px",
    borderRadius: "13px",
    border: "1px solid #eadce5",
    background: "#fff",
    outline: "none",
    boxSizing: "border-box",
  },

  count: {
    color: "#a08a97",
    fontSize: "13px",
    whiteSpace: "nowrap",
  },

  addButton: {
    border: "1px solid #efcfdd",
    background: "#fff",
    borderRadius: "13px",
    padding: "12px 17px",
    color: "#a05d7e",
    fontWeight: 800,
    cursor: "pointer",
  },

  databaseCard: {
    background: "rgba(255,255,255,0.88)",
    border: "1px solid #eedfe7",
    borderRadius: "22px",
    overflow: "hidden",
    boxShadow:
      "0 12px 40px rgba(169,119,145,0.08)",
  },

  tableWrapper: {
    width: "100%",
    overflowX: "auto",
  },

  table: {
    width: "100%",
    minWidth: "1150px",
    borderCollapse: "collapse",
  },

  th: {
    padding: "15px 14px",
    textAlign: "left",
    fontSize: "11px",
    letterSpacing: "0.08em",
    color: "#9a7e8d",
    background: "#fff8fb",
    borderBottom: "1px solid #f0e1e8",
    whiteSpace: "nowrap",
  },

  thAction: {
    padding: "15px 14px",
    textAlign: "center",
    fontSize: "11px",
    letterSpacing: "0.08em",
    color: "#9a7e8d",
    background: "#fff8fb",
    borderBottom: "1px solid #f0e1e8",
  },

  td: {
    padding: "9px 10px",
    borderBottom: "1px solid #f5eaf0",
  },

  tdAction: {
    padding: "9px 12px",
    borderBottom: "1px solid #f5eaf0",
    textAlign: "center",
  },

  cellInput: {
    width: "100%",
    minWidth: "140px",
    height: "40px",
    padding: "0 10px",
    border: "1px solid transparent",
    background: "transparent",
    borderRadius: "9px",
    outline: "none",
    boxSizing: "border-box",
    color: "#4d424a",
  },

  cellSelect: {
    width: "100%",
    minWidth: "150px",
    height: "40px",
    padding: "0 8px",
    border: "1px solid transparent",
    background: "transparent",
    borderRadius: "9px",
    color: "#4d424a",
    cursor: "pointer",
  },

  pickSelect: {
    width: "90px",
    height: "38px",
    border: "1px solid #eedde6",
    borderRadius: "999px",
    background: "#fff8fb",
    padding: "0 8px",
  },

  statusSelect: {
    width: "110px",
    height: "38px",
    padding: "0 8px",
    border: "1px solid #eedde6",
    background: "#fff8fb",
    borderRadius: "999px",
    color: "#876576",
    fontSize: "12px",
    fontWeight: 700,
    cursor: "pointer",
  },

  newRow: {
    background: "#fff8ec",
  },

  dirtyRow: {
    background: "#fff9fc",
  },

  editButton: {
    display: "inline-block",
    textDecoration: "none",
    padding: "8px 12px",
    borderRadius: "9px",
    background: "#f8efff",
    color: "#8965a5",
    fontSize: "12px",
    fontWeight: 800,
  },

  removeButton: {
    width: "32px",
    height: "32px",
    borderRadius: "50%",
    border: "none",
    background: "#fff0f2",
    color: "#c47385",
    fontSize: "18px",
    cursor: "pointer",
  },

  empty: {
    padding: "60px 20px",
    textAlign: "center",
    color: "#aa929f",
  },

  bottomAddButton: {
    width: "100%",
    padding: "17px",
    border: "none",
    borderTop: "1px solid #f0e1e8",
    background: "#fffafd",
    color: "#a76686",
    fontWeight: 800,
    cursor: "pointer",
    fontSize: "14px",
  },

  footer: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: "20px",
    gap: "20px",
  },

  footerText: {
    color: "#a38b98",
    fontSize: "12px",
  },

  errorMessage: {
    marginBottom: "18px",
    padding: "15px 18px",
    borderRadius: "14px",
    background: "#fff0f2",
    border: "1px solid #f2c3cc",
    color: "#ad5367",
  },

  successMessage: {
    marginBottom: "18px",
    padding: "15px 18px",
    borderRadius: "14px",
    background: "#f4fff7",
    border: "1px solid #cfe9d7",
    color: "#528567",
  },
};