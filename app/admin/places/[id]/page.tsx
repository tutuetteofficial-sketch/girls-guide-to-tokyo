"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

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
  name: string;
  region_id: number;
};

type Station = {
  id: number;
  name: string;
};

type AccessRow = {
  id?: number;
  station_id: string;
  station_exit: string;
  walk_minutes: string;
};

export default function EditPlacePage() {
  const params = useParams();
  const router = useRouter();

  const placeId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

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

  const [status, setStatus] = useState("draft");

  const [selectedStations, setSelectedStations] = useState<AccessRow[]>([]);

  useEffect(() => {
    if (placeId) {
      loadData();
    }
  }, [placeId]);

  async function loadData() {
    setLoading(true);

    const [
      placeResult,
      placeTypeResult,
      regionResult,
      areaResult,
      stationResult,
      accessResult,
    ] = await Promise.all([
      supabase
        .from("places")
        .select("*")
        .eq("id", placeId)
        .single(),

      supabase
        .from("place_types")
        .select("id, name")
        .eq("is_active", true)
        .order("sort_order"),

      supabase
        .from("regions")
        .select("id, name")
        .eq("is_active", true)
        .order("sort_order"),

      supabase
        .from("areas")
        .select("id, name, region_id")
        .eq("is_active", true)
        .order("sort_order"),

      supabase
        .from("stations")
        .select("id, name")
        .eq("is_active", true)
        .order("name"),

      supabase
        .from("place_access")
        .select("id, station_id, station_exit, walk_minutes, sort_order")
        .eq("place_id", placeId)
        .order("sort_order"),
    ]);

    if (placeResult.error) {
      alert(placeResult.error.message);
      router.push("/admin/places");
      return;
    }

    const place = placeResult.data;

    setPlaceTypes(placeTypeResult.data || []);
    setRegions(regionResult.data || []);
    setAreas(areaResult.data || []);
    setStations(stationResult.data || []);

    setName(place.name || "");
    setPlaceTypeId(place.place_type_id ? String(place.place_type_id) : "");
    setRegionId(place.region_id ? String(place.region_id) : "");
    setAreaId(place.area_id ? String(place.area_id) : "");

    setDescription(place.description || "");
    setEditorNote(place.editor_note || "");

    setPostalCode(place.postal_code || "");
    setAddress(place.address || "");

    setPhone(place.phone || "");

    setPriceRange(place.price_range || "");

    setSeats(place.seats !== null ? String(place.seats) : "");
    setCounterSeats(
      place.counter_seats !== null ? String(place.counter_seats) : ""
    );
    setTableSeats(
      place.table_seats !== null ? String(place.table_seats) : ""
    );

    setReservation(place.reservation || "");
    setEnglishSupport(place.english_support || "");

    setCard(place.card || false);
    setTaxFree(place.tax_free || false);

    setOpeningHours(place.opening_hours || "");
    setClosedDays(place.closed_days || "");

    setOfficialUrl(place.official_url || "");
    setInstagramUrl(place.instagram_url || "");
    setTabelogUrl(place.tabelog_url || "");
    setGoogleMapsUrl(place.google_maps_url || "");

    setImageUrl(place.image_url || "");

    setStatus(place.status || "draft");

    if (!accessResult.error) {
      setSelectedStations(
        (accessResult.data || []).map((access) => ({
          id: access.id,
          station_id: access.station_id
            ? String(access.station_id)
            : "",
          station_exit: access.station_exit || "",
          walk_minutes:
            access.walk_minutes !== null
              ? String(access.walk_minutes)
              : "",
        }))
      );
    }

    setLoading(false);
  }

  const filteredAreas = regionId
    ? areas.filter((area) => area.region_id === Number(regionId))
    : [];

  function addStation() {
    setSelectedStations([
      ...selectedStations,
      {
        station_id: "",
        station_exit: "",
        walk_minutes: "",
      },
    ]);
  }

  function updateStation(
    index: number,
    field: keyof Omit<AccessRow, "id">,
    value: string
  ) {
    const updated = [...selectedStations];

    updated[index] = {
      ...updated[index],
      [field]: value,
    };

    setSelectedStations(updated);
  }

  function removeStation(index: number) {
    setSelectedStations(
      selectedStations.filter((_, i) => i !== index)
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!name.trim()) {
      alert("Place name is required.");
      return;
    }

    setSaving(true);

    const { error: placeError } = await supabase
      .from("places")
      .update({
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

        updated_at: new Date().toISOString(),
      })
      .eq("id", placeId);

    if (placeError) {
      alert(placeError.message);
      setSaving(false);
      return;
    }

    const { error: deleteAccessError } = await supabase
      .from("place_access")
      .delete()
      .eq("place_id", placeId);

    if (deleteAccessError) {
      alert(deleteAccessError.message);
      setSaving(false);
      return;
    }

    const accessRows = selectedStations
      .filter((station) => station.station_id)
      .map((station, index) => ({
        place_id: placeId,
        station_id: Number(station.station_id),
        station_exit: station.station_exit || null,
        walk_minutes: station.walk_minutes
          ? Number(station.walk_minutes)
          : null,
        sort_order: index,
      }));

    if (accessRows.length > 0) {
      const { error: accessError } = await supabase
        .from("place_access")
        .insert(accessRows);

      if (accessError) {
        alert(accessError.message);
        setSaving(false);
        return;
      }
    }

    setSaving(false);

    alert("Saved successfully.");
    router.push("/admin/places");
    router.refresh();
  }

  async function handleDelete() {
    const confirmed = window.confirm(
      "Delete this place? This cannot be undone."
    );

    if (!confirmed) return;

    setDeleting(true);

    const { error } = await supabase
      .from("places")
      .delete()
      .eq("id", placeId);

    if (error) {
      alert(error.message);
      setDeleting(false);
      return;
    }

    router.push("/admin/places");
    router.refresh();
  }

  if (loading) {
    return (
      <main style={{ padding: "40px" }}>
        Loading...
      </main>
    );
  }

  return (
    <main
      style={{
        maxWidth: "900px",
        margin: "0 auto",
        padding: "40px 24px 80px",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "20px",
          marginBottom: "32px",
        }}
      >
        <div>
          <button
            type="button"
            onClick={() => router.push("/admin/places")}
            style={{
              border: "none",
              background: "transparent",
              padding: 0,
              cursor: "pointer",
              color: "#666",
              marginBottom: "12px",
            }}
          >
            ← Back to Places
          </button>

          <h1 style={{ margin: 0 }}>
            Edit Place
          </h1>
        </div>

        <button
          type="button"
          onClick={handleDelete}
          disabled={deleting}
          style={{
            padding: "10px 16px",
            border: "1px solid #d33",
            background: "#fff",
            color: "#d33",
            borderRadius: "8px",
            cursor: "pointer",
          }}
        >
          {deleting ? "Deleting..." : "Delete"}
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        <Section title="Basic Information">
          <Field label="Place Name *">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </Field>

          <Field label="Type">
            <select
              value={placeTypeId}
              onChange={(e) => setPlaceTypeId(e.target.value)}
            >
              <option value="">Select type</option>

              {placeTypes.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.name}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Region">
            <select
              value={regionId}
              onChange={(e) => {
                setRegionId(e.target.value);
                setAreaId("");
              }}
            >
              <option value="">Select region</option>

              {regions.map((region) => (
                <option key={region.id} value={region.id}>
                  {region.name}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Area">
            <select
              value={areaId}
              onChange={(e) => setAreaId(e.target.value)}
              disabled={!regionId}
            >
              <option value="">Select area</option>

              {filteredAreas.map((area) => (
                <option key={area.id} value={area.id}>
                  {area.name}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Description">
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={5}
            />
          </Field>

          <Field label="Editor Note">
            <textarea
              value={editorNote}
              onChange={(e) => setEditorNote(e.target.value)}
              rows={4}
            />
          </Field>
        </Section>

        <Section title="Location">
          <Field label="Postal Code">
            <input
              value={postalCode}
              onChange={(e) => setPostalCode(e.target.value)}
            />
          </Field>

          <Field label="Address">
            <input
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
          </Field>

          <Field label="Google Maps URL">
            <input
              type="url"
              value={googleMapsUrl}
              onChange={(e) => setGoogleMapsUrl(e.target.value)}
            />
          </Field>
        </Section>

        <Section title="Access / Nearest Station">
          {selectedStations.map((station, index) => (
            <div
              key={index}
              style={{
                border: "1px solid #ddd",
                padding: "16px",
                borderRadius: "8px",
                marginBottom: "12px",
              }}
            >
              <Field label="Station">
                <select
                  value={station.station_id}
                  onChange={(e) =>
                    updateStation(
                      index,
                      "station_id",
                      e.target.value
                    )
                  }
                >
                  <option value="">Select station</option>

                  {stations.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Exit">
                <input
                  value={station.station_exit}
                  onChange={(e) =>
                    updateStation(
                      index,
                      "station_exit",
                      e.target.value
                    )
                  }
                />
              </Field>

              <Field label="Walk Minutes">
                <input
                  type="number"
                  min="0"
                  value={station.walk_minutes}
                  onChange={(e) =>
                    updateStation(
                      index,
                      "walk_minutes",
                      e.target.value
                    )
                  }
                />
              </Field>

              <button
                type="button"
                onClick={() => removeStation(index)}
              >
                Remove Station
              </button>
            </div>
          ))}

          <button
            type="button"
            onClick={addStation}
          >
            + Add Station
          </button>
        </Section>

        <Section title="Contact">
          <Field label="Phone">
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </Field>

          <Field label="Official Website">
            <input
              type="url"
              value={officialUrl}
              onChange={(e) => setOfficialUrl(e.target.value)}
            />
          </Field>

          <Field label="Instagram">
            <input
              type="url"
              value={instagramUrl}
              onChange={(e) => setInstagramUrl(e.target.value)}
            />
          </Field>

          <Field label="Tabelog">
            <input
              type="url"
              value={tabelogUrl}
              onChange={(e) => setTabelogUrl(e.target.value)}
            />
          </Field>
        </Section>

        <Section title="Business Information">
          <Field label="Price Range">
            <input
              value={priceRange}
              onChange={(e) => setPriceRange(e.target.value)}
            />
          </Field>

          <Field label="Seats">
            <input
              type="number"
              min="0"
              value={seats}
              onChange={(e) => setSeats(e.target.value)}
            />
          </Field>

          <Field label="Counter Seats">
            <input
              type="number"
              min="0"
              value={counterSeats}
              onChange={(e) => setCounterSeats(e.target.value)}
            />
          </Field>

          <Field label="Table Seats">
            <input
              type="number"
              min="0"
              value={tableSeats}
              onChange={(e) => setTableSeats(e.target.value)}
            />
          </Field>

          <Field label="Reservation">
            <input
              value={reservation}
              onChange={(e) => setReservation(e.target.value)}
            />
          </Field>

          <Field label="English Support">
            <input
              value={englishSupport}
              onChange={(e) => setEnglishSupport(e.target.value)}
            />
          </Field>

          <label
            style={{
              display: "flex",
              gap: "8px",
              marginTop: "16px",
            }}
          >
            <input
              type="checkbox"
              checked={card}
              onChange={(e) => setCard(e.target.checked)}
            />
            Credit Cards Accepted
          </label>

          <label
            style={{
              display: "flex",
              gap: "8px",
              marginTop: "12px",
            }}
          >
            <input
              type="checkbox"
              checked={taxFree}
              onChange={(e) => setTaxFree(e.target.checked)}
            />
            Tax Free
          </label>
        </Section>

        <Section title="Opening Hours">
          <Field label="Opening Hours">
            <textarea
              value={openingHours}
              onChange={(e) => setOpeningHours(e.target.value)}
              rows={4}
            />
          </Field>

          <Field label="Closed Days">
            <input
              value={closedDays}
              onChange={(e) => setClosedDays(e.target.value)}
            />
          </Field>
        </Section>

        <Section title="Image">
          <Field label="Image URL">
            <input
              type="url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
            />
          </Field>

          {imageUrl && (
            <img
              src={imageUrl}
              alt={name}
              style={{
                width: "100%",
                maxWidth: "400px",
                marginTop: "12px",
                borderRadius: "8px",
              }}
            />
          )}
        </Section>

        <Section title="Status">
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="hidden">Hidden</option>
            <option value="archived">Archived</option>
          </select>
        </Section>

        <button
          type="submit"
          disabled={saving}
          style={{
            width: "100%",
            padding: "16px",
            background: "#111",
            color: "#fff",
            border: "none",
            borderRadius: "8px",
            fontSize: "16px",
            cursor: "pointer",
            marginTop: "20px",
          }}
        >
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </form>
    </main>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section
      style={{
        marginBottom: "32px",
        padding: "24px",
        border: "1px solid #e5e5e5",
        borderRadius: "12px",
      }}
    >
      <h2
        style={{
          marginTop: 0,
          fontSize: "20px",
        }}
      >
        {title}
      </h2>

      {children}
    </section>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{ marginBottom: "18px" }}>
      <label
        style={{
          display: "block",
          marginBottom: "7px",
          fontWeight: 600,
        }}
      >
        {label}
      </label>

      <div style={{ width: "100%" }}>
        {children}
      </div>
    </div>
  );
}