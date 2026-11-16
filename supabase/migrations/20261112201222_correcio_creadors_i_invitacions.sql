
-- Si s'esborra el creador, les entitats i les peces de roba es conserven sense creador.
alter table public.entitats
  alter column creada_per drop not null,
  drop constraint entitats_creada_per_fkey,
  add constraint entitats_creada_per_fkey
    foreign key (creada_per) references public.usuaris (id) on delete set null;

alter table public.peces_roba
  alter column creada_per drop not null,
  drop constraint peces_roba_creada_per_fkey,
  add constraint peces_roba_creada_per_fkey
    foreign key (creada_per) references public.administradors (perfil_id) on delete set null;

-- Les invitacions que hi havia eren de prova
delete from public.invitacions;

-- El perfil passa a ser una columna de la invitació (la clau forana s'afegeix al final)
drop table public.invitacio_perfils;
alter table public.invitacions
  add column perfil_id integer not null;
create index on public.invitacions (perfil_id);

-- Fora l'estat reenviada. L'índex que el fa servir s'ha de treure abans de canviar el tipus.
drop index public.invitacions_una_pendent_uq;
alter type public.estat_invitacio rename to estat_invitacio_vell;
create type public.estat_invitacio as enum ('rebuda', 'rebutjada', 'acceptada');
alter table public.invitacions
  alter column estat drop default,
  alter column estat type public.estat_invitacio using estat::text::public.estat_invitacio,
  alter column estat set default 'rebuda';
drop type public.estat_invitacio_vell;

-- Índexs de seguretat, per si arriben dues peticions alhora (les regles es controlen al backend):
-- Una sola invitació pendent per usuari i entitat
create unique index invitacions_una_pendent_uq
  on public.invitacions (usuari_id, entitat_id)
  where usuari_id is not null and estat = 'rebuda';

-- Com a molt una invitació enviada o acceptada per entitat, perfil i usuari
create unique index invitacions_activa_uq
  on public.invitacions (entitat_id, perfil_id, usuari_id)
  where usuari_id is not null and estat in ('rebuda', 'acceptada');

-- Una invitació només pot oferir un perfil de la seva mateixa entitat.
-- Per fer-ho amb una clau forana, (id, entitat_id) ha de ser únic a perfils (ja ho és, perquè id és la clau primària).

alter table public.perfils
  add constraint perfils_id_entitat_uq unique (id, entitat_id);

alter table public.invitacions
  add constraint invitacions_perfil_entitat_fkey
    foreign key (perfil_id, entitat_id) references public.perfils (id, entitat_id) on delete cascade;
