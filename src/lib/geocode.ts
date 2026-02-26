/**
 * Reverse geocode coordinates to a human-readable location name
 * using the Google Geocoding API.
 *
 * Returns a string like "Bondi Beach, NSW 2026" or null on failure.
 */
export async function reverseGeocode(
  latitude: number,
  longitude: number
): Promise<string | null> {
  const apiKey = process.env.GOOGLE_MAPS_SERVER_KEY;
  if (!apiKey) {
    console.warn("GOOGLE_MAPS_SERVER_KEY not set, skipping reverse geocode");
    return null;
  }

  try {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${apiKey}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) });

    if (!res.ok) {
      console.error(`Geocoding API returned ${res.status}`);
      return null;
    }

    const data = await res.json();

    if (data.status !== "OK" || !data.results?.length) {
      console.error(`Geocoding API status: ${data.status}`);
      return null;
    }

    // Extract components from the most detailed result
    const components = data.results[0].address_components as {
      long_name: string;
      short_name: string;
      types: string[];
    }[];

    const suburb =
      components.find((c) => c.types.includes("locality"))?.long_name ??
      components.find((c) => c.types.includes("sublocality"))?.long_name ??
      components.find((c) => c.types.includes("neighborhood"))?.long_name;

    const state = components.find((c) =>
      c.types.includes("administrative_area_level_1")
    )?.short_name;

    const postcode = components.find((c) =>
      c.types.includes("postal_code")
    )?.short_name;

    // Build location string: "Suburb, State Postcode"
    const parts: string[] = [];
    if (suburb) parts.push(suburb);
    if (state && postcode) {
      parts.push(`${state} ${postcode}`);
    } else if (state) {
      parts.push(state);
    } else if (postcode) {
      parts.push(postcode);
    }

    return parts.length > 0 ? parts.join(", ") : null;
  } catch (err) {
    console.error("Reverse geocode failed:", err);
    return null;
  }
}
