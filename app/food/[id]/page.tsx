import Link from "next/link";
import { notFound } from "next/navigation";
import { supabase } from "@/lib/supabase";
import SiteHeader from "@/components/SiteHeader";

type Food = {
  id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  editor_pick: number | null;
  category_id: number | null;
};

type Category = {
  id: number;
  name: string;
};

type Place = {
  id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  group_id: string | null;
  region_id: number | null;
  area_id: number | null;
  price_range: string | null;
  editor_note: string | null;
};

type Region = {
  id: number;
  name: string;
};

type Area = {
  id: number;
  name: string;
};

type Group = {
  id: string;
  name: string;
};

export default async function FoodDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const {
    data: food,
    error: foodError,
  } = await supabase
    .from("foods")
    .select(`
      id,
      name,
      description,
      image_url,
      editor_pick,
      category_id
    `)
    .eq("id", id)
    .eq("status", "active")
    .single();

  if (foodError || !food) {
    notFound();
  }

  const loadedFood = food as Food;

  let category: Category | null = null;

  if (loadedFood.category_id !== null) {
    const {
      data: categoryData,
    } = await supabase
      .from("food_categories")
      .select("id, name")
      .eq(
        "id",
        loadedFood.category_id
      )
      .single();

    category = categoryData
      ? (categoryData as Category)
      : null;
  }

  const {
    data: relations,
    error: relationsError,
  } = await supabase
    .from("place_foods")
    .select("place_id")
    .eq("food_id", id);

  if (relationsError) {
    throw new Error(
      relationsError.message
    );
  }

  const placeIds = [
    ...new Set(
      (relations ?? []).map(
        (relation) =>
          relation.place_id
      )
    ),
  ];

  let places: Place[] = [];

  if (placeIds.length > 0) {
    const {
      data: placeData,
    } = await supabase
      .from("places")
      .select(`
        id,
        name,
        description,
        image_url,
        group_id,
        region_id,
        area_id,
        price_range,
        editor_note
      `)
      .in(
        "id",
        placeIds
      )
      .eq(
        "status",
        "published"
      )
      .order("name");

    places =
      (placeData ?? []) as Place[];
  }

  const regionIds = [
    ...new Set(
      places
        .map(
          (place) =>
            place.region_id
        )
        .filter(
          (
            value
          ): value is number =>
            value !== null
        )
    ),
  ];

  const areaIds = [
    ...new Set(
      places
        .map(
          (place) =>
            place.area_id
        )
        .filter(
          (
            value
          ): value is number =>
            value !== null
        )
    ),
  ];

  const groupIds = [
    ...new Set(
      places
        .map(
          (place) =>
            place.group_id
        )
        .filter(
          (
            value
          ): value is string =>
            value !== null
        )
    ),
  ];

  const [
    regionsResult,
    areasResult,
    groupsResult,
  ] = await Promise.all([
    regionIds.length > 0
      ? supabase
          .from("regions")
          .select("id, name")
          .in(
            "id",
            regionIds
          )
      : Promise.resolve({
          data: [],
          error: null,
        }),

    areaIds.length > 0
      ? supabase
          .from("areas")
          .select("id, name")
          .in(
            "id",
            areaIds
          )
      : Promise.resolve({
          data: [],
          error: null,
        }),

    groupIds.length > 0
      ? supabase
          .from(
            "place_groups"
          )
          .select(
            "id, name"
          )
          .in(
            "id",
            groupIds
          )
          .eq(
            "is_active",
            true
          )
      : Promise.resolve({
          data: [],
          error: null,
        }),
  ]);

  const regionMap =
    new Map<number, string>(
      (
        (regionsResult.data ??
          []) as Region[]
      ).map(
        (region) => [
          region.id,
          region.name,
        ]
      )
    );

  const areaMap =
    new Map<number, string>(
      (
        (areasResult.data ??
          []) as Area[]
      ).map(
        (area) => [
          area.id,
          area.name,
        ]
      )
    );

  const groupMap =
    new Map<string, string>(
      (
        (groupsResult.data ??
          []) as Group[]
      ).map(
        (group) => [
          String(group.id),
          group.name,
        ]
      )
    );

  return (
    <main style={styles.main}>
      <SiteHeader />

      <div style={styles.container}>
        <div style={styles.subHeader}>
          <Link
            href="/food"
            style={styles.back}
          >
            ← Food
          </Link>
        </div>

        <section style={styles.hero}>
          <div style={styles.imageArea}>
            {loadedFood.image_url ? (
              <img
                src={
                  loadedFood.image_url
                }
                alt={
                  loadedFood.name
                }
                style={
                  styles.heroImage
                }
              />
            ) : (
              <div
                style={
                  styles.placeholder
                }
              >
                TOKYO GUIDE
              </div>
            )}
          </div>

          <div style={styles.infoArea}>
            {category && (
              <p
                style={
                  styles.category
                }
              >
                {category.name}
              </p>
            )}

            <h1 style={styles.title}>
              {loadedFood.name}
            </h1>

            {(loadedFood.editor_pick ??
              0) > 0 && (
              <div
                style={
                  styles.pick
                }
              >
                TOKYO GIRL PICK{" "}
                {"★".repeat(
                  loadedFood.editor_pick ??
                    0
                )}
                {"☆".repeat(
                  5 -
                    (loadedFood.editor_pick ??
                      0)
                )}
              </div>
            )}

            {loadedFood.description && (
              <p
                style={
                  styles.description
                }
              >
                {
                  loadedFood.description
                }
              </p>
            )}
          </div>
        </section>

        <section style={styles.section}>
          <h2
            style={
              styles.sectionTitle
            }
          >
            Where to eat
          </h2>

          {places.length === 0 ? (
            <div style={styles.empty}>
              このFoodを提供している店舗はまだ登録されていません。
            </div>
          ) : (
            <div
              style={
                styles.placeList
              }
            >
              {places.map(
                (place) => {
                  const regionName =
                    place.region_id !==
                    null
                      ? regionMap.get(
                          place.region_id
                        )
                      : null;

                  const areaName =
                    place.area_id !==
                    null
                      ? areaMap.get(
                          place.area_id
                        )
                      : null;

                  const groupName =
                    place.group_id
                      ? groupMap.get(
                          String(
                            place.group_id
                          )
                        ) ?? null
                      : null;

                  return (
                    <Link
                      key={
                        place.id
                      }
                      href={`/places/${place.id}`}
                      style={
                        styles.placeCard
                      }
                    >
                      <div
                        style={
                          styles.placeImage
                        }
                      >
                        {place.image_url ? (
                          <img
                            src={
                              place.image_url
                            }
                            alt={
                              place.name
                            }
                            style={
                              styles.placeImageElement
                            }
                          />
                        ) : (
                          <span>
                            TOKYO GUIDE
                          </span>
                        )}
                      </div>

                      <div
                        style={
                          styles.placeBody
                        }
                      >
                        {groupName && (
                          <p
                            style={
                              styles.group
                            }
                          >
                            {
                              groupName
                            }
                          </p>
                        )}

                        <h3
                          style={
                            styles.placeName
                          }
                        >
                          {
                            place.name
                          }
                        </h3>

                        {(regionName ||
                          areaName) && (
                          <p
                            style={
                              styles.location
                            }
                          >
                            {
                              regionName ??
                              ""
                            }
                            {areaName
                              ? ` / ${areaName}`
                              : ""}
                          </p>
                        )}

                        {place.price_range && (
                          <p
                            style={
                              styles.price
                            }
                          >
                            {
                              place.price_range
                            }
                          </p>
                        )}

                        {place.description && (
                          <p
                            style={
                              styles.placeDescription
                            }
                          >
                            {
                              place.description
                            }
                          </p>
                        )}

                        {place.editor_note && (
                          <div
                            style={
                              styles.editorNote
                            }
                          >
                            <span
                              style={
                                styles.editorNoteLabel
                              }
                            >
                              TOKYO GIRL'S NOTE
                            </span>

                            <p
                              style={
                                styles.editorNoteText
                              }
                            >
                              {
                                place.editor_note
                              }
                            </p>
                          </div>
                        )}
                      </div>
                    </Link>
                  );
                }
              )}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

const styles = {
  main: {
    minHeight:
      "100vh",
    background:
      "#fffaf8",
    color:
      "#222",
  },

  container: {
    maxWidth:
      "1100px",
    margin:
      "0 auto",
    padding:
      "0 24px 100px",
  },

  subHeader: {
    padding:
      "22px 0 0",
  },

  back: {
    color:
      "#777",
    textDecoration:
      "none",
    fontSize:
      "12px",
  },

  hero: {
    display:
      "grid",
    gridTemplateColumns:
      "1.05fr 1fr",
    gap:
      "55px",
    alignItems:
      "start",
    paddingTop:
      "28px",
  },

  imageArea: {
    aspectRatio:
      "1 / 1",
    background:
      "#f2e7e2",
    borderRadius:
      "18px",
    overflow:
      "hidden",
    display:
      "flex",
    alignItems:
      "center",
    justifyContent:
      "center",
  },

  heroImage: {
    width:
      "100%",
    height:
      "100%",
    objectFit:
      "cover" as const,
    display:
      "block",
  },

  placeholder: {
    color:
      "#987a73",
    fontFamily:
      "Georgia, serif",
    fontSize:
      "11px",
    letterSpacing:
      "2px",
  },

  infoArea: {
    paddingTop:
      "20px",
  },

  category: {
    color:
      "#999",
    fontSize:
      "10px",
    letterSpacing:
      "1px",
    margin: 0,
  },

  title: {
    fontFamily:
      "Georgia, serif",
    fontWeight:
      400,
    fontSize:
      "48px",
    lineHeight:
      1.15,
    margin:
      "10px 0 0",
  },

  pick: {
    color:
      "#c8647b",
    fontSize:
      "11px",
    marginTop:
      "13px",
  },

  description: {
    color:
      "#666",
    fontSize:
      "14px",
    lineHeight:
      1.9,
    marginTop:
      "25px",
  },

  section: {
    marginTop:
      "60px",
    paddingTop:
      "30px",
    borderTop:
      "1px solid #e8dfdb",
  },

  sectionTitle: {
    fontFamily:
      "Georgia, serif",
    fontWeight:
      400,
    fontSize:
      "30px",
    margin:
      "0 0 25px",
  },

  placeList: {
    display:
      "grid",
    gridTemplateColumns:
      "repeat(3, minmax(0, 1fr))",
    gap:
      "18px",
  },

  placeCard: {
    color:
      "#222",
    textDecoration:
      "none",
    background:
      "#fff",
    border:
      "1px solid #e5ddd9",
    borderRadius:
      "14px",
    overflow:
      "hidden",
    minWidth:
      0,
  },

  placeImage: {
    aspectRatio:
      "4 / 3",
    background:
      "#f2e7e2",
    display:
      "flex",
    alignItems:
      "center",
    justifyContent:
      "center",
    color:
      "#987a73",
    fontFamily:
      "Georgia, serif",
    fontSize:
      "9px",
    letterSpacing:
      "2px",
    overflow:
      "hidden",
  },

  placeImageElement: {
    width:
      "100%",
    height:
      "100%",
    objectFit:
      "cover" as const,
    display:
      "block",
  },

  placeBody: {
    padding:
      "14px",
  },

  group: {
    color:
      "#999",
    fontSize:
      "10px",
    margin: 0,
  },

  placeName: {
    fontFamily:
      "Georgia, serif",
    fontSize:
      "20px",
    fontWeight:
      400,
    margin:
      "4px 0 0",
  },

  location: {
    color:
      "#999",
    fontSize:
      "10px",
    marginTop:
      "6px",
  },

  price: {
    color:
      "#666",
    fontSize:
      "12px",
    marginTop:
      "8px",
  },

  placeDescription: {
    color:
      "#777",
    fontSize:
      "11px",
    lineHeight:
      1.6,
    marginTop:
      "8px",
  },

  editorNote: {
    marginTop:
      "10px",
    paddingTop:
      "9px",
    borderTop:
      "1px solid #eee6e2",
  },

  editorNoteLabel: {
    color:
      "#c8647b",
    fontSize:
      "8px",
    fontWeight:
      700,
    letterSpacing:
      "1.5px",
  },

  editorNoteText: {
    color:
      "#555",
    fontSize:
      "11px",
    lineHeight:
      1.7,
    margin:
      "4px 0 0",
  },

  empty: {
    padding:
      "50px 20px",
    textAlign:
      "center" as const,
    background:
      "#fff",
    border:
      "1px solid #e7e0dc",
    borderRadius:
      "14px",
    color:
      "#888",
    fontSize:
      "13px",
  },
};