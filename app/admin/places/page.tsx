"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

type Place = {
  id: string;
  name: string;
  status: string;
  editor_pick: number;
  updated_at: string;
  site_name: string;
  region_name: string | null;
  area_name: string | null;
  brand_name: string | null;
};

type PlaceType = {
  id: number;
  name: string;
};

type PlaceNote = {
  id: string;
  editor_note: string | null;
};

export default function PlacesAdminPage() {
  const [places, setPlaces] =
    useState<Place[]>([]);

  const [placeTypeMap, setPlaceTypeMap] =
    useState<Record<string, string>>({});

  const [editorNoteMap, setEditorNoteMap] =
    useState<Record<string, string>>({});

  const [loading, setLoading] =
    useState(true);

  const [errorMessage, setErrorMessage] =
    useState("");

  const [search, setSearch] =
    useState("");

  const [statusFilter, setStatusFilter] =
    useState("all");

  const [regionFilter, setRegionFilter] =
    useState("all");

  const [placeTypeFilter, setPlaceTypeFilter] =
    useState("all");

  async function loadPlaces() {
    setLoading(true);
    setErrorMessage("");

    const { data, error } =
      await supabase
        .from("admin_places")
        .select("*")
        .order("updated_at", {
          ascending: false,
        });

    if (error) {
      setErrorMessage(error.message);
      setPlaces([]);
      setPlaceTypeMap({});
      setEditorNoteMap({});
      setLoading(false);
      return;
    }

    const loadedPlaces =
      (data ?? []) as Place[];

    setPlaces(loadedPlaces);

    const placeIds =
      loadedPlaces.map(
        (place) => place.id
      );

    if (placeIds.length === 0) {
      setPlaceTypeMap({});
      setEditorNoteMap({});
      setLoading(false);
      return;
    }

    // =====================================
    // Place Type + Editor's note
    // =====================================

    const {
      data: placeDetails,
      error: placeDetailsError,
    } = await supabase
      .from("places")
      .select(
        "id, place_type_id, editor_note"
      )
      .in("id", placeIds);

    if (placeDetailsError) {
      setErrorMessage(
        `Place情報の読み込みに失敗しました: ${placeDetailsError.message}`
      );
    } else {
      const details =
        (placeDetails ??
          []) as (PlaceNote & {
          place_type_id:
            | number
            | null;
        })[];

      const typeIds = [
        ...new Set(
          details
            .map(
              (place) =>
                place.place_type_id
            )
            .filter(
              (
                value
              ): value is number =>
                value !== null
            )
        ),
      ];

      const noteMap: Record<
        string,
        string
      > = {};

      details.forEach(
        (place) => {
          if (
            place.editor_note
              ?.trim()
          ) {
            noteMap[place.id] =
              place.editor_note.trim();
          }
        }
      );

      setEditorNoteMap(noteMap);

      if (
        typeIds.length === 0
      ) {
        setPlaceTypeMap({});
      } else {
        const {
          data: types,
          error: typesError,
        } = await supabase
          .from("place_types")
          .select(
            "id, name"
          )
          .in(
            "id",
            typeIds
          );

        if (typesError) {
          setErrorMessage(
            `Place Typeの読み込みに失敗しました: ${typesError.message}`
          );
        } else {
          const typeMap: Record<
            string,
            string
          > = {};

          (
            (types ??
              []) as PlaceType[]
          ).forEach(
            (type) => {
              typeMap[
                String(type.id)
              ] = type.name;
            }
          );

          const placeMap: Record<
            string,
            string
          > = {};

          details.forEach(
            (place) => {
              if (
                place.place_type_id !==
                null
              ) {
                const typeName =
                  typeMap[
                    String(
                      place.place_type_id
                    )
                  ];

                if (typeName) {
                  placeMap[
                    place.id
                  ] = typeName;
                }
              }
            }
          );

          setPlaceTypeMap(
            placeMap
          );
        }
      }
    }

    setLoading(false);
  }

  useEffect(() => {
    loadPlaces();
  }, []);

  const regions = useMemo(() => {
    const values =
      places
        .map(
          (place) =>
            place.region_name
        )
        .filter(
          (
            value
          ): value is string =>
            Boolean(value)
        );

    return [
      ...new Set(values),
    ].sort();
  }, [places]);

  const placeTypes = useMemo(() => {
    return [
      ...new Set(
        Object.values(
          placeTypeMap
        )
      ),
    ].sort();
  }, [placeTypeMap]);

  const filteredPlaces =
    useMemo(() => {
      const keyword =
        search
          .trim()
          .toLowerCase();

      return places.filter(
        (place) => {
          const placeType =
            placeTypeMap[
              place.id
            ] ?? "";

          const editorNote =
            editorNoteMap[
              place.id
            ] ?? "";

          const matchesSearch =
            !keyword ||
            [
              place.name,
              place.brand_name ??
                "",
              place.region_name ??
                "",
              place.area_name ??
                "",
              placeType,
              editorNote,
            ]
              .join(" ")
              .toLowerCase()
              .includes(
                keyword
              );

          const matchesStatus =
            statusFilter ===
              "all" ||
            place.status ===
              statusFilter;

          const matchesRegion =
            regionFilter ===
              "all" ||
            place.region_name ===
              regionFilter;

          const matchesPlaceType =
            placeTypeFilter ===
              "all" ||
            placeType ===
              placeTypeFilter;

          return (
            matchesSearch &&
            matchesStatus &&
            matchesRegion &&
            matchesPlaceType
          );
        }
      );
    }, [
      places,
      placeTypeMap,
      editorNoteMap,
      search,
      statusFilter,
      regionFilter,
      placeTypeFilter,
    ]);

  return (
    <main style={styles.main}>
      <div style={styles.container}>
        <header style={styles.header}>
          <Link
            href="/admin"
            style={styles.back}
          >
            ← Dashboard
          </Link>

          <div
            style={
              styles.headerRow
            }
          >
            <div>
              <p
                style={
                  styles.eyebrow
                }
              >
                CONTENT / PLACES
              </p>

              <h1
                style={
                  styles.title
                }
              >
                Places
              </h1>

              <p
                style={
                  styles.description
                }
              >
                Restaurant・Café・Shopなどの場所を管理します。
              </p>
            </div>

            <Link
              href="/admin/places/new"
              style={
                styles.addButton
              }
            >
              + Add Place
            </Link>
          </div>
        </header>

        {/* =========================
            Search / Filter
        ========================== */}

        <section
          style={
            styles.filters
          }
        >
          <input
            style={styles.search}
            value={search}
            onChange={(e) =>
              setSearch(
                e.target.value
              )
            }
            placeholder="Search places, types, areas, notes..."
          />

          <select
            style={styles.select}
            value={
              statusFilter
            }
            onChange={(e) =>
              setStatusFilter(
                e.target.value
              )
            }
          >
            <option value="all">
              All statuses
            </option>

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

          <select
            style={styles.select}
            value={
              regionFilter
            }
            onChange={(e) =>
              setRegionFilter(
                e.target.value
              )
            }
          >
            <option value="all">
              All regions
            </option>

            {regions.map(
              (region) => (
                <option
                  key={region}
                  value={region}
                >
                  {region}
                </option>
              )
            )}
          </select>

          <select
            style={styles.select}
            value={
              placeTypeFilter
            }
            onChange={(e) =>
              setPlaceTypeFilter(
                e.target.value
              )
            }
          >
            <option value="all">
              All place types
            </option>

            {placeTypes.map(
              (type) => (
                <option
                  key={type}
                  value={type}
                >
                  {type}
                </option>
              )
            )}
          </select>
        </section>

        <div
          style={
            styles.resultCount
          }
        >
          {loading
            ? "Loading..."
            : `${filteredPlaces.length} places`}
        </div>

        {errorMessage && (
          <div
            style={
              styles.error
            }
          >
            {errorMessage}
          </div>
        )}

        {!loading &&
          !errorMessage && (
            <section
              style={
                styles.table
              }
            >
              <div
                style={
                  styles.tableHeader
                }
              >
                <span>
                  Place
                </span>

                <span>
                  Type
                </span>

                <span>
                  Shop / Chain
                </span>

                <span>
                  Region / Area
                </span>

                <span>
                  Editor's note
                </span>

                <span>
                  Status
                </span>

                <span>
                  Updated
                </span>
              </div>

              {filteredPlaces.length ===
              0 ? (
                <div
                  style={
                    styles.empty
                  }
                >
                  <p>
                    該当するPlaceがありません。
                  </p>

                  <Link
                    href="/admin/places/new"
                    style={
                      styles.emptyLink
                    }
                  >
                    + Add Place
                  </Link>
                </div>
              ) : (
                filteredPlaces.map(
                  (place) => {
                    const placeType =
                      placeTypeMap[
                        place.id
                      ] ?? "—";

                    const editorNote =
                      editorNoteMap[
                        place.id
                      ] ?? "";

                    return (
                      <Link
                        key={
                          place.id
                        }
                        href={`/admin/places/${place.id}`}
                        style={
                          styles.row
                        }
                      >
                        <div
                          style={
                            styles.placeCell
                          }
                        >
                          <strong>
                            {
                              place.name
                            }
                          </strong>
                        </div>

                        <span
                          style={
                            styles.typeCell
                          }
                        >
                          {placeType}
                        </span>

                        <span>
                          {
                            place.brand_name ??
                            "—"
                          }
                        </span>

                        <span>
                          {
                            place.region_name ??
                            "—"
                          }

                          {place.area_name
                            ? ` / ${place.area_name}`
                            : ""}
                        </span>

                        <span
                          style={
                            styles.noteCell
                          }
                        >
                          {editorNote
                            ? editorNote
                            : "—"}
                        </span>

                        <StatusBadge
                          status={
                            place.status
                          }
                        />

                        <span
                          style={
                            styles.date
                          }
                        >
                          {formatDate(
                            place.updated_at
                          )}
                        </span>
                      </Link>
                    );
                  }
                )
              )}
            </section>
          )}
      </div>
    </main>
  );
}

