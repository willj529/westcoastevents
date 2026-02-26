-- Track restaurants where geocoding was attempted but address wasn't found
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS geocode_failed BOOLEAN DEFAULT FALSE;
