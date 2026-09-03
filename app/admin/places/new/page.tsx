"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import ImageGalleryUploader, {
  type GalleryImage,
} from "@/components/ImageGalleryUploader";

type Option = {
  id: number | string;
  name: string;
};

type Area = {
  id: number;
  region_id: number;
  name: string;
};

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

export default function NewPlacePage() {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [editorNote, setEditorNote] = useState("");

  const [placeTypeInput, setPlaceTypeInput] = useState("");
  const [placeTypeId, setPlaceTypeId] = useState("");

  const [groupInput, setGroupInput] = useState("");
  const [groupId, setGroupId] = useState("");

  const [regionId, setRegionId] = useState("");
  const [areaInput, setAreaInput] = useState("");
  const [areaId, setAreaId] = useState("");

  const [address, setAddress] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [phone, setPhone] = useState("");

  const [priceRange, setPriceRange] = useState("");
  const [seats, setSeats] = useState("");
  const [counterSeats, setCounterSeats] = useState("");
  const [tableSeats, setTableSeats] = useState("");
  const [reservation, setReservation] = useState("");

  const [englishSupport, setEnglishSupport] = useState("");
  const [card, setCard] = useState(false);
  const [taxFree, setTaxFree] = useState(false);
  const [openingHours, setOpeningHours] = useState("");
  const [closedDays, setClosedDays] = useState("");

  const [officialUrl, setOfficialUrl] = useState("");
  const [instagramUrl, setInstagramUrl] = useState("");
  const [tabelogUrl, setTabelogUrl] = useState("");
  const [googleMapsUrl, setGoogleMapsUrl] = useState("");

  const [status, setStatus] = useState("draft");

  const [groups, setGroups] = useState<Option[]>([]);
  const [regions, setRegions] = useState<Option[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Option[]>([]);
  const [stations, setStations] = useState<Option[]>([]);
  const [placeTypes, setPlaceTypes] = useState<PlaceType[]>([]);

  const [selectedCategoryIds, setSelectedCategoryIds] =
    useState<number[]>([]);

  const [selectedProductIds, setSelectedProductIds] =
    useState<string[]>([]);

  const [selectedStationId, setSelectedStationId] =
    useState("");

  const [stationExit, setStationExit] = useState("");
  const [walkMinutes, setWalkMinutes] = useState("");

  const [placeImages, setPlaceImages] =
    useState<GalleryImage[]>([]);

  const [loadingOptions, setLoadingOptions] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function loadOptions() {
      setLoadingOptions(true);

      const [
        groupsResult,
        regionsResult,
        areasResult,
        categoriesResult,
        productsResult,
        placeTypesResult,
        stationsResult,
      ] = await Promise.all([
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
          .select("id, region_id, name")
          .eq("is_active", true)
          .order("sort_order")
          .order("name"),

        supabase
          .from("place_categories")
          .select("id, name, parent_id")
          .eq("is_active", true)
          .order("sort_order")
          .order("name"),

        supabase
          .from("products")
          .select("id, name")
          .in("status", ["draft", "published"])
          .order("name"),

        supabase
          .from("place_types")
          .select("id, name")
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
        groupsResult.error,
        regionsResult.error,
        areasResult.error,
        categoriesResult.error,
        productsResult.error,
        placeTypesResult.error,
        stationsResult.error,
      ].filter(Boolean);

      if (errors.length > 0) {
        setMessage(
          `選択肢の読み込みに失敗しました: ${errors[0]!.message}`
        );
      }

      const loadedGroups =
        (groupsResult.data ?? []) as Option[];

      const loadedRegions =
        (regionsResult.data ?? []) as Option[];

      const loadedPlaceTypes =
        (placeTypesResult.data ?? []) as PlaceType[];

      setGroups(loadedGroups);
      setRegions(loadedRegions);
      setAreas((areasResult.data ?? []) as Area[]);
      setCategories(
        (categoriesResult.data ?? []) as Category[]
      );
      setProducts((productsResult.data ?? []) as Option[]);
      setPlaceTypes(loadedPlaceTypes);
      setStations((stationsResult.data ?? []) as Option[]);

      const tokyo = loadedRegions.find(
        (region) =>
          region.name.trim().toLowerCase() === "tokyo"
      );

      if (tokyo) {
        setRegionId(String(tokyo.id));
      }

      setLoadingOptions(false);
    }

    loadOptions();
  }, []);

  const filteredAreas = useMemo(() => {
    if (!regionId) {
      return [];
    }

    return areas.filter(
      (area) => area.region_id === Number(regionId)
    );
  }, [areas, regionId]);

  function handleRegionChange(value: string) {
    setRegionId(value);
    setAreaId("");
    setAreaInput("");
  }

  function handleAreaChange(value: string) {
    setAreaInput(value);

    const matchedArea = filteredAreas.find(
      (area) =>
        area.name.trim().toLowerCase() ===
        value.trim().toLowerCase()
    );

    setAreaId(
      matchedArea ? String(matchedArea.id) : ""
    );
  }

  function handleGroupChange(value: string) {
    setGroupInput(value);

    const matchedGroup = groups.find(
      (group) =>
        group.name.trim().toLowerCase() ===
        value.trim().toLowerCase()
    );

    setGroupId(
      matchedGroup ? String(matchedGroup.id) : ""
    );
  }

  function handlePlaceTypeChange(value: string) {
    setPlaceTypeInput(value);

    const matchedType = placeTypes.find(
      (type) =>
        type.name.trim().toLowerCase() ===
        value.trim().toLowerCase()
    );

    setPlaceTypeId(
      matchedType ? String(matchedType.id) : ""
    );
  }

  const isFoodPlace = useMemo(() => {
    const value =
      placeTypeInput.trim().toLowerCase();

    return (
      value === "restaurant" ||
      value === "café" ||
      value === "cafe"
    );
  }, [placeTypeInput]);

  const categoryTree = useMemo(() => {
    const nodes = new Map<number, CategoryNode>();

    categories.forEach((category) => {
      nodes.set(category.id, {
        ...category,
        children: [],
      });
    });

    const roots: CategoryNode[] = [];

    categories.forEach((category) => {
      const node = nodes.get(category.id);

      if (!node) {
        return;
      }

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

  function toggleCategory(id: number) {
    setSelectedCategoryIds((current) =>
      current.includes(id)
        ? current.filter((value) => value !== id)
        : [...current, id]
    );
  }

  function toggleProduct(id: string) {
    setSelectedProductIds((current) =>
      current.includes(id)
        ? current.filter((value) => value !== id)
        : [...current, id]
    );
  }

  async function resolveGroupId(
    siteId: string
  ): Promise<string | null> {
    const trimmedName = groupInput.trim();

    if (!trimmedName) {
      return null;
    }

    const existingGroup = groups.find(
      (group) =>
        group.name.trim().toLowerCase() ===
        trimmedName.toLowerCase()
    );

    if (existingGroup) {
      return String(existingGroup.id);
    }

    const {
      data,
      error,
    } = await supabase
      .from("place_groups")
      .insert({
        site_id: siteId,
        name: trimmedName,
        is_active: true,
      })
      .select("id")
      .single();

    if (error || !data) {
      throw new Error(
        `Place Groupの作成に失敗しました: ${
          error?.message ?? "Unknown error"
        }`
      );
    }

    return String(data.id);
  }

  async function resolvePlaceTypeId(
    siteId: string
  ): Promise<number | null> {
    const trimmedName =
      placeTypeInput.trim();

    if (!trimmedName) {
      return null;
    }

    const existingType =
      placeTypes.find(
        (type) =>
          type.name.trim().toLowerCase() ===
          trimmedName.toLowerCase()
      );

    if (existingType) {
      return existingType.id;
    }

    const slug =
      trimmedName
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9-]/g, "") ||
      `place-type-${Date.now()}`;

    const {
      data,
      error,
    } = await supabase
      .from("place_types")
      .insert({
        site_id: siteId,
        name: trimmedName,
        slug,
        description: null,
        is_active: true,
        sort_order: 0,
      })
      .select("id")
      .single();

    if (error || !data) {
      throw new Error(
        `Place Typeの作成に失敗しました: ${
          error?.message ?? "Unknown error"
        }`
      );
    }

    return data.id;
  }

  async function resolveAreaId(): Promise<
    number | null
  > {
    const trimmedName = areaInput.trim();

    if (!trimmedName || !regionId) {
      return null;
    }

    const existingArea =
      filteredAreas.find(
        (area) =>
          area.name.trim().toLowerCase() ===
          trimmedName.toLowerCase()
      );

    if (existingArea) {
      return existingArea.id;
    }

    const {
      data,
      error,
    } = await supabase
      .from("areas")
      .insert({
        region_id:
          Number(regionId),
        name: trimmedName,
        sort_order: 0,
        is_active: true,
      })
      .select("id")
      .single();

    if (error || !data) {
      throw new Error(
        `Areaの作成に失敗しました: ${
          error?.message ?? "Unknown error"
        }`
      );
    }

    return data.id;
  }

  async function handleSubmit(
    e: React.FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    if (!name.trim()) {
      setMessage(
        "Place nameを入力してください。"
      );
      return;
    }

    if (!regionId) {
      setMessage(
        "Regionを選択してください。"
      );
      return;
    }

    setSaving(true);
    setMessage("保存中...");

    try {
      const {
        data: site,
        error: siteError,
      } = await supabase
        .from("sites")
        .select("id")
        .eq("slug", "tokyo-guide")
        .single();

      if (siteError || !site) {
        throw new Error(
          `サイト情報を取得できませんでした: ${
            siteError?.message ?? "Unknown error"
          }`
        );
      }

      const resolvedPlaceTypeId =
        await resolvePlaceTypeId(site.id);

      const resolvedGroupId =
        await resolveGroupId(site.id);

      const resolvedAreaId =
        await resolveAreaId();

      const mainImageUrl =
        placeImages[0]?.image_url ?? null;

      const {
        data: place,
        error: placeError,
      } = await supabase
        .from("places")
        .insert({
          site_id: site.id,

          place_type_id:
            resolvedPlaceTypeId,

          group_id:
            resolvedGroupId,

          region_id:
            Number(regionId),

          area_id:
            resolvedAreaId,

          name:
            name.trim(),

          description:
            description.trim() ||
            null,

          editor_note:
            editorNote.trim() ||
            null,

          address:
            address.trim() ||
            null,

          postal_code:
            postalCode.trim() ||
            null,

          phone:
            phone.trim() ||
            null,

          price_range:
            isFoodPlace
              ? priceRange.trim() ||
                null
              : null,

          seats:
            isFoodPlace &&
            seats
              ? Number(seats)
              : null,

          counter_seats:
            isFoodPlace &&
            counterSeats
              ? Number(counterSeats)
              : null,

          table_seats:
            isFoodPlace &&
            tableSeats
              ? Number(tableSeats)
              : null,

          reservation:
            isFoodPlace
              ? reservation ||
                null
              : null,

          english_support:
            englishSupport ||
            null,

          card,
          tax_free:
            taxFree,

          opening_hours:
            openingHours.trim() ||
            null,

          closed_days:
            closedDays.trim() ||
            null,

          official_url:
            officialUrl.trim() ||
            null,

          instagram_url:
            instagramUrl.trim() ||
            null,

          tabelog_url:
            tabelogUrl.trim() ||
            null,

          google_maps_url:
            googleMapsUrl.trim() ||
            null,

          image_url:
            mainImageUrl,

          status,
        })
        .select("id")
        .single();

      if (placeError || !place) {
        throw new Error(
          `Placeの保存に失敗しました: ${
            placeError?.message ?? "Unknown error"
          }`
        );
      }

      const placeId = place.id;

      if (
        selectedCategoryIds.length >
        0
      ) {
        const rows =
          selectedCategoryIds.map(
            (categoryId) => ({
              place_id:
                placeId,
              category_id:
                categoryId,
            })
          );

        const {
          error,
        } = await supabase
          .from(
            "place_category_relations"
          )
          .insert(rows);

        if (error) {
          throw new Error(
            `カテゴリーの保存に失敗しました: ${error.message}`
          );
        }
      }

      if (
        selectedProductIds.length >
        0
      ) {
        const rows =
          selectedProductIds.map(
            (productId) => ({
              place_id:
                placeId,
              product_id:
                productId,
              available: true,
            })
          );

        const {
          error,
        } = await supabase
          .from(
            "place_products"
          )
          .insert(rows);

        if (error) {
          throw new Error(
            `商品の紐づけに失敗しました: ${error.message}`
          );
        }
      }

      if (selectedStationId) {
        const {
          error,
        } = await supabase
          .from(
            "place_access"
          )
          .insert({
            place_id:
              placeId,

            station_id:
              Number(
                selectedStationId
              ),

            station_exit:
              stationExit.trim() ||
              null,

            walk_minutes:
              walkMinutes
                ? Number(
                    walkMinutes
                  )
                : null,
          });

        if (error) {
          throw new Error(
            `アクセス情報の保存に失敗しました: ${error.message}`
          );
        }
      }

      if (
        placeImages.length >
        0
      ) {
        const imageRows =
          placeImages.map(
            (image, index) => ({
              place_id:
                placeId,

              image_url:
                image.image_url,

              alt_text:
                image.alt_text.trim() ||
                null,

              sort_order:
                index,
            })
          );

        const {
          error,
        } = await supabase
          .from(
            "place_images"
          )
          .insert(
            imageRows
          );

        if (error) {
          throw new Error(
            `写真の保存に失敗しました: ${error.message}`
          );
        }
      }

      setMessage(
        "Placeを保存しました。"
      );

      setName("");
      setDescription("");
      setEditorNote("");

      setPlaceTypeInput("");
      setPlaceTypeId("");

      setGroupInput("");
      setGroupId("");

      const tokyo =
        regions.find(
          (region) =>
            region.name
              .trim()
              .toLowerCase() ===
            "tokyo"
        );

      setRegionId(
        tokyo
          ? String(tokyo.id)
          : ""
      );

      setAreaInput("");
      setAreaId("");

      setAddress("");
      setPostalCode("");
      setPhone("");

      setPriceRange("");
      setSeats("");
      setCounterSeats("");
      setTableSeats("");
      setReservation("");

      setEnglishSupport("");
      setCard(false);
      setTaxFree(false);

      setOpeningHours("");
      setClosedDays("");

      setOfficialUrl("");
      setInstagramUrl("");
      setTabelogUrl("");
      setGoogleMapsUrl("");

      setStatus("draft");

      setSelectedCategoryIds([]);
      setSelectedProductIds([]);

      setSelectedStationId("");
      setStationExit("");
      setWalkMinutes("");

      setPlaceImages([]);

      if (
        resolvedPlaceTypeId &&
        !placeTypes.some(
          (type) =>
            type.id ===
            resolvedPlaceTypeId
        )
      ) {
        setPlaceTypes(
          (current) => [
            ...current,
            {
              id:
                resolvedPlaceTypeId,
              name:
                placeTypeInput.trim(),
            },
          ]
        );
      }

      if (
        resolvedGroupId &&
        !groups.some(
          (group) =>
            String(
              group.id
            ) ===
            resolvedGroupId
        )
      ) {
        setGroups(
          (current) => [
            ...current,
            {
              id:
                resolvedGroupId,
              name:
                groupInput.trim(),
            },
          ]
        );
      }

      if (
        resolvedAreaId &&
        !areas.some(
          (area) =>
            area.id ===
            resolvedAreaId
        )
      ) {
        setAreas(
          (current) => [
            ...current,
            {
              id:
                resolvedAreaId,
              region_id:
                Number(
                  regionId
                ),
              name:
                areaInput.trim(),
            },
          ]
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

  function renderCategory(
    category: CategoryNode,
    level = 0
  ): React.ReactNode {
    return (
      <div key={category.id}>
        <label
          style={{
            ...styles.categoryOption,
            marginLeft:
              `${level * 22}px`,
          }}
        >
          <input
            type="checkbox"
            checked={selectedCategoryIds.includes(
              category.id
            )}
            onChange={() =>
              toggleCategory(
                category.id
              )
            }
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

  return (
    <main style={styles.main}>
      <div style={styles.container}>
        <Link
          href="/admin/places"
          style={styles.back}
        >
          ← Places
        </Link>

        <header style={styles.header}>
          <p style={styles.eyebrow}>
            CONTENT / PLACES
          </p>

          <h1 style={styles.title}>
            Add Place
          </h1>

          <p style={styles.description}>
            場所を登録します。Restaurant・Café・Shopなど、Placeの種類に応じて必要な情報だけ入力できます。
          </p>
        </header>

        {loadingOptions ? (
          <div style={styles.loading}>
            読み込み中...
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            style={styles.form}
          >
            <section style={styles.section}>
              <h2 style={styles.sectionTitle}>
                Basic Information
              </h2>

              <label style={styles.label}>
                Place name *

                <input
                  style={styles.input}
                  value={name}
                  onChange={(e) =>
                    setName(
                      e.target.value
                    )
                  }
                  placeholder="LOFT Shibuya"
                  required
                />
              </label>

              <label style={styles.label}>
                Place Type

                <input
                  style={styles.input}
                  list="place-type-options"
                  value={placeTypeInput}
                  onChange={(e) =>
                    handlePlaceTypeChange(
                      e.target.value
                    )
                  }
                  placeholder="Shop"
                />

                <datalist id="place-type-options">
                  {placeTypes.map(
                    (type) => (
                      <option
                        key={type.id}
                        value={type.name}
                      />
                    )
                  )}
                </datalist>
              </label>

              <label style={styles.label}>
                Place Group

                <input
                  style={styles.input}
                  list="place-group-options"
                  value={groupInput}
                  onChange={(e) =>
                    handleGroupChange(
                      e.target.value
                    )
                  }
                  placeholder="No group"
                />

                <datalist id="place-group-options">
                  {groups.map(
                    (group) => (
                      <option
                        key={String(
                          group.id
                        )}
                        value={group.name}
                      />
                    )
                  )}
                </datalist>
              </label>

              <div style={styles.row}>
                <label style={styles.label}>
                  Region

                  <select
                    style={
                      styles.input
                    }
                    value={
                      regionId
                    }
                    onChange={(e) =>
                      handleRegionChange(
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
                          key={String(
                            region.id
                          )}
                          value={String(
                            region.id
                          )}
                        >
                          {
                            region.name
                          }
                        </option>
                      )
                    )}
                  </select>
                </label>

                <label style={styles.label}>
                  Area

                  <input
                    style={
                      styles.input
                    }
                    list="area-options"
                    value={
                      areaInput
                    }
                    onChange={(e) =>
                      handleAreaChange(
                        e.target.value
                      )
                    }
                    disabled={
                      !regionId
                    }
                    placeholder={
                      regionId
                        ? "Shibuya"
                        : "Select region first"
                    }
                  />

                  <datalist id="area-options">
                    {filteredAreas.map(
                      (area) => (
                        <option
                          key={area.id}
                          value={
                            area.name
                          }
                        />
                      )
                    )}
                  </datalist>
                </label>
              </div>

              <label style={styles.label}>
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

              <label style={styles.label}>
                Editor's note

                <textarea
                  style={
                    styles.textareaSmall
                  }
                  value={
                    editorNote
                  }
                  onChange={(e) =>
                    setEditorNote(
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
            </section>

            <section style={styles.section}>
              <h2 style={styles.sectionTitle}>
                Categories
              </h2>

              <p style={styles.helper}>
                階層をたどってカテゴリーを複数選択できます。
              </p>

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
            </section>

            <section style={styles.section}>
              <h2 style={styles.sectionTitle}>
                Photos
              </h2>

              <ImageGalleryUploader
                images={placeImages}
                onChange={setPlaceImages}
                folder="places"
              />
            </section>

            <section style={styles.section}>
              <h2 style={styles.sectionTitle}>
                Location
              </h2>

              <label style={styles.label}>
                Address

                <input
                  style={styles.input}
                  value={address}
                  onChange={(e) =>
                    setAddress(
                      e.target.value
                    )
                  }
                />
              </label>

              <div style={styles.row}>
                <label style={styles.label}>
                  Postal code

                  <input
                    style={styles.input}
                    value={
                      postalCode
                    }
                    onChange={(e) =>
                      setPostalCode(
                        e.target.value
                      )
                    }
                  />
                </label>

                <label style={styles.label}>
                  Phone

                  <input
                    style={styles.input}
                    value={phone}
                    onChange={(e) =>
                      setPhone(
                        e.target.value
                      )
                    }
                  />
                </label>
              </div>
            </section>

            {isFoodPlace && (
              <section style={styles.section}>
                <h2 style={styles.sectionTitle}>
                  Restaurant / Café
                </h2>

                <label style={styles.label}>
                  Price range

                  <input
                    style={styles.input}
                    value={
                      priceRange
                    }
                    onChange={(e) =>
                      setPriceRange(
                        e.target.value
                      )
                    }
                    placeholder="¥ / ¥¥ / ¥¥¥"
                  />
                </label>

                <div style={styles.row3}>
                  <label style={styles.label}>
                    Seats

                    <input
                      style={
                        styles.input
                      }
                      type="number"
                      value={seats}
                      onChange={(e) =>
                        setSeats(
                          e.target.value
                        )
                      }
                    />
                  </label>

                  <label style={styles.label}>
                    Counter seats

                    <input
                      style={
                        styles.input
                      }
                      type="number"
                      value={
                        counterSeats
                      }
                      onChange={(e) =>
                        setCounterSeats(
                          e.target.value
                        )
                      }
                    />
                  </label>

                  <label style={styles.label}>
                    Table seats

                    <input
                      style={
                        styles.input
                      }
                      type="number"
                      value={
                        tableSeats
                      }
                      onChange={(e) =>
                        setTableSeats(
                          e.target.value
                        )
                      }
                    />
                  </label>
                </div>

                <label style={styles.label}>
                  Reservation

                  <select
                    style={
                      styles.input
                    }
                    value={
                      reservation
                    }
                    onChange={(e) =>
                      setReservation(
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
              </section>
            )}

            <section style={styles.section}>
              <h2 style={styles.sectionTitle}>
                Practical Information
              </h2>

              <label style={styles.label}>
                English support

                <select
                  style={styles.input}
                  value={
                    englishSupport
                  }
                  onChange={(e) =>
                    setEnglishSupport(
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

              <div style={styles.checkRow}>
                <label style={styles.checkbox}>
                  <input
                    type="checkbox"
                    checked={card}
                    onChange={(e) =>
                      setCard(
                        e.target.checked
                      )
                    }
                  />
                  Card accepted
                </label>

                <label style={styles.checkbox}>
                  <input
                    type="checkbox"
                    checked={taxFree}
                    onChange={(e) =>
                      setTaxFree(
                        e.target.checked
                      )
                    }
                  />
                  Tax free
                </label>
              </div>

              <label style={styles.label}>
                Opening hours

                <textarea
                  style={
                    styles.textareaSmall
                  }
                  value={
                    openingHours
                  }
                  onChange={(e) =>
                    setOpeningHours(
                      e.target.value
                    )
                  }
                />
              </label>

              <label style={styles.label}>
                Closed days

                <input
                  style={styles.input}
                  value={closedDays}
                  onChange={(e) =>
                    setClosedDays(
                      e.target.value
                    )
                  }
                />
              </label>
            </section>

            <section style={styles.section}>
              <h2 style={styles.sectionTitle}>
                Products sold here
              </h2>

              {products.length === 0 ? (
                <p style={styles.helper}>
                  Productsがまだありません。
                </p>
              ) : (
                <div
                  style={
                    styles.optionGrid
                  }
                >
                  {products.map(
                    (product) => (
                      <label
                        key={String(
                          product.id
                        )}
                        style={
                          styles.checkbox
                        }
                      >
                        <input
                          type="checkbox"
                          checked={selectedProductIds.includes(
                            String(
                              product.id
                            )
                          )}
                          onChange={() =>
                            toggleProduct(
                              String(
                                product.id
                              )
                            )
                          }
                        />
                        {product.name}
                      </label>
                    )
                  )}
                </div>
              )}
            </section>

            <section style={styles.section}>
              <h2 style={styles.sectionTitle}>
                Access
              </h2>

              <label style={styles.label}>
                Nearest station

                <select
                  style={styles.input}
                  value={
                    selectedStationId
                  }
                  onChange={(e) =>
                    setSelectedStationId(
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
                        key={String(
                          station.id
                        )}
                        value={String(
                          station.id
                        )}
                      >
                        {
                          station.name
                        }
                      </option>
                    )
                  )}
                </select>
              </label>

              <div style={styles.row}>
                <label style={styles.label}>
                  Exit

                  <input
                    style={styles.input}
                    value={
                      stationExit
                    }
                    onChange={(e) =>
                      setStationExit(
                        e.target.value
                      )
                    }
                  />
                </label>

                <label style={styles.label}>
                  Walk minutes

                  <input
                    style={styles.input}
                    type="number"
                    value={
                      walkMinutes
                    }
                    onChange={(e) =>
                      setWalkMinutes(
                        e.target.value
                      )
                    }
                  />
                </label>
              </div>
            </section>

            <section style={styles.section}>
              <h2 style={styles.sectionTitle}>
                Links
              </h2>

              <label style={styles.label}>
                Official website

                <input
                  style={styles.input}
                  value={officialUrl}
                  onChange={(e) =>
                    setOfficialUrl(
                      e.target.value
                    )
                  }
                />
              </label>

              <label style={styles.label}>
                Instagram

                <input
                  style={styles.input}
                  value={
                    instagramUrl
                  }
                  onChange={(e) =>
                    setInstagramUrl(
                      e.target.value
                    )
                  }
                />
              </label>

              <label style={styles.label}>
                Tabelog

                <input
                  style={styles.input}
                  value={
                    tabelogUrl
                  }
                  onChange={(e) =>
                    setTabelogUrl(
                      e.target.value
                    )
                  }
                />
              </label>

              <label style={styles.label}>
                Google Maps

                <input
                  style={styles.input}
                  value={
                    googleMapsUrl
                  }
                  onChange={(e) =>
                    setGoogleMapsUrl(
                      e.target.value
                    )
                  }
                />
              </label>
            </section>

            <section style={styles.section}>
              <h2 style={styles.sectionTitle}>
                Publishing
              </h2>

              <p style={styles.publishingHelp}>
                東京ガイドでは、掲載する店舗を編集部が選定します。Editor's noteに、この店舗を選んだ理由やおすすめポイントを記載してください。
              </p>

              <label style={styles.label}>
                Status

                <select
                  style={styles.input}
                  value={status}
                  onChange={(e) =>
                    setStatus(
                      e.target.value
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
                  saving ? 0.6 : 1,
              }}
            >
              {saving
                ? "Saving..."
                : "Save Place"}
            </button>

            {message && (
              <div style={styles.message}>
                {message}
              </div>
            )}
          </form>
        )}
      </div>
    </main>
  );
}

const styles = {
  main: {
    minHeight: "100vh",
    background: "#faf8f6",
    color: "#222",
    padding: "40px 24px 90px",
  },

  container: {
    maxWidth: "900px",
    margin: "0 auto",
  },

  back: {
    color: "#777",
    textDecoration: "none",
    fontSize: "13px",
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

  loading: {
    background: "#fff",
    border: "1px solid #e7e0dc",
    borderRadius: "15px",
    padding: "30px",
    textAlign: "center" as const,
    color: "#888",
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

  sectionTitle: {
    fontFamily: "Georgia, serif",
    fontSize: "24px",
    fontWeight: 400,
    marginTop: 0,
    marginBottom: "18px",
  },

  label: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "7px",
    fontSize: "13px",
    fontWeight: 600,
    marginBottom: "14px",
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

  textareaSmall: {
    width: "100%",
    minHeight: "80px",
    boxSizing: "border-box" as const,
    padding: "12px 13px",
    border: "1px solid #ded7d3",
    borderRadius: "9px",
    background: "#fff",
    fontSize: "14px",
    resize: "vertical" as const,
  },

  row: {
    display: "grid",
    gridTemplateColumns:
      "repeat(2, minmax(0, 1fr))",
    gap: "12px",
  },

  row3: {
    display: "grid",
    gridTemplateColumns:
      "repeat(3, minmax(0, 1fr))",
    gap: "12px",
  },

  checkRow: {
    display: "flex",
    gap: "25px",
    flexWrap: "wrap" as const,
    marginBottom: "15px",
  },

  checkbox: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    fontSize: "13px",
    fontWeight: 400,
  },

  fieldHelp: {
    color: "#999",
    fontSize: "11px",
    fontWeight: 400,
    lineHeight: 1.5,
  },

  helper: {
    color: "#888",
    fontSize: "12px",
    lineHeight: 1.6,
  },

  publishingHelp: {
    color: "#777",
    fontSize: "12px",
    lineHeight: 1.7,
    margin: "0 0 18px",
  },

  categoryTree: {
    borderTop: "1px solid #eee8e4",
    paddingTop: "10px",
    maxHeight: "300px",
    overflowY: "auto" as const,
  },

  categoryOption: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "8px 0",
    fontSize: "13px",
    fontWeight: 400,
  },

  optionGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(2, minmax(0, 1fr))",
    gap: "10px",
  },

  saveButton: {
    border: 0,
    borderRadius: "11px",
    background: "#222",
    color: "#fff",
    padding: "16px",
    fontSize: "14px",
    cursor: "pointer",
  },

  message: {
    textAlign: "center" as const,
    color: "#c8647b",
    fontSize: "13px",
  },
};