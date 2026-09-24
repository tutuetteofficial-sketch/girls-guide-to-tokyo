import { NextResponse } from "next/server";

const GOOGLE_PLACES_URL =
  "https://places.googleapis.com/v1/places:searchText";

const GOOGLE_DETAILS_URL =
  "https://places.googleapis.com/v1/places";

type GooglePlace = {
  id?: string;
  name?: string;
  displayName?: {
    text?: string;
  };
  formattedAddress?: string;
  shortFormattedAddress?: string;
  location?: {
    latitude?: number;
    longitude?: number;
  };
  websiteUri?: string;
  googleMapsUri?: string;
  nationalPhoneNumber?: string;
  internationalPhoneNumber?: string;
  postalAddress?: {
    postalCode?: string;
  };
  types?: string[];
  primaryType?: string;
  businessStatus?: string;
  regularOpeningHours?: {
    weekdayDescriptions?: string[];
  };
};

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const name = String(body?.name ?? "").trim();

    if (!name) {
      return NextResponse.json(
        {
          error: "店舗名を入力してください。",
        },
        { status: 400 }
      );
    }

    const apiKey =
      process.env.GOOGLE_MAPS_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        {
          error:
            "GOOGLE_MAPS_API_KEY が設定されていません。",
        },
        { status: 500 }
      );
    }

    // =====================================
    // 1. 店名から候補を検索
    // =====================================

    const searchResponse = await fetch(
      GOOGLE_PLACES_URL,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": apiKey,
          "X-Goog-FieldMask":
            "places.id,places.displayName,places.formattedAddress,places.location,places.types,places.primaryType,places.businessStatus",
        },
        body: JSON.stringify({
          textQuery: `${name} Tokyo Japan`,
          languageCode: "ja",
          regionCode: "JP",
          maxResultCount: 5,
        }),
        cache: "no-store",
      }
    );

    if (!searchResponse.ok) {
      const errorText =
        await searchResponse.text();

      return NextResponse.json(
        {
          error:
            `Google Places検索に失敗しました: ${errorText}`,
        },
        { status: 502 }
      );
    }

    const searchData =
      (await searchResponse.json()) as {
        places?: GooglePlace[];
      };

    const places =
      searchData.places ?? [];

    if (places.length === 0) {
      return NextResponse.json({
        candidates: [],
      });
    }

    // =====================================
    // 2. 各候補の詳細情報を取得
    // =====================================

    const detailedCandidates =
      await Promise.all(
        places.slice(0, 5).map(
          async (place) => {
            if (!place.id) {
              return place;
            }

            const detailResponse =
              await fetch(
                `${GOOGLE_DETAILS_URL}/${encodeURIComponent(
                  place.id
                )}`,
                {
                  method: "GET",
                  headers: {
                    "Content-Type":
                      "application/json",
                    "X-Goog-Api-Key":
                      apiKey,
                    "X-Goog-FieldMask":
                      "id,displayName,formattedAddress,shortFormattedAddress,location,websiteUri,googleMapsUri,nationalPhoneNumber,internationalPhoneNumber,postalAddress,types,primaryType,businessStatus,regularOpeningHours",
                  },
                  cache: "no-store",
                }
              );

            if (!detailResponse.ok) {
              return place;
            }

            return (await detailResponse.json()) as GooglePlace;
          }
        )
      );

    return NextResponse.json({
      candidates:
        detailedCandidates.map(
          (place) => ({
            google_place_id:
              place.id ?? null,

            name:
              place.displayName?.text ??
              "",

            address:
              place.formattedAddress ??
              null,

            postal_code:
              place.postalAddress
                ?.postalCode ??
              null,

            latitude:
              place.location?.latitude ??
              null,

            longitude:
              place.location?.longitude ??
              null,

            phone:
              place.nationalPhoneNumber ??
              place.internationalPhoneNumber ??
              null,

            official_url:
              place.websiteUri ??
              null,

            google_maps_url:
              place.googleMapsUri ??
              null,

            primary_type:
              place.primaryType ??
              null,

            types:
              place.types ?? [],

            business_status:
              place.businessStatus ??
              null,

            opening_hours:
              place.regularOpeningHours
                ?.weekdayDescriptions
                ?.join("\n") ??
              null,
          })
        ),
    });
  } catch (error) {
    console.error(
      "Places lookup error:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "店舗情報の取得に失敗しました。",
      },
      { status: 500 }
    );
  }
}