-- Add LSS Incharge column and chemo category option
alter table animals add column if not exists lss_incharge text;

alter table animals drop constraint if exists animals_category_check;
alter table animals add constraint animals_category_check
  check (category in ('normal','paralysed','blind','neurological','behavioural','senior','disabled','chemo'));
