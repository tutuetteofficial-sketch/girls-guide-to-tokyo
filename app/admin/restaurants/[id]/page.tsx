"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Food = {
  id: string;
  name: string;
  image_url: string | null;
};

type Restaurant = {
  id: string;
  site_id: string;
  name: string;
  restaurant_type: string | null;
  description: string | null;
  editor_note: string | null;
  image_url: string | null;
  region_id: number | null;
  area_id: number | null;
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
  opening_hours: string | null;
  closed_days: string | null;
  official_url: string | null;
  instagram_url: string | null;
  tabelog_url: string | null;
  status: string | null;
  google_place_id: string | null;
};

type Signature = {
  id: string;
  restaurant_id: string;
  food_id: string;
  signature_image_url: string | null;
  price: string | null;
  is_signature: boolean;
  sort_order: number;
  editor_note: string | null;
};

type SignatureForm = {
  id?: string;
  food_id: string;
  signature_image_url: string;
  price: string;
  is_signature: boolean;
  sort_order: number;
  editor_note: string;
};

export default function RestaurantEditPage() {
  const params = useParams();
  const router = useRouter();

  const id = params.id as string;

  const [restaurant, setRestaurant] =
    useState<Restaurant | null>(null);

  const [foods, setFoods] =
    useState<Food[]>([]);

  const [signatures, setSignatures] =
    useState<SignatureForm[]>([]);

  const [name, setName] = useState("");
  const [restaurantType, setRestaurantType] =
    useState("restaurant");
  const [description, setDescription] =
    useState("");
  const [editorNote, setEditorNote] =
    useState("");
  const [imageUrl, setImageUrl] =
    useState("");

  const [regionId, setRegionId] =
    useState("");
  const [areaId, setAreaId] =
    useState("");

  const [address, setAddress] =
    useState("");
  const [postalCode, setPostalCode] =
    useState("");
  const [phone, setPhone] =
    useState("");
  const [priceRange, setPriceRange] =
    useState("");

  const [seats, setSeats] =
    useState("");
  const [counterSeats, setCounterSeats] =
    useState("");
  const [tableSeats, setTableSeats] =
    useState("");

  const [reservation, setReservation] =
    useState("");
  const [englishSupport, setEnglishSupport] =
    useState("");
  const [card, setCard] =
    useState(false);

  const [openingHours, setOpeningHours] =
    useState("");
  const [closedDays, setClosedDays] =
    useState("");

  const [officialUrl, setOfficialUrl] =
    useState("");
  const [instagramUrl, setInstagramUrl] =
    useState("");
  const [tabelogUrl, setTabelogUrl] =
    useState("");

  const [googlePlaceId, setGooglePlaceId] =
    useState("");

  const [status, setStatus] =
    useState("published");

  const [loading, setLoading] =
    useState(true);
  const [saving, setSaving] =
    useState(false);
  const [deleting, setDeleting] =
    useState(false);

  const [errorMessage, setErrorMessage] =
    useState("");
  const [successMessage, setSuccessMessage] =
    useState("");

  useEffect(() => {
    loadData();
  }, [id]);

  async function loadData() {
    setLoading(true);
    setErrorMessage("");

    try {
      const restaurantResult =
        await supabase
          .from("restaurants")
          .select(`
            id,
            site_id,
            name,
            restaurant_type,
            description,
            editor_note,
            image_url,
            region_id,
            area_id,
            address,
            postal_code,
            phone,
            price_range,
            seats,
            counter_seats,
            table_seats,
            reservation,
            english_support,
            card,
            opening_hours,
            closed_days,
            official_url,
            instagram_url,
            tabelog_url,
            status,
            google_place_id
          `)
          .eq("id", id)
          .single();

      if (
        restaurantResult.error ||
        !restaurantResult.data
      ) {
        throw (
          restaurantResult.error ||
          new Error(
            "Restaurant / Café not found."
          )
        );
      }

      const restaurantData =
        restaurantResult.data as Restaurant;

      setRestaurant(restaurantData);

      setName(restaurantData.name ?? "");

      setRestaurantType(
        restaurantData.restaurant_type ??
          "restaurant"
      );

      setDescription(
        restaurantData.description ?? ""
      );

      setEditorNote(
        restaurantData.editor_note ?? ""
      );

      setImageUrl(
        restaurantData.image_url ?? ""
      );

      setRegionId(
        restaurantData.region_id
          ? String(restaurantData.region_id)
          : ""
      );

      setAreaId(
        restaurantData.area_id
          ? String(restaurantData.area_id)
          : ""
      );

      setAddress(
        restaurantData.address ?? ""
      );

      setPostalCode(
        restaurantData.postal_code ?? ""
      );

      setPhone(
        restaurantData.phone ?? ""
      );

      setPriceRange(
        restaurantData.price_range ?? ""
      );

      setSeats(
        restaurantData.seats != null
          ? String(restaurantData.seats)
          : ""
      );

      setCounterSeats(
        restaurantData.counter_seats != null
          ? String(restaurantData.counter_seats)
          : ""
      );

      setTableSeats(
        restaurantData.table_seats != null
          ? String(restaurantData.table_seats)
          : ""
      );

      setReservation(
        restaurantData.reservation ?? ""
      );

      setEnglishSupport(
        restaurantData.english_support ?? ""
      );

      setCard(
        restaurantData.card ?? false
      );

      setOpeningHours(
        restaurantData.opening_hours ?? ""
      );

      setClosedDays(
        restaurantData.closed_days ?? ""
      );

      setOfficialUrl(
        restaurantData.official_url ?? ""
      );

      setInstagramUrl(
        restaurantData.instagram_url ?? ""
      );

      setTabelogUrl(
        restaurantData.tabelog_url ?? ""
      );

      setGooglePlaceId(
        restaurantData.google_place_id ?? ""
      );

      setStatus(
        restaurantData.status ?? "published"
      );

      const [foodsResult, signaturesResult] =
        await Promise.all([
          supabase
            .from("foods")
            .select(`
              id,
              name,
              image_url
            `)
            .eq(
              "site_id",
              restaurantData.site_id
            )
            .order("name"),

          supabase
            .from("restaurant_foods")
            .select(`
              id,
              restaurant_id,
              food_id,
              signature_image_url,
              price,
              is_signature,
              sort_order,
              editor_note
            `)
            .eq(
              "restaurant_id",
              id
            )
            .order("sort_order"),
        ]);

      if (foodsResult.error) {
        throw foodsResult.error;
      }

      if (signaturesResult.error) {
        throw signaturesResult.error;
      }

      setFoods(
        (foodsResult.data ?? []) as Food[]
      );

      const signatureData =
        (signaturesResult.data ??
          []) as Signature[];

      setSignatures(
        signatureData.map((item) => ({
          id: item.id,
          food_id: item.food_id,
          signature_image_url:
            item.signature_image_url ?? "",
          price: item.price ?? "",
          is_signature:
            item.is_signature ?? false,
          sort_order:
            item.sort_order ?? 0,
          editor_note:
            item.editor_note ?? "",
        }))
      );
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Failed to load restaurant."
      );
    } finally {
      setLoading(false);
    }
  }

  function addSignature() {
    const usedFoodIds = new Set(
      signatures.map(
        (signature) => signature.food_id
      )
    );

    const availableFood =
      foods.find(
        (food) =>
          !usedFoodIds.has(food.id)
      );

    if (!availableFood) {
      setErrorMessage(
        foods.length === 0
          ? "No foods are available yet. Please create a Food first."
          : "All available foods have already been added."
      );

      return;
    }

    setErrorMessage("");

    setSignatures((current) => [
      ...current,
      {
        food_id: availableFood.id,
        signature_image_url: "",
        price: "",
        is_signature: true,
        sort_order: current.length,
        editor_note: "",
      },
    ]);
  }

  function updateSignature(
    index: number,
    field: keyof SignatureForm,
    value:
      | string
      | boolean
      | number
      | undefined
  ) {
    setSignatures((current) =>
      current.map((signature, i) =>
        i === index
          ? {
              ...signature,
              [field]: value,
            }
          : signature
      )
    );
  }

  function removeSignature(
    index: number
  ) {
    setSignatures((current) =>
      current.filter(
        (_, i) => i !== index
      )
    );
  }

  function getFoodName(
    foodId: string
  ) {
    return (
      foods.find(
        (food) => food.id === foodId
      )?.name ?? "Unknown Food"
    );
  }

  async function saveRestaurant() {
    setErrorMessage("");
    setSuccessMessage("");

    if (!name.trim()) {
      setErrorMessage(
        "Please enter a restaurant / café name."
      );
      return;
    }

    if (!restaurant) {
      setErrorMessage(
        "Restaurant data is not loaded."
      );
      return;
    }

    const selectedFoodIds =
      signatures.map(
        (signature) => signature.food_id
      );

    if (
      new Set(selectedFoodIds).size !==
      selectedFoodIds.length
    ) {
      setErrorMessage(
        "The same Food cannot be added more than once."
      );
      return;
    }

    setSaving(true);

    try {
      const { error: restaurantError } =
        await supabase
          .from("restaurants")
          .update({
            name: name.trim(),

            restaurant_type:
              restaurantType || null,

            description:
              description.trim() || null,

            editor_note:
              editorNote.trim() || null,

            image_url:
              imageUrl.trim() || null,

            region_id:
              regionId
                ? Number(regionId)
                : null,

            area_id:
              areaId
                ? Number(areaId)
                : null,

            address:
              address.trim() || null,

            postal_code:
              postalCode.trim() || null,

            phone:
              phone.trim() || null,

            price_range:
              priceRange.trim() || null,

            seats:
              seats
                ? Number(seats)
                : null,

            counter_seats:
              counterSeats
                ? Number(counterSeats)
                : null,

            table_seats:
              tableSeats
                ? Number(tableSeats)
                : null,

            reservation:
              reservation.trim() || null,

            english_support:
              englishSupport.trim() || null,

            card,

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

            google_place_id:
              googlePlaceId.trim() || null,

            status,

            updated_at:
              new Date().toISOString(),
          })
          .eq("id", id);

      if (restaurantError) {
        throw restaurantError;
      }

      const {
        data: existingRows,
        error: existingError,
      } = await supabase
        .from("restaurant_foods")
        .select("id")
        .eq("restaurant_id", id);

      if (existingError) {
        throw existingError;
      }

      const existingIds = new Set(
        (existingRows ?? []).map(
          (row) => row.id
        )
      );

      const currentIds = new Set(
        signatures
          .map(
            (signature) =>
              signature.id
          )
          .filter(Boolean)
      );

      const idsToDelete = [
        ...existingIds,
      ].filter(
        (existingId) =>
          !currentIds.has(existingId)
      );

      if (idsToDelete.length > 0) {
        const { error: deleteError } =
          await supabase
            .from("restaurant_foods")
            .delete()
            .in("id", idsToDelete);

        if (deleteError) {
          throw deleteError;
        }
      }

      for (
        let index = 0;
        index < signatures.length;
        index++
      ) {
        const signature =
          signatures[index];

        const payload = {
          restaurant_id: id,

          food_id:
            signature.food_id,

          signature_image_url:
            signature.signature_image_url.trim() ||
            null,

          price:
            signature.price.trim() ||
            null,

          is_signature:
            signature.is_signature,

          sort_order:
            index,

          editor_note:
            signature.editor_note.trim() ||
            null,

          updated_at:
            new Date().toISOString(),
        };

        if (signature.id) {
          const { error } =
            await supabase
              .from("restaurant_foods")
              .update(payload)
              .eq(
                "id",
                signature.id
              )
              .eq(
                "restaurant_id",
                id
              );

          if (error) {
            throw error;
          }
        } else {
          const { data, error } =
            await supabase
              .from("restaurant_foods")
              .insert(payload)
              .select("id")
              .single();

          if (error) {
            throw error;
          }

          signatures[index].id =
            data.id;
        }
      }

      setSuccessMessage(
        "Restaurant / Café and signatures updated successfully ✦"
      );

      await loadData();
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Failed to update restaurant."
      );
    } finally {
      setSaving(false);
    }
  }

  async function deleteRestaurant() {
    if (
      !window.confirm(
        "Delete this restaurant / café permanently?"
      )
    ) {
      return;
    }

    setDeleting(true);
    setErrorMessage("");

    try {
      /*
       * Delete related restaurant_foods first.
       * This keeps the relationship table clean even
       * if no ON DELETE CASCADE exists on the FK.
       */
      const {
        error: signatureError,
      } = await supabase
        .from("restaurant_foods")
        .delete()
        .eq("restaurant_id", id);

      if (signatureError) {
        throw signatureError;
      }

      const {
        error: restaurantError,
      } = await supabase
        .from("restaurants")
        .delete()
        .eq("id", id);

      if (restaurantError) {
        throw restaurantError;
      }

      router.push(
        "/admin/restaurants"
      );
      router.refresh();
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Failed to delete restaurant."
      );

      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <main style={styles.page}>
        <div style={styles.container}>
          Loading...
        </div>
      </main>
    );
  }

  if (!restaurant) {
    return (
      <main style={styles.page}>
        <div style={styles.container}>
          <div style={styles.error}>
            Restaurant / Café not found.
          </div>

          <Link
            href="/admin/restaurants"
            style={styles.back}
          >
            ← Restaurants & Cafés
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main style={styles.page}>
      <div style={styles.container}>

        <Link
          href="/admin/restaurants"
          style={styles.back}
        >
          ← Restaurants & Cafés
        </Link>

        <div style={styles.header}>
          <div>
            <p style={styles.eyebrow}>
              TOKYO GUIDE ADMIN
            </p>

            <h1 style={styles.title}>
              Edit Restaurant / Café
            </h1>

            <p style={styles.headerName}>
              {name}
            </p>
          </div>

          <button
            onClick={deleteRestaurant}
            disabled={deleting}
            style={styles.delete}
          >
            {deleting
              ? "Deleting..."
              : "Delete"}
          </button>
        </div>

        {errorMessage && (
          <div style={styles.error}>
            {errorMessage}
          </div>
        )}

        {successMessage && (
          <div style={styles.success}>
            {successMessage}
          </div>
        )}

        <div style={styles.card}>

          <SectionTitle>
            Basic Information
          </SectionTitle>

          <Field
            label="Name *"
            value={name}
            onChange={setName}
          />

          <label style={styles.label}>
            Type
          </label>

          <select
            value={restaurantType}
            onChange={(e) =>
              setRestaurantType(
                e.target.value
              )
            }
            style={styles.input}
          >
            <option value="restaurant">
              Restaurant
            </option>

            <option value="cafe">
              Café
            </option>
          </select>

          <Field
            label="Description"
            value={description}
            onChange={setDescription}
            textarea
          />

          <Field
            label="Editor Note"
            value={editorNote}
            onChange={setEditorNote}
            textarea
          />

          <Field
            label="Photo URL"
            value={imageUrl}
            onChange={setImageUrl}
            placeholder="https://..."
          />

          {imageUrl && (
            <img
              src={imageUrl}
              alt={name}
              style={styles.preview}
            />
          )}

          <SectionTitle>
            Location
          </SectionTitle>

          <Field
            label="Region ID"
            value={regionId}
            onChange={setRegionId}
            placeholder="Optional"
          />

          <Field
            label="Area ID"
            value={areaId}
            onChange={setAreaId}
            placeholder="Optional"
          />

          <Field
            label="Address"
            value={address}
            onChange={setAddress}
          />

          <Field
            label="Postal Code"
            value={postalCode}
            onChange={setPostalCode}
          />

          <Field
            label="Phone"
            value={phone}
            onChange={setPhone}
          />

          <SectionTitle>
            Restaurant Information
          </SectionTitle>

          <Field
            label="Price Range"
            value={priceRange}
            onChange={setPriceRange}
            placeholder="e.g. ¥1,000–¥2,000"
          />

          <Field
            label="Seats"
            value={seats}
            onChange={setSeats}
            type="number"
          />

          <Field
            label="Counter Seats"
            value={counterSeats}
            onChange={setCounterSeats}
            type="number"
          />

          <Field
            label="Table Seats"
            value={tableSeats}
            onChange={setTableSeats}
            type="number"
          />

          <Field
            label="Reservation"
            value={reservation}
            onChange={setReservation}
            textarea
          />

          <Field
            label="English Support"
            value={englishSupport}
            onChange={setEnglishSupport}
            textarea
          />

          <label
            style={styles.checkboxRow}
          >
            <input
              type="checkbox"
              checked={card}
              onChange={(e) =>
                setCard(
                  e.target.checked
                )
              }
            />

            <span>
              Credit cards accepted
            </span>
          </label>

          <Field
            label="Opening Hours"
            value={openingHours}
            onChange={setOpeningHours}
            textarea
          />

          <Field
            label="Closed Days"
            value={closedDays}
            onChange={setClosedDays}
          />

          <SectionTitle>
            Links
          </SectionTitle>

          <Field
            label="Official Website"
            value={officialUrl}
            onChange={setOfficialUrl}
            placeholder="https://..."
          />

          <Field
            label="Instagram"
            value={instagramUrl}
            onChange={setInstagramUrl}
            placeholder="https://instagram.com/..."
          />

          <Field
            label="Tabelog"
            value={tabelogUrl}
            onChange={setTabelogUrl}
            placeholder="https://tabelog.com/..."
          />

          <SectionTitle>
            Google
          </SectionTitle>

          <Field
            label="Google Place ID"
            value={googlePlaceId}
            onChange={setGooglePlaceId}
            placeholder="Optional"
          />

          <p style={styles.note}>
            Google Place ID is stored for later
            Google Maps / Places integration.
          </p>

          <SectionTitle>
            Status
          </SectionTitle>

          <select
            value={status}
            onChange={(e) =>
              setStatus(e.target.value)
            }
            style={styles.input}
          >
            <option value="published">
              Published
            </option>

            <option value="draft">
              Draft
            </option>

            <option value="hidden">
              Hidden
            </option>

            <option value="archived">
              Archived
            </option>
          </select>

        </div>

        <div style={styles.signatureCard}>

          <div style={styles.signatureHeader}>
            <div>
              <p style={styles.eyebrow}>
                RESTAURANT / CAFÉ
              </p>

              <h2 style={styles.signatureTitle}>
                SIGNATURES
              </h2>

              <p style={styles.signatureDescription}>
                Foods that are offered at this
                restaurant or café.
                Each Food can have its own
                restaurant-specific photo and price.
              </p>
            </div>

            <button
              type="button"
              onClick={addSignature}
              style={styles.addButton}
            >
              + Add Food
            </button>
          </div>

          {signatures.length === 0 ? (
            <div style={styles.emptySignature}>
              <p>
                No Foods have been added yet.
              </p>

              <button
                type="button"
                onClick={addSignature}
                style={styles.emptyButton}
              >
                + Add a Food
              </button>
            </div>
          ) : (
            <div style={styles.signatureList}>
              {signatures.map(
                (
                  signature,
                  index
                ) => (
                  <div
                    key={
                      signature.id ??
                      `new-${index}`
                    }
                    style={
                      styles.signatureItem
                    }
                  >

                    <div
                      style={
                        styles.signatureTop
                      }
                    >
                      <div>
                        <span
                          style={
                            styles.signatureNumber
                          }
                        >
                          {String(
                            index + 1
                          ).padStart(
                            2,
                            "0"
                          )}
                        </span>

                        <strong
                          style={
                            styles.signatureFoodName
                          }
                        >
                          {getFoodName(
                            signature.food_id
                          )}
                        </strong>
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          removeSignature(
                            index
                          )
                        }
                        style={
                          styles.removeButton
                        }
                      >
                        Remove
                      </button>
                    </div>

                    <label
                      style={styles.label}
                    >
                      Food
                    </label>

                    <select
                      value={
                        signature.food_id
                      }
                      onChange={(e) =>
                        updateSignature(
                          index,
                          "food_id",
                          e.target.value
                        )
                      }
                      style={
                        styles.input
                      }
                    >
                      {foods.map(
                        (food) => (
                          <option
                            key={
                              food.id
                            }
                            value={
                              food.id
                            }
                          >
                            {food.name}
                          </option>
                        )
                      )}
                    </select>

                    <label
                      style={styles.label}
                    >
                      Restaurant-specific Photo URL
                    </label>

                    <input
                      value={
                        signature.signature_image_url
                      }
                      onChange={(e) =>
                        updateSignature(
                          index,
                          "signature_image_url",
                          e.target.value
                        )
                      }
                      placeholder="https://..."
                      style={
                        styles.input
                      }
                    />

                    {signature.signature_image_url && (
                      <img
                        src={
                          signature.signature_image_url
                        }
                        alt={getFoodName(
                          signature.food_id
                        )}
                        style={
                          styles.signaturePreview
                        }
                      />
                    )}

                    <label
                      style={styles.label}
                    >
                      Price
                    </label>

                    <input
                      value={
                        signature.price
                      }
                      onChange={(e) =>
                        updateSignature(
                          index,
                          "price",
                          e.target.value
                        )
                      }
                      placeholder="e.g. ¥1,800"
                      style={
                        styles.input
                      }
                    />

                    <label
                      style={
                        styles.checkboxRow
                      }
                    >
                      <input
                        type="checkbox"
                        checked={
                          signature.is_signature
                        }
                        onChange={(e) =>
                          updateSignature(
                            index,
                            "is_signature",
                            e.target.checked
                          )
                        }
                      />

                      <span>
                        Show as SIGNATURE
                      </span>
                    </label>

                    <label
                      style={styles.label}
                    >
                      Editor Note
                    </label>

                    <textarea
                      value={
                        signature.editor_note
                      }
                      onChange={(e) =>
                        updateSignature(
                          index,
                          "editor_note",
                          e.target.value
                        )
                      }
                      placeholder="Optional"
                      style={
                        styles.textarea
                      }
                    />

                  </div>
                )
              )}
            </div>
          )}

        </div>

        <div style={styles.bottom}>

          <Link
            href="/admin/restaurants"
            style={styles.cancel}
          >
            Back
          </Link>

          <button
            onClick={saveRestaurant}
            disabled={saving}
            style={styles.save}
          >
            {saving
              ? "Saving..."
              : "Save Changes ✦"}
          </button>

        </div>

      </div>
    </main>
  );
}

