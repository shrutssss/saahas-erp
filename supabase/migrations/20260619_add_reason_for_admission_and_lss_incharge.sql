-- Migration to add reason_for_admission and ensure lss_incharge columns exist in the animals table
alter table animals add column if not exists reason_for_admission text;
alter table animals add column if not exists lss_incharge text;
