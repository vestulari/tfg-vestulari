------------ Enumeracions ----------
create type public.tipus_atribut_perfil as enum ('string', 'integer');
create type public.tipus_atribut_roba   as enum ('string', 'integer', 'color');

------------ Usuaris (extensió de auth.users) ----------
create table public.usuaris (
  id  uuid primary key references auth.users (id) on delete cascade,
  nom text not null
);

------------ Entitats ----------
create table public.entitats (
  id           integer generated always as identity primary key,
  nom          text not null,
  descripcio   text,
  data_creacio timestamptz not null default now(),
  creada_per   uuid not null references public.usuaris (id)          -- Usuari creador!
);

------------ Perfils i especialització {Overlapping, Complete} ----------
create table public.perfils (
  id         integer generated always as identity primary key,
  nom        text not null,
  entitat_id integer not null references public.entitats (id) on delete cascade,   -- De quina entitat és el perfil
  usuari_id  uuid references public.usuaris (id) on delete set null                -- Usuari -> Perfil?
);

-- Un usuari només pot tenir un perfil per entitat
create unique index perfils_entitat_usuari_uq
  on public.perfils (entitat_id, usuari_id)
  where usuari_id is not null;

-- Un perfil pot ser administrador, intèrpret o tots dos.
create table public.administradors (
  perfil_id integer primary key references public.perfils (id) on delete cascade
);

create table public.interprets (
  perfil_id integer primary key references public.perfils (id) on delete cascade
);

-- ---------- Atributs de perfil ----------
create table public.definicions_atribut_perfil (
  id         integer generated always as identity primary key,
  entitat_id integer not null references public.entitats (id) on delete cascade,
  nom        text not null,
  tipus      public.tipus_atribut_perfil not null,
  unique (entitat_id, nom)
);

create table public.valors_atribut_perfil (
  definicio_id integer not null references public.definicions_atribut_perfil (id) on delete cascade,
  perfil_id    integer not null references public.perfils (id) on delete cascade,
  valor        text not null,
  primary key (definicio_id, perfil_id)
);

-- ---------- Roba ----------
create table public.plantilles_roba (
  id         integer generated always as identity primary key,
  entitat_id integer not null references public.entitats (id) on delete cascade,   -- La plantilla és només d'una entitat!
  nom        text not null,
  unique (entitat_id, nom)
);

create table public.definicions_atribut_roba (
  id           integer generated always as identity primary key,
  plantilla_id integer not null references public.plantilles_roba (id) on delete cascade,  -- Les plantille si les definicions
  nom          text not null,
  tipus        public.tipus_atribut_roba not null,
  unique (plantilla_id, nom)
);

create table public.peces_roba (
  id           integer generated always as identity primary key,
  entitat_id   integer not null references public.entitats (id) on delete cascade,  -- Entitat a la que pertany
  plantilla_id integer not null references public.plantilles_roba (id),             -- Tipus de peça
  nom          text not null,
  descripcio   text,
  creada_per   integer not null references public.administradors (perfil_id)        -- Creador
);

create table public.valors_atribut_roba (
  definicio_id integer not null references public.definicions_atribut_roba (id) on delete cascade,
  peca_id      integer not null references public.peces_roba (id) on delete cascade,
  valor        text not null,
  primary key (definicio_id, peca_id)
);

-- ---------- Espectacles ----------
create table public.espectacles (
  id           integer generated always as identity primary key,
  entitat_id   integer not null references public.entitats (id) on delete cascade,
  nom          text not null,
  descripcio   text,
  data_estrena date
);

create table public.escenes (
  id            integer generated always as identity primary key,
  espectacle_id integer not null references public.espectacles (id) on delete cascade,  -- Quin espectacle pertany
  nom           text not null,
  descripcio    text
);

create table public.actuacions (
  id            integer generated always as identity primary key,
  espectacle_id integer not null references public.espectacles (id) on delete cascade,  -- Quin espectacle pertany
  nom           text not null,
  data          timestamptz                                                              -- Ens interesa nomes data!
);

