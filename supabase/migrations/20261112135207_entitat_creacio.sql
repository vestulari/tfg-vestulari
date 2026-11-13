-- Gènere dels perfils
create type public.genere_perfil as enum ('masculi', 'femeni', 'altres');

-- Els perfils bàsics tenen nom, edat i gènere
alter table public.perfils
  add column edat smallint check (edat between 0 and 120),
  add column genere public.genere_perfil;

-- La data de creació de l'entitat és la de fundació (només l'any és obligatori).
-- La data tècnica de registre passa a dir-se registrada_el.
alter table public.entitats rename column data_creacio to registrada_el;

alter table public.entitats
  add column any_creacio smallint,
  add column mes_creacio smallint,
  add column dia_creacio smallint;

-- Les entitats de prova que ja existeixen agafen l'any del seu registre
update public.entitats
set any_creacio = extract(year from registrada_el)::smallint
where any_creacio is null;

alter table public.entitats
  alter column any_creacio set not null,
  add constraint entitats_any_ck     check (any_creacio between 1000 and 9999),
  add constraint entitats_mes_ck     check (mes_creacio between 1 and 12),
  add constraint entitats_dia_ck     check (dia_creacio between 1 and 31),
  add constraint entitats_dia_mes_ck check (dia_creacio is null or mes_creacio is not null);