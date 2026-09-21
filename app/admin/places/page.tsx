import { notFound } from "next/navigation";
import SaveButton from "@/components/SaveButton";
import { supabase } from "@/lib/supabase";

type Place = {
  id: string;
  name: string | null;
  description: string | null;
  place_type_id: string | null;
  area_id: string | null;

  price_range: string | null;
  editor_note: string | null;

  postal_code: string | null;
  address: string | null;
  google_maps_url: string | null;

  phone: string | null;
  official_url: string | null;
  instagram_url: string | null;
  tabelog_url: string | null;

  reservation: string | null;
  english_support: string | null;
  opening_hours: string | null;
  closed_days: string | null;

  seats: string | null;
  counter_seats: string | null;
  table_seats: string | null;

  card: string | null;
  tax_free: string | null;

  image_url: string | null;

  latitude: number | null;
  longitude: number | null;

  status?: string | null;
};

type PlaceImage = {
  id: string;
  image_url: string;
  sort_order: number | null;
};

type Area = {
  id: string;
  name: string | null;
};

type PlaceProductRelation = {
  product_id: string;
};

type Product = {
  id: string;
  name: string | null;
  brand: string | null;
  description: string | null;
  image_url: string | null;
  editor_pick: boolean | null;
};

type Station = {
  id: string;
  name: string | null;
};

type PlaceAccess = {
  station_id: string;
  walk_minutes: number | null;
};

type SupabaseErrorInfo = {
  message: string;
  details: string;
  hint: string;
  code: string;
};

