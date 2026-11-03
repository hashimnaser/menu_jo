alter table public.restaurants
  add column if not exists name_en text;
alter table public.restaurants
  add column if not exists description_en text;
alter table public.restaurants
  add column if not exists location_en text;
alter table public.categories
  add column if not exists name_en text;
alter table public.menu_items
  add column if not exists name_en text;
alter table public.menu_items
  add column if not exists description_en text;

update public.restaurants
set
  name_en = case slug
    when 'zakho' then 'Zakho'
    when 'shawarmaji' then 'Shawarmaji'
    when 'taka-wshawarma' then 'Taka & Shawarma'
    when 'al-tareeq' then 'Al Tareeq Broasted'
    else name_en
  end,
  description_en = case slug
    when 'zakho' then 'Shawarma & Snacks'
    when 'shawarmaji' then 'Shawarma & Snacks'
    when 'taka-wshawarma' then 'Shawarma & Grills'
    when 'al-tareeq' then 'Crispy broasted chicken'
    else description_en
  end,
  location_en = case
    when location like 'إربد%' then replace(location, 'إربد', 'Irbid')
    else location_en
  end;

update public.categories
set name_en = case name
  when 'ساندويشات' then 'Sandwiches'
  when 'وجبات' then 'Meals'
  when 'أطباق جانبية' then 'Sides'
  when 'مشاوي' then 'Grills'
  when 'شاورما' then 'Shawarma'
  when 'بروستد' then 'Broasted Chicken'
  else name_en
end;

update public.menu_items
set
  name_en = case name
    when 'شاورما دجاج' then 'Chicken Shawarma'
    when 'شاورما لحم' then 'Beef Shawarma'
    when 'وجبة شاورما دجاج' then 'Chicken Shawarma Meal'
    when 'وجبة شاورما لحم' then 'Beef Shawarma Meal'
    when 'شاورما عربي دجاج' then 'Arabic Chicken Shawarma'
    when 'شاورما صاج' then 'Saj Shawarma'
    when 'بطاطا مقلية' then 'French Fries'
    when 'حمص' then 'Hummus'
    when 'تكا لحم' then 'Beef Tikka'
    when 'شيش طاووق' then 'Shish Tawook'
    when 'وجبة بروستد 4 قطع' then '4-Piece Broasted Chicken Meal'
    else name_en
  end,
  description_en = case description
    when 'ثوم، مخلل، بطاطا' then 'Garlic sauce, pickles, and fries'
    when 'طحينة، بندورة، بصل وبقدونس' then 'Tahini, tomato, onion, and parsley'
    when 'مع بطاطا ومشروب' then 'Served with fries and a drink'
    when 'خبز صاج رقيق' then 'Thin saj bread'
    when 'مع خبز وسلطة' then 'Served with bread and salad'
    when 'مع ثوم وخبز' then 'Served with garlic sauce and bread'
    when 'مع بطاطا، ثوم، ومخلل' then 'Served with fries, garlic sauce, and pickles'
    else description_en
  end;
