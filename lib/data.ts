// Sample data. Replace with Supabase/Postgres later (same shape).
export type Item = { name: string; desc?: string; price: number };
export type Category = { title: string; items: Item[] };
export type Restaurant = {
  slug: string;
  name: string;
  tagline: string;
  city: string;
  cuisine: string[];
  whatsapp?: string; // e.g. "962791234567"
  categories: Category[];
};

export const restaurants: Restaurant[] = [
  {
    slug: "zakho",
    name: "زاخو",
    tagline: "شاورما ووجبات سريعة",
    city: "إربد",
    cuisine: ["شاورما", "وجبات سريعة"],
    categories: [
      { title: "ساندويشات", items: [
        { name: "شاورما دجاج", desc: "ثوم، مخلل، بطاطا", price: 1.5 },
        { name: "شاورما لحم", desc: "طحينة، بندورة، بصل وبقدونس", price: 2.0 },
        { name: "برغر دجاج", price: 2.25 },
      ]},
      { title: "وجبات", items: [
        { name: "وجبة شاورما دجاج", desc: "مع بطاطا ومشروب", price: 3.5 },
        { name: "وجبة شاورما لحم", desc: "مع بطاطا ومشروب", price: 4.25 },
      ]},
      { title: "مشروبات", items: [
        { name: "مشروب غازي", price: 0.5 },
        { name: "لبن عيران", price: 0.35 },
      ]},
    ],
  },
  {
    slug: "shawarmaji",
    name: "شاورمجي",
    tagline: "شاورما على أصولها",
    city: "إربد",
    cuisine: ["شاورما"],
    categories: [
      { title: "ساندويشات", items: [
        { name: "شاورما عربي دجاج", price: 1.6 },
        { name: "شاورما عربي لحم", price: 2.1 },
        { name: "شاورما صاج", desc: "خبز صاج رقيق", price: 1.9 },
      ]},
      { title: "أطباق جانبية", items: [
        { name: "بطاطا مقلية", price: 1.0 },
        { name: "حمص", price: 1.25 },
      ]},
    ],
  },
  {
    slug: "taka-wshawarma",
    name: "تكا وشاورما",
    tagline: "مشاوي وشاورما",
    city: "إربد",
    cuisine: ["مشاوي", "شاورما"],
    categories: [
      { title: "مشاوي", items: [
        { name: "تكا لحم", desc: "مع خبز وسلطة", price: 5.5 },
        { name: "شيش طاووق", desc: "مع ثوم وخبز", price: 4.5 },
        { name: "كباب", price: 5.0 },
      ]},
      { title: "شاورما", items: [
        { name: "شاورما دجاج", price: 1.5 },
        { name: "شاورما لحم", price: 2.0 },
      ]},
    ],
  },
];

export const getRestaurant = (slug: string) => restaurants.find((r) => r.slug === slug);
