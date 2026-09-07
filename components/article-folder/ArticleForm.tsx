"use client";

import { useEffect, useState } from "react";

import ArticleEditor from "./ArticleEditor";
import ImageUploader from "@/components/ImageUploader";
import { supabase } from "@/lib/supabase";

export type ArticleStatus =
  | "draft"
  | "published"
  | "hidden"
  | "archived";

export type ArticleFormData = {
  title: string;
  category: string;
  coverImage: string;
  content: string;
  status: ArticleStatus;
  selectedPlaceIds: string[];
  selectedProductIds: string[];
};

type Place = {
  id: string;
  name: string;
};

type Product = {
  id: string;
  name: string;
};

type ArticleFormProps = {
  initialData?: Partial<ArticleFormData>;
  submitLabel: string;
  saving?: boolean;
  message?: string;
  onSubmit: (data: ArticleFormData) => Promise<void>;
};

export default function ArticleForm({
  initialData,
  submitLabel,
  saving = false,
  message = "",
  onSubmit,
}: ArticleFormProps) {
  const [title, setTitle] = useState(
    initialData?.title ?? ""
  );

  const [category, setCategory] = useState(
    initialData?.category ?? ""
  );

  const [coverImage, setCoverImage] = useState(
    initialData?.coverImage ?? ""
  );

  const [content, setContent] = useState(
    initialData?.content ?? ""
  );

  const [status, setStatus] = useState<ArticleStatus>(
    initialData?.status ?? "draft"
  );

  const [places, setPlaces] = useState<Place[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  const [selectedPlaceIds, setSelectedPlaceIds] =
    useState<string[]>(
      initialData?.selectedPlaceIds ?? []
    );

  const [selectedProductIds, setSelectedProductIds] =
    useState<string[]>(
      initialData?.selectedProductIds ?? []
    );

  const [loadingOptions, setLoadingOptions] =
    useState(true);

  const [error, setError] = useState("");

  useEffect(() => {
    async function loadOptions() {
      setLoadingOptions(true);

      const [placesResult, productsResult] =
        await Promise.all([
          supabase
            .from("places")
            .select("id, name")
            .eq("status", "published")
            .order("name"),

          supabase
            .from("products")
            .select("id, name")
            .eq("status", "published")
            .order("name"),
        ]);

      if (placesResult.error) {
        setError(
          `Placeの読み込みに失敗しました: ${placesResult.error.message}`
        );
      }

      if (productsResult.error) {
        setError(
          `Productの読み込みに失敗しました: ${productsResult.error.message}`
        );
      }

      setPlaces(
        (placesResult.data ?? []) as Place[]
      );

      setProducts(
        (productsResult.data ?? []) as Product[]
      );

      setLoadingOptions(false);
    }

    loadOptions();
  }, []);

  function togglePlace(id: string) {
    setSelectedPlaceIds((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id]
    );
  }

  function toggleProduct(id: string) {
    setSelectedProductIds((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id]
    );
  }

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!title.trim()) {
      setError("Titleを入力してください。");
      return;
    }

    setError("");

    await onSubmit({
      title: title.trim(),
      category: category.trim(),
      coverImage: coverImage.trim(),
      content,
      status,
      selectedPlaceIds,
      selectedProductIds,
    });
  }

  if (loadingOptions) {
    return (
      <div style={styles.loading}>
        Loading...
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      style={styles.form}
    >
      {error && (
        <div style={styles.error}>
          {error}
        </div>
      )}

      <section style={styles.section}>
        <h2 style={styles.sectionTitle}>
          Basic Information
        </h2>

        <label style={styles.label}>
          Title *

          <input
            style={styles.input}
            value={title}
            onChange={(event) =>
              setTitle(event.target.value)
            }
            placeholder="10 Cute Things to Buy in Tokyo"
          />
        </label>

        <label style={styles.label}>
          Category

          <input
            style={styles.input}
            value={category}
            onChange={(event) =>
              setCategory(event.target.value)
            }
            placeholder="Shopping"
          />
        </label>
      </section>

      <section style={styles.section}>
        <h2 style={styles.sectionTitle}>
          Cover Image
        </h2>

        <ImageUploader
          value={coverImage}
          onChange={setCoverImage}
          folder="article-covers"
          label="Cover Image"
        />

        {coverImage && (
          <div style={styles.coverPreview}>
            <img
              src={coverImage}
              alt="Article cover preview"
              style={styles.coverPreviewImage}
            />
          </div>
        )}
      </section>

      <section style={styles.section}>
        <h2 style={styles.sectionTitle}>
          Body
        </h2>

        <ArticleEditor
          value={content}
          onChange={setContent}
        />
      </section>

      <section style={styles.section}>
        <h2 style={styles.sectionTitle}>
          Related Places
        </h2>

        {places.length === 0 ? (
          <p style={styles.empty}>
            Published Placeがまだありません。
          </p>
        ) : (
          <div style={styles.selectionList}>
            {places.map((place) => (
              <label
                key={place.id}
                style={styles.selectionItem}
              >
                <input
                  type="checkbox"
                  checked={selectedPlaceIds.includes(
                    place.id
                  )}
                  onChange={() =>
                    togglePlace(place.id)
                  }
                />

                <span>{place.name}</span>
              </label>
            ))}
          </div>
        )}
      </section>

      <section style={styles.section}>
        <h2 style={styles.sectionTitle}>
          Related Products
        </h2>

        {products.length === 0 ? (
          <p style={styles.empty}>
            Published Productがまだありません。
          </p>
        ) : (
          <div style={styles.selectionList}>
            {products.map((product) => (
              <label
                key={product.id}
                style={styles.selectionItem}
              >
                <input
                  type="checkbox"
                  checked={selectedProductIds.includes(
                    product.id
                  )}
                  onChange={() =>
                    toggleProduct(product.id)
                  }
                />

                <span>{product.name}</span>
              </label>
            ))}
          </div>
        )}
      </section>

      <section style={styles.section}>
        <h2 style={styles.sectionTitle}>
          Publishing
        </h2>

        <label style={styles.label}>
          Status

          <select
            style={styles.input}
            value={status}
            onChange={(event) =>
              setStatus(
                event.target.value as ArticleStatus
              )
            }
          >
            <option value="draft">Draft</option>
            <option value="published">
              Published
            </option>
            <option value="hidden">Hidden</option>
            <option value="archived">
              Archived
            </option>
          </select>
        </label>
      </section>

      <div style={styles.bottomBar}>
        <button
          type="submit"
          disabled={saving}
          style={{
            ...styles.saveButton,
            opacity: saving ? 0.6 : 1,
          }}
        >
          {saving ? "Saving..." : submitLabel}
        </button>

        {message && (
          <span style={styles.message}>
            {message}
          </span>
        )}
      </div>
    </form>
  );
}

