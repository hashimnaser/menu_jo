import type { Restaurant } from "@/lib/data";

type RestaurantMapLocation = Pick<
  Restaurant,
  "googleMapsUrl" | "latitude" | "longitude"
>;

export function getRestaurantMapUrl(restaurant: RestaurantMapLocation): string | null {
  const customUrl = getGoogleMapsUrl(restaurant.googleMapsUrl);
  if (customUrl) return customUrl;

  const { latitude, longitude } = restaurant;
  if (
    typeof latitude !== "number" ||
    !Number.isFinite(latitude) ||
    Math.abs(latitude) > 90 ||
    typeof longitude !== "number" ||
    !Number.isFinite(longitude) ||
    Math.abs(longitude) > 180
  ) {
    return null;
  }

  return `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
}

function getGoogleMapsUrl(value: string | null | undefined): string | null {
  if (!value) return null;

  try {
    const url = new URL(value);
    const isGoogleMaps =
      url.protocol === "https:" &&
      (url.hostname === "google.com" ||
        url.hostname.endsWith(".google.com") ||
        url.hostname === "maps.app.goo.gl");
    return isGoogleMaps ? url.toString() : null;
  } catch {
    return null;
  }
}
