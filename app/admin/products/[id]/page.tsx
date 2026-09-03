"use client";

import Link from "next/link";
import ImageUploader from "@/components/ImageUploader";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

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
  is_active: boolean;
};

type Variant = {
  id: string;
  name: string;
  description: string;
  image_url: string;
  price: string;
};

type Product = {
  id: string;
  name: string;
  brand: string | null;
  description: string | null;
  category_id: number | null;
  image_url: string | null;
  price: number | null;
  japan_exclusive: boolean | null;
  popularity_note: string | null;
  editor_pick: number;
  status:
    | "draft"
    | "published"
    | "hidden"
    | "archived";
  official_url: string | null;
};

export default function EditProductPage() {
  const params = useParams();
  const productId = String(params.id);

  // =====================================
  // Product
  // =====================================

  const [product, setProduct] =
    useState<Product | null>(null);

  const [name, setName] = useState("");
  const [brand, setBrand] = useState("");
  const [description, setDescription] =
    useState("");

  const [categoryInput, setCategoryInput] =
    useState("");

  const [categoryId, setCategoryId] =
    useState("");

  const [imageUrl, setImageUrl] =
    useState("");

  const [price, setPrice] =
    useState("");

  const [japanExclusive, setJapanExclusive] =
    useState(false);

  const [popularityNote, setPopularityNote] =
    useState("");

  const [editorPick, setEditorPick] =
    useState("0");

  const [status, setStatus] = useState<
    "draft" | "published" | "hidden" | "archived"
  >("draft");

  const [officialUrl, setOfficialUrl] =
    useState("");

  // =====================================
  // Options
  // =====================================

  const [categories, setCategories] =
    useState<Category[]>([]);

  const [shopGroups, setShopGroups] =
    useState<PlaceGroup[]>([]);

  const [selectedShopGroupIds, setSelectedShopGroupIds] =
    useState<string[]>([]);

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
  // Load
  // =====================================

  useEffect(() => {
    async function load() {
      setLoading(true);
      setMessage("");

      const [
        productResult,
        categoriesResult,
        shopGroupsResult,
        variantsResult,
        productGroupsResult,
      ] = await Promise.all([
        supabase
          .from("products")
          .select("*")
          .eq("id", productId)
          .single(),

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
          .select(
            "id, name, is_active"
          )
          .eq("is_active", true)
          .order("name"),

        supabase
          .from("product_variants")
          .select(
            `
              id,
              name,
              description,
              image_url,
              price,
              sort_order
            `
          )
          .eq(
            "product_id",
            productId
          )
          .in("status", [
            "active",
            "hidden",
          ])
          .order("sort_order"),

        supabase
          .from("product_groups")
          .select(
            "group_id"
          )
          .eq(
            "product_id",
            productId
          ),
      ]);

      // ---------------------------------
      // Product
      // ---------------------------------

      if (
        productResult.error ||
        !productResult.data
      ) {
        setMessage(
          `Productを読み込めませんでした: ${
            productResult.error?.message ??
            "Unknown error"
          }`
        );

        setLoading(false);
        return;
      }

      const loadedProduct =
        productResult.data as Product;

      setProduct(
        loadedProduct
      );

      setName(
        loadedProduct.name ?? ""
      );

      setBrand(
        loadedProduct.brand ?? ""
      );

      setDescription(
        loadedProduct.description ?? ""
      );

      setCategoryId(
        loadedProduct.category_id !==
          null
          ? String(
              loadedProduct.category_id
            )
          : ""
      );

      setImageUrl(
        loadedProduct.image_url ?? ""
      );

      setPrice(
        loadedProduct.price !==
          null
          ? String(
              loadedProduct.price
            )
          : ""
      );

      setJapanExclusive(
        Boolean(
          loadedProduct.japan_exclusive
        )
      );

      setPopularityNote(
        loadedProduct.popularity_note ??
          ""
      );

      setEditorPick(
        String(
          loadedProduct.editor_pick ??
            0
        )
      );

      if (
        loadedProduct.status ===
          "draft" ||
        loadedProduct.status ===
          "published" ||
        loadedProduct.status ===
          "hidden" ||
        loadedProduct.status ===
          "archived"
      ) {
        setStatus(
          loadedProduct.status
        );
      }

      setOfficialUrl(
        loadedProduct.official_url ??
          ""
      );

      // ---------------------------------
      // Categories
      // ---------------------------------

      const loadedCategories =
        (categoriesResult.data ??
          []) as Category[];

      setCategories(
        loadedCategories
      );

      const matchedCategory =
        loadedCategories.find(
          (category) =>
            String(
              category.id
            ) ===
            String(
              loadedProduct.category_id ??
                ""
            )
        );

      setCategoryInput(
        matchedCategory?.name ??
          ""
      );

      // ---------------------------------
      // Shop Groups
      // ---------------------------------

      setShopGroups(
        (shopGroupsResult.data ??
          []) as PlaceGroup[]
      );

      setSelectedShopGroupIds(
        (
          productGroupsResult.data ??
          []
        ).map(
          (row) =>
            String(
              row.group_id
            )
        )
      );

      // ---------------------------------
      // Variants
      // ---------------------------------

      const loadedVariants =
        variantsResult.data ??
        [];

      setVariants(
        loadedVariants.map(
          (variant) => ({
            id: String(
              variant.id
            ),
            name:
              variant.name ??
              "",
            description:
              variant.description ??
              "",
            image_url:
              variant.image_url ??
              "",
            price:
              variant.price !==
              null
                ? String(
                    variant.price
                  )
                : "",
          })
        )
      );

      const errors = [
        categoriesResult.error,
        shopGroupsResult.error,
        variantsResult.error,
        productGroupsResult.error,
      ].filter(Boolean);

      if (
        errors.length > 0
      ) {
        setMessage(
          `一部データの読み込みに失敗しました: ${
            errors[0]!.message
          }`
        );
      }

      setLoading(false);
    }

    load();
  }, [productId]);

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
  // Shop Groups
  // =====================================

  function toggleShopGroup(
    groupId: string
  ) {
    setSelectedShopGroupIds(
      (current) =>
        current.includes(
          groupId
        )
          ? current.filter(
              (id) =>
                id !== groupId
            )
          : [
              ...current,
              groupId,
            ]
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
            `temp-${crypto.randomUUID()}`,
          name: "",
          description: "",
          image_url: "",
          price: "",
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
  // Save
  // =====================================

  async function handleSave(
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
      // Category
      // ---------------------------------

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
              trimmedCategory
                .toLowerCase()
          );

        if (existing) {
          resolvedCategoryId =
            existing.id;
        } else {
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

          const {
            data:
              newCategory,
            error:
              categoryError,
          } = await supabase
            .from(
              "product_categories"
            )
            .insert({
              site_id:
                site.id,
              name:
                trimmedCategory,
              parent_id:
                null,
              sort_order:
                0,
              is_active:
                true,
            })
            .select(
              "id"
            )
            .single();

          if (
            categoryError ||
            !newCategory
          ) {
            throw new Error(
              `Productカテゴリの作成に失敗しました: ${
                categoryError?.message ??
                "Unknown error"
              }`
            );
          }

          resolvedCategoryId =
            newCategory.id;
        }
      }

      // ---------------------------------
      // Product
      // ---------------------------------

      const {
        error:
          productError,
      } = await supabase
        .from("products")
        .update({
          name:
            name.trim(),

          brand:
            brand.trim() ||
            null,

          description:
            description.trim() ||
            null,

          category_id:
            resolvedCategoryId,

          image_url:
            imageUrl.trim() ||
            null,

          price:
            price
              ? Number(
                  price
                )
              : null,

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

          updated_at:
            new Date().toISOString(),
        })
        .eq(
          "id",
          productId
        );

      if (productError) {
        throw new Error(
          `Productの更新に失敗しました: ${productError.message}`
        );
      }

      // ---------------------------------
      // Product ↔ Shop Groups
      // ---------------------------------

      const {
        error:
          deleteGroupError,
      } = await supabase
        .from(
          "product_groups"
        )
        .delete()
        .eq(
          "product_id",
          productId
        );

      if (
        deleteGroupError
      ) {
        throw new Error(
          `Shop情報の更新に失敗しました: ${deleteGroupError.message}`
        );
      }

      if (
        selectedShopGroupIds.length >
        0
      ) {
        const rows =
          selectedShopGroupIds.map(
            (groupId) => ({
              product_id:
                productId,
              group_id:
                groupId,
            })
          );

        const {
          error:
            insertGroupError,
        } = await supabase
          .from(
            "product_groups"
          )
          .insert(rows);

        if (
          insertGroupError
        ) {
          throw new Error(
            `Shop情報の保存に失敗しました: ${insertGroupError.message}`
          );
        }
      }

      // ---------------------------------
      // Existing Variants
      // ---------------------------------

      const {
        data:
          existingVariants,
        error:
          existingVariantsError,
      } = await supabase
        .from(
          "product_variants"
        )
        .select(
          "id"
        )
        .eq(
          "product_id",
          productId
        );

      if (
        existingVariantsError
      ) {
        throw new Error(
          `Variant情報の取得に失敗しました: ${existingVariantsError.message}`
        );
      }

      const existingIds =
        new Set(
          (
            existingVariants ??
            []
          ).map(
            (variant) =>
              String(
                variant.id
              )
          )
        );

      const currentExistingIds =
        new Set(
          variants
            .filter(
              (variant) =>
                existingIds.has(
                  variant.id
                )
            )
            .map(
              (variant) =>
                variant.id
            )
        );

      // ---------------------------------
      // Save Variants
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

        const payload = {
          product_id:
            productId,

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
        };

        if (
          existingIds.has(
            variant.id
          )
        ) {
          const {
            error,
          } = await supabase
            .from(
              "product_variants"
            )
            .update(payload)
            .eq(
              "id",
              variant.id
            );

          if (error) {
            throw new Error(
              `Variantの更新に失敗しました: ${error.message}`
            );
          }
        } else {
          const {
            error,
          } = await supabase
            .from(
              "product_variants"
            )
            .insert(
              payload
            );

          if (error) {
            throw new Error(
              `Variantの追加に失敗しました: ${error.message}`
            );
          }
        }
      }

      // ---------------------------------
      // Removed Variants
      // ---------------------------------

      for (
        const existingId of existingIds
      ) {
        if (
          !currentExistingIds.has(
            existingId
          )
        ) {
          const {
            error,
          } = await supabase
            .from(
              "product_variants"
            )
            .update({
              status:
                "archived",
            })
            .eq(
              "id",
              existingId
            );

          if (error) {
            throw new Error(
              `Variantの削除に失敗しました: ${error.message}`
            );
          }
        }
      }

      // ---------------------------------
      // Refresh Product
      // ---------------------------------

      const {
        data:
          refreshedProduct,
      } = await supabase
        .from("products")
        .select("*")
        .eq(
          "id",
          productId
        )
        .single();

      if (
        refreshedProduct
      ) {
        setProduct(
          refreshedProduct as Product
        );
      }

      const {
        data:
          refreshedVariants,
      } = await supabase
        .from(
          "product_variants"
        )
        .select(
          `
            id,
            name,
            description,
            image_url,
            price,
            sort_order
          `
        )
        .eq(
          "product_id",
          productId
        )
        .in("status", [
          "active",
          "hidden",
        ])
        .order(
          "sort_order"
        );

      if (
        refreshedVariants
      ) {
        setVariants(
          refreshedVariants.map(
            (variant) => ({
              id: String(
                variant.id
              ),
              name:
                variant.name ??
                "",
              description:
                variant.description ??
                "",
              image_url:
                variant.image_url ??
                "",
              price:
                variant.price !==
                null
                  ? String(
                      variant.price
                    )
                  : "",
            })
          )
        );
      }

      setMessage(
        "Productを保存しました。"
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
  // Loading / Not Found
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

  if (!product) {
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

          <h1
            style={
              styles.title
            }
          >
            Product not found
          </h1>
        </div>
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
        <div
          style={styles.topbar}
        >
          <Link
            href="/admin/products"
            style={styles.back}
          >
            ← Products
          </Link>

          <span
            style={
              styles.idText
            }
          >
            {product.name}
          </span>
        </div>

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
            Edit Product
          </h1>

          <p
            style={
              styles.description
            }
          >
            {product.name}
          </p>
        </header>

        <form
          onSubmit={
            handleSave
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
              style={
                styles.label
              }
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
                required
              />
            </label>

            <label
              style={
                styles.label
              }
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
            </label>

            <label
              style={
                styles.label
              }
            >
              Category

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
              style={
                styles.label
              }
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
                    e.target.value
                  )
                }
              />
            </label>

            <label
              style={
                styles.label
              }
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
              />

              <span
                style={
                  styles.fieldHelp
                }
              >
                基本価格です。色やサイズごとに価格が違う場合はVariant側の価格を使用します。
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
                    e.target.checked
                  )
                }
              />

              Japan Exclusive
            </label>

            <label
              style={
                styles.label
              }
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
                    e.target.value
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
                  色・サイズ・香りなど、商品のバリエーションを管理します。
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
              <div
                style={
                  styles.emptyVariant
                }
              >
                <p>
                  Variantはまだありません。
                </p>

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
                    <article
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
                          onChange={(e) =>
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
                          onChange={(e) =>
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
                          onChange={(e) =>
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
                    </article>
                  )
                )}
              </div>
            )}
          </section>

          {/* =====================
              SHOPS
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
              Available at Shops
            </h2>

            <p
              style={
                styles.helper
              }
            >
              この商品を取り扱っているShopを選択します。個別店舗の在庫情報は管理しません。
            </p>

            {shopGroups.length ===
            0 ? (
              <div
                style={
                  styles.emptyShop
                }
              >
                <p
                  style={
                    styles.muted
                  }
                >
                  Shopがまだ登録されていません。
                </p>

                <Link
                  href="/admin/place-groups"
                  style={
                    styles.shopLink
                  }
                >
                  + Add Shop
                </Link>
              </div>
            ) : (
              <>
                <div
                  style={
                    styles.shopList
                  }
                >
                  {shopGroups.map(
                    (group) => (
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
                          checked={selectedShopGroupIds.includes(
                            String(
                              group.id
                            )
                          )}
                          onChange={() =>
                            toggleShopGroup(
                              String(
                                group.id
                              )
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

                <Link
                  href="/admin/place-groups"
                  style={
                    styles.shopLink
                  }
                >
                  Manage Shops →
                </Link>
              </>
            )}
          </section>

          {/* =====================
              IMAGE / LINKS
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
              Image & Links
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
                    e.target.value
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
                    e.target.value as
                      | "draft"
                      | "published"
                      | "hidden"
                      | "archived"
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

          <div
            style={
              styles.bottomBar
            }
          >
            <button
              type="submit"
              disabled={
                saving
              }
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
                : "Save Changes"}
            </button>

            {message && (
              <span
                style={
                  styles.message
                }
              >
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
    padding:
      "35px 24px 100px",
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

  topbar: {
    display: "flex",
    justifyContent:
      "space-between",
    alignItems:
      "center",
  },

  back: {
    color: "#777",
    textDecoration:
      "none",
    fontSize: "13px",
  },

  idText: {
    color: "#888",
    fontSize: "12px",
  },

  header: {
    padding:
      "35px 0 25px",
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
    marginTop:
      "10px",
    lineHeight: 1.7,
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
    fontSize:
      "24px",
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
    fontSize:
      "13px",
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
    background:
      "#fff",
    fontSize:
      "14px",
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
    background:
      "#fff",
    fontSize:
      "14px",
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
    background:
      "#fff",
    fontSize:
      "14px",
    resize:
      "vertical" as const,
  },

  checkbox: {
    display: "flex",
    alignItems:
      "center",
    gap: "8px",
    fontSize:
      "13px",
    fontWeight: 400,
  },

  categoryTree: {
    marginTop:
      "8px",
    borderTop:
      "1px solid #eee8e4",
    paddingTop:
      "8px",
    maxHeight:
      "300px",
    overflowY:
      "auto" as const,
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
    marginTop:
      "7px",
  },

  shopList: {
    display: "grid",
    gridTemplateColumns:
      "repeat(2, minmax(0, 1fr))",
    gap:
      "8px 14px",
    border:
      "1px solid #eee8e4",
    borderRadius:
      "9px",
    padding:
      "12px 13px",
    marginTop:
      "12px",
  },

  shopOption: {
    display: "flex",
    alignItems:
      "center",
    gap:
      "8px",
    padding:
      "6px 0",
    fontSize:
      "13px",
    fontWeight: 400,
  },

  shopLink: {
    display:
      "inline-block",
    marginTop:
      "12px",
    color:
      "#222",
    textDecoration:
      "none",
    fontSize:
      "12px",
  },

  emptyShop: {
    marginTop:
      "15px",
    padding:
      "20px",
    border:
      "1px dashed #ddd5d1",
    borderRadius:
      "10px",
  },

  variantList: {
    display: "flex",
    flexDirection:
      "column" as const,
    gap:
      "14px",
  },

  variantCard: {
    background:
      "#fcfaf9",
    border:
      "1px solid #e9e1dd",
    borderRadius:
      "12px",
    padding:
      "18px",
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

  emptyVariant: {
    padding:
      "30px",
    textAlign:
      "center" as const,
    color:
      "#888",
    border:
      "1px dashed #ddd5d1",
    borderRadius:
      "10px",
  },

  muted: {
    color:
      "#888",
    fontSize:
      "13px",
  },

  bottomBar: {
    display: "flex",
    alignItems:
      "center",
    gap:
      "18px",
  },

  saveButton: {
    border: 0,
    borderRadius:
      "10px",
    background:
      "#222",
    color:
      "#fff",
    padding:
      "15px 22px",
    fontSize:
      "14px",
    cursor:
      "pointer",
  },

  message: {
    color:
      "#c8647b",
    fontSize:
      "13px",
  },
};