"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import ImageUploader from "@/components/ImageUploader";

type Category = {
  id: number;
  name: string;
  parent_id: number | null;
};

type CategoryNode = Category & {
  children: CategoryNode[];
};

type PlaceGroup = {
  id: string;
  name: string;
};

type Variant = {
  id: string;
  name: string;
  description: string;
  image_url: string;
  price: string;
  groupIds: string[];
};

type ProductStatus =
  | "draft"
  | "published"
  | "hidden"
  | "archived";

export default function NewProductPage() {
  // =====================================
  // Product
  // =====================================

  const [name, setName] = useState("");
  const [brand, setBrand] = useState("");
  const [description, setDescription] =
    useState("");

  const [categoryInput, setCategoryInput] =
    useState("");

  const [categoryId, setCategoryId] =
    useState("");

  const [price, setPrice] = useState("");

  const [japanExclusive, setJapanExclusive] =
    useState(false);

  const [popularityNote, setPopularityNote] =
    useState("");

  const [editorPick, setEditorPick] =
    useState("0");

  const [status, setStatus] =
    useState<ProductStatus>("draft");

  const [officialUrl, setOfficialUrl] =
    useState("");

  const [imageUrl, setImageUrl] =
    useState("");

  // =====================================
  // Options
  // =====================================

  const [categories, setCategories] =
    useState<Category[]>([]);

  const [placeGroups, setPlaceGroups] =
    useState<PlaceGroup[]>([]);

  // =====================================
  // Variants
  // =====================================

  const [variants, setVariants] =
    useState<Variant[]>([]);

  // =====================================
  // UI
  // =====================================

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [message, setMessage] =
    useState("");

  // =====================================
  // Load options
  // =====================================

  useEffect(() => {
    async function loadOptions() {
      setLoading(true);
      setMessage("");

      const [
        categoriesResult,
        groupsResult,
      ] = await Promise.all([
        supabase
          .from("product_categories")
          .select(
            "id, name, parent_id"
          )
          .eq("is_active", true)
          .order("sort_order")
          .order("name"),

        supabase
          .from("place_groups")
          .select("id, name")
          .eq("is_active", true)
          .order("name"),
      ]);

      const errors = [
        categoriesResult.error,
        groupsResult.error,
      ].filter(Boolean);

      if (errors.length > 0) {
        setMessage(
          `選択肢の読み込みに失敗しました: ${
            errors[0]!.message
          }`
        );
      }

      setCategories(
        (categoriesResult.data ??
          []) as Category[]
      );

      setPlaceGroups(
        (groupsResult.data ??
          []) as PlaceGroup[]
      );

      setLoading(false);
    }

    loadOptions();
  }, []);

  // =====================================
  // Category tree
  // =====================================

  const categoryTree =
    useMemo(() => {
      const nodes =
        new Map<
          number,
          CategoryNode
        >();

      categories.forEach(
        (category) => {
          nodes.set(
            category.id,
            {
              ...category,
              children: [],
            }
          );
        }
      );

      const roots: CategoryNode[] =
        [];

      categories.forEach(
        (category) => {
          const node =
            nodes.get(
              category.id
            );

          if (!node) {
            return;
          }

          if (
            category.parent_id !==
              null &&
            nodes.has(
              category.parent_id
            )
          ) {
            nodes
              .get(
                category.parent_id
              )!
              .children.push(
                node
              );
          } else {
            roots.push(node);
          }
        }
      );

      return roots;
    }, [categories]);

  // =====================================
  // Category
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
        ? String(
            existing.id
          )
        : ""
    );
  }

  // =====================================
  // Variants
  // =====================================

  function addVariant() {
    setVariants(
      (current) => [
        ...current,
        {
          id:
            crypto.randomUUID(),
          name: "",
          description: "",
          image_url: "",
          price: "",
          groupIds: [],
        },
      ]
    );
  }

  function updateVariant(
    id: string,
    field:
      | "name"
      | "description"
      | "image_url"
      | "price",
    value: string
  ) {
    setVariants(
      (current) =>
        current.map(
          (variant) =>
            variant.id === id
              ? {
                  ...variant,
                  [field]:
                    value,
                }
              : variant
        )
    );
  }

  function toggleVariantGroup(
    variantId: string,
    groupId: string
  ) {
    setVariants(
      (current) =>
        current.map(
          (variant) => {
            if (
              variant.id !==
              variantId
            ) {
              return variant;
            }

            const exists =
              variant.groupIds.includes(
                groupId
              );

            return {
              ...variant,
              groupIds: exists
                ? variant.groupIds.filter(
                    (id) =>
                      id !==
                      groupId
                  )
                : [
                    ...variant.groupIds,
                    groupId,
                  ],
            };
          }
        )
    );
  }

  function removeVariant(
    id: string
  ) {
    setVariants(
      (current) =>
        current.filter(
          (variant) =>
            variant.id !== id
        )
    );
  }

  // =====================================
  // Resolve category
  // =====================================

  async function resolveCategoryId(
    siteId: string
  ): Promise<number | null> {
    const trimmed =
      categoryInput.trim();

    if (!trimmed) {
      return null;
    }

    const existing =
      categories.find(
        (category) =>
          category.name
            .trim()
            .toLowerCase() ===
          trimmed
            .toLowerCase()
      );

    if (existing) {
      return existing.id;
    }

    const {
      data,
      error,
    } = await supabase
      .from(
        "product_categories"
      )
      .insert({
        site_id: siteId,
        name: trimmed,
        parent_id: null,
        sort_order: 0,
        is_active: true,
      })
      .select("id")
      .single();

    if (
      error ||
      !data
    ) {
      throw new Error(
        `Productカテゴリの作成に失敗しました: ${
          error?.message ??
          "Unknown error"
        }`
      );
    }

    return data.id;
  }

  // =====================================
  // Save
  // =====================================

  async function handleSubmit(
    e: React.FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    if (!name.trim()) {
      setMessage(
        "Product nameを入力してください。"
      );
      return;
    }

    setSaving(true);
    setMessage("保存中...");

    try {
      // ---------------------------------
      // Site
      // ---------------------------------

      const {
        data: site,
        error: siteError,
      } = await supabase
        .from("sites")
        .select("id")
        .eq(
          "slug",
          "tokyo-guide"
        )
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

      // ---------------------------------
      // Category
      // ---------------------------------

      const resolvedCategoryId =
        await resolveCategoryId(
          site.id
        );

      // ---------------------------------
      // Product
      // ---------------------------------

      const {
        data: product,
        error:
          productError,
      } = await supabase
        .from("products")
        .insert({
          site_id:
            site.id,

          category_id:
            resolvedCategoryId,

          name:
            name.trim(),

          brand:
            brand.trim() ||
            null,

          description:
            description.trim() ||
            null,

          image_url:
            imageUrl.trim() ||
            null,

          price:
            price
              ? Number(price)
              : null,

          currency:
            "JPY",

          japan_exclusive:
            japanExclusive,

          popularity_note:
            popularityNote.trim() ||
            null,

          editor_pick:
            Number(
              editorPick
            ),

          status,
          
          official_url:
            officialUrl.trim() ||
            null,
        })
        .select("id")
        .single();

      if (
        productError ||
        !product
      ) {
        throw new Error(
          `Productの保存に失敗しました: ${
            productError?.message ??
            "Unknown error"
          }`
        );
      }

      // ---------------------------------
      // Product ↔ Shop Groups
      // ---------------------------------

      const productGroupIds =
        [
          ...new Set(
            variants.flatMap(
              (variant) =>
                variant.groupIds
            )
          ),
        ];

      if (
        productGroupIds.length >
        0
      ) {
        const productGroupRows =
          productGroupIds.map(
            (groupId) => ({
              product_id:
                product.id,
              group_id:
                groupId,
            })
          );

        const {
          error:
            productGroupError,
        } = await supabase
          .from(
            "product_groups"
          )
          .insert(
            productGroupRows
          );

        if (
          productGroupError
        ) {
          throw new Error(
            `ProductのShop保存に失敗しました: ${productGroupError.message}`
          );
        }
      }

      // ---------------------------------
      // Variants
      // ---------------------------------

      for (
        let index = 0;
        index < variants.length;
        index++
      ) {
        const variant =
          variants[index];

        if (
          !variant.name.trim()
        ) {
          continue;
        }

        const {
          data:
            savedVariant,
          error:
            variantError,
        } = await supabase
          .from(
            "product_variants"
          )
          .insert({
            product_id:
              product.id,

            name:
              variant.name.trim(),

            description:
              variant.description.trim() ||
              null,

            image_url:
              variant.image_url.trim() ||
              null,

            price:
              variant.price
                ? Number(
                    variant.price
                  )
                : null,

            sort_order:
              index,

            status:
              "active",
          })
          .select("id")
          .single();

        if (
          variantError ||
          !savedVariant
        ) {
          throw new Error(
            `Variantの保存に失敗しました: ${
              variantError?.message ??
              "Unknown error"
            }`
          );
        }

        // ---------------------------------
        // Variant ↔ Shop Groups
        // ---------------------------------
        //
        // ここではVariantにも
        // Shop Groupを記録します。
        // 店舗単位の在庫は持ちません。
        //
        // 既存のvariant_placesテーブルは
        // 店舗単位なので使いません。
        // ---------------------------------

        const uniqueVariantGroups =
          [
            ...new Set(
              variant.groupIds
            ),
          ];

        if (
          uniqueVariantGroups.length >
          0
        ) {
          const rows =
            uniqueVariantGroups.map(
              (groupId) => ({
                product_id:
                  product.id,
                group_id:
                  groupId,
              })
            );

          // Product本体側ですでに
          // 同じ紐付けがある可能性があるため
          // insertではなくupsert
          const {
            error:
              groupError,
          } = await supabase
            .from(
              "product_groups"
            )
            .upsert(
              rows,
              {
                onConflict:
                  "product_id,group_id",
                ignoreDuplicates:
                  true,
              }
            );

          if (
            groupError
          ) {
            throw new Error(
              `VariantのShop保存に失敗しました: ${groupError.message}`
            );
          }
        }
      }

      setMessage(
        "Productを保存しました。"
      );

      // =================================
      // Reset
      // =================================

      setName("");
      setBrand("");
      setDescription("");
      setCategoryInput("");
      setCategoryId("");
      setPrice("");
      setJapanExclusive(false);
      setPopularityNote("");
      setEditorPick("0");
      setStatus("draft");
      setOfficialUrl("");
      setImageUrl("");
      setVariants([]);
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
  // Category render
  // =====================================

  function renderCategory(
    category: CategoryNode,
    level = 0
  ): React.ReactNode {
    return (
      <div
        key={
          category.id
        }
      >
        <label
          style={{
            ...styles.categoryOption,
            marginLeft:
              `${level * 22}px`,
          }}
        >
          <input
            type="radio"
            name="product-category"
            checked={
              categoryId ===
              String(
                category.id
              )
            }
            onChange={() => {
              setCategoryId(
                String(
                  category.id
                )
              );

              setCategoryInput(
                category.name
              );
            }}
          />

          {category.name}
        </label>

        {category.children.map(
          (child) =>
            renderCategory(
              child,
              level + 1
            )
        )}
      </div>
    );
  }

  // =====================================
  // Loading
  // =====================================

  if (loading) {
    return (
      <main
        style={
          styles.loadingPage
        }
      >
        読み込み中...
      </main>
    );
  }

  return (
    <main style={styles.main}>
      <div
        style={
          styles.container
        }
      >
        <Link
          href="/admin/products"
          style={styles.back}
        >
          ← Products
        </Link>

        <header
          style={
            styles.header
          }
        >
          <p
            style={
              styles.eyebrow
            }
          >
            CONTENT / PRODUCTS
          </p>

          <h1
            style={
              styles.title
            }
          >
            Add Product
          </h1>

          <p
            style={
              styles.description
            }
          >
            商品・Variant・取扱Shopを登録します。
          </p>
        </header>

        <form
          onSubmit={
            handleSubmit
          }
          style={
            styles.form
          }
        >

          {/* =====================
              PRODUCT
          ====================== */}

          <section
            style={
              styles.section
            }
          >
            <h2
              style={
                styles.sectionTitle
              }
            >
              Product
            </h2>

            <label
              style={styles.label}
            >
              Product name *

              <input
                style={
                  styles.input
                }
                value={name}
                onChange={(e) =>
                  setName(
                    e.target.value
                  )
                }
                placeholder="CANMAKE Lip"
                required
              />
            </label>

            <label
              style={styles.label}
            >
              Brand

              <input
                style={
                  styles.input
                }
                value={brand}
                onChange={(e) =>
                  setBrand(
                    e.target.value
                  )
                }
                placeholder="CANMAKE"
              />

              <span
                style={
                  styles.fieldHelp
                }
              >
                Brandは販売店とは別の情報です。
              </span>
            </label>

            <label
              style={styles.label}
            >
              Product Category

              <input
                style={
                  styles.input
                }
                list="product-category-options"
                value={
                  categoryInput
                }
                onChange={(e) =>
                  handleCategoryChange(
                    e.target
                      .value
                  )
                }
                placeholder="Beauty"
              />

              <datalist id="product-category-options">
                {categories.map(
                  (
                    category
                  ) => (
                    <option
                      key={
                        category.id
                      }
                      value={
                        category.name
                      }
                    />
                  )
                )}
              </datalist>

              <div
                style={
                  styles.categoryTree
                }
              >
                {categoryTree.map(
                  (category) =>
                    renderCategory(
                      category
                    )
                )}
              </div>
            </label>

            <label
              style={styles.label}
            >
              Description

              <textarea
                style={
                  styles.textarea
                }
                value={
                  description
                }
                onChange={(e) =>
                  setDescription(
                    e.target
                      .value
                  )
                }
              />
            </label>

            <label
              style={styles.label}
            >
              Product price

              <input
                style={
                  styles.input
                }
                type="number"
                value={price}
                onChange={(e) =>
                  setPrice(
                    e.target.value
                  )
                }
                placeholder="1100"
              />

              <span
                style={
                  styles.fieldHelp
                }
              >
                基本価格です。色・サイズごとに価格が異なる場合はVariant側に個別価格を設定します。
              </span>
            </label>

            <label
              style={
                styles.checkbox
              }
            >
              <input
                type="checkbox"
                checked={
                  japanExclusive
                }
                onChange={(e) =>
                  setJapanExclusive(
                    e.target
                      .checked
                  )
                }
              />

              Japan Exclusive
            </label>

            <label
              style={styles.label}
            >
              Popularity note

              <textarea
                style={
                  styles.textareaSmall
                }
                value={
                  popularityNote
                }
                onChange={(e) =>
                  setPopularityNote(
                    e.target
                      .value
                  )
                }
                placeholder="Why Japanese girls buy this..."
              />
            </label>
          </section>

          {/* =====================
              VARIANTS
          ====================== */}

          <section
            style={
              styles.section
            }
          >
            <div
              style={
                styles.sectionHeader
              }
            >
              <div>
                <h2
                  style={
                    styles.sectionTitle
                  }
                >
                  Variants
                </h2>

                <p
                  style={
                    styles.helper
                  }
                >
                  色・サイズ・香りなどのバリエーションを登録します。
                </p>
              </div>

              <button
                type="button"
                style={
                  styles.secondaryButton
                }
                onClick={
                  addVariant
                }
              >
                + Add Variant
              </button>
            </div>

            {variants.length ===
            0 ? (
              <p
                style={
                  styles.muted
                }
              >
                Variantはまだありません。
              </p>
            ) : (
              <div
                style={
                  styles.variantList
                }
              >
                {variants.map(
                  (
                    variant,
                    index
                  ) => (
                    <div
                      key={
                        variant.id
                      }
                      style={
                        styles.variantCard
                      }
                    >
                      <div
                        style={
                          styles.variantHeader
                        }
                      >
                        <h3
                          style={
                            styles.variantTitle
                          }
                        >
                          Variant{" "}
                          {index +
                            1}
                        </h3>

                        <button
                          type="button"
                          style={
                            styles.deleteButton
                          }
                          onClick={() =>
                            removeVariant(
                              variant.id
                            )
                          }
                        >
                          Remove
                        </button>
                      </div>

                      <label
                        style={
                          styles.label
                        }
                      >
                        Variant name *

                        <input
                          style={
                            styles.input
                          }
                          value={
                            variant.name
                          }
                          onChange={(
                            e
                          ) =>
                            updateVariant(
                              variant.id,
                              "name",
                              e.target
                                .value
                            )
                          }
                          placeholder="01 Pink"
                        />
                      </label>

                      <label
                        style={
                          styles.label
                        }
                      >
                        Comment

                        <textarea
                          style={
                            styles.textareaSmall
                          }
                          value={
                            variant.description
                          }
                          onChange={(
                            e
                          ) =>
                            updateVariant(
                              variant.id,
                              "description",
                              e.target
                                .value
                            )
                          }
                          placeholder="Soft pink, easy everyday shade..."
                        />
                      </label>

                      <ImageUploader
                        value={
                          variant.image_url
                        }
                        onChange={(
                          url
                        ) =>
                          updateVariant(
                            variant.id,
                            "image_url",
                            url
                          )
                        }
                        folder="product-variants"
                        label="Variant Image"
                      />

                      <label
                        style={
                          styles.label
                        }
                      >
                        Variant price

                        <input
                          style={
                            styles.input
                          }
                          type="number"
                          value={
                            variant.price
                          }
                          onChange={(
                            e
                          ) =>
                            updateVariant(
                              variant.id,
                              "price",
                              e.target
                                .value
                            )
                          }
                          placeholder="1320"
                        />
                      </label>

                      <div>
                        <p
                          style={
                            styles.fieldTitle
                          }
                        >
                          Available at Shops
                        </p>

                        <p
                          style={
                            styles.helper
                          }
                        >
                          Shop単位で登録します。特定店舗の在庫は管理しません。
                        </p>

                        {placeGroups.length ===
                        0 ? (
                          <p
                            style={
                              styles.muted
                            }
                          >
                            Shop Groupがまだありません。
                          </p>
                        ) : (
                          <div
                            style={
                              styles.shopList
                            }
                          >
                            {placeGroups.map(
                              (
                                group
                              ) => (
                                <label
                                  key={
                                    group.id
                                  }
                                  style={
                                    styles.shopOption
                                  }
                                >
                                  <input
                                    type="checkbox"
                                    checked={variant.groupIds.includes(
                                      group.id
                                    )}
                                    onChange={() =>
                                      toggleVariantGroup(
                                        variant.id,
                                        group.id
                                      )
                                    }
                                  />

                                  <span>
                                    {
                                      group.name
                                    }
                                  </span>
                                </label>
                              )
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )
                )}
              </div>
            )}
          </section>

          {/* =====================
              IMAGE / LINK
          ====================== */}

          <section
            style={
              styles.section
            }
          >
            <h2
              style={
                styles.sectionTitle
              }
            >
              Main Image & Link
            </h2>

            <ImageUploader
              value={
                imageUrl
              }
              onChange={
                setImageUrl
              }
              folder="products"
              label="Main Image"
            />

            <label
              style={
                styles.label
              }
            >
              Official website

              <input
                style={
                  styles.input
                }
                value={
                  officialUrl
                }
                onChange={(e) =>
                  setOfficialUrl(
                    e.target
                      .value
                  )
                }
              />
            </label>
          </section>

          {/* =====================
              PUBLISHING
          ====================== */}

          <section
            style={
              styles.section
            }
          >
            <h2
              style={
                styles.sectionTitle
              }
            >
              Publishing
            </h2>

            <label
              style={
                styles.label
              }
            >
              Editor's Pick

              <select
                style={
                  styles.input
                }
                value={
                  editorPick
                }
                onChange={(e) =>
                  setEditorPick(
                    e.target
                      .value
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

            <label
              style={
                styles.label
              }
            >
              Status

              <select
                style={
                  styles.input
                }
                value={
                  status
                }
                onChange={(e) =>
                  setStatus(
                    e.target
                      .value as ProductStatus
                  )
                }
              >
                <option value="draft">
                  Draft
                </option>

                <option value="published">
                  Published
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

          <button
            type="submit"
            disabled={saving}
            style={{
              ...styles.saveButton,
              opacity:
                saving
                  ? 0.6
                  : 1,
            }}
          >
            {saving
              ? "Saving..."
              : "Save Product"}
          </button>

          {message && (
            <div
              style={
                styles.message
              }
            >
              {message}
            </div>
          )}
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
    padding:
      "40px 24px 90px",
  },

  loadingPage: {
    minHeight: "100vh",
    display: "flex",
    alignItems:
      "center",
    justifyContent:
      "center",
    background:
      "#faf8f6",
    color: "#888",
  },

  container: {
    maxWidth: "900px",
    margin: "0 auto",
  },

  back: {
    color: "#777",
    textDecoration:
      "none",
    fontSize: "13px",
  },

  header: {
    padding:
      "35px 0 28px",
  },

  eyebrow: {
    color: "#c8647b",
    fontSize: "10px",
    fontWeight: 700,
    letterSpacing:
      "3px",
    marginBottom:
      "8px",
  },

  title: {
    fontFamily:
      "Georgia, serif",
    fontSize: "48px",
    fontWeight: 400,
    margin: 0,
  },

  description: {
    color: "#777",
    lineHeight: 1.7,
    marginTop:
      "10px",
  },

  form: {
    display: "flex",
    flexDirection:
      "column" as const,
    gap: "18px",
  },

  section: {
    background: "#fff",
    border:
      "1px solid #e7e0dc",
    borderRadius:
      "15px",
    padding: "22px",
  },

  sectionTitle: {
    fontFamily:
      "Georgia, serif",
    fontSize: "24px",
    fontWeight: 400,
    margin:
      "0 0 18px",
  },

  sectionHeader: {
    display: "flex",
    justifyContent:
      "space-between",
    alignItems:
      "flex-start",
    gap: "15px",
    marginBottom:
      "18px",
  },

  label: {
    display: "flex",
    flexDirection:
      "column" as const,
    gap: "7px",
    fontSize: "13px",
    fontWeight: 600,
    marginBottom:
      "14px",
  },

  input: {
    width: "100%",
    boxSizing:
      "border-box" as const,
    padding:
      "12px 13px",
    border:
      "1px solid #ded7d3",
    borderRadius:
      "9px",
    background: "#fff",
    fontSize: "14px",
  },

  textarea: {
    width: "100%",
    minHeight:
      "120px",
    boxSizing:
      "border-box" as const,
    padding:
      "12px 13px",
    border:
      "1px solid #ded7d3",
    borderRadius:
      "9px",
    background: "#fff",
    fontSize: "14px",
    resize:
      "vertical" as const,
  },

  textareaSmall: {
    width: "100%",
    minHeight:
      "80px",
    boxSizing:
      "border-box" as const,
    padding:
      "12px 13px",
    border:
      "1px solid #ded7d3",
    borderRadius:
      "9px",
    background: "#fff",
    fontSize: "14px",
    resize:
      "vertical" as const,
  },

  fieldHelp: {
    color: "#999",
    fontSize:
      "11px",
    fontWeight: 400,
    lineHeight:
      1.5,
  },

  helper: {
    color: "#888",
    fontSize:
      "12px",
    lineHeight:
      1.6,
  },

  muted: {
    color: "#888",
    fontSize:
      "13px",
  },

  checkbox: {
    display: "flex",
    alignItems:
      "center",
    gap: "8px",
    fontSize:
      "13px",
    fontWeight: 400,
    marginBottom:
      "8px",
  },

  categoryTree: {
    marginTop:
      "8px",
    borderTop:
      "1px solid #eee8e4",
    paddingTop:
      "8px",
  },

  categoryOption: {
    display: "flex",
    alignItems:
      "center",
    gap: "8px",
    padding:
      "7px 0",
    fontSize:
      "13px",
    fontWeight: 400,
  },

  secondaryButton: {
    border:
      "1px solid #ddd5d1",
    borderRadius:
      "9px",
    background:
      "#fff",
    padding:
      "10px 13px",
    cursor:
      "pointer",
    fontSize:
      "12px",
    whiteSpace:
      "nowrap" as const,
  },

  variantList: {
    display: "flex",
    flexDirection:
      "column" as const,
    gap: "14px",
  },

  variantCard: {
    background:
      "#fcfaf9",
    border:
      "1px solid #e9e1dd",
    borderRadius:
      "12px",
    padding: "18px",
  },

  variantHeader: {
    display: "flex",
    justifyContent:
      "space-between",
    alignItems:
      "center",
    marginBottom:
      "15px",
  },

  variantTitle: {
    fontFamily:
      "Georgia, serif",
    fontSize:
      "19px",
    fontWeight: 400,
    margin: 0,
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
      "7px 9px",
    cursor:
      "pointer",
    fontSize:
      "11px",
  },

  fieldTitle: {
    fontSize:
      "13px",
    fontWeight: 600,
    margin:
      "15px 0 4px",
  },

  shopList: {
    display: "grid",
    gridTemplateColumns:
      "repeat(2, minmax(0, 1fr))",
    gap:
      "7px 14px",
    border:
      "1px solid #eee8e4",
    borderRadius:
      "9px",
    padding:
      "12px 13px",
    marginTop:
      "8px",
  },

  shopOption: {
    display: "flex",
    alignItems:
      "center",
    gap: "8px",
    fontSize:
      "13px",
    fontWeight: 400,
    padding:
      "5px 0",
  },

  saveButton: {
    border: 0,
    borderRadius:
      "11px",
    background:
      "#222",
    color: "#fff",
    padding:
      "16px",
    fontSize:
      "14px",
    cursor:
      "pointer",
  },

  message: {
    textAlign:
      "center" as const,
    color:
      "#c8647b",
    fontSize:
      "13px",
  },
};