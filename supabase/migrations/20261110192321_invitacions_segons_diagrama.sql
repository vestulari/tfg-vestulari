
drop table if exists public.invitacio_perfils;
drop table if exists public.invitacions cascade;
drop type  if exists public.estat_invitacio;

-- ---------- Enumeració EstatInvitació ----------
create type public.estat_invitacio as enum ('rebuda', 'rebutjada', 'acceptada', 'reenviada');

-- ---------- Invitació ----------
create table public.invitacions (
  id         integer generated always as identity primary key,
  entitat_id integer not null references public.entitats (id) on delete cascade,
  -- Usuari 0..1: el destinatari. Si l'usuari s'esborra, la invitació es conserva sense destinatari.
  usuari_id  uuid references public.usuaris (id) on delete set null,
  data       timestamptz not null default now(),
  estat      public.estat_invitacio not null default 'rebuda'
);

-- Invitació * — * Perfils
create table public.invitacio_perfils (
  invitacio_id integer not null references public.invitacions (id) on delete cascade,
  perfil_id    integer not null references public.perfils (id) on delete cascade,
  primary key (invitacio_id, perfil_id)
);

-- ---------- Regles ----------
-- Una sola invitació pendent per usuari i entitat (les rebutjades no compten)
create unique index invitacions_una_pendent_uq
  on public.invitacions (usuari_id, entitat_id)
  where usuari_id is not null and estat in ('rebuda', 'reenviada');

-- Un usuari només pot tenir un perfil per entitat
create unique index if not exists perfils_entitat_usuari_uq
  on public.perfils (entitat_id, usuari_id)
  where usuari_id is not null;

-- ---------- Índexs ----------
create index on public.invitacions (usuari_id);
create index on public.invitacions (entitat_id);
create index on public.invitacio_perfils (perfil_id);

-- ---------- Seguretat: RLS sense polítiques i sense permisos públics ----------
alter table public.invitacions       enable row level security;
alter table public.invitacio_perfils enable row level security;

revoke all on public.invitacions       from anon, authenticated;
revoke all on public.invitacio_perfils from anon, authenticated;