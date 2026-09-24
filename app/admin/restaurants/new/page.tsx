"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function NewRestaurantPage() {
  const router = useRouter();

  const [siteId, setSiteId] = useState("");

  const [name, setName] = useState("");
  const [restaurantType, setRestaurantType] =
    useState("restaurant");
  const [description, setDescription] = useState("");
  const [editorNote, setEditorNote] = useState("");
  const [imageUrl, setImageUrl] = useState("");

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

  const [openingHours, setOpeningHours] =
    useState("");
  const [closedDays, setClosedDays] =
    useState("");

  const [officialUrl, setOfficialUrl] = useState("");
  const [instagramUrl, setInstagramUrl] =
    useState("");
  const [tabelogUrl, setTabelogUrl] =
    useState("");

  const [googlePlaceId, setGooglePlaceId] =
    useState("");

  const [status, setStatus] =
    useState("published");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] =
    useState("");

  useEffect(() => {
    loadSite();
  }, []);

  async function loadSite() {
    try {
      const { data, error } = await supabase
        .from("sites")
        .select("id")
        .eq("slug", "tokyo-guide")
        .single();

      if (error || !data) {
        throw error || new Error("Tokyo Guide site not found.");
      }

      setSiteId(data.id);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Failed to load site."
      );
    } finally {
      setLoading(false);
    }
  }

  async function createRestaurant() {
    setErrorMessage("");

    if (!name.trim()) {
      setErrorMessage(
        "Please enter a restaurant / café name."
      );
      return;
    }

    if (!siteId) {
      setErrorMessage(
        "Site information is not available."
      );
      return;
    }

    setSaving(true);

    try {
      const { data, error } = await supabase
        .from("restaurants")
        .insert({
          site_id: siteId,

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
        .select("id")
        .single();

      if (error) {
        throw error;
      }

      router.push(
        `/admin/restaurants/${data.id}`
      );
      router.refresh();
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Failed to create restaurant."
      );
    } finally {
      setSaving(false);
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
              Add Restaurant / Café
            </h1>
          </div>
        </div>

        {errorMessage && (
          <div style={styles.error}>
            {errorMessage}
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
              setRestaurantType(e.target.value)
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

          <label style={styles.checkboxRow}>
            <input
              type="checkbox"
              checked={card}
              onChange={(e) =>
                setCard(e.target.checked)
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
            Google Place ID is stored here for later
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

          <div style={styles.bottom}>
            <Link
              href="/admin/restaurants"
              style={styles.cancel}
            >
              Cancel
            </Link>

            <button
              onClick={createRestaurant}
              disabled={saving}
              style={styles.save}
            >
              {saving
                ? "Saving..."
                : "Create Restaurant ✦"}
            </button>
          </div>

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
  onChange: (value: string) => void;
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
            onChange(e.target.value)
          }
          placeholder={placeholder}
          style={styles.textarea}
        />
      ) : (
        <input
          type={type}
          value={value}
          onChange={(e) =>
            onChange(e.target.value)
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
    maxWidth: 800,
    margin: "0 auto",
  },

  back: {
    color: "#9a6078",
    textDecoration: "none",
  },

  header: {
    margin: "25px 0",
  },

  eyebrow: {
    fontSize: 11,
    fontWeight: 800,
    letterSpacing: "0.15em",
    color: "#b2819c",
  },

  title: {
    margin: "5px 0",
    color: "#463c46",
  },

  card: {
    background: "#fff",
    padding: 30,
    borderRadius: 20,
    border: "1px solid #eadde4",
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
  },

  textarea: {
    width: "100%",
    minHeight: 110,
    padding: 13,
    borderRadius: 10,
    border: "1px solid #dfd3da",
    boxSizing: "border-box",
    resize: "vertical",
  },

  preview: {
    width: "100%",
    maxWidth: 400,
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

  bottom: {
    display: "flex",
    justifyContent: "space-between",
    marginTop: 35,
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

  error: {
    padding: 15,
    marginBottom: 15,
    borderRadius: 12,
    background: "#fff0f2",
    color: "#b45165",
  },
};