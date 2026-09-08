"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type FoodCategory = {
  id: number;
  name: string;
};

type Place = {
  id: string;
  name: string;
};

type Food = {
  id: string;
  name: string;
  category_id: number | null;
  place_id: string | null;
  description: string | null;
  image_url: string | null;
  editor_pick: number;
  status: string;
};

export default function FoodDetailPage() {
  const params = useParams();
  const router = useRouter();

  const id = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [siteId, setSiteId] = useState("");

  const [categories, setCategories] = useState<FoodCategory[]>([]);
  const [places, setPlaces] = useState<Place[]>([]);

  const [name, setName] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [placeId, setPlaceId] = useState("");

  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");

  const [editorPick, setEditorPick] = useState(0);
  const [status, setStatus] = useState("active");

  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    if (id) {
      loadData();
    }
  }, [id]);

  async function loadData() {
    setLoading(true);
    setErrorMessage("");

    try {
      // ----------------------------------------
      // SITE
      // ----------------------------------------

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

      // ----------------------------------------
      // FOOD
      // ----------------------------------------

      const { data: foodData, error: foodError } =
        await supabase
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
          .eq("id", id)
          .single();

      if (foodError || !foodData) {
        throw new Error(
          foodError?.message ||
            "Food could not be found."
        );
      }

      const food = foodData as Food;

      setName(food.name ?? "");
      setCategoryId(
        food.category_id
          ? String(food.category_id)
          : ""
      );
      setPlaceId(food.place_id ?? "");
      setDescription(food.description ?? "");
      setImageUrl(food.image_url ?? "");
      setEditorPick(food.editor_pick ?? 0);
      setStatus(food.status ?? "active");

      // ----------------------------------------
      // CATEGORIES
      // ----------------------------------------

      const { data: categoriesData, error: categoriesError } =
        await supabase
          .from("food_categories")
          .select("id, name")
          .eq("site_id", site.id)
          .eq("is_active", true)
          .order("sort_order", {
            ascending: true,
          });

      if (categoriesError) {
        throw new Error(categoriesError.message);
      }

      setCategories(categoriesData ?? []);

      // ----------------------------------------
      // PLACES
      // ----------------------------------------

      const { data: placesData, error: placesError } =
        await supabase
          .from("places")
          .select("id, name")
          .eq("site_id", site.id)
          .order("name", {
            ascending: true,
          });

      if (placesError) {
        throw new Error(placesError.message);
      }

      setPlaces(placesData ?? []);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Failed to load food."
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    setErrorMessage("");
    setSuccessMessage("");

    if (!name.trim()) {
      setErrorMessage("Please enter a food name.");
      return;
    }

    if (!siteId) {
      setErrorMessage(
        "Site information could not be loaded."
      );
      return;
    }

    setSaving(true);

    try {
      // ==================================================
      // IMPORTANT
      //
      // Food → Place relationship is saved directly here:
      //
      // foods.place_id → places.id
      //
      // place_foods is NOT used.
      // ==================================================

      const { error } = await supabase
        .from("foods")
        .update({
          name: name.trim(),

          category_id: categoryId
            ? Number(categoryId)
            : null,

          place_id: placeId || null,

          description:
            description.trim() || null,

          image_url:
            imageUrl.trim() || null,

          editor_pick: editorPick,

          status,

          updated_at: new Date().toISOString(),
        })
        .eq("id", id);

      if (error) {
        throw new Error(error.message);
      }

      setSuccessMessage(
        "Food updated successfully."
      );

      router.refresh();
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Failed to update food."
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    const confirmed = window.confirm(
      "Delete this food permanently?"
    );

    if (!confirmed) {
      return;
    }

    setDeleting(true);
    setErrorMessage("");

    try {
      const { error } = await supabase
        .from("foods")
        .delete()
        .eq("id", id);

      if (error) {
        throw new Error(error.message);
      }

      router.push("/admin/food");
      router.refresh();
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Failed to delete food."
      );

      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <main style={styles.page}>
        <div style={styles.loading}>
          Loading...
        </div>
      </main>
    );
  }

  return (
    <main style={styles.page}>
      <div style={styles.container}>
        <div style={styles.topBar}>
          <div>
            <Link
              href="/admin/food"
              style={styles.backLink}
            >
              ← Food Database
            </Link>

            <p style={styles.eyebrow}>
              TOKYO GUIDE ADMIN
            </p>

            <h1 style={styles.title}>
              Edit Food ✦
            </h1>

            <p style={styles.subtitle}>
              Edit food information and its linked place.
            </p>
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            style={styles.saveButton}
          >
            {saving
              ? "Saving..."
              : "Save Changes ✦"}
          </button>
        </div>

        {errorMessage && (
          <div style={styles.errorMessage}>
            {errorMessage}
          </div>
        )}

        {successMessage && (
          <div style={styles.successMessage}>
            {successMessage}
          </div>
        )}

        <div style={styles.card}>
          {/* ============================================ */}
          {/* BASIC INFORMATION */}
          {/* ============================================ */}

          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>
              Basic Information
            </h2>

            <div style={styles.grid}>
              <div style={styles.fullField}>
                <label style={styles.label}>
                  Food Name *
                </label>

                <input
                  value={name}
                  onChange={(e) =>
                    setName(e.target.value)
                  }
                  placeholder="e.g. Strawberry Kakigori"
                  style={styles.input}
                />
              </div>

              <div style={styles.field}>
                <label style={styles.label}>
                  Category
                </label>

                <select
                  value={categoryId}
                  onChange={(e) =>
                    setCategoryId(e.target.value)
                  }
                  style={styles.select}
                >
                  <option value="">
                    Select category
                  </option>

                  {categories.map((category) => (
                    <option
                      key={category.id}
                      value={category.id}
                    >
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              <div style={styles.field}>
                <label style={styles.label}>
                  Place
                </label>

                <select
                  value={placeId}
                  onChange={(e) =>
                    setPlaceId(e.target.value)
                  }
                  style={styles.select}
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

                <p style={styles.help}>
                  This food is linked directly to one registered place.
                </p>
              </div>
            </div>
          </div>

          <div style={styles.divider} />

          {/* ============================================ */}
          {/* DESCRIPTION */}
          {/* ============================================ */}

          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>
              Description
            </h2>

            <label style={styles.label}>
              Description
            </label>

            <textarea
              value={description}
              onChange={(e) =>
                setDescription(e.target.value)
              }
              placeholder="Tell visitors what makes this food special..."
              style={styles.textarea}
            />
          </div>

          <div style={styles.divider} />

          {/* ============================================ */}
          {/* IMAGE */}
          {/* ============================================ */}

          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>
              Image
            </h2>

            <label style={styles.label}>
              Image URL
            </label>

            <input
              value={imageUrl}
              onChange={(e) =>
                setImageUrl(e.target.value)
              }
              placeholder="https://..."
              style={styles.input}
            />

            {imageUrl && (
              <div style={styles.imagePreview}>
                <img
                  src={imageUrl}
                  alt={name || "Food preview"}
                  style={styles.image}
                />
              </div>
            )}
          </div>

          <div style={styles.divider} />

          {/* ============================================ */}
          {/* PUBLISHING */}
          {/* ============================================ */}

          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>
              Publishing
            </h2>

            <div style={styles.grid}>
              <div style={styles.field}>
                <label style={styles.label}>
                  Editor Pick
                </label>

                <select
                  value={editorPick}
                  onChange={(e) =>
                    setEditorPick(
                      Number(e.target.value)
                    )
                  }
                  style={styles.select}
                >
                  <option value={0}>
                    Not selected
                  </option>

                  <option value={1}>★</option>
                  <option value={2}>★★</option>
                  <option value={3}>★★★</option>
                  <option value={4}>★★★★</option>
                  <option value={5}>★★★★★</option>
                </select>
              </div>

              <div style={styles.field}>
                <label style={styles.label}>
                  Status
                </label>

                <select
                  value={status}
                  onChange={(e) =>
                    setStatus(e.target.value)
                  }
                  style={styles.select}
                >
                  <option value="active">
                    Active
                  </option>

                  <option value="hidden">
                    Hidden
                  </option>

                  <option value="archived">
                    Archived
                  </option>
                </select>
              </div>
            </div>
          </div>

          {/* ============================================ */}
          {/* ACTIONS */}
          {/* ============================================ */}

          <div style={styles.bottom}>
            <button
              onClick={handleDelete}
              disabled={deleting || saving}
              style={styles.deleteButton}
            >
              {deleting
                ? "Deleting..."
                : "Delete Food"}
            </button>

            <div style={styles.bottomRight}>
              <Link
                href="/admin/food"
                style={styles.cancelButton}
              >
                Cancel
              </Link>

              <button
                onClick={handleSave}
                disabled={saving || deleting}
                style={styles.saveButton}
              >
                {saving
                  ? "Saving..."
                  : "Save Changes ✦"}
              </button>
            </div>
          </div>
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
    maxWidth: "1000px",
    margin: "0 auto",
  },

  loading: {
    padding: "120px 20px",
    textAlign: "center",
    color: "#967c8d",
  },

  topBar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-end",
    gap: "24px",
    marginBottom: "28px",
  },

  backLink: {
    display: "inline-block",
    marginBottom: "22px",
    textDecoration: "none",
    color: "#a06c86",
    fontSize: "14px",
    fontWeight: 700,
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

  card: {
    background: "rgba(255,255,255,0.9)",
    border: "1px solid #eedfe7",
    borderRadius: "24px",
    padding: "32px",
    boxShadow:
      "0 12px 40px rgba(169,119,145,0.08)",
  },

  section: {
    padding: "4px 0",
  },

  sectionTitle: {
    margin: "0 0 24px",
    fontSize: "20px",
  },

  grid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(260px, 1fr))",
    gap: "20px",
  },

  field: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },

  fullField: {
    gridColumn: "1 / -1",
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },

  label: {
    fontSize: "13px",
    fontWeight: 800,
    color: "#705c68",
  },

  input: {
    width: "100%",
    height: "48px",
    padding: "0 14px",
    borderRadius: "12px",
    border: "1px solid #eadce5",
    background: "#fff",
    outline: "none",
    boxSizing: "border-box",
    fontSize: "14px",
  },

  select: {
    width: "100%",
    height: "48px",
    padding: "0 14px",
    borderRadius: "12px",
    border: "1px solid #eadce5",
    background: "#fff",
    outline: "none",
    fontSize: "14px",
  },

  textarea: {
    width: "100%",
    minHeight: "140px",
    padding: "14px",
    borderRadius: "12px",
    border: "1px solid #eadce5",
    background: "#fff",
    outline: "none",
    boxSizing: "border-box",
    resize: "vertical",
    fontSize: "14px",
    fontFamily: "inherit",
  },

  help: {
    margin: 0,
    color: "#aa929f",
    fontSize: "11px",
    lineHeight: 1.5,
  },

  divider: {
    height: "1px",
    background: "#f1e6eb",
    margin: "32px 0",
  },

  imagePreview: {
    marginTop: "18px",
    borderRadius: "16px",
    overflow: "hidden",
    maxWidth: "420px",
    border: "1px solid #eedfe7",
  },

  image: {
    width: "100%",
    display: "block",
    maxHeight: "320px",
    objectFit: "cover",
  },

  bottom: {
    marginTop: "38px",
    paddingTop: "24px",
    borderTop: "1px solid #f1e6eb",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "20px",
  },

  bottomRight: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },

  cancelButton: {
    textDecoration: "none",
    color: "#927987",
    fontSize: "14px",
    fontWeight: 700,
    padding: "14px 18px",
  },

  saveButton: {
    border: "none",
    padding: "14px 22px",
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

  deleteButton: {
    border: "1px solid #f0c9d0",
    padding: "13px 18px",
    borderRadius: "14px",
    background: "#fff5f6",
    color: "#bd6172",
    fontWeight: 800,
    cursor: "pointer",
    fontSize: "13px",
  },

  errorMessage: {
    marginBottom: "20px",
    padding: "15px 18px",
    borderRadius: "14px",
    background: "#fff0f2",
    border: "1px solid #f2c3cc",
    color: "#ad5367",
  },

  successMessage: {
    marginBottom: "20px",
    padding: "15px 18px",
    borderRadius: "14px",
    background: "#f2fff7",
    border: "1px solid #c9ead7",
    color: "#4f9670",
  },
};