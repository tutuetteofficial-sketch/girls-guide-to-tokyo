"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

type PlaceType = {
  id: number;
  name: string;
};

type Area = {
  id: number;
  name: string;
};

type PlaceStatus =
  | "draft"
  | "published"
  | "hidden"
  | "archived";

type PlaceRow = {
  id: string;
  name: string;
  place_type_id: string;
  area_id: string;
  area_name: string;
  address: string;
  status: PlaceStatus;
  isNew?: boolean;
  isDirty?: boolean;
};

const STATUS_OPTIONS: PlaceStatus[] = [
  "draft",
  "published",
  "hidden",
  "archived",
];

export default function PlacesPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const [siteId, setSiteId] = useState("");

  const [placeTypes, setPlaceTypes] = useState<PlaceType[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const [places, setPlaces] = useState<PlaceRow[]>([]);

  const [activeTypeId, setActiveTypeId] = useState<string>("all");
  const [search, setSearch] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    setErrorMessage("");

    try {
      const { data: site, error: siteError } = await supabase
        .from("sites")
        .select("id")
        .eq("slug", "tokyo-guide")
        .single();

      if (siteError || !site) {
        throw new Error(
          siteError?.message || "TOKYO GUIDE site could not be found."
        );
      }

      setSiteId(site.id);

      const [typesResult, areasResult, placesResult] =
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
            .from("places")
            .select(`
              id,
              name,
              place_type_id,
              area_id,
              address,
              status,
              areas (
                name
              )
            `)
            .eq("site_id", site.id)
            .order("created_at", { ascending: false }),
        ]);

      const firstError =
        typesResult.error ||
        areasResult.error ||
        placesResult.error;

      if (firstError) {
        throw new Error(firstError.message);
      }

      const loadedTypes = typesResult.data ?? [];
      const loadedAreas = areasResult.data ?? [];

      setPlaceTypes(loadedTypes);
      setAreas(loadedAreas);

      const formattedPlaces: PlaceRow[] = (
        placesResult.data ?? []
      ).map((place: any) => {
        const areaRelation = Array.isArray(place.areas)
          ? place.areas[0]
          : place.areas;

        return {
          id: place.id,
          name: place.name ?? "",
          place_type_id: place.place_type_id
            ? String(place.place_type_id)
            : "",
          area_id: place.area_id
            ? String(place.area_id)
            : "",
          area_name: areaRelation?.name ?? "",
          address: place.address ?? "",
          status: place.status ?? "draft",
          isNew: false,
          isDirty: false,
        };
      });

      setPlaces(formattedPlaces);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Failed to load places."
      );
    } finally {
      setLoading(false);
    }
  }

  const filteredPlaces = useMemo(() => {
    return places.filter((place) => {
      const matchesType =
        activeTypeId === "all" ||
        place.place_type_id === activeTypeId;

      const keyword = search.toLowerCase().trim();

      const matchesSearch =
        !keyword ||
        place.name.toLowerCase().includes(keyword) ||
        place.area_name.toLowerCase().includes(keyword) ||
        place.address.toLowerCase().includes(keyword);

      return matchesType && matchesSearch;
    });
  }, [places, activeTypeId, search]);

  function updatePlace(
    id: string,
    field: keyof PlaceRow,
    value: string
  ) {
    setPlaces((current) =>
      current.map((place) => {
        if (place.id !== id) return place;

        const updated: PlaceRow = {
          ...place,
          [field]: value,
          isDirty: true,
        };

        if (field === "area_name") {
          const matchingArea = areas.find(
            (area) =>
              area.name.toLowerCase() ===
              value.trim().toLowerCase()
          );

          updated.area_id = matchingArea
            ? String(matchingArea.id)
            : "";
        }

        return updated;
      })
    );

    setMessage("");
    setErrorMessage("");
  }

  function addNewRow() {
    const temporaryId = `new-${Date.now()}`;

    const defaultTypeId =
      activeTypeId !== "all" ? activeTypeId : "";

    const newRow: PlaceRow = {
      id: temporaryId,
      name: "",
      place_type_id: defaultTypeId,
      area_id: "",
      area_name: "",
      address: "",
      status: "draft",
      isNew: true,
      isDirty: true,
    };

    setPlaces((current) => [newRow, ...current]);
    setMessage("");
    setErrorMessage("");
  }

  async function getOrCreateArea(
    areaName: string,
    currentSiteId: string
  ): Promise<number | null> {
    const trimmedName = areaName.trim();

    if (!trimmedName) {
      return null;
    }

    const existingArea = areas.find(
      (area) =>
        area.name.toLowerCase() ===
        trimmedName.toLowerCase()
    );

    if (existingArea) {
      return existingArea.id;
    }

    const { data, error } = await supabase
      .from("areas")
      .insert({
        site_id: currentSiteId,
        name: trimmedName,
        slug: createSlug(trimmedName),
        is_active: true,
      })
      .select("id, name")
      .single();

    if (error || !data) {
      throw new Error(
        error?.message || `Failed to create area "${trimmedName}".`
      );
    }

    setAreas((current) => [
      ...current,
      {
        id: data.id,
        name: data.name,
      },
    ]);

    return data.id;
  }

  async function saveChanges() {
    setSaving(true);
    setMessage("");
    setErrorMessage("");

    try {
      if (!siteId) {
        throw new Error("Site information could not be loaded.");
      }

      const changedPlaces = places.filter(
        (place) => place.isDirty || place.isNew
      );

      if (changedPlaces.length === 0) {
        setMessage("No changes to save.");
        setSaving(false);
        return;
      }

      const savedIdMap = new Map<string, string>();

      for (const place of changedPlaces) {
        if (!place.name.trim()) {
          throw new Error(
            "Every new row needs a Place Name before saving."
          );
        }

        const areaId = await getOrCreateArea(
          place.area_name,
          siteId
        );

        const payload = {
          site_id: siteId,
          name: place.name.trim(),
          place_type_id: place.place_type_id
            ? Number(place.place_type_id)
            : null,
          area_id: areaId,
          address: place.address.trim() || null,
          status: place.status,
        };

        if (place.isNew) {
          const { data, error } = await supabase
            .from("places")
            .insert(payload)
            .select("id")
            .single();

          if (error || !data) {
            throw new Error(
              error?.message ||
                `Failed to create "${place.name}".`
            );
          }

          savedIdMap.set(place.id, data.id);
        } else {
          const { error } = await supabase
            .from("places")
            .update(payload)
            .eq("id", place.id);

          if (error) {
            throw new Error(
              `Failed to update "${place.name}": ${error.message}`
            );
          }
        }
      }

      setPlaces((current) =>
        current.map((place) => {
          const newId = savedIdMap.get(place.id);

          return {
            ...place,
            id: newId ?? place.id,
            isNew: false,
            isDirty: false,
          };
        })
      );

      setMessage(
        `${changedPlaces.length} place${
          changedPlaces.length === 1 ? "" : "s"
        } saved successfully ✦`
      );
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Failed to save changes."
      );
    } finally {
      setSaving(false);
    }
  }

  async function deleteNewRow(id: string) {
    setPlaces((current) =>
      current.filter((place) => place.id !== id)
    );
  }

  function createSlug(value: string) {
    return value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");
  }

  if (loading) {
    return (
      <main style={styles.page}>
        <div style={styles.loading}>
          Loading your database...
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
            <p style={styles.eyebrow}>
              TOKYO GUIDE ADMIN
            </p>

            <h1 style={styles.title}>
              Places Database ✦
            </h1>

            <p style={styles.subtitle}>
              Your Tokyo address book — add and edit places directly here.
            </p>
          </div>

          <div style={styles.headerButtons}>
            <Link
              href="/admin/places/new"
              style={styles.detailButton}
            >
              ＋ Detailed Entry
            </Link>

            <button
              onClick={saveChanges}
              disabled={saving}
              style={styles.saveButton}
            >
              {saving ? "Saving..." : "Save Changes ✦"}
            </button>
          </div>
        </div>

        {/* MESSAGE */}

        {errorMessage && (
          <div style={styles.errorMessage}>
            {errorMessage}
          </div>
        )}

        {message && (
          <div style={styles.successMessage}>
            {message}
          </div>
        )}

        {/* TYPE TABS */}

        <div style={styles.tabs}>
          <button
            onClick={() => setActiveTypeId("all")}
            style={{
              ...styles.tab,
              ...(activeTypeId === "all"
                ? styles.activeTab
                : {}),
            }}
          >
            All Places
          </button>

          {placeTypes.map((type) => (
            <button
              key={type.id}
              onClick={() =>
                setActiveTypeId(String(type.id))
              }
              style={{
                ...styles.tab,
                ...(activeTypeId === String(type.id)
                  ? styles.activeTab
                  : {}),
              }}
            >
              {type.name}
            </button>
          ))}
        </div>

        {/* TOOLBAR */}

        <div style={styles.toolbar}>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="⌕ Search places..."
            style={styles.search}
          />

          <div style={styles.toolbarRight}>
            <span style={styles.count}>
              {filteredPlaces.length} places
            </span>

            <button
              onClick={addNewRow}
              style={styles.addButton}
            >
              ＋ Add Row
            </button>
          </div>
        </div>

        {/* DATABASE */}

        <div style={styles.databaseCard}>
          <div style={styles.tableWrapper}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Place Name</th>
                  <th style={styles.th}>Type</th>
                  <th style={styles.th}>Area</th>
                  <th style={styles.th}>Address</th>
                  <th style={styles.th}>Status</th>
                  <th style={styles.thAction}>Details</th>
                </tr>
              </thead>

              <tbody>
                {filteredPlaces.map((place) => (
                  <tr
                    key={place.id}
                    style={
                      place.isNew
                        ? styles.newRow
                        : place.isDirty
                        ? styles.dirtyRow
                        : {}
                    }
                  >
                    {/* NAME */}

                    <td style={styles.td}>
                      <input
                        value={place.name}
                        onChange={(e) =>
                          updatePlace(
                            place.id,
                            "name",
                            e.target.value
                          )
                        }
                        placeholder="Place name"
                        style={styles.cellInput}
                      />
                    </td>

                    {/* TYPE */}

                    <td style={styles.td}>
                      <select
                        value={place.place_type_id}
                        onChange={(e) =>
                          updatePlace(
                            place.id,
                            "place_type_id",
                            e.target.value
                          )
                        }
                        style={styles.cellSelect}
                      >
                        <option value="">—</option>

                        {placeTypes.map((type) => (
                          <option
                            key={type.id}
                            value={type.id}
                          >
                            {type.name}
                          </option>
                        ))}
                      </select>
                    </td>

                    {/* AREA */}

                    <td style={styles.td}>
                      <input
                        list={`area-options-${place.id}`}
                        value={place.area_name}
                        onChange={(e) =>
                          updatePlace(
                            place.id,
                            "area_name",
                            e.target.value
                          )
                        }
                        placeholder="Type area..."
                        style={styles.cellInput}
                      />

                      <datalist
                        id={`area-options-${place.id}`}
                      >
                        {areas.map((area) => (
                          <option
                            key={area.id}
                            value={area.name}
                          />
                        ))}
                      </datalist>
                    </td>

                    {/* ADDRESS */}

                    <td style={styles.td}>
                      <input
                        value={place.address}
                        onChange={(e) =>
                          updatePlace(
                            place.id,
                            "address",
                            e.target.value
                          )
                        }
                        placeholder="Address"
                        style={styles.cellInput}
                      />
                    </td>

                    {/* STATUS */}

                    <td style={styles.td}>
                      <select
                        value={place.status}
                        onChange={(e) =>
                          updatePlace(
                            place.id,
                            "status",
                            e.target.value
                          )
                        }
                        style={styles.statusSelect}
                      >
                        {STATUS_OPTIONS.map((status) => (
                          <option
                            key={status}
                            value={status}
                          >
                            {status}
                          </option>
                        ))}
                      </select>
                    </td>

                    {/* DETAILS */}

                    <td style={styles.tdAction}>
                      {place.isNew ? (
                        <button
                          onClick={() =>
                            deleteNewRow(place.id)
                          }
                          style={styles.removeButton}
                        >
                          ×
                        </button>
                      ) : (
                        <Link
                          href={`/admin/places/${place.id}`}
                          style={styles.editButton}
                        >
                          Edit →
                        </Link>
                      )}
                    </td>
                  </tr>
                ))}

                {filteredPlaces.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      style={styles.empty}
                    >
                      No places here yet ✦
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <button
            onClick={addNewRow}
            style={styles.bottomAddButton}
          >
            ＋ Add a new place
          </button>
        </div>

        {/* FOOTER SAVE */}

        <div style={styles.footer}>
          <span style={styles.footerText}>
            Changes are highlighted until saved.
          </span>

          <button
            onClick={saveChanges}
            disabled={saving}
            style={styles.saveButton}
          >
            {saving ? "Saving..." : "Save Changes ✦"}
          </button>
        </div>
      </div>
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    padding: "40px 24px 100px",
    background:
      "linear-gradient(135deg, #fff8fb 0%, #f8f5ff 50%, #fffaf5 100%)",
    color: "#463c46",
  },

  container: {
    maxWidth: "1500px",
    margin: "0 auto",
  },

  loading: {
    padding: "120px 20px",
    textAlign: "center",
    color: "#967c8d",
    fontSize: "16px",
  },

  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-end",
    gap: "24px",
    marginBottom: "28px",
  },

  eyebrow: {
    margin: "0 0 8px",
    color: "#b2819c",
    fontSize: "11px",
    fontWeight: 800,
    letterSpacing: "0.14em",
  },

  title: {
    margin: 0,
    fontSize: "38px",
    letterSpacing: "-1.5px",
  },

  subtitle: {
    margin: "10px 0 0",
    color: "#9a8491",
    fontSize: "14px",
  },

  headerButtons: {
    display: "flex",
    gap: "10px",
    alignItems: "center",
    flexWrap: "wrap",
  },

  detailButton: {
    textDecoration: "none",
    padding: "13px 18px",
    borderRadius: "14px",
    background: "#fff",
    border: "1px solid #eadbe4",
    color: "#806878",
    fontSize: "14px",
    fontWeight: 700,
  },

  saveButton: {
    border: "none",
    padding: "14px 20px",
    borderRadius: "14px",
    background:
      "linear-gradient(135deg, #e99bb9, #c69ae1)",
    color: "#fff",
    fontWeight: 800,
    cursor: "pointer",
    fontSize: "14px",
    boxShadow: "0 8px 20px rgba(202,143,177,0.25)",
  },

  tabs: {
    display: "flex",
    gap: "8px",
    flexWrap: "wrap",
    marginBottom: "18px",
  },

  tab: {
    border: "1px solid #eadce5",
    background: "rgba(255,255,255,0.7)",
    color: "#806c78",
    padding: "10px 17px",
    borderRadius: "999px",
    cursor: "pointer",
    fontWeight: 700,
    fontSize: "13px",
  },

  activeTab: {
    background: "#f7dbe7",
    border: "1px solid #e9b7cc",
    color: "#87546d",
  },

  toolbar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "16px",
    marginBottom: "14px",
  },

  toolbarRight: {
    display: "flex",
    alignItems: "center",
    gap: "14px",
  },

  search: {
    width: "320px",
    maxWidth: "100%",
    height: "46px",
    padding: "0 15px",
    borderRadius: "13px",
    border: "1px solid #eadce5",
    background: "#fff",
    outline: "none",
    boxSizing: "border-box",
  },

  count: {
    color: "#a08a97",
    fontSize: "13px",
    whiteSpace: "nowrap",
  },

  addButton: {
    border: "none",
    background: "#fff",
    borderRadius: "13px",
    padding: "12px 17px",
    color: "#a05d7e",
    fontWeight: 800,
    cursor: "pointer",
    borderColor: "#efcfdd",
    boxShadow: "0 3px 12px rgba(170,120,145,0.08)",
  },

  databaseCard: {
    background: "rgba(255,255,255,0.88)",
    border: "1px solid #eedfe7",
    borderRadius: "22px",
    overflow: "hidden",
    boxShadow: "0 12px 40px rgba(169,119,145,0.08)",
  },

  tableWrapper: {
    width: "100%",
    overflowX: "auto",
  },

  table: {
    width: "100%",
    minWidth: "900px",
    borderCollapse: "collapse",
  },

  th: {
    padding: "15px 14px",
    textAlign: "left",
    fontSize: "11px",
    letterSpacing: "0.08em",
    color: "#9a7e8d",
    background: "#fff8fb",
    borderBottom: "1px solid #f0e1e8",
    whiteSpace: "nowrap",
  },

  thAction: {
    padding: "15px 14px",
    textAlign: "center",
    fontSize: "11px",
    letterSpacing: "0.08em",
    color: "#9a7e8d",
    background: "#fff8fb",
    borderBottom: "1px solid #f0e1e8",
  },

  td: {
    padding: "9px 10px",
    borderBottom: "1px solid #f5eaf0",
  },

  tdAction: {
    padding: "9px 12px",
    borderBottom: "1px solid #f5eaf0",
    textAlign: "center",
  },

  cellInput: {
    width: "100%",
    minWidth: "130px",
    height: "40px",
    padding: "0 10px",
    border: "1px solid transparent",
    background: "transparent",
    borderRadius: "9px",
    outline: "none",
    boxSizing: "border-box",
    color: "#4d424a",
  },

  cellSelect: {
    width: "100%",
    minWidth: "130px",
    height: "40px",
    padding: "0 8px",
    border: "1px solid transparent",
    background: "transparent",
    borderRadius: "9px",
    color: "#4d424a",
    cursor: "pointer",
  },

  statusSelect: {
    width: "100%",
    minWidth: "110px",
    height: "38px",
    padding: "0 8px",
    border: "1px solid #eedde6",
    background: "#fff8fb",
    borderRadius: "999px",
    color: "#876576",
    fontSize: "12px",
    fontWeight: 700,
    cursor: "pointer",
  },

  newRow: {
    background: "#fff8ec",
  },

  dirtyRow: {
    background: "#fff9fc",
  },

  editButton: {
    display: "inline-block",
    textDecoration: "none",
    padding: "8px 12px",
    borderRadius: "9px",
    background: "#f8efff",
    color: "#8965a5",
    fontSize: "12px",
    fontWeight: 800,
  },

  removeButton: {
    width: "32px",
    height: "32px",
    borderRadius: "50%",
    border: "none",
    background: "#fff0f2",
    color: "#c47385",
    fontSize: "18px",
    cursor: "pointer",
  },

  empty: {
    padding: "60px 20px",
    textAlign: "center",
    color: "#aa929f",
  },

  bottomAddButton: {
    width: "100%",
    padding: "17px",
    border: "none",
    borderTop: "1px solid #f0e1e8",
    background: "#fffafd",
    color: "#a76686",
    fontWeight: 800,
    cursor: "pointer",
    fontSize: "14px",
  },

  footer: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: "20px",
    gap: "20px",
  },

  footerText: {
    color: "#a38b98",
    fontSize: "12px",
  },

  errorMessage: {
    marginBottom: "18px",
    padding: "15px 18px",
    borderRadius: "14px",
    background: "#fff0f2",
    border: "1px solid #f2c3cc",
    color: "#ad5367",
  },

  successMessage: {
    marginBottom: "18px",
    padding: "15px 18px",
    borderRadius: "14px",
    background: "#f4fff7",
    border: "1px solid #cfe9d7",
    color: "#528567",
  },
};