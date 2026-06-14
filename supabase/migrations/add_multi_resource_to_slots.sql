-- Allow a slot to be assigned to staff, a location, AND equipment simultaneously.
-- Previously only a single resource_id was supported.
ALTER TABLE availability_slots
  ADD COLUMN IF NOT EXISTS staff_id     UUID REFERENCES resources(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS location_id  UUID REFERENCES resources(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS equipment_id UUID REFERENCES resources(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_availability_slots_staff_id     ON availability_slots(staff_id);
CREATE INDEX IF NOT EXISTS idx_availability_slots_location_id  ON availability_slots(location_id);
CREATE INDEX IF NOT EXISTS idx_availability_slots_equipment_id ON availability_slots(equipment_id);
