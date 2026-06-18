-- Add reporter and initial medical assessment to observation logs
alter table observation_logs add column if not exists reporter text;
alter table observation_logs add column if not exists initial_medical_assessment text;
