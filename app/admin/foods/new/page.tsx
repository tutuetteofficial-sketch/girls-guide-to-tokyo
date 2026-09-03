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

type Place = {
  id: string;
  name: string;
  price_range: string | null;
};

type PlaceType = {
  id: number;
  name: string;
};

type Group = {
  id: string | number;
  name: string;
};

type Region = {
  id: number;
  name: string;
};

type Area = {
  id: number;
  region_id: number;
  name: string;
};

type Station = {
  id: number;
  name: string;
};

type FoodStatus =
  | "active"
  | "hidden"
  | "archived";

export default function NewFoodPage() {
  // =====================================
  // Food
  // =====================================

  const [name, setName] = useState("");
  const [description, setDescription] =
    useState("");

  const [categoryInput, setCategoryInput] =
    useState("");

  const [categoryId, setCategoryId] =
    useState("");

  const [imageUrl, setImageUrl] =
    useState("");

  const [editorPick, setEditorPick] =
    useState("0");

  const [status, setStatus] =
    useState<FoodStatus>("active");

  // =====================================
  // Existing Places
  // =====================================

  const [places, setPlaces] =
    useState<Place[]>([]);

  const [selectedPlaceIds, setSelectedPlaceIds] =
    useState<string[]>([]);

  // =====================================
  // New Restaurant / Café
  // =====================================

  const [newPlaceOpen, setNewPlaceOpen] =
    useState(false);

  const [newPlaceTypeInput, setNewPlaceTypeInput] =
    useState("");

  const [newPlaceTypeId, setNewPlaceTypeId] =
    useState("");

  const [newPlaceName, setNewPlaceName] =
    useState("");

  const [newPlaceEditorNote, setNewPlaceEditorNote] =
    useState("");

  const [newPlaceGroupInput, setNewPlaceGroupInput] =
    useState("");

  const [newPlaceGroupId, setNewPlaceGroupId] =
    useState("");

  const [newPlaceRegionId, setNewPlaceRegionId] =
    useState("");

  const [newPlaceAreaInput, setNewPlaceAreaInput] =
    useState("");

  const [newPlaceAreaId, setNewPlaceAreaId] =
    useState("");

  const [newPlaceAddress, setNewPlaceAddress] =
    useState("");

  const [newPlacePostalCode, setNewPlacePostalCode] =
    useState("");

  const [newPlacePhone, setNewPlacePhone] =
    useState("");

  const [newPlacePriceRange, setNewPlacePriceRange] =
    useState("");

  const [newPlaceSeats, setNewPlaceSeats] =
    useState("");

  const [newPlaceCounterSeats, setNewPlaceCounterSeats] =
    useState("");

  const [newPlaceTableSeats, setNewPlaceTableSeats] =
    useState("");

  const [newPlaceReservation, setNewPlaceReservation] =
    useState("");

  const [newPlaceEnglishSupport, setNewPlaceEnglishSupport] =
    useState("");

  const [newPlaceCard, setNewPlaceCard] =
    useState(false);

  const [newPlaceTaxFree, setNewPlaceTaxFree] =
    useState(false);

  const [newPlaceOpeningHours, setNewPlaceOpeningHours] =
    useState("");

  const [newPlaceClosedDays, setNewPlaceClosedDays] =
    useState("");

  const [newPlaceStationId, setNewPlaceStationId] =
    useState("");

  const [newPlaceStationExit, setNewPlaceStationExit] =
    useState("");

  const [newPlaceWalkMinutes, setNewPlaceWalkMinutes] =
    useState("");

  const [newPlaceOfficialUrl, setNewPlaceOfficialUrl] =
    useState("");

  const [newPlaceInstagramUrl, setNewPlaceInstagramUrl] =
    useState("");

  const [newPlaceTabelogUrl, setNewPlaceTabelogUrl] =
    useState("");

  const [newPlaceGoogleMapsUrl, setNewPlaceGoogleMapsUrl] =
    useState("");

  // =====================================
  // Options
  // =====================================

  const [categories, setCategories] =
    useState<Category[]>([]);

  const [placeTypes, setPlaceTypes] =
    useState<PlaceType[]>([]);

  const [groups, setGroups] =
    useState<Group[]>([]);

  const [regions, setRegions] =
    useState<Region[]>([]);

  const [areas, setAreas] =
    useState<Area[]>([]);

  const [stations, setStations] =
    useState<Station[]>([]);

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
        placesResult,
        placeTypesResult,
        groupsResult,
        regionsResult,
        areasResult,
        stationsResult,
      ] = await Promise.all([
        supabase
          .from("food_categories")
          .select("id, name, parent_id")
          .eq("is_active", true)
          .order("sort_order")
          .order("name"),

        supabase
          .from("places")
          .select(
            "id, name, price_range"
          )
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
          .from("place_groups")
          .select("id, name")
          .eq("is_active", true)
          .order("name"),

        supabase
          .from("regions")
          .select("id, name")
          .eq("is_active", true)
          .order("sort_order")
          .order("name"),

        supabase
          .from("areas")
          .select(
            "id, region_id, name"
          )
          .eq("is_active", true)
          .order("sort_order")
          .order("name"),

        supabase
          .from("stations")
          .select("id, name")
          .eq("is_active", true)
          .order("name"),
      ]);

      const errors = [
        categoriesResult.error,
        placesResult.error,
        placeTypesResult.error,
        groupsResult.error,
        regionsResult.error,
        areasResult.error,
        stationsResult.error,
      ].filter(Boolean);

      if (errors.length > 0) {
        setMessage(
          `選択肢の読み込みに失敗しました: ${errors[0]!.message}`
        );
      }

      setCategories(
        (categoriesResult.data ??
          []) as Category[]
      );

      setPlaces(
        (placesResult.data ??
          []) as Place[]
      );

      const loadedPlaceTypes =
        (placeTypesResult.data ??
          []) as PlaceType[];

      setPlaceTypes(
        loadedPlaceTypes
      );

      setGroups(
        (groupsResult.data ??
          []) as Group[]
      );

      const loadedRegions =
        (regionsResult.data ??
          []) as Region[];

      setRegions(
        loadedRegions
      );

      setAreas(
        (areasResult.data ??
          []) as Area[]
      );

      setStations(
        (stationsResult.data ??
          []) as Station[]
      );

      // 現在はTokyoのみなので自動選択
      const tokyo =
        loadedRegions.find(
          (region) =>
            region.name
              .trim()
              .toLowerCase() ===
            "tokyo"
        );

      if (tokyo) {
        setNewPlaceRegionId(
          String(tokyo.id)
        );
      }

      // 初期値はCafé
      const cafe =
        loadedPlaceTypes.find(
          (type) => {
            const value =
              type.name
                .trim()
                .toLowerCase();

            return (
              value === "café" ||
              value === "cafe"
            );
          }
        );

      if (cafe) {
        setNewPlaceTypeInput(
          cafe.name
        );

        setNewPlaceTypeId(
          String(cafe.id)
        );
      }

      setLoading(false);
    }

    loadOptions();
  }, []);

  // =====================================
  // Category tree
  // =====================================

  const categoryTree = useMemo(() => {
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

  function flattenCategories(
    nodes: CategoryNode[],
    level = 0
  ): {
    id: number;
    label: string;
  }[] {
    return nodes.flatMap(
      (node) => [
        {
          id: node.id,
          label:
            "　".repeat(level) +
            node.name,
        },
        ...flattenCategories(
          node.children,
          level + 1
        ),
      ]
    );
  }

  const categoryOptions =
    flattenCategories(
      categoryTree
    );

  // =====================================
  // Food Category
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
  // Existing places
  // =====================================

  function togglePlace(
    placeId: string
  ) {
    setSelectedPlaceIds(
      (current) =>
        current.includes(placeId)
          ? current.filter(
              (id) =>
                id !== placeId
            )
          : [
              ...current,
              placeId,
            ]
    );
  }

  // =====================================
  // New Place Areas
  // =====================================

  const filteredNewPlaceAreas =
    useMemo(() => {
      if (
        !newPlaceRegionId
      ) {
        return [];
      }

      return areas.filter(
        (area) =>
          area.region_id ===
          Number(
            newPlaceRegionId
          )
      );
    }, [
      areas,
      newPlaceRegionId,
    ]);

  // =====================================
  // New Place handlers
  // =====================================

  function handleNewPlaceTypeChange(
    value: string
  ) {
    setNewPlaceTypeInput(
      value
    );

    const existing =
      placeTypes.find(
        (type) =>
          type.name
            .trim()
            .toLowerCase() ===
          value
            .trim()
            .toLowerCase()
      );

    setNewPlaceTypeId(
      existing
        ? String(
            existing.id
          )
        : ""
    );
  }

  function handleNewPlaceGroupChange(
    value: string
  ) {
    setNewPlaceGroupInput(
      value
    );

    const existing =
      groups.find(
        (group) =>
          group.name
            .trim()
            .toLowerCase() ===
          value
            .trim()
            .toLowerCase()
      );

    setNewPlaceGroupId(
      existing
        ? String(
            existing.id
          )
        : ""
    );
  }

  function handleNewPlaceRegionChange(
    value: string
  ) {
    setNewPlaceRegionId(value);
    setNewPlaceAreaId("");
    setNewPlaceAreaInput("");
  }

  function handleNewPlaceAreaChange(
    value: string
  ) {
    setNewPlaceAreaInput(
      value
    );

    const existing =
      filteredNewPlaceAreas.find(
        (area) =>
          area.name
            .trim()
            .toLowerCase() ===
          value
            .trim()
            .toLowerCase()
      );

    setNewPlaceAreaId(
      existing
        ? String(
            existing.id
          )
        : ""
    );
  }

  // =====================================
  // Resolve Place Type
  // =====================================

  async function resolvePlaceType(
    siteId: string
  ): Promise<number> {
    const trimmed =
      newPlaceTypeInput.trim();

    if (!trimmed) {
      throw new Error(
        "Place Typeを入力してください。"
      );
    }

    const normalized =
      trimmed.toLowerCase();

    const isRestaurantOrCafe =
      normalized ===
        "restaurant" ||
      normalized ===
        "café" ||
      normalized ===
        "cafe";

    if (!isRestaurantOrCafe) {
      throw new Error(
        "Foodから新規登録できるPlace TypeはRestaurantまたはCaféです。"
      );
    }

    const existing =
      placeTypes.find(
        (type) =>
          type.name
            .trim()
            .toLowerCase() ===
          normalized
      );

    if (existing) {
      return existing.id;
    }

    const slug =
      normalized ===
      "restaurant"
        ? "restaurant"
        : "cafe";

    const {
      data,
      error,
    } = await supabase
      .from("place_types")
      .insert({
        site_id:
          siteId,
        name:
          trimmed,
        slug:
          `${slug}-${Date.now()}`,
        description:
          null,
        is_active:
          true,
        sort_order:
          0,
      })
      .select("id")
      .single();

    if (
      error ||
      !data
    ) {
      throw new Error(
        `Place Typeの作成に失敗しました: ${
          error?.message ??
          "Unknown error"
        }`
      );
    }

    return data.id;
  }

  // =====================================
  // Resolve Group
  // =====================================

  async function resolveGroup(
    siteId: string
  ): Promise<
    string | null
  > {
    const trimmed =
      newPlaceGroupInput.trim();

    if (!trimmed) {
      return null;
    }

    const existing =
      groups.find(
        (group) =>
          group.name
            .trim()
            .toLowerCase() ===
          trimmed
            .toLowerCase()
      );

    if (existing) {
      return String(
        existing.id
      );
    }

    const {
      data,
      error,
    } = await supabase
      .from("place_groups")
      .insert({
        site_id:
          siteId,
        name:
          trimmed,
        is_active:
          true,
      })
      .select("id")
      .single();

    if (
      error ||
      !data
    ) {
      throw new Error(
        `Place Groupの作成に失敗しました: ${
          error?.message ??
          "Unknown error"
        }`
      );
    }

    return String(
      data.id
    );
  }

  // =====================================
  // Resolve Area
  // =====================================

  async function resolveArea(): Promise<
    number | null
  > {
    const trimmed =
      newPlaceAreaInput.trim();

    if (
      !trimmed ||
      !newPlaceRegionId
    ) {
      return null;
    }

    const existing =
      filteredNewPlaceAreas.find(
        (area) =>
          area.name
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
      .from("areas")
      .insert({
        region_id:
          Number(
            newPlaceRegionId
          ),
        name:
          trimmed,
        sort_order:
          0,
        is_active:
          true,
      })
      .select("id")
      .single();

    if (
      error ||
      !data
    ) {
      throw new Error(
        `Areaの作成に失敗しました: ${
          error?.message ??
          "Unknown error"
        }`
      );
    }

    return data.id;
  }

  // =====================================
  // Create New Restaurant / Café
  // =====================================

  async function createNewPlace(
    siteId: string
  ): Promise<string> {
    if (
      !newPlaceName.trim()
    ) {
      throw new Error(
        "店舗名を入力してください。"
      );
    }

    if (
      !newPlaceRegionId
    ) {
      throw new Error(
        "店舗のRegionを選択してください。"
      );
    }

    const typeId =
      await resolvePlaceType(
        siteId
      );

    const groupId =
      await resolveGroup(
        siteId
      );

    const areaId =
      await resolveArea();

    const {
      data:
        newPlace,
      error,
    } = await supabase
      .from("places")
      .insert({
        site_id:
          siteId,

        place_type_id:
          typeId,

        group_id:
          groupId,

        region_id:
          Number(
            newPlaceRegionId
          ),

        area_id:
          areaId,

        name:
          newPlaceName.trim(),

        description:
          null,

        editor_note:
          newPlaceEditorNote.trim() ||
          null,

        address:
          newPlaceAddress.trim() ||
          null,

        postal_code:
          newPlacePostalCode.trim() ||
          null,

        phone:
          newPlacePhone.trim() ||
          null,

        price_range:
          newPlacePriceRange.trim() ||
          null,

        seats:
          newPlaceSeats
            ? Number(
                newPlaceSeats
              )
            : null,

        counter_seats:
          newPlaceCounterSeats
            ? Number(
                newPlaceCounterSeats
              )
            : null,

        table_seats:
          newPlaceTableSeats
            ? Number(
                newPlaceTableSeats
              )
            : null,

        reservation:
          newPlaceReservation ||
          null,

        english_support:
          newPlaceEnglishSupport ||
          null,

        card:
          newPlaceCard,

        tax_free:
          newPlaceTaxFree,

        opening_hours:
          newPlaceOpeningHours.trim() ||
          null,

        closed_days:
          newPlaceClosedDays.trim() ||
          null,

        official_url:
          newPlaceOfficialUrl.trim() ||
          null,

        instagram_url:
          newPlaceInstagramUrl.trim() ||
          null,

        tabelog_url:
          newPlaceTabelogUrl.trim() ||
          null,

        google_maps_url:
          newPlaceGoogleMapsUrl.trim() ||
          null,

        status:
          "draft",
      })
      .select(
        "id, name, price_range"
      )
      .single();

    if (
      error ||
      !newPlace
    ) {
      throw new Error(
        `店舗の作成に失敗しました: ${
          error?.message ??
          "Unknown error"
        }`
      );
    }

    setPlaces(
      (current) => [
        ...current,
        newPlace as Place,
      ]
    );

    setSelectedPlaceIds(
      (current) => [
        ...current,
        newPlace.id,
      ]
    );

    return newPlace.id;
  }

  // =====================================
  // Save Food
  // =====================================

  async function handleSubmit(
    e: React.FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    if (!name.trim()) {
      setMessage(
        "Food nameを入力してください。"
      );
      return;
    }

    if (
      newPlaceOpen &&
      !newPlaceName.trim()
    ) {
      setMessage(
        "新しい店舗名を入力してください。"
      );
      return;
    }

    if (
      newPlaceOpen &&
      !newPlaceRegionId
    ) {
      setMessage(
        "新しい店舗のRegionを選択してください。"
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
      // New Place
      // ---------------------------------

      if (
        newPlaceOpen
      ) {
        await createNewPlace(
          site.id
        );
      }

      // ---------------------------------
      // Food Category
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
            data:
              newCategory,
            error:
              categoryError,
          } = await supabase
            .from(
              "food_categories"
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
              `Foodカテゴリの作成に失敗しました: ${
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
      // Food
      // ---------------------------------

      const {
        data: food,
        error:
          foodError,
      } = await supabase
        .from("foods")
        .insert({
          site_id:
            site.id,

          category_id:
            resolvedCategoryId,

          name:
            name.trim(),

          description:
            description.trim() ||
            null,

          image_url:
            imageUrl.trim() ||
            null,

          editor_pick:
            Number(
              editorPick
            ),

          status:
            status,
        })
        .select("id")
        .single();

      if (
        foodError ||
        !food
      ) {
        throw new Error(
          `Foodの保存に失敗しました: ${
            foodError?.message ??
            "Unknown error"
          }`
        );
      }

      // ---------------------------------
      // Food ↔ Place
      // ---------------------------------

      if (
        selectedPlaceIds.length >
        0
      ) {
        const rows =
          selectedPlaceIds.map(
            (placeId) => ({
              food_id:
                food.id,

              place_id:
                placeId,
            })
          );

        const {
          error:
            relationError,
        } = await supabase
          .from(
            "place_foods"
          )
          .insert(
            rows
          );

        if (
          relationError
        ) {
          throw new Error(
            `Foodと店舗の紐付けに失敗しました: ${relationError.message}`
          );
        }
      }

      setMessage(
        "Foodを保存しました。"
      );

      // =================================
      // Reset
      // =================================

      setName("");
      setDescription("");

      setCategoryInput("");
      setCategoryId("");

      setImageUrl("");

      setEditorPick("0");

      setStatus(
        "active"
      );

      setSelectedPlaceIds(
        []
      );

      setNewPlaceOpen(
        false
      );

      setNewPlaceTypeInput(
        ""
      );

      setNewPlaceTypeId(
        ""
      );

      setNewPlaceName(
        ""
      );

      setNewPlaceEditorNote(
        ""
      );

      setNewPlaceGroupInput(
        ""
      );

      setNewPlaceGroupId(
        ""
      );

      setNewPlaceAreaInput(
        ""
      );

      setNewPlaceAreaId(
        ""
      );

      setNewPlaceAddress(
        ""
      );

      setNewPlacePostalCode(
        ""
      );

      setNewPlacePhone(
        ""
      );

      setNewPlacePriceRange(
        ""
      );

      setNewPlaceSeats(
        ""
      );

      setNewPlaceCounterSeats(
        ""
      );

      setNewPlaceTableSeats(
        ""
      );

      setNewPlaceReservation(
        ""
      );

      setNewPlaceEnglishSupport(
        ""
      );

      setNewPlaceCard(
        false
      );

      setNewPlaceTaxFree(
        false
      );

      setNewPlaceOpeningHours(
        ""
      );

      setNewPlaceClosedDays(
        ""
      );

      setNewPlaceStationId(
        ""
      );

      setNewPlaceStationExit(
        ""
      );

      setNewPlaceWalkMinutes(
        ""
      );

      setNewPlaceOfficialUrl(
        ""
      );

      setNewPlaceInstagramUrl(
        ""
      );

      setNewPlaceTabelogUrl(
        ""
      );

      setNewPlaceGoogleMapsUrl(
        ""
      );

      const tokyo =
        regions.find(
          (region) =>
            region.name
              .trim()
              .toLowerCase() ===
            "tokyo"
        );

      setNewPlaceRegionId(
        tokyo
          ? String(
              tokyo.id
            )
          : ""
      );

      const cafe =
        placeTypes.find(
          (type) => {
            const value =
              type.name
                .trim()
                .toLowerCase();

            return (
              value === "café" ||
              value === "cafe"
            );
          }
        );

      if (cafe) {
        setNewPlaceTypeInput(
          cafe.name
        );

        setNewPlaceTypeId(
          String(
            cafe.id
          )
        );
      }
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
  // Render
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
          href="/admin/foods"
          style={styles.back}
        >
          ← Foods
        </Link>

        <header
          style={styles.header}
        >
          <p
            style={
              styles.eyebrow
            }
          >
            CONTENT / FOODS
          </p>

          <h1
            style={
              styles.title
            }
          >
            Add Food
          </h1>

          <p
            style={
              styles.description
            }
          >
            Foodと、それを提供するRestaurant / Caféを登録します。
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
          {/* =========================
              FOOD
          ========================== */}

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
              Food
            </h2>

            <label
              style={
                styles.label
              }
            >
              Food name *

              <input
                style={
                  styles.input
                }
                value={
                  name
                }
                onChange={(e) =>
                  setName(
                    e.target.value
                  )
                }
                placeholder="Carrot Cake"
                required
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
                list="food-categories"
                value={
                  categoryInput
                }
                onChange={(e) =>
                  handleCategoryChange(
                    e.target.value
                  )
                }
                placeholder="Dessert"
              />

              <datalist id="food-categories">
                {categoryOptions.map(
                  (
                    category
                  ) => (
                    <option
                      key={
                        category.id
                      }
                      value={
                        category.label.trim()
                      }
                    />
                  )
                )}
              </datalist>

              <span
                style={
                  styles.fieldHelp
                }
              >
                既存カテゴリは候補から選べます。新しい名前を入力すると保存時に自動作成されます。
              </span>
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

            <ImageUploader
              value={
                imageUrl
              }
              onChange={
                setImageUrl
              }
              folder="foods"
              label="Food Image"
            />

            <p
              style={
                styles.priceNote
              }
            >
              ※ Food自体には価格を登録しません。価格は提供店舗ごとの価格帯を表示します。
            </p>
          </section>

          {/* =========================
              WHERE TO EAT
          ========================== */}

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
                  Where to eat
                </h2>

                <p
                  style={
                    styles.helper
                  }
                >
                  このFoodを提供しているRestaurant / Caféを選択します。
                </p>
              </div>

              <button
                type="button"
                style={
                  styles.secondaryButton
                }
                onClick={() =>
                  setNewPlaceOpen(
                    !newPlaceOpen
                  )
                }
              >
                {newPlaceOpen
                  ? "Cancel"
                  : "+ Add New Restaurant / Café"}
              </button>
            </div>

            {/* =====================
                NEW PLACE
            ====================== */}

            {newPlaceOpen && (
              <div
                style={
                  styles.newPlaceBox
                }
              >
                <h3
                  style={
                    styles.newPlaceTitle
                  }
                >
                  New Restaurant / Café
                </h3>

                <label
                  style={
                    styles.label
                  }
                >
                  Place Type *

                  <input
                    style={
                      styles.input
                    }
                    list="food-place-types"
                    value={
                      newPlaceTypeInput
                    }
                    onChange={(e) =>
                      handleNewPlaceTypeChange(
                        e.target.value
                      )
                    }
                    placeholder="Café"
                  />

                  <datalist id="food-place-types">
                    {placeTypes
                      .filter(
                        (type) => {
                          const value =
                            type.name
                              .trim()
                              .toLowerCase();

                          return (
                            value ===
                              "restaurant" ||
                            value ===
                              "café" ||
                            value ===
                              "cafe"
                          );
                        }
                      )
                      .map(
                        (
                          type
                        ) => (
                          <option
                            key={
                              type.id
                            }
                            value={
                              type.name
                            }
                          />
                        )
                      )}
                  </datalist>

                  <span
                    style={
                      styles.fieldHelp
                    }
                  >
                    Foodから新規登録できるのはRestaurant / Caféです。
                  </span>
                </label>

                <label
                  style={
                    styles.label
                  }
                >
                  Place name *

                  <input
                    style={
                      styles.input
                    }
                    value={
                      newPlaceName
                    }
                    onChange={(e) =>
                      setNewPlaceName(
                        e.target
                          .value
                      )
                    }
                    placeholder="Aoyama Café"
                  />
                </label>

                <label
                  style={
                    styles.label
                  }
                >
                  Editor's note

                  <textarea
                    style={
                      styles.textareaSmall
                    }
                    value={
                      newPlaceEditorNote
                    }
                    onChange={(e) =>
                      setNewPlaceEditorNote(
                        e.target
                          .value
                      )
                    }
                    placeholder="駅から近く、観光の途中に立ち寄りやすいカフェです。"
                  />

                  <span
                    style={
                      styles.fieldHelp
                    }
                  >
                    この店舗を選んだ理由や、旅行者向けの短い一言コメントです。
                  </span>
                </label>

                <label
                  style={
                    styles.label
                  }
                >
                  Place Group

                  <input
                    style={
                      styles.input
                    }
                    list="food-place-groups"
                    value={
                      newPlaceGroupInput
                    }
                    onChange={(e) =>
                      handleNewPlaceGroupChange(
                        e.target.value
                      )
                    }
                    placeholder="No group"
                  />

                  <datalist id="food-place-groups">
                    {groups.map(
                      (
                        group
                      ) => (
                        <option
                          key={String(
                            group.id
                          )}
                          value={
                            group.name
                          }
                        />
                      )
                    )}
                  </datalist>
                </label>

                <div
                  style={
                    styles.row
                  }
                >
                  <label
                    style={
                      styles.label
                    }
                  >
                    Region

                    <select
                      style={
                        styles.input
                      }
                      value={
                        newPlaceRegionId
                      }
                      onChange={(e) =>
                        handleNewPlaceRegionChange(
                          e.target.value
                        )
                      }
                    >
                      <option value="">
                        Select region
                      </option>

                      {regions.map(
                        (
                          region
                        ) => (
                          <option
                            key={
                              region.id
                            }
                            value={
                              region.id
                            }
                          >
                            {
                              region.name
                            }
                          </option>
                        )
                      )}
                    </select>
                  </label>

                  <label
                    style={
                      styles.label
                    }
                  >
                    Area

                    <input
                      style={
                        styles.input
                      }
                      list="food-place-areas"
                      value={
                        newPlaceAreaInput
                      }
                      onChange={(e) =>
                        handleNewPlaceAreaChange(
                          e.target.value
                        )
                      }
                      disabled={
                        !newPlaceRegionId
                      }
                      placeholder="Shibuya"
                    />

                    <datalist id="food-place-areas">
                      {filteredNewPlaceAreas.map(
                        (
                          area
                        ) => (
                          <option
                            key={
                              area.id
                            }
                            value={
                              area.name
                            }
                          />
                        )
                      )}
                    </datalist>
                  </label>
                </div>

                <h4
                  style={
                    styles.subHeading
                  }
                >
                  Location
                </h4>

                <label
                  style={
                    styles.label
                  }
                >
                  Address

                  <input
                    style={
                      styles.input
                    }
                    value={
                      newPlaceAddress
                    }
                    onChange={(e) =>
                      setNewPlaceAddress(
                        e.target
                          .value
                      )
                    }
                  />
                </label>

                <div
                  style={
                    styles.row
                  }
                >
                  <label
                    style={
                      styles.label
                    }
                  >
                    Postal code

                    <input
                      style={
                        styles.input
                      }
                      value={
                        newPlacePostalCode
                      }
                      onChange={(e) =>
                        setNewPlacePostalCode(
                          e.target
                            .value
                        )
                      }
                    />
                  </label>

                  <label
                    style={
                      styles.label
                    }
                  >
                    Phone

                    <input
                      style={
                        styles.input
                      }
                      value={
                        newPlacePhone
                      }
                      onChange={(e) =>
                        setNewPlacePhone(
                          e.target
                            .value
                        )
                      }
                    />
                  </label>
                </div>

                <h4
                  style={
                    styles.subHeading
                  }
                >
                  Restaurant / Café Information
                </h4>

                <label
                  style={
                    styles.label
                  }
                >
                  Price range

                  <input
                    style={
                      styles.input
                    }
                    value={
                      newPlacePriceRange
                    }
                    onChange={(e) =>
                      setNewPlacePriceRange(
                        e.target.value
                      )
                    }
                    placeholder="¥¥"
                  />
                </label>

                <div
                  style={
                    styles.row3
                  }
                >
                  <label
                    style={
                      styles.label
                    }
                  >
                    Seats

                    <input
                      style={
                        styles.input
                      }
                      type="number"
                      value={
                        newPlaceSeats
                      }
                      onChange={(e) =>
                        setNewPlaceSeats(
                          e.target
                            .value
                        )
                      }
                    />
                  </label>

                  <label
                    style={
                      styles.label
                    }
                  >
                    Counter seats

                    <input
                      style={
                        styles.input
                      }
                      type="number"
                      value={
                        newPlaceCounterSeats
                      }
                      onChange={(e) =>
                        setNewPlaceCounterSeats(
                          e.target
                            .value
                        )
                      }
                    />
                  </label>

                  <label
                    style={
                      styles.label
                    }
                  >
                    Table seats

                    <input
                      style={
                        styles.input
                      }
                      type="number"
                      value={
                        newPlaceTableSeats
                      }
                      onChange={(e) =>
                        setNewPlaceTableSeats(
                          e.target
                            .value
                        )
                      }
                    />
                  </label>
                </div>

                <label
                  style={
                    styles.label
                  }
                >
                  Reservation

                  <select
                    style={
                      styles.input
                    }
                    value={
                      newPlaceReservation
                    }
                    onChange={(e) =>
                      setNewPlaceReservation(
                        e.target.value
                      )
                    }
                  >
                    <option value="">
                      Select
                    </option>

                    <option value="No">
                      No
                    </option>

                    <option value="Yes">
                      Yes
                    </option>

                    <option value="Required">
                      Required
                    </option>

                    <option value="Recommended">
                      Recommended
                    </option>
                  </select>
                </label>

                <label
                  style={
                    styles.label
                  }
                >
                  English support

                  <select
                    style={
                      styles.input
                    }
                    value={
                      newPlaceEnglishSupport
                    }
                    onChange={(e) =>
                      setNewPlaceEnglishSupport(
                        e.target
                          .value
                      )
                    }
                  >
                    <option value="">
                      Select
                    </option>

                    <option value="Full">
                      Full
                    </option>

                    <option value="Partial">
                      Partial
                    </option>

                    <option value="None">
                      None
                    </option>
                  </select>
                </label>

                <div
                  style={
                    styles.checkRow
                  }
                >
                  <label
                    style={
                      styles.checkbox
                    }
                  >
                    <input
                      type="checkbox"
                      checked={
                        newPlaceCard
                      }
                      onChange={(e) =>
                        setNewPlaceCard(
                          e.target
                            .checked
                        )
                      }
                    />

                    Card accepted
                  </label>

                  <label
                    style={
                      styles.checkbox
                    }
                  >
                    <input
                      type="checkbox"
                      checked={
                        newPlaceTaxFree
                      }
                      onChange={(e) =>
                        setNewPlaceTaxFree(
                          e.target
                            .checked
                        )
                      }
                    />

                    Tax free
                  </label>
                </div>

                <label
                  style={
                    styles.label
                  }
                >
                  Opening hours

                  <textarea
                    style={
                      styles.textareaSmall
                    }
                    value={
                      newPlaceOpeningHours
                    }
                    onChange={(e) =>
                      setNewPlaceOpeningHours(
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
                  Closed days

                  <input
                    style={
                      styles.input
                    }
                    value={
                      newPlaceClosedDays
                    }
                    onChange={(e) =>
                      setNewPlaceClosedDays(
                        e.target.value
                      )
                    }
                  />
                </label>

                <h4
                  style={
                    styles.subHeading
                  }
                >
                  Access
                </h4>

                <label
                  style={
                    styles.label
                  }
                >
                  Nearest station

                  <select
                    style={
                      styles.input
                    }
                    value={
                      newPlaceStationId
                    }
                    onChange={(e) =>
                      setNewPlaceStationId(
                        e.target
                          .value
                      )
                    }
                  >
                    <option value="">
                      Select station
                    </option>

                    {stations.map(
                      (
                        station
                      ) => (
                        <option
                          key={
                            station.id
                          }
                          value={
                            station.id
                          }
                        >
                          {
                            station.name
                          }
                        </option>
                      )
                    )}
                  </select>
                </label>

                <div
                  style={
                    styles.row
                  }
                >
                  <label
                    style={
                      styles.label
                    }
                  >
                    Exit

                    <input
                      style={
                        styles.input
                      }
                      value={
                        newPlaceStationExit
                      }
                      onChange={(e) =>
                        setNewPlaceStationExit(
                          e.target
                            .value
                        )
                      }
                    />
                  </label>

                  <label
                    style={
                      styles.label
                    }
                  >
                    Walk minutes

                    <input
                      style={
                        styles.input
                      }
                      type="number"
                      value={
                        newPlaceWalkMinutes
                      }
                      onChange={(e) =>
                        setNewPlaceWalkMinutes(
                          e.target
                            .value
                        )
                      }
                    />
                  </label>
                </div>

                <h4
                  style={
                    styles.subHeading
                  }
                >
                  Links
                </h4>

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
                      newPlaceOfficialUrl
                    }
                    onChange={(e) =>
                      setNewPlaceOfficialUrl(
                        e.target
                          .value
                      )
                    }
                  />
                </label>

                <label
                  style={
                    styles.label
                  }
                >
                  Instagram

                  <input
                    style={
                      styles.input
                    }
                    value={
                      newPlaceInstagramUrl
                    }
                    onChange={(e) =>
                      setNewPlaceInstagramUrl(
                        e.target
                          .value
                      )
                    }
                  />
                </label>

                <label
                  style={
                    styles.label
                  }
                >
                  Tabelog

                  <input
                    style={
                      styles.input
                    }
                    value={
                      newPlaceTabelogUrl
                    }
                    onChange={(e) =>
                      setNewPlaceTabelogUrl(
                        e.target
                          .value
                      )
                    }
                  />
                </label>

                <label
                  style={
                    styles.label
                  }
                >
                  Google Maps

                  <input
                    style={
                      styles.input
                    }
                    value={
                      newPlaceGoogleMapsUrl
                    }
                    onChange={(e) =>
                      setNewPlaceGoogleMapsUrl(
                        e.target
                          .value
                      )
                    }
                  />
                </label>
              </div>
            )}

            {/* =====================
                EXISTING PLACES
            ====================== */}

            {places.length >
              0 && (
              <div
                style={
                  styles.placeList
                }
              >
                {places.map(
                  (place) => (
                    <label
                      key={
                        place.id
                      }
                      style={
                        styles.placeOption
                      }
                    >
                      <input
                        type="checkbox"
                        checked={selectedPlaceIds.includes(
                          place.id
                        )}
                        onChange={() =>
                          togglePlace(
                            place.id
                          )
                        }
                      />

                      <span
                        style={
                          styles.placeInfo
                        }
                      >
                        <strong>
                          {
                            place.name
                          }
                        </strong>

                        <span
                          style={
                            styles.priceRange
                          }
                        >
                          {place.price_range ??
                            "Price range not set"}
                        </span>
                      </span>
                    </label>
                  )
                )}
              </div>
            )}
          </section>

          {/* =========================
              PUBLISHING
          ========================== */}

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
                    e.target
                      .value as FoodStatus
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
              : "Save Food"}
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
    minHeight:
      "100vh",
    background:
      "#faf8f6",
    color:
      "#222",
    padding:
      "40px 24px 90px",
  },

  loadingPage: {
    minHeight:
      "100vh",
    display:
      "flex",
    alignItems:
      "center",
    justifyContent:
      "center",
    background:
      "#faf8f6",
    color:
      "#888",
  },

  container: {
    maxWidth:
      "900px",
    margin:
      "0 auto",
  },

  back: {
    color:
      "#777",
    textDecoration:
      "none",
    fontSize:
      "13px",
  },

  header: {
    padding:
      "35px 0 28px",
  },

  eyebrow: {
    color:
      "#c8647b",
    fontSize:
      "10px",
    fontWeight:
      700,
    letterSpacing:
      "3px",
    marginBottom:
      "8px",
  },

  title: {
    fontFamily:
      "Georgia, serif",
    fontSize:
      "48px",
    fontWeight:
      400,
    margin: 0,
  },

  description: {
    color:
      "#777",
    lineHeight:
      1.7,
    marginTop:
      "10px",
  },

  form: {
    display:
      "flex",
    flexDirection:
      "column" as const,
    gap:
      "18px",
  },

  section: {
    background:
      "#fff",
    border:
      "1px solid #e7e0dc",
    borderRadius:
      "15px",
    padding:
      "22px",
  },

  sectionHeader: {
    display:
      "flex",
    justifyContent:
      "space-between",
    alignItems:
      "flex-start",
    gap:
      "15px",
    marginBottom:
      "18px",
  },

  sectionTitle: {
    fontFamily:
      "Georgia, serif",
    fontSize:
      "24px",
    fontWeight:
      400,
    marginTop: 0,
    marginBottom:
      "18px",
  },

  subHeading: {
    fontFamily:
      "Georgia, serif",
    fontSize:
      "18px",
    fontWeight:
      400,
    margin:
      "25px 0 15px",
  },

  newPlaceTitle: {
    fontFamily:
      "Georgia, serif",
    fontSize:
      "20px",
    fontWeight:
      400,
    margin:
      "0 0 18px",
  },

  newPlaceBox: {
    background:
      "#fcfaf9",
    border:
      "1px solid #e4dcd8",
    borderRadius:
      "12px",
    padding:
      "20px",
    marginBottom:
      "18px",
  },

  label: {
    display:
      "flex",
    flexDirection:
      "column" as const,
    gap:
      "7px",
    fontSize:
      "13px",
    fontWeight:
      600,
    marginBottom:
      "14px",
  },

  input: {
    width:
      "100%",
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
    width:
      "100%",
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
    width:
      "100%",
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

  row: {
    display:
      "grid",
    gridTemplateColumns:
      "repeat(2, minmax(0, 1fr))",
    gap:
      "12px",
  },

  row3: {
    display:
      "grid",
    gridTemplateColumns:
      "repeat(3, minmax(0, 1fr))",
    gap:
      "12px",
  },

  checkRow: {
    display:
      "flex",
    gap:
      "25px",
    flexWrap:
      "wrap" as const,
    marginBottom:
      "15px",
  },

  checkbox: {
    display:
      "flex",
    alignItems:
      "center",
    gap:
      "8px",
    fontSize:
      "13px",
    fontWeight:
      400,
  },

  fieldHelp: {
    color:
      "#999",
    fontSize:
      "11px",
    fontWeight:
      400,
    lineHeight:
      1.5,
  },

  helper: {
    color:
      "#888",
    fontSize:
      "12px",
    lineHeight:
      1.6,
  },

  priceNote: {
    color:
      "#999",
    fontSize:
      "11px",
    lineHeight:
      1.6,
    marginTop:
      "10px",
  },

  placeList: {
    display:
      "flex",
    flexDirection:
      "column" as const,
    gap:
      "8px",
  },

  placeOption: {
    display:
      "flex",
    alignItems:
      "center",
    gap:
      "11px",
    border:
      "1px solid #e7e0dc",
    borderRadius:
      "10px",
    padding:
      "13px",
    cursor:
      "pointer",
  },

  placeInfo: {
    display:
      "flex",
    flexDirection:
      "column" as const,
    gap:
      "4px",
    fontSize:
      "13px",
  },

  priceRange: {
    color:
      "#999",
    fontSize:
      "11px",
    fontWeight:
      400,
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

  saveButton: {
    border: 0,
    borderRadius:
      "11px",
    background:
      "#222",
    color:
      "#fff",
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

  categoryOption: {
    display:
      "flex",
    alignItems:
      "center",
    gap:
      "8px",
    padding:
      "7px 0",
    fontSize:
      "13px",
    fontWeight:
      400,
  },
};