function SectionTitle({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <h2 style={styles.sectionTitle}>
      {children}
    </h2>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  textarea = false,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (
    value: string
  ) => void;
  placeholder?: string;
  textarea?: boolean;
  type?: string;
}) {
  return (
    <>
      <label style={styles.label}>
        {label}
      </label>

      {textarea ? (
        <textarea
          value={value}
          onChange={(e) =>
            onChange(
              e.target.value
            )
          }
          placeholder={placeholder}
          style={styles.textarea}
        />
      ) : (
        <input
          type={type}
          value={value}
          onChange={(e) =>
            onChange(
              e.target.value
            )
          }
          placeholder={placeholder}
          style={styles.input}
        />
      )}
    </>
  );
}

const styles: Record<
  string,
  React.CSSProperties
> = {
  page: {
    minHeight: "100vh",
    padding: 40,
    background: "#fff8fb",
  },

  container: {
    maxWidth: 900,
    margin: "0 auto",
  },

  back: {
    color: "#9a6078",
    textDecoration: "none",
  },

  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    margin: "25px 0",
    gap: 20,
  },

  eyebrow: {
    fontSize: 11,
    fontWeight: 800,
    letterSpacing: "0.15em",
    color: "#b2819c",
    marginBottom: 6,
  },

  title: {
    margin: "5px 0",
    color: "#463c46",
  },

  headerName: {
    marginTop: 8,
    color: "#927d89",
  },

  card: {
    background: "#fff",
    padding: 30,
    borderRadius: 20,
    border: "1px solid #eadde4",
  },

  signatureCard: {
    background: "#fff",
    padding: 30,
    borderRadius: 20,
    border: "1px solid #eadde4",
    marginTop: 20,
  },

  sectionTitle: {
    marginTop: 32,
    paddingBottom: 10,
    borderBottom: "1px solid #eadde4",
    color: "#463c46",
    fontSize: 18,
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
    background: "#fff",
  },

  textarea: {
    width: "100%",
    minHeight: 110,
    padding: 13,
    borderRadius: 10,
    border: "1px solid #dfd3da",
    boxSizing: "border-box",
    resize: "vertical",
    fontFamily: "inherit",
  },

  preview: {
    width: "100%",
    maxWidth: 400,
    marginTop: 15,
    borderRadius: 12,
  },

  signaturePreview: {
    display: "block",
    width: "100%",
    maxWidth: 360,
    maxHeight: 260,
    objectFit: "cover",
    marginTop: 15,
    borderRadius: 12,
  },

  checkboxRow: {
    display: "flex",
    gap: 10,
    alignItems: "center",
    marginTop: 20,
    color: "#705b67",
    fontWeight: 700,
  },

  note: {
    fontSize: 12,
    color: "#927d89",
    lineHeight: 1.6,
  },

  signatureHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 20,
  },

  signatureTitle: {
    margin: 0,
    color: "#463c46",
    fontSize: 24,
  },

  signatureDescription: {
    maxWidth: 600,
    color: "#806878",
    lineHeight: 1.6,
  },

  addButton: {
    padding: "12px 17px",
    border: 0,
    borderRadius: 12,
    background: "#d98eae",
    color: "#fff",
    fontWeight: 700,
    cursor: "pointer",
    whiteSpace: "nowrap",
  },

  emptySignature: {
    marginTop: 20,
    padding: 35,
    borderRadius: 16,
    border: "1px dashed #d9c7d1",
    textAlign: "center",
    color: "#806878",
  },

  emptyButton: {
    padding: "10px 16px",
    border: 0,
    borderRadius: 10,
    background: "#f5e8ef",
    color: "#8c5e74",
    fontWeight: 700,
    cursor: "pointer",
  },

  signatureList: {
    display: "grid",
    gap: 20,
    marginTop: 20,
  },

  signatureItem: {
    padding: 24,
    borderRadius: 16,
    border: "1px solid #eadde4",
    background: "#fffafb",
  },

  signatureTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 15,
  },

  signatureNumber: {
    display: "inline-block",
    marginRight: 10,
    color: "#b2819c",
    fontSize: 12,
    fontWeight: 800,
    letterSpacing: "0.08em",
  },

  signatureFoodName: {
    color: "#463c46",
    fontSize: 17,
  },

  removeButton: {
    border: 0,
    background: "transparent",
    color: "#bd5367",
    cursor: "pointer",
    fontWeight: 700,
  },

  bottom: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 25,
  },

  cancel: {
    padding: "13px 20px",
    color: "#806878",
    textDecoration: "none",
  },

  save: {
    padding: "13px 22px",
    border: 0,
    borderRadius: 12,
    background: "#d98eae",
    color: "#fff",
    fontWeight: 700,
    cursor: "pointer",
  },

  delete: {
    padding: "10px 16px",
    border: 0,
    borderRadius: 10,
    background: "#fff0f2",
    color: "#bd5367",
    cursor: "pointer",
    fontWeight: 700,
  },

  error: {
    padding: 15,
    marginBottom: 15,
    borderRadius: 12,
    background: "#fff0f2",
    color: "#b45165",
  },

  success: {
    padding: 15,
    marginBottom: 15,
    borderRadius: 12,
    background: "#f3efff",
    color: "#70568d",
  },
};