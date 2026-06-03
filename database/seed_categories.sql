-- ============================================================
-- RoommateGroups D1 — Marketplace Category Seed
-- Seeds a two-level marketplace category taxonomy.
-- Run: wrangler d1 execute roommatedb --remote --file=database/seed_categories.sql
-- ============================================================

INSERT OR IGNORE INTO mp_categories
  (category_id, parent_id, name, slug, icon, kind, attributes_schema, sort_order, is_active)
VALUES
  ('cat_furniture', NULL, 'Furniture', 'furniture', 'fa-couch', 'product', NULL, 10, 1),
  ('cat_electronics', NULL, 'Electronics', 'electronics', 'fa-tv', 'product', NULL, 20, 1),
  ('cat_mobiles', NULL, 'Mobiles', 'mobiles', 'fa-mobile-screen-button', 'product', '{"fields":["brand","model","storage","condition"]}', 30, 1),
  ('cat_vehicles', NULL, 'Vehicles', 'vehicles', 'fa-car', 'vehicle', NULL, 40, 1),
  ('cat_home_garden', NULL, 'Home & Garden', 'home-garden', 'fa-seedling', 'product', NULL, 50, 1),
  ('cat_appliances', NULL, 'Appliances', 'appliances', 'fa-blender', 'product', NULL, 60, 1),
  ('cat_services', NULL, 'Services', 'services', 'fa-screwdriver-wrench', 'service', NULL, 70, 1),
  ('cat_fashion', NULL, 'Fashion', 'fashion', 'fa-shirt', 'product', NULL, 80, 1),
  ('cat_free_stuff', NULL, 'Free Stuff', 'free-stuff', 'fa-gift', 'product', NULL, 90, 1);

INSERT OR IGNORE INTO mp_categories
  (category_id, parent_id, name, slug, icon, kind, attributes_schema, sort_order, is_active)
