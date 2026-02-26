-- Add latitude and longitude columns for map view
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION;
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION;

-- Index for spatial queries
CREATE INDEX IF NOT EXISTS idx_restaurants_coords
  ON restaurants(latitude, longitude)
  WHERE latitude IS NOT NULL AND longitude IS NOT NULL;
