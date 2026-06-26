-- Migration to add rescuer_type and reporter fields, and create surgeries table

-- Add rescuer_type column to animals (enum)
ALTER TABLE animals ADD COLUMN IF NOT EXISTS rescuer_type text CHECK (rescuer_type IN ('Rescued Animal', 'Animal Bought by Reporter'));

-- Add reporter details columns (required when rescuer_type = 'Animal Bought by Reporter')
ALTER TABLE animals ADD COLUMN IF NOT EXISTS reporter_name text;
ALTER TABLE animals ADD COLUMN IF NOT EXISTS reporter_address text;
ALTER TABLE animals ADD COLUMN IF NOT EXISTS reporter_phone text;
ALTER TABLE animals ADD COLUMN IF NOT EXISTS reporter_photo_url text;
ALTER TABLE animals ADD COLUMN IF NOT EXISTS reporter_aadhaar_url text;

-- Create surgeries table
CREATE TABLE IF NOT EXISTS surgeries (
  id uuid PRIMARY KEY default gen_random_uuid(),
  animal_id uuid REFERENCES animals(id) ON DELETE CASCADE,
  surgery_name text NOT NULL,
  surgeon_name text,
  surgery_date date DEFAULT current_date,
  notes text,
  created_at timestamp default now()
);
