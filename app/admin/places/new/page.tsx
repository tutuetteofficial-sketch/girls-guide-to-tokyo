"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type PlaceType = {
  id: number;
  name: string;
};

type Area = {
  id: number;
  name: string;
};

type Station = {
  id: number;
  name: string;
};

type AccessRow = {
  station_id: string;
  station_name: string;
  station_exit: string;
  walk_minutes: string;
};

export default function NewPlacePage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const [siteId, setSiteId] = useState("");

  const [placeTypes, setPlaceTypes] = useState<PlaceType[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const [stations, setStations] = useState<Station[]>([]);

  // Basic
  const [name, setName] = useState("");
  const [placeTypeId, setPlaceTypeId] = useState("");

  // Areaは自由入力
  const [areaName, setAreaName] = useState("");

  const [description, setDescription] = useState("");
  const [editorNote, setEditorNote] = useState("");

  // Location
  const [postalCode, setPostalCode] = useState("");
  const [address, setAddress] = useState("");
  const [googleMapsUrl, setGoogleMapsUrl] = useState("");

  // Contact
  const [phone, setPhone] = useState("");
  const [officialUrl, setOfficialUrl] = useState("");
  const [instagramUrl, setInstagramUrl] = useState("");
  const [tabelogUrl, setTabelogUrl] = useState("");

  // Store information
  const [priceRange, setPriceRange] = useState("");
  const [reservation, setReservation] = useState("");
  const [englishSupport, setEnglishSupport] = useState("");

  const [openingHours, setOpeningHours] = useState("");
  const [closedDays, setClosedDays] = useState("");

  const [seats, setSeats] = useState("");
  const [counterSeats, setCounterSeats] = useState("");
  const [tableSeats, setTableSeats] = useState("");

  const [card, setCard] = useState(false);
  const [taxFree, setTaxFree] = useState(false);

  // Image
  const [imageUrl, setImageUrl] = useState("");

  // Publishing
  const [status, setStatus] = useState("draft");

  // Multiple access
  const [accessRows, setAccessRows] = useState<AccessRow[]>([
    {
      station_id: "",
      station_name: "",
      station_exit: "",
      walk_minutes: "",
    },
  ]);

  useEffect(() => {
    loadInitialData();
  }, []);

  async function loadInitialData() {
    setLoading(true);
    setErrorMessage("");

    const { data: site, error: siteError } = await supabase
      .from("sites")
      .select("id")
      .eq("slug", "tokyo-guide")
      .single();

    if (siteError || !site) {
      setErrorMessage(
        siteError?.message || "TOKYO GUIDE site could not be found."
      );
      setLoading(false);
      return;
    }

    setSiteId(site.id);

    const [typesResult, areasResult, stationsResult] =
      await Promise.all([
        supabase
          .from("place_types")
          .select("id, name")
          .eq("site_id", site.id)
          .eq("is_active", true)
          .order("sort_order"),

        supabase
          .from("areas")
          .select("id, name")
          .eq("site_id", site.id)
          .eq("is_active", true)
          .order("name"),

        supabase
          .from("stations")
          .select("id, name")
          .eq("site_id", site.id)
          .eq("is_active", true)
          .order("name"),
      ]);

    const firstError =
      typesResult.error ||
      areasResult.error ||
      stationsResult.error;

    if (firstError) {
      setErrorMessage(firstError.message);
      setLoading(false);
      return;
    }

    setPlaceTypes(typesResult.data ?? []);
    setAreas(areasResult.data ?? []);
    setStations(stationsResult.data ?? []);

    setLoading(false);
  }

  function createSlug(value: string) {
    return value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");
  }

  // ------------------------------------------
  // ACCESS
  // ------------------------------------------

  function addAccessRow() {
    setAccessRows([
      ...accessRows,
      {
        station_id: "",
        station_name: "",
        station_exit: "",
        walk_minutes: "",
      },
    ]);
  }

  function removeAccessRow(index: number) {
    setAccessRows(accessRows.filter((_, i) => i !== index));
  }

  function updateAccessRow(
    index: number,
    field: keyof AccessRow,
    value: string
  ) {
    const updated = [...accessRows];

    updated[index] = {
      ...updated[index],
      [field]: value,
    };

    if (field === "station_id") {
      const selectedStation = stations.find(
        (station) => String(station.id) === value
      );

      updated[index].station_name =
        selectedStation?.name ?? "";
    }

    setAccessRows(updated);
  }

  // ------------------------------------------
  // AREA
  // ------------------------------------------

  async function getOrCreateAreaId(): Promise<number | null> {
    const trimmedName = areaName.trim();

    if (!trimmedName) {
      return null;
    }

    // 既存Areaを探す
    const existingArea = areas.find(
      (area) =>
        area.name.toLowerCase() === trimmedName.toLowerCase()
    );

    if (existingArea) {
      return existingArea.id;
    }

    // 新しいAreaを作成
    const { data: newArea, error } = await supabase
      .from("areas")
      .insert({
        site_id: siteId,
        name: trimmedName,
        slug: createSlug(trimmedName),
        is_active: true,
      })
      .select("id, name")
      .single();

    if (error || !newArea) {
      throw new Error(
        error?.message || "Failed to create area."
      );
    }

    return newArea.id;
  }

  // ------------------------------------------
  // SAVE
  // ------------------------------------------

  async function handleSave() {
    setErrorMessage("");

    if (!name.trim()) {
      setErrorMessage("Please enter a Place Name.");
      return;
    }

    if (!siteId) {
      setErrorMessage("Site information could not be loaded.");
      return;
    }

    setSaving(true);

    try {
      // Areaを取得または新規作成
      const areaId = await getOrCreateAreaId();

      // Place作成
      const { data: newPlace, error: placeError } =
        await supabase
          .from("places")
          .insert({
            site_id: siteId,

            place_type_id: placeTypeId
              ? Number(placeTypeId)
              : null,

            area_id: areaId,

            name: name.trim(),
            slug: createSlug(name),

            description: description || null,
            editor_note: editorNote || null,

            postal_code: postalCode || null,
            address: address || null,
            google_maps_url: googleMapsUrl || null,

            phone: phone || null,

            official_url: officialUrl || null,
            instagram_url: instagramUrl || null,
            tabelog_url: tabelogUrl || null,

            price_range: priceRange || null,
            reservation: reservation || null,
            english_support: englishSupport || null,

            opening_hours: openingHours || null,
            closed_days: closedDays || null,

            seats: seats ? Number(seats) : null,
            counter_seats: counterSeats
              ? Number(counterSeats)
              : null,
            table_seats: tableSeats
              ? Number(tableSeats)
              : null,

            card,
            tax_free: taxFree,

            image_url: imageUrl || null,

            status,
          })
          .select("id")
          .single();

      if (placeError || !newPlace) {
        throw new Error(
          placeError?.message || "Failed to save place."
        );
      }

      // ------------------------------------------
      // Multiple Stations
      // ------------------------------------------

      const validAccessRows = accessRows.filter(
        (row) => row.station_id
      );

      if (validAccessRows.length > 0) {
        const accessData = validAccessRows.map(
          (row, index) => ({
            place_id: newPlace.id,
            station_id: Number(row.station_id),
            station_exit: row.station_exit || null,
            walk_minutes: row.walk_minutes
              ? Number(row.walk_minutes)
              : null,
            sort_order: index,
          })
        );

        const { error: accessError } = await supabase
          .from("place_access")
          .insert(accessData);

        if (accessError) {
          throw new Error(
            `Place was saved, but access information failed: ${accessError.message}`
          );
        }
      }

      router.push(`/admin/places/${newPlace.id}`);
      router.refresh();
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Something went wrong."
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main style={styles.page}>
        <div style={styles.loading}>
          Loading your Tokyo Guide...
        </div>
      </main>
    );
  }

  return (
    <main style={styles.page}>
      <div style={styles.container}>

        {/* HEADER */}

        <div style={styles.header}>
          <div>
            <Link
              href="/admin/places"
              style={styles.backLink}
            >
              ← Back to Places
            </Link>

            <h1 style={styles.title}>
              ✦ Add a New Place
            </h1>

            <p style={styles.subtitle}>
              Add your favorite spot to TOKYO GUIDE
            </p>
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            style={styles.saveButton}
          >
            {saving ? "Saving..." : "Save Place ✦"}
          </button>
        </div>

        {errorMessage && (
          <div style={styles.error}>
            {errorMessage}
          </div>
        )}

        {/* BASIC */}

        <section style={styles.card}>
          <div style={styles.cardHeader}>
            <span style={styles.icon}>✦</span>

            <div>
              <h2 style={styles.sectionTitle}>
                Basic Information
              </h2>

              <p style={styles.sectionText}>
                The essentials
              </p>
            </div>
          </div>

          <div style={styles.formGrid}>
            <div style={styles.full}>
              <label style={styles.label}>
                Place Name *
              </label>

              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Senso-ji Temple"
                style={styles.input}
              />
            </div>

            <div>
              <label style={styles.label}>
                Type
              </label>

              <select
                value={placeTypeId}
                onChange={(e) =>
                  setPlaceTypeId(e.target.value)
                }
                style={styles.input}
              >
                <option value="">
                  Select type
                </option>

                {placeTypes.map((type) => (
                  <option
                    key={type.id}
                    value={type.id}
                  >
                    {type.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={styles.label}>
                Area
              </label>

              <input
                list="area-options"
                value={areaName}
                onChange={(e) =>
                  setAreaName(e.target.value)
                }
                placeholder="Type a new area or choose one"
                style={styles.input}
              />

              <datalist id="area-options">
                {areas.map((area) => (
                  <option
                    key={area.id}
                    value={area.name}
                  />
                ))}
              </datalist>

              <p style={styles.helper}>
                You can type a new area anytime ✦
              </p>
            </div>
          </div>

          <div style={styles.full}>
            <label style={styles.label}>
              Description
            </label>

            <textarea
              value={description}
              onChange={(e) =>
                setDescription(e.target.value)
              }
              placeholder="Tell visitors why this place is special..."
              style={styles.textarea}
            />
          </div>

          <div style={styles.full}>
            <label style={styles.label}>
              Editor Note
            </label>

            <textarea
              value={editorNote}
              onChange={(e) =>
                setEditorNote(e.target.value)
              }
              placeholder="Your private notes..."
              style={styles.textareaSmall}
            />
          </div>
        </section>

        {/* LOCATION */}

        <section style={styles.card}>
          <div style={styles.cardHeader}>
            <span style={styles.icon}>📍</span>

            <div>
              <h2 style={styles.sectionTitle}>
                Location
              </h2>
            </div>
          </div>

          <div style={styles.formGrid}>
            <div>
              <label style={styles.label}>
                Postal Code
              </label>

              <input
                value={postalCode}
                onChange={(e) =>
                  setPostalCode(e.target.value)
                }
                style={styles.input}
              />
            </div>

            <div>
              <label style={styles.label}>
                Google Maps URL
              </label>

              <input
                value={googleMapsUrl}
                onChange={(e) =>
                  setGoogleMapsUrl(e.target.value)
                }
                placeholder="Paste Google Maps link"
                style={styles.input}
              />
            </div>

            <div style={styles.full}>
              <label style={styles.label}>
                Address
              </label>

              <input
                value={address}
                onChange={(e) =>
                  setAddress(e.target.value)
                }
                placeholder="Full address"
                style={styles.input}
              />
            </div>
          </div>
        </section>

        {/* ACCESS */}

        <section style={styles.card}>
          <div style={styles.cardHeader}>
            <span style={styles.icon}>🚃</span>

            <div>
              <h2 style={styles.sectionTitle}>
                Access
              </h2>

              <p style={styles.sectionText}>
                Add as many nearby stations as you want
              </p>
            </div>
          </div>

          {accessRows.map((row, index) => (
            <div
              key={index}
              style={styles.accessRow}
            >
              <select
                value={row.station_id}
                onChange={(e) =>
                  updateAccessRow(
                    index,
                    "station_id",
                    e.target.value
                  )
                }
                style={styles.input}
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

              <input
                value={row.station_exit}
                onChange={(e) =>
                  updateAccessRow(
                    index,
                    "station_exit",
                    e.target.value
                  )
                }
                placeholder="Exit"
                style={styles.input}
              />

              <input
                type="number"
                value={row.walk_minutes}
                onChange={(e) =>
                  updateAccessRow(
                    index,
                    "walk_minutes",
                    e.target.value
                  )
                }
                placeholder="Minutes"
                style={styles.input}
              />

              {accessRows.length > 1 && (
                <button
                  type="button"
                  onClick={() =>
                    removeAccessRow(index)
                  }
                  style={styles.removeButton}
                >
                  ×
                </button>
              )}
            </div>
          ))}

          <button
            type="button"
            onClick={addAccessRow}
            style={styles.addButton}
          >
            ＋ Add another station
          </button>
        </section>

        {/* CONTACT */}

        <section style={styles.card}>
          <div style={styles.cardHeader}>
            <span style={styles.icon}>♡</span>

            <div>
              <h2 style={styles.sectionTitle}>
                Links & Contact
              </h2>
            </div>
          </div>

          <div style={styles.formGrid}>
            <div>
              <label style={styles.label}>Phone</label>

              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                style={styles.input}
              />
            </div>

            <div>
              <label style={styles.label}>
                Official Website
              </label>

              <input
                value={officialUrl}
                onChange={(e) =>
                  setOfficialUrl(e.target.value)
                }
                style={styles.input}
              />
            </div>

            <div>
              <label style={styles.label}>
                Instagram
              </label>

              <input
                value={instagramUrl}
                onChange={(e) =>
                  setInstagramUrl(e.target.value)
                }
                style={styles.input}
              />
            </div>

            <div>
              <label style={styles.label}>
                Tabelog
              </label>

              <input
                value={tabelogUrl}
                onChange={(e) =>
                  setTabelogUrl(e.target.value)
                }
                style={styles.input}
              />
            </div>
          </div>
        </section>

        {/* DETAILS */}

        <section style={styles.card}>
          <div style={styles.cardHeader}>
            <span style={styles.icon}>☕</span>

            <div>
              <h2 style={styles.sectionTitle}>
                Details
              </h2>
            </div>
          </div>

          <div style={styles.formGrid}>
            <div>
              <label style={styles.label}>
                Price Range
              </label>

              <input
                value={priceRange}
                onChange={(e) =>
                  setPriceRange(e.target.value)
                }
                placeholder="¥1,000–¥2,000"
                style={styles.input}
              />
            </div>

            <div>
              <label style={styles.label}>
                Reservation
              </label>

              <input
                value={reservation}
                onChange={(e) =>
                  setReservation(e.target.value)
                }
                style={styles.input}
              />
            </div>

            <div>
              <label style={styles.label}>
                English Support
              </label>

              <input
                value={englishSupport}
                onChange={(e) =>
                  setEnglishSupport(e.target.value)
                }
                style={styles.input}
              />
            </div>

            <div>
              <label style={styles.label}>
                Opening Hours
              </label>

              <input
                value={openingHours}
                onChange={(e) =>
                  setOpeningHours(e.target.value)
                }
                style={styles.input}
              />
            </div>

            <div>
              <label style={styles.label}>
                Closed Days
              </label>

              <input
                value={closedDays}
                onChange={(e) =>
                  setClosedDays(e.target.value)
                }
                style={styles.input}
              />
            </div>
          </div>
        </section>

        {/* IMAGE */}

        <section style={styles.card}>
          <div style={styles.cardHeader}>
            <span style={styles.icon}>✧</span>

            <div>
              <h2 style={styles.sectionTitle}>
                Image
              </h2>
            </div>
          </div>

          <input
            value={imageUrl}
            onChange={(e) =>
              setImageUrl(e.target.value)
            }
            placeholder="Image URL"
            style={styles.input}
          />
        </section>

        {/* PUBLISH */}

        <section style={styles.card}>
          <h2 style={styles.sectionTitle}>
            Publishing
          </h2>

          <select
            value={status}
            onChange={(e) =>
              setStatus(e.target.value)
            }
            style={styles.input}
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
        </section>

        <div style={styles.bottom}>
          <Link
            href="/admin/places"
            style={styles.cancelButton}
          >
            Cancel
          </Link>

          <button
            onClick={handleSave}
            disabled={saving}
            style={styles.saveButton}
          >
            {saving ? "Saving..." : "Save Place ✦"}
          </button>
        </div>

      </div>
    </main>
  );
}


const styles = {
  page: {
    minHeight: "100vh",
    padding: "40px 20px 100px",
    background:
      "linear-gradient(135deg, #fff7fb 0%, #f8f5ff 45%, #fff9f3 100%)",
    color: "#453b46",
  },

  container: {
    maxWidth: "1000px",
    margin: "0 auto",
  },

  loading: {
    textAlign: "center" as const,
    padding: "100px 20px",
    color: "#8d7183",
  },

  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "20px",
    marginBottom: "30px",
  },

  backLink: {
    textDecoration: "none",
    color: "#a27891",
    fontSize: "14px",
    fontWeight: 600,
  },

  title: {
    fontSize: "34px",
    margin: "12px 0 6px",
    letterSpacing: "-1px",
  },

  subtitle: {
    margin: 0,
    color: "#947f8d",
  },

  card: {
    background: "rgba(255,255,255,0.85)",
    border: "1px solid #f0dfe8",
    borderRadius: "24px",
    padding: "28px",
    marginBottom: "20px",
    boxShadow: "0 8px 30px rgba(173,120,150,0.08)",
  },

  cardHeader: {
    display: "flex",
    alignItems: "center",
    gap: "13px",
    marginBottom: "22px",
  },

  icon: {
    width: "42px",
    height: "42px",
    borderRadius: "14px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#fff0f6",
    fontSize: "20px",
  },

  sectionTitle: {
    margin: 0,
    fontSize: "20px",
  },

  sectionText: {
    margin: "4px 0 0",
    color: "#a28b99",
    fontSize: "13px",
  },

  formGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(230px, 1fr))",
    gap: "18px",
  },

  full: {
    gridColumn: "1 / -1",
    marginTop: "18px",
  },

  label: {
    display: "block",
    marginBottom: "8px",
    fontSize: "13px",
    fontWeight: 700,
    color: "#654f5d",
  },

  input: {
    width: "100%",
    height: "48px",
    padding: "0 14px",
    borderRadius: "12px",
    border: "1px solid #ead9e2",
    background: "#fff",
    fontSize: "14px",
    color: "#493d45",
    boxSizing: "border-box" as const,
  },

  textarea: {
    width: "100%",
    minHeight: "120px",
    padding: "14px",
    borderRadius: "14px",
    border: "1px solid #ead9e2",
    background: "#fff",
    fontSize: "14px",
    boxSizing: "border-box" as const,
    resize: "vertical" as const,
  },

  textareaSmall: {
    width: "100%",
    minHeight: "80px",
    padding: "14px",
    borderRadius: "14px",
    border: "1px solid #ead9e2",
    background: "#fffafc",
    fontSize: "14px",
    boxSizing: "border-box" as const,
    resize: "vertical" as const,
  },

  helper: {
    margin: "7px 0 0",
    fontSize: "12px",
    color: "#b08b9f",
  },

  accessRow: {
    display: "grid",
    gridTemplateColumns: "2fr 1fr 1fr 42px",
    gap: "10px",
    alignItems: "center",
    marginBottom: "10px",
  },

  addButton: {
    marginTop: "8px",
    border: "1px dashed #d8a8c0",
    background: "#fff6fa",
    color: "#a56787",
    padding: "11px 16px",
    borderRadius: "12px",
    cursor: "pointer",
    fontWeight: 600,
  },

  removeButton: {
    width: "38px",
    height: "38px",
    borderRadius: "50%",
    border: "none",
    background: "#fff0f3",
    color: "#c57b91",
    cursor: "pointer",
    fontSize: "20px",
  },

  saveButton: {
    border: "none",
    borderRadius: "14px",
    padding: "14px 22px",
    background:
      "linear-gradient(135deg, #e69ab7, #c69adf)",
    color: "#fff",
    fontWeight: 700,
    cursor: "pointer",
    boxShadow: "0 6px 18px rgba(198,154,223,0.25)",
  },

  cancelButton: {
    padding: "13px 20px",
    borderRadius: "14px",
    background: "#fff",
    border: "1px solid #ead9e2",
    color: "#806c78",
    textDecoration: "none",
  },

  bottom: {
    display: "flex",
    justifyContent: "flex-end",
    gap: "12px",
    marginTop: "30px",
  },

  error: {
    marginBottom: "20px",
    padding: "16px",
    borderRadius: "14px",
    background: "#fff0f2",
    border: "1px solid #f0b7c1",
    color: "#a74d60",
  },
};