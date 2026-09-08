"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

type Category = {
  id: number;
  name: string;
  sort_order: number | null;
};

type Place = {
  id: string;
  name: string;
};

type Food = {
  id: string;
  name: string;
  category_id: string;
  place_id: string;
  description: string;
  image_url: string;
  editor_pick: number;
  status: string;
  isNew?: boolean;
  isDirty?: boolean;
};

export default function FoodPage() {
  const [siteId, setSiteId] = useState("");
  const [foods, setFoods] = useState<Food[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [places, setPlaces] = useState<Place[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");

  const [newCategory, setNewCategory] = useState("");

  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    setErrorMessage("");

    try {
      const { data: site, error: siteError } = await supabase
        .from("sites")
        .select("id")
        .eq("slug", "tokyo-guide")
        .single();

      if (siteError || !site) {
        throw new Error(siteError?.message || "Site not found.");
      }

      setSiteId(site.id);

      const [foodResult, categoryResult, placeResult] =
        await Promise.all([
          supabase
            .from("foods")
            .select(`
              id,
              name,
              category_id,
              place_id,
              description,
              image_url,
              editor_pick,
              status
            `)
            .eq("site_id", site.id)
            .order("created_at", { ascending: false }),

          supabase
            .from("food_categories")
            .select("id, name, sort_order")
            .eq("site_id", site.id)
            .order("sort_order"),

          supabase
            .from("places")
            .select("id, name")
            .eq("site_id", site.id)
            .order("name"),
        ]);

      if (foodResult.error) throw foodResult.error;
      if (categoryResult.error) throw categoryResult.error;
      if (placeResult.error) throw placeResult.error;

      setCategories(categoryResult.data ?? []);
      setPlaces(placeResult.data ?? []);

      setFoods(
        (foodResult.data ?? []).map((food: any) => ({
          id: food.id,
          name: food.name ?? "",
          category_id: food.category_id
            ? String(food.category_id)
            : "",
          place_id: food.place_id ?? "",
          description: food.description ?? "",
          image_url: food.image_url ?? "",
          editor_pick: food.editor_pick ?? 0,
          status: food.status ?? "active",
          isNew: false,
          isDirty: false,
        }))
      );
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
      if (
        activeCategory !== "all" &&
        food.category_id !== activeCategory
      ) {
        return false;
      }

      if (!keyword) return true;

      const placeName =
        places.find((place) => place.id === food.place_id)?.name ?? "";

      const categoryName =
        categories.find(
          (category) =>
            String(category.id) === food.category_id
        )?.name ?? "";

      return [
        food.name,
        food.description,
        placeName,
        categoryName,
      ]
        .join(" ")
        .toLowerCase()
        .includes(keyword);
    });
  }, [
    foods,
    search,
    activeCategory,
    places,
    categories,
  ]);

  function updateFood(
    id: string,
    field: keyof Food,
    value: string | number
  ) {
    setFoods((current) =>
      current.map((food) =>
        food.id === id
          ? {
              ...food,
              [field]: value,
              isDirty: true,
            }
          : food
      )
    );

    setMessage("");
    setErrorMessage("");
  }

  function addRow() {
    const id = `new-${Date.now()}`;

    setFoods((current) => [
      {
        id,
        name: "",
        category_id:
          activeCategory === "all"
            ? ""
            : activeCategory,
        place_id: "",
        description: "",
        image_url: "",
        editor_pick: 0,
        status: "active",
        isNew: true,
        isDirty: true,
      },
      ...current,
    ]);
  }

  async function deleteFood(food: Food) {
    if (
      !window.confirm(
        `Delete "${food.name || "this food"}"?`
      )
    ) {
      return;
    }

    if (food.isNew) {
      setFoods((current) =>
        current.filter((item) => item.id !== food.id)
      );
      return;
    }

    const { error } = await supabase
      .from("foods")
      .delete()
      .eq("id", food.id);

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    setFoods((current) =>
      current.filter((item) => item.id !== food.id)
    );

    setMessage("Food deleted.");
  }

  async function saveChanges() {
    setSaving(true);
    setErrorMessage("");
    setMessage("");

    try {
      if (!siteId) {
        throw new Error("Site information could not be loaded.");
      }

      const changedFoods = foods.filter(
        (food) => food.isNew || food.isDirty
      );

      if (changedFoods.length === 0) {
        setMessage("No changes to save.");
        return;
      }

      for (const food of changedFoods) {
        if (!food.name.trim()) {
          throw new Error("Every food needs a name.");
        }

        const payload = {
          name: food.name.trim(),
          category_id: food.category_id
            ? Number(food.category_id)
            : null,
          place_id: food.place_id || null,
          description: food.description.trim() || null,
          image_url: food.image_url.trim() || null,
          editor_pick: Number(food.editor_pick),
          status: food.status,
          updated_at: new Date().toISOString(),
        };

        if (food.isNew) {
          const { error } = await supabase
            .from("foods")
            .insert({
              site_id: siteId,
              ...payload,
            });

          if (error) throw error;
        } else {
          const { error } = await supabase
            .from("foods")
            .update(payload)
            .eq("id", food.id);

          if (error) throw error;
        }
      }

      setMessage(
        `${changedFoods.length} item${
          changedFoods.length === 1 ? "" : "s"
        } saved ✦`
      );

      await loadData();
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Failed to save."
      );
    } finally {
      setSaving(false);
    }
  }

  async function addCategory() {
    const name = newCategory.trim();

    if (!name || !siteId) return;

    const exists = categories.some(
      (category) =>
        category.name.toLowerCase() === name.toLowerCase()
    );

    if (exists) {
      setErrorMessage("That category already exists.");
      return;
    }

    const maxSort =
      categories.length > 0
        ? Math.max(
            ...categories.map(
              (category) => category.sort_order ?? 0
            )
          )
        : 0;

    const { data, error } = await supabase
      .from("food_categories")
      .insert({
        site_id: siteId,
        name,
        sort_order: maxSort + 1,
        is_active: true,
      })
      .select("id, name, sort_order")
      .single();

    if (error || !data) {
      setErrorMessage(
        error?.message || "Failed to add category."
      );
      return;
    }

    setCategories((current) => [...current, data]);
    setNewCategory("");
    setMessage("Category added.");
  }

  async function deleteCategory(category: Category) {
    if (
      !window.confirm(
        `Delete "${category.name}"?\n\nFoods themselves will not be deleted.`
      )
    ) {
      return;
    }

    try {
      const { error: foodError } = await supabase
        .from("foods")
        .update({ category_id: null })
        .eq("category_id", category.id);

      if (foodError) throw foodError;

      const { error } = await supabase
        .from("food_categories")
        .delete()
        .eq("id", category.id);

      if (error) throw error;

      setCategories((current) =>
        current.filter((item) => item.id !== category.id)
      );

      setFoods((current) =>
        current.map((food) =>
          food.category_id === String(category.id)
            ? {
                ...food,
                category_id: "",
              }
            : food
        )
      );

      if (activeCategory === String(category.id)) {
        setActiveCategory("all");
      }

      setMessage("Category deleted.");
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Failed to delete category."
      );
    }
  }

  if (loading) {
    return (
      <main style={styles.page}>
        <p>Loading Food Database...</p>
      </main>
    );
  }

  return (
    <main style={styles.page}>
      <div style={styles.container}>

        <header style={styles.header}>
          <div>
            <p style={styles.eyebrow}>
              TOKYO GUIDE ADMIN
            </p>

            <h1 style={styles.title}>
              Food Database ✦
            </h1>

            <p style={styles.subtitle}>
              Manage food, sweets and drinks.
            </p>
          </div>

          <div style={styles.buttons}>
            <Link
              href="/admin/food/new"
              style={styles.secondaryButton}
            >
              ＋ Detailed Entry
            </Link>

            <button
              onClick={saveChanges}
              disabled={saving}
              style={styles.primaryButton}
            >
              {saving ? "Saving..." : "Save Changes ✦"}
            </button>
          </div>
        </header>

        {errorMessage && (
          <div style={styles.error}>
            {errorMessage}
          </div>
        )}

        {message && (
          <div style={styles.success}>
            {message}
          </div>
        )}

        <section style={styles.categoryBox}>
          <div style={styles.categoryTop}>
            <div>
              <b>FOOD CATEGORIES</b>
            </div>

            <div style={styles.categoryAdd}>
              <input
                value={newCategory}
                onChange={(e) =>
                  setNewCategory(e.target.value)
                }
                onKeyDown={(e) => {
                  if (e.key === "Enter") addCategory();
                }}
                placeholder="New category..."
                style={styles.input}
              />

              <button
                onClick={addCategory}
                style={styles.smallButton}
              >
                ＋ Add
              </button>
            </div>
          </div>

          <div style={styles.categoryList}>
            <button
              onClick={() => setActiveCategory("all")}
              style={styles.chip}
            >
              All
            </button>

            {categories.map((category) => (
              <div
                key={category.id}
                style={styles.categoryChip}
              >
                <button
                  onClick={() =>
                    setActiveCategory(String(category.id))
                  }
                  style={styles.categoryName}
                >
                  {category.name}
                </button>

                <button
                  onClick={() => deleteCategory(category)}
                  style={styles.categoryDelete}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </section>

        <div style={styles.toolbar}>
          <input
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
            placeholder="Search..."
            style={styles.search}
          />

          <button
            onClick={addRow}
            style={styles.smallButton}
          >
            ＋ Add Row
          </button>
        </div>

        <div style={styles.tableWrap}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th>Photo URL</th>
                <th>Food Name</th>
                <th>Category</th>
                <th>Place</th>
                <th>Description</th>
                <th>Pick</th>
                <th>Status</th>
                <th></th>
                <th></th>
              </tr>
            </thead>

            <tbody>
              {filteredFoods.map((food) => (
                <tr key={food.id}>

                  <td>
                    <input
                      value={food.image_url}
                      onChange={(e) =>
                        updateFood(
                          food.id,
                          "image_url",
                          e.target.value
                        )
                      }
                      placeholder="Image URL"
                      style={styles.cellInput}
                    />

                    {food.image_url && (
                      <img
                        src={food.image_url}
                        alt=""
                        style={styles.thumb}
                      />
                    )}
                  </td>

                  <td>
                    <input
                      value={food.name}
                      onChange={(e) =>
                        updateFood(
                          food.id,
                          "name",
                          e.target.value
                        )
                      }
                      style={styles.cellInput}
                    />
                  </td>

                  <td>
                    <select
                      value={food.category_id}
                      onChange={(e) =>
                        updateFood(
                          food.id,
                          "category_id",
                          e.target.value
                        )
                      }
                      style={styles.cellInput}
                    >
                      <option value="">—</option>

                      {categories.map((category) => (
                        <option
                          key={category.id}
                          value={category.id}
                        >
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </td>

                  <td>
                    <select
                      value={food.place_id}
                      onChange={(e) =>
                        updateFood(
                          food.id,
                          "place_id",
                          e.target.value
                        )
                      }
                      style={styles.cellInput}
                    >
                      <option value="">—</option>

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

                  <td>
                    <textarea
                      value={food.description}
                      onChange={(e) =>
                        updateFood(
                          food.id,
                          "description",
                          e.target.value
                        )
                      }
                      style={styles.textarea}
                    />
                  </td>

                  <td>
                    <select
                      value={food.editor_pick}
                      onChange={(e) =>
                        updateFood(
                          food.id,
                          "editor_pick",
                          Number(e.target.value)
                        )
                      }
                      style={styles.cellInput}
                    >
                      {[0, 1, 2, 3, 4, 5].map((n) => (
                        <option key={n} value={n}>
                          {n === 0 ? "—" : "★".repeat(n)}
                        </option>
                      ))}
                    </select>
                  </td>

                  <td>
                    <select
                      value={food.status}
                      onChange={(e) =>
                        updateFood(
                          food.id,
                          "status",
                          e.target.value
                        )
                      }
                      style={styles.cellInput}
                    >
                      <option value="active">Active</option>
                      <option value="hidden">Hidden</option>
                      <option value="archived">Archived</option>
                    </select>
                  </td>

                  <td>
                    {!food.isNew && (
                      <Link
                        href={`/admin/food/${food.id}`}
                      >
                        Edit
                      </Link>
                    )}
                  </td>

                  <td>
                    <button
                      onClick={() => deleteFood(food)}
                      style={styles.deleteButton}
                    >
                      ×
                    </button>
                  </td>

                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    padding: "40px 24px 100px",
    background: "#fff8fb",
    color: "#403740",
  },

  container: {
    maxWidth: "1500px",
    margin: "0 auto",
  },

  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-end",
    gap: 20,
    marginBottom: 25,
  },

  eyebrow: {
    fontSize: 11,
    fontWeight: 800,
    letterSpacing: "0.15em",
    color: "#b2819c",
  },

  title: {
    margin: "5px 0",
    fontSize: 40,
  },

  subtitle: {
    color: "#907b88",
  },

  buttons: {
    display: "flex",
    gap: 10,
  },

  primaryButton: {
    padding: "13px 20px",
    border: 0,
    borderRadius: 12,
    background: "#d98eae",
    color: "#fff",
    fontWeight: 700,
    cursor: "pointer",
  },

  secondaryButton: {
    padding: "13px 20px",
    borderRadius: 12,
    background: "#fff",
    border: "1px solid #eadbe3",
    textDecoration: "none",
    color: "#805f70",
  },

  error: {
    padding: 15,
    marginBottom: 15,
    background: "#fff0f2",
    color: "#b45165",
    borderRadius: 12,
  },

  success: {
    padding: 15,
    marginBottom: 15,
    background: "#f4efff",
    color: "#70568d",
    borderRadius: 12,
  },

  categoryBox: {
    background: "#fff",
    border: "1px solid #eadde4",
    borderRadius: 18,
    padding: 20,
    marginBottom: 20,
  },

  categoryTop: {
    display: "flex",
    justifyContent: "space-between",
    gap: 20,
  },

  categoryAdd: {
    display: "flex",
    gap: 8,
  },

  categoryList: {
    display: "flex",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 16,
  },

  chip: {
    border: "1px solid #eadde4",
    borderRadius: 20,
    background: "#fff",
    padding: "8px 14px",
    cursor: "pointer",
  },

  categoryChip: {
    display: "flex",
    border: "1px solid #eadde4",
    borderRadius: 20,
    background: "#fff",
    overflow: "hidden",
  },

  categoryName: {
    border: 0,
    background: "transparent",
    padding: "8px 12px",
    cursor: "pointer",
  },

  categoryDelete: {
    border: 0,
    borderLeft: "1px solid #eadde4",
    background: "#fff5f7",
    color: "#bd6b82",
    cursor: "pointer",
    width: 30,
  },

  toolbar: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: 15,
    gap: 15,
  },

  input: {
    padding: "10px 12px",
    borderRadius: 10,
    border: "1px solid #dfd3da",
  },

  search: {
    width: 350,
    padding: "12px 15px",
    borderRadius: 12,
    border: "1px solid #dfd3da",
  },

  smallButton: {
    padding: "10px 15px",
    border: 0,
    borderRadius: 10,
    background: "#f2dce6",
    color: "#87596e",
    fontWeight: 700,
    cursor: "pointer",
  },

  tableWrap: {
    overflowX: "auto",
    background: "#fff",
    border: "1px solid #eadde4",
    borderRadius: 18,
  },

  table: {
    width: "100%",
    minWidth: 1250,
    borderCollapse: "collapse",
  },

  cellInput: {
    width: "100%",
    minWidth: 110,
    padding: 9,
    borderRadius: 8,
    border: "1px solid #eadde4",
    boxSizing: "border-box",
  },

  textarea: {
    width: 220,
    minHeight: 55,
    padding: 9,
    borderRadius: 8,
    border: "1px solid #eadde4",
  },

  thumb: {
    width: 60,
    height: 60,
    objectFit: "cover",
    borderRadius: 8,
    marginTop: 6,
  },

  deleteButton: {
    border: 0,
    background: "#fff0f2",
    color: "#c56c7e",
    fontSize: 20,
    borderRadius: 8,
    cursor: "pointer",
  },
};