const styles = {
  form: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "18px",
  },

  section: {
    padding: "22px",
    border: "1px solid #e7e0dc",
    borderRadius: "15px",
    background: "#fff",
  },

  sectionTitle: {
    margin: "0 0 18px",
    fontFamily: "Georgia, serif",
    fontSize: "24px",
    fontWeight: 400,
  },

  label: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "7px",
    marginBottom: "16px",
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

  coverPreview: {
    marginTop: "18px",
    overflow: "hidden",
    border: "1px solid #e8e1de",
    borderRadius: "12px",
  },

  coverPreviewImage: {
    display: "block",
    width: "100%",
    maxHeight: "420px",
    objectFit: "cover" as const,
  },

  selectionList: {
    display: "grid",
    gridTemplateColumns:
      "repeat(2, minmax(0, 1fr))",
    gap: "8px 18px",
    maxHeight: "360px",
    overflowY: "auto" as const,
    padding: "12px 14px",
    border: "1px solid #eee8e4",
    borderRadius: "10px",
  },

  selectionItem: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "7px 0",
    fontSize: "13px",
    cursor: "pointer",
  },

  empty: {
    color: "#888",
    fontSize: "13px",
  },

  bottomBar: {
    display: "flex",
    alignItems: "center",
    gap: "18px",
    flexWrap: "wrap" as const,
  },

  saveButton: {
    padding: "15px 22px",
    border: 0,
    borderRadius: "10px",
    background: "#222",
    color: "#fff",
    fontSize: "14px",
    cursor: "pointer",
  },

  message: {
    color: "#c8647b",
    fontSize: "13px",
  },

  error: {
    padding: "12px 14px",
    border: "1px solid #e5cccc",
    borderRadius: "10px",
    background: "#fff8f8",
    color: "#a44",
    fontSize: "13px",
  },

  loading: {
    padding: "50px",
    textAlign: "center" as const,
    color: "#888",
  },
};