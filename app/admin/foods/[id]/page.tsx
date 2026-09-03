"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import ImageUploader from "@/components/ImageUploader";

type FoodStatus =
  | "active"
  | "hidden"
  | "archived";

type Category = {
  id: number;
  name: string;
  parent_id: number | null;
};

type CategoryNode = Category & {
  children: CategoryNode[];
};

type PlaceType = {
  id: number;
  name: string;
};

type PlaceGroup = {
  id: string;
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

type Place = {
  id: string;
  name: string;
  price_range: string | null;
  place_type_id: number | null;
};

export default function EditFoodPage() {
  const params = useParams();
  const foodId = String(params.id);

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
  // Options
  // =====================================

  const [categories, setCategories] =
    useState<Category[]>([]);

  const [places, setPlaces] =
    useState<Place[]>([]);

  const [placeTypes, setPlaceTypes] =
    useState<PlaceType[]>([]);

  const [placeGroups, setPlaceGroups] =
    useState<PlaceGroup[]>([]);

  const [regions, setRegions] =
    useState<Region[]>([]);

  const [areas, setAreas] =
    useState<Area[]>([]);

  const [stations, setStations] =
    useState<Station[]>([]);

  // =====================================
  // Existing Place relation
  // =====================================

  const [selectedPlaceIds, setSelectedPlaceIds] =
    useState<string[]>([]);

  // =====================================
  // New Restaurant / Café
  // =====================================

  const [newPlaceOpen, setNewPlaceOpen] =
    useState(false);

  const [newPlaceTypeInput, setNewPlaceTypeInput] =
    useState("");

  const [newPlaceName, setNewPlaceName] =
    useState("");

  const [newPlaceGroupInput, setNewPlaceGroupInput] =
    useState("");

  const [newPlaceRegionId, setNewPlaceRegionId] =
    useState("");

  const [newPlaceAreaInput, setNewPlaceAreaInput] =
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

  const [newPlaceEditorNote, setNewPlaceEditorNote] =
    useState("");

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
        foodResult,
        categoriesResult,
        placesResult,
        placeTypesResult,
        placeGroupsResult,
        regionsResult,
        areasResult,
        stationsResult,
        relationsResult,
      ] = await Promise.all([
        supabase
          .from("foods")
          .select("*")
          .eq("id", foodId)
          .single(),

        supabase
          .from("food_categories")
          .select(
            "id, name, parent_id"
          )
          .eq("is_active", true)
          .order("sort_order")
          .order("name"),

        supabase
          .from("places")
          .select(
            "id, name, price_range, place_type_id"
          )
          .in("status", [
            "draft",
            "published",
          ])
          .order("name"),

        supabase
          .from("place_types")
          .select(
            "id, name"
          )
          .eq("is_active", true)
          .order("sort_order")
          .order("name"),

        supabase
          .from("place_groups")
          .select(
            "id, name"
          )
          .eq("is_active", true)
          .order("name"),

        supabase
          .from("regions")
          .select(
            "id, name"
          )
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
          .select(
            "id, name"
          )
          .eq("is_active", true)
          .order("name"),

        supabase
          .from("place_foods")
          .select(
            "place_id"
          )
          .eq(
            "food_id",
            foodId
          ),
      ]);

      // ---------------------------------
      // Food
      // ---------------------------------

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

      const food =
        foodResult.data;

      setName(
        food.name ?? ""
      );

      setDescription(
        food.description ?? ""
      );

      setImageUrl(
        food.image_url ?? ""
      );

      setEditorPick(
        String(
          food.editor_pick ?? 0
        )
      );

      if (
        food.status === "active" ||
        food.status === "hidden" ||
        food.status === "archived"
      ) {
        setStatus(
          food.status
        );
      } else {
        setStatus("active");
      }

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
              food.category_id ??
                ""
            )
        );

      setCategoryId(
        matchedCategory
          ? String(
              matchedCategory.id
            )
          : ""
      );

      setCategoryInput(
        matchedCategory?.name ??
          ""
      );

      // ---------------------------------
      // Options
      // ---------------------------------

      setPlaces(
        (placesResult.data ??
          []) as Place[]
      );

      setPlaceTypes(
        (placeTypesResult.data ??
          []) as PlaceType[]
      );

      setPlaceGroups(
        (placeGroupsResult.data ??
          []) as PlaceGroup[]
      );

      setRegions(
        (regionsResult.data ??
          []) as Region[]
      );

      setAreas(
        (areasResult.data ??
          []) as Area[]
      );

      setStations(
        (stationsResult.data ??
          []) as Station[]
      );

      // ---------------------------------
      // Relations
      // ---------------------------------

      setSelectedPlaceIds(
        (
          relationsResult.data ??
          []
        ).map(
          (row) =>
            String(
              row.place_id
            )
        )
      );

      const errors = [
        categoriesResult.error,
        placesResult.error,
        placeTypesResult.error,
        placeGroupsResult.error,
        regionsResult.error,
        areasResult.error,
        stationsResult.error,
        relationsResult.error,
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

      // Tokyo default
      const tokyo =
        (
          (regionsResult.data ??
            []) as Region[]
        ).find(
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

      // Cafe default
      const cafe =
        (
          (placeTypesResult.data ??
            []) as PlaceType[]
        ).find(
          (type) => {
            const value =
              type.name
                .trim()
                .toLowerCase();

            return (
              value ===
                "café" ||
              value ===
                "cafe"
            );
          }
        );

      if (cafe) {
        setNewPlaceTypeInput(
          cafe.name
        );
      }

      setLoading(false);
    }

    load();
  }, [foodId]);

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
  // Category change
  // =====================================

  function handleCategoryChange(
    value: string
  ) {
    setCategoryInput(
      value
    );

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
  // Render Category
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
            name="food-category"
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

          {
            category.name
          }
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
  // Existing Places
  // =====================================

  function togglePlace(
    placeId: string
  ) {
    setSelectedPlaceIds(
      (current) =>
        current.includes(
          placeId
        )
          ? current.filter(
              (id) =>
                id !==
                placeId
            )
          : [
              ...current,
              placeId,
            ]
    );
  }

  const foodPlaces =
    useMemo(() => {
      return places.filter(
        (place) => {
          if (
            place.place_type_id ===
            null
          ) {
            return false;
          }

          const type =
            placeTypes.find(
              (item) =>
                item.id ===
                place.place_type_id
            );

          if (!type) {
            return false;
          }

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
      );
    }, [
      places,
      placeTypes,
    ]);

  // =====================================
  // New Place Areas
  // =====================================

  const filteredAreas =
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

  function handleNewPlaceRegionChange(
    value: string
  ) {
    setNewPlaceRegionId(
      value
    );

    setNewPlaceAreaInput(
      ""
    );
  }

  function handleNewPlaceAreaChange(
    value: string
  ) {
    setNewPlaceAreaInput(
      value
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

    const existing =
      placeTypes.find(
        (type) =>
          type.name
            .trim()
            .toLowerCase() ===
          trimmed.toLowerCase()
      );

    if (existing) {
      return existing.id;
    }

    const slug =
      trimmed
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(
          /[^a-z0-9-]/g,
          ""
        ) ||
      `place-type-${Date.now()}`;

    const {
      data,
      error,
    } = await supabase
      .from(
        "place_types"
      )
      .insert({
        site_id:
          siteId,
        name:
          trimmed,
        slug,
        description:
          null,
        is_active:
          true,
        sort_order:
          0,
      })
      .select(
        "id"
      )
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
  ): Promise<string | null> {
    const trimmed =
      newPlaceGroupInput.trim();

    if (!trimmed) {
      return null;
    }

    const existing =
      placeGroups.find(
        (group) =>
          group.name
            .trim()
            .toLowerCase() ===
          trimmed.toLowerCase()
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
      .from(
        "place_groups"
      )
      .insert({
        site_id:
          siteId,
        name:
          trimmed,
        is_active:
          true,
      })
      .select(
        "id"
      )
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

  async function resolveArea(): Promise<number | null> {
    const trimmed =
      newPlaceAreaInput.trim();

    if (
      !trimmed ||
      !newPlaceRegionId
    ) {
      return null;
    }

    const existing =
      filteredAreas.find(
        (area) =>
          area.name
            .trim()
            .toLowerCase() ===
          trimmed.toLowerCase()
      );

    if (existing) {
      return existing.id;
    }

    const {
      data,
      error,
    } = await supabase
      .from(
        "areas"
      )
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
      .select(
        "id"
      )
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
        "Regionを選択してください。"
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
      data: newPlace,
      error,
    } = await supabase
      .from(
        "places"
      )
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
        "id, name, price_range, place_type_id"
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

    // このFoodに自動紐付け
    const {
      error:
        relationError,
    } = await supabase
      .from(
        "place_foods"
      )
      .insert({
        food_id:
          foodId,
        place_id:
          newPlace.id,
      });

    if (
      relationError
    ) {
      throw new Error(
        `Foodと店舗の紐付けに失敗しました: ${relationError.message}`
      );
    }

    // Access
    if (newPlaceStationId) {
      const {
        error:
          accessError,
      } = await supabase
        .from(
          "place_access"
        )
        .insert({
          place_id:
            newPlace.id,

          station_id:
            Number(
              newPlaceStationId
            ),

          station_exit:
            newPlaceStationExit.trim() ||
            null,

          walk_minutes:
            newPlaceWalkMinutes
              ? Number(
                  newPlaceWalkMinutes
                )
              : null,
        });

      if (
        accessError
      ) {
        throw new Error(
          `アクセス情報の保存に失敗しました: ${accessError.message}`
        );
      }
    }

    setPlaces(
      (current) => [
        ...current,
        {
          id:
            newPlace.id,
          name:
            newPlace.name,
          price_range:
            newPlace.price_range,
          place_type_id:
            newPlace.place_type_id,
        },
      ]
    );

    setSelectedPlaceIds(
      (current) => [
        ...current,
        String(
          newPlace.id
        ),
      ]
    );

    return String(
      newPlace.id
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

      if (newPlaceOpen) {
        await createNewPlace(
          site.id
        );
      }

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
              trimmedCategory.toLowerCase()
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
        error:
          foodError,
      } = await supabase
        .from(
          "foods"
        )
        .update({
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

          status,
        })
        .eq(
          "id",
          foodId
        );

      if (
        foodError
      ) {
        throw new Error(
          `Foodの更新に失敗しました: ${foodError.message}`
        );
      }

      // ---------------------------------
      // Food ↔ Place
      // ---------------------------------

      const {
        error:
          deleteError,
      } = await supabase
        .from(
          "place_foods"
        )
        .delete()
        .eq(
          "food_id",
          foodId
        );

      if (
        deleteError
      ) {
        throw new Error(
          `店舗紐付けの更新に失敗しました: ${deleteError.message}`
        );
      }

      if (
        selectedPlaceIds.length >
        0
      ) {
        const rows =
          selectedPlaceIds.map(
            (placeId) => ({
              food_id:
                foodId,
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
            `店舗の紐付けに失敗しました: ${relationError.message}`
          );
        }
      }

      setMessage(
        "Foodを保存しました。"
      );

      setNewPlaceOpen(
        false
      );

      resetNewPlaceForm();
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
  // Reset new place
  // =====================================

  function resetNewPlaceForm() {
    setNewPlaceName("");
    setNewPlaceGroupInput("");
    setNewPlaceAreaInput("");
    setNewPlaceAddress("");
    setNewPlacePostalCode("");
    setNewPlacePhone("");
    setNewPlacePriceRange("");
    setNewPlaceSeats("");
    setNewPlaceCounterSeats("");
    setNewPlaceTableSeats("");
    setNewPlaceReservation("");
    setNewPlaceEnglishSupport("");
    setNewPlaceCard(false);
    setNewPlaceTaxFree(false);
    setNewPlaceOpeningHours("");
    setNewPlaceClosedDays("");
    setNewPlaceStationId("");
    setNewPlaceStationExit("");
    setNewPlaceWalkMinutes("");
    setNewPlaceOfficialUrl("");
    setNewPlaceInstagramUrl("");
    setNewPlaceTabelogUrl("");
    setNewPlaceGoogleMapsUrl("");
    setNewPlaceEditorNote("");
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
        <div
          style={styles.topbar}
        >
          <Link
            href="/admin/foods"
            style={styles.back}
          >
            ← Foods
          </Link>

          <Link
            href={`/foods/${foodId}`}
            target="_blank"
            rel="noopener noreferrer"
            style={styles.preview}
          >
            Preview ↗
          </Link>
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
            CONTENT / FOODS
          </p>

          <h1
            style={
              styles.title
            }
          >
            Edit Food
          </h1>

          <p
            style={
              styles.description
            }
          >
            Foodと提供店舗を編集します。
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
              FOOD
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
              Category

              <input
                style={
                  styles.input
                }
                list="food-category-options"
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

              <datalist id="food-category-options">
                {categories.map(
                  (category) => (
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

              <span
                style={
                  styles.fieldHelp
                }
              >
                既存カテゴリは候補から選択できます。新しい名前を入力すると保存時に自動作成します。
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
          </section>

          {/* =====================
              WHERE TO EAT
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
                      setNewPlaceTypeInput(
                        e.target.value
                      )
                    }
                    placeholder="Café"
                  />

                  <datalist id="food-place-types">
                    {placeTypes.map(
                      (type) => (
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
                        e.target.value
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
                      setNewPlaceGroupInput(
                        e.target.value
                      )
                    }
                    placeholder="LOFT / Starbucks / ..."
                  />

                  <datalist id="food-place-groups">
                    {placeGroups.map(
                      (group) => (
                        <option
                          key={
                            String(
                              group.id
                            )
                          }
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
                        (region) => (
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
                      {filteredAreas.map(
                        (area) => (
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
                        e.target.value
                      )
                    }
                    placeholder="駅から近く、観光の途中にも立ち寄りやすい店舗です。"
                  />

                  <span
                    style={
                      styles.fieldHelp
                    }
                  >
                    この店舗を東京ガイドに掲載する理由や、おすすめポイントを短く記載します。
                  </span>
                </label>

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
                        e.target.value
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
                          e.target.value
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

                  <span
                    style={
                      styles.fieldHelp
                    }
                  >
                    Food側では価格を持たず、店舗の価格帯を表示します。
                  </span>
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
                          e.target.value
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
                        e.target.value
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
                          e.target.checked
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
                          e.target.checked
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
                        e.target.value
                      )
                    }
                  >
                    <option value="">
                      Select station
                    </option>

                    {stations.map(
                      (station) => (
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
                          e.target.value
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
                        e.target.value
                      )
                    }
                  />
                </label>
              </div>
            )}

            <div
              style={
                styles.placeList
              }
            >
              {foodPlaces.length ===
              0 ? (
                <p
                  style={
                    styles.muted
                  }
                >
                  Restaurant / Caféがまだ登録されていません。
                </p>
              ) : (
                foodPlaces.map(
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
                )
              )}
            </div>

            <p
              style={
                styles.fieldHelp
              }
            >
              既存店舗から複数選択できます。店舗ごとの価格帯はPlace側の情報を表示します。
            </p>
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
    margin:
      "0 auto",
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

  preview: {
    color: "#777",
    textDecoration:
      "none",
    fontSize: "12px",
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
    display: "flex",
    flexDirection:
      "column" as const,
    gap: "18px",
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
    display: "flex",
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
    margin:
      "0 0 18px",
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

  categoryTree: {
    border:
      "1px solid #eee8e4",
    borderRadius:
      "9px",
    padding:
      "10px 13px",
    maxHeight:
      "260px",
    overflowY:
      "auto" as const,
    marginTop:
      "5px",
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
    marginTop:
      "7px",
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

  bottomBar: {
    display:
      "flex",
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

  muted: {
    color:
      "#888",
    fontSize:
      "13px",
  },
};