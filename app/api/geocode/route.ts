export async function POST(request: Request) {
  try {
    const { address } = await request.json();

    if (!address || typeof address !== "string") {
      return Response.json(
        { error: "Address is required." },
        { status: 400 }
      );
    }

    const url = new URL(
      "https://nominatim.openstreetmap.org/search"
    );

    url.searchParams.set("q", address.trim());
    url.searchParams.set("format", "json");
    url.searchParams.set("limit", "1");
    url.searchParams.set("countrycodes", "jp");

    const response = await fetch(url.toString(), {
      headers: {
        "User-Agent": "TOKYO-GUIDE",
      },
    });

    if (!response.ok) {
      return Response.json(
        { error: "Geocoding service failed." },
        { status: 500 }
      );
    }

    const data = await response.json();

    if (!data || data.length === 0) {
      return Response.json(
        { error: "Address not found." },
        { status: 404 }
      );
    }

    const latitude = Number(data[0].lat);
    const longitude = Number(data[0].lon);

    if (
      !Number.isFinite(latitude) ||
      !Number.isFinite(longitude)
    ) {
      return Response.json(
        { error: "Invalid coordinates." },
        { status: 500 }
      );
    }

    return Response.json({
      latitude,
      longitude,
    });
  } catch (error) {
    console.error(error);

    return Response.json(
      { error: "Failed to geocode address." },
      { status: 500 }
    );
  }
}