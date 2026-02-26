-- West Coast Events - Supabase Schema
-- Run this in the Supabase SQL Editor to set up the database

-- Regions lookup table
CREATE TABLE IF NOT EXISTS regions (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  description TEXT
);

-- Restaurants table
CREATE TABLE IF NOT EXISTS restaurants (
  id SERIAL PRIMARY KEY,
  region_id INTEGER NOT NULL REFERENCES regions(id),
  name TEXT NOT NULL,
  neighborhood TEXT,
  cuisine_type TEXT,
  address TEXT,
  phone TEXT,
  email TEXT,
  website TEXT,
  yelp_url TEXT,
  private_dining_info TEXT,
  approximate_capacity TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for common queries
CREATE INDEX idx_restaurants_region_id ON restaurants(region_id);
CREATE INDEX idx_restaurants_cuisine_type ON restaurants(cuisine_type);
CREATE INDEX idx_restaurants_neighborhood ON restaurants(neighborhood);

-- Insert regions
INSERT INTO regions (name, slug, description) VALUES
  ('Pasadena / Glendale / Burbank', 'pasadena-glendale-burbank', 'Northeast LA suburbs with historic dining scenes'),
  ('South Bay', 'south-bay', 'Manhattan Beach, Hermosa Beach, Redondo Beach and surrounding areas'),
  ('Westside LA / Santa Monica / Venice', 'westside-la', 'Santa Monica, Venice, Brentwood, and the Westside'),
  ('Hollywood / West Hollywood / Beverly Hills', 'hollywood-weho-bevhills', 'The entertainment corridor from Hollywood to Beverly Hills'),
  ('San Fernando Valley', 'san-fernando-valley', 'Sherman Oaks, Studio City, Encino, and the greater Valley'),
  ('Culver City / West LA / Century City', 'culver-city-west-la', 'The Culver City dining boom and surrounding areas'),
  ('Mid-City / Koreatown', 'mid-city-koreatown', 'Koreatown, Mid-Wilshire, and surrounding neighborhoods'),
  ('DTLA', 'dtla', 'Downtown Los Angeles — Arts District, Little Tokyo, Historic Core'),
  ('Eastside LA / Echo Park', 'eastside-la', 'Silver Lake, Echo Park, Los Feliz, Highland Park, Eagle Rock'),
  ('Malibu / Palisades / Topanga', 'malibu-palisades-topanga', 'Coastal dining from Pacific Palisades through Malibu to Topanga');

-- Row-level security (allow public read access for now)
ALTER TABLE regions ENABLE ROW LEVEL SECURITY;
ALTER TABLE restaurants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access on regions" ON regions
  FOR SELECT USING (true);

CREATE POLICY "Allow public read access on restaurants" ON restaurants
  FOR SELECT USING (true);

-- View for region stats (used on homepage)
CREATE OR REPLACE VIEW region_stats AS
SELECT
  r.id,
  r.name,
  r.slug,
  r.description,
  COUNT(res.id) AS restaurant_count,
  ROUND(100.0 * COUNT(res.phone) FILTER (WHERE res.phone IS NOT NULL AND res.phone != '') / NULLIF(COUNT(res.id), 0), 1) AS phone_coverage,
  ROUND(100.0 * COUNT(res.email) FILTER (WHERE res.email IS NOT NULL AND res.email != '') / NULLIF(COUNT(res.id), 0), 1) AS email_coverage,
  ROUND(100.0 * COUNT(res.website) FILTER (WHERE res.website IS NOT NULL AND res.website != '') / NULLIF(COUNT(res.id), 0), 1) AS website_coverage,
  ROUND(100.0 * COUNT(res.private_dining_info) FILTER (WHERE res.private_dining_info IS NOT NULL AND res.private_dining_info != '') / NULLIF(COUNT(res.id), 0), 1) AS private_dining_coverage,
  ROUND(100.0 * COUNT(res.approximate_capacity) FILTER (WHERE res.approximate_capacity IS NOT NULL AND res.approximate_capacity != '') / NULLIF(COUNT(res.id), 0), 1) AS capacity_coverage
FROM regions r
LEFT JOIN restaurants res ON res.region_id = r.id
GROUP BY r.id, r.name, r.slug, r.description;
