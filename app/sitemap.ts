import type { MetadataRoute } from "next";
import { createClient } from "@/lib/supabase/server";

const siteUrl = "https://menu-jo.vercel.app";
const pageSize = 1000;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = createClient();
  const entries: MetadataRoute.Sitemap = [];

  for (let from = 0; ; from += pageSize) {
    const { data: restaurants, error } = await supabase
      .from("restaurants")
      .select("slug")
      .order("slug")
      .range(from, from + pageSize - 1);

    if (error) {
      throw new Error(`Could not load restaurants for sitemap from Supabase: ${error.message}`);
    }

    entries.push(
      ...(restaurants ?? []).map(({ slug }) => ({
        url: new URL(`/${encodeURIComponent(slug)}`, siteUrl).toString(),
      })),
    );

    if (!restaurants || restaurants.length < pageSize) break;
  }

  return entries;
}
