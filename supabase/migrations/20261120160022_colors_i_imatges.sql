-- Foto de les peces de roba. Com a les entitats, es guarda la clau de l'objecte a l'R2 (no la URL).
alter table public.peces_roba add column imatge_clau text;

-- Paleta de colors del vestuari de cada entitat. Els atributs de tipus color de les peces guarden
-- l'id del color, així si es reanomena o se'n canvia el to, totes les peces s'actualitzen.
-- Les entitats noves la reben en crear-se (des de l'API).
create table public.colors_vestuari (
  id         integer generated always as identity primary key,
  entitat_id integer not null references public.entitats (id) on delete cascade,
  nom        text not null,
  hex        char(7) not null check (hex ~ '^#[0-9A-F]{6}$'),   -- #RRGGBB, en majúscules
  unique (entitat_id, nom)
);

-- Com totes les taules: RLS sense polítiques i sense permisos públics (només s'hi accedeix des de l'API)
alter table public.colors_vestuari enable row level security;
revoke all on public.colors_vestuari from anon, authenticated;
