"use client";

import Link from "next/link";
import L from "leaflet";
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import type { Restaurant } from "@/lib/data";
import { getRestaurantMapUrl } from "@/lib/google-maps";
import type { Locale } from "@/lib/i18n";

const irbidCenter: [number, number] = [32.5578, 35.8646];

const restaurantIcon = L.divIcon({
  className: "restaurant-map-marker",
  html: "<span></span>",
  iconSize: [32, 40],
  iconAnchor: [16, 40],
  popupAnchor: [0, -36],
});

function hasCoordinates(
  restaurant: Restaurant,
): restaurant is Restaurant & { latitude: number; longitude: number } {
  return (
    typeof restaurant.latitude === "number" &&
    Number.isFinite(restaurant.latitude) &&
    Math.abs(restaurant.latitude) <= 90 &&
    typeof restaurant.longitude === "number" &&
    Number.isFinite(restaurant.longitude) &&
    Math.abs(restaurant.longitude) <= 180
  );
}

export default function RestaurantMap({ restaurants, locale }: { restaurants: Restaurant[]; locale: Locale }) {
  const restaurantsWithCoordinates = restaurants.filter(hasCoordinates);

  return (
    <MapContainer
      center={irbidCenter}
      zoom={13}
      scrollWheelZoom={false}
      className="h-[380px] w-full rounded-3xl sm:h-[460px]"
      aria-label={locale === "ar" ? "خريطة المطاعم في إربد" : "Restaurant map in Irbid"}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {restaurantsWithCoordinates.map((restaurant) => {
        const mapUrl = getRestaurantMapUrl(restaurant);

        return (
          <Marker
            key={restaurant.slug}
            position={[restaurant.latitude, restaurant.longitude]}
            icon={restaurantIcon}
          >
            <Popup>
              <div dir={locale === "ar" ? "rtl" : "ltr"} className={`min-w-36 ${locale === "ar" ? "text-right" : "text-left"}`}>
                <strong className="block text-base text-slate-900">{restaurant.name}</strong>
                <span className="mt-1 block text-sm text-slate-600">
                  {restaurant.city || "Irbid"}
                </span>
                {mapUrl && (
                  <a
                    href={mapUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 block font-semibold text-amber-700 hover:underline"
                  >
                    {locale === "ar" ? "افتح الموقع على خرائط Google" : "Open in Google Maps"}
                  </a>
                )}
                <Link
                  href={`/${encodeURIComponent(restaurant.slug)}`}
                  className="mt-2 inline-block font-semibold text-amber-700 hover:underline"
                >
                  {locale === "ar" ? "عرض المنيو" : "View menu"}
                </Link>
              </div>
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
}
