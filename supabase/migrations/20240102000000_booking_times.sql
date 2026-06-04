-- Add start_time / end_time to bookings if they don't already exist
ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS start_time TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS end_time   TIMESTAMPTZ;

-- Backfill from the linked slot for any existing rows that are missing times
UPDATE bookings b
SET
  start_time = s.start_time,
  end_time   = s.end_time
FROM availability_slots s
WHERE b.slot_id = s.id
  AND (b.start_time IS NULL OR b.end_time IS NULL);
