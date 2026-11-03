export type Coordinates = {
  latitude: number;
  longitude: number;
};

export function calculateDistance(
  origin: Coordinates,
  destination: Coordinates,
): number | null {
  const isValid = ({ latitude, longitude }: Coordinates) =>
    Number.isFinite(latitude) &&
    Math.abs(latitude) <= 90 &&
    Number.isFinite(longitude) &&
    Math.abs(longitude) <= 180;

  if (!isValid(origin) || !isValid(destination)) return null;

  const radians = (degrees: number) => (degrees * Math.PI) / 180;
  const latitudeDifference = radians(destination.latitude - origin.latitude);
  const longitudeDifference = radians(destination.longitude - origin.longitude);
  const a =
    Math.sin(latitudeDifference / 2) ** 2 +
    Math.cos(radians(origin.latitude)) *
      Math.cos(radians(destination.latitude)) *
      Math.sin(longitudeDifference / 2) ** 2;
  const boundedA = Math.min(1, Math.max(0, a));

  return 6371 * 2 * Math.atan2(Math.sqrt(boundedA), Math.sqrt(1 - boundedA));
}
