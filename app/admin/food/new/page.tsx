"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Category = {
  id: number;
  name: string;
};

type Place = {
  id: string;
  name: string;
};

export default function NewFoodPage() {
  const router = useRouter();

  const [siteId, setSiteId] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [places, setPlaces] = useState<Place[]>([]);

  const [name, setName] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [placeId, setPlaceId] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [editorPick, setEditorPick] = useState(0);
  const [status, setStatus] = useState("active");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const { data: site, error } = await supabase
        .from("sites")
        .select("id")
        .eq("slug", "tokyo-guide")
        .single();

      if (error || !site) {
        throw error || new Error("Site not found.");
      }

      setSiteId(site.id);

      const [categoryResult, placeResult] =
        await Promise.all([
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
        ]);

      if (categoryResult.error) throw categoryResult.error;
      if (placeResult.error) throw placeResult.error;

      setCategories(categoryResult.data ?? []);
      setPlaces(placeResult.data ?? []);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Failed to load data."
      );
    } finally {
      setLoading(false);
    }
  }

  async function saveFood() {
    setErrorMessage("");

    if (!name.trim()) {
      setErrorMessage("Please enter a food name.");
      return;
    }

    setSaving(true);

    try {
      const { data, error } = await supabase
        .from("foods")
        .insert({
          site_id: siteId,
          name: name.trim(),
          category_id: categoryId
            ? Number(categoryId)
            : null,
          place_id: placeId || null,
          description: description.trim() || null,
          image_url: imageUrl.trim() || null,
          editor_pick: editorPick,
          status,
        })
        .select("id")
        .single();

      if (error || !data) {
        throw error || new Error("Failed to save food.");
      }

      router.push(`/admin/food/${data.id}`);
      router.refresh();
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
    return <main style={styles.page}>Loading...</main>;
  }

  return (
    <main style={styles.page}>
      <div style={styles.container}>

        <Link href="/admin/food" style={styles.back}>
          ← Food Database
        </Link>

        <h1 style={styles.title}>Add New Food ✦</h1>

        {errorMessage && (
          <div style={styles.error}>
            {errorMessage}
          </div>
        )}

        <div style={styles.card}>

          <label style={styles.label}>Food Name *</label>

          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={styles.input}
          />

          <label style={styles.label}>Category</label>

          <select
            value={categoryId}
            onChange={(e) =>
              setCategoryId(e.target.value)
            }
            style={styles.input}
          >
            <option value="">Select category</option>

            {categories.map((category) => (
              <option
                key={category.id}
                value={category.id}
              >
                {category.name}
              </option>
            ))}
          </select>

          <label style={styles.label}>Place</label>

          <select
            value={placeId}
            onChange={(e) =>
              setPlaceId(e.target.value)
            }
            style={styles.input}
          >
            <option value="">No place selected</option>

            {places.map((place) => (
              <option
                key={place.id}
                value={place.id}
              >
                {place.name}
              </option>
            ))}
          </select>

          <label style={styles.label}>Description</label>

          <textarea
            value={description}
            onChange={(e) =>
              setDescription(e.target.value)
            }
            style={styles.textarea}
          />

          <label style={styles.label}>Photo URL</label>

          <input
            value={imageUrl}
            onChange={(e) =>
              setImageUrl(e.target.value)
            }
            placeholder="https://..."
            style={styles.input}
          />

          {imageUrl && (
            <img
              src={imageUrl}
              alt="Preview"
              style={styles.preview}
            />
          )}

          <label style={styles.label}>Editor Pick</label>

          <select
            value={editorPick}
            onChange={(e) =>
              setEditorPick(Number(e.target.value))
            }
            style={styles.input}
          >
            {[0, 1, 2, 3, 4, 5].map((n) => (
              <option key={n} value={n}>
                {n === 0 ? "Not selected" : "★".repeat(n)}
              </option>
            ))}
          </select>

          <label style={styles.label}>Status</label>

          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            style={styles.input}
          >
            <option value="active">Active</option>
            <option value="hidden">Hidden</option>
            <option value="archived">Archived</option>
          </select>

          <div style={styles.bottom}>
            <Link href="/admin/food" style={styles.cancel}>
              Cancel
            </Link>

            <button
              onClick={saveFood}
              disabled={saving}
              style={styles.save}
            >
              {saving ? "Saving..." : "Save Food ✦"}
            </button>
          </div>

        </div>
      </div>
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    padding: 40,
    background: "#fff8fb",
  },

  container: {
    maxWidth: 800,
    margin: "0 auto",
  },

  back: {
    color: "#9a6078",
    textDecoration: "none",
  },

  title: {
    margin: "25px 0",
    color: "#463c46",
  },

  card: {
    background: "#fff",
    padding: 30,
    borderRadius: 20,
    border: "1px solid #eadde4",
  },

  label: {
    display: "block",
    marginTop: 20,
    marginBottom: 8,
    fontWeight: 700,
    color: "#705b67",
  },

  input: {
    width: "100%",
    padding: 13,
    borderRadius: 10,
    border: "1px solid #dfd3da",
    boxSizing: "border-box",
  },

  textarea: {
    width: "100%",
    minHeight: 120,
    padding: 13,
    borderRadius: 10,
    border: "1px solid #dfd3da",
    boxSizing: "border-box",
  },

  preview: {
    width: "100%",
    maxWidth: 350,
    marginTop: 15,
    borderRadius: 12,
  },

  bottom: {
    display: "flex",
    justifyContent: "space-between",
    marginTop: 30,
  },

  cancel: {
    padding: "13px 20px",
    color: "#806878",
  },

  save: {
    padding: "13px 22px",
    border: 0,
    borderRadius: 12,
    background: "#d98eae",
    color: "#fff",
    fontWeight: 700,
  },

  error: {
    background: "#fff0f2",
    color: "#b45165",
    padding: 15,
    borderRadius: 12,
  },
};