-- Add reporter_detail_sheet_url for Reporter Details

ALTER TABLE animals ADD COLUMN IF NOT EXISTS reporter_detail_sheet_url text;