export default async function PlaceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  /*
   * places は select("*") にして、
   * 現在のDBに実際に存在する列だけを取得する。
   *
   * 以前の group_id / region_id など、
   * 現在のAdmin入力画面に存在しない列は一切指定しない。
   */
  const {
    data: place,
    error: placeError,
  } = await supabase
    .from("places")
    .select("*")
    .eq("id", id)
    .eq("status", "published")
    .maybeSingle();

  if (placeError) {
    const errorInfo: SupabaseErrorInfo = {
      message: placeError.message ?? "",
      details: placeError.details ?? "",
      hint: placeError.hint ?? "",
      code: placeError.code ?? "",
    };

    console.error(
      "PLACE DETAIL SUPABASE ERROR:",
      errorInfo
    );

    return (
      <main className="mx-auto max-w-5xl px-6 py-10">
        <div className="rounded-xl border border-red-200 bg-red-50 p-6">
          <h1 className="text-xl font-semibold text-red-700">
            Place could not be loaded
          </h1>

          <div className="mt-4 space-y-2 text-sm text-red-700">
            <p>
              <strong>Message:</strong>{" "}
              {errorInfo.message || "(empty)"}
            </p>

            <p>
              <strong>Details:</strong>{" "}
              {errorInfo.details || "(empty)"}
            </p>

            <p>
              <strong>Hint:</strong>{" "}
              {errorInfo.hint || "(empty)"}
            </p>

            <p>
              <strong>Code:</strong>{" "}
              {errorInfo.code || "(empty)"}
            </p>

            <p>
              <strong>Place ID:</strong> {id}
            </p>
          </div>
        </div>
      </main>
    );
  }

  if (!place) {
    notFound();
  }

  /*
   * Images
   */
  const {
    data: placeImages,
    error: imagesError,
  } = await supabase
    .from("place_images")
    .select("id,image_url,sort_order")
    .eq("place_id", place.id)
    .order("sort_order", {
      ascending: true,
    });

  if (imagesError) {
    console.error(
      "PLACE IMAGES SUPABASE ERROR:",
      {
        message: imagesError.message ?? "",
        details: imagesError.details ?? "",
        hint: imagesError.hint ?? "",
        code: imagesError.code ?? "",
      }
    );
  }

  /*
   * Area
   */
  let area: Area | null = null;

  if (place.area_id) {
    const {
      data: areaData,
      error: areaError,
    } = await supabase
      .from("areas")
      .select("id,name")
      .eq("id", place.area_id)
      .maybeSingle();

    if (areaError) {
      console.error(
        "PLACE AREA SUPABASE ERROR:",
        {
          message: areaError.message ?? "",
          details: areaError.details ?? "",
          hint: areaError.hint ?? "",
          code: areaError.code ?? "",
        }
      );
    }

    area = areaData;
  }

  /*
   * Products linked to this place
   */
  const {
    data: placeProductRelations,
    error: placeProductsError,
  } = await supabase
    .from("place_products")
    .select("product_id")
    .eq("place_id", place.id)
    .eq("available", true);

  if (placeProductsError) {
    console.error(
      "PLACE PRODUCTS SUPABASE ERROR:",
      {
        message: placeProductsError.message ?? "",
        details: placeProductsError.details ?? "",
        hint: placeProductsError.hint ?? "",
        code: placeProductsError.code ?? "",
      }
    );
  }

  let products: Product[] = [];

  const productIds =
    placeProductRelations?.map(
      (row: PlaceProductRelation) => row.product_id
    ) ?? [];

  if (productIds.length > 0) {
    const {
      data: productData,
      error: productsError,
    } = await supabase
      .from("products")
      .select(
        "id,name,brand,description,image_url,editor_pick"
      )
      .in("id", productIds)
      .eq("status", "published");

    if (productsError) {
      console.error(
        "PRODUCTS SUPABASE ERROR:",
        {
          message: productsError.message ?? "",
          details: productsError.details ?? "",
          hint: productsError.hint ?? "",
          code: productsError.code ?? "",
        }
      );
    }

    products = productData ?? [];
  }

  /*
   * Access / stations
   *
   * AdminのPlace登録画面で登録した
   * place_access も詳細ページに表示する。
   */
  const {
    data: accessRows,
    error: accessError,
  } = await supabase
    .from("place_access")
    .select("station_id,walk_minutes")
    .eq("place_id", place.id);

  if (accessError) {
    console.error(
      "PLACE ACCESS SUPABASE ERROR:",
      {
        message: accessError.message ?? "",
        details: accessError.details ?? "",
        hint: accessError.hint ?? "",
        code: accessError.code ?? "",
      }
    );
  }

  let access: Array<
    PlaceAccess & {
      station: Station | null;
    }
  > = [];

  const stationIds =
    accessRows?.map(
      (row: PlaceAccess) => row.station_id
    ) ?? [];

  if (stationIds.length > 0) {
    const {
      data: stations,
      error: stationsError,
    } = await supabase
      .from("stations")
      .select("id,name")
      .in("id", stationIds);

    if (stationsError) {
      console.error(
        "STATIONS SUPABASE ERROR:",
        {
          message: stationsError.message ?? "",
          details: stationsError.details ?? "",
          hint: stationsError.hint ?? "",
          code: stationsError.code ?? "",
        }
      );
    }

    access =
      accessRows?.map((row) => ({
        ...row,
        station:
          stations?.find(
            (station) =>
              station.id === row.station_id
          ) ?? null,
      })) ?? [];
  }

  const images: PlaceImage[] = placeImages ?? [];

  const heroImage =
    images[0]?.image_url ||
    place.image_url ||
    null;

  const galleryImages = images.slice(1);

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <div className="space-y-10">
        {/* Hero */}
        <section>
          {heroImage ? (
            <div className="overflow-hidden rounded-2xl">
              <img
                src={heroImage}
                alt={place.name ?? ""}
                className="h-[420px] w-full object-cover"
              />
            </div>
          ) : (
            <div className="flex h-[420px] items-center justify-center rounded-2xl bg-gray-100 text-sm text-gray-400">
              No image
            </div>
          )}
        </section>

        {/* Basic information */}
        <section>
          <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
            <div>
              {area?.name && (
                <p className="mb-2 text-sm text-gray-500">
                  {area.name}
                </p>
              )}

              <h1 className="text-4xl font-semibold tracking-tight">
                {place.name}
              </h1>
            </div>

            <SaveButton
  type="place"
  itemId={place.id}
