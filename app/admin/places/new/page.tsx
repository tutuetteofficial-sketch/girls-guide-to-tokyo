"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type PlaceType = {
  id: number;
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

export default function NewPlacePage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const [siteId, setSiteId] = useState("");

  const [placeTypes, setPlaceTypes] = useState<PlaceType[]>([]);
  const [regions, setRegions] = useState<Region[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const [stations, setStations] = useState<Station[]>([]);

  const [name, setName] = useState("");
  const [placeTypeId, setPlaceTypeId] = useState("");
  const [regionId, setRegionId] = useState("");
  const [areaId, setAreaId] = useState("");

  const [description, setDescription] = useState("");
  const [editorNote, setEditorNote] = useState("");

  const [postalCode, setPostalCode] = useState("");
  const [address, setAddress] = useState("");

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

  const [imageUrl, setImageUrl] = useState("");

  const [stationId, setStationId] = useState("");
  const [stationExit, setStationExit] = useState("");
  const [walkMinutes, setWalkMinutes] = useState("");

  const [status, setStatus] = useState("draft");

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
        siteError?.message ||
          "TOKYO GUIDE site could not be found."
      );
      setLoading(false);
      return;
    }

    setSiteId(site.id);

    const [
      placeTypesResult,
      regionsResult,
      stationsResult,
    ] = await Promise.all([
      supabase
        .from("place_types")
        .select("id, name")
        .eq("site_id", site.id)
        .eq("is_active", true)
        .order("sort_order", { ascending: true }),

      supabase
        .from("regions")
        .select("id, name")
        .eq("site_id", site.id)
        .eq("is_active", true)
        .order("sort_order", { ascending: true }),

      supabase
        .from("stations")
        .select("id, name")
        .eq("site_id", site.id)
        .eq("is_active", true)
        .order("name", { ascending: true }),
    ]);

    const firstError =
      placeTypesResult.error ||
      regionsResult.error ||
      stationsResult.error;

    if (firstError) {
      setErrorMessage(firstError.message);
      setLoading(false);
      return;
    }

    setPlaceTypes(placeTypesResult.data ?? []);
    setRegions(regionsResult.data ?? []);
    setStations(stationsResult.data ?? []);

    setLoading(false);
  }

  async function handleRegionChange(
    newRegionId: string
  ) {
    setRegionId(newRegionId);
    setAreaId("");
    setAreas([]);

    if (!newRegionId) return;

    const { data, error } = await supabase
      .from("areas")
      .select("id, region_id, name")
      .eq("region_id", Number(newRegionId))
      .eq("is_active", true)
      .order("sort_order", { ascending: true });

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    setAreas(data ?? []);
  }

  function createSlug(value: string) {
    return value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");
  }

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

    const { data: newPlace, error } = await supabase
      .from("places")
      .insert({
        site_id: siteId,

        place_type_id: placeTypeId
          ? Number(placeTypeId)
          : null,

        region_id: regionId
          ? Number(regionId)
          : null,

        area_id: areaId
          ? Number(areaId)
          : null,

        name: name.trim(),
        slug: createSlug(name),

        description: description || null,
        editor_note: editorNote || null,

        postal_code: postalCode || null,
        address: address || null,

        phone: phone || null,

        price_range: priceRange || null,

        seats: seats ? Number(seats) : null,
        counter_seats: counterSeats
          ? Number(counterSeats)
          : null,
        table_seats: tableSeats
          ? Number(tableSeats)
          : null,

        reservation: reservation || null,
        english_support: englishSupport || null,

        card,
        tax_free: taxFree,

        opening_hours: openingHours || null,
        closed_days: closedDays || null,

        official_url: officialUrl || null,
        instagram_url: instagramUrl || null,
        tabelog_url: tabelogUrl || null,
        google_maps_url: googleMapsUrl || null,

        image_url: imageUrl || null,

        status,
      })
      .select("id")
      .single();

    if (error || !newPlace) {
      setErrorMessage(
        error?.message ||
          "Failed to save the place."
      );
      setSaving(false);
      return;
    }

    if (stationId) {
      const { error: accessError } = await supabase
        .from("place_access")
        .insert({
          place_id: newPlace.id,
          station_id: Number(stationId),
          station_exit: stationExit || null,
          walk_minutes: walkMinutes
            ? Number(walkMinutes)
            : null,
        });

      if (accessError) {
        setErrorMessage(
          `Place was saved, but station information could not be saved: ${accessError.message}`
        );
        setSaving(false);
        return;
      }
    }

    router.push(`/admin/places/${newPlace.id}`);
    router.refresh();
  }

  if (loading) {
    return (
      <main style={styles.page}>
        <p>Loading...</p>
      </main>
    );
  }

  return (
    <main style={styles.page}>
      <div style={styles.container}>
        <div style={styles.top}>
          <div>
            <Link
              href="/admin/places"
              style={styles.backLink}
            >
              ← Places
            </Link>

            <h1 style={styles.title}>
              Add New Place
            </h1>

            <p style={styles.subtitle}>
              Register a restaurant, shop, sightseeing spot, or other place.
            </p>
          </div>

          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            style={{
              ...styles.saveButton,
              opacity: saving ? 0.6 : 1,
            }}
          >
            {saving ? "Saving..." : "Save Place"}
          </button>
        </div>

        {errorMessage && (
          <div style={styles.error}>
            {errorMessage}
          </div>
        )}

        {/* BASIC INFORMATION */}

        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>
            Basic Information
          </h2>

          <div style={styles.grid}>
            <div style={styles.fullWidth}>
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
                Region
              </label>

              <select
                value={regionId}
                onChange={(e) =>
                  handleRegionChange(e.target.value)
                }
                style={styles.input}
              >
                <option value="">
                  Select region
                </option>

                {regions.map((region) => (
                  <option
                    key={region.id}
                    value={region.id}
                  >
                    {region.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={styles.label}>
                Area
              </label>

              <select
                value={areaId}
                onChange={(e) =>
                  setAreaId(e.target.value)
                }
                disabled={!regionId}
                style={{
                  ...styles.input,
                  opacity: regionId ? 1 : 0.5,
                }}
              >
                <option value="">
                  {regionId
                    ? "Select area"
                    : "Select region first"}
                </option>

                {areas.map((area) => (
                  <option
                    key={area.id}
                    value={area.id}
                  >
                    {area.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div style={styles.fullWidth}>
            <label style={styles.label}>
              Description
            </label>

            <textarea
              value={description}
              onChange={(e) =>
                setDescription(e.target.value)
              }
              placeholder="Write the description shown to visitors..."
              style={styles.textarea}
            />
          </div>

          <div style={styles.fullWidth}>
            <label style={styles.label}>
              Editor Note
            </label>

            <textarea
              value={editorNote}
              onChange={(e) =>
                setEditorNote(e.target.value)
              }
              placeholder="Private editorial notes..."
              style={styles.textarea}
            />
          </div>
        </section>

        {/* LOCATION */}

        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>
            Location
          </h2>

          <div style={styles.grid}>
            <div>
              <label style={styles.label}>
                Postal Code
              </label>

              <input
                value={postalCode}
                onChange={(e) =>
                  setPostalCode(e.target.value)
                }
                placeholder="e.g. 111-0032"
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
                placeholder="https://..."
                style={styles.input}
              />
            </div>

            <div style={styles.fullWidth}>
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

        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>
            Access
          </h2>

          <div style={styles.grid}>
            <div>
              <label style={styles.label}>
                Nearest Station
              </label>

              <select
                value={stationId}
                onChange={(e) =>
                  setStationId(e.target.value)
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
            </div>

            <div>
              <label style={styles.label}>
                Station Exit
              </label>

              <input
                value={stationExit}
                onChange={(e) =>
                  setStationExit(e.target.value)
                }
                placeholder="e.g. Exit A1"
                style={styles.input}
              />
            </div>

            <div>
              <label style={styles.label}>
                Walk Minutes
              </label>

              <input
                type="number"
                min="0"
                value={walkMinutes}
                onChange={(e) =>
                  setWalkMinutes(e.target.value)
                }
                placeholder="e.g. 5"
                style={styles.input}
              />
            </div>
          </div>
        </section>

        {/* CONTACT */}

        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>
            Contact & Website
          </h2>

          <div style={styles.grid}>
            <div>
              <label style={styles.label}>
                Phone
              </label>

              <input
                value={phone}
                onChange={(e) =>
                  setPhone(e.target.value)
                }
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
                placeholder="https://..."
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
                placeholder="https://instagram.com/..."
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
                placeholder="https://..."
                style={styles.input}
              />
            </div>
          </div>
        </section>

        {/* STORE INFORMATION */}

        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>
            Store Information
          </h2>

          <div style={styles.grid}>
            <div>
              <label style={styles.label}>
                Price Range
              </label>

              <input
                value={priceRange}
                onChange={(e) =>
                  setPriceRange(e.target.value)
                }
                placeholder="e.g. ¥1,000–¥2,000"
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
                placeholder="e.g. Recommended"
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
                placeholder="e.g. English menu available"
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
                placeholder="e.g. 10:00–20:00"
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
                placeholder="e.g. Monday"
                style={styles.input}
              />
            </div>
          </div>

          <div style={styles.grid}>
            <div>
              <label style={styles.label}>
                Total Seats
              </label>

              <input
                type="number"
                value={seats}
                onChange={(e) =>
                  setSeats(e.target.value)
                }
                style={styles.input}
              />
            </div>

            <div>
              <label style={styles.label}>
                Counter Seats
              </label>

              <input
                type="number"
                value={counterSeats}
                onChange={(e) =>
                  setCounterSeats(e.target.value)
                }
                style={styles.input}
              />
            </div>

            <div>
              <label style={styles.label}>
                Table Seats
              </label>

              <input
                type="number"
                value={tableSeats}
                onChange={(e) =>
                  setTableSeats(e.target.value)
                }
                style={styles.input}
              />
            </div>
          </div>

          <div style={styles.checkboxRow}>
            <label style={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={card}
                onChange={(e) =>
                  setCard(e.target.checked)
                }
              />
              Credit Cards Accepted
            </label>

            <label style={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={taxFree}
                onChange={(e) =>
                  setTaxFree(e.target.checked)
                }
              />
              Tax Free Available
            </label>
          </div>
        </section>

        {/* IMAGE */}

        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>
            Image
          </h2>

          <label style={styles.label}>
            Image URL
          </label>

          <input
            value={imageUrl}
            onChange={(e) =>
              setImageUrl(e.target.value)
            }
            placeholder="https://..."
            style={styles.input}
          />
        </section>

        {/* STATUS */}

        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>
            Publishing
          </h2>

          <label style={styles.label}>
            Status
          </label>

          <select
            value={status}
            onChange={(e) =>
              setStatus(e.target.value)
            }
            style={styles.input}
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
        </section>

        <div style={styles.bottomActions}>
          <Link
            href="/admin/places"
            style={styles.cancelButton}
          >
            Cancel
          </Link>

          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            style={{
              ...styles.saveButton,
              opacity: saving ? 0.6 : 1,
            }}
          >
            {saving ? "Saving..." : "Save Place"}
          </button>
        </div>
      </div>
    </main>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "#fafafa",
    padding: "40px 24px 100px",
  },

  container: {
    maxWidth: "1000px",
    margin: "0 auto",
  },

  top: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "20px",
    marginBottom: "30px",
  },

  backLink: {
    color: "#666",
    textDecoration: "none",
    fontSize: "14px",
  },

  title: {
    margin: "15px 0 8px",
    fontSize: "34px",
  },

  subtitle: {
    margin: 0,
    color: "#666",
  },

  section: {
    background: "#fff",
    border: "1px solid #ddd",
    borderRadius: "14px",
    padding: "28px",
    marginBottom: "20px",
  },

  sectionTitle: {
    margin: "0 0 24px",
    fontSize: "22px",
  },

  grid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "20px",
    marginBottom: "20px",
  },

  fullWidth: {
    gridColumn: "1 / -1",
    marginBottom: "20px",
  },

  label: {
    display: "block",
    marginBottom: "8px",
    fontWeight: 600,
    fontSize: "14px",
  },

  input: {
    width: "100%",
    height: "46px",
    padding: "0 13px",
    border: "1px solid #bbb",
    borderRadius: "8px",
    background: "#fff",
    color: "#222",
    fontSize: "15px",
    boxSizing: "border-box" as const,
  },

  textarea: {
    width: "100%",
    minHeight: "120px",
    padding: "13px",
    border: "1px solid #bbb",
    borderRadius: "8px",
    background: "#fff",
    color: "#222",
    fontSize: "15px",
    boxSizing: "border-box" as const,
    resize: "vertical" as const,
  },

  checkboxRow: {
    display: "flex",
    gap: "30px",
    flexWrap: "wrap" as const,
    marginTop: "20px",
  },

  checkboxLabel: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    fontSize: "14px",
  },

  bottomActions: {
    display: "flex",
    justifyContent: "flex-end",
    gap: "12px",
    marginTop: "30px",
  },

  saveButton: {
    border: "none",
    background: "#222",
    color: "#fff",
    padding: "13px 22px",
    borderRadius: "8px",
    fontSize: "15px",
    cursor: "pointer",
  },

  cancelButton: {
    border: "1px solid #ccc",
    background: "#fff",
    color: "#333",
    padding: "13px 22px",
    borderRadius: "8px",
    fontSize: "15px",
    textDecoration: "none",
  },

  error: {
    background: "#fff0f0",
    border: "1px solid #e4aaaa",
    color: "#a33",
    padding: "15px",
    borderRadius: "10px",
    marginBottom: "20px",
  },
};