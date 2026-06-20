ALTER TABLE animals ADD COLUMN IF NOT EXISTS requires_vet_attention BOOLEAN DEFAULT true;

-- For existing data, set to false if they have medical records, true otherwise
UPDATE animals
SET requires_vet_attention = NOT EXISTS (
  SELECT 1 FROM medical_records WHERE medical_records.animal_id = animals.id
);
