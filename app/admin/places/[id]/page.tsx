"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
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

type Product = {
  id: string;
  name: string;
};

type Station = {
  id: number;
  name: string;
};

type Place = {
  id: string;
  group_id: string | null;
  region_id: number | null;
  area_id: number | null;

  name: string;
  description: string | null;

  address: string | null;
  postal_code: string | null;
  phone: string | null;

  price_range: string | null;

  seats: number | null;
  counter_seats: number | null;
  table_seats: number | null;

  reservation: string | null;
  english_support: string | null;

  card: boolean | null;
  tax_free: boolean | null;

  opening_hours: string | null;
  closed_days: string | null;

  official_url: string | null;
  instagram_url: string | null;
  tabelog_url: string | null;
  google_maps_url: string | null;

  status:
    | "draft"
    | "published"
    | "hidden"
    | "archived";

  editor_note: string | null;
};

export default function EditPlacePage() {
  const params = useParams();

  const placeId = String(params.id);

  const [place, setPlace] = useState<Place | null>(null);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const [groupId, setGroupId] = useState("");
  const [regionId, setRegionId] = useState("");
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

  const [editorNote, setEditorNote] = useState("");

  const [status, setStatus] = useState<
    "draft" | "published" | "hidden" | "archived"
  >("draft");

  const [groups, setGroups] = useState<Option[]>([]);
  const [regions, setRegions] = useState<Option[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [stations, setStations] = useState<Station[]>([]);

  const [selectedCategoryIds, setSelectedCategoryIds] =
    useState<number[]>([]);

  const [selectedProductIds, setSelectedProductIds] =
    useState<string[]>([]);

  const [stationId, setStationId] = useState("");
  const [stationExit, setStationExit] = useState("");
  const [walkMinutes, setWalkMinutes] = useState("");

  const [placeImages, setPlaceImages] = useState<GalleryImage[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function load() {
      setLoading(true);
      setMessage("");

      const [
        placeResult,
        groupsResult,
        regionsResult,
        areasResult,
        categoriesResult,
        productsResult,
        stationsResult,
        categoryRelationsResult,
        productRelationsResult,
        accessResult,
        imagesResult,
      ] = await Promise.all([
        supabase
          .from("places")
          .select("*")
          .eq("id", placeId)
          .single(),

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
          .from("stations")
          .select("id, name")
          .eq("is_active", true)
          .order("name"),

        supabase
          .from("place_category_relations")
          .select("category_id")
          .eq("place_id", placeId),

        supabase
          .from("place_products")
          .select("product_id")
          .eq("place_id", placeId)
          .eq("available", true),

        supabase
          .from("place_access")
          .select("station_id, station_exit, walk_minutes")
          .eq("place_id", placeId)
          .limit(1),

        supabase
          .from("place_images")
          .select("id, image_url, alt_text, sort_order")
          .eq("place_id", placeId)
          .order("sort_order"),
      ]);

      if (placeResult.error || !placeResult.data) {
        setMessage(
          `Placeを読み込めませんでした: ${
            placeResult.error?.message ?? "Unknown error"
          }`
        );
        setLoading(false);
        return;
      }

      const loadedPlace = placeResult.data as Place;

      setPlace(loadedPlace);

      setName(loadedPlace.name ?? "");
      setDescription(loadedPlace.description ?? "");

      setGroupId(loadedPlace.group_id ?? "");

      setRegionId(
        loadedPlace.region_id !== null
          ? String(loadedPlace.region_id)
          : ""
      );

      setAreaId(
        loadedPlace.area_id !== null
          ? String(loadedPlace.area_id)
          : ""
      );

      setAddress(loadedPlace.address ?? "");
      setPostalCode(loadedPlace.postal_code ?? "");
      setPhone(loadedPlace.phone ?? "");

      setPriceRange(loadedPlace.price_range ?? "");

      setSeats(
        loadedPlace.seats !== null
          ? String(loadedPlace.seats)
          : ""
      );

      setCounterSeats(
        loadedPlace.counter_seats !== null
          ? String(loadedPlace.counter_seats)
          : ""
      );

      setTableSeats(
        loadedPlace.table_seats !== null
          ? String(loadedPlace.table_seats)
          : ""
      );

      setReservation(loadedPlace.reservation ?? "");
      setEnglishSupport(loadedPlace.english_support ?? "");

      setCard(Boolean(loadedPlace.card));
      setTaxFree(Boolean(loadedPlace.tax_free));

      setOpeningHours(loadedPlace.opening_hours ?? "");
      setClosedDays(loadedPlace.closed_days ?? "");

      setOfficialUrl(loadedPlace.official_url ?? "");
      setInstagramUrl(loadedPlace.instagram_url ?? "");
      setTabelogUrl(loadedPlace.tabelog_url ?? "");
      setGoogleMapsUrl(loadedPlace.google_maps_url ?? "");

      setEditorNote(loadedPlace.editor_note ?? "");
      setStatus(loadedPlace.status);

      setGroups((groupsResult.data ?? []) as Option[]);
      setRegions((regionsResult.data ?? []) as Option[]);
      setAreas((areasResult.data ?? []) as Area[]);
      setCategories((categoriesResult.data ?? []) as Category[]);
      setProducts((productsResult.data ?? []) as Product[]);
      setStations((stationsResult.data ?? []) as Station[]);

      setSelectedCategoryIds(
        (categoryRelationsResult.data ?? []).map(
          (item) => item.category_id
        )
      );

      setSelectedProductIds(
        (productRelationsResult.data ?? []).map(
          (item) => item.product_id
        )
      );

      const access = accessResult.data?.[0];

      if (access) {
        setStationId(String(access.station_id));
        setStationExit(access.station_exit ?? "");

        setWalkMinutes(
          access.walk_minutes !== null
            ? String(access.walk_minutes)
            : ""
        );
      }

      setPlaceImages(
        (imagesResult.data ?? []).map((image) => ({
          id: image.id,
          image_url: image.image_url,
          alt_text: image.alt_text ?? "",
          sort_order: image.sort_order,
        }))
      );

      const relationErrors = [
        groupsResult.error,
        regionsResult.error,
        areasResult.error,
        categoriesResult.error,
        productsResult.error,
        stationsResult.error,
        categoryRelationsResult.error,
        productRelationsResult.error,
        accessResult.error,
        imagesResult.error,
      ].filter(Boolean);

      if (relationErrors.length > 0) {
        setMessage(
          `一部データの読み込みに失敗しました: ${
            relationErrors[0]!.message
          }`
        );
      }

      setLoading(false);
    }

    load();
  }, [placeId]);

  const filteredAreas = useMemo(() => {
    if (!regionId) {
      return [];
    }

    return areas.filter(
      (area) => area.region_id === Number(regionId)
    );
  }, [areas, regionId]);

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

  function handleRegionChange(value: string) {
    setRegionId(value);
    setAreaId("");
  }

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

  async function handleSave(
    e: React.FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    if (!name.trim()) {
      setMessage("Place name is required.");
      return;
    }

    setSaving(true);
    setMessage("保存中...");

    try {
      const { error: placeError } = await supabase
        .from("places")
        .update({
          group_id: groupId || null,

          region_id: regionId
            ? Number(regionId)
            : null,

          area_id: areaId
            ? Number(areaId)
            : null,

          name: name.trim(),

          description:
            description.trim() || null,

          address:
            address.trim() || null,

          postal_code:
            postalCode.trim() || null,

          phone:
            phone.trim() || null,

          price_range:
            priceRange.trim() || null,

          seats:
            seats ? Number(seats) : null,

          counter_seats:
            counterSeats
              ? Number(counterSeats)
              : null,

          table_seats:
            tableSeats
              ? Number(tableSeats)
              : null,

          reservation:
            reservation || null,

          english_support:
            englishSupport || null,

          card,
          tax_free: taxFree,

          opening_hours:
            openingHours.trim() || null,

          closed_days:
            closedDays.trim() || null,

          official_url:
            officialUrl.trim() || null,

          instagram_url:
            instagramUrl.trim() || null,

          tabelog_url:
            tabelogUrl.trim() || null,

          google_maps_url:
            googleMapsUrl.trim() || null,

          editor_note:
            editorNote.trim() || null,

          status,

          updated_at:
            new Date().toISOString(),
        })
        .eq("id", placeId);

      if (placeError) {
        throw new Error(
          `Placeの更新に失敗しました: ${placeError.message}`
        );
      }

      // -------------------------
      // Categories
      // -------------------------

      const { error: categoryDeleteError } =
        await supabase
          .from("place_category_relations")
          .delete()
          .eq("place_id", placeId);

      if (categoryDeleteError) {
        throw new Error(
          `カテゴリーの更新に失敗しました: ${categoryDeleteError.message}`
        );
      }

      if (selectedCategoryIds.length > 0) {
        const rows = selectedCategoryIds.map(
          (categoryId) => ({
            place_id: placeId,
            category_id: categoryId,
          })
        );

        const { error } = await supabase
          .from("place_category_relations")
          .insert(rows);

        if (error) {
          throw new Error(
            `カテゴリーの保存に失敗しました: ${error.message}`
          );
        }
      }

      // -------------------------
      // Products
      // -------------------------

      const { error: productDeleteError } =
        await supabase
          .from("place_products")
          .delete()
          .eq("place_id", placeId);

      if (productDeleteError) {
        throw new Error(
          `商品の更新に失敗しました: ${productDeleteError.message}`
        );
      }

      if (selectedProductIds.length > 0) {
        const rows = selectedProductIds.map(
          (productId) => ({
            place_id: placeId,
            product_id: productId,
            available: true,
          })
        );

        const { error } = await supabase
          .from("place_products")
          .insert(rows);

        if (error) {
          throw new Error(
            `商品の保存に失敗しました: ${error.message}`
          );
        }
      }

      // -------------------------
      // Access
      // -------------------------

      const { error: accessDeleteError } =
        await supabase
          .from("place_access")
          .delete()
          .eq("place_id", placeId);

      if (accessDeleteError) {
        throw new Error(
          `アクセス情報の更新に失敗しました: ${accessDeleteError.message}`
        );
      }

      if (stationId) {
        const { error } = await supabase
          .from("place_access")
          .insert({
            place_id: placeId,
            station_id: Number(stationId),
            station_exit:
              stationExit.trim() || null,
            walk_minutes:
              walkMinutes
                ? Number(walkMinutes)
                : null,
          });

        if (error) {
          throw new Error(
            `アクセス情報の保存に失敗しました: ${error.message}`
          );
        }
      }

      // -------------------------
      // Images
      // -------------------------

      const { error: imageDeleteError } =
        await supabase
          .from("place_images")
          .delete()
          .eq("place_id", placeId);

      if (imageDeleteError) {
        throw new Error(
          `写真の更新に失敗しました: ${imageDeleteError.message}`
        );
      }

      if (placeImages.length > 0) {
        const imageRows = placeImages.map(
          (image, index) => ({
            place_id: placeId,
            image_url: image.image_url,
            alt_text:
              image.alt_text.trim() || null,
            sort_order: index,
          })
        );

        const { error } = await supabase
          .from("place_images")
          .insert(imageRows);

        if (error) {
          throw new Error(
            `写真の保存に失敗しました: ${error.message}`
          );
        }
      }

      setMessage("保存しました。");
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
            marginLeft: `${level * 22}px`,
          }}
        >
          <input
            type="checkbox"
            checked={selectedCategoryIds.includes(
              category.id
            )}
            onChange={() =>
              toggleCategory(category.id)
            }
          />

          {category.name}
        </label>

        {category.children.map((child) =>
          renderCategory(child, level + 1)
        )}
      </div>
    );
  }

  if (loading) {
    return (
      <main style={styles.loadingPage}>
        読み込み中...
      </main>
    );
  }

  if (!place) {
    return (
      <main style={styles.main}>
        <div style={styles.container}>
          <Link
            href="/admin/places"
            style={styles.back}
          >
            ← Places
          </Link>

          <h1 style={styles.title}>
            Place not found
          </h1>
        </div>
      </main>
    );
  }

  return (
    <main style={styles.main}>
      <div style={styles.container}>
        <div style={styles.topbar}>
          <Link
            href="/admin/places"
            style={styles.back}
          >
            ← Places
          </Link>

          <Link
            href={`/places/${place.id}`}
            target="_blank"
            rel="noopener noreferrer"
            style={styles.preview}
          >
            Preview ↗
          </Link>
        </div>

        <header style={styles.header}>
          <p style={styles.eyebrow}>
            CONTENT / PLACES
          </p>

          <h1 style={styles.title}>
            Edit Place
          </h1>

          <p style={styles.description}>
            {place.name}
          </p>
        </header>

        <form
          onSubmit={handleSave}
          style={styles.form}
        >
          {/* =========================
              BASIC INFORMATION
          ========================== */}

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
                  setName(e.target.value)
                }
                required
              />
            </label>

            <label style={styles.label}>
              Place Group
              <select
                style={styles.input}
                value={groupId}
                onChange={(e) =>
                  setGroupId(e.target.value)
                }
              >
                <option value="">
                  No group
                </option>

                {groups.map((group) => (
                  <option
                    key={String(group.id)}
                    value={String(group.id)}
                  >
                    {group.name}
                  </option>
                ))}
              </select>
            </label>

            <div style={styles.row}>
              <label style={styles.label}>
                Region
                <select
                  style={styles.input}
                  value={regionId}
                  onChange={(e) =>
                    handleRegionChange(e.target.value)
                  }
                >
                  <option value="">
                    Select region
                  </option>

                  {regions.map((region) => (
                    <option
                      key={String(region.id)}
                      value={String(region.id)}
                    >
                      {region.name}
                    </option>
                  ))}
                </select>
              </label>

              <label style={styles.label}>
                Area
                <select
                  style={styles.input}
                  value={areaId}
                  onChange={(e) =>
                    setAreaId(e.target.value)
                  }
                  disabled={!regionId}
                >
                  <option value="">
                    {regionId
                      ? "Select area"
                      : "Select region first"}
                  </option>

                  {filteredAreas.map((area) => (
                    <option
                      key={area.id}
                      value={area.id}
                    >
                      {area.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <label style={styles.label}>
              Description
              <textarea
                style={styles.textarea}
                value={description}
                onChange={(e) =>
                  setDescription(e.target.value)
                }
              />
            </label>
          </section>

          {/* =========================
              CATEGORIES
          ========================== */}

          <section style={styles.section}>
            <h2 style={styles.sectionTitle}>
              Categories
            </h2>

            <p style={styles.helper}>
              店舗に当てはまるカテゴリーを複数選択できます。
            </p>

            <div style={styles.categoryTree}>
              {categoryTree.map((category) =>
                renderCategory(category)
              )}
            </div>
          </section>

          {/* =========================
              PHOTOS
          ========================== */}

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

          {/* =========================
              LOCATION
          ========================== */}

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
                  setAddress(e.target.value)
                }
              />
            </label>

            <label style={styles.label}>
              Postal code
              <input
                style={styles.input}
                value={postalCode}
                onChange={(e) =>
                  setPostalCode(e.target.value)
                }
              />
            </label>

            <label style={styles.label}>
              Phone
              <input
                style={styles.input}
                value={phone}
                onChange={(e) =>
                  setPhone(e.target.value)
                }
              />
            </label>
          </section>

          {/* =========================
              PRACTICAL
          ========================== */}

          <section style={styles.section}>
            <h2 style={styles.sectionTitle}>
              Practical Information
            </h2>

            <label style={styles.label}>
              Price range
              <input
                style={styles.input}
                value={priceRange}
                onChange={(e) =>
                  setPriceRange(e.target.value)
                }
                placeholder="¥ / ¥¥ / ¥¥¥"
              />
            </label>

            <div style={styles.row3}>
              <label style={styles.label}>
                Seats
                <input
                  style={styles.input}
                  type="number"
                  value={seats}
                  onChange={(e) =>
                    setSeats(e.target.value)
                  }
                />
              </label>

              <label style={styles.label}>
                Counter seats
                <input
                  style={styles.input}
                  type="number"
                  value={counterSeats}
                  onChange={(e) =>
                    setCounterSeats(e.target.value)
                  }
                />
              </label>

              <label style={styles.label}>
                Table seats
                <input
                  style={styles.input}
                  type="number"
                  value={tableSeats}
                  onChange={(e) =>
                    setTableSeats(e.target.value)
                  }
                />
              </label>
            </div>

            <label style={styles.label}>
              Reservation
              <select
                style={styles.input}
                value={reservation}
                onChange={(e) =>
                  setReservation(e.target.value)
                }
              >
                <option value="">Select</option>
                <option value="No">No</option>
                <option value="Yes">Yes</option>
                <option value="Required">
                  Required
                </option>
                <option value="Recommended">
                  Recommended
                </option>
              </select>
            </label>

            <label style={styles.label}>
              English support
              <select
                style={styles.input}
                value={englishSupport}
                onChange={(e) =>
                  setEnglishSupport(e.target.value)
                }
              >
                <option value="">Select</option>
                <option value="Full">Full</option>
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
                    setCard(e.target.checked)
                  }
                />
                Card accepted
              </label>

              <label style={styles.checkbox}>
                <input
                  type="checkbox"
                  checked={taxFree}
                  onChange={(e) =>
                    setTaxFree(e.target.checked)
                  }
                />
                Tax free
              </label>
            </div>

            <label style={styles.label}>
              Opening hours
              <textarea
                style={styles.textareaSmall}
                value={openingHours}
                onChange={(e) =>
                  setOpeningHours(e.target.value)
                }
              />
            </label>

            <label style={styles.label}>
              Closed days
              <input
                style={styles.input}
                value={closedDays}
                onChange={(e) =>
                  setClosedDays(e.target.value)
                }
              />
            </label>
          </section>

          {/* =========================
              PRODUCTS
          ========================== */}

          <section style={styles.section}>
            <h2 style={styles.sectionTitle}>
              Products sold here
            </h2>

            {products.length === 0 ? (
              <p style={styles.helper}>
                Productsがまだありません。
              </p>
            ) : (
              <div style={styles.optionGrid}>
                {products.map((product) => (
                  <label
                    key={product.id}
                    style={styles.checkbox}
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

                    {product.name}
                  </label>
                ))}
              </div>
            )}
          </section>

          {/* =========================
              ACCESS
          ========================== */}

          <section style={styles.section}>
            <h2 style={styles.sectionTitle}>
              Access
            </h2>

            <label style={styles.label}>
              Nearest station
              <select
                style={styles.input}
                value={stationId}
                onChange={(e) =>
                  setStationId(e.target.value)
                }
              >
                <option value="">
                  Select station
                </option>

                {stations.map((station) => (
                  <option
                    key={station.id}
                    value={station.id}
                  >
                    {station.name}
                  </option>
                ))}
              </select>
            </label>

            <div style={styles.row}>
              <label style={styles.label}>
                Exit
                <input
                  style={styles.input}
                  value={stationExit}
                  onChange={(e) =>
                    setStationExit(e.target.value)
                  }
                />
              </label>

              <label style={styles.label}>
                Walk minutes
                <input
                  style={styles.input}
                  type="number"
                  value={walkMinutes}
                  onChange={(e) =>
                    setWalkMinutes(e.target.value)
                  }
                />
              </label>
            </div>
          </section>

          {/* =========================
              LINKS
          ========================== */}

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
                  setOfficialUrl(e.target.value)
                }
              />
            </label>

            <label style={styles.label}>
              Instagram
              <input
                style={styles.input}
                value={instagramUrl}
                onChange={(e) =>
                  setInstagramUrl(e.target.value)
                }
              />
            </label>

            <label style={styles.label}>
              Tabelog
              <input
                style={styles.input}
                value={tabelogUrl}
                onChange={(e) =>
                  setTabelogUrl(e.target.value)
                }
              />
            </label>

            <label style={styles.label}>
              Google Maps
              <input
                style={styles.input}
                value={googleMapsUrl}
                onChange={(e) =>
                  setGoogleMapsUrl(e.target.value)
                }
              />
            </label>
          </section>

          {/* =========================
              PUBLISHING
          ========================== */}

          <section style={styles.section}>
            <h2 style={styles.sectionTitle}>
              Publishing
            </h2>

            <label style={styles.label}>
              Editor's note
              <textarea
                style={styles.textareaSmall}
                value={editorNote}
                onChange={(e) =>
                  setEditorNote(e.target.value)
                }
                placeholder="Why we selected this place — convenient location, a famous branch, or simply worth visiting."
              />
              <span style={styles.helper}>
                この店舗を選んだ理由を短く記載します。星評価は使用しません。
              </span>
            </label>

            <label style={styles.label}>
              Status
              <select
                style={styles.input}
                value={status}
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

          <div style={styles.bottomBar}>
            <button
              type="submit"
              disabled={saving}
              style={{
                ...styles.saveButton,
                opacity: saving ? 0.6 : 1,
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
    padding: "35px 0 25px",
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
    marginTop: "10px",
    lineHeight: 1.7,
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
    margin: "0 0 18px",
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

  helper: {
    color: "#888",
    fontSize: "12px",
    lineHeight: 1.6,
  },

  categoryTree: {
    border: "1px solid #eee8e4",
    borderRadius: "9px",
    padding: "10px 13px",
    maxHeight: "300px",
    overflowY: "auto" as const,
  },

  categoryOption: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "7px 0",
    fontSize: "13px",
    fontWeight: 400,
  },

  optionGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(2, minmax(0, 1fr))",
    gap: "10px",
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
    cursor: "pointer",
    fontSize: "14px",
  },

  message: {
    color: "#c8647b",
    fontSize: "13px",
  },
};