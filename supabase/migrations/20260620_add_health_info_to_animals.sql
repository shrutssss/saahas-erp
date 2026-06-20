alter table animals add column if not exists health_info jsonb default '{}'::jsonb;