function StatusBadge({
  status,
}: {
  status: string;
}) {
  const labels: Record<
    string,
    string
  > = {
    draft: "Draft",
    published: "Published",
    hidden: "Hidden",
    archived: "Archived",
  };

  return (
    <span
      style={
        styles.status
      }
    >
      {labels[status] ??
        status}
    </span>
  );
}

function formatDate(
  value: string
) {
  if (!value) {
    return "—";
  }

  return new Intl.DateTimeFormat(
    "en-US",
    {
      year: "numeric",
      month: "short",
      day: "numeric",
    }
  ).format(
    new Date(value)
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

  container: {
    maxWidth:
      "1450px",
    margin:
      "0 auto",
  },

  header: {
    marginBottom:
      "28px",
  },

  back: {
    color:
      "#777",
    textDecoration:
      "none",
    fontSize:
      "13px",
  },

  headerRow: {
    marginTop:
      "30px",
    display:
      "flex",
    justifyContent:
      "space-between",
    alignItems:
      "flex-end",
    gap:
      "20px",
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
    marginTop:
      "10px",
  },

  addButton: {
    background:
      "#222",
    color:
      "#fff",
    textDecoration:
      "none",
    padding:
      "13px 17px",
    borderRadius:
      "10px",
    fontSize:
      "12px",
    whiteSpace:
      "nowrap" as const,
  },

  filters: {
    display:
      "grid",
    gridTemplateColumns:
      "1fr 170px 170px 180px",
    gap:
      "10px",
    marginBottom:
      "14px",
  },

  search: {
    width:
      "100%",
    boxSizing:
      "border-box" as const,
    padding:
      "13px 14px",
    border:
      "1px solid #ded7d3",
    borderRadius:
      "10px",
    background:
      "#fff",
    fontSize:
      "13px",
    outline:
      "none",
  },

  select: {
    width:
      "100%",
    boxSizing:
      "border-box" as const,
    padding:
      "13px 14px",
    border:
      "1px solid #ded7d3",
    borderRadius:
      "10px",
    background:
      "#fff",
    fontSize:
      "13px",
  },

  resultCount: {
    color:
      "#888",
    fontSize:
      "12px",
    margin:
      "12px 2px",
  },

  error: {
    background:
      "#fff0f0",
    border:
      "1px solid #eccaca",
    color:
      "#a44",
    borderRadius:
      "12px",
    padding:
      "15px",
  },

  table: {
    background:
      "#fff",
    border:
      "1px solid #e7e0dc",
    borderRadius:
      "15px",
    overflow:
      "hidden",
  },

  tableHeader: {
    display:
      "grid",
    gridTemplateColumns:
      "1.8fr 0.9fr 1.1fr 1.5fr 2fr 100px 120px",
    gap:
      "12px",
    padding:
      "13px 18px",
    background:
      "#f6f2ef",
    color:
      "#888",
    fontSize:
      "10px",
    textTransform:
      "uppercase" as const,
    letterSpacing:
      "1px",
  },

  row: {
    display:
      "grid",
    gridTemplateColumns:
      "1.8fr 0.9fr 1.1fr 1.5fr 2fr 100px 120px",
    gap:
      "12px",
    padding:
      "17px 18px",
    borderTop:
      "1px solid #eee8e4",
    alignItems:
      "center",
    textDecoration:
      "none",
    color:
      "#222",
    fontSize:
      "13px",
  },

  placeCell: {
    display:
      "flex",
    flexDirection:
      "column" as const,
    gap:
      "5px",
    minWidth:
      0,
  },

  typeCell: {
    color:
      "#555",
  },

  noteCell: {
    color:
      "#666",
    fontSize:
      "11px",
    lineHeight:
      1.5,
    minWidth:
      0,
    overflow:
      "hidden",
    textOverflow:
      "ellipsis",
    whiteSpace:
      "nowrap" as const,
  },

  status: {
    width:
      "fit-content",
    padding:
      "5px 8px",
    borderRadius:
      "999px",
    background:
      "#f3eeeb",
    color:
      "#666",
    fontSize:
      "10px",
  },

  date: {
    color:
      "#888",
    fontSize:
      "12px",
  },

  empty: {
    textAlign:
      "center" as const,
    padding:
      "60px 20px",
    color:
      "#888",
  },

  emptyLink: {
    display:
      "inline-block",
    marginTop:
      "10px",
    color:
      "#222",
    fontSize:
      "12px",
  },
};