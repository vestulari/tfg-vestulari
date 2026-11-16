create type public.estat_invitacio as enum ('pendent', 'acceptada', 'rebutjada');

-- Una invitació ofereix a un correu ocupar un perfil (encara sense usuari) d'una entitat
create table public.invitacions (
  id         integer generated always as identity primary key,
  entitat_id integer not null references public.entitats (id) on delete cascade,
  perfil_id  integer not null references public.perfils (id) on delete cascade,
  email      text not null,
  estat      public.estat_invitacio not null default 'pendent',
  created_at timestamptz not null default now()
);

create index invitacions_email_idx on public.invitacions (lower(email));
create index on public.invitacions (entitat_id);
create index on public.invitacions (perfil_id);

alter table public.invitacions enable row level security;
revoke all on public.invitacions from anon, authenticated;