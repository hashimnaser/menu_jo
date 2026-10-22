import { redirect } from "next/navigation";

type Props = { params: { restaurantSlug: string } };

export default function RestaurantSlugPage({ params }: Props): never {
  redirect(`/r/${encodeURIComponent(params.restaurantSlug)}`);
}