-- Participacions
create table public.actuacio_interprets (
  actuacio_id  integer not null references public.actuacions (id) on delete cascade,
  interpret_id integer not null references public.interprets (perfil_id) on delete cascade,
  primary key (actuacio_id, interpret_id)
);

-- Representació: una escena dins d'una actuació
create table public.representacions (
  id          integer generated always as identity primary key,
  actuacio_id integer not null references public.actuacions (id) on delete cascade,
  escena_id   integer not null references public.escenes (id) on delete cascade,
  unique (actuacio_id, escena_id)
);

-- On actua l'intèrpret
create table public.actua_a (
  id               integer generated always as identity primary key,
  representacio_id integer not null references public.representacions (id) on delete cascade,
  interpret_id     integer not null references public.interprets (perfil_id) on delete cascade,
  posicio_x        integer not null,
  posicio_y        integer not null
);

-- ---------- Figurins ----------
-- Quin figurí porta la persona uqe actua
create table public.figuris (
  id         integer generated always as identity primary key,
  actua_a_id integer not null unique references public.actua_a (id) on delete cascade,
  descripcio text
);

-- Quines peces conformen el figurí
create table public.figuri_peces (
  figuri_id integer not null references public.figuris (id) on delete cascade,
  peca_id   integer not null references public.peces_roba (id) on delete cascade,
  primary key (figuri_id, peca_id)
);

-- ---------- Comentaris ----------
create table public.comentaris (
  id          integer generated always as identity primary key,
  figuri_id   integer not null references public.figuris (id) on delete cascade,   -- De quin figurí és el comentari
  perfil_id   integer not null references public.perfils (id) on delete cascade,   -- Perfil creador
  resposta_a  integer references public.comentaris (id) on delete cascade,         -- És una respsota? A qui?
  cos         text not null,
  data        timestamptz not null default now()
);

-- ---------- Índexs de claus foranes ----------
create index on public.entitats (creada_per);
create index on public.perfils (entitat_id);
create index on public.perfils (usuari_id);
create index on public.valors_atribut_perfil (perfil_id);
create index on public.peces_roba (entitat_id);
create index on public.peces_roba (plantilla_id);
create index on public.peces_roba (creada_per);
create index on public.valors_atribut_roba (peca_id);
create index on public.espectacles (entitat_id);
create index on public.escenes (espectacle_id);
create index on public.actuacions (espectacle_id);
create index on public.actuacio_interprets (interpret_id);
create index on public.representacions (escena_id);
create index on public.actua_a (representacio_id);
create index on public.actua_a (interpret_id);
create index on public.figuri_peces (peca_id);
create index on public.comentaris (figuri_id);
create index on public.comentaris (perfil_id);
create index on public.comentaris (resposta_a);

-- ---------- Crear la fila d'usuari quan algú es registra a Supabase Auth ----------
create function public.crea_usuari_des_d_auth()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.usuaris (id, nom)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name',
             new.raw_user_meta_data ->> 'name',
             new.email,
             '')
  );
  return new;
end;
$$;

revoke execute on function public.crea_usuari_des_d_auth() from public, anon, authenticated;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.crea_usuari_des_d_auth();

-- Usuaris que ja existien abans
insert into public.usuaris (id, nom)
select id,
       coalesce(raw_user_meta_data ->> 'full_name',
                raw_user_meta_data ->> 'name',
                email,
                '')
from auth.users
on conflict (id) do nothing;

-- ---------- Seguretat: RLS sense polítiques i sense permisos públics ----------
do $$
declare t record;
begin
  for t in select tablename from pg_tables where schemaname = 'public' loop
    execute format('alter table public.%I enable row level security', t.tablename);
    execute format('revoke all on public.%I from anon, authenticated', t.tablename);
  end loop;
end
$$;

-- Les taules futures tampoc donaran permisos a anon/authenticated per defecte
alter default privileges in schema public revoke all on tables from anon, authenticated;
alter default privileges in schema public revoke all on sequences from anon, authenticated;