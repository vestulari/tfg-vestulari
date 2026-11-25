-- La data d'estrena d'un espectacle és com la data de creació d'una entitat: només l'any és obligatori.
-- I les escenes d'un espectacle tenen un ordre, i ja no tenen descripció (només nom).

-- ---------- Data d'estrena ----------
alter table public.espectacles
  add column any_estrena smallint,
  add column mes_estrena smallint,
  add column dia_estrena smallint;

-- Els espectacles que ja hi hagués agafen la data que tenien (o l'any actual si no en tenien)
update public.espectacles
set any_estrena = coalesce(extract(year from data_estrena), extract(year from now()))::smallint,
    mes_estrena = extract(month from data_estrena)::smallint,
    dia_estrena = extract(day from data_estrena)::smallint;

alter table public.espectacles
  drop column data_estrena,
  alter column any_estrena set not null,
  add constraint espectacles_any_ck     check (any_estrena between 1000 and 9999),
  add constraint espectacles_mes_ck     check (mes_estrena between 1 and 12),
  add constraint espectacles_dia_ck     check (dia_estrena between 1 and 31),
  add constraint espectacles_dia_mes_ck check (dia_estrena is null or mes_estrena is not null);

-- ---------- Ordre de les escenes ----------
alter table public.escenes add column ordre integer;

-- Les escenes que ja hi hagués queden en l'ordre en què es van crear
update public.escenes e
set ordre = o.n
from (select id, row_number() over (partition by espectacle_id order by id) as n from public.escenes) o
where o.id = e.id;

alter table public.escenes alter column ordre set not null;

-- ---------- Les escenes no tenen descripció ----------
alter table public.escenes drop column descripcio;