/>
          </div>

          <div className="mt-6 space-y-5">
            {place.price_range && (
              <p className="text-sm text-gray-600">
                {place.price_range}
              </p>
            )}

            {place.description && (
              <div>
                <h2 className="mb-2 text-lg font-semibold">
                  About
                </h2>

                <p className="whitespace-pre-line text-sm leading-7 text-gray-700">
                  {place.description}
                </p>
              </div>
            )}

            {place.editor_note && (
              <div className="rounded-xl border bg-gray-50 p-5">
                <h2 className="mb-2 text-sm font-semibold">
                  Editor's Note
                </h2>

                <p className="whitespace-pre-line text-sm leading-6 text-gray-700">
                  {place.editor_note}
                </p>
              </div>
            )}
          </div>
        </section>

        {/* Location */}
        {(place.postal_code ||
          place.address ||
          place.google_maps_url) && (
          <section className="rounded-2xl border p-6">
            <h2 className="mb-5 text-xl font-semibold">
              Location
            </h2>

            <div className="space-y-3 text-sm">
              {place.postal_code && (
                <p>
                  <span className="font-medium">
                    Postal Code
                  </span>
                  <br />
                  {place.postal_code}
                </p>
              )}

              {place.address && (
                <p>
                  <span className="font-medium">
                    Address
                  </span>
                  <br />
                  {place.address}
                </p>
              )}

              {place.google_maps_url && (
                <a
                  href={place.google_maps_url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-block underline"
                >
                  Open in Google Maps
                </a>
              )}
            </div>
          </section>
        )}

        {/* Access */}
        {access.length > 0 && (
          <section className="rounded-2xl border p-6">
            <h2 className="mb-5 text-xl font-semibold">
              Access
            </h2>

            <div className="space-y-3">
              {access.map((row) => (
                <div
                  key={`${row.station_id}-${row.walk_minutes}`}
                  className="flex items-center justify-between border-b pb-3 last:border-b-0"
                >
                  <span className="text-sm">
                    {row.station?.name ??
                      "Station"}
                  </span>

                  {row.walk_minutes !== null && (
                    <span className="text-sm text-gray-500">
                      {row.walk_minutes} min walk
                    </span>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Store information */}
        {(place.opening_hours ||
          place.closed_days ||
          place.reservation ||
          place.english_support ||
          place.seats ||
          place.counter_seats ||
          place.table_seats ||
          place.card ||
          place.tax_free ||
          place.phone) && (
          <section className="rounded-2xl border p-6">
            <h2 className="mb-5 text-xl font-semibold">
              Information
            </h2>

            <div className="grid gap-6 md:grid-cols-2">
              {place.opening_hours && (
                <div>
                  <h3 className="mb-1 text-sm font-medium">
                    Opening Hours
                  </h3>

                  <p className="whitespace-pre-line text-sm text-gray-600">
                    {place.opening_hours}
                  </p>
                </div>
              )}

              {place.closed_days && (
                <div>
                  <h3 className="mb-1 text-sm font-medium">
                    Closed Days
                  </h3>

                  <p className="text-sm text-gray-600">
                    {place.closed_days}
                  </p>
                </div>
              )}

              {place.reservation && (
                <div>
                  <h3 className="mb-1 text-sm font-medium">
                    Reservation
                  </h3>

                  <p className="text-sm text-gray-600">
                    {place.reservation}
                  </p>
                </div>
              )}

              {place.english_support && (
                <div>
                  <h3 className="mb-1 text-sm font-medium">
                    English Support
                  </h3>

                  <p className="text-sm text-gray-600">
                    {place.english_support}
                  </p>
                </div>
              )}

              {place.seats && (
                <div>
                  <h3 className="mb-1 text-sm font-medium">
                    Total Seats
                  </h3>

                  <p className="text-sm text-gray-600">
                    {place.seats}
                  </p>
                </div>
              )}

              {place.counter_seats && (
                <div>
                  <h3 className="mb-1 text-sm font-medium">
                    Counter Seats
                  </h3>

                  <p className="text-sm text-gray-600">
                    {place.counter_seats}
                  </p>
                </div>
              )}

              {place.table_seats && (
                <div>
                  <h3 className="mb-1 text-sm font-medium">
                    Table Seats
                  </h3>

                  <p className="text-sm text-gray-600">
                    {place.table_seats}
                  </p>
                </div>
              )}

              {place.card && (
                <div>
                  <h3 className="mb-1 text-sm font-medium">
                    Card
                  </h3>

                  <p className="text-sm text-gray-600">
                    {place.card}
                  </p>
                </div>
              )}

              {place.tax_free && (
                <div>
                  <h3 className="mb-1 text-sm font-medium">
                    Tax Free
                  </h3>

                  <p className="text-sm text-gray-600">
                    {place.tax_free}
                  </p>
                </div>
              )}

              {place.phone && (
                <div>
                  <h3 className="mb-1 text-sm font-medium">
                    Phone
                  </h3>

                  <p className="text-sm text-gray-600">
                    {place.phone}
                  </p>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Links */}
        {(place.official_url ||
          place.instagram_url ||
          place.tabelog_url) && (
          <section className="rounded-2xl border p-6">
            <h2 className="mb-5 text-xl font-semibold">
              Links
            </h2>

            <div className="flex flex-wrap gap-4 text-sm">
              {place.official_url && (
                <a
                  href={place.official_url}
                  target="_blank"
                  rel="noreferrer"
                  className="underline"
                >
                  Official Website
                </a>
              )}

              {place.instagram_url && (
                <a
                  href={place.instagram_url}
                  target="_blank"
                  rel="noreferrer"
                  className="underline"
                >
                  Instagram
                </a>
              )}

              {place.tabelog_url && (
                <a
                  href={place.tabelog_url}
                  target="_blank"
                  rel="noreferrer"
                  className="underline"
                >
                  Tabelog
                </a>
              )}
            </div>
          </section>
        )}

        {/* Gallery */}
        {galleryImages.length > 0 && (
          <section>
            <h2 className="mb-5 text-xl font-semibold">
              Gallery
            </h2>

            <div className="grid gap-4 md:grid-cols-3">
              {galleryImages.map((image) => (
                <div
                  key={image.id}
                  className="overflow-hidden rounded-xl"
                >
                  <img
                    src={image.image_url}
                    alt={place.name ?? ""}
                    className="aspect-square w-full object-cover"
                  />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Products */}
        {products.length > 0 && (
          <section>
            <h2 className="mb-5 text-xl font-semibold">
              Products
            </h2>

            <div className="grid gap-6 md:grid-cols-3">
              {products.map((product) => (
                <article
                  key={product.id}
                  className="overflow-hidden rounded-xl border"
                >
                  {product.image_url && (
                    <img
                      src={product.image_url}
                      alt={product.name ?? ""}
                      className="aspect-square w-full object-cover"
                    />
                  )}

                  <div className="p-4">
                    {product.brand && (
                      <p className="text-xs text-gray-500">
                        {product.brand}
                      </p>
                    )}

                    <h3 className="mt-1 font-semibold">
                      {product.name}
                    </h3>

                    {product.description && (
                      <p className="mt-2 text-sm leading-6 text-gray-600">
                        {product.description}
                      </p>
                    )}

                    {product.editor_pick && (
                      <p className="mt-3 text-xs font-medium">
                        Editor's Pick
                      </p>
                    )}
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}