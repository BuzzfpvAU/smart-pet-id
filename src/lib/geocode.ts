/**
 * Reverse geocode coordinates to a human-readable location name
 * using OpenStreetMap Nominatim (free, no API key required).
 *
 * Returns a string like "Bondi Beach, NSW 2026" or null on failure.
 */
export async function reverseGeocode(
  latitude: number,
  longitude: number
): Promise<string | null> {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&addressdetails=1&zoom=16`;
    const res = await fetch(url, {
      signal: AbortSignal.timeout(5000),
      headers: {
        "User-Agent": "Tagz.au/1.0 (https://tagz.au)",
      },
    });

    if (!res.ok) {
      console.error(`Nominatim API returned ${res.status}`);
      return null;
    }

    const data = await res.json();

    if (!data.address) {
      console.error("Nominatim: no address data returned");
      return null;
    }

    const addr = data.address as Record<string, string>;

    // Extract suburb/locality — Nominatim uses different keys
    const suburb =
      addr.suburb ??
      addr.city_district ??
      addr.town ??
      addr.city ??
      addr.village ??
      addr.hamlet;

    const state = addr.state;
    const postcode = addr.postcode;

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