VALUES
  ('cat_furniture_sofas', 'cat_furniture', 'Sofas', 'furniture-sofas', 'fa-couch', 'product', NULL, 11, 1),
  ('cat_furniture_beds', 'cat_furniture', 'Beds', 'furniture-beds', 'fa-bed', 'product', NULL, 12, 1),
  ('cat_furniture_tables', 'cat_furniture', 'Tables', 'furniture-tables', 'fa-table', 'product', NULL, 13, 1),
  ('cat_furniture_chairs', 'cat_furniture', 'Chairs', 'furniture-chairs', 'fa-chair', 'product', NULL, 14, 1),
  ('cat_furniture_storage', 'cat_furniture', 'Storage', 'furniture-storage', 'fa-box-archive', 'product', NULL, 15, 1),

  ('cat_electronics_computers', 'cat_electronics', 'Computers', 'electronics-computers', 'fa-computer', 'product', NULL, 21, 1),
  ('cat_electronics_tvs', 'cat_electronics', 'TVs', 'electronics-tvs', 'fa-tv', 'product', NULL, 22, 1),
  ('cat_electronics_audio', 'cat_electronics', 'Audio', 'electronics-audio', 'fa-headphones', 'product', NULL, 23, 1),
  ('cat_electronics_cameras', 'cat_electronics', 'Cameras', 'electronics-cameras', 'fa-camera', 'product', NULL, 24, 1),

  ('cat_mobiles_smartphones', 'cat_mobiles', 'Smartphones', 'mobiles-smartphones', 'fa-mobile-screen-button', 'product', '{"fields":["brand","model","storage","condition"]}', 31, 1),
  ('cat_mobiles_tablets', 'cat_mobiles', 'Tablets', 'mobiles-tablets', 'fa-tablet-screen-button', 'product', '{"fields":["brand","model","storage","condition"]}', 32, 1),
  ('cat_mobiles_accessories', 'cat_mobiles', 'Accessories', 'mobiles-accessories', 'fa-charging-station', 'product', NULL, 33, 1),
  ('cat_mobiles_wearables', 'cat_mobiles', 'Wearables', 'mobiles-wearables', 'fa-clock', 'product', NULL, 34, 1),

  ('cat_vehicles_cars', 'cat_vehicles', 'Cars', 'vehicles-cars', 'fa-car-side', 'vehicle', '{"fields":["year","make","model","mileage","fuel","transmission"]}', 41, 1),
  ('cat_vehicles_bikes', 'cat_vehicles', 'Bikes', 'vehicles-bikes', 'fa-bicycle', 'vehicle', NULL, 42, 1),
  ('cat_vehicles_scooters', 'cat_vehicles', 'Scooters', 'vehicles-scooters', 'fa-motorcycle', 'vehicle', NULL, 43, 1),
  ('cat_vehicles_parts', 'cat_vehicles', 'Parts & Accessories', 'vehicles-parts-accessories', 'fa-gears', 'vehicle', NULL, 44, 1),

  ('cat_home_garden_decor', 'cat_home_garden', 'Decor', 'home-garden-decor', 'fa-rug', 'product', NULL, 51, 1),
  ('cat_home_garden_tools', 'cat_home_garden', 'Tools', 'home-garden-tools', 'fa-hammer', 'product', NULL, 52, 1),
  ('cat_home_garden_plants', 'cat_home_garden', 'Plants', 'home-garden-plants', 'fa-leaf', 'product', NULL, 53, 1),
  ('cat_home_garden_outdoor', 'cat_home_garden', 'Outdoor', 'home-garden-outdoor', 'fa-umbrella-beach', 'product', NULL, 54, 1),

  ('cat_appliances_refrigerators', 'cat_appliances', 'Refrigerators', 'appliances-refrigerators', 'fa-temperature-low', 'product', NULL, 61, 1),
  ('cat_appliances_washers_dryers', 'cat_appliances', 'Washers & Dryers', 'appliances-washers-dryers', 'fa-soap', 'product', NULL, 62, 1),
  ('cat_appliances_kitchen', 'cat_appliances', 'Kitchen Appliances', 'appliances-kitchen', 'fa-kitchen-set', 'product', NULL, 63, 1),
  ('cat_appliances_vacuums', 'cat_appliances', 'Vacuums', 'appliances-vacuums', 'fa-broom', 'product', NULL, 64, 1),

  ('cat_services_moving', 'cat_services', 'Moving Help', 'services-moving-help', 'fa-truck-moving', 'service', NULL, 71, 1),
  ('cat_services_cleaning', 'cat_services', 'Cleaning', 'services-cleaning', 'fa-broom', 'service', NULL, 72, 1),
  ('cat_services_repairs', 'cat_services', 'Repairs', 'services-repairs', 'fa-screwdriver-wrench', 'service', NULL, 73, 1),
  ('cat_services_tutoring', 'cat_services', 'Tutoring', 'services-tutoring', 'fa-graduation-cap', 'service', NULL, 74, 1),

  ('cat_fashion_clothing', 'cat_fashion', 'Clothing', 'fashion-clothing', 'fa-shirt', 'product', NULL, 81, 1),
  ('cat_fashion_shoes', 'cat_fashion', 'Shoes', 'fashion-shoes', 'fa-shoe-prints', 'product', NULL, 82, 1),
  ('cat_fashion_bags', 'cat_fashion', 'Bags', 'fashion-bags', 'fa-bag-shopping', 'product', NULL, 83, 1),
  ('cat_fashion_accessories', 'cat_fashion', 'Accessories', 'fashion-accessories', 'fa-glasses', 'product', NULL, 84, 1),

  ('cat_free_stuff_furniture', 'cat_free_stuff', 'Free Furniture', 'free-stuff-furniture', 'fa-couch', 'product', NULL, 91, 1),
  ('cat_free_stuff_electronics', 'cat_free_stuff', 'Free Electronics', 'free-stuff-electronics', 'fa-tv', 'product', NULL, 92, 1),
  ('cat_free_stuff_home', 'cat_free_stuff', 'Free Home Goods', 'free-stuff-home-goods', 'fa-box-open', 'product', NULL, 93, 1),
  ('cat_free_stuff_misc', 'cat_free_stuff', 'Miscellaneous', 'free-stuff-miscellaneous', 'fa-gift', 'product', NULL, 94, 1);
