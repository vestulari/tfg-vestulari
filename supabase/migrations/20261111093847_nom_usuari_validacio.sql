-- Canviar lògica d'inici de sessió, per posar el nom
create or replace function public.crea_usuari_des_d_auth()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.usuaris (id, nom)
  values (
    new.id,
    coalesce(
      nullif(new.raw_user_meta_data ->> 'full_name', ''),
      nullif(new.raw_user_meta_data ->> 'name', ''),
      nullif(split_part(new.email, '@', 1), ''),
      'Usuari'
    )
  );
  return new;
end;
$$;