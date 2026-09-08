"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";

import { supabase } from "../../../../lib/supabase";
import ImageUploader from "../../../../components/ImageUploader";

type FoodStatus = "active" | "hidden" | "archived";

type Category = {
  id: number;
  name: string;
  parent_id: number | null;
};

type CategoryNode = Category & {
  children: CategoryNode[];
};

type Place = {
  id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  place_type_id: number | null;
  area_id: number | null;
  status: string | null;
};

type PlaceType = {
  id: number;
  name: string;
};

export default function EditFoodPage() {
  const params = useParams();
  const foodId = String(params.id);

  // =====================================
  // FOOD
  // =====================================

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");

  const [categoryInput, setCategoryInput] = useState("");
  const [categoryId, setCategoryId] = useState("");

  const [editorPick, setEditorPick] = useState("0");

  const [status, setStatus] =
    useState<FoodStatus>("active");

  // =====================================
  // DATA
  // =====================================

  const [categories, setCategories] =
    useState<Category[]>([]);

  const [places, setPlaces] =
    useState<Place[]>([]);

  const [placeTypes, setPlaceTypes] =
    useState<PlaceType[]>([]);

  // =====================================
  // FOOD ↔ PLACE
  // =====================================

  const [selectedPlaceIds, setSelectedPlaceIds] =
    useState<string[]>([]);

  // =====================================
  // UI
  // =====================================

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [message, setMessage] =
    useState("");

  const [placeSearch, setPlaceSearch] =
    useState("");

  // =====================================
  // LOAD
  // =====================================

  useEffect(() => {
    async function load() {
      setLoading(true);
      setMessage("");

      const [
        foodResult,
        categoriesResult,
        placesResult,
        placeTypesResult,
        relationsResult,
      ] = await Promise.all([
        supabase
          .from("foods")
          .select("*")
          .eq("id", foodId)
          .single(),

        supabase
          .from("food_categories")
          .select("id, name, parent_id")
          .eq("is_active", true)
          .order("sort_order")
          .order("name"),

        supabase
          .from("places")
          .select(`
            id,
            name,
            description,
            image_url,
            place_type_id,
            area_id,
            status
          `)
          .in("status", [
            "draft",
            "published",
          ])
          .order("name"),

        supabase
          .from("place_types")
          .select("id, name")
          .eq("is_active", true)
          .order("sort_order")
          .order("name"),

        supabase
          .from("place_foods")
          .select("place_id")
          .eq("food_id", foodId),
      ]);

      // =====================================
      // FOOD
      // =====================================

      if (
        foodResult.error ||
        !foodResult.data
      ) {
        setMessage(
          `Foodを読み込めませんでした: ${
            foodResult.error?.message ??
            "Unknown error"
          }`
        );

        setLoading(false);
        return;
      }

      const food = foodResult.data;

      setName(food.name ?? "");

      setDescription(
        food.description ?? ""
      );

      setImageUrl(
        food.image_url ?? ""
      );

      setEditorPick(
        String(food.editor_pick ?? 0)
      );

      if (
        food.status === "active" ||
        food.status === "hidden" ||
        food.status === "archived"
      ) {
        setStatus(food.status);
      } else {
        setStatus("active");
      }

      // =====================================
      // CATEGORIES
      // =====================================

      const loadedCategories =
        (categoriesResult.data ?? []) as Category[];

      setCategories(loadedCategories);

      const matchedCategory =
        loadedCategories.find(
          (category) =>
            String(category.id) ===
            String(food.category_id ?? "")
        );

      setCategoryId(
        matchedCategory
          ? String(matchedCategory.id)
          : ""
      );

      setCategoryInput(
        matchedCategory?.name ?? ""
      );

      // =====================================
      // PLACES
      // =====================================

      setPlaces(
        (placesResult.data ?? []) as Place[]
      );

      setPlaceTypes(
        (placeTypesResult.data ?? []) as PlaceType[]
      );

      // =====================================
      // RELATIONS
      // =====================================

      setSelectedPlaceIds(
        (relationsResult.data ?? []).map(
          (row: { place_id: string | number }) =>
            String(row.place_id)
        )
      );

      const errors = [
        categoriesResult.error,
        placesResult.error,
        placeTypesResult.error,
        relationsResult.error,
      ].filter(Boolean);

      if (errors.length > 0) {
        setMessage(
          `一部データの読み込みに失敗しました: ${
            errors[0]!.message
          }`
        );
      }

      setLoading(false);
    }

    load();
  }, [foodId]);

  // =====================================
  // CATEGORY TREE
  // =====================================

  const categoryTree = useMemo(() => {
    const nodes =
      new Map<number, CategoryNode>();

    categories.forEach((category) => {
      nodes.set(category.id, {
        ...category,
        children: [],
      });
    });

    const roots: CategoryNode[] = [];

    categories.forEach((category) => {
      const node =
        nodes.get(category.id);

      if (!node) return;

      if (
        category.parent_id !== null &&
        nodes.has(category.parent_id)
      ) {
        nodes
          .get(category.parent_id)!
          .children.push(node);
      } else {
        roots.push(node);
      }
    });

    return roots;
  }, [categories]);

  // =====================================
  // CATEGORY
  // =====================================

  function handleCategoryChange(
    value: string
  ) {
    setCategoryInput(value);

    const existing =
      categories.find(
        (category) =>
          category.name
            .trim()
            .toLowerCase() ===
          value
            .trim()
            .toLowerCase()
      );

    setCategoryId(
      existing
        ? String(existing.id)
        : ""
    );
  }

  function renderCategory(
    category: CategoryNode,
    level = 0
  ): React.ReactNode {
    return (
      <div key={category.id}>
        <label
          style={{
            ...styles.categoryOption,
            marginLeft: `${level * 20}px`,
          }}
        >
          <input
            type="radio"
            name="food-category"
            checked={
              categoryId ===
              String(category.id)
            }
            onChange={() => {
              setCategoryId(
                String(category.id)
              );

              setCategoryInput(
                category.name
              );
            }}
          />

          {category.name}
        </label>

        {category.children.map((child) =>
          renderCategory(
            child,
            level + 1
          )
        )}
      </div>
    );
  }

  // =====================================
  // PLACE SEARCH
  // =====================================

  const filteredPlaces = useMemo(() => {
    const keyword =
      placeSearch.trim().toLowerCase();

    if (!keyword) {
      return places;
    }

    return places.filter((place) => {
      const type =
        placeTypes.find(
          (item) =>
            item.id === place.place_type_id
        );

      return (
        place.name
          .toLowerCase()
          .includes(keyword) ||
        type?.name
          .toLowerCase()
          .includes(keyword)
      );
    });
  }, [
    places,
    placeTypes,
    placeSearch,
  ]);

  // =====================================
  // PLACE TOGGLE
  // =====================================

  function togglePlace(
    placeId: string
  ) {
    setSelectedPlaceIds((current) =>
      current.includes(placeId)
        ? current.filter(
            (id) => id !== placeId
          )
        : [...current, placeId]
    );
  }

  // =====================================
  // SAVE
  // =====================================

  async function handleSave(
    e: React.FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    if (!name.trim()) {
      setMessage(
        "Food nameを入力してください。"
      );
      return;
    }

    setSaving(true);
    setMessage("保存中...");

    try {
      // =====================================
      // SITE
      // =====================================

      const {
        data: site,
        error: siteError,
      } = await supabase
        .from("sites")
        .select("id")
        .eq("slug", "tokyo-guide")
        .single();

      if (
        siteError ||
        !site
      ) {
        throw new Error(
          `サイト情報を取得できませんでした: ${
            siteError?.message ??
            "Unknown error"
          }`
        );
      }

      // =====================================
      // CATEGORY
      // =====================================

      let resolvedCategoryId:
        | number
        | null = null;

      const trimmedCategory =
        categoryInput.trim();

      if (trimmedCategory) {
        const existing =
          categories.find(
            (category) =>
              category.name
                .trim()
                .toLowerCase() ===
              trimmedCategory.toLowerCase()
          );

        if (existing) {
          resolvedCategoryId =
            existing.id;
        } else {
          const {
            data: newCategory,
            error: categoryError,
          } = await supabase
            .from("food_categories")
            .insert({
              site_id: site.id,
              name: trimmedCategory,
              parent_id: null,
              sort_order: 0,
              is_active: true,
            })
            .select("id")
            .single();

          if (
            categoryError ||
            !newCategory
          ) {
            throw new Error(
              `カテゴリの作成に失敗しました: ${
                categoryError?.message ??
                "Unknown error"
              }`
            );
          }

          resolvedCategoryId =
            newCategory.id;
        }
      }

      // =====================================
      // FOOD
      // =====================================

      const {
        error: foodError,
      } = await supabase
        .from("foods")
        .update({
          category_id:
            resolvedCategoryId,

          name:
            name.trim(),

          description:
            description.trim() || null,

          image_url:
            imageUrl.trim() || null,

          editor_pick:
            Number(editorPick),

          status,
        })
        .eq("id", foodId);

      if (foodError) {
        throw new Error(
          `Foodの更新に失敗しました: ${foodError.message}`
        );
      }

      // =====================================
      // FOOD ↔ PLACE
      // =====================================

      const {
        error: deleteError,
      } = await supabase
        .from("place_foods")
        .delete()
        .eq("food_id", foodId);

      if (deleteError) {
        throw new Error(
          `店舗紐付けの更新に失敗しました: ${deleteError.message}`
        );
      }

      if (
        selectedPlaceIds.length > 0
      ) {
        const rows =
          selectedPlaceIds.map(
            (placeId) => ({
              food_id: foodId,
              place_id: placeId,
            })
          );

        const {
          error: relationError,
        } = await supabase
          .from("place_foods")
          .insert(rows);

        if (relationError) {
          throw new Error(
            `店舗の紐付けに失敗しました: ${relationError.message}`
          );
        }
      }

      setMessage(
        "Foodを保存しました。"
      );
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
  // LOADING
  // =====================================

  if (loading) {
    return (
      <main style={styles.loadingPage}>
        読み込み中...
      </main>
    );
  }

  return (
    <main style={styles.main}>
      <div style={styles.container}>

        <div style={styles.topbar}>
          <Link
            href="/admin/food"
            style={styles.back}
          >
            ← Foods
          </Link>

          <Link
            href={`/food/${foodId}`}
            target="_blank"
            rel="noopener noreferrer"
            style={styles.preview}
          >
            Preview ↗
          </Link>
        </div>

        <header style={styles.header}>
          <p style={styles.eyebrow}>
            CONTENT / FOODS
          </p>

          <h1 style={styles.title}>
            Edit Food
          </h1>

          <p style={styles.description}>
            食べ物そのものを登録します。
            店舗情報はPlaceで管理し、
            このFoodを提供しているPlaceだけを紐付けます。
          </p>
        </header>

        <form
          onSubmit={handleSave}
          style={styles.form}
        >

          {/* =====================================
              FOOD
          ===================================== */}

          <section style={styles.section}>

            <h2 style={styles.sectionTitle}>
              Food
            </h2>

            <label style={styles.label}>
              Food name *

              <input
                style={styles.input}
                value={name}
                onChange={(e) =>
                  setName(e.target.value)
                }
                required
              />
            </label>

            <label style={styles.label}>
              Category

              <input
                style={styles.input}
                list="food-category-options"
                value={categoryInput}
                onChange={(e) =>
                  handleCategoryChange(
                    e.target.value
                  )
                }
                placeholder="Dessert"
              />

              <datalist
                id="food-category-options"
              >
                {categories.map(
                  (category) => (
                    <option
                      key={category.id}
                      value={category.name}
                    />
                  )
                )}
              </datalist>

              <div
                style={styles.categoryTree}
              >
                {categoryTree.map(
                  (category) =>
                    renderCategory(category)
                )}
              </div>
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

            <ImageUploader
              value={imageUrl}
              onChange={setImageUrl}
              folder="foods"
              label="Food Image"
            />

          </section>

          {/* =====================================
              AVAILABLE AT
          ===================================== */}

          <section style={styles.section}>

            <div style={styles.sectionHeader}>

              <div>
                <h2
                  style={styles.sectionTitle}
                >
                  Available at
                </h2>

                <p style={styles.helper}>
                  このFoodを提供している既存のPlaceを選択します。
                  Placeの新規登録はPlace管理ページで行います。
                </p>
              </div>

              <Link
                href="/admin/place"
                style={styles.placeLink}
              >
                Manage Places →
              </Link>

            </div>

            <input
              style={styles.input}
              value={placeSearch}
              onChange={(e) =>
                setPlaceSearch(
                  e.target.value
                )
              }
              placeholder="Search places..."
            />

            <div style={styles.placeList}>

              {filteredPlaces.length === 0 ? (

                <p style={styles.muted}>
                  Placeが見つかりません。
                </p>

              ) : (

                filteredPlaces.map(
                  (place) => {

                    const type =
                      placeTypes.find(
                        (item) =>
                          item.id ===
                          place.place_type_id
                      );

                    return (

                      <label
                        key={place.id}
                        style={styles.placeOption}
                      >

                        <input
                          type="checkbox"
                          checked={
                            selectedPlaceIds.includes(
                              place.id
                            )
                          }
                          onChange={() =>
                            togglePlace(
                              place.id
                            )
                          }
                        />

                        {place.image_url && (

                          <img
                            src={place.image_url}
                            alt={place.name}
                            style={
                              styles.placeImage
                            }
                          />

                        )}

                        <span
                          style={styles.placeInfo}
                        >

                          <strong>
                            {place.name}
                          </strong>

                          {type && (

                            <span
                              style={
                                styles.placeMeta
                              }
                            >
                              {type.name}
                            </span>

                          )}

                        </span>

                      </label>

                    );
                  }
                )

              )}

            </div>

          </section>

          {/* =====================================
              PUBLISHING
          ===================================== */}

          <section style={styles.section}>

            <h2 style={styles.sectionTitle}>
              Publishing
            </h2>

            <label style={styles.label}>
              Editor's Pick

              <select
                style={styles.input}
                value={editorPick}
                onChange={(e) =>
                  setEditorPick(
                    e.target.value
                  )
                }
              >
                <option value="0">
                  ☆☆☆☆☆
                </option>
                <option value="1">
                  ★☆☆☆☆
                </option>
                <option value="2">
                  ★★☆☆☆
                </option>
                <option value="3">
                  ★★★☆☆
                </option>
                <option value="4">
                  ★★★★☆
                </option>
                <option value="5">
                  ★★★★★
                </option>
              </select>
            </label>

            <label style={styles.label}>
              Status

              <select
                style={styles.input}
                value={status}
                onChange={(e) =>
                  setStatus(
                    e.target.value as FoodStatus
                  )
                }
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
            </label>

          </section>

          {/* =====================================
              SAVE
          ===================================== */}

          <div style={styles.bottomBar}>

            <button
              type="submit"
              disabled={saving}
              style={{
                ...styles.saveButton,
                opacity:
                  saving ? 0.6 : 1,
              }}
            >
              {saving
                ? "Saving..."
                : "Save Changes"}
            </button>

            {message && (

              <span style={styles.message}>
                {message}
              </span>

            )}

          </div>

        </form>
      </div>
    </main>
  );
}

const styles = {

  main: {
    minHeight: "100vh",
    background: "#faf8f6",
    color: "#222",
    padding: "35px 24px 100px",
  },

  loadingPage: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#faf8f6",
    color: "#888",
  },

  container: {
    maxWidth: "900px",
    margin: "0 auto",
  },

  topbar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },

  back: {
    color: "#777",
    textDecoration: "none",
    fontSize: "13px",
  },

  preview: {
    color: "#777",
    textDecoration: "none",
    fontSize: "12px",
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

  form: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "18px",
  },

  section: {
    background: "#fff",
    border: "1px solid #e7e0dc",
    borderRadius: "15px",
    padding: "22px",
  },

  sectionHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "15px",
    marginBottom: "18px",
  },

  sectionTitle: {
    fontFamily: "Georgia, serif",
    fontSize: "24px",
    fontWeight: 400,
    margin: "0 0 10px",
  },

  label: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "7px",
    fontSize: "13px",
    fontWeight: 600,
    marginBottom: "16px",
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
    minHeight: "120px",
    boxSizing: "border-box" as const,
    padding: "12px 13px",
    border: "1px solid #ded7d3",
    borderRadius: "9px",
    background: "#fff",
    fontSize: "14px",
    resize: "vertical" as const,
  },

  categoryTree: {
    border: "1px solid #eee8e4",
    borderRadius: "9px",
    padding: "10px 13px",
    maxHeight: "260px",
    overflowY: "auto" as const,
    marginTop: "5px",
  },

  categoryOption: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "7px 0",
    fontSize: "13px",
    fontWeight: 400,
  },

  helper: {
    color: "#888",
    fontSize: "12px",
    lineHeight: 1.6,
    margin: 0,
  },

  placeLink: {
    border: "1px solid #ddd5d1",
    borderRadius: "9px",
    padding: "10px 13px",
    color: "#555",
    textDecoration: "none",
    fontSize: "12px",
    whiteSpace: "nowrap" as const,
  },

  placeList: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "8px",
    marginTop: "14px",
  },

  placeOption: {
    display: "flex",
    alignItems: "center",
    gap: "13px",
    border: "1px solid #e7e0dc",
    borderRadius: "10px",
    padding: "10px 13px",
    cursor: "pointer",
  },

  placeImage: {
    width: "48px",
    height: "48px",
    borderRadius: "8px",
    objectFit: "cover" as const,
  },

  placeInfo: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "4px",
    fontSize: "13px",
  },

  placeMeta: {
    color: "#999",
    fontSize: "11px",
    fontWeight: 400,
  },

  muted: {
    color: "#888",
    fontSize: "13px",
  },

  bottomBar: {
    display: "flex",
    alignItems: "center",
    gap: "18px",
  },

  saveButton: {
    border: 0,
    borderRadius: "10px",
    background: "#222",
    color: "#fff",
    padding: "15px 22px",
    fontSize: "14px",
    cursor: "pointer",
  },

  message: {
    color: "#c8647b",
    fontSize: "13px",
  },

};