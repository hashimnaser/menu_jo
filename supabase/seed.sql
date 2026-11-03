insert into public.restaurants (
  name, slug, description, rating, location, phone, latitude, longitude, google_maps_url
)
values
  ('زاخو', 'zakho', 'شاورما وسناكات', 4.7, 'إربد - شارع الثلاثين', '962788824411', 32.5372, 35.8540, 'https://maps.app.goo.gl/u1gkYoUH3Cbjxip56'),
  ('شاورمجي', 'shawarmaji', 'شاورما وسناكات', 4.5, 'إربد - شارع الهاشمي', '962798544448', 32.5568, 35.8478, 'https://maps.app.goo.gl/fQDz7U2r6oCN9TiE8'),
  ('تكا وشاورما', 'taka-wshawarma', 'شاورما ومشاوي', 4.8, 'إربد - شارع الثلاثين', '962786333387', 32.5380, 35.8535, 'https://maps.app.goo.gl/m8CgkY8gVxYYdmqk7')
on conflict (slug) do update set
  name = excluded.name,
  description = excluded.description,
  rating = excluded.rating,
  location = excluded.location,
  phone = excluded.phone,
  latitude = excluded.latitude,
  longitude = excluded.longitude,
  google_maps_url = excluded.google_maps_url;

insert into public.categories (name, restaurant_id)
select seed.name, restaurants.id
from (values
  ('zakho', 'ساندويشات'),
  ('zakho', 'وجبات'),
  ('shawarmaji', 'ساندويشات'),
  ('shawarmaji', 'أطباق جانبية'),
  ('taka-wshawarma', 'مشاوي'),
  ('taka-wshawarma', 'شاورما')
) as seed(slug, name)
join public.restaurants on restaurants.slug = seed.slug
on conflict (restaurant_id, name) do nothing;

insert into public.menu_items (name, description, price, category_id, is_available)
select seed.name, seed.description, seed.price, categories.id, true
from (values
  ('zakho', 'ساندويشات', 'شاورما دجاج', 'ثوم، مخلل، بطاطا', 1.50::numeric),
  ('zakho', 'ساندويشات', 'شاورما لحم', 'طحينة، بندورة، بصل وبقدونس', 2.00::numeric),
  ('zakho', 'وجبات', 'وجبة شاورما دجاج', 'مع بطاطا ومشروب', 3.50::numeric),
  ('zakho', 'وجبات', 'وجبة شاورما لحم', 'مع بطاطا ومشروب', 4.25::numeric),
  ('shawarmaji', 'ساندويشات', 'شاورما عربي دجاج', null, 1.60::numeric),
  ('shawarmaji', 'ساندويشات', 'شاورما صاج', 'خبز صاج رقيق', 1.90::numeric),
  ('shawarmaji', 'أطباق جانبية', 'بطاطا مقلية', null, 1.00::numeric),
  ('shawarmaji', 'أطباق جانبية', 'حمص', null, 1.25::numeric),
  ('taka-wshawarma', 'مشاوي', 'تكا لحم', 'مع خبز وسلطة', 5.50::numeric),
  ('taka-wshawarma', 'مشاوي', 'شيش طاووق', 'مع ثوم وخبز', 4.50::numeric),
  ('taka-wshawarma', 'شاورما', 'شاورما دجاج', null, 1.50::numeric),
  ('taka-wshawarma', 'شاورما', 'شاورما لحم', null, 2.00::numeric)
) as seed(slug, category_name, name, description, price)
join public.restaurants on restaurants.slug = seed.slug
join public.categories
  on categories.restaurant_id = restaurants.id
  and categories.name = seed.category_name
on conflict (category_id, name) do update set
  description = excluded.description,
  price = excluded.price,
  is_available = excluded.is_available;
